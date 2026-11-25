# 安装方式选择与操作

## 推荐询问方式

如果用户没有说明，用一句话确认：「需要直接使用发布包集成，还是要修改/调试 worm-print-platform 源码？」不要把源码安装作为默认方案。

## 方案 A：NPM 包安装（生产集成默认）

### 仅使用渲染/表达式引擎

```bash
npm install @worm-print-platform/core
```

### 使用可视化设计器 + 浏览器预览（任意框架）

```bash
npm install @worm-print-platform/canvas @worm-print-platform/core
```

- canvas 主入口零框架依赖，不强制宿主安装 Vue / React；它的运行时依赖 `@worm-print-platform/plugin-kit` 会随包带入。
- **Vue 3 宿主（尤其原 `@worm-vue3-print/canvas` 用户）走正式门面**：组件从 `@worm-print-platform/canvas/vue3` 导入，`vue` 是该子路径的 optional peer，按项目实际安装（原项目已有 vue 则无需额外操作）。见下方「Vue 3 宿主安装与迁移」。
- 浏览器直挂（无打包器）用 `@worm-print-platform/canvas/browser` 指向的 UMD 产物 `canvas.js` + `canvas.css`，见下方 [浏览器直挂](#浏览器直挂无打包器--jquery--传统项目)。
- 建议提交锁文件，避免 NPM 侧依赖升级引入构建差异。
- core 与 canvas、plugin-kit 同号同批发版；显式安装相同版本并提交锁文件，不要只锁其中两个。

### Vue 3 宿主安装与迁移

Vue 3 组件写法是本仓正式支持的路径，与原生 `<print-designer>` 等价，底层是同一份设计器。**迁移目标：业务代码零改动，只换依赖和 import。**

```bash
# 新 Vue 3 项目
npm install @worm-print-platform/canvas @worm-print-platform/core vue

# 原 @worm-vue3-print/canvas 项目：卸载旧包，装新包（vue 保留）
npm uninstall @worm-vue3-print/canvas @worm-vue3-print/core
npm install @worm-print-platform/canvas @worm-print-platform/core
```

然后用 `@worm-print-platform/canvas/vue3` 替换所有 `@worm-vue3-print/canvas` 的 import 与 `import type`，模板 / 事件 / ref 调用 / 业务逻辑不改。完整 diff 与组件契约见 [接入 API 的迁移对照](integration-api.md#4-从-worm-vue3-printcanvas-迁移到本仓)。

Vue 3 门面**无需**配 `isCustomElement`、无需引 CSS（组件自注入），也无需手动把对象赋 property——这些是原生元素形态才要做的。可选图表插件换为 `@worm-print-platform/echarts`（`@worm-print-platform/echarts/ui` import 即注册）。

### 样式导入

canvas 用 Shadow DOM 内联注入样式，普通 `registerAll()` 用法**不需要**额外引 CSS。只有把设计器渲染进 light DOM 时才引入公开样式子路径：

```ts
import '@worm-print-platform/canvas/style.css'
```

不要深路径引用 `dist/`，也不要引用不存在的子路径（本仓没有 `native-controls.css`，那是拆仓前源码别名方式的旧入口）。

### 静默打印浏览器端 SDK

需要无打印对话框的静默出纸时，SDK 随 core 提供，无需单独安装（从子路径 `@worm-print-platform/core/client` 导入），需另配本机运行的桌面打印客户端。接入与客户端部署见 [静默打印](silent-print.md)。

### canvas 包子路径清单

- `@worm-print-platform/canvas`：ESM/CJS + 类型，主入口（零框架 Custom Element）。
- `@worm-print-platform/canvas/vue3`：Vue 3 正式门面组件（vue 为可选 peer），与原 `@worm-vue3-print/canvas` 组件写法同形。
- `@worm-print-platform/canvas/browser`：UMD 浏览器产物（`canvas.js` + `canvas.css`），浏览器直挂用。
- `@worm-print-platform/canvas/style.css`：light DOM 兜底样式。

### 市场插件安装与更新

官方 `echarts` 与 `data-preview` 通过市场 CLI 分发，不单独发布 npm：

```bash
npx @worm-print-platform/marketplace install echarts --force
npx @worm-print-platform/marketplace install data-preview --force
```

- 更新源严格按 **npm → Gitee → GitHub**；默认 `--source auto` 已遵循，npm 可用时不得手动切到 Git 源。
- `echarts` 入口是 `.worm-print/plugins/echarts/dist/marketplace.js`，`data-preview` 入口是 `.worm-print/plugins/data-preview/dist/index.js`。
- 市场 `dist` 必须纳入宿主版本控制；若已有通用 `dist/` 或 `.worm-print/` 忽略规则，用精确例外放行插件目录与 `dist/**`。
- 入口放 `src/main.js/ts` 静态 import，不把本地插件路径写进 Vite `optimizeDeps.include`。
- `--force` 暂存后原子切换，失败恢复旧插件、旧语言与旧清单；不要先 `rm -rf` 旧目录。

从官方仓库链接判断是否需要更新、以及按宿主前端框架选择安装方式，见 [插件更新判断与按框架安装](plugin-update-flow.md)。

### 浏览器直挂（无打包器 / jQuery / 传统项目）

从 `@worm-print-platform/canvas/browser` 对应产物把 `canvas.js` 与 `canvas.css` 拷到宿主静态目录（真实项目等价于「从制品库下载这两个文件」）。`canvas.js` 是 UMD，已内联 core 与码制库，挂出全局 `window.WormPrintCanvas`：

```html
<link rel="stylesheet" href="/vendor/worm-print-canvas.css" />
<script src="/vendor/worm-print-canvas.js"></script>
<script>
  WormPrintCanvas.registerAll()
</script>
```

Shadow DOM 不需要外链 CSS；只有明确使用 light DOM 时才需要那份 `worm-print-canvas.css`。`canvas.js` 全局除 `registerAll` / `createDefaultTemplate` / `DesignerStore` / `PrintDesignerElement` 外，还一并挂出出纸与自绘缩略图所需入口：`renderHtmlPages`、`browserCodeRenderer`、`PrintClient`、`WormPrintError`、`getPaperDimensions`、`isContinuousPaperSize`、`getByPath`，以及预览缩放与顶栏收纳工具（`zoomPresets`、`resolveToolbarOverflow` 等）。直挂宿主拿不到裸包名，所有能力都从这个全局取。

参考 `demos/apps/jquery`：它的 `postinstall` 用 `scripts/sync-assets.mjs` 把包 dist 两份文件拷进 `public/vendor/`，用一个静态 server + `/render-api` 透传即可跑，无构建步骤。

### 框架构建配置（宿主侧）

- Vue 2.7 用 `@vitejs/plugin-vue2`，`main.js` 里 `Vue.config.ignoredElements = ['print-designer']`；模板只放字符串 attribute，对象/函数赋 property。
- React 18 用 `@vitejs/plugin-react`，未知标签按原生元素渲染，无需自定义元素编译配置；事件用 `addEventListener` 并在 cleanup 解绑。
- Vue 3（NPM）用 `@vitejs/plugin-vue` 并配 `isCustomElement: tag => tag.startsWith('print-')`；Vue 3 宿主优先改用 `@worm-print-platform/canvas/vue3` 正式门面（组件写法，无需本配置）。
- 宿主框架依赖由宿主自行安装，canvas 不安装 Vue 或 React 运行时。

各框架生命周期、property 注入时机与事件解绑的更多差异见 [框架接入要点](framework-recipes.md)。

## 方案 B：源码安装

适合调试/修改库源码、验证未发布分支、在 monorepo 内开发。

### B1. 准备源码仓库

```bash
git clone <用户提供的 worm-print-platform 仓库地址>
cd worm-print-platform
npm install
npm run build
npm test
```

`npm run build` 按依赖序构建所有 workspace（core → plugin-kit → contract → mcp → canvas → echarts → render → client）。若后续通过 Vite 别名直接消费 `src`，构建仍建议执行一次，用于验证当前源码可构建。

构建清理 `dist` 可能触发沙箱批量删除守卫；本机环境可按需用 `CODEBUDDY_SAFE_DELETE_ENABLED=0 npm run build`，CI 无此限制。改了 core / plugin-kit 源码后，下游 canvas / render / client 依赖它们的 `dist`，必须先重建对应包，否则会看到旧声明或 `ERR_MODULE_NOT_FOUND`。

### B2. 外部宿主使用 `file:` 安装本地包

```bash
npm install <仓库路径>/packages/core <仓库路径>/packages/canvas <仓库路径>/packages/plugin-kit
```

该方式消费 `packages/*/dist`。修改库源码后必须回到仓库根执行 `npm run build`。样式仍用 `@worm-print-platform/canvas/style.css`（light DOM 场景）。

### B3. Vite 直接消费源码（最接近 demo）

适用于需要调试 `.ts` 源码或让本地修改立即生效。在 `vite.config.ts` 配置别名（CSS / 具体子路径必须排在包名路径之前）：

```ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const repo = fileURLToPath(new URL('../worm-print-platform', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@worm-print-platform/canvas/style.css': `${repo}/packages/canvas/dist/canvas.css`,
      '@worm-print-platform/canvas/vue3': `${repo}/packages/canvas/src/vue3/index.ts`,
      '@worm-print-platform/canvas': `${repo}/packages/canvas/src/index.ts`,
      '@worm-print-platform/plugin-kit': `${repo}/packages/plugin-kit/src/index.ts`,
      '@worm-print-platform/core': `${repo}/packages/core/src/index.ts`,
    },
  },
  server: { fs: { allow: [repo] } },
})
```

Vue 3 源码别名要点：门面组件路径是 `packages/canvas/src/vue3/index.ts`（上面别名已含 `@worm-print-platform/canvas/vue3` 条目）。门面用渲染函数直接生成原生元素，**不需要** `isCustomElement` 配置；只有 Vue 3 宿主直接在模板里写原生 `<print-designer>` 标签时才需要给 `@vitejs/plugin-vue` 配 `template.compilerOptions.isCustomElement: tag => tag.startsWith('print-')`。React 无需此配置。可运行工程见仓库 `demos/apps/{vue3,vue2,react,jquery}`。

### 方案选择速查

| 条件 | 选择 |
| --- | --- |
| 使用已发布稳定功能 | NPM 包 |
| 本地验证打包产物 | 源码 + `file:` |
| 调试/修改 `.ts` 源码 | 源码 + Vite 别名 |
| 项目在 monorepo 内 | workspace + Vite 别名 |
| **Vue 3 项目（含旧 `@worm-vue3-print/canvas` 迁移）** | NPM 包 + `@worm-print-platform/canvas/vue3` 门面，组件代码不改 |
| 无打包器 / jQuery / 传统项目 | canvas UMD 直挂（`canvas.js` + `canvas.css`） |
| 需要 Node/浏览器同构渲染但不需要设计器 | 只安装 `core` |
