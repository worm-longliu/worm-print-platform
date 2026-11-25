# 打印模板接入示例搬迁设计（宿主基座项目 → worm-print-platform/demos/apps）

## 意图与原因
宿主基座项目中的 `web/apps/print-demo` 是「业务宿主如何接入打印设计器」的完整示例（模板 CRUD + 设计器 + 体检报告 + 静默打印配置 + MSW 模拟后端）。它依赖打印平台制品却住在平台基座仓库，不利于平台统一维护与下游参考。将其迁入 `worm-print-platform/demos/apps`，作为与 vue3/vue2/react/jquery 并列的官方业务接入示例；源仓库回归纯系统管理基座。

## 目标
- 完整搬迁 demo 目录（源码、测试、README、PROMPT.md、MSW worker）到目标仓库。
- 纳入目标仓库 demos 统一管理：`dev-all.mjs` / `install-all.mjs` / `index.html` 导航 / 根 `dev:demos:print` 脚本。
- 依赖改 `file:../../../packages/*` 指向本地包源码，验证平台制品自身即可跑通。
- 源仓库清理干净：删除 demo、去 workspace/msw 注册、刷新 lockfile、文档改指针，无悬空引用。
- 搬迁后 `typecheck` / 28 项单测（7 文件）/ `build` / dev server / 浏览器运行时全部通过。

## 非目标
- 不改 demo 的业务逻辑、UI、模板数据、测试用例内容（仅改配置与路径）。
- 不改平台 `packages/*` 任何源码。
- 不搬迁源仓库 `docs/superpowers/{specs,plans}` 下的历史设计/计划文档——它们是过程档案，保持原样以保留历史可读性。

## 约束
- 目标仓库 `demos/apps/*` 是彼此独立的 npm 工程，不在根 workspace；依赖 `file:` 指向本仓 `packages/*`，各自带 `package-lock.json`。
- 所需子路径导出在本地包均已存在且 dist 就绪：`core/client`、`canvas/vue3`、`echarts/ui`；`plugin-kit` 为间接依赖。
- 源 demo 的 `tsconfig.json` 继承 `web/tsconfig.base.json`，搬迁后必须内联 compilerOptions。
- 源仓库 `web/package.json` 的 `msw.workerDirectory` 含 demo 条目需移除；`workspaces: ["apps/*"]` 保留（其他 app 仍在）。
- 端口选择 9336（避开 9331/9332/9334/9335）。

## 方案
### 方案 A（采纳）：完整纳管为官方示例
如上「目标」所述。完整搬迁 + 纳入统一管理 + 本地依赖适配 + 源仓库清理 + 文档更新。

### 方案 B（否决）：只挪目录最小适配
仅搬目录、改依赖与 tsconfig 让它能跑，不接 `dev-all/install-all/nav`、不改文档。与「纳入统一管理、作为官方示例」的目标冲突，故否决。

## 已定决策
- 目录 `demos/apps/print-demo`，包名 `@worm-print-platform/demo-print`，version `1.5.3`。
- 四个 `@worm-print-platform/*` 依赖由 npm `1.5.3` 改为 `file:../../../packages/{core,canvas,echarts,plugin-kit}`；其余依赖保持不变（含 MSW `2.15.0`）。
- 端口 `5182` → `9336`。
- `tsconfig.json` 内联编译器选项，去除对 `web/tsconfig.base.json` 的继承。
- MSW 仍仅 dev 模式启动，生产构建不含 mock。
- 源仓库历史设计/计划文档保持原样；`docs/print-template-integration.md` 改为指向新仓库的指针 + 集成要点摘要。

## 实施步骤概览
1. 目标仓库：复制 demo 目录并适配 package.json / tsconfig.json / vite.config.ts / README.md。
2. 目标仓库：纳管三处脚本（根 package.json、dev-all.mjs、install-all.mjs）+ demos/index.html + demos/README.md + AGENTS.md 文案。
3. 目标仓库：`npm install` 生成 demo 自身 lockfile；typecheck / test / build / dev server 验证。
4. 源仓库：删除 demo 目录、清理 web/package.json 的 msw 配置、刷新 web/package-lock.json、改 docs/print-template-integration.md 为指针。
5. 源仓库：验证 workspace 无 print-demo 残留。

## 验证
- 目标：`npm install --prefix demos/apps/print-demo`；`npm run typecheck/test/build --prefix demos/apps/print-demo`；启动 dev server 确认 :9336 页面可打开、无 console 错误。
- 源：`grep -r print-demo web/package.json web/package-lock.json docs` 无悬空引用；`npm install` 可成功刷新 lockfile。
