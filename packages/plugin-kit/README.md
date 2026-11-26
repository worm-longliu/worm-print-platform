<p align="center">
  <strong>@worm-print-platform/plugin-kit</strong><br>
  <em>插件设计器 UI 契约与注册表（框架无关）</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/npm-v1.6.6-384BFF" alt="npm">
  <img src="https://img.shields.io/badge/license-MIT-9A9A9A" alt="license">
</p>

> monorepo 根：[worm-print-platform](https://github.com/worm-longliu/worm-print-platform)

自定义元素的**框架无关设计器 UI 契约与注册表**。插件作者只写一份 DOM 渲染能力（返回 HTML 字符串或 DOM 节点），即可同时被两类宿主消费：

| 宿主 | 消费方式 |
| --- | --- |
| `@worm-print-platform/canvas` | 零框架原生挂载：素材卡、画布、属性台「自定义属性」页签直接使用 UI |
| `@worm-print-platform/canvas/vue3` | Vue 3 门面：复用同一份 UI 契约 |

## 与 core 插件描述符的关系

- **元素语义**（kind 类型、标签、图标、默认值、绑定、出图、校验）由 `@worm-print-platform/core/designer` 的 `defineElementPlugin` + `registerElementPlugin` 声明。
- **设计器 UI**（画布渲染什么样、属性台怎么改）由本包的 `defineElementUI` + `registerElementUI` 声明。
- 两者用元素 `type` 关联：宿主只展示「core 注册表里有 kind 且 plugin-kit 里有 UI」的元素，避免出现无法渲染的素材卡。

## 安装

```bash
npm i @worm-print-platform/plugin-kit
```

## 契约与使用

```ts
import { defineElementUI, registerElementUI } from '@worm-print-platform/plugin-kit'

export const MY_ELEMENT_UI = defineElementUI({
  types: ['myElement', 'myElementBold'],
  renderCanvas: ({ element }) => `<svg data-type="${element.printElementType.type}"></svg>`,
  renderProperty: ({ element, update }) => {
    const form = document.createElement('form')
    form.className = 'pd-form'
    const input = document.createElement('input')
    input.className = 'pd-input'
    input.value = String(element.options.myText ?? '')
    input.addEventListener('change', () => update({ myText: input.value }))
    form.appendChild(input)
    return form
  },
  hasProperties: element => element.options.myText !== undefined,
  group: '我的元素',
  searchKeywords: ['我的元素', 'myElement'],
  styles: '.my-element-row { display: flex; gap: 6px; }',
})

registerElementUI(MY_ELEMENT_UI)   // 包入口 import 即注册
```

### 渲染结果

`renderCanvas` / `renderProperty` 返回以下三种形态之一：

| 形态 | 宿主行为 |
| --- | --- |
| `string` | 作为 HTML 注入宿主容器（插件负责保证内容安全、可信） |
| `Node` | 直接挂载 |
| `{ node, dispose? }` | 挂载前者的内容，宿主重绘/卸载时调用 `dispose` 释放监听或实例 |

### 设计态上下文：`data` 与 `fields`

| 字段 | 来源 | 用途 |
| --- | --- | --- |
| `data` | 宿主注入的设计态示例数据；未注入时回落 core 的 `DEFAULT_DEMO_DATA` | 画布预览按真实业务数据出图（图表类插件的柱子/扇区由此而来） |
| `fields` | 宿主的业务字段清单（`fieldKey` / `fieldLabel` / `fieldType`） | 生成「数据源 / 类目 / 数值字段」下拉 |

### 属性写回

属性上下文只提供 `update(partial)` / `repaint()`（`data` / `fields` 只读）：

- `update(partial)`：宿主把补丁合并进 `element.options`、记一条历史并重绘。
- `repaint()`：只请求重绘，不写数据、不记历史。
- 插件不得绕过宿主直接改 store。

## 注册表 API

| API | 说明 |
| --- | --- |
| `defineElementUI(ui)` | 校验并返回描述符（不注册） |
| `registerElementUI(ui)` | 注册；同 type 后注册者覆盖，返回只注销自己这一版的句柄 |
| `getElementUI(type)` | 按元素类型取 UI |
| `getElementUIEntries()` | `{ type, ui }[]`，供宿主生成素材卡/属性页签 |
| `subscribeElementUIRegistry(fn)` | 订阅注册态变化，宿主据此刷新素材台/属性台 |
| `clearElementUIs()` | 清空（单测/热重载） |

注册态挂在 `globalThis` 的固定 `Symbol` 上，与 core 元素插件注册表同一约定，避免多打包副本漂移。

## 边界

- 本包纯 TS，不依赖 Vue / React / 任何 UI 组件库；DOM 操作只在渲染函数被宿主调用时发生。
- 插件 UI 用样式串注入宿主样式作用域，不提供独立 CSS 文件。
- 出纸仍走 `@worm-print-platform/core` 的通用渲染协议，本包不负责。

## 开发

```bash
npm run build   # tsup
npm test        # vitest
```

## 参考实现

- 官方图表插件：[`@worm-print-platform/echarts`](../echarts/README.md) — 用 `/kit` 提供框架无关纯 TS 能力，`/ui` 提供 plugin-kit 适配层

## 相关链接

- [根 README](https://github.com/worm-longliu/worm-print-platform/blob/main/README.md)
- [插件化自定义元素章节](https://github.com/worm-longliu/worm-print-platform/blob/main/README.md#插件化自定义元素)

## License

[MIT](../../LICENSE)
