# 迁移与故障排查附录（Migration & FAQ）

[← 返回目录](./README.md) | ← 上一篇：[插件开发](./08-plugin-dev.md) | 下一篇：[数据格式转换](./10-data-transform.md) →

> 适用对象：`@worm-vue3-print/*` 老用户，以及遇到接入问题的开发者。
> 版本口径：本仓当前稳定主线 1.6.6；老迁移文档中的「1.5.x 主线」是历史表述，以 workspace `package.json` 版本为准。

## 1. 从 @worm-vue3-print 迁移（摘要）

迁移目标是**业务代码零改动**，只换依赖与 import。核心包名映射：

| 旧（worm-vue3-print） | 新（worm-print-platform） |
| --- | --- |
| `@worm-vue3-print/core` | `@worm-print-platform/core`（子路径 `/designer` `/browser` `/client` 保持，另增 `/node`） |
| `@worm-vue3-print/canvas`（Vue 3 组件） | `@worm-print-platform/canvas/vue3`（模板、事件、ref、业务逻辑一行不动；样式内置，删掉 `style.css` 的 import） |
| `@worm-vue3-print/common`（零框架） | `@worm-print-platform/canvas`（UMD 由 `common.js/common.css` 改为 `canvas.js/canvas.css`，全局 `window.WormPrintCommon` → `window.WormPrintCanvas`） |
| `@worm-vue3-print/echarts` + `echarts-common` | `@worm-print-platform/echarts`（一行 `import '@worm-print-platform/echarts/ui'` 替代两步） |
| `@worm-vue3-print/plugin-kit` | `@worm-print-platform/plugin-kit`（契约与注册表同名同形） |

三条迁移路径：

- **路径 A · Vue 3 组件用户**：换依赖 → import 与类型来源集中到 `/vue3` 子路径 → 换可选图表扩展包。
- **路径 B · 零框架用户**：NPM 接入改包名；UMD 直挂替换两份静态文件并改全局名；依赖 `<print-designer>` / property 注入 / CustomEvent 的业务代码不动。
- **路径 C · 源码 / 工作区引入用户**：`plugin-kit` / `echarts` 全部改为 npm 正式包，删掉 Vite `resolve.alias` 与 `tsconfig.paths` 的旧别名。

完整映射表、逐条 diff、行为差异清单与 AI 迁移提示词见 [migration-worm-vue3-print.md](../migration-worm-vue3-print.md)（注意其中版本描述可能滞后，以当前主线为准）。

### 迁移检查清单（Verification）

- [ ] `npm uninstall` 旧包、`npm install` 新包，`core`/`canvas`/`plugin-kit` 同号同批并提交锁文件。
- [ ] 全仓 `import` 路径已替换（`/vue3` 门面或 canvas 主入口）；`import type` 一并换到 `/vue3`。
- [ ] Vue 3 门面已删除 `style.css` 的手动 import；零框架 UMD 已换成 `canvas.js` + 包导出 `style.css`、`WormPrintCanvas` 全局名。
- [ ] `npm run build` / 类型检查通过。
- [ ] 设计器保存模板 JSON → 重新打开回填 → 预览渲染真实数据 → 打印链路跑通。
- [ ] 若用了 echarts：只保留一种注册方式（npm `/ui` 或市场插件），无重复注册。

## 2. 故障排查 FAQ

- **插件装了不生效**：确认 `dist/` 已预构建并纳入版本控制、入口副作用模块已被 import（静态 import 或按清单动态加载），构建工具对 core/plugin-kit 做了 `dedupe`；更新时使用带暂存与原子切换的新版 CLI 执行 `install <名称> --force`，失败会保留旧版。入口缺失、升级残留与 i18n 缺键的完整处理见 [07 §4](./07-plugin-install.md#4-排错troubleshooting)。
- **切换语言后译文不更新**：不要在模块加载期把译文求值成常量——那会冻结为当时的语言。控件文本在渲染时调 `t()` / `ctx.t`；导出常量存 key、用 getter 每次读取取词。详见 [06 §3.5](./06-i18n.md#35-排错与已知限制)。
- **跨副本注册失效**：core 与 plugin-kit 用 `Symbol.for` 全局注册表保证单实例；若出现「注册了却找不到」，检查是否打包出多份 core / plugin-kit，并做 `dedupe`。
- **打印不出纸**：按三条链路分别排查——浏览器打印确认 iframe 已加载且调用 `contentWindow.print()`；服务端 PDF 确认 `services/render` 已部署且后端持密钥代理；静默打印确认本机客户端已启动且监听 `127.0.0.1:17521`。

更完整的诊断步骤、常见报错与环境检查见 integration 技能的 [troubleshooting.md](../../skills/worm-print-platform-integration/references/troubleshooting.md)；服务端 PDF 与静默打印分别见同目录的 `server-render.md` 与 `silent-print.md`。

## 3. AI 工具集成提示词（迁移场景）

通用门控/安装/验收模板见 [01 §5](./01-getting-started.md#5-ai-提示词模板唯一模板源)，本场景额外约束：

```text
【任务】把 @worm-vue3-print 项目迁移到 @worm-print-platform。
- 按 09 §1 包名映射替换依赖与 import；Vue 3 走 /vue3 门面，业务代码不改。
- core/canvas/plugin-kit 同号同批；门面删除 style.css import；UMD 改 WormPrintCanvas 全局名。
- 迁移后逐条核对 09 §1 的「迁移检查清单」，不要只改包名就宣称完成。
【验收】构建/类型检查通过；保存→回填→预览→打印链路跑通；无重复插件注册。
```

[← 返回目录](./README.md) | ← 上一篇：[插件开发](./08-plugin-dev.md) | 下一篇：[数据格式转换](./10-data-transform.md) →
