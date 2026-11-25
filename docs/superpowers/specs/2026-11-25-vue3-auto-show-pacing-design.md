# Vue3 自动演示节奏与特色模版介绍 · 设计（小改动）

## 意图

Vue3 demo 的自动演示（`src/auto-show/`）切换过快：开场轮播每张仅 1.4 秒。需要放慢到每个模块约 2 秒，并从全部 19 个示例模版中挑出有特色的模版加入演示，其中必须有一个模版讲解条形码属性及其作用，突出「帮助打印更清晰的条形码」。

## 目标 / 非目标 / 反目标

- 目标：每个模块停留约 2 秒；新增称签打印、电池模块标签（含 SN 条码）、多页横纵混排三类特色模版；电池模块标签分两步讲解条码属性与清晰度收益；配音与验收脚本同步。
- 非目标：不改渲染管线、不改 `useAutoShow.js` 状态机、不改其余三个宿主 demo。
- 反目标：不为讲解把单个步骤拉长到远超 2 秒（改为拆成两个约 2 秒的字幕步骤）。

## 约束

- 演示文案与顺序在注释里要求对照 `demos/live-show/intents.mjs`，本次只改 Vue3 demo，直播侧不强行同步。
- 配音资产是 edge-tts 生成的 mp3 + manifest（含 sha256/bytes），改文案必须重生成，否则单测失败。
- `verify-auto-show.mjs` 对步骤 id、缩略图数量、循环回绕时间有断言，改步骤表必须同步。

## 方案（已选 A）

在现有 `steps.js` 步骤表上扩充，而不是重构状态机：

1. `INTRO_SLIDE_MS` 1400 → 2000；所有步骤 `hold` 统一 2000ms。
2. 步骤序列（共 12 步）：intro → express-waybill → express-preview → price-tiling → asset-tag → asset-preview → weight-label → battery-module-label → barcode-size（caption） → barcode-dpi（caption） → battery-preview → multipage-mixed-orientation。
3. 新增 `kind: 'caption'` 的纯字幕步骤，只停留并讲解，不改模版/预览；`performStep` 对未知 kind 已只关预览，不加载模版，天然兼容，无需改 `useAutoShow.js`。
4. 条码讲解以 `battery-module-label` 为例：`barcodeType: CODE128`、`barWidth: 3`、`barHeight: 7mm`、`barFontSize: 14`、`printerDpi: 203`（吸附整数打印点 → 消除条宽忽宽忽窄 → 更清晰、扫描一次通过）。
5. 重生成配音清单并更新 voice 单测为动态条数；更新 `verify-auto-show.mjs` 步骤顺序与超时。

## 待办（交给实现者）

- 文件：`src/auto-show/steps.js`、`public/auto-show/voice/*`、`scripts/generate-auto-show-voice.test.mjs`、`demos/scripts/verify-auto-show.mjs`。
- 验证：`npm test -w @worm-print-platform/...` 不适用（demo 是独立工程）；在 `demos/apps/vue3` 下跑 voice 单测与 `node demos/scripts/verify-auto-show.mjs`（需 dev server）。
