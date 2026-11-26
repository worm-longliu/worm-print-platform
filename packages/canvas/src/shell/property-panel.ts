// 属性台：DOM 对齐 Vue 3 轨的 PropertyPanel.vue + property/*Group.vue
// （.property-panel / .prop-head / .pd-tabs.prop-tabs / .property-content /
//  .property-group>.group-header>.group-icon|.group-title|.expand-icon / .group-content /
//  .property-search>input.pd-input / .font-select>.font-select-input+.font-select-list /
//  .pd-form / .position-grid / .margin-grid / .pd-field>.pd-label / .pd-divider / .pd-empty）。
// 搜索门控（filteredGroups / matchedKeys / searching）见 shell/property-search.ts，口径同 canvas。
import { tr, trG } from './controls.js'
import {
  PAPER_PRESETS, isContinuousPaperSize, resolveElementTextFit, imageFitOptions,
  resolveDesignImageSrc, barcodeBarWidthRecommendText, normalizeRotationAngle,
  acceptsElementBorder, applyElementBorderPreset, elementBorderEdgeVisible, effectiveElementBorderSpec,
  resolveElementBorderDisplay, setElementBorderEdgeVisible, setElementBorderField, BORDER_LINE_STYLES,
  ELEMENT_BORDER_APPLY_HINT_KEY,
  resolveFlowColumns, resolveFlowGapX, resolveFlowLayoutMode, resolveFlowMaxSpan, resolveFlowPadding, resolveFlowRowHeight, suggestFlowColumns,
  resolveCellGroupMode, matchKeywords,
} from '@worm-print-platform/core/designer'
import { computeMaxColumns } from '@worm-print-platform/core'
import type { BorderPreset, ElementBorderFieldKey, ElementBorderSide, ElementOptions, RuntimeElement } from '@worm-print-platform/core/designer'
import { h } from '../core/h'
import type { El } from '../core/h'
import { iconSvg } from '../core/icons'
import { getPluginPropertyTab } from '../core/plugin'
import type { PluginPropertyTab } from '../core/plugin'
import { getElementPropertyGroup } from '../core/element-definitions'
import { mountElementUIResult } from './plugin-ui'
import { colorTrigger, divider, field, fieldHelp, radioGroup, resetButton, stepper } from './controls'
import { createDefaultOptions, propertyDefault, DEFAULT_DEMO_DATA } from '@worm-print-platform/core/designer'
import { isRotationExcludedType, isFreeAngleEditable, codeObliqueNote, collectFollowMemberIds } from '@worm-print-platform/core/designer'
import { designBackgroundSection, tilingSection } from './page-extras'
import { bindingGroup } from './binding'
import { tableColumnBindingsGroup } from './table-column-bindings'
import { renderFontSelect } from './font-select'
import { gateItem, renderPropertySearch } from './property-search'
import { cropAnchorField } from './crop-anchor'
import { group } from './prop-group'
import { paginationGroup, tableCellGroup, tableRowGroup, tableSettingsGroup } from './table-props'
import { watermarkSection } from './watermark'
import type { ShellCtx } from './controls'

/** 数字属性行：label + 步进框（undefined 透传给 stepper → 留空显示占位，与 Vue 3 轨的 v-model 未设置态一致） */
function numField(_ctx: ShellCtx, label: string, value: number | undefined, onCommit: (v: number) => void,
  opts: { min?: number; max?: number; step?: number; placeholder?: string } = {}, reset?: El) {
  return field(label, stepper({ value, ...opts, onCommit }), undefined, reset)
}

/** 下拉属性行 */
/** 下拉属性行（导出仅供单测断言未设置态，包公开入口不导出） */
export function selectField(_ctx: ShellCtx, label: string, value: string, options: { value: string; label: string }[], onCommit: (v: string) => void, tip?: string, reset?: El) {
  // Vue 3 轨的字体粗细用 v-model：值匹配不到选项时 selectedIndex 变 -1，下拉框显示空白。
  // 这里必须建真节点才能复现该语义（h() 只是描述，选中态要按赋值顺序生效）。
  const select = document.createElement('select')
  select.className = 'pd-select'
  select.addEventListener('change', () => onCommit(select.value))
  for (const o of options) {
    const opt = document.createElement('option')
    opt.value = o.value
    opt.textContent = o.label
    select.appendChild(opt)
  }
  select.value = value
  // 与 Vue 的 v-model 同动作：匹配不到选项时显式置 -1，不依赖各引擎对 `value=` 赋空的处理
  if (!options.some(o => o.value === value)) select.selectedIndex = -1
  return tip ? fieldHelp(label, select, tip, reset) : field(label, select, undefined, reset)
}

function switchField(_ctx: ShellCtx, label: string, checked: boolean, onCommit: (v: boolean) => void, reset?: El) {
  // 派生样式把 .pd-switch 定义在 input 本体上（appearance:none + ::after 滑块），
  // 用 label 包一层会让开关样式失效，故与 Vue 3 轨一致直接给 input 挂类
  return field(label, h('input', {
    type: 'checkbox', class: 'pd-switch', checked,
    onChange: (ev: Event) => onCommit((ev.target as HTMLInputElement).checked),
  }), undefined, reset)
}

/** 元素边框入口：档位、边位与文案与 Vue 3 轨的 BorderBgGroup.vue 逐项一致 */
const ELEMENT_BORDER_PRESETS: { value: BorderPreset; labelKey: string }[] = [
  { value: 'all', labelKey: 'propertyPanel.k177' }, { value: 'outer', labelKey: 'propertyPanel.k178' },
  { value: 'inner', labelKey: 'propertyPanel.k179' }, { value: 'none', labelKey: 'propertyPanel.k180' },
]

const ELEMENT_BORDER_EDGES: { value: ElementBorderSide; labelKey: string }[] = [
  { value: 'top', labelKey: 'propertyPanel.k181' }, { value: 'right', labelKey: 'propertyPanel.k182' },
  { value: 'bottom', labelKey: 'propertyPanel.k183' }, { value: 'left', labelKey: 'propertyPanel.k184' },
]

function elementPane(ctx: ShellCtx, el: RuntimeElement) {
  const s = ctx.store
  const o = el.options
  const type = el.printElementType.type
  const patch = (p: Record<string, unknown>) => s.updateElement(el.id, p as never)
  // 统一注册表派生：插件可通过 propertyGroup 复用内置属性分组，也可覆盖内置分组
  const propertyGroup = getElementPropertyGroup(type)
  const isText = propertyGroup === 'text'
  const isCode = propertyGroup === 'code'
  const isTable = propertyGroup === 'table'
  /** 单元格选中态：单元格位置与宽高由行高/列宽控制，「位置与尺寸」分组让位（Vue 3 轨 isTableCellSelected） */
  const cellSelected = isTable && s.tableSelection?.elementId === el.id
  /** 多选单元格：只做批量设置，不回显单格配置——「内容」绑定组按 r1,c1 单格读写，整组让位给单元格台 */
  const multiCellSelected = cellSelected
    && resolveCellGroupMode(el.options.tableRows ?? [], s.tableSelection!).mode === 'multi'

  const rows: unknown[] = []
  // 内容绑定组置顶：作者最常改的一栏，先于位置/外观（与 Vue 3 轨 PropertyPanel 同序）
  // 整表选中时用「列绑定」矩阵替代逐格平铺的「内容」组；选中单元格时仍走单格写回
  const tableColumnSelected = isTable && !cellSelected && s.selectedIds.size === 1
  if (!multiCellSelected) rows.push(tableColumnSelected ? tableColumnBindingsGroup(ctx, el) : bindingGroup(ctx, el))
  /** 落点派生自该元素类型的出厂值：未预置的键 ⇒ undefined ⇒ 写回即删键；预置了字面值的键
   *  （text 的 fontSize、longText 的 lineHeight、image 的 fit）⇒ 写回字面值。一条规则覆盖两种
   *  相反的正确行为。reset 一律挂在外层 field/fieldHelp 上，不挂进 radioGroup 等控件构造参数。 */
  const FACTORY = createDefaultOptions(type) as Record<string, any>
  const reset = (key: string, rk: string): El => {
    const d = propertyDefault(rk)
    return resetButton({
      target: o as Record<string, any>, base: FACTORY, propKey: key,
      tipValue: d?.value, tipUnit: d?.unit,
      write: () => patch({ [key]: FACTORY[key] } as never),
    })
  }
  if (!cellSelected) {
    rows.push(group(ctx, 'position-size', tr(ctx, 'propertyPanel.k185'), 'Location', [
      h('form', { class: 'pd-form', onSubmit: (ev: Event) => ev.preventDefault() }, [
        h('div', { class: 'position-grid' }, [
          gateItem(ctx, 'ps-left', numField(ctx, 'X', o.left, v => patch({ left: v }), { min: 0 })),
          gateItem(ctx, 'ps-top', numField(ctx, 'Y', o.top, v => patch({ top: v }), { min: 0 })),
          gateItem(ctx, 'ps-width', numField(ctx, 'W', o.width, v => patch({ width: v }), { min: 4 })),
          gateItem(ctx, 'ps-height', numField(ctx, 'H', o.height, v => patch({ height: v }), { min: 4 })),
        ]),
        h('h3', { class: 'pd-divider', text: tr(ctx, 'propertyPanel.k186') }),
        h('div', { class: 'margin-grid' }, [
          gateItem(ctx, 'ps-margin-top', numField(ctx, tr(ctx, 'propertyPanel.k187'), o.marginTop, v => patch({ marginTop: v === 0 ? undefined : v }), {}, reset('marginTop', 'ps-margin-top'))),
          gateItem(ctx, 'ps-margin-right', numField(ctx, tr(ctx, 'propertyPanel.k188'), o.marginRight, v => patch({ marginRight: v === 0 ? undefined : v }), {}, reset('marginRight', 'ps-margin-right'))),
          gateItem(ctx, 'ps-margin-bottom', numField(ctx, tr(ctx, 'propertyPanel.k189'), o.marginBottom, v => patch({ marginBottom: v === 0 ? undefined : v }), {}, reset('marginBottom', 'ps-margin-bottom'))),
          gateItem(ctx, 'ps-margin-left', numField(ctx, tr(ctx, 'propertyPanel.k190'), o.marginLeft, v => patch({ marginLeft: v === 0 ? undefined : v }), {}, reset('marginLeft', 'ps-margin-left'))),
        ]),
      ]),
    ]))
  }

  // Vue 3 轨的 AppearanceGroup 恒渲染：非文本元素出空态提示，表格元素只留空 form（分组标题仍在）
  /** 元素级旋转行（判据一律取 core 单点，画布所见必须等于出纸）：
   *  排除类型与表格跟随区成员都不出行（契约四）；码类无 ≥385dpi 承诺时自由角度置灰、
   *  只留 90° 步进（契约五，出纸端同门槛会把斜角吸附成直角）；
   *  数值输入复用 stepper（± 按钮由 .pd-rotate-stepper 派生样式藏掉），两侧为 90° 步进按钮；
   *  0 与未设同义（写 undefined 删键），归一口径与画布一致 */
  const rotateCurrent = typeof o.rotate === 'number' && Number.isFinite(o.rotate) && o.rotate !== 0
    ? normalizeRotationAngle(o.rotate)
    : undefined
  const rotateCommit = (v: number | undefined): void =>
    patch({ rotate: v === undefined || v === 0 ? undefined : normalizeRotationAngle(v) })
  const angleEditable = isFreeAngleEditable(type, o)
  const rotateBlocked = isRotationExcludedType(type)
    || collectFollowMemberIds(s.elements).has(el.id)
  const rotateRow = rotateBlocked ? '' : gateItem(ctx, 'ap-rotate', fieldHelp(tr(ctx, 'propertyPanel.k191'),
    h('div', { class: 'pd-rotate-row' }, [
      h('button', {
        type: 'button', class: 'pd-rotate-btn',
        title: tr(ctx, 'propertyPanel.k192'), 'aria-label': tr(ctx, 'propertyPanel.k193'), text: '↺',
        onClick: () => rotateCommit((rotateCurrent ?? 0) - 90),
      }),
      h('div', { class: 'pd-rotate-stepper' }, [stepper({
        value: rotateCurrent, min: 0, max: 359, placeholder: '0', disabled: !angleEditable,
        onCommit: v => rotateCommit(v),
      })]),
      h('button', {
        type: 'button', class: 'pd-rotate-btn',
        title: tr(ctx, 'propertyPanel.k194'), 'aria-label': tr(ctx, 'propertyPanel.k195'), text: '↻',
        onClick: () => rotateCommit((rotateCurrent ?? 0) + 90),
      }),
    ]),
    tr(ctx, 'propertyTips.ap-rotate'), reset('rotate', 'ap-rotate')))
  /** 置灰原因常驻说明（与 Vue 3 轨的 .pd-rotate-note 同文案，出自 core 单点常量） */
  const rotateNote = rotateBlocked || angleEditable
    ? ''
    : h('p', { class: 'pd-hint pd-rotate-note', text: codeObliqueNote(ctx.t ?? trG) })

  rows.push(group(ctx, 'appearance', tr(ctx, 'propertyPanel.k196'), 'Brush', [
    h('form', { class: 'pd-form', onSubmit: (ev: Event) => ev.preventDefault() }, isText ? [
      gateItem(ctx, 'ap-font-family', field(tr(ctx, 'propertyPanel.k197'), renderFontSelect({
        id: 'prop-font',
        state: ctx.state,
        fonts: ctx.host.fonts,
        value: typeof o.fontFamily === 'string' ? o.fontFamily : undefined,
        placeholder: tr(ctx, 'propertyPanel.k198'),
        onChange: v => patch({ fontFamily: v }),
      }), undefined, reset('fontFamily', 'ap-font-family'))),
      gateItem(ctx, 'ap-font-size', numField(ctx, tr(ctx, 'propertyPanel.k199'), o.fontSize, v => patch({ fontSize: v }), { min: 8, max: 72 }, reset('fontSize', 'ap-font-size'))),
      gateItem(ctx, 'ap-font-weight', selectField(ctx, tr(ctx, 'propertyPanel.k200'), String(o.fontWeight ?? ''), [
        { value: 'normal', label: tr(ctx, 'propertyPanel.k201') }, { value: 'bold', label: tr(ctx, 'propertyPanel.k202') },
        { value: 'bolder', label: tr(ctx, 'propertyPanel.k203') }, { value: 'lighter', label: tr(ctx, 'propertyPanel.k204') },
      ], v => patch({ fontWeight: v }), undefined, reset('fontWeight', 'ap-font-weight'))),
      gateItem(ctx, 'ap-align', field(tr(ctx, 'propertyPanel.k205'), radioGroup('ta', [
        { value: 'left', label: tr(ctx, 'propertyPanel.k206') }, { value: 'center', label: tr(ctx, 'propertyPanel.k207') }, { value: 'right', label: tr(ctx, 'propertyPanel.k208') }, { value: 'justify', label: tr(ctx, 'propertyPanel.k209') },
      ], o.textAlign || 'left', v => patch({ textAlign: v })), undefined, reset('textAlign', 'ap-align'))),
      gateItem(ctx, 'ap-vertical-align', field(tr(ctx, 'propertyPanel.k210'), radioGroup('va', [
        { value: 'top', label: tr(ctx, 'propertyPanel.k211') }, { value: 'middle', label: tr(ctx, 'propertyPanel.k212') }, { value: 'bottom', label: tr(ctx, 'propertyPanel.k213') },
      ], o.verticalAlign || 'top', v => patch({ verticalAlign: v })), undefined, reset('verticalAlign', 'ap-vertical-align'))),
      h('div', { class: 'color-row' }, [
        gateItem(ctx, 'ap-color', field(tr(ctx, 'propertyPanel.k214'), colorTrigger(o.color, v => patch({ color: v }), tr(ctx, 'propertyPanel.k215')), undefined, reset('color', 'ap-color'))),
        gateItem(ctx, 'ap-bg-color', field(tr(ctx, 'propertyPanel.k216'), colorTrigger(o.backgroundColor, v => patch({ backgroundColor: v }), tr(ctx, 'propertyPanel.k217')), undefined, reset('backgroundColor', 'ap-bg-color'))),
      ]),
      gateItem(ctx, 'ap-line-height', numField(ctx, tr(ctx, 'propertyPanel.k218'), o.lineHeight, v => patch({ lineHeight: v || undefined }), { min: 0, max: 100 }, reset('lineHeight', 'ap-line-height'))),
      gateItem(ctx, 'ap-letter-spacing', numField(ctx, tr(ctx, 'propertyPanel.k219'), o.letterSpacing, v => patch({ letterSpacing: v || undefined }), { min: 0, max: 20, step: 0.5 }, reset('letterSpacing', 'ap-letter-spacing'))),
      gateItem(ctx, 'ap-text-fit', selectField(ctx, tr(ctx, 'propertyPanel.k220'), resolveElementTextFit(type, o), [
        { value: 'clip', label: tr(ctx, 'propertyPanel.k221') }, { value: 'shrink', label: tr(ctx, 'propertyPanel.k222') },
        { value: 'autoHeight', label: tr(ctx, 'propertyPanel.k223') },
      ], v => patch({ textFit: v }), undefined, reset('textFit', 'ap-text-fit'))),
      o.textFit === 'shrink' ? gateItem(ctx, 'ap-shrink-min', field(tr(ctx, 'propertyPanel.k224'), stepper({
        value: o.shrinkMinFontSize, min: 1, max: 72, step: 0.5, placeholder: tr(ctx, 'propertyPanel.k225'),
        onCommit: v => patch({ shrinkMinFontSize: v || undefined }),
      }), undefined, reset('shrinkMinFontSize', 'ap-shrink-min'))) : '',
      type === 'longText' ? gateItem(ctx, 'ap-long-text-indent', fieldHelp(tr(ctx, 'propertyPanel.k226'), stepper({ value: o.longTextIndent, min: 0, max: 10, placeholder: tr(ctx, 'propertyPanel.k227'), onCommit: v => patch({ longTextIndent: v || undefined }) }), tr(ctx, 'propertyTips.ap-long-text-indent'), reset('longTextIndent', 'ap-long-text-indent'))) : '',
      gateItem(ctx, 'ap-word-wrap', switchField(ctx, tr(ctx, 'propertyPanel.k228'), o.wordWrap !== false, v => patch({ wordWrap: v ? undefined : false }), reset('wordWrap', 'ap-word-wrap'))),
      gateItem(ctx, 'ap-keep-line-breaks', switchField(ctx, tr(ctx, 'propertyPanel.k229'), o.keepLineBreaks === true, v => patch({ keepLineBreaks: v ? true : undefined }), reset('keepLineBreaks', 'ap-keep-line-breaks'))),
      rotateRow,
      rotateNote,
    ] : [
      // 平铺条件项：不能在这里套数组，common 的 h() 不摊平嵌套子节点（会让 paint 递归抛 TypeError）
      type === 'image' ? gateItem(ctx, 'ap-img-fit', selectField(ctx, tr(ctx, 'propertyPanel.k230'), String(o.fit ?? 'contain'), imageFitOptions(ctx.t ?? trG),
        v => patch({ fit: v }), tr(ctx, 'propertyTips.ap-img-fit'), reset('fit', 'ap-img-fit'))) : '',
      // 只有剪裁档有「被裁掉的那条边」可挪，其余档不出这一行（与 Vue 3 轨 AppearanceGroup、两端单元格台同一门禁）
      type === 'image' && o.fit === 'cover' ? gateItem(ctx, 'ap-img-object-position', cropAnchorField(ctx, {
        fieldKey: 'ap-img-object-position', label: tr(ctx, 'propertyPanel.k231'), src: resolveDesignImageSrc(o.src as string),
        widthMm: Number(o.width) || 0, heightMm: Number(o.height) || 0, fit: o.fit as string | undefined,
        scale: o.fitScale as number | undefined,
        value: o.objectPosition === undefined ? undefined : String(o.objectPosition),
        onCommit: v => patch({ objectPosition: v }),
        onScaleCommit: v => patch({ fitScale: v }),
        resetAnchor: reset('objectPosition', 'ap-img-object-position'),
        resetScale: reset('fitScale', 'ap-img-fit-scale'),
      })) : '',
      rotateRow,
      rotateNote,
      // 旋转行已覆盖全部可旋转的非文本类型，空态只剩不支持旋转的 flowList（表格走上方空 form）
      type === 'flowList' ? h('p', { class: 'pd-empty', text: tr(ctx, 'propertyPanel.k232') }) : '',
    ].filter(Boolean)),
  ]))

  if (isCode) {
    const isBarcode = type === 'barcode'
    // 码制归一化大写（存量模板可能是小写 code128，不归一化下拉框匹配不到选项）
    const barcodeType = String(o.barcodeType || 'CODE128').toUpperCase()
    const dpi = o.printerDpi ? String(o.printerDpi) : ''
    /** 条宽推荐段：只在填了分辨率时出现，只给参考不回写值（与画布元素台共用 core 文案） */
    const barWidthRec = barcodeBarWidthRecommendText(o.printerDpi, o.barWidth, ctx.t ?? trG)
    rows.push(group(ctx, 'code', tr(ctx, 'propertyPanel.k233'), 'Postcard', [
      h('form', { class: 'pd-form', onSubmit: (ev: Event) => ev.preventDefault() }, [
        isBarcode ? [
          gateItem(ctx, 'cd-type', selectField(ctx, tr(ctx, 'propertyPanel.k234'), barcodeType, [
            { value: 'CODE128', label: tr(ctx, 'propertyPanel.k235') }, { value: 'EAN13', label: tr(ctx, 'propertyPanel.k236') },
            { value: 'EAN8', label: 'EAN8' }, { value: 'UPC', label: 'UPC' },
            { value: 'CODE39', label: 'CODE39' }, { value: 'ITF14', label: 'ITF14' },
          ], v => patch({ barcodeType: v === 'CODE128' ? undefined : v }))),
          gateItem(ctx, 'cd-dpi', selectField(ctx, tr(ctx, 'propertyPanel.k237'), dpi, [
            { value: '', label: tr(ctx, 'propertyPanel.k238') }, { value: '203', label: tr(ctx, 'propertyPanel.k239') },
            { value: '300', label: tr(ctx, 'propertyPanel.k240') }, { value: '600', label: tr(ctx, 'propertyPanel.k241') },
          ], v => patch({ printerDpi: Number(v) > 0 ? Number(v) : undefined }), undefined, reset('printerDpi', 'cd-dpi'))),
          gateItem(ctx, 'cd-dpi', h('p', {
            class: 'pd-hint',
            text: tr(ctx, 'propertyPanel.k242'),
          })),
          gateItem(ctx, 'cd-bar-width', numField(ctx, tr(ctx, 'propertyPanel.k243'), o.barWidth ?? 2, v => patch({ barWidth: v }), { min: 2, max: 8, step: 0.5 }, reset('barWidth', 'cd-bar-width'))),
          gateItem(ctx, 'cd-bar-width', h('p', {
            class: 'pd-hint',
            text: (dpi
              ? tr(ctx, 'propertyPanel.k244')
              : tr(ctx, 'propertyPanel.k245')) + (barWidthRec ? `。${barWidthRec}` : ''),
          })),
          gateItem(ctx, 'cd-bar-quiet-zone', fieldHelp(tr(ctx, 'propertyPanel.k246'), stepper({
            value: o.barQuietZone, min: 0, max: 20, placeholder: tr(ctx, 'propertyPanel.k247'),
            onCommit: v => patch({ barQuietZone: v }),
          }), tr(ctx, 'propertyTips.cd-bar-quiet-zone'), reset('barQuietZone', 'cd-bar-quiet-zone'))),
          gateItem(ctx, 'cd-bar-height', fieldHelp(tr(ctx, 'propertyPanel.k248'), stepper({
            value: o.barHeight, min: 1, max: 100, placeholder: tr(ctx, 'propertyPanel.k249'),
            onCommit: v => patch({ barHeight: v ?? undefined }),
          }), tr(ctx, 'propertyTips.cd-bar-height'), reset('barHeight', 'cd-bar-height'))),
          gateItem(ctx, 'cd-show-text', switchField(ctx, tr(ctx, 'propertyPanel.k250'), o.hideTitle !== true, v => patch({ hideTitle: v ? undefined : true }), reset('hideTitle', 'cd-show-text'))),
          gateItem(ctx, 'cd-font-size', field(tr(ctx, 'propertyPanel.k251'), stepper({
            value: o.fontSize, min: 5, max: 24, placeholder: tr(ctx, 'propertyPanel.k252'),
            onCommit: v => patch({ fontSize: v || undefined }),
          }), undefined, reset('fontSize', 'cd-font-size'))),
        ] : [
          gateItem(ctx, 'cd-ec-level', selectField(ctx, tr(ctx, 'propertyPanel.k253'), String(o.qrCodeLevel ?? 'M'), [
            { value: 'L', label: tr(ctx, 'propertyPanel.k254') }, { value: 'M', label: tr(ctx, 'propertyPanel.k255') },
            { value: 'Q', label: 'Q' }, { value: 'H', label: tr(ctx, 'propertyPanel.k256') },
          ], v => patch({ qrCodeLevel: v }), undefined, reset('qrCodeLevel', 'cd-ec-level'))),
          gateItem(ctx, 'cd-quiet-zone', fieldHelp(tr(ctx, 'propertyPanel.k257'), stepper({
            value: o.qrQuietZone, min: 0, max: 8, placeholder: tr(ctx, 'propertyPanel.k258'),
            onCommit: v => patch({ qrQuietZone: v }),
          }), tr(ctx, 'propertyTips.cd-quiet-zone'), reset('qrQuietZone', 'cd-quiet-zone'))),
        ],
        divider(tr(ctx, 'propertyPanel.k259')),
        isBarcode ? h('p', {
          class: 'pd-hint',
          text: tr(ctx, 'propertyPanel.k260'),
        }) : '',
        !isBarcode ? gateItem(ctx, 'cd-fit', selectField(ctx, tr(ctx, 'propertyPanel.k261'), String(o.fit || 'contain'), imageFitOptions(ctx.t ?? trG),
          v => patch({ fit: v || undefined }), undefined, reset('fit', 'cd-fit'))) : '',
        gateItem(ctx, 'cd-max-width', field(tr(ctx, 'propertyPanel.k262'), stepper({
          value: o.maxWidth, min: 1, max: 200, placeholder: tr(ctx, 'propertyPanel.k263'),
          onCommit: v => patch({ maxWidth: v || undefined }),
        }), undefined, reset('maxWidth', 'cd-max-width'))),
        gateItem(ctx, 'cd-max-height', field(tr(ctx, 'propertyPanel.k264'), stepper({
          value: o.maxHeight, min: 1, max: 200, placeholder: tr(ctx, 'propertyPanel.k265'),
          onCommit: v => patch({ maxHeight: v || undefined }),
        }), undefined, reset('maxHeight', 'cd-max-height'))),
      ].flat().filter(Boolean)),
    ]))
  }

  if (cellSelected) {
    rows.push(tableRowGroup(ctx, el))
    rows.push(tableCellGroup(ctx, el))
  }
  if (isTable) {
    rows.push(tableSettingsGroup(ctx, el))
  }
  // 流式列表：列数与行高必须指定、跨列默认关、放不下只提示不写值（与 Vue 3 轨 FlowListGroup 逐项一致）
  if (type === 'flowList') {
    const cols = resolveFlowColumns(o.flowColumns)
    const rowH = resolveFlowRowHeight(o.flowRowHeight)
    const gap = resolveFlowGapX(o.flowGapX)
    const maxSpan = resolveFlowMaxSpan(o.flowMaxSpan, cols)
    const fitCols = suggestFlowColumns(o.width ?? 0, gap, o.fontSize ?? 12)
    const layoutMode = resolveFlowLayoutMode(o.flowLayoutMode)
    const isDynamic = layoutMode === 'dynamic'
    const padding = resolveFlowPadding(o as unknown as Record<string, unknown>)
    const commitPadding = (key: 'flowPaddingTop' | 'flowPaddingRight' | 'flowPaddingBottom' | 'flowPaddingLeft', v: number) => {
      patch({ [key]: typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0 })
    }
    // 分组键与 Vue 3 轨 FlowListGroup 的 group-key 同串，两侧折叠偏好才互通
    rows.push(group(ctx, 'flowList', tr(ctx, 'propertyPanel.k266'), 'Grid3x3', [
      h('form', { class: 'pd-form', onSubmit: (ev: Event) => ev.preventDefault() }, [
        gateItem(ctx, 'fl-layout-mode', selectField(
          ctx, tr(ctx, 'propertyPanel.k267'), layoutMode,
          [{ value: 'fixed', label: tr(ctx, 'propertyPanel.k268') }, { value: 'dynamic', label: tr(ctx, 'propertyPanel.k269') }],
          v => patch({ flowLayoutMode: v === 'dynamic' ? 'dynamic' : 'fixed' }),
          tr(ctx, 'propertyTips.fl-layout-mode'),
        )),
        ...(isDynamic ? [
          gateItem(ctx, 'fl-padding-top', fieldHelp(tr(ctx, 'propertyPanel.k270'), stepper({
            value: padding.top, min: 0, max: 100, step: 0.5,
            onCommit: v => commitPadding('flowPaddingTop', v),
          }), tr(ctx, 'propertyTips.fl-padding-top'))),
          gateItem(ctx, 'fl-padding-right', fieldHelp(tr(ctx, 'propertyPanel.k271'), stepper({
            value: padding.right, min: 0, max: 100, step: 0.5,
            onCommit: v => commitPadding('flowPaddingRight', v),
          }), tr(ctx, 'propertyTips.fl-padding-right'))),
          gateItem(ctx, 'fl-padding-bottom', fieldHelp(tr(ctx, 'propertyPanel.k272'), stepper({
            value: padding.bottom, min: 0, max: 100, step: 0.5,
            onCommit: v => commitPadding('flowPaddingBottom', v),
          }), tr(ctx, 'propertyTips.fl-padding-bottom'))),
          gateItem(ctx, 'fl-padding-left', fieldHelp(tr(ctx, 'propertyPanel.k273'), stepper({
            value: padding.left, min: 0, max: 100, step: 0.5,
            onCommit: v => commitPadding('flowPaddingLeft', v),
          }), tr(ctx, 'propertyTips.fl-padding-left'))),
        ] : []),
        gateItem(ctx, 'fl-columns', fieldHelp(tr(ctx, 'propertyPanel.k274'), stepper({
          value: cols, min: 1, max: 12,
          onCommit: v => patch({
            flowColumns: resolveFlowColumns(v),
            flowMaxSpan: resolveFlowMaxSpan(o.flowMaxSpan, resolveFlowColumns(v)),
          }),
        }), tr(ctx, 'propertyTips.fl-columns'))),
        gateItem(ctx, 'fl-row-height', fieldHelp(tr(ctx, 'propertyPanel.k275'), stepper({
          value: rowH, min: 3, max: 100, step: 0.5,
          onCommit: v => patch({ flowRowHeight: resolveFlowRowHeight(v) }),
        }), tr(ctx, 'propertyTips.fl-row-height'))),
        gateItem(ctx, 'fl-gap-x', fieldHelp(tr(ctx, 'propertyPanel.k276'), stepper({
          value: gap, min: 0, max: 50, step: 0.5,
          onCommit: v => patch({ flowGapX: resolveFlowGapX(v) }),
        }), tr(ctx, 'propertyTips.fl-gap-x'))),
        // 关开关不动 flowMaxSpan：与 Vue 3 轨 onAutoSpanChange 同口径，只开时补钳一次
        gateItem(ctx, 'fl-auto-span', switchField(ctx, tr(ctx, 'propertyPanel.k277'), o.flowAutoSpan === true, v => {
          patch(v ? { flowAutoSpan: v, flowMaxSpan: maxSpan } : { flowAutoSpan: v })
        })),
        o.flowAutoSpan === true ? gateItem(ctx, 'fl-max-span', fieldHelp(tr(ctx, 'propertyPanel.k278'), stepper({
          value: maxSpan, min: 1, max: cols,
          onCommit: v => patch({ flowMaxSpan: resolveFlowMaxSpan(v, cols) }),
        }), tr(ctx, 'propertyTips.fl-max-span'))) : '',
        cols > fitCols ? h('p', {
          class: 'pd-hint',
          text: tr(ctx, 'propertyPanel.k279', { v0: cols, v1: fitCols, v2: cols }),
        }) : '',
        // 单元模板与列表源不在本分组：模板写在「内容」分组的一条完整表达式里（{drugs.name} {drugs.spec}），
        // 列表源由表达式里出现的数组字段检出（core detectFlowListKey），与出纸同一口径
      ].flat().filter(Boolean)),
    ]))
  }

  /** 整圈四字段副本：预设与单边都在副本上改，再经 updateElement 收口（历史与重绘同一条路） */
  const borderFields = (): Pick<ElementOptions, 'borderWidth' | 'borderStyle' | 'borderColor' | 'borders'> => ({
    borderWidth: o.borderWidth, borderStyle: o.borderStyle, borderColor: o.borderColor, borders: o.borders,
  })
  const applyBorderPresetTo = (preset: BorderPreset) => {
    const next = borderFields()
    applyElementBorderPreset(next, preset, effectiveElementBorderSpec(next))
    patch(next)
  }
  /** 勾/撤单边：整圈生效时撤一边会把其余三边展开成分边（否则整圈照样盖住那条边） */
  const toggleBorderEdge = (side: ElementBorderSide) => {
    const next = borderFields()
    setElementBorderEdgeVisible(next, side, !elementBorderEdgeVisible(next, side))
    patch(next)
  }

  /** 三行显示「当前生效规格」（方案 B）：mixed／未设都留空，宽度与线型用「混合」占位说破各边不一 */
  const borderDisplay = resolveElementBorderDisplay(o)
  const styleMixed = borderDisplay.style === 'mixed'
  const displayWidth = typeof borderDisplay.width === 'number' ? borderDisplay.width : undefined
  const displayStyle = styleMixed || borderDisplay.style === undefined ? '' : borderDisplay.style
  const displayColor = typeof borderDisplay.color === 'string' ? borderDisplay.color : undefined
  const patchBorderField = (key: ElementBorderFieldKey, value: number | string | undefined) => {
    const next = borderFields()
    setElementBorderField(next, key, value)
    patch(next)
  }
  const lineStyles = BORDER_LINE_STYLES.map(o => ({ ...o, label: tr(ctx, o.labelKey) }))
  const styleOptions = styleMixed
    ? [{ value: '', label: tr(ctx, 'propertyPanel.k280') }, ...lineStyles]
    : lineStyles

  rows.push(group(ctx, 'border-bg', tr(ctx, 'propertyPanel.k281'), 'Picture', [
    h('form', { class: 'pd-form', onSubmit: (ev: Event) => ev.preventDefault() }, [
      gateItem(ctx, 'bb-border-style', selectField(ctx, tr(ctx, 'propertyPanel.k282'), displayStyle, styleOptions,
        v => patchBorderField('borderStyle', v))),
      h('div', { class: 'border-row' }, [
        gateItem(ctx, 'bb-border-width', numField(ctx, tr(ctx, 'propertyPanel.k283'), displayWidth,
          v => patchBorderField('borderWidth', v),
          { min: 0, max: 20, step: 0.25, placeholder: borderDisplay.width === 'mixed' ? tr(ctx, 'propertyPanel.k284') : undefined },
          reset('borderWidth', 'bb-border-width'))),
        gateItem(ctx, 'bb-border-color', field(tr(ctx, 'propertyPanel.k285'), colorTrigger(displayColor, v => patchBorderField('borderColor', v), tr(ctx, 'propertyPanel.k286')), undefined, reset('borderColor', 'bb-border-color'))),
      ]),
      // rect/oval/hline/vline/table 用 border 画自身本体，写分边不出效果（与出纸 resolveElementBorder 同一排除表）
      ...(acceptsElementBorder(type) ? [
        h('div', { class: 'pd-button-group border-presets' }, ELEMENT_BORDER_PRESETS.map(p => h('button', {
          type: 'button', class: 'pd-button small', text: tr(ctx, p.labelKey), disabled: p.value === 'inner',
          onClick: () => applyBorderPresetTo(p.value),
        }))),
        h('div', { class: 'pd-checkbox-group' }, ELEMENT_BORDER_EDGES.map(edge => h('label', { class: 'pd-checkbox' }, [
          h('input', {
            type: 'checkbox', checked: elementBorderEdgeVisible(o, edge.value),
            onChange: () => toggleBorderEdge(edge.value),
          }),
          h('span', { text: tr(ctx, edge.labelKey) }),
        ]))),
        h('p', { class: 'pd-hint', text: tr(ctx, ELEMENT_BORDER_APPLY_HINT_KEY) }),
      ] : []),
      gateItem(ctx, 'bb-bg-color', field(tr(ctx, 'propertyPanel.k287'), colorTrigger(o.backgroundColor, v => patch({ backgroundColor: v }), tr(ctx, 'propertyPanel.k288')), undefined, reset('backgroundColor', 'bb-bg-color'))),
    ]),
  ]))

  rows.push(paginationGroup(ctx, el))

  rows.push(group(ctx, 'advanced', tr(ctx, 'propertyPanel.k289'), 'Setting', [
    h('form', { class: 'pd-form', onSubmit: (ev: Event) => ev.preventDefault() }, [
      h('div', { class: 'advanced-row' }, [
        gateItem(ctx, 'ad-locked', switchField(ctx, tr(ctx, 'propertyPanel.k290'), !!o.locked, v => patch({ locked: v }), reset('locked', 'ad-locked'))),
        gateItem(ctx, 'ad-fixed', switchField(ctx, tr(ctx, 'propertyPanel.k291'), !!o.repeatOnEveryPage, v => patch({ repeatOnEveryPage: v }), reset('repeatOnEveryPage', 'ad-fixed'))),
        gateItem(ctx, 'ad-fixed-position', switchField(ctx, tr(ctx, 'propertyPanel.k292'), !!o.fixed, v => patch({ fixed: v }), reset('fixed', 'ad-fixed-position'))),
      ]),
      gateItem(ctx, 'ad-z-index', numField(ctx, tr(ctx, 'propertyPanel.k293'), o.zIndex, v => patch({ zIndex: v }), { min: 0, max: 999 }, reset('zIndex', 'ad-z-index'))),
      gateItem(ctx, 'ad-delete', h('div', { class: 'pd-field' }, [
        h('button', {
          type: 'button', class: 'pd-button danger', text: tr(ctx, 'propertyPanel.k294'),
          onClick: () => s.deleteSelected(),
        }),
      ])),
    ]),
  ], false, [
    h('button', {
      type: 'button', class: 'group-help', title: tr(ctx, 'propertyPanel.k295'), 'aria-label': tr(ctx, 'propertyPanel.k296'), text: '?',
      onClick: (ev: Event) => {
        ev.stopPropagation()
        ctx.fire('help', 'advanced-settings')
      },
    }),
  ]))

  return h('div', { class: 'property-content' }, rows)
}

function pagePane(ctx: ShellCtx) {
  const s = ctx.store
  const t = s.templateData
  const patch = (p: Record<string, unknown>) => s.updateTemplateData(p as never)
  // 拼版启用且每格占位宽高互换性变化（0/180 ↔ 90/270）时，列数自动铺满新档位上限（与 Vue 3 轨同口径）；
  // 同档位内切换占位不变，不重排——作者手动改小的列数得以保留
  const patchOutputRotation = (v: number) => {
    const tiling = t.tiling
    const swapped = (r: unknown) => r === 90 || r === 270
    if (tiling?.enabled && swapped(v) !== swapped(t.outputRotation)) {
      const maxColumns = computeMaxColumns({ ...t, outputRotation: v } as never)
      patch({ outputRotation: v, tiling: { ...tiling, columns: Math.max(maxColumns, 1) } })
      return
    }
    patch({ outputRotation: v })
  }
  const groups: { group: string; items: { key: string; label: string }[] }[] = []
  for (const [key, preset] of Object.entries(PAPER_PRESETS)) {
    const name = tr(ctx, `constants.paper.group.${preset.group}`)
    let bucket = groups.find(g => g.group === name)
    if (!bucket) { bucket = { group: name, items: [] }; groups.push(bucket) }
    bucket.items.push({ key, label: tr(ctx, preset.labelKey) })
  }
  const custom = !PAPER_PRESETS[t.paperSize]
  const continuous = isContinuousPaperSize(t.paperSize)

  return h('form', { class: 'pd-form', onSubmit: (ev: Event) => ev.preventDefault() }, [
    divider(tr(ctx, 'propertyPanel.k298')),
    field(tr(ctx, 'propertyPanel.k299'), h('select', {
      class: 'pd-select',
      style: { width: '100%' },
      onChange: (ev: Event) => patch({ paperSize: (ev.target as HTMLSelectElement).value }),
    }, [
      ...groups.map(g => h('optgroup', { label: g.group },
        g.items.map(i => h('option', { value: i.key, text: i.label, selected: t.paperSize === i.key })))),
      h('option', { value: 'CUSTOM', text: tr(ctx, 'propertyPanel.k300'), selected: custom }),
    ])),
    (continuous || custom) ? field(continuous ? tr(ctx, 'propertyPanel.k301') : tr(ctx, 'propertyPanel.k302'), h('div', { class: 'custom-size-grid' }, [
      stepper({ value: Number(t.customWidth ?? 0), min: 25, max: 2000, onCommit: v => patch({ customWidth: v }) }),
      ...(custom ? [h('span', { class: 'custom-size-x', text: '×' }),
        stepper({ value: Number(t.customHeight ?? 0), min: 25, max: 2000, onCommit: v => patch({ customHeight: v }) })] : []),
    ])) : '',
    !continuous ? field(tr(ctx, 'propertyPanel.k303'), radioGroup('ori', [
      { value: 'portrait', label: tr(ctx, 'propertyPanel.k304') }, { value: 'landscape', label: tr(ctx, 'propertyPanel.k305') },
    ], t.orientation === 'landscape' ? 'landscape' : 'portrait', v => patch({ orientation: v })),
      tr(ctx, 'propertyPanel.k306')) : '',
    // canvas：连续纸隐藏内容旋转（无旋转概念）；拼版启用时按每格内容旋转
    !continuous ? field(tr(ctx, 'propertyPanel.k307'), radioGroup('rot', [
      { value: '0', label: '0°' }, { value: '90', label: '90°' },
      { value: '180', label: '180°' }, { value: '270', label: '270°' },
    ], String(t.outputRotation ?? 0), v => patchOutputRotation(Number(v)), true),
      t.tiling?.enabled
        ? tr(ctx, 'propertyPanel.k308')
        : tr(ctx, 'propertyPanel.k309')) : '',
    field(tr(ctx, 'propertyPanel.k310'), h('div', { class: 'page-bg-row' }, [
      colorTrigger(t.pageBackground, v => patch({ pageBackground: v }), tr(ctx, 'propertyPanel.k311'), 'page-bg-picker'),
    ]), undefined, resetButton({
      target: t as Record<string, any>, base: { pageBackground: undefined } as Record<string, any>,
      propKey: 'pageBackground', write: () => patch({ pageBackground: undefined }),
    })),
    designBackgroundSection(ctx),
    s.pages.length > 1 ? '' : tilingSection(ctx),
    divider(tr(ctx, 'propertyPanel.k312')),
    h('div', { class: 'margin-grid' }, [
      numField(ctx, tr(ctx, 'propertyPanel.k313'), t.margins.top, v => patch({ margins: { ...t.margins, top: v } }), { min: 0, max: 50 }),
      numField(ctx, tr(ctx, 'propertyPanel.k314'), t.margins.bottom, v => patch({ margins: { ...t.margins, bottom: v } }), { min: 0, max: 100 }),
      numField(ctx, tr(ctx, 'propertyPanel.k315'), t.margins.left, v => patch({ margins: { ...t.margins, left: v } }), { min: 0, max: 50 }),
      numField(ctx, tr(ctx, 'propertyPanel.k316'), t.margins.right, v => patch({ margins: { ...t.margins, right: v } }), { min: 0, max: 50 }),
    ]),
    divider(tr(ctx, 'propertyPanel.k317')),
    numField(ctx, tr(ctx, 'propertyPanel.k318'), t.header.height ?? 10, v => patch({ header: { ...t.header, height: v } }), { min: 0, max: 100, step: 0.1 }),
    numField(ctx, tr(ctx, 'propertyPanel.k319'), t.footer.height ?? 10, v => patch({ footer: { ...t.footer, height: v } }), { min: 0, max: 100, step: 0.1 }),
    watermarkSection(ctx),
  ].filter(Boolean))
}

/** 「自定义属性」pane：plugin-kit UI 渲染进 .property-content；未搜索恒显示，搜索时按关键词命中 */
function customPane(ctx: ShellCtx, el: RuntimeElement, custom: PluginPropertyTab) {
  const keyword = (ctx.state.propSearch ?? '').trim()
  const visible = !keyword || matchKeywords(keyword, [...custom.searchKeywords, custom.label])
  const content = document.createElement('div')
  content.className = 'property-content'
  if (visible) {
    try {
      mountElementUIResult(`property:${el.id}`, custom.ui.renderProperty!({
        element: el,
        // 与画布同口径：宿主注入真实业务数据时优先用之，未注入回落内置 demo 数据
        data: ctx.host.designData?.length ? ctx.host.designData : [DEFAULT_DEMO_DATA],
        // 业务字段清单交给插件：图表类插件据此生成数据源 / 类目 / 数值字段下拉
        fields: ctx.host.fields ?? [],
        update: partial => ctx.store.updateElement(el.id, partial),
        repaint: () => ctx.repaint(),
        openExpression: (target, onApply) => ctx.fire('open-plugin-expression', { target, onApply }),
        // 插件 UI 用契约里的 t 取词；不传会退回 core 全局 locale（与实例 lang 脱节）
        t: ctx.t ?? trG,
      }), content)
    } catch {
      // 插件渲染失败时保持空内容，不打断属性台其余页签
    }
  }
  return h('div', {
    class: 'pd-tab-pane', role: 'tabpanel',
    // 滚动记账键：整树重建会换掉 pane 节点，paint 尾部按该键回写 scrollTop（见 print-designer.ts）
    dataset: { pane: 'prop:custom' },
    style: ctx.state.propTab === 'custom' ? '' : { display: 'none' },
  }, [content])
}

export function renderPropertyPanel(ctx: ShellCtx) {
  const s = ctx.store
  const st = ctx.state
  const el = s.selectedElement
  // 有插件 UI 且 hasProperties 通过时，页签表第一项为「自定义属性」（Vue 3 轨 同口径）
  const customTab = el ? getPluginPropertyTab(el) : undefined
  if (st.propCollapsed) {
    return h('div', { class: 'property-panel collapsed' }, [
      h('div', { class: 'prop-collapsed' }, [
        h('button', {
          type: 'button', class: 'pc-btn', title: tr(ctx, 'propertyPanel.k320'), text: '«',
          onClick: () => { st.propCollapsed = false; ctx.repaint() },
        }),
        ...(customTab
          ? [h('button', {
              type: 'button', class: `pc-btn${st.propTab === 'custom' ? ' on' : ''}`, title: customTab.label,
              html: iconSvg(customTab.icon, 14) || iconSvg('Shapes', 14),
              onClick: () => { st.propTab = 'custom'; st.propCollapsed = false; ctx.repaint() },
            })]
          : []),
        ...([['element', tr(ctx, 'propertyPanel.k321'), '▦'], ['page', tr(ctx, 'propertyPanel.k322'), '▤']] as const).map(([tab, title, glyph]) =>
          h('button', {
            type: 'button', class: `pc-btn${st.propTab === tab ? ' on' : ''}`, title, text: glyph,
            onClick: () => { st.propTab = tab; st.propCollapsed = false; ctx.repaint() },
          })),
      ]),
    ])
  }
  // 无选中恒回「页面属性」；插件 UI 消失（如 hasProperties 变 false）时回退「元素属性」
  const tab = !el ? 'page' : st.propTab === 'custom' && !customTab ? 'element' : st.propTab
  return h('div', { class: 'property-panel' }, [
    h('div', { class: 'prop-head' }, [
      h('span', { class: 'prop-title', text: tr(ctx, 'propertyPanel.k323') }),
      h('button', {
        type: 'button', class: 'collapse-btn', title: tr(ctx, 'propertyPanel.k324'), text: '»',
        onClick: () => { st.propCollapsed = true; ctx.repaint() },
      }),
    ]),
    h('div', { class: 'pd-tabs prop-tabs' }, [
      h('div', { class: 'pd-tab-bar', role: 'tablist' }, [
        ...(customTab
          ? [h('button', {
              type: 'button', class: `pd-tab${tab === 'custom' ? ' active' : ''}`,
              text: customTab.label, onClick: () => { st.propTab = 'custom'; ctx.repaint() },
            })]
          : []),
        h('button', {
          type: 'button', class: `pd-tab${tab === 'element' ? ' active' : ''}`,
          text: tr(ctx, 'propertyPanel.k325'), onClick: () => { st.propTab = 'element'; ctx.repaint() },
        }),
        h('button', {
          type: 'button', class: `pd-tab${tab === 'page' ? ' active' : ''}`,
          text: tr(ctx, 'propertyPanel.k326'), onClick: () => { st.propTab = 'page'; ctx.repaint() },
        }),
      ]),
      // 页签同 Vue 3 轨的 v-show：节点常驻，切换只切 display
      customTab && el ? customPane(ctx, el, customTab) : '',
      h('div', {
        class: 'pd-tab-pane', role: 'tabpanel',
        dataset: { pane: 'prop:element' },
        style: tab === 'element' ? '' : { display: 'none' },
      }, el
        // canvas：元素页签内先渲染 PropertySearch，再是 .property-content 分组们
        ? [renderPropertySearch(ctx), elementPane(ctx, el)]
        : [h('p', { class: 'pd-empty', text: tr(ctx, 'propertyPanel.k327') })]),
      h('div', {
        class: 'pd-tab-pane', role: 'tabpanel',
        dataset: { pane: 'prop:page' },
        style: tab === 'page' ? '' : { display: 'none' },
      }, [pagePane(ctx)]),
    ].filter(Boolean)),
  ])
}
