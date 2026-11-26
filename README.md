<h1 align="center">worm-print-platform</h1>

<p align="center">
  <em>MIT 开源 · 零框架 Custom Elements 设计器 · 插件系统扩展</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/npm-v1.6.6-384BFF" alt="npm version">
  <img src="https://img.shields.io/badge/node-%E2%89%A520-4B9B4B" alt="node">
  <img src="https://img.shields.io/badge/TypeScript-5.4%2B-3178C6" alt="typescript">
  <img src="https://img.shields.io/badge/license-MIT-9A9A9A" alt="license">
  <a href="https://gitee.com/liulong_oschina/worm-print-platform">
    <img src="https://img.shields.io/badge/Gitee-worm--print--platform-C71D23?logo=gitee&logoColor=white" alt="Gitee">
  </a>
  <a href="https://github.com/worm-longliu/worm-print-platform">
    <img src="https://img.shields.io/badge/GitHub-worm--print--platform-181717?logo=github&logoColor=white" alt="GitHub">
  </a>
  <a href="https://worm-longliu.github.io/worm-print-platform/">
    <img src="https://img.shields.io/badge/demo-live-FF6B35" alt="demo">
  </a>
  <a href="https://www.npmjs.com/org/worm-print-platform">
    <img src="https://img.shields.io/badge/npm%20scope-@worm--print--platform-CB3837?logo=npm" alt="npm scope">
  </a>
</p>

## 特性

- 🎨 **零框架 Custom Elements** — 原生 Custom Elements + Shadow DOM 实现，零 Vue/React 依赖，Vue 3 / Vue 2 / React / jQuery / 原生 JS 共用同一套设计器
- 🧩 **插件系统** — 内置 11 类元素 + 第三方插件走同一张注册表、同权扩展；import 即注册，配套插件市场 CLI
- 🔗 **同构渲染管线** — 同一份模板与数据，浏览器预览、服务端 PDF、桌面客户端静默打印三条链路产出完全一致
- ⚡ **表达式引擎** — 自研词法/语法/安全求值器，支持 `formatMoney` / `sum` / `concat` 等内置函数
- 🧾 **专业版式能力** — 表格分页、重复表头、小计/汇总、合并单元格、连续纸、拼版（多标签铺满 A4）、水印
- 📊 **可选 ECharts** — SVG SSR 图表元素包，十类图表设计态可配置
- 🤖 **MCP / AI 友好** — 桌面客户端提供 MCP 工具，AI Agent 可实时读写画布、生成校验模板

## 在线演示

五个宿主工程的静态演示页（同一套设计器、同一套示例库）：

👉 <https://worm-longliu.github.io/worm-print-platform/>

## 快速开始

把 worm-print-platform 作为打印插件接入你的系统？
[阅读完整使用文档 →](./docs/guide/README.md)
文档覆盖四类框架接入、多语言配置、插件安装配置与插件开发；内置 AI Agent 接入提示词与官方技能（npx 一键安装），[可直接粘给 AI 工具按规范接入](./docs/guide/01-getting-started.md#5-ai-提示词模板唯一模板源)。AI 工具请先读 [docs/guide/AGENTS.md](./docs/guide/AGENTS.md)。

### 打印插件更新源优先级（AI Agent 必读）

在宿主项目更新打印插件时，严格按照 **npm → Gitee → GitHub** 的顺序：npm 可用时不得切换到 Git 源；npm 不可用时再试 Gitee，最后才试 GitHub。默认 `npx @worm-print-platform/marketplace install <id> --force` 已按该顺序回退；需要指定单一来源时显式使用 `--source npm|gitee|github`，并在交付中记录实际命中的来源。

拿到官方仓库链接、需要判断某个插件是否有更新或按宿主前端框架安装时，按官方技能 `worm-print-platform-integration` 的[插件更新判断与按框架安装](./skills/worm-print-platform-integration/references/plugin-update-flow.md)执行：只读取官方清单与宿主本地状态，逐个询问用户确认后再操作，不擅自安装或升级。

### 快速接入

把下面这整段粘给 AI Agent，它会**先只读探测技术栈并列出让你确认，再依次询问接入范围，确认后按规范装技能、读文档、最小化改动**完成接入；无需 clone 本仓。四个范围问题（图表 / 国际化 / 数据源预览 / 模板管理）原样保留，并补齐了仓库要求的门控与包名口径。

```
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

> 上述路径均来自 Gitee 镜像的 `master` 分支 raw 文件；如需 GitHub 源，把域名换成 `https://raw.githubusercontent.com/worm-longliu/worm-print-platform/master/`。

**给 AI Agent 的提示词片段**（安装官方技能版，可整段复制）：

```
请先在项目根目录执行以下命令安装 worm-print-platform 的官方技能规范，再开始接入开发：

npx @worm-print-platform/skills worm-print-platform-integration --force

默认安装到 .agents/skills/worm-print-platform-integration/（OpenAI 规范位置）。
默认源 GitHub 优先、失败自动回退 Gitee；需要指定 Gitee 源时加 --repo 参数；
需要其他技能目录（如 .claude/skills / .qoder/skills）时加 --dir 指定。
安装完成后，请完整阅读该目录下的 SKILL.md 与 references/ 中与任务相关的文档。
```

详细说明见 [docs/guide/01-getting-started.md 的 3.3 技能安装命令](./docs/guide/01-getting-started.md)。

### 仓库开发

```bash
git clone https://github.com/worm-longliu/worm-print-platform.git
npm install
npm run build          # 按依赖序构建全部 workspace
npm test               # 全量测试（Playwright 集成测试需 npx playwright install chromium）

npm run dev:demos:all  # 五个宿主 demo + :9300 总览页
npm run dev:core       # 仅 core 包 watch 构建
npm run dev:render     # 服务端 PDF 渲染微服务（:3001）
npm run dev:client     # Electron 静默打印客户端
```

完整命令索引（开发 / npm 发布 / 客户端打包 / Docker）：[docs/commands.md](./docs/commands.md)。

## 架构与分层

```
core（纯 TS：表达式引擎 + 同构渲染管线 + 设计器内核）
  ├─ designer  ──  框架无关的模型、工具、交互逻辑
  ├─ render    ──  HTML 生成 / 数据绑定 / 分页
  ├─ browser   ──  浏览器端渲染适配器
  └─ client    ──  桌面客户端 SDK

plugin-kit（插件 UI 契约与注册表）

canvas（Web Components 设计器权威实现 ← core + plugin-kit）
  └─ /vue3  ──  Vue 3 兼容门面（可选 peer）

plugin-echarts（marketplace/plugins/echarts：图表插件唯一源码真源）
  └─ 同一源码构建 echarts 兼容镜像 + 市场安装产物（README 统一市场口径）

echarts（兼容镜像包 ← 同一源码；保留原包名与子路径，存量依赖零改动）
  ├─ /kit  ──  框架无关纯 TS 能力
  ├─ /ui   ──  设计器 UI（import 即注册）
  └─ /node ──  服务端执行器

render（Playwright PDF 微服务，私有 Docker 部署）
client（Electron 静默打印桌面客户端，私有分发）
contract / mcp（私有：契约校验 + MCP 工具库，随 client 打包）
skills（npm 发布：命令行技能安装器）
marketplace（npm 发布：插件市场 CLI，三源安装单个插件）

宿主应用 ← Vue 3 / Vue 2 / React / jQuery / 原生 JS
```

**三条打印链路**（同一份 `templateJson + printData + baseUrl`）：

| 链路 | 说明 | 适用场景 |
| --- | --- | --- |
| A · 浏览器打印 | core 同构渲染进 iframe → `contentWindow.print()` | 零基础设施、快速接入 |
| B · 服务端 PDF | `services/render` 微服务（Playwright），后端代理密钥 | 需要可下载 PDF、批量打印 |
| C · 静默打印 | 本机 Electron 客户端 `PrintClient.printHtml()`，无对话框 | 桌面终端、标签机 |

## 包总览（npm workspaces）

| 目录 | 包名 | 发布 | 说明 |
| --- | --- | --- | --- |
| `packages/core` | `@worm-print-platform/core` | ✅ npm | 表达式引擎 + 同构渲染管线 + 框架无关设计器内核 |
| `packages/plugin-kit` | `@worm-print-platform/plugin-kit` | ✅ npm | 插件设计器 UI 契约与注册表（纯 TS/DOM） |
| `packages/canvas` | `@worm-print-platform/canvas` | ✅ npm | 设计器权威实现（Custom Elements + Shadow DOM） |
| `marketplace/plugins/echarts` | `@worm-print-platform/plugin-echarts` | ❌ 市场分发 | 百度图表插件唯一源码真源（不再单独发 npm，走市场 CLI） |
| `packages/echarts` | `@worm-print-platform/echarts` | ✅ npm | 同一源码生成的兼容镜像包（十类 kind，存量依赖零改动） |
| `packages/skills` | `@worm-print-platform/skills` | ✅ npm | 命令行技能安装器（bin：`worm-print-skills`） |
| `packages/marketplace` | `@worm-print-platform/marketplace` | ✅ npm | 插件市场 CLI（bin：`worm-print-marketplace`，三源安装） |
| `packages/contract` | `@worm-print-platform/contract` | ❌ 私有 | 模板 JSON 契约校验（随 client 打包） |
| `packages/mcp` | `@worm-print-platform/mcp` | ❌ 私有 | MCP 协议实现（随 client 打包） |
| `services/render` | `@worm-print-platform/render` | ❌ 私有 | Playwright PDF 渲染微服务（Docker 部署） |
| `clients/client` | `@worm-print-platform/client` | ❌ 私有 | 跨平台静默打印桌面客户端（Electron） |

## 各框架接入导航

每个宿主框架一份接入文档，含最小操作方法 + AI 编程工具提示词。

| 框架 | 文档 | 接入形态 | 可运行示例 | 端口 |
| --- | --- | --- | --- | --- |
| Vue 3 | [用户使用文档 · Vue 3](./docs/guide/02-vue3.md) | `@worm-print-platform/canvas/vue3` 组件门面 | `demos/apps/vue3` | 9331 |
| Vue 2.7 | [用户使用文档 · Vue 2.7](./docs/guide/03-vue2.md) | `<print-designer>` + `registerAll()` | `demos/apps/vue2` | 9332 |
| React 18 | [用户使用文档 · React 18](./docs/guide/04-react.md) | `<print-designer>` + `addEventListener` | `demos/apps/react` | 9335 |
| jQuery / 原生 JS | [用户使用文档 · jQuery/原生 JS](./docs/guide/05-jquery.md) | UMD 直挂 `window.WormPrintCanvas` | `demos/apps/jquery` | 9334 |

- 老用户迁移：[docs/migration-worm-vue3-print.md](./docs/migration-worm-vue3-print.md)
- 五个 demo 的总览页在 `:9300`，一条命令拉起：`npm run dev:demos:all`

## 插件化自定义元素

设计器只保留通用机制，具体元素由插件包提供。官方参考实现 `@worm-print-platform/plugin-echarts` 用一个插件注册十类图表，源码位于插件市场 `marketplace/plugins/echarts/`。插件分两层契约（按元素 `type` 对齐）：

| 层 | 入口 | 负责 |
| --- | --- | --- |
| 元素语义 | `core/designer` 的 `defineElementPlugin` | kind 类型、默认值、属性元数据、绑定、出图、校验 |
| 设计器 UI | `plugin-kit` 的 `defineElementUI` | 画布与属性台的 DOM 渲染，一份 UI 零框架消费 |

```ts
// 市场口径：一次副作用 import 完成插件描述符 + 设计器 UI 注册
import '@worm-print-platform/plugin-echarts'
// 按子路径按需引入
import '@worm-print-platform/plugin-echarts/kit'
import '@worm-print-platform/plugin-echarts/ui'
```

自定义插件写法见 [packages/plugin-kit/README](./packages/plugin-kit/README.md)。

插件市场（索引与插件源码常驻本仓 `marketplace/`，三源安装、缺省最新稳定版）见
[用户使用文档 · 插件安装与配置](./docs/guide/07-plugin-install.md)，索引格式与命名规范见
[插件市场规范](./docs/plugin-market-spec.md)。百度图表插件源码真源在
`marketplace/plugins/echarts/`，同一源码发布 `@worm-print-platform/plugin-echarts`（市场主口径）与
`@worm-print-platform/echarts`（兼容镜像，存量依赖零改动），两者 README 统一为市场口径。

## 桌面客户端（静默打印）

客户端用于**链路 C**，安装包随 GitHub Releases 分发：

👉 [v1.6.6 安装包 & SHA256SUMS](https://github.com/worm-longliu/worm-print-platform/releases/tag/v1.6.6)（macOS x64 / arm64、Windows x64 与 Linux x64 均已随 v1.6.6 重新打包上传）

<!-- 维护提示：仅当新版确实重新打包并上传客户端安装包（release 资产存在）时，才替换下方直链与版本号；纯设计器发版请保留历史链接。本轮 v1.6.6 已重新打包并上传 mac / win / linux 安装包。规则见 .agents/skills/releasing-official-version/references/version-carriers.md -->

### 下载客户端安装包

安装包**不在 npm 发布，也不入仓库**，而是作为 GitHub 发行版（Releases）的附件提供：

> **[GitHub Releases 页面](https://github.com/worm-longliu/worm-print-platform/releases)** —— 点击下载，无需登录。macOS / Windows / Linux 最新安装包均来自 `v1.6.6`（正式版，Release 标记为 Prerelease=false）。

下表是客户端安装包完整直链，可直接点击或复制。macOS / Windows / Linux 均为 `v1.6.6` 重新打包版本。

| 安装包直链 | 适用系统 |
| --- | --- |
| [https://github.com/worm-longliu/worm-print-platform/releases/download/v1.6.6/WormPrintClient-1.6.6-mac-x64.dmg](https://github.com/worm-longliu/worm-print-platform/releases/download/v1.6.6/WormPrintClient-1.6.6-mac-x64.dmg) | Intel Mac |
| [https://github.com/worm-longliu/worm-print-platform/releases/download/v1.6.6/WormPrintClient-1.6.6-mac-arm64.dmg](https://github.com/worm-longliu/worm-print-platform/releases/download/v1.6.6/WormPrintClient-1.6.6-mac-arm64.dmg) | Apple Silicon Mac |
| [https://github.com/worm-longliu/worm-print-platform/releases/download/v1.6.6/WormPrintClient-1.6.6-win-x64.exe](https://github.com/worm-longliu/worm-print-platform/releases/download/v1.6.6/WormPrintClient-1.6.6-win-x64.exe) | Windows 10 / 11 x64（NSIS 安装程序，可选择安装目录、创建桌面快捷方式） |
| [https://github.com/worm-longliu/worm-print-platform/releases/download/v1.6.6/WormPrintClient-1.6.6-linux-amd64.deb](https://github.com/worm-longliu/worm-print-platform/releases/download/v1.6.6/WormPrintClient-1.6.6-linux-amd64.deb) | Debian / Ubuntu x64（`sudo apt install ./<文件>`） |
| [https://github.com/worm-longliu/worm-print-platform/releases/download/v1.6.6/WormPrintClient-1.6.6-linux-x86_64.rpm](https://github.com/worm-longliu/worm-print-platform/releases/download/v1.6.6/WormPrintClient-1.6.6-linux-x86_64.rpm) | Fedora / RHEL / openSUSE x64（`sudo rpm -i <文件>`） |
| [https://github.com/worm-longliu/worm-print-platform/releases/download/v1.6.6/WormPrintClient-1.6.6-linux-x86_64.AppImage](https://github.com/worm-longliu/worm-print-platform/releases/download/v1.6.6/WormPrintClient-1.6.6-linux-x86_64.AppImage) | 任意 x64 发行版，免安装单文件（需 `libfuse2`） |
| [https://github.com/worm-longliu/worm-print-platform/releases/download/v1.6.6/SHA256SUMS-v1.6.6.txt](https://github.com/worm-longliu/worm-print-platform/releases/download/v1.6.6/SHA256SUMS-v1.6.6.txt) | v1.6.6 macOS / Windows / Linux 安装包的 SHA-256 校验和 |

下载不动或速度很慢时（GitHub 附件在国内直连常掉速，大文件容易中途断开）：

- 复制上表任意一条链接，粘贴到**迅雷**、IDM、qBittorrent 等支持断点续传的下载工具新建任务即可，安装包本身没有限制来源；用浏览器另存为时若提示失败，重试同一链接通常就能续上。
- 连 [Releases 页面](https://github.com/worm-longliu/worm-print-platform/releases) 本身都打不开时，说明是 GitHub 访问受阻而非文件过大：换用可访问 GitHub 的网络或代理后重试，或直接按下方[手工打包速查](#手工打包速查)自行打包（Gitee 侧的发行版只有源码包，没有安装包附件）。
- 下载工具有时会在文件名后追加 `(1)` 等重复标记，安装前核对一下文件名即可。
- 无论走哪条途径，装前都用 `SHA256SUMS-v1.6.6.txt` 核对一次：校验和不一致说明文件不完整或被替换，请重新下载。

下载后可与安装包放在同一目录校验完整性（Linux 用 `sha256sum -c`）：

```bash
shasum -a 256 -c SHA256SUMS-v1.6.6.txt
```

- **安装包未做 Developer ID 签名与公证**（本项目没有 Apple Developer ID 与 Windows 签名证书），首次打开会被系统拦截：macOS 执行 `xattr -dr com.apple.quarantine /Applications/WormPrintClient.app`，或在 系统设置 → 隐私与安全性 点「仍要打开」；Windows 在 SmartScreen 提示「未知发布者」页点「更多信息」→「仍要运行」。
- **Linux 三个包在 x64 的 Docker 容器内交叉构建，未经 Linux 真机安装与出纸验证**（出纸依赖 CUPS）。deb/rpm 内的 `chrome-sandbox` 为非 setuid（`0755`），启动若报 `SUID sandbox helper` 错误，需启用非特权用户命名空间或临时加 `--no-sandbox`；只提供 fuse3 的发行版（如 Ubuntu 24.04）跑 AppImage 前先装 `libfuse2`，或用 `--appimage-extract-and-run`。本版不提供 `snap` 与 Linux arm64 包。
- 发行版里同批出现的 `*.zip` 与 `*.blockmap` 是自动更新用的中间产物，客户端未接自动更新，**请下载 `.dmg` / `.exe` / `.deb` / `.rpm` / `.AppImage`**。
- **Gitee 用户请前往上面的 GitHub 地址下载**：Gitee 发行版附件单文件上限 100MB，超过该体积的安装包只能挂在 GitHub。

客户端本地 WebSocket 默认监听 `127.0.0.1:17521`，宿主用 `@worm-print-platform/core/client` 的 `PrintClient.printHtml()` 静默出纸，无对话框。

### 手工打包速查

```bash
npm run pack:client          # 全平台（mac + win）安装包
npm run pack:client:mac      # 仅 macOS（Intel + Apple Silicon）
npm run pack:client:win      # 仅 Windows x64 NSIS（macOS 可交叉构建）
npm run pack:client:linux    # Linux（Docker 容器内，deb / rpm / AppImage）
npm run pack:client:dir      # 绿色目录版（免安装，宿主平台）
npm run pack:client:release  # 安装包 + SHA256SUMS + 发行版上传命令
```

> 首次构建另一架构 / 平台时，electron-builder 需拉取对应工具链；国内网络建议先设镜像。完整打包说明、Linux Docker 前置条件、产物命名与 GitHub 发行版上传步骤见 [clients/client/README.md](./clients/client/README.md#打包)。

## AI Agent 配套技能

仓库随源码维护三个技能包（`skills/` 目录），AI Agent 接入时先装规范再动手：

| 技能 | 覆盖范围 |
| --- | --- |
| `worm-print-platform-integration` | 全形态宿主集成：NPM 门面与 `<print-designer>` 契约、三条打印链路、故障排查 |
| `worm-print-platform-i18n` | 自定义语言包：骨架生成、校验、人工审核对照表、三端接入与排错 |
| `worm-print-platform-mcp` | 桌面 MCP 工具：模板会话、渲染预览、视觉回读与参考图比对 |

### 快捷安装（可一键复制）

默认源 **GitHub 优先，失败自动回退 Gitee**；默认目录 `.agents/skills/`。在**你的项目根目录**执行：

```bash
npx @worm-print-platform/skills worm-print-platform-integration --force
npx @worm-print-platform/skills worm-print-platform-i18n       --force
npx @worm-print-platform/skills worm-print-platform-mcp         --force
```

**指定 Gitee 源**（国内网络快，可选）：

```bash
npx @worm-print-platform/skills worm-print-platform-integration \
  --repo https://gitee.com/liulong_oschina/worm-print-platform.git --force
```

**自定义安装目录**（可选）：

```bash
# 常见目录：Claude Code → .claude/skills · Qoder → .qoder/skills · 用户级 → ~/.agents/skills
npx @worm-print-platform/skills worm-print-platform-integration --dir .claude/skills --force
```

## 发布

```bash
npm run publish:npm       # core → plugin-kit → canvas → echarts → skills 按依赖序同批发布
npm run publish:canvas    # 仅补发 canvas
npm run publish:dry-run  # 干跑（build + test + 逐包 publish --dry-run）
```

CI 发布走 `.github/workflows/publish-npm.yml`，认证优先 Trusted Publishing（OIDC）。`contract` / `mcp` / `render` / `client` 不发布到 npm，随客户端 Electron 打包分发。

## 贡献

欢迎 bug 修复、文档改进、示例补充与功能建议。请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)，改动前确认分层与包边界不被破坏。

- 提交信息、Issue、PR 一律使用中文
- 安全漏洞请私信维护者，见 [SECURITY.md](./SECURITY.md)
- 参与社区讨论即表示同意 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

## 仓库地址

| 平台 | 地址 |
| --- | --- |
| GitHub（主仓） | https://github.com/worm-longliu/worm-print-platform |
| Gitee（镜像） | https://gitee.com/liulong_oschina/worm-print-platform |
| npm scope | https://www.npmjs.com/org/worm-print-platform |
| 在线演示 | https://worm-longliu.github.io/worm-print-platform/ |

## 支持 & 赞赏

本项目基于 MIT 协议免费开源，赞赏纯属自愿、与授权和服务无关。如果你觉得这套工具帮到了自己，欢迎扫码请作者喝杯咖啡；赞赏后在 Issue 留言昵称可登记进公开名单。

<p align="center">
  <img src="./douyin.png" width="150" alt="抖音码" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="./docs/images/wpay.png" width="150" alt="微信赞赏码" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="./docs/images/alipay.jpg" width="150" alt="支付宝赞赏码" />
</p>

### 贡献者名单

感谢以下朋友的支持（登记方式见上文）：

| 来源 | 昵称 | 贡献方式 |
| :---: | --- | --- |
| <img src="./docs/images/wechat.svg" width="18" alt="微信" /> | 青\*\*\*\* 侠 | 赞赏 |
| <img src="./docs/images/douyin.svg" width="18" alt="抖音" /> | Z\*\*\*\*D | 赞赏 |
| <img src="./docs/images/douyin.svg" width="18" alt="抖音" /> | 程\*\*\*\*已 | 赞赏 |
| <img src="./docs/images/douyin.svg" width="18" alt="抖音" /> | 天\*\*\*\*夜 | 赞赏 |
| <img src="./docs/images/github.svg" width="18" alt="GitHub" /> | C\*\*\*\*g | 代码贡献（特别鸣谢：多次提交 PR） |
| <img src="./docs/images/wechat.svg" width="18" alt="微信" /> | l\*\*\*\*n | 赞赏 |
| <img src="./docs/images/wechat.svg" width="18" alt="微信" /> | 蚂\*\*\*\*象 | 赞赏 |

## License

[MIT](./LICENSE) © 2026 worm
