# 插件更新判断与按框架安装（技能增强）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `worm-print-platform-integration` 技能指导 agent 仅凭官方仓库根链接即可判断插件是否需要更新或安装、识别宿主前端框架，并在逐个询问用户确认后才执行。

**Architecture:** 新增一个 reference 文件承载完整判断与询问流程，在 `SKILL.md` 与 `installation.md` 各加一处指引。不改动任何代码或 CLI，纯文档变更。

**Tech Stack:** Markdown 文档、Git。

**Spec:** `docs/superpowers/specs/2026-11-25-plugin-update-flow-design.md`

## Global Constraints

- 落点仅为 `skills/worm-print-platform-integration/`，不改 `packages/marketplace` 或任何源码。
- 所有面向用户的提问逐个进行，使用结构化提问工具（AGENTS.md 最高优先级规则）。
- 用户提供的链接仅官方仓库根链接；其余状态从宿主项目读取；官方版本取自 `marketplace/marketplace.json`。
- 本地已装版本取自 `.worm-print/plugins.json` 的 `plugins[id].version`；文件不存在视为未安装。
- 更新源顺序固定 **npm → Gitee → GitHub**；更新命令 `marketplace install <id> --force`。
- 文档语言为简体中文，UTF-8 无 BOM。

## Review Focus

- 仓库根链接的 raw 路径在 GitHub 与 Gitee 上不同：文档须给出推导方式，抓取失败时明确报错并要求用户提供版本，不得臆测。对应 Task 1 Step 2。
- 本地清单缺失易被误判为"有更新"：文档须明确"文件不存在视为未安装"。对应 Task 1 Step 3。
- 框架识别不出时 agent 容易假装知道：文档须要求"识别不出时提问用户"。对应 Task 1 Step 4。
- 用户只给链接未确认就执行：流程须明确"确认后才执行，不擅自安装或升级"。对应 Task 1 Step 6。
- 与现有章节表述矛盾（如上一轮发现的"旧版下拉回退"）：验收须核对源码与关键约束是否一致。对应 Task 4 Step 2、Step 3。

---

### Task 1: 新建流程 reference 文档

**Files:**
- Create: `skills/worm-print-platform-integration/references/plugin-update-flow.md`

**Interfaces:**
- Consumes: `marketplace/marketplace.json` 的 `version` / `versions` / `engines.core`；`.worm-print/plugins.json` 的 `plugins[id].version`；宿主 `package.json` 与构建配置。
- Produces: agent 可执行的六步流程文档，供 Task 2、Task 3 引用。

- [ ] **Step 1: 写文档骨架**

创建文件，写入标题、用途说明，以及一张"输入来源表"，列出三类来源：官方仓库根链接（取官方版本）、宿主 `.worm-print/plugins.json`（取已装版本）、宿主 `package.json` + 构建配置（识别框架）。表中写明官方版本字段为 `marketplace/marketplace.json` 的 `version` / `versions` / `engines.core`。

- [ ] **Step 2: 写「取官方清单」章节**

写明：从仓库根链接推导 raw 文件路径后抓取 `marketplace/marketplace.json`；抓取失败时明确报错并请用户提供版本，禁止臆测版本号。包含 GitHub 与 Gitee 两种 raw 路径形式的示例。

- [ ] **Step 3: 写「读本地状态」章节**

写明：读取 `.worm-print/plugins.json` 中 `plugins[id].version`；文件不存在视为未安装。不得用锁文件或 Node 模块版本替代该清单作为判断依据。

- [ ] **Step 4: 写「识别宿主框架」章节**

写明：读 `package.json` 依赖区分 Vue 3 / Vue 2 / React / 无框架，并参考构建配置；识别不出时必须提问用户，不得假定。

- [ ] **Step 5: 写「判断分支」章节**

写明三种结论及其条件：已装且官方版本更高 → "有更新"；未安装 → "需安装"；已装且版本相同或更高 → "无需操作"。版本比较使用语义化版本，不做字符串比较。

- [ ] **Step 6: 写「逐个询问」章节**

写明确认后才执行，不擅自安装或升级。列出四个确认点：是否执行更新/安装；框架识别不确定时确认框架；打印链路 A/B/C（沿用现有技能）；更新源是否与默认 `auto` 一致。要求按 AGENTS.md 逐个提问，使用结构化提问工具。

- [ ] **Step 7: 写「执行」章节**

写明：按 `installation.md` 与集成技能契约执行；更新命令 `marketplace install <id> --force`；更新源顺序 npm → Gitee → GitHub 不变；更新后按 `troubleshooting.md` 验收旧文件残留与清单可读性。末尾加一句："命令细节见 [安装方式选择](installation.md#市场插件安装与更新)"。

- [ ] **Step 8: 验证文档关键约束齐全**

运行：
```bash
grep -nE 'marketplace/marketplace.json|plugins\[id\]\.version|确认后才执行|npm → Gitee → GitHub|识别不出时' skills/worm-print-platform-integration/references/plugin-update-flow.md
```
Expected: 五个关键词均有命中。

- [ ] **Step 9: 提交**

```bash
git add skills/worm-print-platform-integration/references/plugin-update-flow.md
git commit -m "docs: 新增插件更新判断与按框架安装流程"
```

### Task 2: SKILL.md 加指引

**Files:**
- Modify: `skills/worm-print-platform-integration/SKILL.md`

**Interfaces:**
- Consumes: Task 1 产出的 `references/plugin-update-flow.md`。
- Produces: 技能主文件对新流程的可发现入口。

- [ ] **Step 1: 定位插入点**

运行 `grep -n '快速工作流' skills/worm-print-platform-integration/SKILL.md`，确认「3. 快速工作流」章节存在。

- [ ] **Step 2: 在快速工作流中加一步**

在该章节步骤列表中，紧接现有"按安装方式选择"相关步骤之后插入一行：
"需要按官方仓库链接判断插件更新或安装方式时，按 [插件更新判断与按框架安装](references/plugin-update-flow.md) 执行：先取官方清单、读本地状态、识别框架，逐个询问用户确认后再操作。"

- [ ] **Step 3: 验证引用路径**

运行：
```bash
grep -n 'references/plugin-update-flow.md' skills/worm-print-platform-integration/SKILL.md
```
Expected: 命中一行，路径可解析。

- [ ] **Step 4: 提交**

```bash
git add skills/worm-print-platform-integration/SKILL.md
git commit -m "docs: 技能主文件指向插件更新判断流程"
```

### Task 3: installation.md 加交叉引用

**Files:**
- Modify: `skills/worm-print-platform-integration/references/installation.md`

**Interfaces:**
- Consumes: Task 1 产出的 `references/plugin-update-flow.md`。
- Produces: 安装章节到新流程的反向入口，避免两处脱节。

- [ ] **Step 1: 定位插入点**

运行 `grep -n '市场插件安装与更新' skills/worm-print-platform-integration/references/installation.md`，确认章节位于第 65 行附近。

- [ ] **Step 2: 在章节末尾加交叉引用**

在该章节最后一条（"`--force` 暂存后原子切换……"）之后插入一段：
"从官方仓库链接判断是否需要更新、以及按宿主前端框架选择安装方式，见 [插件更新判断与按框架安装](plugin-update-flow.md)。"

- [ ] **Step 3: 验证引用路径**

运行：
```bash
grep -n 'plugin-update-flow.md' skills/worm-print-platform-integration/references/installation.md
```
Expected: 命中一行，相对路径正确。

- [ ] **Step 4: 提交**

```bash
git add skills/worm-print-platform-integration/references/installation.md
git commit -m "docs: 安装章节交叉引用插件更新判断流程"
```

### Task 4: 一致性验收

**Files:**
- 无新增文件；审查 Task 1–3 的改动。

**Interfaces:**
- Consumes: Task 1–3 产出的三个文件。
- Produces: 可交付的一致性确认。

- [ ] **Step 1: 三处引用完整性**

运行：
```bash
grep -rn 'plugin-update-flow.md' skills/worm-print-platform-integration/
```
Expected: SKILL.md 与 installation.md 各命中一行，新文件本身不计入。

- [ ] **Step 2: 与源码字段核对**

运行：
```bash
grep -n 'manifestPath\|plugins.json' packages/marketplace/src/manifest.ts
grep -n 'latestStable\|resolveVersion' packages/marketplace/src/semver.ts packages/marketplace/src/resolve.ts
```
Expected: 清单位于插件根目录的上一级，即 `.worm-print/plugins.json`；版本比较使用 semver 相关函数。若流程文档表述与之不符，回到 Task 1 修正。

- [ ] **Step 3: 关键约束无矛盾**

运行 `git diff --check` 与新文档中"确认后才执行""文件不存在视为未安装"两处 grep，确认无空白错误、无与现有章节矛盾的表述。

- [ ] **Step 4: 提交（如 Step 2/3 产生修正）**

```bash
git add skills/worm-print-platform-integration/
git commit -m "docs: 校正插件更新流程与源码一致性"
```
Expected: 若无修正则跳过此步。
