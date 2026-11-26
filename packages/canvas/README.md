<p align="center">
  <strong>@worm-print-platform/canvas</strong><br>
  <em>打印模板设计器权威实现（零框架 Custom Elements）</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/npm-v1.6.6-384BFF" alt="npm">
  <img src="https://img.shields.io/badge/license-MIT-9A9A9A" alt="license">
  <a href="/vue3">
    <img src="https://img.shields.io/badge/vue-optional%20peer-42b883" alt="vue peer">
  </a>
</p>

> monorepo 根：[worm-print-platform](https://github.com/worm-longliu/worm-print-platform) · 在线示例：[GitHub Pages](https://worm-longliu.github.io/worm-print-platform/) · 设计器能力验收清单：[PARITY.md](./PARITY.md)

打印模板可视化设计器的**权威实现**：原生 Custom Element + Shadow DOM，**不依赖 Vue / React 等任何框架运行时**。Vue 3 / Vue 2.7 / React / jQuery / 原生 JS 等任意宿主统一消费本包，样式 / 图标 / 主题令牌从 `@worm-print-platform/core/src/styles` 共享源派生，元素能力与定义走统一注册表（内置 11 类与第三方插件同权）。

- 运行时体积：`dist/index.js` 约 368 kB（gzip 106 kB），零框架依赖
- 浏览器直挂形态：`dist/canvas.js`（UMD，core + 码制库内联）+ `dist/canvas.css`
- `vue` 是可选 peer，不用 `/vue3` 时主入口零 Vue 依赖

## 安装

```bash
# NPM 宿主
npm i @worm-print-platform/canvas @worm-print-platform/core
```

宿主框架依赖（主入口零框架运行时，宿主框架按需装）：

| 宿主 | 安装 |
| --- | --- |
| Vue 3 | `npm i @worm-print-platform/canvas @worm-print-platform/core vue`（可选 `/vue3` 门面） |
| Vue 2.7 | `npm i @worm-print-platform/canvas @worm-print-platform/core vue@2.7` |
| React 18 | `npm i @worm-print-platform/canvas @worm-print-platform/core react react-dom` |
| jQuery / 无打包器 | 取 `dist/canvas.js` + `dist/canvas.css` 直挂（见下节） |

## 快速示例（原生 Custom Element）

```js
import { registerAll } from '@worm-print-platform/canvas'
registerAll()   // 注册 <print-designer>，不自动污染全局
```

```html
<print-designer id="d" style="display:block;height:100%"></print-designer>
```

```js
const el = document.getElementById('d')
el.fields = [{ fieldKey: 'orderNo', fieldLabel: '单号' }]
el.template = templateJson
el.uploadImage = file => uploadToServer(file)
el.addEventListener('save', e => persist(e.detail))
el.addEventListener('preview', e => preview(e.detail))
el.getTemplateJson()     // 返回 JSON 字符串
el.validateTemplate()    // 拼版/多页配置校验，保存前必须调
el.loadTemplate(json)
```

> 完整宿主接入代码见用户使用文档：[Vue 3](../../docs/guide/02-vue3.md) · [Vue 2.7](../../docs/guide/03-vue2.md) · [React 18](../../docs/guide/04-react.md) · [jQuery / 原生 JS](../../docs/guide/05-jquery.md)。可运行工程：`demos/apps/{vue3,vue2,react,jquery}`。

> 多语言（宿主 `lang`/`messages`、自定义语言文件、插件接入）：[用户使用文档 · 多语言](../../docs/guide/06-i18n.md)。

## /vue3 兼容门面

Vue 3 宿主用 `/vue3` 门面即可沿用组件写法（props / 事件 / `ref`），底层复用零框架的本包，模板、事件回调、`ref` 方法调用一行不动。原本消费 `@worm-vue3-print/canvas` 的项目只需改依赖名：

```diff
- "@worm-vue3-print/canvas": "..."
+ "@worm-print-platform/canvas": "..."
```

```ts
import { PrintDesigner, PrintHtmlPreview } from '@worm-print-platform/canvas/vue3'
import type { TemplateData } from '@worm-print-platform/canvas/vue3'
```

门面负责的契约转换：

| Vue 组件侧 | Custom Element 侧 | 门面动作 |
| --- | --- | --- |
| `:initial-template` / `:fields` / 函数型 `:upload-image` | `el.template` / `el.fields` / `el.uploadImage` | 显式赋 property，绕开 attribute 字符串化 |
| `@save="onSave"` 首参是 JSON 字符串 | `CustomEvent('save')`，json 在 `detail` | 解 `detail` 再 emit |
| `ref.getTemplateJson()` 返回对象 | 返回 JSON 字符串 | `JSON.parse` |

详细迁移说明见 [docs/migration-worm-vue3-print.md](../../docs/migration-worm-vue3-print.md)。

## 浏览器直挂（jQuery / 无打包器宿主）

`vite.bundle.config.ts` 产出 UMD bundle（`@worm-print-platform/canvas/browser` 子路径）：

```html
<link rel="stylesheet" href="/vendor/worm-print-canvas.css" />
<script src="/vendor/worm-print-canvas.js"></script>
<script>
  WormPrintCanvas.registerAll()
  const el = document.querySelector('print-designer')
  el.fields = fields
  el.template = templateJson
  el.addEventListener('save', e => persist(e.detail))
</script>
```

两个硬约束：自定义元素默认 `display:inline`，宿主必须给它块级宽高；`fields` 只有 setter，读回看 `el.store.fields`。

## 宿主契约

`<print-designer>` 的接入面是**版本化**的，定义在 `src/host-contract.ts`：

| 面 | 内容 |
| --- | --- |
| attribute | `template` · `fields` · `name` · `fonts` · `design-data` · `theme` · `theme-config` · `field-display`（另 `is-edit` / `show-help` / `show-preview` / `show-save` 四个布尔开关） |
| property | `template` · `fields` · `fonts` · `designData` · `isEdit` · `showHelp` · `showPreview` · `showSave` · `theme` · `themeConfig` · `uploadImage` · `uploadDesignBackground` · `fieldDisplay` |
| 方法 | `getTemplateJson()` · `loadTemplate()` · `save()` · `validateTemplate()` · `getGeometryWarnings()` |
| 事件（`bubbles + composed`） | `save` / `preview` → 模板 JSON 字符串；`help` → 无载荷；`dblclick-element` → 元素 id；`dblclick-cell` → `{ elementId, r, c, cellId? }` |

`field-display`（property 名 `fieldDisplay`）取 `label`（只显示中文名）/ `key`（只显示字段 key）/ `both`（两者都显示，默认）。只影响素材台字段行与表达式弹窗「字段」页签；字段分组名始终显示，搜索、复制、双击插入与拖拽语义不变。只显示 key 时其字号、颜色与字族套用中文名样式。非法值静默回退 `both`。

```html
<print-designer field-display="label"></print-designer>
```

自定义外观：外壳 8 个 `::part` 挂钩 + 55 个 `--pd-*` 主题令牌（权威定义在 `@worm-print-platform/core/styles/theme.css`）。契约版本遵守语义化，`src/__tests__/host-contract.spec.ts` 做漂移检测。

主题配色有两条通道，且**参数优先于 CSS 令牌**：

- CSS：宿主覆盖 `--pd-*` 变量（注意 Shadow DOM 内 `.designer-container` 的令牌声明会遮蔽外部值）；
- 参数：`theme="auto" | "light" | "dark"` 选预设，`theme-config` 传细粒度色值覆盖。

优先级：`theme-config.overrides` > 显式 `theme="dark"|"light"` > `auto` 跟随系统 `prefers-color-scheme` > CSS 令牌 > 内置浅色。内置暗色预设只改设计器外壳，纸张、画布背景、标尺与手柄保持原值，预览所见即所得不受影响；宿主如需连画布外围一起换色，可显式覆盖 `--pd-canvas-bg`。

```html
<print-designer
  theme="dark"
  theme-config='{"overrides":{"--pd-bg":"#0f1115","--pd-surface":"#181b21","--pd-text":"#e6e8ee"}}'>
</print-designer>
```

Vue 3 门面同名 props：`theme="dark"` + `:theme-config="{ overrides: { ... } }"`。

`showPreview` / `showSave` 控制工具栏「预览 / 保存」按钮显隐，默认显示，置 `false` 隐藏（Vue 3 门面同名 props）。隐藏只影响按钮出图：`save()` 方法、`save` / `preview` 事件照常可用，宿主可接管打印与预览业务逻辑。

## 统一元素注册表

内置元素与第三方插件**同权**：

```ts
import { registerElementDefinition, registerElementRenderer } from '@worm-print-platform/canvas'

const release = registerElementDefinition({
  type: 'signature', label: '手写签名', icon: 'PenLine',
  material: true, propertyGroup: 'general', dblEditableField: 'src', group: '扩展',
})
registerElementRenderer('signature', (el) => { /* 返回 HTML 字符串或 Node */ })
// release() 后回到内置基线
```

## 自定义元素插件（图表等）

设计器只保留通用机制，具体元素由插件包提供：

```ts
import { registerAll } from '@worm-print-platform/canvas'
import '@worm-print-platform/echarts/ui'   // 官方图表插件；换自定义插件同理
registerAll()

const el = document.querySelector('print-designer')
el.fields = [{ fieldKey: 'trend', fieldLabel: '趋势数据', fieldType: 'list' }]
el.designData = { trend: [{ name: '一月', value: 12 }, { name: '二月', value: 28 }] }
```

插件写自己的元素见 [`@worm-print-platform/plugin-kit`](../plugin-kit/README.md)。

## 两种接入形态的边界

| | `/vue3` 门面 | 本包主入口 |
| --- | --- | --- |
| 运行时 | Vue 3（可选 peer） | 无框架 |
| 宿主注入 | props / 事件 / `ref` | element property / attribute + CustomEvent |
| 样式 | 门面幂等注入，无需引样式文件 | 内置 Shadow DOM（`?inline`）；light DOM 形态引 `@worm-print-platform/canvas/style.css` |
| 适用 | 沿用组件写法的 Vue 3 项目 | Vue 3 / Vue 2 / React / jQuery / 原生 |

## 样式生成

样式 / 图标 / 主题令牌的单一来源在 `core/src/styles`，本包从共享源派生（`gen-styles.mjs` 剥 `[data-v-*]` 后补主题令牌，`gen-icons.mjs` 读共享 `icon-manifest.json`）；`gen-styles.mjs --check` 做漂移检测，不要手改派生产物。

## 开发

```bash
npm run build   # styles + vite build + tsc
npm test        # vitest（含 host-contract 漂移检测）
```

## 相关链接

- [根 README 架构分层](https://github.com/worm-longliu/worm-print-platform/blob/main/README.md#架构与分层)
- [设计器内核（core）](../core/README.md)
- [插件 UI 契约（plugin-kit）](../plugin-kit/README.md)
- [ECharts 图表插件](../echarts/README.md)
- [宿主契约源码](src/host-contract.ts) · [验收清单](PARITY.md)

## License

[MIT](../../LICENSE)
