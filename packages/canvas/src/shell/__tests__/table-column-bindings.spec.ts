// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import type { TableRow } from '@worm-print-platform/core/designer'
import { DesignerStore } from '../../core/store'
import { FormatToolbar } from '../../core/format'
import { render } from '../../core/h'
import type { ShellCtx, ShellState } from '../controls'
import { renderPropertyPanel } from '../property-panel'
import { buildTableColumnBindings, buildTableColumnFields } from '../table-column-bindings'

function makeRows(): TableRow[] {
  return [
    {
      id: 'rh', type: 'header', height: 8,
      cells: [{ id: 'h1', formatter: '名称' }, { id: 'h2', formatter: '数量' }],
    },
    {
      id: 'rd', type: 'data', height: 8,
      cells: [{ id: 'd1', formatter: '{name}' }, { id: 'd2', formatter: '{qty}' }],
    },
    {
      id: 'rs', type: 'summary', height: 8,
      cells: [{ id: 's1', formatter: '合计' }, { id: 's2', formatter: '{SUM(qty)}' }],
    },
  ]
}

function makeStore(): DesignerStore {
  return new DesignerStore({
    initialFields: [
      { fieldKey: 'items.name', fieldLabel: '名称', fieldType: 'string', sortOrder: 1 },
      { fieldKey: 'items.qty', fieldLabel: '数量', fieldType: 'number', sortOrder: 2 },
      { fieldKey: 'order.no', fieldLabel: '单号', fieldType: 'string', sortOrder: 3 },
    ],
  })
}

function paintTable(store: DesignerStore) {
  store.addElement('table', {
    left: 10, top: 10, width: 100, height: 24,
    tableColWidths: [50, 50], tableRows: makeRows(), dataSource: 'items',
  } as never)
  const el = store.elements[0]!
  store.selectOne(el.id)
  const state: ShellState = {
    leftTab: 'elements', leftCollapsed: false, propTab: 'element', propCollapsed: false,
    openDd: null, collapsedGroups: new Set(), renamingPage: null,
  }
  const ctx: ShellCtx = {
    store, format: new FormatToolbar(store), state,
    repaint: () => {}, fire: () => {}, showHelp: true, isEdit: false, host: { fonts: [] },
  }
  const host = document.createElement('div')
  render(renderPropertyPanel(ctx), host)
  return { host, store, el }
}

describe('buildTableColumnBindings', () => {
  it('按列输出表头/数据/汇总格，表头文字作为列标题', () => {
    const columns = buildTableColumnBindings({
      options: { tableColWidths: [50, 50], tableRows: makeRows() },
    })
    expect(columns).toHaveLength(2)
    expect(columns[0]!.headerLabel).toBe('名称')
    expect(columns[0]!.cells.map(c => [c.rowType, c.formatter])).toEqual([
      ['header', '名称'], ['data', '{name}'], ['summary', '合计'],
    ])
    expect(columns[1]!.headerLabel).toBe('数量')
  })

  it('合并占位格跳过，只在主格列输出', () => {
    const rows = makeRows()
    rows[0]!.cells = [
      { id: 'h1', formatter: '名称', colspan: 2 },
      { id: 'h2', merged: true } as never,
    ]
    const columns = buildTableColumnBindings({ options: { tableColWidths: [50, 50], tableRows: rows } })
    expect(columns[0]!.headerLabel).toBe('名称')
    expect(columns[1]!.headerLabel).toBe('名称')
    expect(columns[0]!.cells.filter(c => c.rowType === 'header')).toHaveLength(1)
    expect(columns[1]!.cells.filter(c => c.rowType === 'header')).toHaveLength(0)
    expect(columns[1]!.cells.filter(c => c.rowType === 'data')).toHaveLength(1)
  })

  it('数据格字段按 dataSource 去掉容器前缀；无匹配时回退全量', () => {
    const fields = [
      { fieldKey: 'items.name', fieldLabel: '名称', fieldType: 'string', sortOrder: 1 },
      { fieldKey: 'items.qty', fieldLabel: '数量', fieldType: 'number', sortOrder: 2 },
      { fieldKey: 'order.no', fieldLabel: '单号', fieldType: 'string', sortOrder: 3 },
      { fieldKey: 'items', fieldLabel: '明细', fieldType: 'list', sortOrder: 4 },
    ]
    expect(buildTableColumnFields(fields, 'items')).toEqual([
      { key: 'name', label: '名称', fieldType: 'string' },
      { key: 'qty', label: '数量', fieldType: 'number' },
    ])
    expect(buildTableColumnFields(fields, 'missing').map(f => f.key)).toEqual(['items.name', 'items.qty', 'order.no'])
  })
})

describe('属性台「列绑定」组', () => {
  it('整表选中时出列绑定组', () => {
    const { host } = paintTable(makeStore())
    expect([...host.querySelectorAll('.group-title')].map(t => t.textContent)).toContain('列绑定')
    expect(host.querySelectorAll('.table-column-binding')).toHaveLength(2)
    expect(host.querySelectorAll('.table-column-binding-cell .pd-input')).toHaveLength(6)
  })

  it('编辑数据格写回 formatter，字段选择写入 {字段} 表达式', () => {
    const { host, store } = paintTable(makeStore())
    const dataInputs = [...host.querySelectorAll<HTMLInputElement>('.table-column-binding-cell .pd-input')]
    const dataInput = dataInputs[1]!
    dataInput.value = '{name} {code}'
    dataInput.dispatchEvent(new Event('change'))
    const rows = store.elements[0]!.options.tableRows as TableRow[]
    expect(rows[1]!.cells[0]!.formatter).toBe('{name} {code}')
    const picker = host.querySelectorAll<HTMLSelectElement>('.table-column-field-picker')[2]!
    picker.value = 'qty'
    picker.dispatchEvent(new Event('change'))
    const updated = store.elements[0]!.options.tableRows as TableRow[]
    expect(updated[1]!.cells[1]!.formatter).toBe('{qty}')
  })

  it('没有表格行时显示空态', () => {
    const store = makeStore()
    store.addElement('table', { left: 0, top: 0, width: 100, height: 20, tableRows: [], tableColWidths: [] } as never)
    store.selectOne(store.elements[0]!.id)
    const state: ShellState = {
      leftTab: 'elements', leftCollapsed: false, propTab: 'element', propCollapsed: false,
      openDd: null, collapsedGroups: new Set(), renamingPage: null,
    }
    const ctx: ShellCtx = {
      store, format: new FormatToolbar(store), state,
      repaint: () => {}, fire: () => {}, showHelp: true, isEdit: false, host: { fonts: [] },
    }
    const host = document.createElement('div')
    render(renderPropertyPanel(ctx), host)
    expect(host.textContent).toContain('当前表格没有可绑定的单元格')
  })
})
