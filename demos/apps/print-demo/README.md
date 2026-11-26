# @worm-print-platform/demo-print（打印模板业务接入示例）

按宿主端现有代码风格演示「打印模板类型 → 字段/数据 → 模板管理 → 设计器 → 浏览器打印」的完整接入。
本工程是 `worm-print-platform` 的官方示例之一，源码由宿主基座项目的 `web/apps/print-demo` 迁入。

- 设计器：`@worm-print-platform/canvas/vue3` 门面，依赖 `file:../../../packages/canvas` 指向本仓源码（版本 1.6.6）
- 数据：MSW + localStorage 模拟 `/sys/print/*`，不需要后端（本地 dev 与 Pages 静态部署均启用；设 `VITE_NO_MOCK=true` 可关闭以对接真实后端）
- 打印：仅链路 A（浏览器打印）
- 默认模板：5 类默认值与打印平台 `demos/apps/vue3` 官方示例一致（快递面单 / 称签 / 零售小票 / 付款申请单 / 健康体检报告），本地 TS 数据文件交付；体检报告为多页模板且自带图表。
- 静默打印配置：独立菜单「静默打印配置」(`/print/silent-config`)，按 5 种模板类型分别配置默认模板、打印机、份数、纸型覆盖、彩色；配置存 `print:cfg:<businessType>`，连接参数存 `print:client`。体检报告点「静默打印」直接用该类型配置一键出纸，不再选模板；未配置时提示并跳转配置页。

## 快速开始

```bash
# 仓库根（file: 依赖指向本仓 packages/*，需先构建其 dist，见 demos/README.md）
cd demos/apps/print-demo
npm install
npm run dev              # http://127.0.0.1:9336
```

也可在仓库根运行 `npm run dev:demos:print`，或用 `node demos/scripts/install-all.mjs` 统一安装全部宿主示例。

## 集成到已有项目

- **集成提示词**：[PROMPT.md](./PROMPT.md) —— 复制整段给你的 AI 编程工具，按门控、安装形态、插件依赖范围勾选、表设计、CRUD、验收标准逐步执行。
- **文档索引**：`demos/README.md`（本仓宿主示例总览）

### 插件依赖范围（用户按场景勾选）

- 必选：`@worm-print-platform/core` + `canvas` + `plugin-kit`（同号 `1.6.6`，不要只锁两个版本）；本工程用 `file:` 指向本仓源码，外部宿主从 npm 安装
- 图表 / 体检报告类必选：`@worm-print-platform/echarts`（从 `@worm-print-platform/echarts/ui` import 即注册）
- 可选：`@worm-print-platform/plugin-data-preview`（不单独发 npm；需要时执行 `npx @worm-print-platform/marketplace install data-preview --force`）
- 禁止：`@worm-vue3-print/*` 旧包名

## 命令

| 命令 | 说明 |
|---|---|
| `npm run dev` | 本地开发（9336） |
| `npm run typecheck` | 类型检查 |
| `npm run build` | 生产构建 |
| `npm test` | vitest 单测（28 项 / 7 个文件） |
