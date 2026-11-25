// 文案与顺序对照 demos/live-show/intents.mjs 的 LOOP_STEPS，直播侧改动时人工同步。
export const INTRO_SLIDE_MS = 2000
export const PREVIEW_HOLD_MS = 6000

export const VOICE_LINES = [
  { key: 'intro', text: '开场三张：快递电子面单、价签打印和电池模块标签，都来自真实模版。' },
  { key: 'express', text: '快递电子面单：运单条码、收寄信息、查件二维码和目的地大字，一联出纸。' },
  { key: 'express-preview', text: '面单预览：条码、二维码与签收栏按真实纸张渲染，不连接实体打印机。' },
  { key: 'price', text: '价签设计稿：品名、规格、促销价与划线原价，再加商品条码。' },
  { key: 'tiling', text: '价签拼版：32 枚标签铺满一张 A4，滚动预览逐枚看清条码。' },
  { key: 'asset', text: '资产标签：二维码加编号、型号、部门与责任人，一张 A4 可打 18 枚。' },
  { key: 'asset-preview', text: '资产标签预览：二维码和资产字段按单枚纸面出纸，缓慢滚动看清细节。' },
  { key: 'weight', text: '称签打印：品名、单价、净重、金额与商品条码，生鲜区即称即打。' },
  { key: 'weight-preview', text: '称签预览：60×40 毫米标签上的净重、金额与条码清晰出纸。' },
  { key: 'battery-no-sn', text: '电池模块标签（无 SN）：CODE128 条码横跨四列；barWidth 3、barHeight 7 毫米、printerDpi 203，让热敏出纸更清晰。' },
  { key: 'battery-preview', text: '电池标签预览：横跨四列的条码按 203dpi 出纸，边缘更清晰。' },
  { key: 'payment', text: '付款申请单：逐页看设计稿——付款方式同值纵向合并、跨页重显，审批栏重复。' },
  { key: 'payment-preview', text: '付款申请预览：合并单元格与审批栏按真实纸张连续出纸。' },
  { key: 'tcm', text: '中药处方笺：药材流式排布，每行 4 列，长药名自动跨两列且不切词。' },
  { key: 'tcm-preview', text: '处方笺预览：11 味药按流式四列出纸，长药名跨列不断词。' },
  { key: 'comprehensive', text: '综合示例：同一张明细表里，商品图片、条形码、二维码与金额图文混排。' },
  { key: 'comprehensive-preview', text: '综合示例预览：图片、条码与二维码在同一张明细表里出纸。' },
  { key: 'health', text: '体检报告：5 页 A4，多级表头与异常高亮，白细胞分类和生化趋势图混排。' },
  { key: 'health-preview', text: '体检报告预览：表格与图表在 5 页里连续出纸，页码自动续接。' },
  { key: 'multipage', text: '多页横纵混排：封面纵向、明细横向、条款纵向，页脚页码跨页连续。' },
  { key: 'multipage-preview', text: '混排预览：三页按各自方向连续出纸，页码接续，滚动看清每张纸面。' },
]

export const AUTO_SHOW_STEPS = [
  { id: 'intro', kind: 'intro', label: '开场', hold: 6000, text: VOICE_LINES[0].text, voice: 'intro', sampleIds: ['express-waybill', 'price-label', 'battery-module-label-no-sn'] },

  { id: 'express-waybill', kind: 'load-sample', label: '设计稿', hold: 2000, text: VOICE_LINES[1].text, voice: 'express', sampleId: 'express-waybill' },
  { id: 'express-preview', kind: 'preview', label: '出纸预览', hold: PREVIEW_HOLD_MS, text: VOICE_LINES[2].text, voice: 'express-preview' },

  { id: 'price-label', kind: 'load-sample', label: '设计稿', hold: 2000, text: VOICE_LINES[3].text, voice: 'price', sampleId: 'price-label' },
  { id: 'price-tiling', kind: 'tiling', label: '拼版预览', hold: PREVIEW_HOLD_MS, text: VOICE_LINES[4].text, voice: 'tiling', sampleId: 'price-label' },

  { id: 'asset-tag', kind: 'load-sample', label: '设计稿', hold: 2000, text: VOICE_LINES[5].text, voice: 'asset', sampleId: 'asset-tag' },
  { id: 'asset-preview', kind: 'preview', label: '出纸预览', hold: PREVIEW_HOLD_MS, text: VOICE_LINES[6].text, voice: 'asset-preview' },

  { id: 'weight-label', kind: 'load-sample', label: '设计稿', hold: 2000, text: VOICE_LINES[7].text, voice: 'weight', sampleId: 'weight-label' },
  { id: 'weight-preview', kind: 'preview', label: '出纸预览', hold: PREVIEW_HOLD_MS, text: VOICE_LINES[8].text, voice: 'weight-preview' },

  { id: 'battery-module-label-no-sn', kind: 'load-sample', label: '设计稿', hold: 2000, text: VOICE_LINES[9].text, voice: 'battery-no-sn', sampleId: 'battery-module-label-no-sn' },
  { id: 'battery-preview', kind: 'preview', label: '出纸预览', hold: PREVIEW_HOLD_MS, text: VOICE_LINES[10].text, voice: 'battery-preview' },

  { id: 'payment-request', kind: 'design-pages', label: '逐页设计稿', hold: 2000, text: VOICE_LINES[11].text, voice: 'payment', sampleId: 'payment-request' },
  { id: 'payment-preview', kind: 'preview', label: '出纸预览', hold: PREVIEW_HOLD_MS, text: VOICE_LINES[12].text, voice: 'payment-preview' },

  { id: 'tcm-prescription', kind: 'load-sample', label: '设计稿', hold: 2000, text: VOICE_LINES[13].text, voice: 'tcm', sampleId: 'tcm-prescription' },
  { id: 'tcm-preview', kind: 'preview', label: '出纸预览', hold: PREVIEW_HOLD_MS, text: VOICE_LINES[14].text, voice: 'tcm-preview' },

  { id: 'comprehensive-showcase', kind: 'load-sample', label: '设计稿', hold: 2000, text: VOICE_LINES[15].text, voice: 'comprehensive', sampleId: 'comprehensive-showcase' },
  { id: 'comprehensive-preview', kind: 'preview', label: '出纸预览', hold: PREVIEW_HOLD_MS, text: VOICE_LINES[16].text, voice: 'comprehensive-preview' },

  { id: 'health-report', kind: 'design-pages', label: '逐页设计稿', hold: 2000, text: VOICE_LINES[17].text, voice: 'health', sampleId: 'health-report' },
  { id: 'health-preview', kind: 'preview', label: '出纸预览', hold: PREVIEW_HOLD_MS, text: VOICE_LINES[18].text, voice: 'health-preview' },

  { id: 'multipage-mixed-orientation', kind: 'design-pages', label: '逐页设计稿', hold: 2000, text: VOICE_LINES[19].text, voice: 'multipage', sampleId: 'multipage-mixed-orientation' },
  { id: 'multipage-preview', kind: 'preview', label: '出纸预览', hold: PREVIEW_HOLD_MS, text: VOICE_LINES[20].text, voice: 'multipage-preview' },
]
