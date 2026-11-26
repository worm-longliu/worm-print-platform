# 命令速查 · 开发 / 发布 / 客户端打包

仓库日常命令的统一索引。除特别说明外，所有命令都在**仓库根目录**执行。

## 环境准备

```bash
npm install                        # 安装全部 workspace 依赖
npx playwright install chromium    # 可选：系统无 Chromium/Chrome 时安装（render 与 demo 验收需要）
```

- Node.js 建议 22 及以上（npm CLI 用于 Trusted Publishing 时需 ≥ 11.5.2）。
- 客户端打 Linux 包需要 Docker Desktop；打包 macOS / Windows 需要对应平台工具链（Windows 产物可在 macOS 交叉构建）。

## 开发

### 构建与测试

```bash
npm run build                      # 按依赖序构建全部 workspace
npm test                           # 全量测试（含 render，需浏览器；首次先装 Playwright Chromium）

npm run build -w @worm-print-platform/core        # 单包构建（其余包同理）
npm run test -w @worm-print-platform/canvas       # 单包测试
npm run typecheck -w @worm-print-platform/canvas  # 单包类型检查（canvas / client / skills 有此脚本）

npm run parity:cross-end           # 跨端渲染一致性校验（services/render/src/cross-end.parity.mjs）
```

### 监听开发

```bash
npm run dev:core                   # core：tsup watch 构建
npm run dev -w @worm-print-platform/plugin-kit    # plugin-kit：tsup watch
npm run dev -w @worm-print-platform/echarts       # echarts：tsup watch
npm run dev -w @worm-print-platform/canvas        # canvas：vite watch（含样式/图标生成）

npm run dev:render                 # 服务端 PDF 渲染微服务（:3001，tsx 直跑）
npm run dev:client                 # 桌面客户端（electron-vite dev）
```

`dev:render` / `dev:client` 自带 `pre*` 钩子，会先安装依赖并构建各自依赖的包。

### 示例工程（demos）

五个宿主示例是彼此独立的 npm 工程，`file:` 依赖指向本仓 `packages/`。

```bash
npm run install:demos:all          # 逐个子工程安装依赖
npm run dev:demos:all              # 六进程并行：五个 demo + :9300 总览页
npm run dev:demos:nav              # 仅起 :9300 总览导航页

npm run dev:demos:vue3             # 单独起某个宿主（vue3 :9331 / vue2 :9332 / jquery :9334 / react :9335）
npm run dev:demos:vue2
npm run dev:demos:react
npm run dev:demos:jquery
```

验收脚本（先起对应 demo）：

```bash
node demos/scripts/verify-demo.mjs http://localhost:9331/               # UI 版式与四条链路验收
node demos/scripts/verify-business-scenarios.mjs http://localhost:9331/ # 业务模板全量回归
node demos/scripts/verify-business-scenarios.mjs http://localhost:9331/ --quick  # 四宿主一致性快检
```

## npm 发布

发布到 npm 的包共 7 个：`core`、`plugin-kit`、`canvas`、`echarts`、`skills`、`marketplace`、`i18n`。百度图表插件 `@worm-print-platform/plugin-echarts` 不再单独发 npm，通过插件市场 CLI 分发。
`contract` / `mcp` / `render` / `client` 为私有包，不发布（随客户端打包分发）。
正式发布用 `npm run publish:npm`；canvas 单独补发用 `npm run publish:canvas`。

### 发布前版本同步

仓库没有版本号自动递增脚本，发布前手动完成：

1. 将以下包的 `package.json#version` 统一改为目标版本：`packages/{core,plugin-kit,canvas,echarts,skills,marketplace,i18n}`；
2. 同步根 `package.json` 的 `version`；
3. 执行 `npm install` 刷新 `package-lock.json` 中的 workspace 版本；
4. 更新 `CHANGELOG.md`，提交并打 tag（`v<版本>`）推送到远端。

`publish-npm.yml` 会校验标签与包版本一致，并在安装依赖前运行 `node scripts/verify-marketplace-release.mjs` 校验官方插件产物已入库；漏发任一包会导致宿主安装 404。各包实际发布清单以根 `package.json` 的 `publish:npm` 脚本为准。

### 本地发布

```bash
npm run publish:dry-run            # 干跑：build + test + 逐包 publish --dry-run
npm run publish:npm                # 正式发布：build + test，按 core → plugin-kit → canvas → echarts → skills → marketplace → i18n 顺序发布

npm run publish:local              # 本地联调：build 后 yalc push core（需已安装 yalc：npm i -g yalc）
```

canvas 补发（其余包不动）：

```bash
npm run publish:canvas             # 补发 canvas 正式版并校验 dist-tag
npm run publish:canvas:beta        # 以 next 标签发布预发布版
npm run publish:canvas:dry-run     # 干跑补发
npm run publish:canvas:check       # 只检查 canvas 的 dist-tag 健康度（latest 是否被预发布占用）
```

本地发布需先登录：`npm login --registry=https://registry.npmjs.org`。

### CI 发布

`publish-npm.yml` 仅手动触发，认证为纯 Trusted Publishing（OIDC，不注入任何 npm token）。前提：npmjs.com 各包已配置 Trusted Publisher（Organization `worm-longliu` / Repository `worm-print-platform` / Workflow `publish-npm.yml` / Environment 留空 / Allowed actions 勾选 `npm publish`），账号 Publishing access 选 "disallow bypass 2fa tokens"。发版完整流程见 `.agents/skills/releasing-official-version/SKILL.md`。

```bash
gh workflow run publish-npm.yml -f tag=v1.6.6 -f dry_run=true   # 先干跑
gh workflow run publish-npm.yml -f tag=v1.6.6 -f dry_run=false  # 再正式发布
```

dist-tag 运维与 Gitee Release：

```bash
# 移除/添加 dist-tag（如清理首发自动生成的 latest）
gh workflow run npm-dist-tag.yml -f pkg=@worm-print-platform/canvas -f action=rm -f tag=latest
gh workflow run npm-dist-tag.yml -f pkg=@worm-print-platform/canvas -f action=add -f tag=next -f version=1.6.6

# 按 GitHub 同名 release 正文在 Gitee 创建 release
gh workflow run create-gitee-release.yml -f tag=v1.6.6
```

## 客户端打包

Electron 静默打印客户端，产物目录 `clients/client/dist`（已 gitignore，不入库）。
打包前脚本会自动构建 `core` / `contract` / `mcp` / `echarts` 与客户端 `out/`。

### 安装包

```bash
npm run pack:client                # macOS（Intel + Apple Silicon）+ Windows x64
npm run pack:client:mac            # 仅 macOS：dmg + zip
npm run pack:client:win            # 仅 Windows x64：NSIS exe（可在 macOS 交叉构建）
npm run pack:client:linux          # 仅 Linux：走 Docker 容器产出 deb / rpm / AppImage
npm run pack:client:linux:native   # 在原生 Linux 主机上直接构建 Linux 产物

npm run pack:client:release        # pack:client + 生成 SHA256SUMS.txt + 打印 gh release upload 命令
```

### 绿色目录版

```bash
npm run pack:client:dir            # 只产出宿主平台的解包目录，不打安装包
```

产物：macOS `dist/mac/WormPrintClient.app`、Windows `dist/win-unpacked/`、Linux `dist/linux-unpacked/`。

### 产物与发行版上传

安装包命名：`WormPrintClient-<version>-<os>-<arch>.<ext>`。

| 平台 | 产物 |
| --- | --- |
| macOS | `.dmg`（x64 / arm64） |
| Windows | `.exe`（NSIS x64） |
| Linux | `.deb` / `.rpm` / `.AppImage`（x64） |

```bash
# pack:client:release 会打印完整命令，形如：
gh release upload v1.5.1 \
  clients/client/dist/WormPrintClient-1.5.1-mac-x64.dmg \
  clients/client/dist/WormPrintClient-1.5.1-mac-arm64.dmg \
  clients/client/dist/WormPrintClient-1.5.1-win-x64.exe \
  clients/client/dist/WormPrintClient-1.5.1-linux-amd64.deb \
  clients/client/dist/WormPrintClient-1.5.1-linux-x86_64.rpm \
  clients/client/dist/WormPrintClient-1.5.1-linux-x86_64.AppImage \
  clients/client/dist/SHA256SUMS.txt --clobber
```

`zip` 与 `blockmap` 是 electron-updater 的差量元数据，本客户端未接自动更新，不上传发行版。

### 打包相关环境变量

| 变量 | 作用 |
| --- | --- |
| `ELECTRON_MIRROR` | Electron 二进制下载镜像（国内网络必备） |
| `ELECTRON_BUILDER_BINARIES_MIRROR` | electron-builder 工具链下载镜像 |
| `APT_MIRROR` | Linux 容器内 Debian apt 源（如 `https://mirrors.aliyun.com`） |
| `WORM_LINUX_BUILDER_IMAGE` | 覆盖 Linux 构建镜像，默认 `node:22-bookworm` |

Linux 构建卷 `worm-print-platform-client-linux-work` 会复用，需彻底清理时：

```bash
docker volume rm worm-print-platform-client-linux-work
```

## 渲染微服务（Docker）

```bash
npm run dev:render      # 开发运行（:3001）
npm run build -w @worm-print-platform/render   # tsc 编译到 services/render/dist
npm run start -w @worm-print-platform/render   # 生产运行 node dist/server.js
npm run test -w @worm-print-platform/render    # vitest（分页用例需可启动浏览器）

# 镜像以仓库根为构建上下文
docker build -f services/render/Dockerfile -t worm-print-platform-render .

docker run -p 3001:3001 \
  -e RENDER_API_KEY="your-key" \
  worm-print-platform-render
```

常用环境变量：`PORT`（默认 `3001`）、`RENDER_API_KEY`（默认 `dev-render-key`）、`PLAYWRIGHT_CHROME_PATH`（自定义浏览器路径）。

## GitHub Actions 一览

全部为**手动触发**，push / PR 不会自动运行。

| Workflow | 用途 | 触发方式 |
| --- | --- | --- |
| `ci.yml` | 全量 build + test，render 分页集成用例单独 job | `gh workflow run ci.yml` |
| `publish-npm.yml` | 按 tag 发布 7 个包（core / plugin-kit / canvas / echarts / skills / marketplace / i18n，支持 dry run） | `gh workflow run publish-npm.yml -f tag=v1.6.6 -f dry_run=true` |
| `npm-dist-tag.yml` | 运维 dist-tag（rm / add） | `gh workflow run npm-dist-tag.yml ...` |
| `create-gitee-release.yml` | 在 Gitee 创建同名 release | `gh workflow run create-gitee-release.yml -f tag=v1.6.6` |
| `deploy-pages.yml` | 五个宿主 demo 的 GitHub Pages 静态演示 | `gh workflow run deploy-pages.yml` |
