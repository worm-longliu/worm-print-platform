// template-renderer 单元测试：错误码归类、整段共用截止时间的预算分配、窗口环节失败的资源清理。
// electron / core 管线 / withTimeout 全部替身，只验 bridge 自身的控制流。
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { existsSync } from 'node:fs'

const env = vi.hoisted(() => ({
  failConstruct: false,
  failLoad: false,
  prepareError: undefined as unknown,
  prepareElapsedMs: 0,
  /** 覆盖 prepareDocument 替身的返回值；缺省单页 A4 portrait */
  prepared: undefined as
    | { pageCount: number; paperMm: { width: number; height: number }; pagePaperMm?: Array<{ width: number; height: number }>; html: string }
    | undefined,
  /** 文档里的 .print-page 总数（删除非目标页脚本返回该值） */
  pagesInDoc: 1,
  windows: [] as Array<{
    destroyed: boolean
    destroy: () => void
    /** 记录构造入参尺寸与 webContents 调用历史，供窗口/截图链路断言 */
    size: { width: number; height: number }
    webContents: { executeJavaScript: { mock: { calls: Array<[unknown]> } } }
  }>,
}))

const fsEnv = vi.hoisted(() => ({ written: [] as string[] }))

const budget = vi.hoisted(() => ({ timeoutMs: [] as number[] }))

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    writeFileSync: vi.fn((...args: [string, string, BufferEncoding]) => {
      fsEnv.written.push(args[0])
      return actual.writeFileSync(args[0], args[1], args[2])
    }),
  }
})

vi.mock('electron', () => {
  class FakeWebContents {
    setZoomFactor = vi.fn()
    executeJavaScript = vi.fn(async (code: unknown) => {
      const src = String(code)
      if (src.includes('readElementRects')) return [{ id: 'e1', left: 0, top: 0, width: 10, height: 5 }]
      if (src.includes('.print-page')) return env.pagesInDoc
      return undefined
    })
    capturePage = vi.fn(async () => ({
      toPNG: () => Buffer.from('png'),
      getSize: () => ({ width: 794, height: 1123 }),
    }))
  }
  class FakeBrowserWindow {
    webContents = new FakeWebContents()
    /** 记录构造入参（useContentSize 下的内容尺寸），供窗口尺寸断言 */
    size = { width: 0, height: 0 }
    destroyed = false
    isDestroyed = (): boolean => this.destroyed
    destroy = (): void => { this.destroyed = true }
    loadFile = vi.fn(async () => {
      if (env.failLoad) throw new Error('加载失败')
    })
    constructor(options?: { width?: number; height?: number }) {
      this.size = { width: options?.width ?? 0, height: options?.height ?? 0 }
      if (env.failConstruct) throw new Error('窗口创建失败')
      env.windows.push(this)
    }
  }
  return { BrowserWindow: FakeBrowserWindow }
})

vi.mock('@worm-print-platform/core', () => ({
  prepareDocument: vi.fn(async () => {
    if (env.prepareElapsedMs > 0) vi.advanceTimersByTime(env.prepareElapsedMs)
    if (env.prepareError !== undefined) throw env.prepareError
    return env.prepared ?? {
      pageCount: 1,
      paperMm: { width: 210, height: 297 },
      html: '<html></html>',
    }
  }),
}))

vi.mock('@worm-print-platform/core/node', () => ({
  loadExecutorBundle: () => ({ source: '/* executor */' }),
}))

vi.mock('./html-printer.js', () => ({
  waitResourcesReady: vi.fn(async () => {}),
}))

vi.mock('./with-timeout.js', () => ({
  withTimeout: vi.fn(async (run: () => Promise<unknown>, options: { timeoutMs: number }) => {
    budget.timeoutMs.push(options.timeoutMs)
    return run()
  }),
}))

function codeOf(err: unknown): string | undefined {
  return err && typeof err === 'object' ? (err as { code?: string }).code : undefined
}

function withCode(code: string): Error {
  return Object.assign(new Error(`原始报错 ${code}`), { code })
}

async function render(): Promise<unknown> {
  const { createTemplateRenderer } = await import('./template-renderer.js')
  const renderer = createTemplateRenderer({ runtime: {} as never })
  return renderer.renderTemplatePage({ templateJson: { paperSize: 'A4' }, page: 1, scale: 1 })
}

/** 指定页码渲染：混合方向多页用例需要 page=2 命中 rotatedSize 组合 */
async function renderAt(page: number): Promise<unknown> {
  const { createTemplateRenderer } = await import('./template-renderer.js')
  const renderer = createTemplateRenderer({ runtime: {} as never })
  return renderer.renderTemplatePage({ templateJson: { paperSize: 'A5' }, page, scale: 1 })
}

beforeEach(() => {
  vi.useFakeTimers()
  env.failConstruct = false
  env.failLoad = false
  env.prepareError = undefined
  env.prepareElapsedMs = 0
  env.prepared = undefined
  env.pagesInDoc = 1
  env.windows.length = 0
  fsEnv.written.length = 0
  budget.timeoutMs.length = 0
})

afterEach(() => {
  vi.useRealTimers()
  vi.resetModules()
})

describe('classifyRenderError', () => {
  it.each(['RENDER_TIMEOUT', 'CLIENT_TIMEOUT'])('%s 归类为 bridge 的 RENDER_TIMEOUT', async (code) => {
    const { classifyRenderError } = await import('./template-renderer.js')
    let caught: unknown
    try {
      classifyRenderError(withCode(code))
    } catch (e) {
      caught = e
    }
    expect(codeOf(caught)).toBe('RENDER_TIMEOUT')
    expect((caught as Error).message).toContain('未完成')
  })

  it('非超时错误码保持 RENDER_FAILED', async () => {
    const { classifyRenderError } = await import('./template-renderer.js')
    let caught: unknown
    try {
      classifyRenderError(withCode('BARCODE_FAILED'))
    } catch (e) {
      caught = e
    }
    expect(codeOf(caught)).toBe('RENDER_FAILED')
    expect((caught as Error).message).toContain('BARCODE_FAILED')
  })
})

describe('预览预算（整段共用 20s 截止时间）', () => {
  it('管线很快时，截图段拿到完整 20s', async () => {
    await expect(render()).resolves.toBeDefined()
    expect(budget.timeoutMs).toHaveLength(1)
    expect(budget.timeoutMs[0]).toBe(20_000)
  })

  it('管线已耗 19.9s 时，截图段只拿剩余 100ms，不再额外给 20s', async () => {
    env.prepareElapsedMs = 19_900
    await expect(render()).resolves.toBeDefined()
    expect(budget.timeoutMs[0]).toBe(100)
  })

  it('管线超时（RENDER_TIMEOUT）向上传播为 RENDER_TIMEOUT', async () => {
    env.prepareError = withCode('RENDER_TIMEOUT')
    await expect(render()).rejects.toMatchObject({ code: 'RENDER_TIMEOUT' })
    expect(budget.timeoutMs).toHaveLength(0)
  })
})

describe('窗口环节失败也要清理临时 HTML', () => {
  it('BrowserWindow 构造抛错时删除已写入的临时 HTML', async () => {
    env.failConstruct = true
    await expect(render()).rejects.toThrow('窗口创建失败')
    expect(fsEnv.written.length).toBe(1)
    expect(existsSync(fsEnv.written[0]!)).toBe(false)
  })

  it('loadFile 抛错时删除临时 HTML 并销毁窗口', async () => {
    env.failLoad = true
    await expect(render()).rejects.toThrow('加载失败')
    expect(fsEnv.written.length).toBe(1)
    expect(existsSync(fsEnv.written[0]!)).toBe(false)
    expect(env.windows.every(w => w.destroyed)).toBe(true)
  })

  it('成功路径同样删除临时 HTML', async () => {
    await expect(render()).resolves.toBeDefined()
    expect(existsSync(fsEnv.written[0]!)).toBe(false)
  })
})

describe('混合方向多页预览按目标页出图（rotatedSize 放行后的回归）', () => {
  /** A5 旋转对：page1 横 210×148 + page2 纵 148×210（mm） */
  function prepareMixedOrientation(): void {
    env.prepared = {
      pageCount: 2,
      paperMm: { width: 210, height: 148 },
      pagePaperMm: [{ width: 210, height: 148 }, { width: 148, height: 210 }],
      html: '<html></html>',
    }
    env.pagesInDoc = 2
  }

  it('page=2（纵向页）：窗口尺寸按该页 148×210 设置，pageSizeMm 返回该页纸张', async () => {
    prepareMixedOrientation()
    const result = await renderAt(2) as { pageSizeMm: { width: number; height: number }; mmPerPx: number }
    // mmToPx(148)=559、mmToPx(210)=794（scale=1）
    expect(env.windows[0]!.size).toEqual({ width: 559, height: 794 })
    expect(result.pageSizeMm).toEqual({ width: 148, height: 210 })
    // mmPerPx 按目标页纸宽 148 反推，而非首页 210（否则偏大 42%）
    expect(result.mmPerPx).toBe(0.1864)
  })

  it('page=1（横向页）：窗口与 pageSizeMm 仍取首页纸张', async () => {
    prepareMixedOrientation()
    const result = await renderAt(1) as { pageSizeMm: { width: number; height: number } }
    expect(env.windows[0]!.size).toEqual({ width: 794, height: 559 })
    expect(result.pageSizeMm).toEqual({ width: 210, height: 148 })
  })

  it('删除非目标页使目标页成为首屏唯一页：测量恒取第 0 页', async () => {
    prepareMixedOrientation()
    await renderAt(2)
    const calls = env.windows[0]!.webContents.executeJavaScript.mock.calls as Array<[string]>
    // 删除脚本：只保留 pages[1]，其余 remove
    const removeCall = calls.find(([src]) => src.includes('.print-page') && src.includes('remove()'))
    expect(removeCall?.[0]).toContain('pages[1]')
    // 测量不再用原始页码索引（文档只剩一页），恒为 0
    const measureCall = calls.find(([src]) => src.includes('readElementRects'))
    expect(measureCall?.[0]).toBe('globalThis.__wormDom.readElementRects(document, 0)')
  })

  it('单页模板无 pagePaperMm 时回退 paperMm（原行为不变）', async () => {
    env.prepared = { pageCount: 1, paperMm: { width: 210, height: 297 }, html: '<html></html>' }
    const result = await renderAt(1) as { pageSizeMm: { width: number; height: number } }
    expect(env.windows[0]!.size).toEqual({ width: 794, height: 1123 })
    expect(result.pageSizeMm).toEqual({ width: 210, height: 297 })
  })
})
