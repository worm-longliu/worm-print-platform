# 更新日志

## V1.6.6(2026-11-26)

- **出纸渲染修复**：`core` 渲染管线补上文本元素 `textDecoration` 声明，字段下划线 / 删除线在设计态与预览、打印、PDF、客户端静默打印保持一致。
- **设计器交互修复**：`canvas` 横向滚动条拖动失效修复，并补回归测试。
- **演示体验增强**：Vue 3 示例拆为设计稿与预览阶段，支持逐页展示、缓慢滚动与特色模版步骤，配音与字幕节奏同步调整。
- **文档同步**：新增插件更新判断流程与按框架安装指引，修复失效链接并校正 Gitee 链接；集成技能与示例文档同步至 1.6.6。
- **版本载体对齐至 `1.6.6`**：各工作区包、demos、MCP / canvas / marketplace 版本常量、文档示例与徽章同步；桌面客户端因 core 渲染改动重新打包上传 v1.6.6 安装包。

## V1.6.5(2026-11-25)

- **混合方向多页预览修复**：`print_preview_template` 的窗口尺寸、`pageSizeMm`、`mmPerPx` 与元素测量全部改用目标页纸张；截图改为删除非目标页而非滚动，消除 `page=N` 返回首页内容与纸张尺寸错用问题；单页 / 批量 / 拼版路径回退 `paperMm`，行为不变。
- **图表字段选择改造**：图表插件字段选择统一为表达式弹框（仅字段页签），取消默认赋值；`plugin-kit` 的宿主契约新增 `openExpression`，`ExpressionEditorTarget` 新增 `fieldOnly` / `fields`。
- **文档同步**：新增 Wiki 同步脚本的设计与实施计划；集成技能、接入指南与内置更新记录同步至 1.6.5。
- **版本载体对齐至 `1.6.5`**：各工作区包、demos、MCP / canvas 版本常量、文档示例与徽章同步；桌面客户端本轮源码有变更，重新打包上传 v1.6.5 安装包。

## V1.6.4(2026-11-24)

- **插件市场安装修复**：`data-preview` 白名单覆盖完整 `dist`，市场产物纳入 Git；`--force` 改为暂存、原子切换与失败回滚，清理旧文件和已取消的语言资源。
- **图表运行时修复**：`echarts` 元数据 label 与 UI group 改惰性 getter，市场入口导入不再产生 7 条 i18n 缺键告警，三语标签随 locale 同步切换。
- **发布门禁**：新增官方插件元数据、产物入库与 `plugins/<id>/vX.Y.Z` 标签校验；npm 发布工作流强制拉取并校验插件标签。
- **接入文档**：根 README 明确打印插件更新按 npm → Gitee → GitHub；补齐 `.gitignore`、Vite、happy-dom 测试边界与故障排查，并同步集成技能。
- **版本载体对齐至 `1.6.4`**：各工作区包、demos、MCP / canvas 版本常量、文档示例与徽章同步；桌面客户端本轮不重新打包，沿用 v1.6.1 安装包。

## V1.6.3(2026-11-24)

- **数据绑定串用修复**：表格 demo 显式数据源缺失时不再回退到第一个数组，避免条码 / 二维码单元格显示未绑定字段值；图表显式 `chartDataSource` 缺失时保持 `$data` 占位，不再用顶层第一个数组出图，字段下拉不再混入示例数据字段。
- **发布链修复**：`marketplace` / `i18n` 补齐 `repository` 字段，修复 npm Trusted Publishing 的 provenance 校验（E422）并恢复 `publish-npm.yml` 原版。
- **演示与文档**：新增 `demos/live-show` 直播演示控制台与自动讲解流水线（彩排、意图解析、配音与离线循环视频）；接入提示词前置到快速开始并统一七包发布与安装口径；新增 Wiki 同步脚本与设计规格，视频录制上下文固定 `zh-CN`。
- **版本载体对齐至 `1.6.3`**：各工作区包、demos、MCP / canvas 版本常量、文档示例与徽章同步；桌面客户端本轮不重新打包，沿用 v1.6.1 安装包；GitHub Pages 本轮不更新。

## V1.6.2(2026-11-23)

- **插件市场 CLI 修复**：修复入口守卫不识别 npm bin 软链导致 `npx @worm-print-platform/marketplace` 全部命令静默空转（退出码 0）的问题；入口按 realpath 归一，并补软链回归测试。
- **图表插件安装修复**：`dist/i18n` 语言资源入库，修复 `plugin-echarts` 停发 npm 后 Git 源稀疏检出缺语言资源、`install echarts` 报 `INVALID_PLUGIN` 的问题；本地源与 Git 源安装均实测三语资源齐全。
- **插件市场增强**：`list` 支持类型 / 分类 / 标签 / 关键词筛选与 `--index` 指定索引；新增索引校验器 `validate`、静态插件目录页生成器与多语言文本回退函数；索引新增 `type` / `uniqueId` / `versions` 字段；`auto` 源顺序调整为 npm → Gitee → GitHub。
- **发布链扩展**：npm 发布链扩展至七个正式包（core / plugin-kit / canvas / echarts / skills / marketplace / i18n）；百度图表插件经插件市场分发，兼容镜像随主线发版。
- **版本载体对齐至 `1.6.2`**：各工作区包、demos、MCP / canvas 版本常量、文档示例与徽章同步；桌面客户端源码无变更，沿用 v1.6.1 安装包。

## V1.6.1(2026-11-22)

- **多语言能力全面升级**：新增 `@worm-print-platform/i18n` 语言包 CLI（`template` / `validate` / `update`）与配套 AI 技能；core / canvas / client / render / echarts 接入自定义语言资源，语言包支持设计器、服务端 PDF 与桌面客户端切换，新增多语对照表与校验脚本。
- **桌面客户端改进**：设置窗口新增活跃设计器页签，统一会话 ID 为 6 位，补齐模板会话与协议处理回归测试。
- **渲染与设计器修复**：条码点阵、旋转、水印、图片边框、裁剪锚点、表格矩阵与属性搜索等细节修复；设计器消息隔离与语言常量回归测试补齐。
- **文档升级**：`docs/guide` 面向接入用户与 AI agent 全面重写，新增数据转换章节与自定义语言包实施计划。
- **版本载体对齐至 `1.6.1`**：各工作区包、demos、MCP / canvas 版本常量、文档示例与徽章同步；四个代码包 `core` / `plugin-kit` / `canvas` / `echarts` 同号同批发版。
- **百度图表插件分发调整**：`@worm-print-platform/plugin-echarts` 不再单独发布 npm，后续版本通过插件市场 CLI 分发；兼容镜像 `@worm-print-platform/echarts` 继续随主线发版。

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。版本号以 `1.5.x` 主线持续维护迭代，
`core` / `plugin-kit` / `canvas` / `echarts` / `skills` 等正式包同号同批发版；
`contract` / `mcp` 随桌面客户端打包，不单独发布到 npm。

## V1.6.0(2026-11-19)

- **宿主契约新增 `field-display`**：宿主可配置素材台与表达式弹窗的字段显示模式（中文名 / 字段 key / 两者，默认两者）；只显示 key 时样式与中文名一致，分组名始终显示。plugin-kit 表达式编辑器字段行同步支持，canvas 侧提供属性名 `fieldDisplay`，并补齐文档与回归测试。
- **图表数据标签偏移修复**：设计面板改为写入 ECharts 原生 `offset: [x, y]`，读取、写回与出图归一三处统一迁移旧模板的 `offsetX` / `offsetY`，十类图表与 SSR 坐标均有断言覆盖。市场插件 `@worm-print-platform/plugin-echarts` 升至 `1.1.0`，兼容镜像 `@worm-print-platform/echarts` 升至 `1.6.0`。
- **print demo 纳入 GitHub Pages**：站点新增 `/canvas/print-demo/` 入口与四宿主互跳导航，修复 MSW 在 Pages 子路径下的定位与路由，`deploy-pages.yml` 的安装 / 构建 / 拷贝 / 烟雾测试全链路均包含 print-demo；新增开发技能文档与 print demo 介绍页。
- **四个宿主 demo 体验修复**：「更多」面板样式统一真源，修复窄屏布局异常并清理重复条目标签；`dev-all` 前置构建纳入 `plugin-data-preview`，避免 Vue3 示例解析失败。
- **版本载体对齐至 `1.6.0`**：各工作区包、demos、MCP 版本常量、文档示例与徽章同步；`core` / `plugin-kit` / `canvas` / `echarts` 四个 npm 包同号同批发布。

## V1.5.3(2026-11-18)

- **体检报告示例接入百度图表插件**：健康体检报告的柱状图与折线图由 `image` 改为插件 `barChart` / `lineChart` 真实元素，声明 `@worm-print-platform/echarts` 插件并按 `chartDataSource` 绑字段；四个宿主 demo 同源同步。
- **插件市场文档与技能补齐**：新增零基础面单教程计划与脚本设计文档；抖音视频技能补齐片尾卡渲染链路、字幕超宽回归测试、片尾 CTA 新口径与多音字台账。
- **设计器主题支持参数化配色**：新增 `theme`（`auto` / `light` / `dark`）与 `theme-config` 两个参数，attribute 与 property 双通道；优先级为参数覆盖 > 显式预设 > 系统 `prefers-color-scheme` > CSS 令牌 > 内置浅色。内置暗色预设只作用于设计器外壳，纸张、画布背景、标尺与手柄保持原值，预览所见即所得不受影响。
- **设计器状态栏显示版本号**：移除底部「未保存 / 已保存」指示，改为显示 `v<canvas 包版本>`（由 `gen-version` 从 package.json 派生，不漂移）；缩放 / 元素数 / 纸张等其余状态项不变，`save()` 的数据层语义不受影响。
- **宿主契约升级至 1.2.0**：主题令牌清单补全至 55 项，Vue 3 门面同步两个 prop；core 补齐 3 个此前仅有 fallback 的令牌。
- 设计器内置「更新记录」补齐至 V1.5.2，消除与包版本的滞后。
- **四个宿主 demo 新增「配置」弹窗**：顶部新增配置入口，集中预览 / 保存按钮显隐，原有顶部操作与弹窗保持不变。配色配置未纳入示例——换肤通过给设计器传 `theme` / `themeConfig` 实现（画布纸张不受影响），接入文档已补充这两项参数说明。
- 修复 vue2 demo 预览显隐开关失效（模板属性绑定把 `show-preview="false"` 渲染为移除属性），显隐统一走 property setter。

- **图片 base64 支持增强**：设计态图片元素与表格图片单元格的 `{字段}` 表达式，改为优先用宿主注入的 `designData` 求值（未注入仍回落内置 demo 数据），动态 base64 图片现可在设计画布直接渲染；新增「Base64 图片验证」示例覆盖静态内联与动态注入两种写法（四宿主同源）。
- **宿主契约升级至 1.1.0**：新增 `showPreview` / `showSave` 布尔开关（`show-preview` / `show-save` attribute），宿主可隐藏工具栏「预览 / 保存」按钮并自行接管出图业务；隐藏不影响 `save()` 方法与 `save` / `preview` 事件。Vue 3 门面同步提供同名 props。
- **版本载体对齐**：各工作区包与 demos 同步至 `1.5.2`，MCP 客户端版本常量一并更新；桌面客户端源码无变更，沿用 v1.5.1 安装包。
- 补充 `image-design-data` / `toolbar-visibility` 回归测试，更新 canvas README / PARITY / 集成技能文档。

## V1.5.1(2026-11-16)

- **首个 GitHub Release**：新增桌面客户端安装包发行版，mac（x64 / arm64）、Windows、Linux（deb / rpm / AppImage）
  六件安装包随本版发布，README 提供直链与 `SHA256SUMS.txt` 校验清单。
- **版本载体对齐**：各工作区包与 demos 版本同步至 `1.5.1`，MCP 客户端版本常量一并更新。
- **文档转正**：项目明确定为后续维护迭代的稳定主版本；清除各文档中"实验性质 / 尚未发布 / 待发"等过时描述；
  补齐 CHANGELOG、CONTRIBUTING、CODE_OF_CONDUCT、SECURITY 四份开源项目文档。
- **能力增强**：合入表达式引擎中文 key 提示与相关测试、Vue 3 示例模板等改动。

## V1.5.0(2026-11-16)

- **第一个稳定版本**：`core` / `plugin-kit` / `canvas` / `echarts` `1.5.0` 发布到 npm。
- 设计器以 `@worm-print-platform/canvas` 为权威实现，从 `worm-vue3-print` 的 common 生态独立拆仓，
  npm scope 迁移为 `@worm-print-platform/*`；`/vue3` 门面保留 Vue 3 兼容轨。
- 插件化元素正式化：`plugin-kit`（插件设计器 UI 契约）与 `echarts`（图表元素可选包）从工作区源码包升级为 npm 正式包。
- 三条出纸链路（浏览器打印 / 服务端 PDF / 桌面客户端静默打印）共用同一套同构渲染管线。
