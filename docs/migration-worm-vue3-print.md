# 从 worm-vue3-print 迁移到 worm-print-platform

> 面向 `@worm-vue3-print/*` 老用户的迁移指南：包名映射、按宿主类型的三条迁移路径、
> 行为差异要点，以及可直接复制给 AI 编程工具的「迁移提示词」。
> 可运行对照示例：[demos](../demos/README.md) 四宿主工程（Vue 3 / Vue 2.7 / React 18 / jQuery）。

## 1. 背景与定位

`worm-print-platform` 由 [worm-vue3-print](https://github.com/worm-longliu/worm-vue3-print) 的
common 生态独立拆仓而来，npm scope 从 `@worm-vue3-print/*` 迁移为 `@worm-print-platform/*`，
并做了两件事：

- **原 `common` 包更名为 `canvas`**，成为设计器**权威实现**（零框架 Custom Elements + Shadow DOM）；
  原 Vue 3 组件轨（`@worm-vue3-print/canvas`）留在旧仓继续维护，本仓以 `/vue3` 兼容门面对应。
- **插件化元素正式化**：`plugin-kit`（插件设计器 UI 契约）与 `echarts`（图表元素可选包）从
  「工作区源码包」升级为 npm 正式包。

口径：本仓 `@worm-print-platform/canvas` 已正式发布，**以 workspace 根 `package.json` 的当前版本为稳定主线**（编写本文时为 1.6.6，旧版 1.5.x 描述已过时）；
`core` / `canvas` / `plugin-kit` 同号同批发版，安装时三者版本需齐平。`@worm-vue3-print/canvas` 进入维护状态、继续可用；迁移是**可选升级**，迁移完成后业务代码零改动。

## 2. 包名映射总表

| 旧（worm-vue3-print） | 新（worm-print-platform） | 说明 |
| --- | --- | --- |
| `@worm-vue3-print/core` | `@worm-print-platform/core` | 改包名即可；子路径 `/designer` `/browser` `/client` 保持可用，另增 `/node` |
| `@worm-vue3-print/canvas`（Vue 3 组件） | `@worm-print-platform/canvas/vue3` | 组件模板、事件、ref 调用、业务逻辑一行不动 |
| `@worm-vue3-print/common`（零框架） | `@worm-print-platform/canvas` | 包名 common → canvas；UMD 产物 `common.js/common.css` → `canvas.js/canvas.css`，全局 `window.WormPrintCommon` → `window.WormPrintCanvas` |
| `@worm-vue3-print/echarts`（源码引入） | `@worm-print-platform/echarts` | 升级为 npm 正式包；`/kit` 子路径保留，新增 `/ui` |
| `@worm-vue3-print/echarts-common`（源码引入） | （并入 `@worm-print-platform/echarts` 的 `/ui`） | 一行 `import '@worm-print-platform/echarts/ui'` 替代两个旧包 |
| `@worm-vue3-print/plugin-kit`（源码引入） | `@worm-print-platform/plugin-kit` | 升级为 npm 正式包，契约与注册表同名同形 |
| `@worm-vue3-print/skills`（npx 安装器） | `@worm-print-platform/skills`（npx 安装器，本仓 `packages/skills`）+ `skills/` 目录（源） | 命令由 `@worm-vue3-print/skills` 换成 `@worm-print-platform/skills`，默认 GitHub→Gitee 双源，方法见 [README](./README.md#技能安装方法提示词第-0-步的通用说明) |
| `@worm-vue3-print/render`（私有） | `@worm-print-platform/render`（`services/render`） | 服务端 PDF 微服务，Docker 部署 |
| `@worm-vue3-print/print-client`（私有） | `@worm-print-platform/client`（`clients/client`） | Electron 静默打印客户端 |

`contract` / `mcp` 两包新旧一致：不发布 npm，随客户端打包。

## 3. 路径 A：Vue 3 组件用户（`@worm-vue3-print/canvas`）

迁移目标是**业务代码零改动**，只换依赖与 import，三步完成：

**① 换依赖**（同号同批发版，`vue` 是 `/vue3` 门面的 optional peer，项目里已有则无需操作）：

```bash
npm uninstall @worm-vue3-print/canvas @worm-vue3-print/core
npm install @worm-print-platform/canvas @worm-print-platform/core
```

**② 换 import 与类型来源**（组件、工具、类型全部集中在 `/vue3` 子路径）：

```diff
- import { PrintDesigner, PrintHtmlPreview, createDefaultTemplate, renderHtmlPages, DEFAULT_DEMO_DATA } from '@worm-vue3-print/canvas'
- import type { PrintBusinessField, TemplateData } from '@worm-vue3-print/canvas'
- import '@worm-vue3-print/canvas/style.css'
+ import { PrintDesigner, PrintHtmlPreview, createDefaultTemplate, renderHtmlPages, DEFAULT_DEMO_DATA } from '@worm-print-platform/canvas/vue3'
+ import type { PrintBusinessField, TemplateData } from '@worm-print-platform/canvas/vue3'
```

`style.css` 的 import **删除**：`/vue3` 门面样式内置，无需也无法手动引 CSS。

**③ 换可选扩展包**（若用了图表插件）：

```bash
npm uninstall @worm-vue3-print/echarts @worm-vue3-print/echarts-common
npm install @worm-print-platform/echarts
```

```diff
- import { configureChartPlugin } from '@worm-vue3-print/echarts'
- import '@worm-vue3-print/echarts-common'
+ import '@worm-print-platform/echarts/ui'
```

图表插件由「源码引入 + 手动两步」合并为「npm 安装 + 一行 import 即注册」；
`configureChartPlugin()` 等能力从 `/kit` 子路径提供，用法不变。

## 4. 路径 B：零框架用户（`@worm-vue3-print/common`）

零框架 Custom Elements 形态整体同名更迁，标签仍是 `<print-designer>`：

**NPM 接入**：

```bash
npm uninstall @worm-vue3-print/common @worm-vue3-print/core
npm install @worm-print-platform/canvas @worm-print-platform/core
```

```diff
- import '@worm-vue3-print/common'
+ import '@worm-print-platform/canvas'
```

**UMD 直挂（无打包器）**：替换两份静态文件并改全局名。

```diff
- <link rel="stylesheet" href="./vendor/common.css">
- <script src="./vendor/common.js"></script>
+ <link rel="stylesheet" href="./vendor/canvas.css">
+ <script src="./vendor/canvas.js"></script>
```

```diff
- const designer = window.WormPrintCommon
+ const designer = window.WormPrintCanvas
```

业务代码只依赖 `<print-designer>` 标签、property 注入与 CustomEvent 的部分**一行不动**；
`canvas.js` 是自包含 UMD（core 与码制库内联），不再需要单独引 core。
若还装了图表插件，加一份 `echarts.js` UMD（`@worm-print-platform/echarts/dist/echarts.js`）即可，
注册表经 `globalThis` 固定 key 共享，无需任何额外接线。

## 5. 路径 C：源码 / 工作区引入用户（echarts、plugin-kit）

旧仓这三个包未发 npm，从源码或 monorepo 别名消费；新仓全部为 npm 正式包：

```bash
npm install @worm-print-platform/plugin-kit @worm-print-platform/echarts
```

- monorepo 源码消费：把 Vite `resolve.alias` 与 `tsconfig.paths` 里旧 `print-echarts` /
  `print-plugin-kit` 条目删掉，改为 npm 依赖；别名写法见集成技能的
  [安装方式](https://github.com/worm-longliu/worm-print-platform/blob/master/skills/worm-print-platform-integration/references/installation.md)。
- 旧 `@worm-vue3-print/core` 的独立用法（表达式引擎、同构渲染）改包名为
  `@worm-print-platform/core` 即可，子路径保持可用。

## 6. 行为差异要点

拆仓前两实现做过逐项对拍（见 `packages/canvas/PARITY.md`）；迁移后行为差异主要是
**「实现口径不同、功能等价」**的 15 条（PARITY.md §八），迁移期最可能感知的三条：

1. **插件设计器 UI 的消费通道变了**：旧 Vue 3 轨的 `registerElementExtension` /
   `resolveElementPropertyTab`（Vue 组件契约）不在新仓；统一走双注册表——
   元素语义用 core 的 `defineElementPlugin` + `registerElementPlugin`，
   设计器 UI 用 plugin-kit 的 `defineElementUI` + `registerElementUI`（纯 TS/DOM）。
   自定义插件的迁移方法见 [plugin-kit](../packages/plugin-kit/README.md)。
2. **浮层不再 Teleport 到 `document.body`**：帮助弹窗、表达式弹窗、色板面板都挂在
   `<print-designer>` 的 shadow root 内。宿主样式天然不污染浮层；若宿主页面有更高层叠
   元素或祖先带 `transform/filter/contain`，按 PARITY §八第 4 条调整。
3. **`native-controls.css` 子路径已删除**：`/vue3` 门面样式内置，零框架形态样式在
   `canvas.css`，无需单独引控件样式文件。

完整 15 条清单：[packages/canvas/PARITY.md](../packages/canvas/PARITY.md)（§八）。

## 7. 迁移验收

1. 类型检查与构建通过（Vue 3 项目无需 `isCustomElement` 配置）。
2. 设计器打开存量模板 JSON 能回填，保存导出后再次打开一致。
3. 三条出纸链路按需验证：浏览器预览打印 / 服务端 PDF / 桌面客户端静默打印。
4. 用了图表插件的项目：素材台出现「图表」分组，预览出图与迁移前一致。
5. 宿主集成可对照 `demos/apps/` 同框架工程逐项核对（验收脚本
   `node demos/scripts/verify-demo.mjs http://localhost:<端口>/`）。

## 8. AI 迁移提示词（复制给 AI 编程工具即可）

```text
【第 0 步 · 门控：未完成禁止改代码】
1. 安装集成技能：从 https://github.com/worm-longliu/worm-print-platform 仓库取
   skills/worm-print-platform-integration 整个目录，复制到你的技能目录并重载
   （Qoder：~/.qoder/skills/；Claude Code：~/.claude/skills/；或项目级同名目录）。
   无法安装时降级：完整阅读该目录下 SKILL.md 与 references/ 全部文档后再动手。
2. 完成后输出「已读规范确认」：逐个列出文件路径 + 与本任务相关的 3 条以上约束。
3. 检查本项目：列出 package.json 中全部 @worm-vue3-print/* 依赖与代码里全部
   @worm-vue3-print / WormPrintCommon 引用点，先盘清单再动手，禁止边改边找。
4. 任一信息缺失或读不懂，先提问，禁止臆测 API。

【迁移要求】
- 项目现状：宿主框架【Vue 3（SFC）| Vue 2.7 | React 18 | jQuery / 原生 JS】，
  接入形态【@worm-vue3-print/canvas 组件 | @worm-vue3-print/common 零框架】。
- 依赖替换（卸旧装新，同号同版、提交锁文件）：
  @worm-vue3-print/canvas / @worm-vue3-print/common → @worm-print-platform/canvas
  @worm-vue3-print/core → @worm-print-platform/core
  @worm-vue3-print/echarts + echarts-common → @worm-print-platform/echarts
- import 替换口径：
  · Vue 3 组件：全部 import 改到 @worm-print-platform/canvas/vue3（含 import type），
    删除 '@worm-vue3-print/canvas/style.css' 引入（门面样式内置）。
  · 零框架：import '@worm-vue3-print/common' → '@worm-print-platform/canvas'；
    UMD 场景产物 common.js/common.css → canvas.js/canvas.css，
    全局 window.WormPrintCommon → window.WormPrintCanvas。
  · 图表插件：两旧包合并为 import '@worm-print-platform/echarts/ui'（一行注册）。
- 业务代码零改动：组件模板、事件回调、ref 方法、<print-designer> 标签、
  property 注入与 CustomEvent 一律不动；禁止顺手重构。
- 自定义插件若有 registerElementExtension / resolveElementPropertyTab 用法，
  按 plugin-kit README 的 defineElementPlugin + defineElementUI 双注册表改写，
  改写前先给出对照方案确认。

【验收标准】
- 全仓 grep 不到 @worm-vue3-print 与 WormPrintCommon 残留（依赖与 import、UMD 全局名）。
- 类型检查 / 构建通过；存量模板 JSON 打开回填、保存导出再打开一致。
- 设计 → 保存 → 预览渲染真实业务数据 → 浏览器打印链路跑通；
  用了图表插件的项目素材台出现「图表」分组、预览出图正常。
- 只使用技能文档列出的 props / 事件 / ref 方法，不虚构 API。
```
