import test from 'node:test'
import assert from 'node:assert/strict'
import { scrollPreviewOver } from '../src/auto-show/preview-scroll.js'

function harness({ scrollHeight = 1000, innerHeight = 200, getFrame } = {}) {
  const times = [0, 0, 500, 1000, 1500]
  let timeIndex = 0
  let queue = []
  const calls = []
  const win = {
    innerHeight,
    document: { documentElement: { scrollHeight } },
    scrollTo: (x, y) => calls.push(y),
  }
  const raf = cb => { queue.push(cb); return queue.length }
  const caf = () => {}
  const flush = () => { const pending = queue; queue = []; for (const cb of pending) cb() }
  return {
    calls,
    flush,
    run: overrides => scrollPreviewOver({
      getFrame: getFrame ?? (() => ({ contentWindow: win })),
      durationMs: 1000,
      isCancelled: () => false,
      raf,
      caf,
      now: () => times[Math.min(timeIndex++, times.length - 1)],
      ...overrides,
    }),
  }
}

test('预览在步骤时长内匀速滚到底部', async () => {
  const h = harness()
  const done = h.run()
  h.flush()
  h.flush()
  h.flush()
  assert.equal(await done, true)
  assert.deepEqual(h.calls, [0, 400, 800])
})

test('取消演示时停止滚动并返回 false', async () => {
  const h = harness()
  let cancelled = false
  const done = h.run({ isCancelled: () => cancelled })
  h.flush()
  cancelled = true
  h.flush()
  assert.equal(await done, false)
  assert.deepEqual(h.calls, [0])
})

test('没有可用的预览 iframe 时立即返回 false', async () => {
  const h = harness({ getFrame: () => null })
  assert.equal(await h.run(), false)
  assert.deepEqual(h.calls, [])
})
