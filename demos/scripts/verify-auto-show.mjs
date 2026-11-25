import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'package.json'))
const { chromium } = require('playwright')
const { SAMPLES } = await import(new URL('../apps/vue3/src/templates.js', import.meta.url))

const URL_ = process.argv[2] || 'http://localhost:9331/'
const ASSET_SAMPLE = SAMPLES.find(sample => sample.id === 'asset-tag')
const PRICE_SAMPLE = SAMPLES.find(sample => sample.id === 'price-label')
const WEIGHT_SAMPLE = SAMPLES.find(sample => sample.id === 'weight-label')
const BATTERY_SAMPLE = SAMPLES.find(sample => sample.id === 'battery-module-label-no-sn')
const PAYMENT_SAMPLE = SAMPLES.find(sample => sample.id === 'payment-request')
const TCM_SAMPLE = SAMPLES.find(sample => sample.id === 'tcm-prescription')
const COMPREHENSIVE_SAMPLE = SAMPLES.find(sample => sample.id === 'comprehensive-showcase')
const HEALTH_SAMPLE = SAMPLES.find(sample => sample.id === 'health-report')
const MULTIPAGE_SAMPLE = SAMPLES.find(sample => sample.id === 'multipage-mixed-orientation')
const results = []

const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

const visibleExpr = selector => `(() => {
  const el = document.querySelector(${JSON.stringify(selector)})
  if (!el || el.hasAttribute('hidden')) return false
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 && getComputedStyle(el).display !== 'none'
})()`

const waitVisible = (page, selector, timeout = 15000) =>
  page.waitForFunction(visibleExpr(selector), undefined, { timeout })
const waitHidden = (page, selector, timeout = 15000) =>
  page.waitForFunction(`!(${visibleExpr(selector)})`, undefined, { timeout })

async function clickByText(page, text, scope = 'button') {
  const button = page.locator(scope).filter({ hasText: text }).first()
  if (!(await button.count())) throw new Error(`未找到按钮：${text}（范围 ${scope}）`)
  await button.click()
}

async function waitDesigner(page) {
  await page.waitForSelector('print-designer', { timeout: 20000 })
  await page.waitForFunction(() => {
    const el = document.querySelector('print-designer')
    return !!el?.shadowRoot?.querySelector('.designer-container')
  }, undefined, { timeout: 20000 })
  await page.waitForTimeout(500)
}

async function waitStep(page, id, timeout = 30000) {
  await page.waitForFunction(stepId => {
    const layer = document.querySelector('.auto-show-layer')
    return layer?.dataset.stepId === stepId && layer.dataset.status !== 'stopping'
  }, id, { timeout })
}

async function waitPreview(page, timeout = 20000) {
  await waitVisible(page, '.preview-mask', timeout)
  await page.waitForFunction(() => {
    const frame = document.querySelector('.preview-mask iframe')
    const doc = frame?.contentWindow?.document
    return !!doc?.querySelector('.print-page') && !document.querySelector('.print-html-preview-loading')
  }, undefined, { timeout })
  return page.evaluate(() => {
    const doc = document.querySelector('.preview-mask iframe').contentWindow.document
    return {
      pages: doc.querySelectorAll('.print-page').length,
      text: doc.body.innerText.replace(/\s+/g, ' ').slice(0, 300),
    }
  })
}

const readScrollY = page => page.evaluate(() => {
  const win = document.querySelector('.print-html-preview-iframe')?.contentWindow
  return {
    y: win?.scrollY ?? 0,
    max: Math.max(0, (win?.document?.documentElement?.scrollHeight ?? 0) - (win?.innerHeight ?? 0)),
  }
})

async function readHostState(page) {
  return page.evaluate(() => ({
    badges: [...document.querySelectorAll('.demo-badge')].map(el => el.textContent.trim()).join(' '),
    batch: document.querySelector('.demo-batch-switch input')?.checked ?? false,
    batchText: document.querySelector('.demo-batch-switch')?.textContent.replace(/\s+/g, ' ').trim() ?? '',
    template: JSON.parse(document.querySelector('print-designer').getTemplateJson()),
  }))
}

async function selectAssetSample(page) {
  await clickByText(page, '加载示例')
  await waitVisible(page, '.gallery-mask')
  const card = page.locator('.gallery-mask .sample-card').filter({ hasText: ASSET_SAMPLE.name }).first()
  await card.click()
  await clickByText(page, '使用该模板')
  await waitHidden(page, '.gallery-mask')
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH
  ? { executablePath: process.env.CHROMIUM_PATH }
  : {})

try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } })
  await page.addInitScript(() => {
    const ids = new WeakMap()
    let nextId = 1
    window.__autoShowAudioEvents = []
    window.__autoShowAudios = []
    window.__autoShowAudioEnded = []
    for (const method of ['play', 'pause']) {
      const original = HTMLMediaElement.prototype[method]
      HTMLMediaElement.prototype[method] = function (...args) {
        if (!ids.has(this)) {
          ids.set(this, nextId++)
          window.__autoShowAudios.push(this)
          this.addEventListener('ended', () => window.__autoShowAudioEnded.push(ids.get(this)))
        }
        window.__autoShowAudioEvents.push({ method, id: ids.get(this), time: this.currentTime })
        return original.apply(this, args)
      }
    }
  })
  const errors = []
  page.on('pageerror', error => errors.push(String(error)))
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })

  await page.goto(URL_, { waitUntil: 'networkidle' })
  await waitDesigner(page)
  await selectAssetSample(page)
  const before = await readHostState(page)
  check('验收前模板为资产标签且批量关闭', before.badges.includes(ASSET_SAMPLE.name) && !before.batch, before.badges)

  await waitVisible(page, '[data-test="auto-show-fab"]')
  const initial = await page.evaluate(() => ({
    sound: document.querySelector('[data-action="sound"]')?.getAttribute('aria-pressed'),
    loop: document.querySelector('[data-action="loop"]')?.getAttribute('aria-pressed'),
  }))
  check('FAB 默认可见', true)
  check('声音与循环默认关闭', initial.sound == null && initial.loop == null, JSON.stringify(initial))

  await page.locator('[data-test="auto-show-fab"]').click()
  await waitVisible(page, '[data-test="auto-show-intro"]')
  await waitVisible(page, '[data-test="auto-show-subtitle"]')
  const intro = await page.evaluate(() => ({
    thumbs: document.querySelectorAll('[data-test="auto-show-intro"] .thumb-page').length,
    subtitle: document.querySelector('[data-test="auto-show-subtitle"]')?.textContent.trim() ?? '',
    status: document.querySelector('.auto-show-layer')?.dataset.status,
  }))
  check('点击后显示三张开场缩略图与字幕', intro.thumbs === 3 && intro.subtitle.length > 0 && intro.status === 'running', JSON.stringify(intro))

  await waitStep(page, 'express-waybill')
  const express = await readHostState(page)
  check('自动加载快递电子面单', express.badges.includes('快递电子面单'), express.badges)
  check('设计稿阶段显示阶段标识', (await page.locator('[data-test="auto-show-stage"]').textContent())?.trim() === '设计稿')

  await waitStep(page, 'express-preview')
  const expressPreview = await waitPreview(page)
  check('面单真实出纸预览已渲染', expressPreview.pages > 0, `${expressPreview.pages} 页`)
  check('预览阶段显示阶段标识', (await page.locator('[data-test="auto-show-stage"]').textContent())?.trim() === '出纸预览')

  await page.locator('[data-action="sound"]').click()
  await page.waitForFunction(() => window.__autoShowAudioEvents.some(event => event.method === 'play'))
  await page.locator('[data-action="pause"]').click()
  await page.waitForFunction(() => document.querySelector('.auto-show-layer')?.dataset.status === 'paused')
  await page.waitForTimeout(800)
  const pausedStep = await page.locator('.auto-show-layer').getAttribute('data-step-id')
  check('暂停后停留当前步骤', pausedStep === 'express-preview', pausedStep)
  check('暂停不关闭声音', await page.locator('[data-action="sound"]').getAttribute('aria-pressed') === 'true')
  const pausedAudio = await page.evaluate(() => window.__autoShowAudioEvents.filter(event => event.method === 'pause').at(-1))
  await page.locator('[data-action="pause"]').click()
  await page.waitForFunction(() => document.querySelector('.auto-show-layer')?.dataset.status === 'running')
  await page.waitForFunction(() => window.__autoShowAudioEvents.filter(event => event.method === 'play').length >= 2)
  const resumedAudio = await page.evaluate(() => window.__autoShowAudioEvents.filter(event => event.method === 'play').at(-1))
  check('继续时从暂停位置恢复声音', resumedAudio.id === pausedAudio.id && resumedAudio.time >= pausedAudio.time, JSON.stringify({ pausedAudio, resumedAudio }))
  await page.waitForFunction(() => window.__autoShowAudios.some(audio => audio.currentTime > 0.2), undefined, { timeout: 15000 })
  check('开启声音后配音实际播放', true)
  await page.locator('[data-action="sound"]').click()

  await waitStep(page, 'price-label')
  const price = await readHostState(page)
  check('价签先展示设计稿且关闭批量', price.badges.includes(PRICE_SAMPLE.name) && !price.batch, price.badges)

  await waitStep(page, 'price-tiling')
  const tilingPreview = await waitPreview(page)
  const tiling = await readHostState(page)
  check('价签步骤开启 32 份批量打印', PRICE_SAMPLE.batchData.length === 32 && tiling.batch && /32 份/.test(tiling.batchText), tiling.batchText)
  check('价签使用拼版模板并渲染真实纸面', tiling.template.tiling?.enabled === true && tilingPreview.pages > 0, `${tilingPreview.pages} 页`)

  await waitStep(page, 'asset-tag')
  const asset = await readHostState(page)
  check('自动关闭面单预览并加载资产标签', asset.badges.includes(ASSET_SAMPLE.name) && !(await page.locator('.preview-mask').count()), asset.badges)

  await waitStep(page, 'asset-preview')
  const assetPreview = await waitPreview(page)
  check('资产标签真实出纸预览已渲染', assetPreview.pages > 0, `${assetPreview.pages} 页`)

  await waitStep(page, 'weight-label')
  const weight = await readHostState(page)
  check('特色模版：称签打印已加载', weight.badges.includes(WEIGHT_SAMPLE.name), weight.badges)

  await waitStep(page, 'weight-preview')
  const weightPreview = await waitPreview(page)
  check('称签打印有出纸预览', weightPreview.pages > 0, `${weightPreview.pages} 页`)

  await waitStep(page, 'battery-module-label-no-sn')
  const battery = await readHostState(page)
  const batteryText = (await page.locator('[data-test="auto-show-subtitle"]').textContent())?.trim() ?? ''
  check('特色模版：电池无 SN 标签已加载且讲清条码属性', battery.badges.includes(BATTERY_SAMPLE.name) && ['barWidth', 'barHeight', 'printerDpi', '清晰'].every(key => batteryText.includes(key)), battery.badges)

  await waitStep(page, 'battery-preview')
  const batteryPreview = await waitPreview(page)
  check('电池标签有出纸预览', batteryPreview.pages > 0, `${batteryPreview.pages} 页`)

  await waitStep(page, 'payment-request')
  const payment = await readHostState(page)
  check('特色模版：付款申请单已加载', payment.badges.includes(PAYMENT_SAMPLE.name), payment.badges)

  await waitStep(page, 'payment-preview')
  const paymentPreview = await waitPreview(page)
  check('付款申请单有出纸预览', paymentPreview.pages > 0, `${paymentPreview.pages} 页`)

  await waitStep(page, 'tcm-prescription')
  const tcm = await readHostState(page)
  check('特色模版：中药处方笺已加载', tcm.badges.includes(TCM_SAMPLE.name), tcm.badges)

  await waitStep(page, 'tcm-preview')
  const tcmPreview = await waitPreview(page)
  check('中药处方笺有出纸预览', tcmPreview.pages > 0, `${tcmPreview.pages} 页`)

  await waitStep(page, 'comprehensive-showcase')
  const comprehensive = await readHostState(page)
  check('特色模版：综合示例已加载', comprehensive.badges.includes(COMPREHENSIVE_SAMPLE.name), comprehensive.badges)

  await waitStep(page, 'comprehensive-preview')
  const comprehensivePreview = await waitPreview(page)
  check('综合示例有出纸预览', comprehensivePreview.pages > 0, `${comprehensivePreview.pages} 页`)

  await waitStep(page, 'health-report')
  const health = await readHostState(page)
  check('特色模版：体检报告已加载', health.badges.includes(HEALTH_SAMPLE.name), health.badges)
  await page.waitForFunction(() => document.querySelector('[data-test="auto-show-subtitle"]')?.textContent.includes('第 1 / 5 页'), undefined, { timeout: 10000 })
  check('多页模版逐页展示设计稿并显示页码', true)
  await page.waitForFunction(() => document.querySelector('[data-test="auto-show-subtitle"]')?.textContent.includes('第 5 / 5 页'), undefined, { timeout: 20000 })
  const healthPageIndex = await page.evaluate(() => document.querySelector('print-designer')?.store?.activePageIndex)
  check('逐页展示后停在最后一页设计稿', healthPageIndex === 4, String(healthPageIndex))

  await waitStep(page, 'health-preview')
  const healthPreview = await waitPreview(page)
  check('体检报告多页与图表出纸预览已渲染', healthPreview.pages > 0, `${healthPreview.pages} 页`)
  const scrollStart = await readScrollY(page)
  await page.waitForTimeout(1500)
  const scrollMid = await readScrollY(page)
  check('预览随时间缓慢滚动', scrollStart.max > 0 && scrollMid.y > scrollStart.y, JSON.stringify({ scrollStart, scrollMid }))

  await waitStep(page, 'multipage-mixed-orientation')
  const multipage = await readHostState(page)
  check('特色模版：多页横纵混排已加载', multipage.badges.includes(MULTIPAGE_SAMPLE.name), multipage.badges)

  await waitStep(page, 'multipage-preview')
  const multipagePreview = await waitPreview(page)
  check('多页横纵混排有统一出纸预览', multipagePreview.pages > 0, `${multipagePreview.pages} 页`)

  await page.locator('[data-action="stop"]').click()
  await page.waitForFunction(() => !document.querySelector('.auto-show-layer'))
  await waitVisible(page, '[data-test="auto-show-fab"]')
  await waitHidden(page, '.preview-mask')
  const restored = await readHostState(page)
  check('停止后恢复进入前模板和批量开关', restored.badges.includes(ASSET_SAMPLE.name) && !restored.batch && restored.template.paperSize === before.template.paperSize, restored.badges)

  await page.locator('[data-test="auto-show-fab"]').click()
  await waitVisible(page, '[data-test="auto-show-controls"]')
  const loop = page.locator('[data-action="loop"]')
  await loop.click()
  check('循环开关可开启', await loop.getAttribute('aria-pressed') === 'true')
  await loop.click()
  check('循环开关可关闭', await loop.getAttribute('aria-pressed') === 'false')
  await page.locator('[data-action="stop"]').click()
  await page.waitForFunction(() => !document.querySelector('.auto-show-layer'))

  const autoUrl = new URL('?auto=1&loop=1', URL_).href
  await page.goto(autoUrl, { waitUntil: 'networkidle' })
  await waitDesigner(page)
  await waitStep(page, 'intro')
  const autoState = await page.evaluate(() => ({
    status: document.querySelector('.auto-show-layer')?.dataset.status,
    sound: document.querySelector('[data-action="sound"]')?.getAttribute('aria-pressed'),
    loop: document.querySelector('[data-action="loop"]')?.getAttribute('aria-pressed'),
  }))
  check('auto 参数自动启动且保持静音循环', autoState.status === 'running' && autoState.sound === 'false' && autoState.loop === 'true', JSON.stringify(autoState))
  await waitStep(page, 'asset-preview', 35000)
  await waitStep(page, 'express-waybill', 120000)
  check('循环模式从第二步继续且不重复开场', true)
  await page.locator('[data-action="stop"]').click()
  await page.waitForFunction(() => !document.querySelector('.auto-show-layer'))

  await page.goto(new URL('?auto=1', URL_).href, { waitUntil: 'networkidle' })
  await waitDesigner(page)
  await waitStep(page, 'asset-preview', 35000)
  await waitVisible(page, '[data-test="auto-show-fab"]', 120000)
  check('非循环模式一轮结束后自动回到 idle', !(await page.locator('.auto-show-layer').count()) && !(await page.locator('.preview-mask').count()))

  await page.locator('[data-test="auto-show-fab"]').click()
  await waitStep(page, 'express-preview')
  await page.locator('[data-action="stop"]').click()
  await page.waitForFunction(() => !document.querySelector('.auto-show-layer'))
  await waitHidden(page, '.preview-mask')
  check('在途预览中停止不会留下预览层', !(await page.locator('.preview-mask').count()))

  // 开声音时步骤推进以配音结束为准，不能按固定停留时长抢先切页
  await page.locator('[data-test="auto-show-fab"]').click()
  await waitStep(page, 'express-waybill')
  const audioIndex = await page.evaluate(() => window.__autoShowAudios.length)
  await page.locator('[data-action="sound"]').click()
  await page.waitForFunction(index => !!window.__autoShowAudios[index], audioIndex)
  // 2600ms > 2000ms 停留：若仍按旧计时推进，此刻应已切到下一步
  await page.waitForTimeout(2600)
  const voiced = await page.evaluate(index => {
    const audio = window.__autoShowAudios[index]
    return {
      step: document.querySelector('.auto-show-layer')?.dataset.stepId,
      playing: !!audio && !audio.ended && audio.currentTime > 0,
    }
  }, audioIndex)
  check('配音播放中停留在当前步骤', voiced.step === 'express-waybill' && voiced.playing, JSON.stringify(voiced))
  await page.waitForFunction(index => window.__autoShowAudioEnded.includes(index + 1), audioIndex, { timeout: 15000 })
  await waitStep(page, 'express-preview')
  check('配音播完才切换到下一步', true)
  await page.locator('[data-action="sound"]').click()
  await page.locator('[data-action="stop"]').click()
  await page.waitForFunction(() => !document.querySelector('.auto-show-layer'))

  await page.route('**/auto-show/voice/*.mp3', route => route.abort())
  await page.locator('[data-test="auto-show-fab"]').click()
  await waitVisible(page, '[data-test="auto-show-controls"]')
  await page.locator('[data-action="sound"]').click()
  await page.waitForFunction(() => document.querySelector('[data-action="sound"]')?.getAttribute('aria-pressed') === 'false')
  check('配音加载失败时自动降级为静音', true)
  await page.locator('[data-action="stop"]').click()
  await page.waitForFunction(() => !document.querySelector('.auto-show-layer'))
  await page.unroute('**/auto-show/voice/*.mp3')

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const mobile = await mobileContext.newPage()
  mobile.on('pageerror', error => errors.push(`mobile: ${String(error)}`))
  await mobile.goto(URL_, { waitUntil: 'networkidle' })
  await waitDesigner(mobile)
  await mobile.locator('[data-test="auto-show-fab"]').click()
  await waitVisible(mobile, '[data-test="auto-show-controls"]')
  const mobileLayout = await mobile.evaluate(() => {
    const controls = document.querySelector('[data-test="auto-show-controls"]').getBoundingClientRect()
    const thumb = document.querySelector('[data-test="auto-show-intro"] .auto-show-intro-card')
    const style = thumb ? getComputedStyle(thumb) : null
    return {
      inside: controls.left >= 0 && controls.right <= innerWidth && controls.top >= 0 && controls.bottom <= innerHeight,
      animation: style?.animationName ?? '',
      transform: style?.transform ?? '',
      transition: style?.transitionDuration ?? '',
    }
  })
  check('移动端控制条完整位于视口内', mobileLayout.inside, JSON.stringify(mobileLayout))
  check('reduced-motion 下缩略图无位移动画', mobileLayout.animation === 'none' && mobileLayout.transform === 'none' && /^0s(?:, 0s)*$/.test(mobileLayout.transition), JSON.stringify(mobileLayout))
  await mobile.locator('[data-action="stop"]').click()
  await mobileContext.close()

  const realErrors = errors.filter(error => !/Failed to load resource|WebSocket|favicon/i.test(error))
  check('全程无页面脚本错误', realErrors.length === 0, realErrors.join(' | '))
} catch (error) {
  check('自动演示冒烟验收', false, error.stack || String(error))
} finally {
  await browser.close()
}

const passed = results.filter(result => result.pass).length
const failed = results.length - passed
console.log(`\n${passed}/${results.length} 通过，${failed} 失败`)
if (failed) process.exitCode = 1
