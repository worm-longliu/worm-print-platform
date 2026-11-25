import test from 'node:test'
import assert from 'node:assert/strict'
import { waitForVoiceEnd } from '../src/auto-show/voice-wait.js'

function createClock(onTick) {
  let ticks = 0
  return {
    get ticks() { return ticks },
    delay: async () => { ticks += 1; onTick?.(ticks) },
  }
}

const defaultAudio = { ended: false }

function deps(overrides = {}) {
  return {
    getAudio: () => defaultAudio,
    isSoundEnabled: () => true,
    isCancelled: () => false,
    delay: async () => {},
    pollMs: 100,
    timeoutMs: 10000,
    ...overrides,
  }
}

test('开启声音时等到配音播放结束才返回', async () => {
  const audio = { ended: false }
  const clock = createClock(tick => { if (tick === 3) audio.ended = true })
  const result = await waitForVoiceEnd(deps({ getAudio: () => audio, delay: clock.delay }))
  assert.equal(result, true)
  assert.equal(clock.ticks, 3)
})

test('静音时不等待配音', async () => {
  const clock = createClock()
  const result = await waitForVoiceEnd(deps({ isSoundEnabled: () => false, delay: clock.delay }))
  assert.equal(result, true)
  assert.equal(clock.ticks, 0)
})

test('演示被取消时返回 false 并停止轮询', async () => {
  let cancelled = false
  const clock = createClock(tick => { if (tick === 2) cancelled = true })
  const result = await waitForVoiceEnd(deps({ isCancelled: () => cancelled, delay: clock.delay }))
  assert.equal(result, false)
  assert.equal(clock.ticks, 2)
})

test('配音被替换或降级静音后立即放弃等待', async () => {
  const first = { ended: false }
  const second = { ended: false }
  let current = first
  let sound = true
  const clock = createClock(tick => {
    if (tick === 2) { current = second; sound = false }
  })
  const result = await waitForVoiceEnd(deps({
    getAudio: () => current,
    isSoundEnabled: () => sound,
    delay: clock.delay,
  }))
  assert.equal(result, true)
  assert.equal(clock.ticks, 2)
})

test('配音一直不结束时按兜底时限返回，避免演示卡死', async () => {
  const clock = createClock()
  const result = await waitForVoiceEnd(deps({ delay: clock.delay, timeoutMs: 300 }))
  assert.equal(result, true)
  assert.equal(clock.ticks, 3)
})
