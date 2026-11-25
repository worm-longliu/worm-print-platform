# 仓库链接驱动的插件更新判断与按框架安装 — 设计

## 意图与动机

其他 agent 在用户只给出 worm-print-platform 仓库根链接时，需要能自主判断插件是否有更新、或是否应按宿主前端框架安装，并通过逐个提问让用户确认，而不是依据过时或与实现矛盾的文档直接行动。上一轮修正图表插件文档中"旧版下拉回退"这一与源码不符的表述，正是这一需求的触发点。

## 目标

- agent 拿到仓库根链接后，从 `marketplace/marketplace.json` 取官方插件版本与 `engines.core`。
- 读宿主项目的 `.worm-print/plugins.json` 得到已装版本，读 `package.json` 与构建配置识别前端框架。
- 对比后给出明确结论：已装且有更新 / 未安装 / 无需操作。
- 按 AGENTS.md 的逐个提问规则向用户确认，确认后才执行，不擅自安装或升级。

## 非目标

- 不实现新的 CLI 命令，不改动 `packages/marketplace` 代码。
- 不支持任意第三方仓库链接，仅处理官方仓库根链接。
- 不改变现有安装命令与更新源顺序（npm → Gitee → GitHub）等既有约束。
- 不扩展设计器、渲染或客户端的行为。

## 约束

- 落点：增强 `skills/worm-print-platform-integration`（已与用户确认）。
- 所有面向用户的提问逐个进行，使用结构化提问工具。
- 与现有 `installation.md` / `troubleshooting.md` 不重复、不矛盾；发现矛盾时以源码为准并校正。

## 方案（已选 A）

- 新建 `references/plugin-update-flow.md`，承载完整判断与询问流程。
- `SKILL.md` 在合适位置加一行指引，指向新 reference。
- `installation.md` 的「市场插件安装与更新」加交叉引用，避免两处脱节。

已否决的方案：

- B 写进 `SKILL.md`：主文件已很长，流程会与其他章节混杂。
- C 扩展 `installation.md`：判断与询问主题塞进命令清单会让该节膨胀。

## 流程设计

1. **取官方清单**：从仓库根链接推导 raw 路径，抓取 `marketplace/marketplace.json`；抓取失败时明确报错并请用户提供版本，不臆测。
2. **读本地状态**：`.worm-print/plugins.json` 中 `plugins[id].version`；文件不存在视为未安装。
3. **识别宿主框架**：读 `package.json` 依赖（Vue 3 / Vue 2 / React / 无框架）与构建配置；识别不出时提问用户。
4. **判断分支**：已装且官方版本更高 → "有更新"；未安装 → "需安装"；已装且版本相同或更高 → "无需操作"。
5. **逐个询问**（确认后才执行）：是否执行更新/安装；框架识别不确定时确认框架；打印链路 A/B/C 沿用现有技能。
6. **执行**：按现有 `installation.md` 与集成技能契约；更新用 `marketplace install <id> --force`，更新源顺序不变。

## 留给 builder 的决定

- 文档措辞与章节插入位置，按技能现有风格处理。
- 写作过程中若发现安装/更新章节存在与源码不符的陈述，顺手校正并在交付时说明。
