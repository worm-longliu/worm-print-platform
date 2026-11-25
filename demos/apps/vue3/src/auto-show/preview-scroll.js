/**
 * 预览步骤期间匀速滚动 iframe 内容：进度与步骤时长同步，到时恰好停在底部。
 * @returns {Promise<boolean>} false 表示没有可滚动的预览，或演示已取消
 */
export function scrollPreviewOver({
  getFrame,
  durationMs,
  isCancelled = () => false,
  raf = callback => requestAnimationFrame(callback),
  caf = id => cancelAnimationFrame(id),
  now = () => performance.now(),
}) {
  return new Promise(resolve => {
    const win = getFrame()?.contentWindow
    const doc = win?.document
    if (!win || !doc || !Number.isFinite(durationMs) || durationMs <= 0) {
      resolve(false)
      return
    }

    const maxScroll = Math.max(0, (doc.documentElement?.scrollHeight ?? 0) - (win.innerHeight ?? 0))
    const start = now()
    let rafId = 0
    let settled = false
    const finish = ok => {
      if (settled) return
      settled = true
      if (rafId) caf(rafId)
      resolve(ok)
    }
    const tick = () => {
      if (isCancelled()) return finish(false)
      const progress = Math.min(1, (now() - start) / durationMs)
      win.scrollTo(0, maxScroll * progress)
      if (progress >= 1) return finish(true)
      rafId = raf(tick)
    }
    rafId = raf(tick)
  })
}
