// 整表选中时的「列绑定」属性组：按打印列把表头/数据/小计/汇总格排成矩阵，
// 数据格提供单据字段直插。模板结构不变，写回仍走 options.tableRows[r].cells[c].formatter。
import type {
  PrintBusinessField,
  RuntimeElement,
  TableCell,
  TableRow,
  TableRowType,
} from '@worm-print-platform/core/designer'
import { findMainCell } from '@worm-print-platform/core/designer'
import { h } from '../core/h'
import type { El } from '../core/h'
import { tr } from './controls'
import type { ShellCtx } from './controls'
import { group } from './prop-group'
import { writeBindingValue } from './binding'

/** 列绑定只依赖表格元素的三组 options，单测可直接传入最小对象 */
export interface TableElementLike {
  options?: {
    tableRows?: TableRow[]
    tableColWidths?: number[]
    dataSource?: string
  }
}

/** 每个打印列在属性台占一行 */
export interface TableColumnBinding {
  columnIndex: number
  /** 表头文字；无表头时为空串，由 UI 用列号兜底 */
  headerLabel: string
  cells: TableColumnBindingCell[]
}

export interface TableColumnBindingCell {
  rowIndex: number
  cellIndex: number
  rowType: TableRowType
  formatter: string
}

export interface TableColumnBindingField {
  key: string
  label: string
  fieldType: string
}

const ROW_LABEL_KEYS: Record<TableRowType, string> = {
  header: 'tableProps.rowHeader',
  data: 'tableProps.rowData',
  subtotal: 'tableProps.rowSubtotal',
  summary: 'tableProps.rowSummary',
}

/** findMainCell 假定目标格存在；缺格时返回 null，而不是抛错 */
function mainCellOf(rows: TableRow[], r: number, c: number): { r: number; c: number } | null {
  if (!rows[r]?.cells[c]) return null
  return findMainCell(rows, r, c)
}

/**
 * 按列整理可编辑的单元格：
 * - 列宽数组与所有行的格数取最大值作为列数；
 * - 合并占位格跳过；跨行/跨列合并只在主格列输出一次；
 * - 每列的行按模板行顺序输出（表头 / 数据 / 小计 / 汇总）。
 */
export function buildTableColumnBindings(table?: TableElementLike | null): TableColumnBinding[] {
  const rows = table?.options?.tableRows ?? []
  if (rows.length === 0) return []
  const widths = table?.options?.tableColWidths ?? []
  const count = Math.max(widths.length, ...rows.map(row => row.cells?.length ?? 0))
  if (count <= 0) return []
  const headerRowIndex = rows.findIndex(row => row.type === 'header')
  const columns: TableColumnBinding[] = []
  for (let c = 0; c < count; c += 1) {
    let headerText = ''
    if (headerRowIndex >= 0) {
      const main = mainCellOf(rows, headerRowIndex, c)
      const cell = main ? rows[main.r]?.cells[main.c] : undefined
      headerText = String(cell?.formatter ?? '').trim()
    }
    const cells: TableColumnBindingCell[] = []
    rows.forEach((row, r) => {
      const cell: TableCell | undefined = row.cells?.[c]
      if (!cell || cell.merged) return
      const main = mainCellOf(rows, r, c)
      if (!main || main.r !== r || main.c !== c) return
      cells.push({ rowIndex: r, cellIndex: c, rowType: row.type, formatter: String(cell.formatter ?? '') })
    })
    columns.push({ columnIndex: c, headerLabel: headerText, cells })
  }
  return columns
}

/**
 * 数据格字段候选：按表格「列表数据源」去掉容器前缀；没有匹配子字段时回退全量字段。
 * 与旧宿主层的字段直选口径一致，但由设计器原生消费。
 */
export function buildTableColumnFields(
  fields: readonly PrintBusinessField[] | undefined,
  dataSource?: string,
): TableColumnBindingField[] {
  const usable = (fields ?? []).filter(field => !!field.fieldKey && field.fieldType !== 'list')
  const prefix = dataSource ? `${dataSource}.` : ''
  const scoped = prefix ? usable.filter(field => field.fieldKey.startsWith(prefix)) : usable
  const source = scoped.length ? scoped : usable
  const seen = new Set<string>()
  const options: TableColumnBindingField[] = []
  for (const field of source) {
    const key = prefix && field.fieldKey.startsWith(prefix)
      ? field.fieldKey.slice(prefix.length)
      : field.fieldKey
    if (!key || seen.has(key)) continue
    seen.add(key)
    options.push({ key, label: field.fieldLabel || field.fieldKey, fieldType: field.fieldType || 'text' })
  }
  return options
}

/** 表头格是普通文字，不给字段按钮；数据/小计/汇总格可直插字段 */
function fieldPicker(
  ctx: ShellCtx,
  element: RuntimeElement,
  cell: TableColumnBindingCell,
  fields: TableColumnBindingField[],
): El | string {
  if (cell.rowType === 'header' || fields.length === 0) return ''
  return h('select', {
    class: 'pd-select table-column-field-picker',
    title: tr(ctx, 'tableProps.pickField'),
    'aria-label': tr(ctx, 'tableProps.pickField'),
    onChange: (event: Event) => {
      const key = (event.target as HTMLSelectElement).value
      if (key) writeCellFormatter(ctx, element, cell, `{${key}}`)
    },
  }, [
    h('option', { value: '', text: tr(ctx, 'tableProps.pickField') }),
    ...fields.map(field => h('option', { value: field.key, text: `${field.label}（${field.key}）` })),
  ])
}

function writeCellFormatter(ctx: ShellCtx, element: RuntimeElement, cell: TableColumnBindingCell, value: string): void {
  writeBindingValue(
    ctx.store,
    element,
    `options.tableRows[${cell.rowIndex}].cells[${cell.cellIndex}].formatter`,
    value,
  )
}

/** 整表选中时的「列绑定」属性组；调用方保证传入的是当前选中的 table 元素 */
export function tableColumnBindingsGroup(ctx: ShellCtx, element: RuntimeElement): El {
  const columns = buildTableColumnBindings(element)
  const fields = buildTableColumnFields(ctx.store.fields, element.options.dataSource)
  const content: El[] = [
    h('p', { class: 'pd-hint', text: tr(ctx, 'tableProps.columnBindingsHint') }),
  ]
  if (columns.length === 0) {
    content.push(h('p', { class: 'pd-empty', text: tr(ctx, 'tableProps.noColumns') }))
  } else {
    for (const column of columns) {
      content.push(h('div', { class: 'table-column-binding' }, [
        h('div', { class: 'table-column-binding-head' }, [
          h('span', {
            class: 'table-column-binding-index',
            text: tr(ctx, 'tableProps.columnIndex', { n: column.columnIndex + 1 }),
          }),
          h('span', { class: 'table-column-binding-title', text: column.headerLabel, title: column.headerLabel }),
        ]),
        ...column.cells.map(cell => h('div', { class: 'table-column-binding-cell' }, [
          h('span', {
            class: 'pd-label table-column-binding-row-label',
            text: tr(ctx, ROW_LABEL_KEYS[cell.rowType]),
          }),
          h('div', { class: 'table-column-binding-input' }, [
            h('input', {
              class: 'pd-input',
              type: 'text',
              value: cell.formatter,
              placeholder: cell.rowType === 'header'
                ? tr(ctx, 'tableProps.headerPlaceholder')
                : tr(ctx, 'binding.k10'),
              onChange: (event: Event) => {
                writeCellFormatter(ctx, element, cell, (event.target as HTMLInputElement).value)
              },
            }),
            fieldPicker(ctx, element, cell, fields),
          ]),
        ])),
      ]))
    }
  }
  return group(ctx, 'table-column-bindings', tr(ctx, 'tableProps.columnBindings'), 'Grid', content)
}
