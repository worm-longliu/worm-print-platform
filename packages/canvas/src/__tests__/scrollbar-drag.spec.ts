// @vitest-environment happy-dom
// 回归：拖动 .canvas-area 滚动条时 mousedown 会命中画布本体并启动框选。
// 若清空选中/框选 mousemove 触发整树重建，滚动容器会在拖动中被换掉，
// 原生滚动条拖动会话随之中断（表现为「有滚动条但拖不动」）。
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrintDesignerElement, definePrintDesigner } from '../print-designer'

const drawRulerMock = vi.hoisted(() => vi.fn())
vi.mock('../shell/ruler', () => ({ drawRuler: drawRulerMock }))

function stubStorage() {
  const map = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
      setItem: (k: string, v: string) => { map.set(k, String(v)) },
      removeItem: (k: string) => { map.delete(k) },
      clear: () => map.clear(),
    },
  })
}

function frame() {
  return new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
}

async function mountDesigner() {
  definePrintDesigner()
  const host = document.createElement('div')
  document.body.replaceChildren(host)
  const el = document.createElement('print-designer') as PrintDesignerElement
  host.appendChild(el)
  ;(el as unknown as { store: { addElement: (t: string, o: Record<string, number>) => void } })
    .store.addElement('text', { left: 10, top: 10, width: 40, height: 10 })
  await frame()
  const root = el.shadowRoot!
  const area = root.querySelector<HTMLElement>('.canvas-area')!
  // happy-dom 无布局：喂一组真实尺寸，让滚动条命中判据可测
  Object.defineProperties(area, {
    clientWidth: { value: 711, configurable: true },
    clientHeight: { value: 737, configurable: true },
    offsetWidth: { value: 726, configurable: true },
    offsetHeight: { value: 737, configurable: true },
  })
  area.getBoundingClientRect = () => ({ left: 249, top: 132, right: 975, bottom: 869, width: 726, height: 737, x: 249, y: 132, toJSON: () => ({}) })
  return { root, area }
}

beforeEach(() => { stubStorage(); drawRulerMock.mockClear() })

describe('滚动条拖动不被框选重绘打断', () => {
  it('画布空白处按下后拖动：不整树重建，框选浮层仍定点更新', async () => {
    const { root, area } = await mountDesigner()
    const toolbar = root.querySelector('.designer-toolbar')!

    area.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 400, clientY: 400 }))
    window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 460, clientY: 400 }))

    expect(root.querySelector('.designer-toolbar')).toBe(toolbar)
    const marquee = root.querySelector<HTMLElement>('.marquee-selection')
    expect(marquee).toBeTruthy()
    expect(marquee!.style.width).toBe('60px')

    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  })

  it('滚动条带上按下：不启动框选、不清空选中', async () => {
    const { root, area } = await mountDesigner()
    const toolbar = root.querySelector('.designer-toolbar')!

    area.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 600, clientY: 867 }))
    window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 700, clientY: 867 }))

    expect(root.querySelector('.designer-toolbar')).toBe(toolbar)
    expect(root.querySelector('.marquee-selection')).toBeNull()

    window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  })
})
