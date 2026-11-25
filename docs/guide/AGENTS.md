# docs/guide · AI Agent 阅读索引

> 面向 AI 编程工具（OpenCode / Claude Code / Codex 等）。**先读本文件，再按任务路线取用文档；未读规范前禁止改代码。**

## 1. 文档地图（purpose / audience / prerequisites / outputs / verification）

| 文件 | purpose | audience | prerequisites | outputs | verification |
| --- | --- | --- | --- | --- | --- |
| `01-getting-started.md` | 链路选型、包选择、技能安装、提示词模板、宿主最小清单 | 全体 | Node ≥ 18、npm | 选中的打印链路与包清单 | `npm ls @worm-print-platform/*` 版本齐平 |
| `02-vue3.md` | Vue3 门面接入 | Vue3 宿主 | 01 + Vue3 工程 | 设计器 + 预览 + 出纸 | `npm run build`；保存后回填再预览 |
| `03-vue2.md` | Vue2.7 自定义元素接入 | Vue2.7 宿主 | 01 + Vue2.7 工程 | 同上 | 同上；`ignoredElements` 已声明 |
| `04-react.md` | React18 自定义元素接入 | React18 宿主 | 01 + React18 工程 | 同上 | 同上；事件 cleanup 已解绑 |
| `05-jquery.md` | UMD 直挂接入 | 无打包器宿主 | 01 + 静态站点 | 同上 | 页面直接打开可用 |
| `06-i18n.md` | 生成/校验/接入自定义语言包 | 多语言定制者 | 01 + 已装包项目 | `<locale>.json` + 三端配置 | `validate --strict` 退出 0；切换命中译文 |
| `07-plugin-install.md` | 安装并加载插件 | 插件使用者 | 01 | `.worm-print/plugins` + `plugins.json` | `list`、回读 `plugins.json`、构建通过 |
| `08-plugin-dev.md` | 开发/发布插件 | 插件开发者 | 07 + 01 | 可加载的插件 `dist` | 本地加载注册成功；构建通过 |
| `09-migration-faq.md` | 迁移与排错 | 老用户 / 遇错者 | 01 | 迁移后代码 / 问题定位 | 迁移检查清单 |
| `10-data-transform.md` | 关系型数据整形 | 后端/数据准备 | 01 | 批量打印 `printData` | 断言用例通过 |

## 2. 四条任务路线（按顺序读）

- **宿主接入**：`01` → `02`/`03`/`04`/`05`（按框架选一篇）→ `07`（可选装插件）→ `09`（排错）
- **自定义插件**：`01` → `07`（安装与加载机制）→ `08`（契约/构建/发布）→ `06 §3.4.5`（插件多语言）
- **多语言自定义**：`01` → `06`（生成→校验→三端接入）→ `02`/`07`（按接入端回看）
- **插件更新判断**：`01` → 官方技能 `skills/worm-print-platform-integration/references/plugin-update-flow.md`（仓库链接 → 取官方清单 → 读本地状态 → 识别框架 → 逐个询问 → 确认后再执行）→ `07`（按需装插件）。该流程文件在技能包内，不在本目录。

## 3. 执行约束（硬性）

1. **先读后做**：读完路线内文档再动手；输出「已读规范确认」：文件清单 + ≥3 条与本任务相关的约束。
2. **不臆测 API**：props / 事件 / ref 方法 / CLI 命令只使用文档与权威源列出的；遇到文档没有的能力先停下提问。
3. **命令可判定**：每条命令标注 `cwd`；执行后核对预期输出/退出码；失败时先区分「环境限制（网络/未发布/缺浏览器）」与「文档缺口」，不要互相混为一谈。
4. **以权威源为准**：文档描述与代码冲突时，以包导出（`packages/*/package.json` 的 `exports`）、类型定义与实际 CLI 行为为准，并在结果里说明冲突。
5. **版本齐平**：`core`/`canvas`/`plugin-kit` 同号同批；安装后 `npm ls` 核对，不要只锁其中两个。
6. **打印链路三选一或并存**：A 浏览器打印 / B 服务端 PDF / C 桌面客户端静默打印，先与用户确认再实现。
7. **最小验证例外**：若任务只是「构建通过 / 插件加载成功」这类最小验证，不涉及打印出纸与业务代码改动，可跳过第 1 条的技能门控与第 6 条的链路确认；但仍须遵守「不臆测 API、命令标注 cwd、区分环境限制与文档缺口」。

## 4. 可复制命令索引

```bash
# 包/版本
npm ls @worm-print-platform/core @worm-print-platform/canvas @worm-print-platform/plugin-kit
npm run build                                   # 宿主工程构建（cwd=项目根）

# 技能（cwd=项目根）；默认源 GitHub→Gitee 回退，--repo 可指定
npx @worm-print-platform/skills worm-print-platform-integration --force
npx @worm-print-platform/skills worm-print-platform-mcp --force
npx @worm-print-platform/skills worm-print-platform-i18n --force

# 插件（cwd=项目根）；npx 404 时见 07 的本地 CLI 回退
npx @worm-print-platform/marketplace list
npx @worm-print-platform/marketplace install echarts

# 语言包（cwd=项目根）
npx @worm-print-platform/i18n template -o ja-JP.json
npx @worm-print-platform/i18n validate ja-JP.json --strict
npx @worm-print-platform/i18n report ja-JP.json -o ja-JP-comparison.md
npx @worm-print-platform/i18n update ja-JP.json

# 数据整形验证（cwd=仓库根）
npm test -w @worm-print-platform/core
```

## 5. 验收命令索引

- 框架接入：`npm run build` → 设计器保存模板 JSON → 重新打开回填 → 预览渲染真实数据 → 打印。
- 插件安装：`marketplace list` 能看到插件；`.worm-print/plugins.json` 回读一致；`.worm-print/i18n/<id>/` 存在；加载后构建通过。
- 插件开发：本地目录 `dist/marketplace.js` import 后注册命中；`getElementPluginTypes()`（type 字符串数组）、`getElementPlugins()`（描述符数组）、`getElementUI(type)` 均可见；构建通过。
- 语言包：`validate --strict` 退出码 0；对照表人工审核通过；设计器切换命中译文、无裸 key。
