# 开始之前（Before You Start）

[← 返回目录](./README.md) | 下一篇：[Vue 3 接入](./02-vue3.md) →

> 目标：读完你能确定「用哪些包、走哪条打印链路、宿主要提供什么」，并让 AI 工具先装规范再动手。
> 适用范围：当前稳定主线 1.6.6；`core` / `canvas` / `plugin-kit` 同号同批发版。

## 1. 前置条件（Prerequisites）

- Node.js ≥ 18、npm（项目侧）；接入 Vue/React 宿主时按宿主本身要求。
- 一个可运行的宿主工程（后续框架篇会从零建最小工程）。
- 打印链路（A / B / C）由业务决定，先确认再实现。

## 2. 三条打印链路（Printing Paths）

三条链路吃同一份 `templateJson + printData + baseUrl`，可单选、可并存：

| 链路 | 渲染位置 | 额外基础设施 | 产出 | 适用 |
| --- | --- | --- | --- | --- |
| **A 浏览器打印** | 用户浏览器（core 同构渲染 + `window.print`） | 无 | 浏览器打印对话框 | 交互式打印、快速落地（各框架文档默认） |
| **B 服务端 PDF** | `services/render` 微服务（Playwright Headless Chromium） | 部署 Node 微服务（Linux 需 Chromium + 中文字体） | `application/pdf` 字节流 | 电子存档、无界面批量 |
| **C 桌面客户端静默打印** | 本机 Electron 客户端（`127.0.0.1:17521`） | 工位安装并运行客户端，须与浏览器同机 | 物理出纸、无对话框 | 小票、标签、针式多联、批量无感 |

深入文档（集成技能 `references/`，安装见第 3 节）：链路总览 `printing.md`、服务端渲染 `server-render.md`、静默打印 `silent-print.md`、全栈宿主 `host-integration-guide.md`。

## 3. 包与技能（Packages & Skills）

### 3.1 该装哪些包

| 场景 | 包 | 方式 |
| --- | --- | --- |
| 只做表达式/绑定/服务端 HTML 分页 | `@worm-print-platform/core` | NPM |
| 可视化设计器/浏览器预览（Vue2、React、原生） | `@worm-print-platform/canvas` + `@worm-print-platform/core` | NPM，主入口 `<print-designer>` |
| Vue 3（含 `@worm-vue3-print` 老用户） | `@worm-print-platform/canvas/vue3` 门面 + `core` | NPM，可选 peer `vue`，换依赖与 import 即可迁移 |
| 无打包器 / jQuery | canvas UMD 产物（`dist/canvas.js` + `dist/canvas.css`） | 浏览器直挂 |
| 服务端 PDF | 仓库内 `services/render`（私有，不发布 npm） | 按 `server-render.md` 部署 |
| 桌面静默打印 | `@worm-print-platform/core/client` + 仓库内 `clients/client`（私有） | core 子路径，无需另装 SDK |

> `contract` / `mcp` / `render` / `client` 不发布 npm；发布到 npm 的是 `core`、`plugin-kit`、`canvas`、`echarts`、`skills`、`marketplace`、`i18n` 七个包。百度图表插件 `@worm-print-platform/plugin-echarts` 不再单独发 npm，通过插件市场 CLI 分发；兼容镜像 `@worm-print-platform/echarts` 随主线发版。

### 3.2 官方技能（Skills）

技能让 AI 在动手前先读规范、按既定方式接入。三个技能：

| 技能 | 覆盖范围 | 适用文档 |
| --- | --- | --- |
| `worm-print-platform-integration` | 全形态宿主集成：门面与 `<print-designer>` 契约、四框架/无打包器、三条链路、宿主最小清单、MCP、排错 | 01–05、09 |
| `worm-print-platform-i18n` | 自定义语言包生成/校验/审核/三端接入与排错 | 06 |
| `worm-print-platform-mcp` | 桌面 MCP 工具：AI 实时读写画布、模板生成校验、视觉回读 | 可选增强，任何框架 |

### 3.3 技能安装命令（cwd = 当前项目根目录）

**方式 A：npx 安装器（推荐）**。默认源为 GitHub → 失败自动回退 Gitee；需要指定源时加 `--repo`：

```bash
npx @worm-print-platform/skills worm-print-platform-integration --force
npx @worm-print-platform/skills worm-print-platform-i18n       --force
npx @worm-print-platform/skills worm-print-platform-mcp         --force

# 指定 Gitee 源（国内网络快）
npx @worm-print-platform/skills worm-print-platform-integration \
  --repo https://gitee.com/liulong_oschina/worm-print-platform.git --force
```

| 参数 | 说明 | 默认值 |
| --- | --- | --- |
| `<技能名>` | 必填，单个技能名 | — |
| `--repo <地址>` | 仓库地址（GitHub / Gitee 或 `owner/repo` 简写） | GitHub 优先，失败回退 Gitee |
| `--dir <目录>` | 技能根目录，装到 `<目录>/<技能名>/` | `.agents/skills` |
| `--force` | 目标已存在时覆盖（默认拒绝并报错） | 否 |
| `-h, --help` / `-v, --version` | 帮助 / 版本 | — |

**方式 B：仓库源码手动取用（离线回退）**。无 npm / git 时，从 [GitHub](https://github.com/worm-longliu/worm-print-platform) 或 [Gitee](https://gitee.com/liulong_oschina/worm-print-platform) 仓库的 `skills/<技能名>/` 下载整个目录，放到 AI 工具的技能目录并重载。

> **验证**：`ls .agents/skills/` 应能看到所装技能目录；若 `npx` 返回 404，先区分「包未发布 / 镜像未同步 / 网络受限」，再按方式 B 回退，不要判定为命令写错。

## 4. 宿主最小清单（Host Checklist）

库不内置业务后端。无论技术栈，接入设计器需要宿主自行提供：

**前端 5 个必备片段**

1. 模板管理列表页：元信息（名称/业务类型/备注/默认标记）增删改查。
2. 设计器页：挂载 `<print-designer>`，`save` 提交模板 JSON，`preview` 打开预览；宿主自管打印/预览时用 `show-preview` / `show-save` 隐藏工具栏按钮（默认显示）；换肤用 `theme` / `themeConfig`（只影响外壳，不动纸张）。
3. 新建模板弹窗：元信息表单 + `createDefaultTemplate()` 生成初始 elements。
4. 业务打印入口：按业务类型选模板 → 取 `{templateJson, printData, baseUrl}` → 打开预览。
5. 预览弹窗：`@worm-print-platform/core/browser` 的 `renderHtmlPages` 渲染进全屏 iframe → `contentWindow.print()`；按需加「下载 PDF」(B) 与静默打印 (C) 按钮。

**后端（任意语言/框架）**

1. 模板表：`id / name / business_type / elements(text) / paper_config / remark / is_default`。
2. 字段元数据：返回 `PrintBusinessField[]`（`fieldKey/fieldLabel/fieldType/sortOrder`），可硬编码、配置表或注解反射。
3. 模板 CRUD + 设计器初始化聚合（一次返回模板 + 字段树 + 可选示例数据）。
4. 渲染数据组装：按模板 id + 业务单据 id 组装 `printData`，返回 `{templateJson, printData, baseUrl}`（A/C 共用）。
5. 链路 B：代理 `services/render` 的 PDF 端点，注入 `X-Render-Key`，密钥不进前端 bundle。

## 5. AI 提示词模板（唯一模板源）

下方是 AI Agent 接入提示词模板，与根目录 README「一句话最小化接入提示词」同源，修改需同步两处；各框架篇（02–05）与专篇（06–08）只补齐各自场景差异，不再重复完整模板。整段复制给 AI Agent 即可，无需替换占位符——它会先探测项目技术栈，再逐项与你确认。

```text
请帮我接入 worm-print-platform（仓库：https://gitee.com/liulong_oschina/worm-print-platform）。严格按以下阶段执行，我逐项确认前不要改任何代码；提问一次只问一个问题。

【第 1 步 · 只读探测当前项目技术栈（不改代码）】
检查 package.json 的 dependencies / devDependencies、构建配置（vite / webpack / rsbuild 等）、
源码目录与现有代码风格、是否已装 @worm-print-platform/* 及版本、现有请求封装与 UI 组件库。
据此判断：宿主框架与版本（Vue 3 / Vue 2.7 / React 18 / jQuery 或原生 JS）、构建器、包管理器。
探测不到标「未知」不要猜测；先把探测结果列出来让我确认，不对的地方我会纠正。

【第 2 步 · 依次确认接入范围（确认前不要动手）】
探测结果确认后，按顺序逐个问我以下四个问题：
1) 是否需要百度图表插件，用于图表打印？
2) 是否需要国际化配置，用于切换多语言？
3) 是否需要数据源预览功能？
4) 是否创建或者修改现有的打印模板管理功能（打印模板的增删改查）？
另需一并确认打印链路：A 浏览器打印 / B 服务端 PDF / C 桌面静默打印（可多选，交互式默认 A）。
我的回答决定后续装哪些包、技能与文档，未确认不要开始实现。

【第 3 步 · 确认后装技能、读规范（门控）】
1) 在当前项目根目录安装官方技能（默认 GitHub→Gitee 回退，npx 404 时按仓库 skills/<技能名>/ 源码回退）：
   npx @worm-print-platform/skills worm-print-platform-integration --force
   需要国际化再加 worm-print-platform-i18n；需要 AI 实时读写画布再加 worm-print-platform-mcp。
2) 完整阅读装好的 .agents/skills/<技能名>/SKILL.md 与 references/ 相关文档；
   必读 docs/guide/AGENTS.md（文档地图与硬性约束）、docs/guide/01-getting-started.md（链路选型与包清单）。
   按我的回答补读：框架篇 docs/guide/02-vue3.md / 03-vue2.md / 04-react.md / 05-jquery.md；
   图表与数据源预览 → 07-plugin-install.md；国际化 → 06-i18n.md；
   模板管理 → demos/apps/print-demo 的 README.md 与 PROMPT.md。
   以上路径均在 https://gitee.com/liulong_oschina/worm-print-platform/raw/master/ 下。
3) 先输出「已读规范确认」：逐个列出文件路径 + 与本任务相关的 3 条以上约束；
   任一文档缺失或读不懂先提问，禁止臆测 API。

【第 4 步 · 按选择映射依赖（注意包名口径）】
- 必选 core + canvas + plugin-kit 同号同批安装并提交锁文件，npm ls 核对；Vue 3 优先用 @worm-print-platform/canvas/vue3 门面，其余宿主用 <print-designer> 原生元素。
- 百度图表：装 npm 兼容镜像 @worm-print-platform/echarts 并从 @worm-print-platform/echarts/ui import 即注册；@worm-print-platform/plugin-echarts 已不在 npm 发布，不要按该名字 npm install（市场分发用 npx @worm-print-platform/marketplace install echarts）。
- 数据源预览：市场 id 为 data-preview，但 @worm-print-platform/plugin-data-preview 未发布 npm；用 npx @worm-print-platform/marketplace install data-preview --force 安装，市场运行产物已纳入 Git。它只提供 openDataPreview() API，入口由宿主挂载。
- 国际化：按 06-i18n.md 生成、校验语言包并三端接入。
- 模板管理：参考 https://gitee.com/liulong_oschina/worm-print-platform/tree/master/demos/apps/print-demo。它是参考而非直接复制：其 file:../../../packages/canvas 依赖换成 npm 同号包，MSW + localStorage 模拟后端换成项目真实接口，demo 仅实现链路 A；模板 JSON（elements）与宿主元信息分开存储。

【第 5 步 · 最小化实现与验收】
复用项目现有请求封装、UI 组件库与代码风格，不引额外 UI 依赖；库不内置业务后端，按「宿主最小清单」实现前端片段与后端契约；不使用文档之外的组件方法/事件（如 back、setTemplateMeta）。
验收：类型检查/构建通过；设计器保存模板 JSON 后重开能回填；最小链路跑通（保存 → 预览渲染真实业务数据 → 打印）；勾选图表则图表元素可见，勾选数据源预览则入口可打开；命令标注 cwd，失败先区分环境限制与文档缺口。
```

## 6. 排错（Troubleshooting）

| 症状 | 原因 / 处理 |
| --- | --- |
| `npx @worm-print-platform/skills` 返回 404 | 包未发布 / 镜像未同步 / 网络问题；按第 3.3 节方式 B 源码回退 |
| 设计器只装了 `canvas` 却报 core 相关错 | 二者同号同批发版，必须一起装并 `npm ls` 核对 |
| 不知道走哪条打印链路 | 交互式先用 A；要归档 PDF 加 B；工位无对话框出纸加 C |
| AI 臆测出不存在的 props / 事件 | 门控未执行；让其重读 SKILL.md 与 `references/integration-api.md` |

[← 返回目录](./README.md) | 下一篇：[Vue 3 接入](./02-vue3.md) →
