# 接入 API 与数据契约

设计器权威实现是零框架 Custom Element `<print-designer>`，契约的机器可读单一真源在 `packages/canvas/src/host-contract.ts`，由 `getHostContract()` / `PrintDesignerElement.contractVersion` 暴露。接入前先读它，不要靠猜。

## 1. 最小接入（原生 / Vue / React 通用）

```js
import { registerAll, createDefaultTemplate } from '@worm-print-platform/canvas'
import '@worm-print-platform/canvas/style.css' // 仅 light DOM 形态需要；Shadow DOM 默认内联

registerAll() // 全局一次，注册 <print-designer>，不自动污染全局
const el = document.querySelector('print-designer')

// 对象 / 数组 / 函数只能赋 property，写进 attribute 会被字符串化
el.fields = [
  { fieldKey: 'order.no', fieldLabel: '单号', fieldType: 'string', sortOrder: 1 },
  { fieldKey: 'goods', fieldLabel: '商品明细', fieldType: 'list', sortOrder: 2 },
]
el.template = createDefaultTemplate()
el.uploadImage = async file => uploadToServer(file) // 返回可访问 URL

el.addEventListener('save', e => persist(JSON.parse(e.detail)))
el.addEventListener('preview', e => openPreview(e.detail)) // detail 已是当前画布 JSON 字符串
```

宿主必须给自定义元素块级宽高（它默认 `display:inline`，容器没高度会整体塌陷）：

```css
.designer-host print-designer { display: block; width: 100%; height: 100% }
```

### 最小接入（浏览器直挂）

无打包器宿主从 UMD 产物引入，能力全部从全局 `window.WormPrintCanvas` 取：

```html
<script src="/vendor/worm-print-canvas.js"></script>
<script type="module">
  WormPrintCanvas.registerAll()
  const el = document.getElementById('designer') // <print-designer id="designer">
  el.fields = fields
  el.template = templateJson
  el.uploadImage = file => upload(file)
  el.addEventListener('save', e => persist(JSON.parse(e.detail)))
</script>
```

修改字段、切换示例、导入或清空模板后，显式再次给 property 赋值；不要监听 element 自身猜测注入时机。`fields` 只有 setter，读回用 `el.store.fields`；`el.template` getter 返回当前画布 JSON 字符串。

## 2. `<print-designer>` 契约（版本化，当前 1.2.0）

**attribute（字符串形态）**：`template` · `fields` · `name` · `fonts` · `design-data` · `theme` · `theme-config`
**布尔 attribute（property 开关）**：`is-edit` · `show-help` · `show-preview` · `show-save`
**property**：

| property | 说明 |
| --- | --- |
| `template` | 写入模板（对象 / JSON 串）；getter 读回当前画布 JSON 字符串 |
| `fields` | 业务字段数组（或 JSON 串）；**只有 setter**，读回用 `el.store.fields` |
| `fonts` | 模板级字体声明数组，注入 `@font-face` 并随保存写回模板 |
| `designData` | 设计态示例数据（单对象 / 数组信封 / JSON 串），供插件按真实数据预览 |
| `isEdit` / `showHelp` | 布尔开关，同时写 `is-edit` / `show-help` attribute |
| `showPreview` / `showSave` | 工具栏「预览 / 保存」按钮显隐，默认显示，置 `false` 隐藏；同时写 `show-preview` / `show-save` attribute。隐藏只影响按钮出图，`save()` 方法与 `save` / `preview` 事件照常可用（宿主自定义打印/预览业务的旁路） |
| `theme` | 主题预设：`'auto'`（默认，跟随系统）/ `'light'` / `'dark'`，同时写 `theme` attribute。深色预设只改设计器外壳，纸张 / 画布背景 / 标尺 / 手柄保持原值，预览所见即所得不变 |
| `themeConfig` | 主题色值覆盖：`{ overrides?: { '--pd-bg'?: string, '--pd-surface'?: string, … } }`，**对象必须赋 property**（写 attribute 会被字符串化）。传参优先级高于 `theme` 预设与 CSS 令牌；未传时由预设 / 系统决定 |
| `uploadImage` / `uploadDesignBackground` | 宿主上传函数 `(file: File) => string \| Promise<string>` |

**显示配置小结（1.2.0 起）**：`showPreview` / `showSave` 管按钮显隐，`theme` / `themeConfig` 管配色，二者都是宿主可传的配置项，互不依赖。典型做法：宿主自己的页面提供「配置」入口（如顶部按钮弹窗），把这几项的状态写回元素 property；`themeConfig` 是对象，务必走 property。仓库四个 demo（vue3 / vue2 / react / jquery）顶部都有这样的「配置」弹窗可直接抄——**示例只暴露显隐开关，不暴露配色控件**；配色通过传 `theme` / `themeConfig` 实现，画布纸张不受影响。优先级链：`themeConfig` 覆盖 > 显式 `theme` 预设 > `auto` 跟随系统 `prefers-color-scheme` > CSS 令牌 > 内置浅色。

**方法**：

| 方法 | 说明 |
| --- | --- |
| `getTemplateJson(): string` | 读当前模板 JSON 字符串（含字体声明），**旁路，不触发拼版校验** |
| `loadTemplate(input)` | 载入模板（对象 / JSON 串） |
| `save()` | 先校验拼版、再派发 `save` 事件 |
| `validateTemplate(): Array<{message}>` | 拼版 / 多页配置校验，合法返回 `[]`。宿主走 `getTemplateJson()` 旁路导出/另存时必须自行调用 |
| `getGeometryWarnings(): string[]` | 出纸裁切预估提示，不阻断保存 |

**事件（均 `bubbles: true, composed: true`，可穿透 Shadow DOM）**：

| 事件 | detail |
| --- | --- |
| `save` | 模板 JSON 字符串 |
| `preview` | 模板 JSON 字符串（与 `/vue3` 门面的无载荷 `@preview` 刻意不同，见门面一节） |
| `help` | 无载荷 |
| `dblclick-element` | 元素 id 字符串本身，**不要 `JSON.parse`** |
| `dblclick-cell` | `{ elementId, r, c, cellId? }` 对象 |

**运行时自检**：`PrintDesignerElement.contractVersion`、`el.getHostContract()`、`getHostContract()`（均导出）。`::part` 外壳挂钩 8 个：`container / toolbar / format-bar / left-panel / canvas-area / property-panel / status-bar / page-tabs`；主题令牌 55 个 `--pd-*`，权威定义在 `@worm-print-platform/core/styles/theme.css`，覆盖同名变量即可换肤，不要写死进 Shadow DOM 内部选择器。换肤推荐用 `theme` / `themeConfig` 参数（见上表），它写入内部容器行内变量，优先级高于外部 CSS 令牌。

**不存在** `back` 事件、`setTemplateMeta` 方法——返回导航与模板元信息都属宿主业务层。模板重载：`el.template = 新对象`（必须新引用）。事件处理器在组件销毁 / effect cleanup 里成对解绑；React StrictMode dev 双跑，漏解绑会重复保存。

## 3. Vue 3 组件写法（正式门面）

**Vue 3 宿主用这一节，不必改用原生元素。** 门面子路径 `@worm-print-platform/canvas/vue3` 导出 `PrintDesigner` / `PrintHtmlPreview` 组件及其余工具，组件写法与原 `@worm-vue3-print/canvas` 的 Vue 3 轨一致；底层复用同一份零框架 `<print-designer>`，门面负责把 props / 事件 / ref 方法转成元素 property / CustomEvent。无需再配 `isCustomElement`、无需引 CSS、无需手动赋 property。

### 设计器 + 预览最小接入（与旧 Vue 3 轨同形）

```vue
<template>
  <div class="print-integration">
    <PrintDesigner
      ref="designerRef"
      :initial-template="template"
      :fields="fields"
      :is-edit="true"
      :upload-image="uploadImage"
      @save="onSave"
      @preview="onPreview"
    />
    <Teleport to="body">
      <div v-if="previewVisible" class="preview-mask" @click.self="previewVisible = false">
        <PrintHtmlPreview
          ref="previewRef"
          :template-json="previewTemplate"
          :print-data="printData"
          base-url="/files"
          @rendered="pageCount = $event"
          @error="previewError = $event"
        />
        <button type="button" @click="previewRef?.print()">打印</button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  PrintDesigner, PrintHtmlPreview, createDefaultTemplate,
} from '@worm-print-platform/canvas/vue3'
import type { PrintBusinessField, TemplateData } from '@worm-print-platform/canvas/vue3'

const template = ref<TemplateData>(createDefaultTemplate())
const fields = ref<PrintBusinessField[]>([])
const designerRef = ref<InstanceType<typeof PrintDesigner>>()
const previewRef = ref<InstanceType<typeof PrintHtmlPreview>>()
const previewVisible = ref(false)
const previewTemplate = ref<Record<string, any> | null>(null)
const printData = ref<Record<string, any>>({})

function onSave(json: string) {           // 首参是模板 JSON 字符串
  console.info('保存模板', JSON.parse(json))
}
function onPreview() {                     // 无载荷，自行取当前画布
  previewTemplate.value = designerRef.value?.getTemplateJson() ?? null
  previewVisible.value = Boolean(previewTemplate.value)
}
async function uploadImage(file: File) {
  const body = new FormData(); body.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body })
  return (await res.json()).url as string
}
</script>
```

### 门面组件契约

`PrintDesigner` props：`initial-template`、`initial-elements`、`fields`、`is-edit`、`upload-image`、`upload-design-background`、`show-help`、`show-preview`、`show-save`、`theme`、`theme-config`、`fonts`、`designData`。事件：`save(json: string)`、`preview()`（无载荷）。expose：`getTemplateJson()`（返回**对象**，不是字符串）、`validateTemplate()`、`getGeometryWarnings()`。`theme` / `theme-config` 与原生元素同语义：前者选预设，后者传覆盖对象（门面内部赋 property，避免对象被字符串化）。

`PrintHtmlPreview` props：`template-json`、`print-data`、`base-url`、`font-base-url`、`renderers`。事件：`rendered(pageCount, copies)`、`error(message)`。expose：`print()`、`rerender()`、`setViewZoom(key)` 及缩放只读属性。

门面存在的原因：Vue 对自定义元素的 `:prop` 绑定会走 `setAttribute`，把对象字符串化成 `[object Object]`、函数直接丢失；门面内部对所有入参显式赋 property，并对事件做转译（`CustomEvent.detail` → `emit`）。契约转换表：

| Vue 组件侧 | Custom Element 侧 | 门面动作 |
| --- | --- | --- |
| `:initial-template` `:fields` `:fonts` `:design-data`、函数型 `:upload-image`、对象型 `:theme-config` | 同名 property | 显式赋 property，绕开 `setAttribute` 字符串化 |
| `@save` 首参为 JSON 字符串 | `CustomEvent('save')`，json 在 `detail` | 解 `detail` 再 emit |
| `@preview`（无载荷） | `CustomEvent('preview')`，detail 为 JSON | 转无参 emit |
| `ref.getTemplateJson()` 返回对象 | 返回 JSON 字符串 | `JSON.parse` |
| `ref.validateTemplate()` / `getGeometryWarnings()` | 同名同语义 | 直接代理 |

门面导出还包括 `renderHtmlPages`、`browserCodeRenderer`、`createDefaultTemplate`、`toRuntimePool`、`DEFAULT_DEMO_DATA`、`getDemoData`、工具栏溢出 hooks（`provideToolbarOverflow` 等）及 `@worm-print-platform/core/designer` 全量类型与 `PrintFontDeclaration`。`import type { ... } from '@worm-vue3-print/canvas'` 直接换包名即可。

### 门面能力边界（迁移前确认）

- Vue 专属元素扩展注册表 `registerElementExtension` / `resolveElementPropertyTab` 等**不在本门面**（属旧 Vue 3 轨组件契约）；自定义元素走 `@worm-print-platform/plugin-kit` 的 `defineElementUI` / `registerElementUI`，官方图表用 `@worm-print-platform/echarts/ui`（import 即注册），也可用 canvas 的 `registerElementDefinition` / `registerElementRenderer`。
- `initialElements`：本包没有独立元素池，门面在未给 `initialTemplate` 时把它并入当前模板第一页 `elements`；与旧 Vue 3 轨「单独覆盖元素层」语义对齐。
- 本包是设计器权威实现，`/vue3` 门面与 `@worm-vue3-print/canvas` 同属 Vue 3 兼容轨，共享同一份样式与能力表。

## 4. 从 `@worm-vue3-print/canvas` 迁移到本仓

Vue 3 项目迁移的目标是**业务代码零改动**，只换依赖与 import。三步完成：

**① 换依赖**（版本同号，门面把 `vue` 作为 optional peer）：

```diff
- "@worm-vue3-print/canvas": "^1.4.8"
- "@worm-vue3-print/core": "^1.4.8"
+ "@worm-print-platform/canvas": "^1.6.6"
+ "@worm-print-platform/core": "^1.6.6"
+ "vue": "^3.5.0"
```

**② 换 import 与类型来源**（组件、工具、类型都在门面子路径）：

```diff
- import { PrintDesigner, PrintHtmlPreview, createDefaultTemplate, renderHtmlPages, DEFAULT_DEMO_DATA } from '@worm-vue3-print/canvas'
- import type { PrintBusinessField, TemplateData } from '@worm-vue3-print/canvas'
+ import { PrintDesigner, PrintHtmlPreview, createDefaultTemplate, renderHtmlPages, DEFAULT_DEMO_DATA } from '@worm-print-platform/canvas/vue3'
+ import type { PrintBusinessField, TemplateData } from '@worm-print-platform/canvas/vue3'
```

**③ 换可选扩展包与 monorepo 别名**：

- 旧 `echarts` / `echarts-common` 插件 → `@worm-print-platform/echarts`，import 入口为 `@worm-print-platform/echarts/ui`。
- 若为 monorepo 源码消费，把 Vite `resolve.alias` 与 `tsconfig.paths` 里旧 canvas 条目指向 `packages/canvas/src/vue3/index.ts`，并补 `canvas` / `plugin-kit` 两条；具体别名写法见 [安装方式](installation.md)。

迁移后 `template` / 事件回调 / `ref` 方法 / 业务逻辑一行不动。原生 `@worm-vue3-print/core` 的独立用法（表达式、同构渲染）改包名 `@worm-print-platform/core` 即可，子路径 `/designer` `/browser` `/client` `/node` 保持可用。

## 5. 业务字段契约 `PrintBusinessField`

```ts
const fields = [
  { id: 'supplier-group', fieldKey: 'supplier', fieldLabel: '供应商信息', fieldType: 'string', sortOrder: 1 },
  { id: 'supplier-name', fieldKey: 'supplier.name', fieldLabel: '供应商名称', fieldType: 'string', sortOrder: 2 },
  { id: 'goods-list', fieldKey: 'goods', fieldLabel: '商品明细', fieldType: 'list', sortOrder: 3 },
  { id: 'goods-name', fieldKey: 'goods.name', fieldLabel: '商品名称', fieldType: 'string', sortOrder: 4 },
]
```

- `fieldKey` 是 printData 中的完整取值路径；无点且作为其他字段前缀的记录用于字段树分组。
- `fieldType: 'list'` 的记录是表格 / 列表数据源，表格行 `dataSource` 指向该字段名，明细列表达式用完整路径 `{goods.name}`。

打印数据结构：

```ts
const printData = {
  supplier: { name: '供应商 A' },
  order: { no: 'SO-001', total: 100 },
  goods: [ { name: '商品 A', qty: 2, price: 10, amount: 20 } ],
}
```

## 6. 同构渲染管线（出纸三链路共用）

浏览器侧 `renderHtmlPages`（`packages/core/src/browser`）走两遍渲染：

```ts
import { renderHtmlPages, browserCodeRenderer } from '@worm-print-platform/core/browser'
import type { PrintTemplateData } from '@worm-print-platform/core'

const rendered = await renderHtmlPages(templateJson as PrintTemplateData, printData, baseUrl, browserCodeRenderer)
// rendered: { html, paperMm, continuous, pageCount, warnings }
```

服务端/纯 Node 侧用 `bindData` → `measureElements` → `paginate` → `generateHtml`（见 `core` 主入口导出）。三端测量共用 core 的 DOM 执行器（服务端经 Playwright driver 执行）。

拼版、旋转、水印、重复行等模板级能力见 [MCP 模板规范](../worm-print-platform-mcp/references/template-schema.md)，它们写在模板 JSON 里随模板走三端自动一致，不需要改后端协议。若用户要服务端 PDF，引导其接入 monorepo 内的 `services/render`（`@worm-print-platform/render`）；接入方业务仓库不要虚构 `/render/pdf` 实现。
