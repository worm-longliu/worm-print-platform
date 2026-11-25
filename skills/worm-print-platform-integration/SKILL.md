---
name: worm-print-platform-integration
description: 用于在各类宿主中集成 @worm-print-platform/canvas（零框架 Custom Elements 可视化打印设计器）或 @worm-print-platform/core（表达式/同构渲染管线）；覆盖 NPM/浏览器直挂安装、<print-designer> 契约接入、Vue 3 组件写法（canvas/vue3 门面，兼容原 @worm-vue3-print/canvas 用法）、Vue 2 / React / jQuery 等非 Vue 3 宿主与无打包器直挂（window.WormPrintCanvas 全局）、业务字段、浏览器打印 / 服务端 PDF（render 微服务）/ 桌面客户端静默打印三条链路、全栈宿主最小清单、AI 快速集成提示词与故障排查。
---

# worm-print-platform 集成支持

在修改用户项目前，先判断集成目标与宿主框架，再选择安装方式与打印链路。不要默认所有用户都需要浏览器直挂，也不要默认都需要服务端 PDF。

## 0. 先认清本仓架构（与其他打印库的关键差异）

- `packages/canvas`（`@worm-print-platform/canvas`）是设计器**权威实现**：原生 Custom Elements + Shadow DOM，零 Vue/React 依赖。统一标签 `<print-designer>`，全框架宿主走同一套 property + CustomEvent 契约。
- `packages/canvas/vue3`（`@worm-print-platform/canvas/vue3`）是 Vue 3 的**正式兼容门面**，导出 `PrintDesigner` / `PrintHtmlPreview` 组件，其 props / 事件 / `ref` 方法与原 `@worm-vue3-print/canvas` 的 Vue 3 组件同形（且为其超集）。**Vue 3 宿主应优先用这个门面**：原本消费 `@worm-vue3-print/canvas` 的项目，只需换依赖与 import 路径，模板、事件回调、ref 调用、业务逻辑一行不动即可迁移。底层仍是同一份零框架 canvas，vue 为本子路径的可选 peer。迁移步骤见 [接入 API](references/integration-api.md#3-vue-3-组件写法正式门面)。
- `packages/core`（`@worm-print-platform/core`）是纯 TS 逻辑：表达式引擎、同构渲染管线与设计器内核，子路径 `/designer`、`/browser`、`/client`、`/node`。
- 本仓**没有 `common` 包**（那是从 worm-vue3-print 拆仓前的旧包）。零框架 / 无打包器宿主直接消费 canvas 主入口或其 UMD 产物，见 [安装方式的直挂节](references/installation.md#浏览器直挂无打包器--jquery--传统项目) 与 [框架接入要点](references/framework-recipes.md)。
- 版本以 workspace 当前版本为准（`1.6.5`）；core 与 canvas 及 plugin-kit 同号同批发版，安装时不要只锁其中两个版本号。
- 打印插件更新源严格按 **npm → Gitee → GitHub**；`marketplace install <id> --force` 默认 `auto` 已遵循该顺序，npm 可用时不得手动切到 Git 源。
- 市场插件的 `dist` 是运行产物，必须随宿主提交；不要用通用 `dist/` 或整个 `.worm-print/` 忽略。入口由 `src/main.js/ts` 静态 import，不写进 Vite `optimizeDeps.include`。
- `--force` 使用暂存与原子切换，失败恢复旧插件、旧语言与旧清单；验收必须同时检查入口可导入、旧文件消失和三语 label/group 随 locale 切换。
- 图表数据源候选以宿主 `fields` 中的列表字段为权威，仅在没有列表字段时回退示例数据数组键；宿主还必须把真实 `printData` 注入 `PrintDesigner.designData`，避免 demo 数据混入业务下拉。
- 图表数据源、类目、数值与系列字段通过表达式编辑器字段页签选择，回写原始字段 key；数据源保留自动模式。旧宿主不支持 `openExpression` 时保留下拉兼容。

## 1. 先确认集成场景

| 场景 | 需要的包 | 推荐安装方式 |
| --- | --- | --- |
| 只做表达式求值、模板数据绑定、服务端 HTML/分页管线 | `@worm-print-platform/core` | NPM 包 |
| 需要可视化设计器或浏览器端打印预览（原生/React/Vue2 等） | `@worm-print-platform/canvas` + `@worm-print-platform/core` | NPM 包，主入口 `<print-designer>` |
| **Vue 3 宿主（含原 `@worm-vue3-print/canvas` 用户）想沿用组件写法（props / `@save` / `ref`）** | `@worm-print-platform/canvas/vue3` 正式门面 | NPM 包，可选 peer `vue`；换依赖与 import 即可迁移，组件代码不改 |
| 无打包器 / jQuery / 传统项目 | canvas UMD 产物（`dist/canvas.js` + `dist/canvas.css`） | 浏览器直挂，见 [安装方式的直挂节](references/installation.md#浏览器直挂无打包器--jquery--传统项目) |
| 需要未发布修复、调试库源码、修改/回传补丁 | core，按需 canvas / plugin-kit | 源码安装 |
| 服务端 PDF 微服务 | monorepo 内 `services/render`（`@worm-print-platform/render`，private，workspace 软链 core，**不发布 npm**） | 按 [服务端渲染](references/server-render.md) 部署 |
| 工位电脑无打印对话框静默出纸（小票/标签/针式多联/批量） | `@worm-print-platform/core/client` + 桌面客户端（`clients/client`，Electron） | core 子路径（无需另装 SDK）+ [静默打印](references/silent-print.md) |

生产项目优先 NPM 包。只有用户明确要改/调试库源码、消费未发布代码，或项目本身就在本 monorepo 中，才用源码安装。安装细节见 [安装方式](references/installation.md)。

## 2. 先让用户选打印链路（关键决策）

集成设计器后，「打印」有三条独立链路，可单选，也可并存：

| | 链路 A：浏览器打印 | 链路 B：服务端 PDF | 链路 C：桌面客户端静默打印 |
| --- | --- | --- | --- |
| 渲染位置 | 用户浏览器（core 同构渲染 + `window.print`） | `services/render` 微服务（Playwright Headless Chromium 两遍渲染） | 本机桌面客户端（Electron，`core/browser` 同构渲染 + `webContents.print` 静默出纸） |
| 额外基础设施 | 无 | 需部署 Node 微服务（Linux 需 Chromium + 中文字体） | 工位电脑安装并运行打印客户端；客户端仅监听 `127.0.0.1`，浏览器必须与客户端同机 |
| 产出 | 调起浏览器打印对话框 | `application/pdf` 字节流（可下载/归档/批量） | 物理打印机直接出纸，**无打印对话框** |
| 宿主后端职责 | 返回 `{templateJson, printData, baseUrl}` | 额外持有渲染密钥、代理转发 `/render/pdf` | 与链路 A 相同 |
| 适用 | 交互式打印、快速落地 | 电子存档、无界面批量、脱离浏览器的 PDF 产出 | 收银小票、热敏/标签、针式多联、批量无感出纸 |

真实全栈宿主通常**多链路并存**：业务页点打印先走 A 预览与浏览器打印，预览弹窗里「下载 PDF」按需走 B；工位出纸（小票/标签）走 C。三链路速览见 [打印链路](references/printing.md)，链路判定与最小集合见 [全栈宿主集成指南](references/host-integration-guide.md)，微服务对接见 [服务端渲染](references/server-render.md)，桌面客户端对接见 [静默打印](references/silent-print.md)。

## 3. 快速工作流

1. 读取用户项目的构建器、宿主框架、TypeScript 配置和现有上传/文件能力。**Vue 3 宿主（尤其原本用 `@worm-vue3-print/canvas` 的）走 `/vue3` 正式门面**；其余宿主用 canvas 主入口 `<print-designer>`。主入口零框架依赖，`/vue3` 门面把 `vue` 作为可选 peer。
2. 按 [安装方式](references/installation.md) 选择 NPM 或源码方案，先安装并验证可解析；Vue 3 迁移见 [接入 API 的迁移对照](references/integration-api.md#4-从-worm-vue3-printcanvas-迁移到本仓)。
   - 需要按官方仓库链接判断插件更新或安装方式时，按 [插件更新判断与按框架安装](references/plugin-update-flow.md) 执行：先取官方清单、读本地状态、识别框架，逐个询问用户确认后再操作。
3. 与用户确认打印链路（A / B / C / 并存）。
4. 按 [接入 API](references/integration-api.md) 接入设计器——原生宿主注册 `<print-designer>` 并注入 property、监听 CustomEvent（框架专属生命周期与坑见 [框架接入要点](references/framework-recipes.md)）；Vue 3 宿主用 `PrintDesigner` / `PrintHtmlPreview` 组件写法。再按 [全栈宿主集成指南](references/host-integration-guide.md) 落地模板管理、设计器页、业务打印入口与后端契约。
5. 用一条最小链路验证：设计器保存 JSON → **重新打开回填再预览一次**（画布会把 `<table>` 实测高度回写 `options.height`，动态表格需确认回写后下方元素仍落在表格之下）→ 浏览器打印；链路 B 再加「模板 JSON + printData → 后端 → render 服务 → PDF」；链路 C 再加「模板 JSON + printData → 本机客户端 → 物理打印机出纸」。
6. 需要 AI 读写当前画布时，按 [宿主 MCP 集成](references/mcp-host-integration.md) 接入桌面客户端实时会话。
7. 出现样式、类型、依赖解析、打包、PDF 或 MCP 会话问题时，按 [故障排查](references/troubleshooting.md) 定位，不要先改用户业务代码。

## 4. 宿主最小清单速查

无论技术栈，接入设计器需要宿主自行提供以下能力（库不内置任何业务后端）：

**前端（5 个必备片段）**
1. 模板管理列表页：模板元信息（名称/业务类型/备注/默认标记）的增删改查。
2. 设计器页：挂载 `<print-designer>`，`save` 事件提交模板 JSON，`preview` 事件打开预览（事件 `detail` 自带当前画布 JSON）。宿主接管打印/预览业务时用 `show-preview` / `show-save` 隐藏工具栏按钮（默认显示，隐藏不影响 `save()` 与事件旁路）；需要换肤时用 `theme` / `themeConfig` 传参（画布纸张不受影响），见 [集成指南 §5.2](references/host-integration-guide.md) 与 [接入 API §2](references/integration-api.md)。
3. 新建模板弹窗：元信息表单 + 用 `createDefaultTemplate()` 生成可渲染的初始 elements。
4. 业务打印入口（按钮组件）：按业务类型选模板 → 向后端取 `{templateJson, printData, baseUrl}` → 打开预览。
5. 预览弹窗：用 `@worm-print-platform/core/browser` 的 `renderHtmlPages` 同构渲染进全屏 iframe → `contentWindow.print()`；链路 B 再加「下载 PDF」；链路 C 再加 `PrintClient.printHtml()` 静默打印按钮。

**后端（任意语言/框架）**
1. 模板表：至少 `id / name / business_type / elements(text) / paper_config / remark / is_default`。
2. 业务字段元数据来源：返回 `PrintBusinessField[]`（`fieldKey/fieldLabel/fieldType/sortOrder` 契约，见接入 API）；可硬编码、配置表或注解反射生成。
3. 模板 CRUD + 设计器初始化聚合功能（一次返回模板 + 字段树 + 可选示例数据）。
4. 渲染数据组装功能：按模板 id + 业务单据 id 组装 `printData`，返回 `{templateJson, printData, baseUrl}`（链路 A / C 共用）。
5. 链路 B：代理 `services/render` 的 PDF 端点，注入 `X-Render-Key`，组装业务数据后透传。

链路 C 的打印机、份数、纸张等打印配置由宿主前端按模板维护（如 localStorage：模板 ID → 打印选项），随打印请求下发；客户端不持久化业务打印配置。

完整代码骨架与真实案例拆解见 [全栈宿主集成指南](references/host-integration-guide.md)。

## 5. 用 AI 工具快速集成（可直接复用的提示词）

当用户要让 AI 编程工具（opencode / Claude Code / Codex 等）在其项目中完成集成时，给 AI 的提示词应包含「先读规范再动手」的门控。可直接复制以下骨架并按项目填充：

```text
第 0 步（门控，未完成禁止改代码）：
1. 完整阅读打印设计器集成技能文档：SKILL.md 及 references/ 下
   installation.md、integration-api.md、host-integration-guide.md
   （链路 B 再加 server-render.md；宿主 MCP 再加 mcp-host-integration.md）、troubleshooting.md。
2. 先输出「已读规范确认」：逐个列出文件路径 + 与本任务相关的 3 条以上约束。
3. 阅读本项目的 AGENTS.md / README / 构建配置，确认宿主框架、构建器与包管理器。
4. 任一文档不存在或读不懂，先提问，禁止臆测 API。

集成要求：
- 安装方式：【NPM 包 / 浏览器直挂 / 源码别名】；宿主形态：【Vue 3 组件门面 / 原生 print-designer 元素 / 浏览器直挂】；打印链路：【A 浏览器 / B 服务端 PDF / C 桌面客户端静默打印 / 并存】。
- 按技能「宿主最小清单」实现前端 5 个片段与后端契约，复用项目现有的
  请求封装、UI 组件库、上传接口与代码风格，不引入额外 UI 依赖。
- 若项目原本用 @worm-vue3-print/canvas：改用 @worm-print-platform/canvas/vue3，
  组件模板与业务逻辑不动（仅换依赖与 import）；新 Vue 3 项目同样优先用该门面。
- 原生宿主用 <print-designer> 自定义元素：对象/函数（fields/template/fonts/uploadImage）
  一律赋 property，字符串开关用 attribute；事件用原生 CustomEvent 监听。
- 业务字段按 PrintBusinessField 契约由【后端接口/本文件常量】提供。
- 模板 JSON（elements）与宿主元信息分开存储；元信息由宿主表维护。

验收标准：
- 类型检查/构建通过；设计器能保存模板 JSON 并再次打开回填。
- 最小链路跑通：保存 → 预览渲染出含真实业务数据的页面 → 浏览器打印
  （链路 B：后端代理返回可下载的 application/pdf；链路 C：本机客户端静默出纸）。
- 不使用文档之外的组件方法/事件（例如不存在 setTemplateMeta、back 事件）。
```

## 6. 验收要点（委托或集成完成后逐项核对）

- 安装方式与样式导入匹配：NPM/`file:` 用 `@worm-print-platform/canvas/style.css`；浏览器直挂用 UMD 产物 + `dist/canvas.css`；Vue 3 门面从 `@worm-print-platform/canvas/vue3` 导入组件，无需额外引样式。
- Vue 3 门面：组件从 `@worm-print-platform/canvas/vue3` 导入；`PrintDesigner` props `initial-template/initial-elements/fields/is-edit/upload-image/show-help/show-preview/show-save/theme/theme-config/fonts/design-data`，事件 `save(json)` / `preview()`（无载荷），expose `getTemplateJson()`（返回对象）/ `validateTemplate()` / `getGeometryWarnings()`；`PrintHtmlPreview` props `template-json/print-data/base-url/font-base-url/renderers`，事件 `rendered` / `error`，expose `print/rerender/setViewZoom`。业务代码与旧 Vue 3 轨一致，不改。
- 原生 `<print-designer>` 只用真实契约：attribute `template/fields/name/fonts/design-data` + 布尔开关 `is-edit/show-help/show-preview/show-save` + `theme`/`theme-config`；方法 `getTemplateJson/loadTemplate/save/validateTemplate/getGeometryWarnings`；事件 `save/preview/help/dblclick-element/dblclick-cell`。可运行时读 `getHostContract()` / `PrintDesignerElement.contractVersion` 自检（当前 1.2.0）。`show-preview` / `show-save` 控制工具栏「预览 / 保存」按钮显隐（默认显示），隐藏不影响 `save()` 与 `save`/`preview` 事件，供宿主自定义打印/预览业务。
- 显示配置（契约 1.2.0 起）：`theme`（`auto`/`light`/`dark` 预设）与 `themeConfig`（色值覆盖对象，须赋 property）管配色，`showPreview`/`showSave` 管按钮显隐；参数优先级高于 CSS 令牌，深色预设不动纸张与画布。宿主可仿照四个 demo 顶部「配置」弹窗，把这几项状态写回元素 property（demo 示例只暴露显隐开关，配色靠传参）；细节见 [接入 API §2](references/integration-api.md)。
- 原生宿主：对象与函数赋 property，不写进 attribute；`fields` 只有 setter，读回看 `el.store.fields`。
- 原生事件：`save`/`preview` 的 `event.detail` 是模板 JSON 字符串；`dblclick-element` 的 detail 是元素 id 字符串，`dblclick-cell` 是 `{ elementId, r, c, cellId }` 对象，后两者不做 `JSON.parse`。这与门面组件 `@save` 首参为 json 字符串、`@preview` 无载荷的口径不同，按所用形态对齐。
- 模板 JSON 与宿主元信息分离；列表/详情能正确回填 elements。
- 链路 A 预览与打印用同一份 `templateJson + printData + baseUrl`。
- 链路 B：密钥只在服务端/代理层，不进前端 bundle；render 服务 `/health` 可达，Linux 已装中文字体。
- 链路 C：`PrintClient.connect()` 握手成功、`listPrinters()` 能枚举、`print()`/`printHtml()` 指定打印机/份数出纸；`BUSY` 时由宿主侧重试，客户端不排队。
- 表格数据：明细 `fieldType:'list'`、列表达式用完整路径（如 `{goods.name}`）、printData 对应字段为数组。
- 表格下方元素：`top` ≥ 表格设计底部（`top + max(height, 行高合计)`）+ 1~2mm 间隙；动态表格（`dataSource`）的 `height` 按画布展开态声明（表头 + data 行高 × 预览行数 + 小计/合计），不能只写静态行高合计，否则设计器保存回写实测高后下方元素掉出跟随区、渲染落进表格（三链路同判据，刻意层叠覆盖例外）。验收要保存后重新打开再预览一次，确认两版落位一致。
- 码图净空：`hline` / `vline` 不得横穿 `barcode` / `qrcode`（`print_inspect_layout` 的 `LINE_OVER_CODE` 为 error）；码底边与下方分隔线/文字至少留 1mm，避免出纸后压线压字。

## 7. 关键约束

- `core` 是纯 TypeScript，无 Vue/React 依赖；`canvas` 主入口零框架，只有 `/vue3` 子路径把 `vue` 作为可选 peer，边界不能倒置。
- 浏览器直挂拿不到裸包名，一切能力从全局 `window.WormPrintCanvas` 取（含 `registerAll`、`renderHtmlPages`、`browserCodeRenderer`、`PrintClient`、`WormPrintError`、纸张几何工具），不要尝试解析 bare import。
- **Vue 3 兼容是一等支持路径，不是降级方案**：`@worm-print-platform/canvas/vue3` 与 `@worm-vue3-print/canvas` 组件同形（后者是同源 Vue 3 轨）。Vue 3 宿主用它即可，模板/事件/ref 一律不改；不要为了让 Vue 3 项目改用 `<print-designer>` 原生元素而重写业务代码。
- NPM 包样式入口是 `@worm-print-platform/canvas/style.css`；canvas 用 Shadow DOM 内联注入样式，普通用法不需要额外引 CSS，只有 light DOM 形态才引该样式文件；`/vue3` 门面组件自身处理样式，宿主也不引 CSS。
- `<print-designer>` 事件全部 `bubbles + composed`；`preview` 事件携带模板 JSON 字符串（`/vue3` 门面转回无参 emit）。不存在 `back` 事件或 `setTemplateMeta` 方法——返回导航与模板元信息都属宿主业务层。
- 常用导出：`registerAll` / `PrintDesignerElement` / `createDefaultTemplate` / `DesignerStore` 来自 `@worm-print-platform/canvas`；`/vue3` 门面导出 `PrintDesigner`、`PrintHtmlPreview`、`renderHtmlPages`、`browserCodeRenderer`、`createDefaultTemplate`、`toRuntimePool`、`DEFAULT_DEMO_DATA`、`getDemoData`、工具栏溢出相关 hooks 与 `@worm-print-platform/core/designer` 全量类型。`import type` 可直接把旧 `@worm-vue3-print/canvas` 换成 `@worm-print-platform/canvas/vue3`。
- 模板 JSON 不含名称、业务类型、备注等宿主元信息，元信息由宿主自行持久化。
- 服务端 PDF 由 `services/render` 微服务承担；`core` 只提供同构渲染管线。接入方业务仓库不要虚构 `/render/pdf` 的实现。
- 宿主 MCP 实时画布使用 `@worm-print-platform/core/client` 的 `PrintClient`，写回必须校验 `baseRevision`；`demos/shared/template-session.ts` 是参考实现，不是库公开 API。
- 静默打印客户端是 monorepo 内 `clients/client`（Electron，private，不发布 npm），浏览器侧 SDK 为 core 子路径 `@worm-print-platform/core/client`（无需单独安装）；协议消息类型与错误码定义在该子路径内，两端永不漂移。
- 客户端仅绑定 `127.0.0.1`、单任务串行：并发任务返回 `BUSY`，由宿主端排队重试，客户端不做离线队列与失败补打。
- 连续纸（模板 `paperSize: 'CONTINUOUS'`）模板无需传纸高，出纸高度由客户端按渲染内容自动推导；普通纸始终使用模板纸张，`print.paperSize`/`paperName` 仅作覆盖项。
