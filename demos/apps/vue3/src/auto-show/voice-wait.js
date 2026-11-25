/**
 * 等待当前配音播放结束。步骤停留时长只是下限，开声音时语音没播完不能切页。
 * 静音、音频被替换、播放失败降级或演示取消时立即结束等待；兜底时限防止音频卡住时演示卡死。
 * @returns {Promise<boolean>} false 表示演示已取消，调用方应中止当前流程
 */
export async function waitForVoiceEnd({
  getAudio,
  isSoundEnabled,
  isCancelled,
  delay = ms => new Promise(resolve => setTimeout(resolve, ms)),
  pollMs = 100,
  timeoutMs = 15000,
}) {
  const audio = getAudio()
  if (!isSoundEnabled() || !audio || audio.ended || isCancelled()) return true

  let waited = 0
  while (!isCancelled()) {
    if (!isSoundEnabled() || getAudio() !== audio || audio.ended) return true
    await delay(pollMs)
    waited += pollMs
    if (waited >= timeoutMs) return true
  }
  return false
}
