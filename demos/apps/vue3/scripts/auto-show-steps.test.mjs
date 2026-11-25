import test from 'node:test'
import assert from 'node:assert/strict'
import { AUTO_SHOW_STEPS, INTRO_SLIDE_MS, VOICE_LINES } from '../src/auto-show/steps.js'
import { SAMPLES } from '../src/templates.js'

test('开场轮播每张停留 2 秒，intro 停留时长足够放完所有缩略图', () => {
  const intro = AUTO_SHOW_STEPS.find(step => step.kind === 'intro')
  assert.equal(INTRO_SLIDE_MS, 2000)
  assert.equal(intro.hold, INTRO_SLIDE_MS * intro.sampleIds.length)
})

test('每个非开场模块切换后只停留约 2 秒', () => {
  for (const step of AUTO_SHOW_STEPS.filter(item => item.kind !== 'intro')) {
    assert.equal(step.hold, 2000, `步骤 ${step.id} 的停留时长不是 2 秒`)
  }
})

test('14 个步骤 id 唯一且字幕与配音逐条对应', () => {
  assert.equal(AUTO_SHOW_STEPS.length, 14)
  const ids = AUTO_SHOW_STEPS.map(step => step.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const step of AUTO_SHOW_STEPS) {
    const line = VOICE_LINES.find(item => item.key === step.voice)
    assert.equal(step.text, line?.text, `步骤 ${step.id} 的字幕与配音不一致`)
  }
})

test('每个步骤引用的模版都真实存在', () => {
  for (const step of AUTO_SHOW_STEPS) {
    const ids = step.sampleIds ?? (step.sampleId ? [step.sampleId] : [])
    for (const id of ids) {
      assert.ok(SAMPLES.some(sample => sample.id === id), `步骤 ${step.id} 引用了不存在的模版 ${id}`)
    }
  }
})

test('文案按各模版的真实画面讲述特色', () => {
  const text = id => AUTO_SHOW_STEPS.find(step => step.id === id)?.text ?? ''
  assert.match(text('express-waybill'), /条码.*二维码/)
  assert.match(text('price-tiling'), /32/)
  assert.match(text('asset-tag'), /二维码.*18/)
  assert.match(text('weight-label'), /净重.*条码/)
  assert.match(text('battery-module-label-no-sn'), /barWidth.*barHeight.*printerDpi.*清晰/)
  assert.match(text('payment-request'), /纵向合并/)
  assert.match(text('tcm-prescription'), /流式.*4 列.*跨两列/)
  assert.match(text('comprehensive-showcase'), /商品.*条形码.*二维码.*图文混排/)
  assert.match(text('health-report'), /5 页.*趋势图/)
  assert.match(text('health-preview'), /连续出纸/)
  assert.match(text('multipage-mixed-orientation'), /纵向.*横向.*页码/)
})

test('已去掉含 SN 版及拆分字幕步骤', () => {
  const ids = AUTO_SHOW_STEPS.map(step => step.id)
  for (const id of ['battery-module-label', 'barcode-size', 'barcode-dpi', 'battery-preview']) {
    assert.ok(!ids.includes(id), `不应再保留步骤 ${id}`)
  }
})
