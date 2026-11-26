# 插件开发（Plugin Development）

[← 返回目录](./README.md) | ← 上一篇：[插件安装与配置](./07-plugin-install.md) | 下一篇：[迁移与故障排查附录](./09-migration-faq.md) →

> 目标：从零开发一个最小元素插件（含设计器 UI、数据绑定、渲染与语言资源），在本地宿主加载验证，再发布到 npm / 收录到市场。
> 前置：[01](./01-getting-started.md) → [07](./07-plugin-install.md)。官方样板（唯一源码真源）：`marketplace/plugins/echarts/`。

## 1. 前置条件（Prerequisites）

- 理解 [07](./07-plugin-install.md) 的插件安装/加载机制（入口副作用模块、`plugins.json`、语言资源同步）。
- 已安装 `@worm-print-platform/core` 与 `@worm-print-platform/plugin-kit`（同版本，当前 1.6.6）；打包器能把它们 external 掉。
- 一个可加载插件的宿主工程（见 [07 §2.4](./07-plugin-install.md#24-宿主加载host-loading)）。

## 2. 术语与四个 id（Terminology）

一个插件同时涉及四类标识，混用是最高频错误：

| 概念 | 例子 | 出现在哪 |
| --- | --- | --- |
| **插件逻辑 id**（namespace id） | `echarts` | `wormPrint.id`、`ElementUI.i18nId`、语言包顶层命名空间、core 注册表 id、模板 `plugins` 声明 |
| **npm 包名** | `@worm-print-platform/plugin-echarts` | `package.json.name`、`plugins.json.npmName`、市场索引 `npmName` |
| **元素类型 type** | `barChart`、`lineChart` | `kinds[].type`、`ElementUI.types`、模板元素 `type` |
| **i18n 命名空间** | `echarts` | 语言包顶层键与键前缀（`<id>.<语义键>`），等于插件逻辑 id |
| **市场唯一标识 uniqueId** | `worm-echarts` | 市场索引 `uniqueId`、插件 `plugin.json.uniqueId` |

> 关键：`i18nId = wormPrint.id = 语言包顶层命名空间 = 逻辑 id`；npm 包名是另一回事。模板 JSON 顶层 `plugins` 声明用的是**逻辑 id**（如 `echarts`），写成 npm 包名会被契约校验判为 `MISSING_PLUGIN`。
>
> `uniqueId` 是第五个标识：跨市场、跨作者的全局唯一标识（`作者代号-插件名`，如 `worm-echarts`），**不等于逻辑 id，也不等于 i18n 命名空间**。存量插件逻辑 id 不变，模板零改动。详见 [插件市场规范](../plugin-market-spec.md)。

## 3. 契约（Contracts）

### 3.1 元素插件描述符（core：`@worm-print-platform/core/designer`）

```ts
import { defineElementPlugin, registerElementPlugin } from '@worm-print-platform/core/designer'

const dispose = registerElementPlugin(defineElementPlugin({
  id: 'myplugin',                 // 逻辑 id，写入模板 plugins 清单
  version: '1.0.0',
  kinds: [{ type: 'myElement', label: '我的元素' /* 可含 icon/defaultOptions/optionMeta/binding/render/designer 等 */ }],
  // 插件级 binding/render/designer 为默认值，kind 级可逐项覆盖
}))
```

`defineElementPlugin` 的 `PrintElementPlugin` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string`（必填） | 插件唯一 id，写入模板 `plugins`；重复注册按 id 覆盖 |
| `version` | `string`（必填） | 语义版本，用于执行器 bundle 幂等去重与 strict 校验 |
| `kinds` | `ElementPluginKind[]`（必填，非空） | 该插件提供的元素类型；同插件内 `type` 不可重复 |
| `legacyAliases` | `Record<string,string>` | 旧 API 名 → 新通用名映射 |
| `binding` | `{ bind(options, data) }` | 数据绑定（插件级默认，kind 可覆盖） |
| `render` | `ElementPluginRender` | 渲染契约（见下表） |
| `designer` | `ElementPluginDesigner` | 设计器默认能力（画布组件/素材卡/属性 tab） |

`ElementPluginKind` 常用字段：`type` / `label`（必填）、`icon`、`fixedHeight`（固定高，禁 autoHeight）、`blocked`（禁 AI 生成）、`capabilities`（能力位）、`defaultOptions(partial?)`、`optionMeta`（属性元数据）、`requiredOptionKeys`、`notes`，以及 kind 级 `binding` / `render` / `designer` 覆盖。

`ElementPluginRender` 三个可选钩子（`render/types.ts`）：

| 钩子 | 签名 | 用途 |
| --- | --- | --- |
| `html` | `(spec: ElementRenderSpec) => string` | 生成元素内联 HTML/SVG，由主体统一分派 |
| `createRenderer` | `() => ElementRenderer` | 进程内同步出图（浏览器预览） |
| `executorBundle` | `() => { name, version, code }` | 页面注入 IIFE（服务端 PDF / Electron 静默打印），按 name+version 幂等去重 |

`registerElementPlugin` 返回注销句柄；注册表挂在 `globalThis` 的 `Symbol.for('worm-print-platform.element-plugin-registry.v1')`，跨副本单实例。

### 3.2 设计器 UI 契约（plugin-kit：`@worm-print-platform/plugin-kit`）

```ts
import { defineElementUI, registerElementUI } from '@worm-print-platform/plugin-kit'
import type { PluginLocaleMessages } from '@worm-print-platform/core/i18n'

const zh: PluginLocaleMessages<'myplugin'> = { 'myplugin.title': '我的插件' }

registerElementUI(defineElementUI({
  types: ['myElement'],                    // 必须与 core 注册表的 kind.type 对齐
  renderCanvas(ctx) {
    return `<div>${ctx.t?.('myplugin.title') ?? '我的插件'}</div>`  // ctx.t 渲染时取词，不在模块加载期求值
  },
  renderProperty(ctx) {
    return `<button id="mp-set">设置标题</button>`                  // 返回字符串或 DOM 节点
    // 实际插件在此绑定事件，点击时调用 ctx.update({ 你的属性键: 值 })
  },
  hasProperties: () => true,
  i18nId: 'myplugin',                       // 命名空间 = 键前缀
  locales: { 'zh-CN': zh },
}))
```

`ElementUI` 字段：`types`（必填）、`renderCanvas(ctx)`（必填）、`renderProperty?(ctx)`、`hasProperties?(element)`、`group`、`searchKeywords`、`styles`、`i18nId`、`locales`。

渲染上下文（`ctx`）：

| 上下文 | 字段 |
| --- | --- |
| `renderCanvas(ctx)` | `element: RuntimeElement`、`data?: readonly Record<string,unknown>[]`（数组信封，`data[0]` 是数据根）、`designMode?: boolean`、`t?: Translate` |
| `renderProperty(ctx)` | `element`、`data?`、`fields?: PrintBusinessField[]`（宿主业务字段，可据此生成数据源/类目/数值下拉）、`update(partial)`（写回 `element.options` 并记历史）、`repaint()`（仅重绘，不写数据）、`t?` |

渲染结果 `ElementUIRenderResult` = 字符串 / DOM 节点 / `{ node, dispose? }`（`dispose` 在重绘/卸载时释放监听与图表实例）。

### 3.3 导出插件（core：契约已落地，宿主菜单未实现）

```ts
import { defineExportPlugin, registerExportPlugin } from '@worm-print-platform/core'

registerExportPlugin(defineExportPlugin({
  id: 'plugin-excel',
  version: '1.0.0',
  formats: ['xlsx'],
  async export(input, options) {
    // input: { pages（渲染后分页 HTML 与纸型）, template, printData }
    // 由插件把 HTML 表格/排版转成结构化数据并生成文件
    return { filename: '报表.xlsx', blob: new Blob([/* 真实内容 */], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) }
  },
}))
```

> **现状说明（务必看清）**：导出插件的**注册契约已实现**（`export-plugin-registry.ts` 用 `Symbol.for` 落地），但 markets 中所有 `exportFormats` 为空，**宿主侧导出菜单/入口尚未实现**（见 `docs/proposals/README.md` 与 `05-export-plugins.html`，属待增功能 P2）。因此现在写导出插件只能完成「注册 + 编程式调用 `export()`」，**不要对外承诺「宿主 UI 自动生成导出菜单」**。

### 3.4 包协议字段对照（Package Schemas）

四个 JSON 各司其职，字段结构并不相同：

| 文件 | 作用 | 关键字段 |
| --- | --- | --- |
| `package.json#wormPrint` | npm 包自声明，语言 CLI 发现资源靠它 | `id`、`version`、`entry`、`kinds`（字符串数组）、`exportFormats`、`peerDeps`（**对象**，如 `{ "@worm-print-platform/core": "^1.6.6" }`）、`i18n: { dir, base }` |
| `plugin.json` | 插件目录内的元数据（市场安装读取） | `id`、`version`、`name`、`npmName`、`entry`、`kinds`（可为 `{ type, label }[]`）、`exportFormats`、`peerDeps`（对象）、`files`（发布/安装所需文件清单） |
| `marketplace.json` | 仓库市场索引条目 | `id`、`name`、`description`、`version`、`npmName`、`path`、`entry`、`kinds`（字符串数组）、`exportFormats`、`homepage`、`license`、`minCoreVersion` |
| `plugins.json` | 安装后宿主清单（CLI 生成，勿手改） | `schemaVersion`、`plugins[id]: { version, entry, kinds, exportFormats, npmName, source, stable, installedAt, i18n }` |

> 不要假设「plugin.json 字段与索引条目一致」——索引多了 `path/homepage/license/minCoreVersion`，插件包的 `kinds` 还能带 `label`。以真实市场插件 `marketplace/plugins/echarts/{package,plugin}.json` 与 `marketplace/marketplace.json` 为准。

### 3.5 语言资源契约（i18n）

插件**必须提供 `zh-CN`**，`en-US` / `th-TH` 可选：

```
src/i18n/<locale>.json      { "<插件 id>": { "<插件 id>.<语义键>": "译文" } }
dist/i18n/<locale>.json     构建脚本复制（如 scripts/gen-i18n-dist.mjs）；npm files 需包含 dist
```

- 顶层是插件命名空间（= 逻辑 id），第二层是扁平点号键（键以插件 id 为前缀），值为字符串；不允许 `_meta` 或嵌套。
- **两种结构的区别（容易踩坑）**：磁盘 JSON（真源与 `dist/i18n/*.json`）是**嵌套**结构 `{ "<id>": { "<id>.<键>": "译文" } }`；代码里 `ElementUI.locales` 是**扁平**对象 `{ "<id>.<键>": "译文" }`。二者「译文内容一致，结构不同」——从 JSON 取 `json['<id>']` 这一层传给 `locales`。
- `i18nId = wormPrint.id = JSON 顶层命名空间 = 模板 plugins 声明 id`。
- `registerElementUI()` 对每个 locale 调 `registerPluginMessages(locale, pluginId, messages)`（强校验键前缀），并加入检索链。
- **不要在模块加载期把译文求值成常量**：控件文本用 `ctx.t` 或 `t()`（渲染时取词），导出常量存 key，用 getter 取词。否则会出现裸 key（见 [06 §3.5](./06-i18n.md#35-排错与已知限制)）。
- 宿主可用 `worm-print-i18n template` 导出包含插件键的**扁平**骨架供 `validate --strict` 校验；`validate` 针对的是宿主语言包骨架，不要把插件的嵌套真源 JSON 直接喂给 `validate`（会因「值必须是字符串/多余键」而失败）。市场安装会把资源同步到 `.worm-print/i18n/<id>/`。

### 3.6 dist 产物口径

- 插件入口文件（如 `dist/index.js`、`dist/marketplace.js`）**入库并提交**，保证安装即可 import。
- `dist/i18n/*.json` 由构建脚本（如 `scripts/gen-i18n-dist.mjs`）从 `src/i18n/*.json` **构建生成**，不手改。最小实现就是把源文件原样复制一层：

  ```bash
  mkdir -p dist/i18n && cp src/i18n/*.json dist/i18n/
  ```

- 单文件 ESM；打包时 external 仅 `@worm-print-platform/core`、`@worm-print-platform/plugin-kit`（含子路径），其余依赖内联（或列入 peerDeps 由宿主安装）。

## 4. 步骤：从零开发最小插件

### 4.1 建目录与元数据

```
myplugin/
  package.json          # 含 wormPrint 元数据
  plugin.json           # 市场安装元数据
  src/
    index.ts            # 元素插件注册（core）
    ui.ts               # 设计器 UI（plugin-kit）
    marketplace.ts      # 副作用入口：import './index'; import './ui'
    i18n/zh-CN.json     # 语言资源真源
  dist/                 # 构建产物（入口入库，i18n 构建生成）
```

### 4.2 构建（输出可加载的 ESM）

文档不绑定具体打包器；下面给出 esbuild 最小命令（用你项目已有的 tsup/vite/rollup 等价配置亦可）：

```bash
# cwd = myplugin/
npx esbuild src/marketplace.ts --bundle --format=esm \
  --outfile=dist/marketplace.js \
  --external:@worm-print-platform/core --external:@worm-print-platform/core/* \
  --external:@worm-print-platform/plugin-kit --external:@worm-print-platform/plugin-kit/*
# 语言资源：复制源 JSON 到 dist（任选一种即可）
mkdir -p dist/i18n && cp src/i18n/*.json dist/i18n/
# 若插件 UI 依赖 DOM，还需把 src/ui.ts 单独打包出 dist/ui.js（同上 external 参数）
```

### 4.3 本地加载验证（不发布即可调试）

按 [07 §2.4](./07-plugin-install.md#24-宿主加载host-loading)，在宿主工程入口 import 你插件的本地 `dist/marketplace.js`，并对 core/plugin-kit 做 alias/dedupe 指到同一份构建产物：

```js
// 宿主 src/main.js（绝对路径或相对路径按实际调整）
import '/abs/path/to/myplugin/dist/marketplace.js'
```

程序化自检（**Node 环境即可**；仅当你的 UI 代码依赖 DOM 时才需要 happy-dom）：

```js
import { getElementPlugins, getElementPluginTypes } from '@worm-print-platform/core/designer'
import { getElementUI } from '@worm-print-platform/plugin-kit'
await import('/abs/path/to/myplugin/dist/marketplace.js')
console.log(getElementPluginTypes())   // 字符串数组，应含 'myElement'
console.log(getElementPlugins())       // 插件描述符数组，应含 id='myplugin'
console.log(getElementUI('myElement')) // 应为注册的对象
```

> `getElementPluginTypes()` 返回去重后的 type 字符串数组；`getElementPlugins()` 返回插件描述符数组；`getElementUI(type)` 返回该 type 的 UI 解析对象。三者用途不同，自检时都看一眼最稳妥。

页面现象：设计器素材区出现「我的元素」，拖到画布能渲染，属性面板可编辑并不报错。

### 4.4 收录与发版

1. 在本仓 `marketplace/plugins/<id>/` 开发，更新 `marketplace/marketplace.json` 索引条目，走 PR 审核。
2. 发版时同步三处版本：`marketplace.json`、`plugin.json`、`package.json`（含 `wormPrint.version`）。
3. 维护者 `npm publish` 插件包；在本仓打 tag `plugins/<id>/vX.Y.Z` 供 GitHub / Gitee 源解析。
4. 兼容性包（如 `@worm-print-platform/echarts`）由同一源码的构建脚本同步生成，README 为同一份市场口径文档，不要双写。

## 5. 验证（Verification）

- `npx esbuild ...` 构建成功，产出 `dist/marketplace.js`。
- 程序化自检打印出注册的 type 与 UI；构建宿主工程通过。
- 设计器出现该元素，画布渲染 + 属性编辑 + 语言切换（切到 `zh-CN` 外的语言看是否走 `ctx.t`）均正常。
- 宿主语言包骨架（由 `worm-print-i18n template` 生成、已合入插件键）`validate --strict` 通过（[06 §3.2.3](./06-i18n.md#323-校验)），键前缀与 `i18nId` 一致。注意 `validate` 针对扁平骨架，不要直接喂插件的嵌套真源 JSON（见 §3.5）。

## 6. 排错（Troubleshooting）

| 症状 | 原因 / 处理 |
| --- | --- |
| 设计器出现裸 key（如 `myplugin.title`） | 译文在模块加载期被求值成常量，或没用 `ctx.t`；改为渲染时取词，并确认 `i18nId` 与键前缀一致 |
| 模板被判 `MISSING_PLUGIN` | 模板 `plugins` 声明用了 npm 包名；应填插件逻辑 id（见 §2） |
| 注册了但设计器看不到元素 | `ElementUI.types` 与 core 的 `kind.type` 不一致；或入口没在宿主 `main.js` import；或 core/plugin-kit 多副本未 dedupe |
| 宿主声称“导出菜单不出现” | 这是已知未实现功能（§3.3），不是你的插件问题；用编程式调用验证 `export()` |
| dist 找不到 i18n JSON | 构建脚本未复制 `src/i18n` 到 `dist/i18n`；检查 `scripts/gen-i18n-dist.mjs` 与 npm `files` |

## 7. 信任边界（Trust Boundary）

市场不做沙箱。信任来自 PR 审核 + npm 版本锁定；插件代码在宿主进程内运行，等同于普通 npm 依赖。

## 8. AI 工具集成提示词（场景差异）

通用门控/安装/验收模板见 [01 §5](./01-getting-started.md#5-ai-提示词模板唯一模板源)，本场景额外约束：

```text
【任务】从零开发一个最小元素插件并在本地设计器加载验证。
- 先读 08 §3 契约表：PrintElementPlugin/ElementPluginKind/ElementPluginRender、
  ElementUI 的 renderCanvas/renderProperty ctx 签名、四个 JSON 的字段对照、术语（逻辑 id/npm 包名/type/i18nId）。
- 只使用契约表列出的字段与 API，不臆测 prop/事件/字段名；不虚构脚手架命令。
- 元素插件与导出插件分开写；导出插件只承诺注册 + 编程式调用，不承诺宿主菜单（未实现）。
- 语言资源必须含 zh-CN，键前缀 = i18nId = wormPrint.id；译文用 ctx.t 渲染时取词。
- 构建时 external core/plugin-kit（含子路径）；本地 import dist/marketplace.js 验证注册。
【验收】构建成功；getElementPluginTypes()/getElementUI() 命中；设计器出现元素、可渲染/编辑/切语言；
不虚构 API（无宿主导出菜单，无 setTemplateMeta/back）。
```

[← 返回目录](./README.md) | ← 上一篇：[插件安装与配置](./07-plugin-install.md) | 下一篇：[迁移与故障排查附录](./09-migration-faq.md) →
