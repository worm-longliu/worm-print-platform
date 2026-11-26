# demos · 五个示例工程的打印设计器集成

> 演示对象 `@worm-print-platform/canvas` 已作为设计器权威实现正式发布，**当前稳定主线以仓库根 `package.json` 版本为准**（编写本文时为 1.6.6；旧版 1.5.x 描述已过时），可用于生产环境。`core` / `canvas` / `plugin-kit` 同号同批发版。旧仓 `@worm-vue3-print/canvas`（见 [worm-vue3-print](https://github.com/worm-longliu/worm-vue3-print)）进入维护状态，Vue 3 老项目可经 `/vue3` 兼容门面零业务改动迁移。

`@worm-print-platform/canvas`（`<print-designer>`）在 **Vue 3 / Vue 2.7 / React 18 / jQuery** 四种宿主里的接入示例，
外加 `print-demo` —— 业务侧完整接入示例（模板管理 + 设计器 + 体检报告 + 静默打印配置，MSW 模拟 `/sys/print/*`）。
每个 `apps/<宿主>` 都是一个独立 npm 工程，把自己的集成代码全部写在自家文件里，
**没有任何共用壳层**——想接哪个宿主，就把那个工程整份抄进你的项目改数据源。

四个宿主工程的**界面版式完全一致**：同一份顶栏动作、同一个全屏打印预览层、
同一套「打印输出 / 加载示例 / 自定义字段与数据」弹窗，以及顶部「配置」弹窗
（两个开关控制设计器工具栏「预览 / 保存」按钮显隐；换肤不在此暴露，通过给
`<print-designer>` 传 `theme` / `themeConfig` 参数实现，见 integration 技能接入 API）。
样式收敛在各自 `apps/<宿主>/src/styles/demo-ui.css`（四份同源产物，以 vue3 的为唯一源，其余三份不要手改），
示例库在各自 `apps/<宿主>/src/templates.js`（同样以 vue3 的为唯一源）。

> 这里刻意不做逻辑抽象：demo 的价值在于读者能在一个文件里看完「注册元素 → 注入模板与字段 → 听事件 → 出纸」，
> 而不是跳到某个 shared 包里去看封装。四个宿主工程的重复是有意为之；样式与示例库是两份同源产物，
> 改动 vue3 的这两份文件后分别运行 `npm run styles:demos` / `npm run samples:demos` 同步到其余三宿主。

`demos/shared/template-session.ts` 是**桌面客户端「AI 助手」通道**（template.attach / template.get / template.apply）
的参考实现：页面侧接入 MCP 的完整会话生命周期（重试、revision 冲突拒绝、封禁元素拒绝、写回校验），
客户端集成测试也复用同一份源码。

**四个宿主 demo 均已接入该通道**：每个工程自带 `src/mcp-session.js`（vue3 / vue2 / react 为完整读写，
jquery 直挂为只读，见下），页面加载即连接桌面客户端并 `template.attach` 签到；顶栏
`.demo-ai-status` 徽标显示「未连接 / 待配对 / 已连接」。会话用独立 `PrintClient`，与打印输出
弹窗里的打印 client 互不干扰。

| 工程 | MCP 会话模块 | 能力 |
| --- | --- | --- |
| `apps/vue3` | `src/mcp-session.js` | 读写：`template.get` 返回实时快照 + 稳定 revision；`template.apply` 做 revision 冲突拒绝、`findBlockedElementPaths` 封禁拒绝、结构校验、深拷贝写回并从画布重读 |
| `apps/vue2` | `src/mcp-session.js` | 同 vue3（Options API 直接读 `this` 数据） |
| `apps/react` | `src/mcp-session.js` | 同 vue3（用 ref 桥接最新 fields / printData / 当前示例，StrictMode 下 effect cleanup 成对 start/stop） |
| `apps/jquery` | `src/mcp-session.js` | **只读**：直挂 UMD 只导出 `PrintClient` / `WormPrintError`，无 `MESSAGE_TYPES` / `findBlockedElementPaths`，按官方规范 `template.get` 可读、`template.apply` 明确拒绝；需要 AI 写回请用前三个 NPM 宿主 |

会话模块是宿主接线代码、非库公开 API，与参考实现同口径但各自内联一份，符合「四工程无共用壳层」的约定。

## 工程与端口

| 工程 | 端口 | 接入形态 | 集成代码所在 |
| --- | --- | --- | --- |
| `apps/vue3` | 9331 | NPM 包 + SFC | `src/App.vue`（版式骨架 + property 注入 + 事件 + 三条打印链路 + MCP 会话接线）、`src/SampleThumb.vue`、`src/{render-client,browser-render,mcp-session}.js` |
| `apps/vue2` | 9332 | NPM 包 + SFC（`@vitejs/plugin-vue2`，runtime-only 构建，Options API） | 同上（`src/App.vue` + `src/SampleThumb.vue` + `src/mcp-session.js`；入口 `src/main.js` 只做注册与挂载） |
| `apps/react` | 9335 | NPM 包 + hooks | `src/App.jsx` + `src/components/*.jsx`（三个弹窗）+ `src/SampleThumb.jsx` + `src/mcp-session.js` |
| `apps/jquery` | 9334 | **JS + CSS 直挂**（无打包器、不 import 插件） | `index.html`（版式骨架，弹层用 `hidden` 切换）+ `src/{app,gallery,thumb,print-dialog,ui,mcp-session}.js` |
| `apps/print-demo` | 9336 | NPM 包 + SFC（业务接入示例，MSW 模拟后端） | `src/views/print/**`（模板管理 / 设计器 / 体检报告 / 静默打印配置）+ `src/print/registry.ts` |

`index.html` 是这五个示例工程的静态导航页（`print-demo` 卡片指向 :9336）；
`node scripts/serve-nav.mjs`（或根目录 `npm run dev:demos:nav`）把它挂在 **:9300**，`dev-all.mjs` 会顺带起它。
四个页面的顶栏都有同一个「宿主示例」下拉（`.demo-host-switch`，无 JS 的 `<details>`，菜单项用 `<a>` 不占按钮位），
收起时只显示当前宿主名，展开即可跳到其余三个。

## 跑起来

```bash
node scripts/install-all.mjs   # 五个工程各自 npm install（file: 依赖指向本仓库 packages/，缺 dist 会先按依赖序构建）
node scripts/dev-all.mjs       # 一次起五个 dev server + :9300 总览页
```

示例字体（OFL，三款）统一收在 `assets/fonts/`，跑 demo 前拷进宿主 `public/fonts/`（详见 `assets/fonts/README.md`）。

或者只跑一个：

```bash
cd apps/vue3 && npm install && npm run dev
```

jQuery 那份没有构建步骤：`npm install` 的 postinstall 会把包里的 `dist/canvas.js`、`dist/canvas.css`
拷进 `public/vendor/`，`npm run dev` 用一个 40 行的 `server.mjs` 提供静态服务 + `/render-api` 透传。

## 每个 demo 都摊开了什么

- **设计器挂载**：字符串开关（`is-edit`、`show-help`）走 attribute，`fields` / `template` / `fonts` /
  `uploadImage` 等对象与函数一律赋 property（宿主模板绑对象会被字符串化，这是最常见的接错方式）
- **宿主回调**：`uploadImage` / `uploadDesignBackground`（demo 用 Data URL 模拟上传）
- **事件**：`save`（detail = 模板 JSON，demo 里下载成文件）、`preview`（detail 同为 JSON，用来唤出全屏预览层）、
  `help`、`dblclick-element`（detail **就是元素 id 字符串本身**，不是 JSON，别 `JSON.parse`）、
  `dblclick-cell`（detail 为 `{ elementId, r, c, cellId }` 对象）；写 `console.log` + 下载 + `alert`，不再另设宿主侧栏面板
- **旁路 API**：`getTemplateJson()`、`validateTemplate()`（保存/导出前必须自己调，旁路不经拼版闸门）、
  `loadTemplate()`、`save()`
- **三条出纸链路**：
  1. 浏览器：`renderHtmlPages(template, data, baseUrl, browserCodeRenderer)` → 写进预览层 iframe → `iframe.contentWindow.print()`
  2. 服务端：`POST /render-api/render/pdf`（dev 代理注入密钥，前端代码不带密钥）→ PDF blob
  3. 桌面客户端：同一个 `renderHtmlPages` 产物 → `PrintClient.printHtml(..., { printerName })` 静默出纸
  后两条收进顶栏「打印输出」弹窗，首次打开才探测，离线自动置灰并给可读提示
- **图表插件（可选）**：`apps/vue3` 额外安装 `@worm-print-platform/echarts`，
  `import '@worm-print-platform/echarts/ui'` 即注册（plugin-kit 设计器 UI + core 插件描述符一并生效），
  示例库比其余三个宿主多一组图表示例
- **示例模板库**：顶栏「加载示例」唤出卡片弹窗，缩略图按模板坐标等比绘制版式示意（四宿主同一算法）
- **自定义字段与数据**：粘贴 fields/data JSON，格式化、非法拦截、应用即时生效
- **批量**：顶栏开关把数据换成数组传给同一条管线，份间分页并合并为一个作业

可选依赖没起时不报错、不白屏：`npm run dev:render`（:3001）没起 → 「渲染服务离线」；
本机 print-client（:17521）没起 → 「打印客户端离线」。

## 验收

```bash
node scripts/verify-demo.mjs http://localhost:9331/   # 逐个跑 9332 / 9335 / 9334
```

34 项 UI 级断言（四个宿主同一套，全部按统一类名判定）：顶栏动作数与 `.demo-badge` 口径、
顶栏「宿主示例」下拉的收起态（四个工程入口齐备、只有当前宿主标 `.on`）与展开态
（菜单挂在顶栏下方，且 18 个采样点的命中测试全部归菜单——顶栏与画布容器是同级的 flex item，
浏览器按原子层整体绘制，层级不够菜单会被设计器整片盖住，只看元素尺寸会漏判）、
画布真的撑满 `.demo-container`（防「DOM 全绿但布局塌陷」）、宿主侧栏已删除、示例库卡片与缩略图、
页签筛选与应用、全屏预览层出纸（纸面数 / 文本 / 码值节点）与批量份数、自定义 JSON 的非法拦截与应用生效、
打印输出弹窗两条链路的状态与离线置灰、导出模板真的触发下载、全程 console 洁净。
其中示例库的卡片数、徽章示例名与标签页签计数直接读产物 `apps/vue3/src/templates.js`，示例增删后断言自动跟着走。

### 业务场景全量回归

```bash
node scripts/verify-business-scenarios.mjs http://localhost:9331/           # 全量：遍历示例库全部示例
node scripts/verify-business-scenarios.mjs http://localhost:9332/ --quick  # 快检：只跑体检报告深度场景
```

以 `templates.js` 为用例源（新增示例自动纳入），逐个走「示例库选中 → 模板注入与 `validateTemplate()` →
预览出纸 → 数据绑定与未求值表达式残留」。另对多页体检报告做深度断言：`{ version: 1, pages }` 五页完整加载、
页签按检验项目命名、各项目独立成页、表格与多级表头、三张内联 SVG 图表在画布与纸面同时可见、
合并单元格（按列聚合）与分组小计（表达式绑定）纸面数值正确、`print-designer` 属性旁路可编程修改模板。

### 契约级回归（单测侧）

`packages/contract/src/__tests__/real-templates.test.ts` 把 `templates/` 下的真实模板 JSON
（与 demo 同源）纳入契约校验，模板文件坏了在 CI 就能发现，不必等浏览器验收。
