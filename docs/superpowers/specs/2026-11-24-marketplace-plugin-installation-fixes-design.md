# 插件市场安装与 ECharts 6 集成异常修复设计

> 设计日期：2026-11-24
>
> 状态：设计稿，待批准；本轮只产出异常总结与修复方案，不修改实现。
>
> 触发来源：宿主项目将打印平台升级至 1.6.3、安装全部官方市场插件时的真实构建、安装与定向测试记录。

## 1. 意图与背景

本次升级暴露的问题分为三层：

1. **插件打包缺陷**：市场安装器按 `plugin.json.files` 白名单复制文件，`data-preview` 的白名单漏掉入口运行时依赖，安装成功但导入失败。
2. **市场安装器缺陷**：`--force` 覆盖不清空旧目录，与文档承诺的“升级不留旧文件”不一致；官方插件缺少可复现的 Git 分发标签与产物入库门禁。
3. **插件运行时缺陷**：`echarts` 在语言资源注册前求值 `t()`，产生 7 条缺键警告，并把标签固定成原始 key。

另有 3 项宿主集成问题：通用 `dist` 忽略规则吞掉市场产物、Vite 预构建路径多退一级、ECharts 6 在 happy-dom 中触发真实 Canvas 异步异常。它们不属于打印平台核心缺陷，但应由官方文档和示例明确规避。

## 2. 目标 / 非目标 / 反目标

### 目标

- G1：`data-preview` 通过市场 CLI 安装后，入口及其全部相对依赖可直接导入。
- G2：`--force` 升级后目标目录只包含当前版本声明文件，不残留旧版本产物。
- G3：`echarts` 市场入口导入时无 i18n 缺键警告，标签随 locale 正确切换。
- G4：官方插件发布具备可复现门禁：产物入库、元数据一致、Git 标签可解析。
- G5：官方安装文档补齐 `.gitignore`、Vite 与 ECharts 6 测试边界。

### 非目标

- 不改变插件 id、模板 `plugins` 契约、i18n 命名空间或十类图表类型。
- 不重新发布 `@worm-print-platform/plugin-echarts` / `plugin-data-preview` 到 npm。
- 不把 `data-preview@0.1.0` 强行改成 `1.6.3`；它按上游独立版本演进。
- 不修复该宿主项目的 137 条存量 TypeScript 诊断。
- 不引入新的插件运行时依赖。

### 反目标

- 用“调整 import 顺序”掩盖 `echarts` 模块加载期求值问题，导致 Node 入口或兼容包仍复发。
- 用 `rm -rf` 直接清空旧插件目录，造成升级失败时原版本不可用。
- 为安装器增加复杂的静态 import 图分析，却放过官方插件自身的打包契约测试。
- 为追求仓库干净而继续忽略市场运行产物，导致全新克隆无法加载插件。

## 3. 约束与已定决策

| 编号 | 决策 | 来源 |
| --- | --- | --- |
| D1 | 市场安装继续按 `plugin.json.files` 白名单复制，不改成无差别复制整个插件目录 | 既有安装契约 |
| D2 | `data-preview` 白名单改为整个 `dist`；`echarts` 保持独立 bundle 最小白名单 | 入口依赖实证 |
| D3 | `--force` 采用临时目录暂存 + 原子切换，不直接覆盖旧目录 | 可靠性要求 |
| D4 | `echarts` 翻译改为惰性 getter / 工厂函数，不依赖注册顺序 | 多入口一致性 |
| D5 | 修订 2026-11-23“不打插件 tag”的临时决策，发布 `plugins/<id>/vX.Y.Z` 标签 | 本次不可复现安装问题 |
| D6 | 发布门禁校验产物已被 Git 跟踪，避免只校验工作区文件存在 | Git 稀疏检出只拿跟踪文件 |
| D7 | 宿主侧问题以官方文档、demo 和测试模板修复，不改打印平台核心 API | 职责边界 |
| D8 | 先写失败测试，再实施修复；只跑受影响 workspace 的定向测试 | TDD 与项目测试最小化原则 |

## 4. 异常总览

| 编号 | 级别 | 归属 | 现象 | 影响 |
| --- | --- | --- | --- | --- |
| A-01 | P0 | 插件打包 | `data-preview` 安装后缺 `ui.js` / `describe.js` / `types.js` | 市场入口导入直接失败 |
| A-02 | P1 | 安装器 | `--force` 不清旧目录，缩小白名单后旧文件仍残留 | 升级结果不纯净，文档与实现不一致 |
| A-03 | P1 | echarts 运行时 | 导入市场入口出现 7 条 i18n 缺键警告，标签被固定为原始 key | 控制台噪声，属性元数据与分组名错误 |
| A-04 | P1 | 发布链路 | 官方插件未发 npm、无插件 tag、`data-preview/dist` 未入库 | 无法按版本稳定安装，只能本地构建回退 |
| A-05 | P2 | 宿主集成 | 通用 `dist` 忽略规则吞掉 `.worm-print/plugins/*/dist` | 全新克隆后入口 import 失败 |
| A-06 | P2 | 宿主集成 | `optimizeDeps.include` 使用 `../.worm-print/...` | 相对 Vite root 多退一级，预构建路径错误 |
| A-07 | P2 | 宿主测试 | ECharts 6 在 happy-dom 中异步刷新 null Canvas context | 用例断言通过但进程报未处理异常 |

## 5. 根因与证据

### 5.1 A-01：`data-preview` 白名单漏传依赖

- `marketplace/plugins/data-preview/plugin.json:13` 当前为：
  ```json
  "files": ["dist/index.js", "dist/index.d.ts", "plugin.json", "README.md"]
  ```
- `marketplace/plugins/data-preview/dist/index.js:3-4` 明确引用：
  ```js
  export { openDataPreview, PREVIEW_STYLES } from './ui.js'
  export { describeDataSource } from './describe.js'
  ```
- `packages/marketplace/src/install.ts:185-190` 只复制 `meta.files` 声明项；入口存在性校验只检查 `dist/index.js`，不检查相对依赖闭包。
- 同包 `package.json:16-19` 已正确声明 `"files": ["dist", ...]`，说明是 `plugin.json` 与 npm 打包口径漂移。

### 5.2 A-02：`--force` 覆盖留旧文件

- `packages/marketplace/src/install.ts:249-267` 直接向已存在的 `target` 复制文件，没有清空或暂存。
- `docs/guide/07-plugin-install.md:72` 承诺“先清旧目录再写入，不留已删除语言”，实现只对语言目录做了原子替换，对插件目录并未兑现。
- 本次把 `echarts` 白名单从整个 `dist` 收窄回 `dist/marketplace.js` 后，必须执行 `remove` 再 `install` 才能清掉旧文件。

### 5.3 A-03：翻译早于语言资源注册

- `marketplace/plugins/echarts/src/plugin.ts:29-40` 在模块加载时创建 `CHART_OPTION_META` / `SCATTER_OPTION_META` 并立即调用 `t()`。
- `marketplace/plugins/echarts/src/ui.ts:885-895` 在创建 `CHART_ELEMENT_UI` 时立即求值 `group: t('echarts.panel.group')`。
- 语言资源直到 `packages/plugin-kit/src/registry.ts:89-97` 调用 `registerElementUI()` 才通过 `registerPluginMessages()` 注册。
- 缺键时 `packages/core/src/i18n/engine.ts:57-64` 返回原始 key，因此后续切换 locale 也无法修复已求值的字符串。本次捕获的 7 个键为：`echarts.meta.chartOption`、`echarts.meta.dataSource`、`echarts.meta.categoryField`、`echarts.meta.valueFields`、`echarts.meta.seriesField`、`echarts.meta.bubbleSize`、`echarts.panel.group`。
- `SCATTER_OPTION_META` 还使用对象展开 `...CHART_OPTION_META`；即使给原对象加 getter，展开也会提前求值，修复时必须同时去掉这种复制方式。

### 5.4 A-04：官方插件分发不可复现

- `packages/marketplace/src/install.ts:154-162` 只识别 `refs/tags/plugins/<id>/v*`；`git ls-remote --tags origin 'v1.6.3' 'plugins/*/v*'` 实测只返回 `refs/tags/v1.6.3`，没有任何 `plugins/*/v*` 标签。
- 两个插件均未发布 npm，`auto` 最终回退到默认分支并标记 `stable:false`，无法保证安装内容等于用户指定的 1.6.3 发布点。
- 根 `.gitignore:2` 的 `dist/` 忽略 `marketplace/plugins/data-preview/dist`；`git ls-files marketplace/plugins/data-preview/dist` 为 0，说明 Git 源安装即使找到正确 tag 也仍会缺产物。
- 2026-11-23 的设计曾明确接受“不打插件 tag、不改 tag 策略”，但本次实测证明该限制会让官方插件无法按版本稳定分发，需要正式修订。

### 5.5 A-05：宿主 `.gitignore` 吞掉运行产物

- 宿主的通用 `dist` 规则会匹配任意层级目录，包括 `.worm-print/plugins/<id>/dist`。
- 市场入口由 `src/main.ts` 静态 import，产物被忽略后全新克隆会直接构建失败。
- 官方示例不能继续把整个 `.worm-print/` 当作可删除缓存。

### 5.6 A-06：Vite 预构建路径错误

- 宿主曾在 `optimizeDeps.include` 写 `../.worm-print/plugins/...`。
- Vite root 为 `web/` 时，该路径会解析到 `web/.worm-print` 的上一级；静态入口 import 本身已能被扫描，无需重复声明本地插件路径。本次宿主移除这两项后，首页、`main.ts` 与两个插件入口均返回 HTTP 200。

### 5.7 A-07：ECharts 6 测试环境边界

- ECharts 6 / zrender 6 会在 `setOption()` 后异步刷新 Canvas。
- happy-dom 的 `getContext()` 返回 null，产生 `Cannot set properties of null (setting 'dpr')` 与 `clearRect` 未处理异常。
- 旧温湿度测试只等待固定 200ms，既不断言 `setOption`，也不清理组件，延迟初始化还会串到下一个用例。

## 6. 方案选择

| 问题 | 方案 A | 方案 B | 结论 |
| --- | --- | --- | --- |
| A-01 | 安装器自动解析相对 import 并补文件 | 修正插件白名单 + 打包契约测试 | **B**：安装器保持简单，插件作者对自己的产物闭包负责 |
| A-02 | `--force` 先 `rmSync(target)` | 临时目录暂存后原子切换 | **B**：失败时保留旧版本 |
| A-03 | 市场入口先注册 i18n 再动态 import | 标签改惰性 getter / 工厂 | **B**：覆盖市场、Node、兼容包所有入口 |
| A-04 | CLI 支持根 tag `vX.Y.Z` | 发布插件专用 tag `plugins/<id>/vX.Y.Z` | **B**：沿用现有解析器；`data-preview` 独立版本不会与根版本混淆 |
| A-05 | 文档要求忽略整个 `.worm-print` | 文档给出精确否定规则 | **B**：保证克隆可运行 |
| A-06 | 本地路径加入 `optimizeDeps.include` | 只保留 main 静态 import | **B** 已实测可行 |
| A-07 | 给 happy-dom 补完整 Canvas 桩 | 组件测试 mock `echarts.init` | **B**：测试聚焦业务 option，不模拟渲染器 internals |

## 7. 详细设计

### 7.1 `data-preview` 打包契约

将 `marketplace/plugins/data-preview/plugin.json` 改为：

```json
{
  "files": ["dist", "plugin.json", "README.md"]
}
```

同时新增插件级契约测试：

- 读取 `plugin.json.files`，断言包含 `dist`。
- 扫描 `dist/index.js` 的静态相对 import，断言 `ui.js`、`describe.js` 均存在于安装闭包。
- 在临时目录通过 local 市场源安装 `data-preview`，动态导入安装后的 `dist/index.js`，断言 `openDataPreview` 与 `describeDataSource` 为函数。

### 7.2 `--force` 暂存与原子切换

`installPlugin()` 改为以下顺序：

1. 在 `.worm-print/plugins/` 下创建 `.<id>.tmp-<随机值>` 暂存目录。
2. 向暂存目录复制 `meta.files`，校验入口存在。
3. 将语言资源暂存到 `.worm-print/i18n/.<id>.tmp-<随机值>`，不触碰现行资源。
4. 将现役插件目录改名为 `.<id>.old-<随机值>`，将暂存目录改名为正式目录。
5. 切换语言资源目录，更新 `plugins.json`。
6. 删除备份目录；任一步失败则恢复旧插件目录、旧语言目录和旧清单。

实现要求：

- 暂存目录必须仍位于 `.worm-print/plugins/` 下，确保语言资源路径计算不变。
- 不使用 `rmSync(target)` 作为升级第一步。
- `remove` 行为保持不变；正常安装不存在旧目录时可跳过备份步骤。

### 7.3 `echarts` 惰性翻译

`plugin.ts` 使用工厂函数创建元数据，避免对象展开提前求值：

```ts
function createChartOptionMeta(includeBubble = false) {
  return {
    chartOption: { kind: 'object' as const, get label() { return t('echarts.meta.chartOption') } },
    chartDataSource: { kind: 'text' as const, get label() { return t('echarts.meta.dataSource') } },
    chartCategoryField: { kind: 'text' as const, get label() { return t('echarts.meta.categoryField') } },
    chartValueFields: { kind: 'object' as const, get label() { return t('echarts.meta.valueFields') } },
    chartSeriesField: { kind: 'text' as const, get label() { return t('echarts.meta.seriesField') } },
    ...(includeBubble
      ? { chartBubble: { kind: 'bool' as const, get label() { return t('echarts.meta.bubbleSize') } } }
      : {}),
  }
}
```

`ui.ts` 的 `CHART_ELEMENT_UI` 改为：

```ts
export const CHART_ELEMENT_UI: ElementUI = defineElementUI({
  // ...
  get group() { return t('echarts.panel.group') },
  // ...
})
```

约束：

- getter 内使用全局 `t()`，与现有 kind label / notes 的动态语言口径一致。
- 不用 `...CHART_OPTION_META` 复制带 getter 的对象。
- 不改变 `PluginOptionMeta.label` 的公开类型，仍对消费者暴露 `string`。

### 7.4 发布链路门禁

#### 产物入库

根 `.gitignore` 增加精确例外，只放开市场安装真正需要的文件：

```gitignore
!marketplace/plugins/echarts/dist/
marketplace/plugins/echarts/dist/*
!marketplace/plugins/echarts/dist/marketplace.js
!marketplace/plugins/echarts/dist/i18n/
!marketplace/plugins/echarts/dist/i18n/**
!marketplace/plugins/data-preview/dist/
!marketplace/plugins/data-preview/dist/**
```

#### 标签策略

发布流程在产物提交后创建：

- `plugins/echarts/v<plugin.version>`
- `plugins/data-preview/v<plugin.version>`

标签指向同一发布提交；CLI 继续使用现有 `buildGitTag(id, version)`，不改源解析逻辑。

#### 发布前检查脚本

新增 `scripts/verify-marketplace-release.mjs`，发布前必须通过：

- `marketplace.json`、`plugin.json`、`package.json.wormPrint` 的 id/version/entry 一致。
- 每个 `plugin.json.files` 项存在且被 Git 跟踪。
- 市场入口存在；`data-preview` 的 `dist/index.js`、`ui.js`、`describe.js`、`types.js` 均被跟踪。
- `echarts` 的 `dist/marketplace.js` 与三语 `dist/i18n/*.json` 被跟踪。
- 输出将要创建的插件 tag，供发布流程核对。

### 7.5 官方文档与示例

更新 `docs/guide/07-plugin-install.md`：

- 增加“市场产物必须纳入版本控制”的 `.gitignore` 示例。
- 明确本地插件路径不要写进 `optimizeDeps.include`；由 `main` 静态 import 触发扫描。
- 增加 `--force` 暂存升级说明与失败回滚语义。
- 增加 ECharts 6 / happy-dom 测试建议：mock `echarts.init`、`enableAutoUnmount(afterEach)`、`vi.waitFor` 断言 `setOption`。
- 排错表增加“入口存在但导入报 `./ui.js` 缺失”“升级后旧文件残留”“导入出现 i18n missing key”三项。

同步 `docs/guide/09-migration-faq.md` 与 Vue3 demo README，只链接权威章节，不复制大段规则。

## 8. 改动清单

| 文件 | 动作 |
| --- | --- |
| `marketplace/plugins/data-preview/plugin.json` | `files` 改为整个 `dist` |
| `marketplace/plugins/data-preview/src/__tests__/package.spec.ts` | 新增市场安装闭包契约测试 |
| `packages/marketplace/src/install.ts` | `--force` 暂存、原子切换、失败回滚 |
| `packages/marketplace/src/install.test.ts` | 多文件 dist、force 清旧文件、失败保留旧版测试 |
| `marketplace/plugins/echarts/src/plugin.ts` | 元数据 label 改惰性 getter，去掉 spread 求值 |
| `marketplace/plugins/echarts/src/ui.ts` | `CHART_ELEMENT_UI.group` 改 getter |
| `marketplace/plugins/echarts/src/__tests__/marketplace-entry.spec.ts` | 市场入口无缺键警告与 locale 切换测试 |
| `.gitignore` | 放开官方市场插件必需 dist 产物 |
| `scripts/verify-marketplace-release.mjs` | 新增发布门禁 |
| `package.json` / 发布 workflow | 接入门禁与插件 tag 创建步骤 |
| `docs/guide/07-plugin-install.md` | 补安装、忽略、Vite、升级与测试排错 |
| `docs/guide/09-migration-faq.md`、`demos/apps/vue3/README.md` | 同步权威链接与关键提醒 |

## 9. 测试与验收

### 9.1 RED：先证明现有问题

1. `data-preview` 市场安装测试：导入安装入口，当前应因 `./ui.js` 缺失失败。
2. `--force` 清理测试：v1 放入 `obsolete.js`，v2 白名单移除，当前升级后 `obsolete.js` 仍存在。
3. `echarts` 市场入口测试：spy `console.warn` 后动态导入，当前应捕获 7 条 `[i18n] missing key`。
4. 发布门禁测试：当前 `git ls-files marketplace/plugins/data-preview/dist` 为空，应判失败。

### 9.2 GREEN：修复后验收

- `npm test -w @worm-print-platform/marketplace`：定向安装器测试全绿。
- `npm test -w @worm-print-platform/plugin-data-preview`：打包契约与既有功能测试全绿。
- `npm test -w @worm-print-platform/plugin-echarts`：i18n、生命周期、市场入口测试全绿。
- `node scripts/verify-marketplace-release.mjs`：退出码 0。
- 临时宿主执行 local 市场安装并导入两个入口：无缺失模块、无 i18n 缺键警告。
- `npm run build`：通过。
- 文档链接检查：新增章节锚点与相对链接有效。

### 9.3 验收判据

- A-01：安装后的 `data-preview/dist/index.js` 导入成功，两个公开 API 均为函数。
- A-02：force 升级后旧文件消失；模拟复制失败时旧版本仍可使用。
- A-03：市场入口导入无 `[i18n] missing key`；切换 zh/en/th 后元数据 label 与 UI group 同步变化。
- A-04：发布脚本通过，两个插件 tag 可由 CLI 解析，安装内容与发布提交一致。
- A-05～A-07：官方文档与 demo 提供可复制配置，宿主按文档配置后构建与定向测试通过。

## 10. 风险与边界

- 原子切换涉及文件系统 rename，Windows 上需关注目标目录被进程占用；实现应保留明确错误而不是强制删除。
- 语言资源与插件目录分两次切换，必须共享同一回滚快照，避免出现“新插件 + 旧语言”。
- 跟踪 `echarts/dist` 时只放开安装必需文件，避免把 52 个非市场产物全部纳入仓库。
- 插件 tag 是发布动作，本 spec 不自动创建或推送标签；需在发布流程中显式执行。
- 宿主 TypeScript 存量错误、浏览器 E2E 环境缺失不属于本 spec 修复范围。

## 11. 实施顺序

1. 先修 A-01 与 A-03，恢复两个官方插件的基本可用性。
2. 再修 A-02，消除升级残留并补回滚测试。
3. 落地 A-04 的产物入库、发布门禁与插件 tag 流程。
4. 最后同步 A-05～A-07 的官方文档与 demo，完成端到端市场安装验收。
