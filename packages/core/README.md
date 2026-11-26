<p align="center">
  <strong>@worm-print-platform/core</strong><br>
  <em>打印模板表达式引擎 · 同构渲染管线 · 框架无关设计器内核</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/npm-v1.6.6-384BFF" alt="npm">
  <img src="https://img.shields.io/badge/node-%E2%89%A520-4B9B4B" alt="node">
  <img src="https://img.shields.io/badge/license-MIT-9A9A9A" alt="license">
</p>

> monorepo 根：[worm-print-platform](https://github.com/worm-longliu/worm-print-platform) · 在线示例：[GitHub Pages](https://worm-longliu.github.io/worm-print-platform/)

`core` 是整个仓库的底层纯 TS 逻辑包：自研模板表达式引擎 + 同构打印管线（数据绑定 / HTML 生成 / 分页 / 测量元素）+ 框架无关的设计器内核（模型 / 工具 / 交互逻辑）。**无 Vue、无 React、无宿主依赖**——在 Node 服务端（`@worm-print-platform/render`）与浏览器端（`@worm-print-platform/canvas`）共用，保证「浏览器预览」「服务端 PDF」「桌面客户端出图」三条链路共享同一套算法。

## 安装

```bash
npm i @worm-print-platform/core
```

## 快速示例

```ts
import { generateHtml, paginate, bindData } from '@worm-print-platform/core'

const bound = bindData(templateJson, printData)
const pages = paginate(bound, measured, options)
const html = generateHtml(pages)
```

作为设计器内核使用（子路径）：

```ts
import { resolvePaperMm, PaperSize } from '@worm-print-platform/core/designer'
```

## 子路径导出

| 子路径 | 内容 | 运行环境 |
| --- | --- | --- |
| `.` | 表达式引擎 + 同构渲染管线（零运行时依赖） | Node / 浏览器 |
| `/designer` | 设计器模型类型、通用工具、纯交互逻辑 | 任意（DOM 事件绑定需浏览器） |
| `/browser` | 浏览器分页渲染、条形码/二维码渲染器 | 仅浏览器 |
| `/client` | 桌面客户端 SDK：端口探测、WebSocket 协议、重连、静默打印 | Node / 浏览器 |
| `/node` | Node 端 DOM 执行器 bundle 载入器（供 Playwright / Electron 注入页面） | Node |

> 注意：`/designer` 的 `TemplateData` 等类型是设计器完整模型，与主入口渲染管线的简化同名类型有意分离，因此不从主入口转出。

### `/designer` 稳定面（破坏性变更按 minor 及以上）

下面这些导出已被 `@worm-print-platform/canvas` 与四个 `demos` 宿主直接消费，属于公开契约：

| 导出 | 契约要点 |
| --- | --- |
| `resolveToolbarOverflow(input)` | 顶栏自适应收纳的唯一判据，链序属稳定面 |
| `resolveElementTextFit(type, opts)` | 元素级 / 单元格级显示形式（`clip` / `shrink` / `autoHeight`） |
| `resolvePrinterDpi` / `zoomPresets` / `defaultZoomKey` 等 | 预览缩放五档，默认档恒为 100% |
| `resolveElementBorderSpec` / `applyElementBorderPreset` 等 | 元素边框线与预设编辑 |

## 打印管线（`print/`，纯 TS）

- 入口：`prepareDocument(job, runtime)`、`renderPdf(job, runtime)`
- 规格：`buildPdfTargetSpec`、`toPlaywrightPdfOptions`、`toElectronPrintToPdfOptions`
- 纸张：`resolvePaperMm`（宿主覆盖逃生门）、`paperViewportPx`、`escapeHeightMm`（连续纸逃生门）
- 拼版：`computeTileLayout` / `composeTiledHtml`（多标签铺满目标纸）
- 宿主契约：`PageDriver`（宿主只实现 open / setContent / injectExecutor / evaluate）+ `createDomHostRuntime`

## 目录结构

```
src/
  lexer.ts / parser.ts / evaluator.ts / template-parser.ts   # 表达式引擎
  functions/                                                 # formatMoney / formatDate / sum / concat 等
  render/                                                    # data-binder / html-generator / pagination-engine / css-builder …
  designer/                                                  # 框架无关设计器内核（无 Vue/React 依赖）
    types.ts                                                 # 完整模板模型
    utils/                                                   # 元素工厂 / 表格矩阵 / 单位换算 / 迁移 / 吸附参考线
    interactions/                                            # 对齐 / 分组 / 缩放 / 键盘 / 吸附
  browser/                                                   # 浏览器分页、条形码/二维码
  client/                                                    # 桌面客户端 SDK（WS 协议、重连、静默打印）
  node/                                                      # Node 宿主执行器 bundle 载入器
print/                                                       # 同构打印管线（prepareDocument / renderPdf）
```

## 依赖与边界

- 本包纯 TS，除 `jsbarcode` / `qrcode` 两个轻量码制库外，**不引入任何框架运行时**。
- `@worm-print-platform/canvas`、`@worm-print-platform/render`、`@worm-print-platform/client` 都依赖本包；分层不得破坏。
- 扩展元素（如图表）的执行器产物由各插件包提供，本包通过 `collectExecutorBundles()` 按注册表自动收集。

## 开发

```bash
npm run build   # tsup → dist/index.js + index.cjs + d.ts
npm test        # vitest
```

## 相关链接

- [根 README](https://github.com/worm-longliu/worm-print-platform/blob/main/README.md)
- [架构与包分层](https://github.com/worm-longliu/worm-print-platform/blob/main/README.md#架构与分层)
- [设计器 README](../canvas/README.md)
- [打印渲染微服务](../../services/render/README.md)

## License

[MIT](../../LICENSE)
