# 插件更新判断与按框架安装

用户只给出 worm-print-platform 官方仓库根链接时，按本流程判断插件是否需要更新、或是否需要按宿主前端框架安装，并在逐个询问用户确认后才执行。

> 所有面向用户的提问逐个进行，使用结构化提问工具（AGENTS.md 最高优先级规则）。不要批量罗列问题，也不要在用户确认前安装或升级。

## 输入来源

| 信息 | 来源 | 说明 |
| --- | --- | --- |
| 官方版本与兼容性 | 官方仓库根链接 → `marketplace/marketplace.json` | 取 `version` / `versions` / `engines.core` |
| 已装版本 | 宿主 `.worm-print/plugins.json` | 取 `plugins[id].version` |
| 宿主前端框架 | 宿主 `package.json` + 构建配置 | 区分 Vue 3 / Vue 2 / React / 无框架 |

## 1. 取官方清单

从仓库根链接推导 raw 路径，抓取 `marketplace/marketplace.json`：

- GitHub：`https://raw.githubusercontent.com/worm-longliu/worm-print-platform/master/marketplace/marketplace.json`
- Gitee：`https://gitee.com/worm-longliu/worm-print-platform/raw/master/marketplace/marketplace.json`

抓取失败（网络不可达、路径变化、返回非 JSON）时，明确报错并请用户提供版本号，禁止臆测，也不要用本地缓存冒充官方版本。

## 2. 读本地状态

读取 `.worm-print/plugins.json` 中 `plugins[id].version`，得到该插件已装版本。

- 文件不存在视为未安装。
- 不要用 `package-lock.json` 或 `node_modules` 里的版本替代这份清单作为判断依据：市场插件通过 CLI 分发，版本以该清单为准。

## 3. 识别宿主框架

读 `package.json` 依赖区分 Vue 3 / Vue 2 / React / 无框架，并参考 `vite.config.*` 等构建配置确认。识别不出时必须提问用户，不得假定。各框架挂载方式见 [框架接入要点](framework-recipes.md)，安装方式见 [安装方式选择](installation.md)。

## 4. 判断分支

用语义化版本比较（不做字符串比较），得出三种结论之一：

| 条件 | 结论 |
| --- | --- |
| 已装且官方 `version` 更高 | 有更新 |
| 未安装 | 需安装 |
| 已装且版本相同或更高 | 无需操作 |

`engines.core` 用于判断与宿主 core 版本的兼容性；不满足时先提示升级 core / canvas 同批版本，再处理插件。

## 5. 逐个询问

确认后才执行，不擅自安装或升级。按顺序逐个提问：

1. 是否执行更新或安装。
2. 框架识别不确定时，确认宿主前端框架。
3. 打印链路 A（浏览器）/ B（服务端 PDF）/ C（桌面客户端静默打印）/ 并存，沿用本技能既有口径。
4. 更新源是否与默认 `auto` 一致；默认按 npm → Gitee → GitHub，不主动切换。

## 6. 执行

按 [安装方式选择](installation.md) 与本技能契约执行：

- 更新命令：`npx @worm-print-platform/marketplace install <id> --force`。
- 更新源顺序 npm → Gitee → GitHub 不变；`--source auto` 已遵循，npm 可用时不要手动切到 Git 源。
- 更新后按 [故障排查](troubleshooting.md#市场插件安装升级与语言异常) 验收：旧文件是否残留、失败时旧入口与旧清单是否仍可读。

命令细节见 [安装方式选择](installation.md#市场插件安装与更新)。
