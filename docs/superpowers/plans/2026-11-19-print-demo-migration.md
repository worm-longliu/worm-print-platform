# 打印模板接入示例搬迁 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `web/apps/print-demo` 从宿主基座项目完整迁入 `worm-print-platform/demos/apps/print-demo`，作为本地依赖、纳入 demos 统一管理的官方业务接入示例，并清理源仓库残留。

**Architecture:** 跨仓库文件搬迁 + 配置适配（package.json / tsconfig / vite / README）+ demos 纳管脚本与文档更新 + 源仓库清理。demo 业务逻辑与 28 项测试（7 文件）随目录原样搬迁，不新写测试；验证以运行既有测试与构建为准。

**Tech Stack:** Vue 3 + Vite 7 + Element Plus + MSW 2.15.0 + vitest；本地 `@worm-print-platform/*@1.5.3` 经 `file:` 依赖。

**Spec:** `docs/superpowers/specs/2026-11-19-print-demo-migration-design.md`

## Global Constraints
- 目标目录 `demos/apps/print-demo`，包名 `@worm-print-platform/demo-print`，version `1.5.3`。
- 四个平台依赖精确改为 `file:../../../packages/core`、`file:../../../packages/canvas`、`file:../../../packages/echarts`、`file:../../../packages/plugin-kit`。
- 端口 `9336`（dev server）；其余依赖版本保持不变（Vue ^3.5.45、Element Plus ^2.14.0、MSW 2.15.0、Vite ^7.3.7、vitest ^4.1.12）。
- `tsconfig.json` 不得继承 `web/tsconfig.base.json`，必须内联 compilerOptions。
- 不得修改 `packages/*` 源码、demo 业务源码与测试内容。
- 源仓库保留 `workspaces: ["apps/*"]`，只移除 `msw.workerDirectory` 中的 demo 条目。
- 目标仓库 demos 为独立 npm 工程，各自生成 `package-lock.json`，不加入根 workspace。

## Review Focus
- 搬迁后 `file:` 依赖解析失败（dist 缺失或路径写错）→ 任务 3 的 `npm install` 与 `build` 验证。
- 端口 9336 与公共服务冲突 → 任务 3 的 dev server 启动验证。
- 源码中 `@/` 别名在目标仓库失效 → 任务 3 的 `typecheck` 验证（tsconfig paths + vite alias 均已随目录搬迁并内联）。
- 源仓库 `web/package-lock.json` 残留 print-demo 条目 → 任务 4 的 `npm install` 刷新 + grep 验证。
- 文档遗留「四个宿主」「5182」等旧文案 → 任务 2、任务 4 的文档更新与最终 grep 验证。

---

### Task 1: 复制并适配 demo 目录

**Files:**
- Create: `demos/apps/print-demo/**`（从源整份复制，排除 node_modules/dist）
- Modify: `demos/apps/print-demo/package.json`、`tsconfig.json`、`vite.config.ts`、`README.md`

- [ ] **Step 1: 复制目录**

```bash
cd /Users/worm/worm-print-platform
rsync -a --exclude node_modules --exclude dist <宿主基座项目路径>/web/apps/print-demo/ demos/apps/print-demo/
```

确认文件清单完整（src、tests、public/mockServiceWorker.js、README.md、PROMPT.md、index.html、配置文件）。

- [ ] **Step 2: 适配 package.json**

`name` → `@worm-print-platform/demo-print`；四个 `@worm-print-platform/*` 的 `1.5.3` → `file:../../../packages/{core,canvas,echarts,plugin-kit}`；其余字段不动。

- [ ] **Step 3: 适配 tsconfig.json**

去掉 `extends`，内联源 `web/tsconfig.base.json` 的 compilerOptions（target ES2022、module ESNext、moduleResolution bundler、lib、strict、noEmit、skipLibCheck、esModuleInterop、allowSyntheticDefaultImports、resolveJsonModule、isolatedModules、verbatimModuleSyntax、noUnusedLocals、noUnusedParameters、noFallthroughCasesInSwitch、forceConsistentCasingInFileNames）；保留 baseUrl/paths/types/include。

- [ ] **Step 4: 适配 vite.config.ts / README.md**

vite `server.port` 5182 → 9336；README 运行命令改为 `cd demos/apps/print-demo && npm install && npm run dev`，端口 9336，依赖说明改为 `file:` 本地包。

- [ ] **Step 5: 提交（目标仓库）**

```bash
git add demos/apps/print-demo docs/superpowers/specs/2026-11-19-print-demo-migration-design.md docs/superpowers/plans/2026-11-19-print-demo-migration.md
git commit -m "feat(demos): 迁入 print-demo 业务接入示例并适配本地依赖"
```

### Task 2: 纳入 demos 统一管理并更新文档

**Files:**
- Modify: `package.json`（根）、`demos/scripts/dev-all.mjs`、`demos/scripts/install-all.mjs`、`demos/index.html`、`demos/README.md`、`AGENTS.md`

- [ ] **Step 1: 根 package.json 加脚本**

在 `dev:demos:jquery` 后加 `"dev:demos:print": "npm run dev --prefix demos/apps/print-demo"`。

- [ ] **Step 2: dev-all.mjs / install-all.mjs 加条目**

`APPS` 数组均加入 print-demo（`{ name: 'print-demo', dir: 'apps/print-demo' }` / `'apps/print-demo'`）。

- [ ] **Step 3: demos/index.html 加导航卡片**

标题与 lead 文案「四个」→「五个」，加 print-demo 卡片（:9336，`data-host="print-demo"`）；保持现有卡片风格与 GitHub Pages 子路径脚本逻辑。

- [ ] **Step 4: demos/README.md 与 AGENTS.md 文案**

demos/README.md 的「四个宿主」→「五个宿主」，工程/端口表新增 `apps/print-demo | 9336 | NPM 包 + SFC（业务接入示例）| src/views/print/**` 行；AGENTS.md 中 demos 描述由「四宿主」改为「五宿主」。

- [ ] **Step 5: 提交（目标仓库）**

```bash
git add package.json demos/scripts/dev-all.mjs demos/scripts/install-all.mjs demos/index.html demos/README.md AGENTS.md
git commit -m "feat(demos): print-demo 纳入统一启动与导航"
```

### Task 3: 目标仓库验证

- [ ] **Step 1: 安装依赖并生成 lockfile**

```bash
cd /Users/worm/worm-print-platform
npm install --prefix demos/apps/print-demo
```

Expected: 成功，生成 `demos/apps/print-demo/package-lock.json`，无 ERESOLVE 错误。

- [ ] **Step 2: typecheck / 单测 / 构建**

```bash
npm run typecheck --prefix demos/apps/print-demo
npm test --prefix demos/apps/print-demo
npm run build --prefix demos/apps/print-demo
```

Expected: 三项均通过；单测 28 项（7 个文件）。

- [ ] **Step 3: dev server 启动验证**

```bash
npm run dev --prefix demos/apps/print-demo
```

Expected: 监听 9336，浏览器打开 `/print/template` 无 console 错误；MSW worker 正常加载。

### Task 4: 源仓库清理

**Files:**
- Delete: `web/apps/print-demo/**`
- Modify: `web/package.json`、`web/package-lock.json`、`docs/print-template-integration.md`

- [ ] **Step 1: 删除 demo 目录**

确认目标仓库副本已验证通过后，删除 `web/apps/print-demo/` 整目录。

- [ ] **Step 2: 清理 web/package.json**

移除 `msw.workerDirectory` 中的 `"apps/print-demo/public"`（保留数组内其他项与 `workspaces`）。

- [ ] **Step 3: 刷新 lockfile**

```bash
cd <宿主基座项目路径>/web && npm install --package-lock-only
```

Expected: 成功；`grep -n print-demo package-lock.json package.json` 无输出。

- [ ] **Step 4: 文档改指针**

`docs/print-template-integration.md` 改为：说明 demo 已迁至 `../worm-print-platform/demos/apps/print-demo`，保留集成要点摘要与 PROMPT.md 指引（路径改为新仓库）。

- [ ] **Step 5: 提交（源仓库）**

```bash
git add -A web/apps/print-demo web/package.json web/package-lock.json docs/print-template-integration.md
git commit -m "chore(print-demo): 迁出至 worm-print-platform，清理 workspace 与文档引用"
```

### Task 5: 跨仓库最终验证

- [ ] **Step 1: 源仓库无残留**

```bash
cd <宿主基座项目路径>
grep -rn "apps/print-demo\|@worm/print-demo" web/package.json web/package-lock.json docs/print-template-integration.md || true
```

Expected: 仅有指针文档中对新仓库位置的说明，无旧路径引用。

- [ ] **Step 2: 目标仓库纳管自检**

```bash
cd /Users/worm/worm-print-platform
node -e "const p=require('./package.json'); if(!p.scripts['dev:demos:print']) process.exit(1)"
grep -n "print-demo" demos/scripts/dev-all.mjs demos/scripts/install-all.mjs demos/index.html demos/README.md
```

Expected: 脚本存在，四处均含 print-demo 条目。

## 执行记录（2026-11-19）

- Task 1–5 全部完成；目标仓库提交 `8267b4a` / `8c5f7fa` / `26aab41`，源仓库提交 `6889e5d`。
- Ruling: 测试数按实测修正 —— 设计/计划文档原写「13 项」，实测 7 文件 28 项（源 README 过期）—— 统一改为 28 项；成本：仅文档数字，不影响代码。
- Ruling: 不做 worktree 隔离 —— 任务跨两仓库且目标路径由用户绝对指定，worktree 无法覆盖 —— 直接在两仓库原目录操作；用户已确认方案，成本：无。
- Ruling: 最终审查发现 Pages 部署遗漏（Important）—— 导航页新增卡片但 workflow 仍只构建四个 demo，且 MSW 原仅 dev 启用，线上会 404 / 空数据 —— 给 print-demo 加 `PAGES_BASE` 支持、MSW 改为默认启用（`VITE_NO_MOCK=true` 可关闭）、workflow 纳入构建与烟雾测试；成本：生产产物含 mock，符合本 demo「不需要后端」定位。
- Final review: self-review（当前 harness 无子代理工具）；Critical/Important 1 项已修复并 RED→GREEN 验证（PAGES_BASE 产物路径 + MSW 打包断言）。
