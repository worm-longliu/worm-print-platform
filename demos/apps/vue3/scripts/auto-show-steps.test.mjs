import test from 'node:test'
import assert from 'node:assert/strict'
import { AUTO_SHOW_STEPS, INTRO_SLIDE_MS, VOICE_LINES } from '../src/auto-show/steps.js'

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

test('步骤 id 唯一，纯字幕步骤不加载模版', () => {
  const ids = AUTO_SHOW_STEPS.map(step => step.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const step of AUTO_SHOW_STEPS.filter(item => item.kind === 'caption')) {
    assert.equal(step.sampleId, undefined, `字幕步骤 ${step.id} 不应加载模版`)
  }
})

test('演示覆盖称签、电池 SN 条码、多页横纵混排三类特色模版', () => {
  const ids = AUTO_SHOW_STEPS.map(step => step.id)
  for (const id of ['weight-label', 'battery-module-label', 'multipage-mixed-orientation']) {
    assert.ok(ids.includes(id), `演示缺少步骤 ${id}`)
  }
})

test('条码讲解覆盖 printerDpi 并突出打印更清晰', () => {
  const barcode = VOICE_LINES.find(line => line.key === 'barcode')
  const dpi = VOICE_LINES.find(line => line.key === 'dpi')
  assert.ok(barcode?.text.includes('barWidth') && barcode.text.includes('barHeight'))
  assert.ok(dpi?.text.includes('printerDpi') && dpi.text.includes('203'))
  assert.ok(`${barcode.text}${dpi.text}`.includes('清晰'))
})
