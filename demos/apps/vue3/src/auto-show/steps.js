// 文案与顺序对照 demos/live-show/intents.mjs 的 LOOP_STEPS，直播侧改动时人工同步。
export const INTRO_SLIDE_MS = 2000

export const VOICE_LINES = [
  { key: 'intro', text: '欢迎来到打印模板设计器。依次展示快递面单、价签拼版、资产标签和更多特色模版。' },
  { key: 'express', text: '已为你加载快递电子面单。画布、字段和出纸效果都来自真实模板。' },
  { key: 'preview', text: '现在打开真实出纸预览。这里只展示纸张，不会连接实体打印机。' },
  { key: 'tiling', text: '可以。价签打印会把三十二枚标签拼到一张 A4 纸上，我现在打开真实预览。' },
  { key: 'asset', text: '已为你加载资产/设备标签。画布、字段和出纸效果都来自真实模板。' },
  { key: 'weight', text: '称签打印：称重标签把品名、净重、金额和商品条码打在同一张纸上。' },
  { key: 'battery', text: '已为你加载电池模块标签。SN 序列号用 CODE128 条码承载。' },
  { key: 'barcode', text: 'barWidth 三倍模块宽、barHeight 七毫米条高，让条码更宽更高。' },
  { key: 'dpi', text: 'printerDpi 203 让尺寸吸附整数打印点，热敏出纸不再条宽忽宽忽窄，条码更清晰、扫描一次通过。' },
  { key: 'multipage', text: '多页横纵混排：封面、明细、条款自动分页，横竖版式在同一份文档里切换。' },
]

export const AUTO_SHOW_STEPS = [
  { id: 'intro', kind: 'intro', label: '开场', hold: 6000, text: VOICE_LINES[0].text, voice: 'intro', sampleIds: ['express-waybill', 'price-label', 'battery-module-label'] },
  { id: 'express-waybill', kind: 'load-sample', label: '快递电子面单', hold: 2000, text: VOICE_LINES[1].text, voice: 'express', sampleId: 'express-waybill' },
  { id: 'express-preview', kind: 'preview', label: '面单预览', hold: 2000, text: VOICE_LINES[2].text, voice: 'preview' },
  { id: 'price-tiling', kind: 'tiling', label: '价签拼版', hold: 2000, text: VOICE_LINES[3].text, voice: 'tiling', sampleId: 'price-label' },
  { id: 'asset-tag', kind: 'load-sample', label: '资产标签', hold: 2000, text: VOICE_LINES[4].text, voice: 'asset', sampleId: 'asset-tag' },
  { id: 'asset-preview', kind: 'preview', label: '资产标签预览', hold: 2000, text: VOICE_LINES[2].text, voice: 'preview' },
  { id: 'weight-label', kind: 'load-sample', label: '称签打印', hold: 2000, text: VOICE_LINES[5].text, voice: 'weight', sampleId: 'weight-label' },
  { id: 'battery-module-label', kind: 'load-sample', label: '电池模块标签', hold: 2000, text: VOICE_LINES[6].text, voice: 'battery', sampleId: 'battery-module-label' },
  { id: 'barcode-size', kind: 'caption', label: '条码尺寸属性', hold: 2000, text: VOICE_LINES[7].text, voice: 'barcode' },
  { id: 'barcode-dpi', kind: 'caption', label: '条码清晰度', hold: 2000, text: VOICE_LINES[8].text, voice: 'dpi' },
  { id: 'battery-preview', kind: 'preview', label: '电池标签预览', hold: 2000, text: VOICE_LINES[2].text, voice: 'preview' },
  { id: 'multipage-mixed-orientation', kind: 'load-sample', label: '多页横纵混排', hold: 2000, text: VOICE_LINES[9].text, voice: 'multipage', sampleId: 'multipage-mixed-orientation' },
]
