# Vue3 自动演示节奏与特色模版介绍 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vue3 自动演示放慢到每个模块约 2 秒，并新增称签/电池模块标签/多页横纵混排三类特色模版，其中电池模块标签分两步讲解条码属性与清晰度收益。

**Architecture:** 只改步骤表数据（`steps.js`）与配套资产/验收脚本；`useAutoShow.js` 状态机不动。新增 `kind: 'caption'` 纯字幕步骤，复用现有 `performStep` 对未知 kind 只关预览的行为。配音由 edge-tts 从 `VOICE_LINES` 重生成。

**Tech Stack:** Vue 3 + Vite（独立 demo 工程）、Node `node:test`、edge-tts、Playwright 验收脚本。

**Spec:** `docs/superpowers/specs/2026-11-25-vue3-auto-show-pacing-design.md`

## Global Constraints

- 中文回复、UTF-8 无 BOM、单次写入 ≤ 500 行。
- 每个模块（含开场轮播每张）停留约 2000ms；讲解拆成两个约 2 秒字幕步骤，不拉长单步。
- 配音资产 manifest 的 `sha256`/`bytes` 必须与 mp3 实际字节一致。
- 示例 id 必须存在于 `SAMPLES`（`demos/apps/vue3/src/templates.js`）：`weight-label`、`battery-module-label`、`multipage-mixed-orientation` 均已存在。
- 不碰渲染管线、不碰其余三个宿主 demo、不动 `useAutoShow.js`。

## Review Focus

- 开场轮播仍是 1.4 秒 → 验证 `INTRO_SLIDE_MS === 2000` 且 intro 全部 hold 由 2000×slide 数推导。
- 讲解步骤被误当成加载步骤清空画布 → 验证 `kind: 'caption'` 步骤 `performStep` 不加载模版、不改批量开关。
- 配音缺文件/文案不对 → voice 单测逐条比对 manifest 文本、sha256、bytes。
- 验收脚本步骤顺序、循环回绕超时失效 → 更新后跑 `verify-auto-show.mjs`。
- 条码属性讲解遗漏关键字段 → 文案必须同时含 `barcodeType/barWidth/barHeight/barFontSize/printerDpi` 与「更清晰」表述。

---

### Task 1: 更新演示步骤表与节奏

**Files:**
- Modify: `demos/apps/vue3/src/auto-show/steps.js`
- Test: 新增 `demos/apps/vue3/scripts/auto-show-steps.test.mjs`

**Interfaces:**
- Consumes: `SAMPLES`（现有），`useAutoShow.js` 的 `performStep` 对未知 kind 仅关预览。
- Produces: `INTRO_SLIDE_MS`、`VOICE_LINES`、`AUTO_SHOW_STEPS`（8 条语音，12 个步骤）。

- [ ] **Step 1: 写失败测试** `scripts/auto-show-steps.test.mjs`：断言 `INTRO_SLIDE_MS === 2000`；所有非 intro 步骤 `hold === 2000`；intro `hold === 2000 * sampleIds.length`；步骤 id 唯一；`kind==='caption'` 的步骤没有 `sampleId`；含 id 为 `battery-module-label`/`weight-label`/`multipage-mixed-orientation` 的步骤；文案含 `printerDpi` 与「清晰」。
- [ ] **Step 2:** 运行 `cd demos/apps/vue3 && node --test scripts/auto-show-steps.test.mjs`，确认 FAIL。
- [ ] **Step 3:** 改 `steps.js`：`INTRO_SLIDE_MS=2000`；`VOICE_LINES` 扩为 8 条（intro/express/preview/tiling/asset/weight/barcode/dpi，其中 barcode 覆盖 barWidth/barHeight，dpi 覆盖 printerDpi 203 与「更清晰」）；步骤表 12 步（intro、express-waybill、express-preview、price-tiling、asset-tag、asset-preview、weight-label、battery-module-label、barcode-size caption、barcode-dpi caption、battery-preview、multipage-mixed-orientation），全部 hold 2000，intro hold 6000，voice 引用对应 key。
- [ ] **Step 4:** 运行 `node --test scripts/auto-show-steps.test.mjs`，确认 PASS。
- [ ] **Step 5:** 提交 `git commit -m "feat(demo-vue3): 放慢自动演示节奏并新增特色模版步骤"`。

### Task 2: 重生成配音并同步单测

**Files:**
- Modify: `demos/apps/vue3/public/auto-show/voice/manifest.json`（脚本重写）
- Modify: `demos/apps/vue3/scripts/generate-auto-show-voice.test.mjs`
- Generate: `demos/apps/vue3/public/auto-show/voice/{weight,barcode,dpi}.mp3`（脚本生成）

**Interfaces:**
- Consumes: Task 1 的 `VOICE_LINES`。
- Produces: 8 条配音资产与 manifest。

- [ ] **Step 1:** 改 voice 单测：`manifest.lines.length` 断言从 5 改为 `VOICE_LINES.length`，其余逐条校验保留。
- [ ] **Step 2:** 运行 `cd demos/apps/vue3 && node --test scripts/generate-auto-show-voice.test.mjs`，确认 FAIL（缺 3 条）。
- [ ] **Step 3:** 运行 `node scripts/generate-auto-show-voice.mjs`（已确认环境 edge-tts 7.3.1 可用），生成 8 条 mp3 与 manifest。
- [ ] **Step 4:** 运行 `node --test scripts/generate-auto-show-voice.test.mjs`，确认 PASS。
- [ ] **Step 5:** 提交 `git commit -m "chore(demo-vue3): 重生成自动演示配音资产"`。

### Task 3: 同步验收脚本

**Files:**
- Modify: `demos/scripts/verify-auto-show.mjs`

**Interfaces:**
- Consumes: Task 1 的 12 步骤序列。
- Produces: 与新步骤表一致的冒烟验收。

- [ ] **Step 1:** 更新 `verify-auto-show.mjs`：在 `asset-preview` 后依次 `waitStep` `weight-label`、`battery-module-label`、`barcode-size`、`barcode-dpi`、`battery-preview`、`multipage-mixed-orientation`；校验电池模版徽标与电池预览纸面；循环回绕等待 `express-waybill` 的超时从 12000 调到 30000（新步骤插在 asset-preview 之后）。
- [ ] **Step 2:** 运行 `npm run dev --prefix demos/apps/vue3` 起服务后 `node demos/scripts/verify-auto-show.mjs http://localhost:9331/`，确认全 PASS（末行无失败）。
- [ ] **Step 3:** 提交 `git commit -m "test(demo-vue3): 同步自动演示验收步骤"`。
