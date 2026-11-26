<p align="center">
  <strong>@worm-print-platform/skills</strong><br>
  <em>官方技能安装器（CLI + npm 包）</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/npm-v1.6.6-384BFF" alt="npm">
  <img src="https://img.shields.io/badge/node-%E2%89%A518-4B9B4B" alt="node">
  <img src="https://img.shields.io/badge/license-MIT-9A9A9A" alt="license">
</p>

> monorepo 根：[worm-print-platform](https://github.com/worm-longliu/worm-print-platform) · 仓库内技能源码：[`skills/`](../../skills/)

`worm-print-platform` 官方技能安装器。从 GitHub / Gitee 仓库把技能安装到本地项目，让 AI Agent 在开始动手前先读规范、按既定方式接入。

**bin 命令**：`worm-print-skills`（npx 调用 `npx @worm-print-platform/skills` 即可）

## 安装

```bash
# 方式一：npx 调用（推荐）
npx @worm-print-platform/skills <技能名>

# 方式二：全局安装（常用）
npm i -g @worm-print-platform/skills
worm-print-skills <技能名>
```

## 用法

```bash
npx @worm-print-platform/skills <技能名> [选项]

选项:
  --repo <地址>         仓库地址（GitHub / Gitee 均可，缺省时默认双源：
                          github.com/worm-longliu/worm-print-platform →
                          gitee.com/liulong_oschina/worm-print-platform，
                          先 GitHub，失败自动回退 Gitee。支持 owner/repo 简写）
  --dir <目录>          技能根目录，技能装到 <目录>/<技能名>/。默认 .agents/skills
  --force               目标技能目录已存在时覆盖（默认拒绝并报错）
  -h, --help            显示帮助
  -v, --version         显示版本
```

### 示例

```bash
# 安装宿主集成规范（默认装到 .agents/skills/worm-print-platform-integration/）
npx @worm-print-platform/skills worm-print-platform-integration

# 安装桌面 MCP 工具到 qoder 项目级目录
npx @worm-print-platform/skills worm-print-platform-mcp --dir .qoder/skills

# 指定仓库地址
npx @worm-print-platform/skills worm-print-platform-integration \
  --repo https://gitee.com/liulong_oschina/worm-print-platform.git

# 覆盖已有技能
npx @worm-print-platform/skills worm-print-platform-integration --force
```

### 退出码（便于脚本与 AI Agent 判定失败类型）

| 码 | 含义 |
| --- | --- |
| 0 | 成功 |
| 2 | 参数错误 |
| 3 | 目标目录已存在（需 `--force`） |
| 4 | 技能名在仓库中未找到 |
| 5 | 仓库操作失败（clone / sparse checkout 出错） |
| 6 | 系统缺少 `git` |

## 仓库内已维护的技能

| 技能 | 覆盖范围 |
| --- | --- |
| `worm-print-platform-integration` | 全形态宿主集成：NPM 宿主的 `canvas/vue3` 门面与 `<print-designer>` 契约、浏览器直挂 / Vue 2 / React / jQuery、三条打印链路、AI 集成提示词、故障排查 |
| `worm-print-platform-i18n` | 自定义语言包：骨架生成、校验、人工审核对照表、浏览器/render/client 三端接入与排错 |
| `worm-print-platform-mcp` | 桌面 MCP 工具：模板会话、渲染预览、视觉回读与参考图比对 |

技能源码随本仓库分发（`skills/<技能名>/` 目录），安装器会 sparse-checkout 整个目录。

## 手动取用（离线回退）

无 npm / git 环境时，从 [GitHub](https://github.com/worm-longliu/worm-print-platform) 或 [Gitee](https://gitee.com/liulong_oschina/worm-print-platform) 仓库的 `skills/<技能名>/` 目录手动下载，放到 AI 编程工具的技能目录（`.agents/skills/` / `.qoder/skills/` / `.claude/skills/` 等）并重载。

## 开发

```bash
npm run build       # tsup → dist/
npm run typecheck   # tsc --noEmit（pretest）
npm test            # vitest
```

## 相关链接

- [根 README AI Agent 配套技能章节](https://github.com/worm-longliu/worm-print-platform/blob/main/README.md#ai-agent-配套技能)
- [docs/README.md 技能安装方法](../../docs/README.md#技能安装方法提示词第-0-步的通用说明)

## License

[MIT](../../LICENSE)
