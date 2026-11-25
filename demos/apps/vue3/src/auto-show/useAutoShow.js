import { computed, isRef, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { AUTO_SHOW_STEPS, INTRO_SLIDE_MS } from './steps'
import { waitForVoiceEnd } from './voice-wait'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const cloneValue = value => value == null ? value : JSON.parse(JSON.stringify(value))

export function useAutoShow({
  designer,
  samples,
  applySample,
  openPreview,
  closePreview,
  currentTemplateJson,
  batchEnabled,
  snapshot,
  syncDesigner,
}) {
  const params = new URLSearchParams(window.location.search)
  const status = ref('idle')
  const stepIndex = ref(-1)
  const introSlideIndex = ref(0)
  const soundEnabled = ref(false)
  const loopEnabled = ref(params.get('loop') === '1')
  const currentStep = computed(() => AUTO_SHOW_STEPS[stepIndex.value] ?? null)
  const currentText = computed(() => currentStep.value?.text ?? '')
  const introSamples = computed(() => {
    const ids = AUTO_SHOW_STEPS[0].sampleIds
    return ids.map(id => samples.find(sample => sample.id === id)).filter(Boolean)
  })
  const isActive = computed(() => status.value !== 'idle')

  let runToken = 0
  let savedSnapshot = null
  let pendingAction = null
  let currentAudio = null

  function captureSnapshot() {
    return Object.entries(snapshot()).map(([key, value]) => {
      if (!isRef(value)) throw new Error(`自动演示快照字段必须是 ref：${key}`)
      return [key, value, key === 'currentSample' ? value.value : cloneValue(value.value)]
    })
  }

  function restoreSnapshot() {
    if (!savedSnapshot) return
    for (const [key, value, saved] of savedSnapshot) value.value = key === 'currentSample' ? saved : cloneValue(saved)
    syncDesigner()
    savedSnapshot = null
  }

  async function wait(ms, token) {
    let remaining = ms
    let last = performance.now()
    while (remaining > 0) {
      if (token !== runToken) return false
      const now = performance.now()
      if (status.value !== 'paused') remaining -= now - last
      last = now
      if (remaining <= 0) break
      await delay(Math.min(100, remaining))
    }
    return token === runToken
  }

  function stopAudio() {
    if (!currentAudio) return
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }

  function degradeAudio() {
    soundEnabled.value = false
    stopAudio()
  }

  function playAudio(audio, token) {
    audio.play().catch(error => {
      if (currentAudio !== audio || token !== runToken) return
      if (error?.name === 'AbortError' && status.value === 'paused') return
      degradeAudio()
    })
  }

  function playVoice(step, token) {
    stopAudio()
    if (!step || !soundEnabled.value || status.value === 'paused' || token !== runToken) return
    const audio = new Audio(`${import.meta.env.BASE_URL}auto-show/voice/${step.voice}.mp3`)
    currentAudio = audio
    playAudio(audio, token)
  }

  async function performStep(step) {
    if (step.kind === 'intro') return
    closePreview()
    if (step.kind === 'load-sample' || step.kind === 'tiling') {
      applySample(samples.find(sample => sample.id === step.sampleId))
    }
    if (step.kind === 'tiling') batchEnabled.value = true
    if (step.kind === 'preview' || step.kind === 'tiling') {
      await openPreview(currentTemplateJson())
    }
  }

  async function run(token) {
    let index = 0
    while (token === runToken) {
      const step = AUTO_SHOW_STEPS[index]
      stepIndex.value = index
      introSlideIndex.value = 0
      playVoice(step, token)

      if (step.kind !== 'intro') {
        const action = performStep(step)
        pendingAction = action
        try {
          await action
        } finally {
          if (pendingAction === action) pendingAction = null
        }
      }
      if (token !== runToken) return

      if (step.kind === 'intro') {
        for (let slide = 0; slide < introSamples.value.length; slide += 1) {
          introSlideIndex.value = slide
          if (!await wait(INTRO_SLIDE_MS, token)) return
        }
      } else if (!await wait(step.hold, token)) {
        return
      }
      if (token !== runToken) return

      // 停留时长只是下限：开声音时配音没播完不切页，暂停中由 waitForVoiceEnd 继续等待。
      if (!await waitForVoiceEnd({
        getAudio: () => currentAudio,
        isSoundEnabled: () => soundEnabled.value,
        isCancelled: () => token !== runToken,
      })) return
      if (token !== runToken) return

      index += 1
      if (index < AUTO_SHOW_STEPS.length) continue
      if (loopEnabled.value) {
        index = 1
        continue
      }
      status.value = 'finished'
      if (!await wait(800, token)) return
      await stop()
      return
    }
  }

  async function start() {
    if (status.value !== 'idle' || !designer.value) return
    const token = ++runToken
    savedSnapshot = captureSnapshot()
    status.value = 'running'
    stepIndex.value = 0
    introSlideIndex.value = 0
    soundEnabled.value = false
    stopAudio()
    await run(token)
  }

  function pause() {
    if (status.value !== 'running') return
    status.value = 'paused'
    currentAudio?.pause()
  }

  function resume() {
    if (status.value !== 'paused') return
    status.value = 'running'
    if (!soundEnabled.value) return
    if (currentAudio) playAudio(currentAudio, runToken)
    else playVoice(currentStep.value, runToken)
  }

  async function stop() {
    if (status.value === 'idle') return
    const token = ++runToken
    status.value = 'stopping'
    stopAudio()
    const action = pendingAction
    if (action) await action.catch(() => {})
    if (token !== runToken) return
    closePreview()
    restoreSnapshot()
    status.value = 'idle'
    stepIndex.value = -1
    introSlideIndex.value = 0
  }

  function toggleSound() {
    if (!currentStep.value) return
    soundEnabled.value = !soundEnabled.value
    if (soundEnabled.value) playVoice(currentStep.value, runToken)
    else stopAudio()
  }

  function toggleLoop() {
    loopEnabled.value = !loopEnabled.value
  }

  onMounted(async () => {
    await nextTick()
    if (params.get('auto') === '1') await start()
  })

  onBeforeUnmount(stop)

  return reactive({
    status,
    stepIndex,
    introSlideIndex,
    soundEnabled,
    loopEnabled,
    currentStep,
    currentText,
    introSamples,
    isActive,
    start,
    pause,
    resume,
    stop,
    toggleSound,
    toggleLoop,
  })
}
