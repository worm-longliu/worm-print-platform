<script setup>
import SampleThumb from '../SampleThumb.vue'

defineProps({
  autoShow: { type: Object, required: true },
})
</script>

<template>
  <button
    v-if="autoShow.status === 'idle'"
    type="button"
    class="auto-show-fab"
    data-test="auto-show-fab"
    aria-label="开始自动演示"
    @click="autoShow.start"
  >
    <i aria-hidden="true"></i><span>自动演示</span>
  </button>

  <section
    v-else
    class="auto-show-layer"
    data-test="auto-show-layer"
    :data-status="autoShow.status"
    :data-step-id="autoShow.currentStep?.id"
  >
    <div v-if="autoShow.currentStep?.kind === 'intro'" class="auto-show-intro" data-test="auto-show-intro">
      <p class="auto-show-kicker">PRINT TEMPLATE SHOW</p>
      <div class="auto-show-intro-track">
        <div
          v-for="(sample, index) in autoShow.introSamples"
          :key="sample.id"
          class="auto-show-intro-card"
          :class="{ on: index === autoShow.introSlideIndex }"
        >
          <SampleThumb :template="sample.template" :data="sample.data" />
          <strong>{{ sample.name }}</strong>
        </div>
      </div>
    </div>

    <div
      v-if="autoShow.currentStep && autoShow.currentStep.kind !== 'intro'"
      class="auto-show-stage"
      data-test="auto-show-stage"
    >{{ ['preview', 'tiling'].includes(autoShow.currentStep.kind) ? '出纸预览' : '设计稿' }}</div>

    <div class="auto-show-subtitle" data-test="auto-show-subtitle" aria-live="polite">
      {{ autoShow.currentText }}
    </div>

    <div v-if="autoShow.status !== 'finished'" class="auto-show-controls" data-test="auto-show-controls">
      <button
        type="button"
        data-action="pause"
        :aria-label="autoShow.status === 'paused' ? '继续演示' : '暂停演示'"
        @click="autoShow.status === 'paused' ? autoShow.resume() : autoShow.pause()"
      >{{ autoShow.status === 'paused' ? '继续' : '暂停' }}</button>
      <button
        type="button"
        data-action="sound"
        :aria-pressed="autoShow.soundEnabled"
        aria-label="切换声音"
        @click="autoShow.toggleSound"
      >声音{{ autoShow.soundEnabled ? '开' : '关' }}</button>
      <button
        type="button"
        data-action="loop"
        :aria-pressed="autoShow.loopEnabled"
        aria-label="切换循环播放"
        @click="autoShow.toggleLoop"
      >循环{{ autoShow.loopEnabled ? '开' : '关' }}</button>
      <button type="button" class="auto-show-stop" data-action="stop" aria-label="停止演示" @click="autoShow.stop">停止</button>
    </div>
  </section>
</template>

<style src="./auto-show.css"></style>
