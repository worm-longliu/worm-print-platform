import test from 'node:test'
import assert from 'node:assert/strict'
import { AUTO_SHOW_STEPS, INTRO_SLIDE_MS, PREVIEW_HOLD_MS, VOICE_LINES } from '../src/auto-show/steps.js'
import { SAMPLES } from '../src/templates.js'

const DESIGN_KINDS = ['load-sample', 'design-pages', 'tiling']

test('开场轮播每张停留 2 秒，intro 停留时长足够放完所有缩略图', () => {
  const intro = AUTO_SHOW_STEPS.find(step => step.kind === 'intro')
  assert.equal(INTRO_SLIDE_MS, 2000)
  assert.equal(intro.hold, INTRO_SLIDE_MS * intro.sampleIds.length)
})

test('设计稿步骤停留 2 秒，预览步骤停留更久以便缓慢滚动', () => {
  for (const step of AUTO_SHOW_STEPS.filter(item => item.kind !== 'intro')) {
    const expected = step.kind === 'preview' || step.kind === 'tiling' ? PREVIEW_HOLD_MS : 2000
    assert.equal(step.hold, expected, `步骤 ${step.id} 的停留时长不对`)
  }
  assert.ok(PREVIEW_HOLD_MS >= 5000)
})

test('21 个步骤 id 唯一且字幕与配音逐条对应', () => {
  assert.equal(AUTO_SHOW_STEPS.length, 21)
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

test('每个示例都先有设计稿阶段，再有预览阶段', () => {
  const designSteps = AUTO_SHOW_STEPS.filter(step => step.kind === 'load-sample' || step.kind === 'design-pages')
  const designIds = designSteps.map(step => step.sampleId)
  assert.equal(new Set(designIds).size, designIds.length)
  for (const step of designSteps) {
    const preview = AUTO_SHOW_STEPS.find((item, index) =>
      index > AUTO_SHOW_STEPS.indexOf(step) && (item.kind === 'preview' || item.kind === 'tiling')
      && (!item.sampleId || item.sampleId === step.sampleId))
    assert.ok(preview, `示例 ${step.sampleId} 缺少预览阶段`)
  }
  for (const step of AUTO_SHOW_STEPS.filter(item => item.kind === 'preview' || item.kind === 'tiling')) {
    const previous = AUTO_SHOW_STEPS[AUTO_SHOW_STEPS.indexOf(step) - 1]
    assert.ok(previous && DESIGN_KINDS.includes(previous.kind), `预览步骤 ${step.id} 之前没有设计稿阶段`)
  }
})

test('多页模版用逐页设计稿步骤', () => {
  for (const id of ['payment-request', 'health-report', 'multipage-mixed-orientation']) {
    const step = AUTO_SHOW_STEPS.find(item => item.id === id)
    assert.equal(step?.kind, 'design-pages', `${id} 应逐页展示设计稿`)
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
  assert.match(text('multipage-mixed-orientation'), /纵向.*横向.*页码/)
})
