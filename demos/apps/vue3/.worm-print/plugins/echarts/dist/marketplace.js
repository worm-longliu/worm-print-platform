/*!
 * @worm-print-platform/plugin-echarts v1.6.5
 * Copyright (c) 2026 worm <liu_long_qqcom@qq.com>
 * SPDX-FileCopyrightText: 2026 worm <liu_long_qqcom@qq.com>
 * SPDX-License-Identifier: MIT
 */

// src/plugin.ts
import { t } from "@worm-print-platform/core/i18n";
import {
  defineElementPlugin,
  getElementPluginById,
  registerElementPlugin
} from "@worm-print-platform/core/designer";

// src/kinds.ts
var BASE_REQUIRED = ["left", "top", "width", "height", "chartOption"];
var DATA_FIELDS = ["dataSource", "categoryField", "valueFields", "seriesField"];
var STYLE_FIELDS = ["title", "legend", "palette"];
var CHART_KIND_DEFINITIONS = [
  {
    type: "barChart",
    label: "\u67F1\u72B6\u56FE",
    labelKey: "echarts.series.typeNames.bar",
    icon: "ChartColumn",
    seriesType: "bar",
    orientation: "vertical",
    fields: [...DATA_FIELDS, ...STYLE_FIELDS, "stack", "label"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 100,
    defaultHeight: 60,
    notes: "\u67F1\u72B6\u56FE\uFF1A\u7C7B\u76EE + \u591A\u4E2A\u6570\u503C\u5B57\u6BB5\uFF0C\u6BCF\u5B57\u6BB5\u4E00\u4E2A series\uFF1Bseries[].data \u5199 $data \u5360\u4F4D\uFF1B\u56FA\u5B9A\u9AD8\uFF0C\u7981\u6B62 autoHeight",
    notesKey: "echarts.notes.bar"
  },
  {
    type: "barHChart",
    label: "\u6761\u5F62\u56FE",
    labelKey: "echarts.series.typeNames.barH",
    icon: "ChartBar",
    seriesType: "bar",
    orientation: "horizontal",
    fields: [...DATA_FIELDS, ...STYLE_FIELDS, "stack", "label"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 100,
    defaultHeight: 60,
    notes: "\u6A2A\u5411\u6761\u5F62\u56FE\uFF1AxAxis \u4E3A\u6570\u503C\u3001yAxis \u4E3A\u7C7B\u76EE\uFF1B\u7C7B\u76EE\u5199 yAxis.data \u7684 $data \u5360\u4F4D",
    notesKey: "echarts.notes.barH"
  },
  {
    type: "lineChart",
    label: "\u6298\u7EBF\u56FE",
    labelKey: "echarts.series.typeNames.line",
    icon: "ChartLine",
    seriesType: "line",
    fields: [...DATA_FIELDS, ...STYLE_FIELDS, "stack", "label"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 100,
    defaultHeight: 60,
    notes: "\u6298\u7EBF\u56FE\uFF1A\u7C7B\u76EE + \u591A\u4E2A\u6570\u503C\u5B57\u6BB5\uFF1B\u4E0D\u5199 areaStyle",
    notesKey: "echarts.notes.line"
  },
  {
    type: "areaChart",
    label: "\u9762\u79EF\u56FE",
    labelKey: "echarts.series.typeNames.area",
    icon: "ChartArea",
    seriesType: "line",
    fields: [...DATA_FIELDS, ...STYLE_FIELDS, "stack", "label"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 100,
    defaultHeight: 60,
    notes: "\u9762\u79EF\u56FE\uFF1A\u6298\u7EBF + series[].areaStyle\uFF1B\u5176\u4F59\u540C\u6298\u7EBF\u56FE",
    notesKey: "echarts.notes.area"
  },
  {
    type: "pieChart",
    label: "\u997C\u56FE",
    labelKey: "echarts.series.typeNames.pie",
    icon: "ChartPie",
    seriesType: "pie",
    fields: ["dataSource", "categoryField", "valueFields", ...STYLE_FIELDS, "label"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 60,
    defaultHeight: 60,
    notes: "\u997C\u56FE\uFF1A\u7C7B\u76EE + \u9996\u4E2A\u6570\u503C\u5B57\u6BB5\u751F\u6210 { name, value }\uFF1B\u53EA\u9700\u4E00\u4E2A\u6570\u503C\u5B57\u6BB5",
    notesKey: "echarts.notes.pie"
  },
  {
    type: "doughnutChart",
    label: "\u73AF\u5F62\u56FE",
    labelKey: "echarts.series.typeNames.doughnut",
    icon: "Donut",
    seriesType: "pie",
    fields: ["dataSource", "categoryField", "valueFields", ...STYLE_FIELDS, "innerRadius", "label"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 60,
    defaultHeight: 60,
    notes: "\u73AF\u5F62\u56FE\uFF1A\u997C\u56FE + radius:[\u5185\u5F84,\u5916\u5F84]\uFF1B\u5185\u5F84\u7531\u9762\u677F\u914D\u7F6E",
    notesKey: "echarts.notes.doughnut"
  },
  {
    type: "scatterChart",
    label: "\u6563\u70B9\u56FE",
    labelKey: "echarts.series.typeNames.scatter",
    icon: "ChartScatter",
    seriesType: "scatter",
    fields: ["dataSource", "categoryField", "valueFields", ...STYLE_FIELDS, "bubble", "label"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 80,
    defaultHeight: 60,
    notes: "\u6563\u70B9\u56FE\uFF1A\u7C7B\u76EE\u5B57\u6BB5\u4F5C x\u3001\u9996\u4E2A\u6570\u503C\u5B57\u6BB5\u4F5C y\uFF1BchartBubble \u5F00\u542F\u65F6\u7528\u7B2C\u4E8C\u4E2A\u6570\u503C\u5B57\u6BB5\u4F5C\u70B9\u5927\u5C0F",
    notesKey: "echarts.notes.scatter"
  },
  {
    type: "radarChart",
    label: "\u96F7\u8FBE\u56FE",
    labelKey: "echarts.series.typeNames.radar",
    icon: "Radar",
    seriesType: "radar",
    fields: ["dataSource", "categoryField", "valueFields", ...STYLE_FIELDS, "radius", "label"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 70,
    defaultHeight: 60,
    notes: "\u96F7\u8FBE\u56FE\uFF1A\u6BCF\u4E2A\u6570\u503C\u5B57\u6BB5\u662F\u4E00\u4E2A\u7EF4\u5EA6\uFF08radar.indicator\uFF09\uFF0C\u6BCF\u884C\u6570\u636E\u662F\u4E00\u4E2A\u7CFB\u5217\uFF08\u7C7B\u76EE\u5B57\u6BB5\u4F5C\u7CFB\u5217\u540D\uFF09\uFF1B\u534A\u5F84\u7531\u9762\u677F\u5199 radar.radius\uFF08%\uFF0C\u9ED8\u8BA4 75\uFF09",
    notesKey: "echarts.notes.radar"
  },
  {
    type: "funnelChart",
    label: "\u6F0F\u6597\u56FE",
    labelKey: "echarts.series.typeNames.funnel",
    icon: "Funnel",
    seriesType: "funnel",
    fields: ["dataSource", "categoryField", "valueFields", ...STYLE_FIELDS, "padding", "label"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 60,
    defaultHeight: 60,
    notes: "\u6F0F\u6597\u56FE\uFF1A\u7C7B\u76EE + \u9996\u4E2A\u6570\u503C\u5B57\u6BB5\uFF0C\u6309\u6570\u503C\u964D\u5E8F\uFF1B\u56DB\u8FB9\u5185\u8FB9\u8DDD\u7531\u9762\u677F\u5199 series.left/right/top/bottom\uFF08%\uFF0C\u53F3\u4FA7\u9700\u7559\u5916\u7F6E\u6807\u7B7E\u7A7A\u95F4\uFF09",
    notesKey: "echarts.notes.funnel"
  },
  {
    type: "gaugeChart",
    label: "\u4EEA\u8868\u76D8",
    labelKey: "echarts.series.typeNames.gauge",
    icon: "Gauge",
    seriesType: "gauge",
    fields: ["dataSource", "valueFields", ...STYLE_FIELDS, "gaugeRange", "label"],
    requiredOptionKeys: BASE_REQUIRED,
    defaultWidth: 60,
    defaultHeight: 60,
    notes: "\u4EEA\u8868\u76D8\uFF1A\u53D6\u9996\u884C\u6570\u636E\u7684\u9996\u4E2A\u6570\u503C\u5B57\u6BB5\u4F5C\u6307\u9488\u503C\uFF1Bmin/max \u7531\u9762\u677F\u5199\u5165 series[0].min/max",
    notesKey: "echarts.notes.gauge"
  }
];
var CHART_KINDS = CHART_KIND_DEFINITIONS.map((def) => def.type);
function getChartKindDefinition(type) {
  return CHART_KIND_DEFINITIONS.find((def) => def.type === type);
}
function resolveChartPanelFields(type) {
  return getChartKindDefinition(type)?.fields ?? [];
}

// src/bind.ts
import { evaluateTemplate } from "@worm-print-platform/core";
function chartNumber(value) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}
function evaluateChartOption(node, data, keepStrings = false) {
  if (typeof node === "string") {
    if (node.startsWith("$data")) return node;
    if (keepStrings) return node;
    return node.includes("{") ? evaluateTemplate(node, data) : node;
  }
  if (Array.isArray(node)) return node.map((item) => evaluateChartOption(item, data, keepStrings));
  if (node && typeof node === "object") {
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      const childKeep = keepStrings || key === "label" || key === "detail";
      out[key] = evaluateChartOption(value, data, childKeep);
    }
    return out;
  }
  return node;
}
function hasDataPlaceholder(series) {
  return Array.isArray(series.data) && series.data.includes("$data");
}
function resolveListSource(options, data) {
  const chartSource = typeof options.chartDataSource === "string" ? options.chartDataSource : "";
  const legacySource = typeof options.dataSource === "string" ? options.dataSource : "";
  const explicit = chartSource || legacySource;
  if (explicit) return Array.isArray(data[explicit]) ? data[explicit] : [];
  for (const value of Object.values(data)) {
    if (Array.isArray(value)) return value;
  }
  return [];
}
function asString(value) {
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function asFieldList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.length > 0) : [];
}
function seriesOf(option) {
  return Array.isArray(option.series) ? option.series : [];
}
function rowValue(row, field2) {
  return field2 ? chartNumber(row[field2]) : 0;
}
function writeCategories(option, categories) {
  for (const key of ["xAxis", "yAxis"]) {
    const raw = option[key];
    const axes = Array.isArray(raw) ? raw : raw ? [raw] : [];
    for (const axis of axes) {
      if (axis && typeof axis === "object" && Array.isArray(axis.data) && axis.data.includes("$data")) {
        axis.data = [...categories];
      }
    }
  }
}
function applyCartesian(option, rows, categoryField, valueFields, seriesField) {
  const rawSeries = seriesOf(option);
  if (!rawSeries.some(hasDataPlaceholder)) return;
  const categories = rows.map((row, index) => categoryField ? row[categoryField] : index + 1);
  const fieldAt = (index) => valueFields[Math.min(index, valueFields.length - 1)];
  if (seriesField) {
    const template2 = rawSeries[0];
    const groups = /* @__PURE__ */ new Map();
    for (const row of rows) {
      const name = String(row[seriesField] ?? "");
      const bucket = groups.get(name) ?? /* @__PURE__ */ new Map();
      const category = String(row[categoryField ?? ""]);
      bucket.set(category, (bucket.get(category) ?? 0) + rowValue(row, fieldAt(0)));
      groups.set(name, bucket);
    }
    const distinctCategories = [...new Set(categories)];
    option.series = [...groups.entries()].map(([name, bucket]) => ({
      ...template2,
      name,
      data: distinctCategories.map((category) => bucket.get(String(category)) ?? null)
    }));
    writeCategories(option, distinctCategories);
    return;
  }
  const template = rawSeries[rawSeries.length - 1];
  while (rawSeries.length < valueFields.length) rawSeries.push({ ...template, data: ["$data"] });
  option.series = rawSeries.map((series, index) => {
    if (!hasDataPlaceholder(series)) return series;
    return { ...series, data: rows.map((row) => rowValue(row, fieldAt(index))) };
  });
  writeCategories(option, categories);
}
function applyPieLike(option, rows, categoryField, valueField, sortDescending) {
  const series = seriesOf(option);
  if (!series.some(hasDataPlaceholder)) return;
  const data = rows.map((row) => ({
    name: categoryField ? String(row[categoryField] ?? "") : "",
    value: rowValue(row, valueField)
  }));
  if (sortDescending) data.sort((a, b) => b.value - a.value);
  option.series = series.map((item) => ({ ...item, data }));
}
function applyScatter(option, rows, xField, valueFields, bubble) {
  const series = seriesOf(option);
  if (!series.some(hasDataPlaceholder)) return;
  const yField = valueFields[0];
  const sizeField = bubble ? valueFields[1] : void 0;
  const sizes = sizeField ? rows.map((row) => rowValue(row, sizeField)) : [];
  const min = sizes.length > 0 ? Math.min(...sizes) : 0;
  const max = sizes.length > 0 ? Math.max(...sizes) : 0;
  const sizeOf = (value) => max === min ? 12 : Math.round(6 + (value - min) / (max - min) * 18);
  option.series = series.map((item) => ({
    ...item,
    data: rows.map((row) => {
      const value = [rowValue(row, xField), rowValue(row, yField)];
      if (!sizeField) return value;
      return { value, symbolSize: sizeOf(rowValue(row, sizeField)) };
    })
  }));
}
function niceMax(value) {
  if (value <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = magnitude >= 10 ? magnitude : 10;
  return Math.ceil(value / step) * step;
}
function applyRadar(option, rows, categoryField, valueFields) {
  const series = seriesOf(option);
  if (!series.some(hasDataPlaceholder)) return;
  const columnMax = valueFields.map((field2) => Math.max(0, ...rows.map((row) => rowValue(row, field2))));
  option.radar = {
    ...option.radar ?? {},
    // 维度 = 数值字段；max 取该列最大值上浮取整
    indicator: valueFields.map((field2, index) => ({ name: field2, max: niceMax(columnMax[index]) }))
  };
  option.series = series.map((item) => ({
    ...item,
    data: rows.map((row) => ({
      name: categoryField ? String(row[categoryField] ?? "") : "",
      value: valueFields.map((field2) => rowValue(row, field2))
    }))
  }));
}
function applyGauge(option, rows, valueField) {
  const series = seriesOf(option);
  if (!series.some(hasDataPlaceholder)) return;
  const first = rows[0] ?? {};
  option.series = series.map((item) => ({ ...item, data: [{ value: rowValue(first, valueField), name: valueField }] }));
}
function bindChartData(type, options, data) {
  const raw = options.chartOption;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const option = evaluateChartOption(raw, data);
  const valueFields = asFieldList(options.chartValueFields);
  if (valueFields.length === 0) return { _chartOption: option };
  const list = resolveListSource(options, data);
  if (list.length === 0) return { _chartOption: option };
  const categoryField = asString(options.chartCategoryField);
  const def = getChartKindDefinition(type);
  switch (def?.seriesType) {
    case "radar":
      applyRadar(option, list, categoryField, valueFields);
      break;
    case "gauge":
      applyGauge(option, list, valueFields[0]);
      break;
    case "funnel":
      applyPieLike(option, list, categoryField, valueFields[0], true);
      break;
    case "pie":
      applyPieLike(option, list, categoryField, valueFields[0], false);
      break;
    case "scatter":
      applyScatter(option, list, categoryField, valueFields, options.chartBubble === true);
      break;
    default:
      applyCartesian(option, list, categoryField, valueFields, asString(options.chartSeriesField));
      break;
  }
  return { _chartOption: option };
}

// src/config.ts
import { configurePlugin, getPluginConfig } from "@worm-print-platform/core/designer";

// src/constants.ts
var CHART_PLUGIN_ID = "@worm-print-platform/echarts";
var CHART_PALETTES = [
  { key: "default", label: "\u9ED8\u8BA4\u84DD", labelKey: "echarts.palette.default", colors: ["#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de"] },
  { key: "fresh", label: "\u6E05\u65B0\u7EFF", labelKey: "echarts.palette.fresh", colors: ["#2f9e6e", "#5cc9a7", "#9ad6c1", "#f2c94c", "#4a90e2"] },
  { key: "warm", label: "\u6696\u6A59\u7EA2", labelKey: "echarts.palette.warm", colors: ["#f2704e", "#f7a35c", "#f7d56d", "#c54e3f", "#8f5a4a"] },
  { key: "purple", label: "\u7D2B\u7070", labelKey: "echarts.palette.purple", colors: ["#7b61ff", "#9b8cff", "#c3baff", "#596275", "#8d99ae"] }
];
var FALLBACK_SAMPLE_CATEGORIES = ["\u793A\u4F8B\u4E00", "\u793A\u4F8B\u4E8C", "\u793A\u4F8B\u4E09"];
var FUNNEL_PADDING_DEFAULTS = { top: 6, right: 25, bottom: 6, left: 5 };
var RADAR_RADIUS_DEFAULT = 75;
var ECHARTS_RADAR_RADIUS_DEFAULT = 50;
var ECHARTS_FUNNEL_PADDING_PX = { top: 60, right: 80, bottom: 65, left: 80 };

// src/defaults.ts
var GRID = { left: "8%", right: "8%", bottom: "12%", top: "18%", containLabel: true };
function percentInsets(padding) {
  return {
    top: `${padding.top}%`,
    right: `${padding.right}%`,
    bottom: `${padding.bottom}%`,
    left: `${padding.left}%`
  };
}
function createDefaultChartOption(type) {
  const def = getChartKindDefinition(type);
  const title = { text: "" };
  switch (def?.seriesType) {
    case "pie":
      return {
        title,
        tooltip: { trigger: "item" },
        series: [{
          type: "pie",
          name: "\u6570\u91CF",
          data: ["$data"],
          radius: type === "doughnutChart" ? ["40%", "70%"] : "62%"
        }]
      };
    case "scatter":
      return {
        title,
        grid: GRID,
        tooltip: { trigger: "axis" },
        xAxis: { type: "value" },
        yAxis: { type: "value" },
        series: [{ type: "scatter", name: "\u6570\u91CF", data: ["$data"], symbolSize: 8 }]
      };
    case "radar":
      return {
        title,
        tooltip: { trigger: "item" },
        // indicator 由绑定阶段按 chartValueFields 生成；设计态预览见 previewChartOption
        radar: { indicator: [], radius: `${RADAR_RADIUS_DEFAULT}%` },
        series: [{ type: "radar", name: "\u6570\u91CF", data: ["$data"] }]
      };
    case "funnel":
      return {
        title,
        tooltip: { trigger: "item" },
        legend: { show: false },
        // 不写内边距会吃 ECharts 的 px 默认（左右 80/上下 60~65），小框里图形只占一半不到
        series: [{ type: "funnel", name: "\u6570\u91CF", data: ["$data"], sort: "descending", ...percentInsets(FUNNEL_PADDING_DEFAULTS) }]
      };
    case "gauge":
      return {
        title,
        tooltip: { trigger: "item" },
        series: [{ type: "gauge", name: "\u6570\u91CF", min: 0, max: 100, data: [{ value: 0, name: "\u6570\u91CF" }] }]
      };
    default: {
      const horizontal = def?.orientation === "horizontal";
      const isArea = def?.seriesType === "line" && type === "areaChart";
      const seriesType = def?.seriesType === "line" ? "line" : "bar";
      return {
        title,
        grid: GRID,
        tooltip: { trigger: "axis" },
        xAxis: horizontal ? { type: "value" } : { type: "category", data: ["$data"] },
        yAxis: horizontal ? { type: "category", data: ["$data"] } : { type: "value" },
        series: [{ type: seriesType, name: "\u6570\u91CF", data: ["$data"], ...isArea ? { areaStyle: {} } : {} }]
      };
    }
  }
}

// src/config.ts
function getChartPluginConfig() {
  return getPluginConfig(CHART_PLUGIN_ID);
}
function getChartPalettes() {
  const overrides = getChartPluginConfig().palettes ?? {};
  const builtin = CHART_PALETTES.map((palette) => {
    const custom = overrides[palette.key];
    return custom ? { key: palette.key, label: custom.label ?? palette.label, labelKey: custom.label ? void 0 : palette.labelKey, colors: custom.colors } : { key: palette.key, label: palette.label, labelKey: palette.labelKey, colors: palette.colors };
  });
  const extra = Object.entries(overrides).filter(([key]) => !CHART_PALETTES.some((palette) => palette.key === key)).map(([key, value]) => ({ key, label: value.label ?? key, colors: value.colors }));
  return [...builtin, ...extra];
}
function getSampleCategories() {
  const custom = getChartPluginConfig().sampleCategories;
  return Array.isArray(custom) && custom.length > 0 ? custom : FALLBACK_SAMPLE_CATEGORIES;
}
function chartFactoryDefaults(type, partial) {
  const config = getChartPluginConfig();
  const def = getChartKindDefinition(type);
  return {
    width: typeof config.defaultWidth === "number" ? config.defaultWidth : def?.defaultWidth ?? 100,
    height: typeof config.defaultHeight === "number" ? config.defaultHeight : def?.defaultHeight ?? 60,
    title: def?.label ?? "\u56FE\u8868",
    chartOption: createDefaultChartOption(type),
    chartDataSource: "",
    chartCategoryField: "",
    chartValueFields: [],
    chartSeriesField: "",
    ...partial
  };
}

// src/echarts.ts
import { BarChart, LineChart, PieChart, ScatterChart, RadarChart, FunnelChart, GaugeChart } from "echarts/charts";
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent
} from "echarts/components";
import * as echarts from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  RadarChart,
  FunnelChart,
  GaugeChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DatasetComponent,
  SVGRenderer
]);
var appliedComponents = /* @__PURE__ */ new Set();
function applyExtraComponents() {
  const extra = getChartPluginConfig().components ?? [];
  const fresh = extra.filter((item) => item != null && !appliedComponents.has(item));
  if (fresh.length === 0) return;
  echarts.use(fresh);
  for (const item of fresh) appliedComponents.add(item);
}

// src/units.ts
var PX_PER_MM = 96 / 25.4;
function mmToChartPx(mm) {
  const value = Number.isFinite(mm) ? mm : 0;
  return Math.max(1, Math.round(value * PX_PER_MM));
}

// src/option-utils.ts
var SAMPLE_VALUES = [12, 20, 15];
function cloneChartOption(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}
function previewChartOption(type, option) {
  if (!option || typeof option !== "object" || Array.isArray(option)) return {};
  const next = cloneChartOption(option);
  const def = getChartKindDefinition(type);
  const categories = [...getSampleCategories()];
  const values = [...SAMPLE_VALUES];
  const series = Array.isArray(next.series) ? next.series : [];
  const replaceSeriesData = (mapper) => {
    for (const item of series) {
      if (Array.isArray(item.data) && item.data.includes("$data")) item.data = mapper(item);
    }
  };
  const replaceAxisData = () => {
    for (const key of ["xAxis", "yAxis"]) {
      const axes = Array.isArray(next[key]) ? next[key] : next[key] ? [next[key]] : [];
      for (const axis of axes) {
        if (axis && Array.isArray(axis.data) && axis.data.includes("$data")) axis.data = [...categories];
      }
    }
  };
  switch (def?.seriesType) {
    case "pie":
      replaceSeriesData(() => categories.map((name, index) => ({ name, value: values[index] ?? 10 })));
      break;
    case "funnel":
      replaceSeriesData(() => categories.map((name, index) => ({ name, value: values[index] ?? 10 })));
      break;
    case "scatter":
      replaceSeriesData(() => values.map((value) => [value, value + 6]));
      break;
    case "radar":
      next.radar = {
        ...next.radar ?? {},
        indicator: categories.map((name) => ({ name, max: 30 }))
      };
      replaceSeriesData(() => [{ name: "\u793A\u4F8B", value: values }]);
      break;
    case "gauge":
      replaceSeriesData(() => [{ value: values[0] ?? 40, name: "\u6570\u91CF" }]);
      break;
    default:
      replaceSeriesData(() => [...values]);
      replaceAxisData();
      break;
  }
  return next;
}
function readPaletteKey(option, palettes) {
  const color = Array.isArray(option?.color) ? (option?.color).map(String) : [];
  const hit = palettes.find((palette) => palette.colors.every((c, i) => c === color[i]) && color.length === palette.colors.length);
  return hit?.key ?? "default";
}
function asObject(node) {
  if (Array.isArray(node)) return node[0] && typeof node[0] === "object" ? { ...node[0] } : {};
  return node && typeof node === "object" ? { ...node } : {};
}
function syncSeriesCount(option, count, type) {
  const next = cloneChartOption(option);
  const rawSeries = Array.isArray(next.series) ? next.series : [];
  const def = getChartKindDefinition(type);
  const template = rawSeries[0] ?? { type: def?.seriesType === "line" ? "line" : "bar", data: ["$data"] };
  next.series = Array.from({ length: Math.max(count, 1) }, (_, index) => ({
    ...template,
    ...rawSeries[index] ?? {},
    data: ["$data"]
  }));
  return next;
}
var round1 = (value) => Math.round(value * 10) / 10;
function pxToPercent(px, totalPx) {
  return totalPx > 0 ? round1(px / totalPx * 100) : 0;
}
function readInsetPercent(value, totalPx, echartsPx) {
  if (typeof value === "string" && value.trim().endsWith("%")) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return round1(parsed);
  }
  if (typeof value === "number" && Number.isFinite(value)) return pxToPercent(value, totalPx);
  return pxToPercent(echartsPx, totalPx);
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function percentString(value) {
  return `${clamp(round1(value), 0, 100)}%`;
}
function firstSeries(option) {
  const series = Array.isArray(option.series) ? option.series : [];
  const first = series[0];
  return first && typeof first === "object" ? first : {};
}
function readFunnelPadding(option, widthMm, heightMm) {
  const source = option && typeof option === "object" ? option : {};
  const series = firstSeries(source);
  const widthPx = mmToChartPx(widthMm);
  const heightPx = mmToChartPx(heightMm);
  return {
    top: readInsetPercent(series.top, heightPx, ECHARTS_FUNNEL_PADDING_PX.top),
    right: readInsetPercent(series.right, widthPx, ECHARTS_FUNNEL_PADDING_PX.right),
    bottom: readInsetPercent(series.bottom, heightPx, ECHARTS_FUNNEL_PADDING_PX.bottom),
    left: readInsetPercent(series.left, widthPx, ECHARTS_FUNNEL_PADDING_PX.left)
  };
}
function writeFunnelPadding(option, padding) {
  const next = cloneChartOption(option);
  const series = Array.isArray(next.series) ? next.series : [];
  if (series.length === 0) series.push({ type: "funnel", data: ["$data"] });
  const first = series[0];
  first.top = percentString(padding.top);
  first.right = percentString(padding.right);
  first.bottom = percentString(padding.bottom);
  first.left = percentString(padding.left);
  next.series = series;
  return next;
}
function readRadarRadius(option, widthMm, heightMm) {
  const source = option && typeof option === "object" ? option : {};
  const raw = asObject(source.radar).radius;
  const value = Array.isArray(raw) ? raw[raw.length - 1] : raw;
  const widthPx = mmToChartPx(widthMm);
  const heightPx = mmToChartPx(heightMm);
  const viewSize = Math.min(widthPx, heightPx) / 2;
  if (typeof value === "string" && value.trim().endsWith("%")) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return round1(parsed);
  }
  if (typeof value === "number" && Number.isFinite(value)) return pxToPercent(value, viewSize);
  return ECHARTS_RADAR_RADIUS_DEFAULT;
}
function writeRadarRadius(option, percent) {
  const next = cloneChartOption(option);
  next.radar = { ...asObject(next.radar), radius: percentString(clamp(percent, 20, 100)) };
  return next;
}

// src/label.ts
var LABEL_PRESETS = [
  { key: "value", label: "\u6570\u503C", labelKey: "echarts.label.formatter.value", formatter: "{c}" },
  { key: "name-value", label: "\u540D\u79F0: \u6570\u503C", labelKey: "echarts.label.formatter.nameValue", formatter: "{b}: {c}" },
  { key: "name", label: "\u540D\u79F0", labelKey: "echarts.label.formatter.name", formatter: "{b}" },
  { key: "percent", label: "\u767E\u5206\u6BD4", labelKey: "echarts.label.formatter.percent", formatter: "{d}%" }
];
var LABEL_POSITIONS = {
  bar: [
    { value: "top", label: "\u9876\u90E8", labelKey: "echarts.label.position.bar.top" },
    { value: "inside", label: "\u5185\u90E8", labelKey: "echarts.label.position.bar.inside" },
    { value: "insideTop", label: "\u5185\u90E8\u9876\u7AEF", labelKey: "echarts.label.position.bar.insideTop" },
    { value: "bottom", label: "\u5E95\u90E8", labelKey: "echarts.label.position.bar.bottom" },
    { value: "insideBottom", label: "\u5185\u90E8\u5E95\u7AEF", labelKey: "echarts.label.position.bar.insideBottom" },
    { value: "right", label: "\u53F3\u4FA7", labelKey: "echarts.label.position.bar.right" },
    { value: "left", label: "\u5DE6\u4FA7", labelKey: "echarts.label.position.bar.left" },
    { value: "middle", label: "\u5C45\u4E2D", labelKey: "echarts.label.position.bar.middle" }
  ],
  line: [
    { value: "top", label: "\u9876\u90E8", labelKey: "echarts.label.position.line.top" },
    { value: "bottom", label: "\u5E95\u90E8", labelKey: "echarts.label.position.line.bottom" },
    { value: "inside", label: "\u5185\u90E8", labelKey: "echarts.label.position.line.inside" },
    { value: "left", label: "\u5DE6\u4FA7", labelKey: "echarts.label.position.line.left" },
    { value: "right", label: "\u53F3\u4FA7", labelKey: "echarts.label.position.line.right" }
  ],
  pie: [
    { value: "outside", label: "\u5916\u4FA7", labelKey: "echarts.label.position.pie.outside" },
    { value: "inside", label: "\u5185\u90E8", labelKey: "echarts.label.position.pie.inside" },
    { value: "center", label: "\u4E2D\u5FC3", labelKey: "echarts.label.position.pie.center" }
  ],
  scatter: [
    { value: "top", label: "\u9876\u90E8", labelKey: "echarts.label.position.scatter.top" },
    { value: "bottom", label: "\u5E95\u90E8", labelKey: "echarts.label.position.scatter.bottom" },
    { value: "left", label: "\u5DE6\u4FA7", labelKey: "echarts.label.position.scatter.left" },
    { value: "right", label: "\u53F3\u4FA7", labelKey: "echarts.label.position.scatter.right" },
    { value: "inside", label: "\u5185\u90E8", labelKey: "echarts.label.position.scatter.inside" }
  ],
  radar: [
    { value: "top", label: "\u9876\u90E8", labelKey: "echarts.label.position.radar.top" },
    { value: "bottom", label: "\u5E95\u90E8", labelKey: "echarts.label.position.radar.bottom" },
    { value: "left", label: "\u5DE6\u4FA7", labelKey: "echarts.label.position.radar.left" },
    { value: "right", label: "\u53F3\u4FA7", labelKey: "echarts.label.position.radar.right" },
    { value: "inside", label: "\u5185\u90E8", labelKey: "echarts.label.position.radar.inside" }
  ],
  funnel: [
    { value: "outer", label: "\u5916\u4FA7", labelKey: "echarts.label.position.funnel.outer" },
    { value: "inner", label: "\u5185\u90E8", labelKey: "echarts.label.position.funnel.inner" },
    { value: "left", label: "\u5DE6\u4FA7", labelKey: "echarts.label.position.funnel.left" },
    { value: "right", label: "\u53F3\u4FA7", labelKey: "echarts.label.position.funnel.right" },
    { value: "top", label: "\u9876\u90E8", labelKey: "echarts.label.position.funnel.top" },
    { value: "bottom", label: "\u5E95\u90E8", labelKey: "echarts.label.position.funnel.bottom" }
  ],
  gauge: []
};
var NATIVE_SHOW = {
  bar: false,
  line: false,
  pie: true,
  scatter: false,
  radar: false,
  funnel: true,
  gauge: true
};
var ENABLE_DEFAULTS = {
  bar: { position: "top", fontSize: 12 },
  line: { position: "top", fontSize: 12 },
  pie: { position: "outside", overflow: "none", fontSize: 11 },
  scatter: { position: "top", fontSize: 11 },
  radar: { position: "top", fontSize: 10 },
  funnel: { position: "outer", fontSize: 11 },
  gauge: { fontSize: 14 }
};
var TYPE_DEFAULTS = {
  barHChart: { position: "right", fontSize: 12 }
};
var FIELDS_BY_SERIES = {
  bar: [
    "formatter",
    "overflow",
    "position",
    "rotate",
    "offset",
    "fontSize",
    "fontWeight",
    "color",
    "backgroundColor",
    "borderColor",
    "borderWidth",
    "borderRadius",
    "padding"
  ],
  line: [
    "formatter",
    "overflow",
    "position",
    "rotate",
    "offset",
    "fontSize",
    "fontWeight",
    "color",
    "backgroundColor",
    "borderColor",
    "borderWidth",
    "borderRadius",
    "padding"
  ],
  pie: [
    "formatter",
    "overflow",
    "position",
    "distance",
    "offset",
    "fontSize",
    "fontWeight",
    "color",
    "backgroundColor",
    "borderColor",
    "borderWidth",
    "borderRadius",
    "padding",
    "labelLine.show",
    "labelLine.length",
    "labelLine.length2",
    "labelLine.smooth"
  ],
  scatter: [
    "formatter",
    "overflow",
    "position",
    "distance",
    "rotate",
    "offset",
    "fontSize",
    "fontWeight",
    "color",
    "backgroundColor",
    "borderColor",
    "borderWidth",
    "borderRadius",
    "padding"
  ],
  radar: ["formatter", "fontSize", "fontWeight", "color"],
  funnel: [
    "formatter",
    "overflow",
    "position",
    "distance",
    "fontSize",
    "fontWeight",
    "color",
    "labelLine.show",
    "labelLine.length",
    "labelLine.smooth"
  ],
  gauge: ["formatter", "fontSize", "fontWeight", "color", "offset"]
};
var VALUE_KEYS = [
  "formatter",
  "overflow",
  "position",
  "distance",
  "rotate",
  "offset",
  "fontSize",
  "fontWeight",
  "color",
  "backgroundColor",
  "borderColor",
  "borderWidth",
  "borderRadius",
  "padding"
];
function seriesOf2(option) {
  const series = option?.series;
  return Array.isArray(series) ? series : [];
}
function asRecord(node) {
  return node && typeof node === "object" && !Array.isArray(node) ? { ...node } : {};
}
function normalizeLabelOffsetInPlace(target) {
  if (typeof target.offsetX !== "number" && typeof target.offsetY !== "number") return;
  if (!Array.isArray(target.offset)) {
    target.offset = [
      typeof target.offsetX === "number" ? target.offsetX : 0,
      typeof target.offsetY === "number" ? target.offsetY : 0
    ];
  }
  delete target.offsetX;
  delete target.offsetY;
}
function labelTargetOf(type) {
  return getChartKindDefinition(type)?.seriesType === "gauge" ? "detail" : "label";
}
function labelFieldsOf(type) {
  const def = getChartKindDefinition(type);
  return def ? FIELDS_BY_SERIES[def.seriesType] : [];
}
function readChartLabel(option, type) {
  const def = getChartKindDefinition(type);
  const series = seriesOf2(option);
  const target = asRecord(series[0]?.[labelTargetOf(type)]);
  normalizeLabelOffsetInPlace(target);
  const state = {
    show: typeof target.show === "boolean" ? target.show : def ? NATIVE_SHOW[def.seriesType] : false,
    // labelLine 在 ECharts 里是 series 顶层键（与 label 平级），不是 label 的子键
    labelLine: asRecord(series[0]?.labelLine)
  };
  for (const key of VALUE_KEYS) {
    const value = target[key];
    if (key === "offset") continue;
    if (typeof value === "string" || typeof value === "number") state[key] = value;
  }
  const offset = target.offset;
  if (Array.isArray(offset) && typeof offset[0] === "number" && typeof offset[1] === "number") {
    state.offset = [offset[0], offset[1]];
  }
  return state;
}
function defaultSetOf(type) {
  const def = getChartKindDefinition(type);
  if (!def) return {};
  return { ...ENABLE_DEFAULTS[def.seriesType], ...TYPE_DEFAULTS[type] };
}
function isEmpty(value) {
  return value === null || value === void 0 || value === "";
}
function updateChartLabel(option, type, patch) {
  const next = cloneChartOption(option ?? {});
  const series = Array.isArray(next.series) ? next.series : [];
  const def = getChartKindDefinition(type);
  if (!def || series.length === 0) return next;
  const targetKey = labelTargetOf(type);
  const { enabled, labelLine, ...values } = patch;
  for (const item of series) {
    if (!item || typeof item !== "object") continue;
    const current = asRecord(item[targetKey]);
    normalizeLabelOffsetInPlace(current);
    if (enabled === true) {
      Object.assign(current, { ...defaultSetOf(type), ...current, show: true });
    } else if (enabled === false) {
      current.show = false;
    }
    for (const [key, value] of Object.entries(values)) {
      if (isEmpty(value)) delete current[key];
      else current[key] = value;
    }
    if (labelLine) {
      const line = asRecord(item.labelLine);
      for (const [key, value] of Object.entries(labelLine)) {
        if (isEmpty(value)) delete line[key];
        else line[key] = value;
      }
      item.labelLine = line;
    }
    item[targetKey] = current;
  }
  return next;
}

// src/normalize.ts
function asArray(value) {
  if (Array.isArray(value)) return value.map((item) => ({ ...item }));
  return [];
}
function normalizeCategoryAxis(axis, horizontal) {
  const next = { ...axis, type: horizontal ? "value" : "category" };
  if (horizontal) delete next.data;
  else if (!Array.isArray(next.data)) next.data = ["$data"];
  return next;
}
function normalizeValueAxis(axis, horizontal) {
  const next = { ...axis, type: horizontal ? "category" : "value" };
  if (horizontal && !Array.isArray(next.data)) next.data = ["$data"];
  if (!horizontal) delete next.data;
  return next;
}
function mapAxes(value, fn) {
  if (Array.isArray(value)) return value.map((item) => fn({ ...item }));
  if (value && typeof value === "object") return fn({ ...value });
  return fn({});
}
function normalizeChartOption(type, option) {
  const def = getChartKindDefinition(type);
  if (!def) return option;
  const next = structuredClone(option);
  const series = asArray(next.series);
  if (series.length === 0) return next;
  const labelKey = labelTargetOf(type);
  for (const item of series) {
    const label = item[labelKey];
    if (label && typeof label === "object" && !Array.isArray(label)) {
      const nextLabel = { ...label };
      normalizeLabelOffsetInPlace(nextLabel);
      item[labelKey] = nextLabel;
    }
  }
  if (def.seriesType === "pie") {
    next.series = series.map((item) => ({
      ...item,
      type: "pie",
      ...type === "doughnutChart" ? { radius: item.radius ?? ["40%", "70%"] } : {}
    }));
    delete next.xAxis;
    delete next.yAxis;
    return next;
  }
  if (def.seriesType === "scatter") {
    next.series = series.map((item) => ({ ...item, type: "scatter" }));
    next.xAxis = mapAxes(next.xAxis, (axis) => ({ ...axis, type: "value", data: void 0 }));
    next.yAxis = mapAxes(next.yAxis, (axis) => ({ ...axis, type: "value", data: void 0 }));
    return next;
  }
  if (def.seriesType === "radar") {
    next.series = series.map((item) => ({ ...item, type: "radar" }));
    return next;
  }
  if (def.seriesType === "funnel") {
    next.series = series.map((item) => ({ ...item, type: "funnel", sort: "descending" }));
    return next;
  }
  if (def.seriesType === "gauge") {
    next.series = series.map((item) => ({ ...item, type: "gauge" }));
    return next;
  }
  const horizontal = def.orientation === "horizontal";
  const seriesType = def.seriesType === "line" ? "line" : "bar";
  next.xAxis = mapAxes(next.xAxis, (axis) => normalizeCategoryAxis(axis, horizontal));
  next.yAxis = mapAxes(next.yAxis, (axis) => normalizeValueAxis(axis, horizontal));
  next.series = series.map((item) => {
    const shape = { ...item, type: seriesType };
    if (type === "areaChart") shape.areaStyle = item.areaStyle ?? {};
    else delete shape.areaStyle;
    return shape;
  });
  return next;
}

// src/renderer.ts
function fitSvgRoot(svg, widthPx, heightPx) {
  const match = /<svg\b[^>]*>/i.exec(svg);
  if (!match) return svg;
  const rootTag = match[0];
  const rawAttrs = rootTag.slice("<svg".length, -1);
  const styleMatch = /\sstyle\s*=\s*"([^"]*)"/i.exec(rawAttrs);
  const keptStyle = (styleMatch?.[1] ?? "").split(";").map((decl) => decl.trim()).filter((decl) => decl && !/^(width|height|display)\s*:/i.test(decl)).join(";");
  const attrs = rawAttrs.replace(/\s(width|height|style|viewBox)\s*=\s*"[^"]*"/gi, "").trimEnd();
  const style = ["display:block", "width:100%", "height:100%", keptStyle].filter(Boolean).join(";");
  const nextTag = `<svg${attrs} width="100%" height="100%" viewBox="0 0 ${widthPx} ${heightPx}" style="${style}">`;
  return svg.slice(0, match.index) + nextTag + svg.slice(match.index + rootTag.length);
}
function renderChartToSvg(spec) {
  applyExtraComponents();
  const option = normalizeChartOption(spec.type, spec.option);
  if (!option || typeof option !== "object" || Array.isArray(option)) {
    throw new Error("\u56FE\u8868 option \u975E\u6CD5\uFF1A\u9700\u8981\u5BF9\u8C61");
  }
  const width = mmToChartPx(spec.widthMm);
  const height = mmToChartPx(spec.heightMm);
  const chart = echarts.init(null, null, { renderer: "svg", ssr: true, width, height });
  try {
    const userTextStyle = option.textStyle && typeof option.textStyle === "object" && !Array.isArray(option.textStyle) ? option.textStyle : void 0;
    const textStyle = {
      ...spec.fontFamily ? { fontFamily: spec.fontFamily } : {},
      ...userTextStyle ?? {}
    };
    chart.setOption({
      animation: false,
      ...option,
      ...Object.keys(textStyle).length > 0 ? { textStyle } : {}
    });
    return fitSvgRoot(chart.renderToSVGString(), width, height);
  } finally {
    chart.dispose();
  }
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function renderChartElement(spec) {
  const option = spec._chartOption ?? spec.chartOption;
  const placeholder = `<span>${escapeHtml(String(spec.title ?? "\u56FE\u8868"))}</span>`;
  if (!option || typeof option !== "object" || Array.isArray(option)) return placeholder;
  try {
    return renderChartToSvg({
      key: String(spec.key ?? ""),
      type: String(spec.type ?? ""),
      option,
      widthMm: Number(spec.widthMm ?? 0),
      heightMm: Number(spec.heightMm ?? 0),
      fontFamily: typeof spec.fontFamily === "string" ? spec.fontFamily : void 0
    });
  } catch {
    return placeholder;
  }
}

// src/version.ts
var CHART_EXECUTOR_VERSION = "2";

// src/plugin.ts
function createChartOptionMeta(includeBubble = false) {
  return {
    chartOption: { kind: "object", get label() {
      return t("echarts.meta.chartOption");
    } },
    chartDataSource: { kind: "text", get label() {
      return t("echarts.meta.dataSource");
    } },
    chartCategoryField: { kind: "text", get label() {
      return t("echarts.meta.categoryField");
    } },
    chartValueFields: { kind: "object", get label() {
      return t("echarts.meta.valueFields");
    } },
    chartSeriesField: { kind: "text", get label() {
      return t("echarts.meta.seriesField");
    } },
    ...includeBubble ? { chartBubble: { kind: "bool", get label() {
      return t("echarts.meta.bubbleSize");
    } } } : {}
  };
}
var CHART_OPTION_META = createChartOptionMeta();
var SCATTER_OPTION_META = createChartOptionMeta(true);
var CHART_PLUGIN = defineElementPlugin({
  id: CHART_PLUGIN_ID,
  version: CHART_EXECUTOR_VERSION,
  kinds: CHART_KIND_DEFINITIONS.map((def) => ({
    type: def.type,
    // getter：每次读取按当前实例语言取词，避免模块加载期冻结为单一语言
    get label() {
      return t(def.labelKey);
    },
    icon: def.icon,
    fixedHeight: true,
    requiredOptionKeys: def.requiredOptionKeys,
    // getter：每次读取按当前实例语言取词，避免模块加载期冻结为单一语言
    get notes() {
      return t(def.notesKey);
    },
    optionMeta: def.type === "scatterChart" ? SCATTER_OPTION_META : CHART_OPTION_META,
    defaultOptions: (partial) => chartFactoryDefaults(def.type, partial),
    binding: { bind: (options, data) => bindChartData(def.type, options, data) }
  })),
  render: {
    html: renderChartElement,
    createRenderer: () => ({ render: renderChartElement })
  }
});
var disposeHandle;
function registerChartPlugin(designer, extraRender) {
  const current = getElementPluginById(CHART_PLUGIN_ID);
  if (!designer && !extraRender) {
    const dispose2 = registerElementPlugin(CHART_PLUGIN);
    disposeHandle = dispose2;
    return dispose2;
  }
  const merged = {
    ...CHART_PLUGIN,
    designer: designer ?? current?.designer ?? CHART_PLUGIN.designer,
    render: { ...CHART_PLUGIN.render, ...current?.render, ...extraRender }
  };
  const dispose = registerElementPlugin(merged);
  disposeHandle = dispose;
  return dispose;
}
registerChartPlugin();

// src/index.ts
registerChartPlugin();

// src/ui.ts
import { t as globalT } from "@worm-print-platform/core/i18n";

// src/i18n/zh-CN.json
var zh_CN_default = {
  echarts: {
    "echarts.panel.chart": "\u56FE\u8868",
    "echarts.panel.config": "\u914D\u7F6E",
    "echarts.panel.dataSource": "\u6570\u636E\u6E90",
    "echarts.panel.category": "\u7C7B\u76EE",
    "echarts.panel.value": "\u6570\u503C",
    "echarts.panel.series": "\u7CFB\u5217",
    "echarts.panel.chartType.bar": "\u67F1\u72B6",
    "echarts.panel.chartType.barH": "\u6761\u5F62",
    "echarts.panel.chartType.line": "\u6298\u7EBF",
    "echarts.panel.chartType.area": "\u9762\u79EF",
    "echarts.panel.chartType.pie": "\u997C",
    "echarts.panel.chartType.doughnut": "\u73AF\u5F62",
    "echarts.panel.chartType.scatter": "\u6563\u70B9",
    "echarts.panel.chartType.radar": "\u96F7\u8FBE",
    "echarts.panel.chartType.funnel": "\u6F0F\u6597",
    "echarts.panel.chartType.gauge": "\u4EEA\u8868",
    "echarts.panel.dataLabel": "\u6570\u636E\u6807\u7B7E",
    "echarts.panel.valueLabel": "\u6570\u503C\u6807\u7B7E",
    "echarts.panel.hint.dataBinding": "\u6570\u636E\u7531\u6A21\u677F\u7ED1\u5B9A\u9636\u6BB5\u6CE8\u5165\uFF1Aseries/xAxis \u7684 data \u4FDD\u7559 `$data` \u5360\u4F4D\u5373\u53EF\uFF1B\u590D\u6742\u6837\u5F0F\u53EF\u5728\u6A21\u677F JSON \u4E2D\u624B\u5199 chartOption\u3002",
    "echarts.panel.field.dimension": "\u7EF4\u5EA6\u5B57\u6BB5\uFF08\u6BCF\u4E2A\u5B57\u6BB5\u4E00\u4E2A\u7EF4\u5EA6\uFF09",
    "echarts.panel.field.value": "\u6570\u503C\u5B57\u6BB5",
    "echarts.panel.field.valueMulti": "\u6570\u503C\u5B57\u6BB5\uFF08\u591A\u503C\u591A\u7CFB\u5217\uFF09",
    "echarts.panel.default": "\uFF08\u9ED8\u8BA4\uFF09",
    "echarts.panel.current": "\uFF08\u5F53\u524D\uFF09",
    "echarts.panel.defaultFirstArray": "\uFF08\u9ED8\u8BA4\uFF1A\u9876\u5C42\u7B2C\u4E00\u4E2A\u6570\u7EC4\uFF09",
    "echarts.panel.error.invalidOption": "\u56FE\u8868 option \u975E\u6CD5\uFF1A\u9700\u8981\u5BF9\u8C61",
    "echarts.panel.chartFallback": "\u56FE\u8868",
    "echarts.panel.optionDefault": "\uFF08\u9ED8\u8BA4\uFF09",
    "echarts.panel.overflow.default": "\u9ED8\u8BA4",
    "echarts.panel.overflow.none": "\u4E0D\u5904\u7406\uFF08\u663E\u793A\u5B8C\u6574\uFF09",
    "echarts.panel.overflow.truncate": "\u622A\u65AD",
    "echarts.panel.overflow.break": "\u6362\u884C",
    "echarts.panel.fontWeight.default": "\u9ED8\u8BA4",
    "echarts.panel.fontWeight.normal": "\u5E38\u89C4",
    "echarts.panel.fontWeight.bold": "\u52A0\u7C97",
    "echarts.panel.label.distance": "\u8DDD\u79BB",
    "echarts.panel.label.rotate": "\u65CB\u8F6C\uFF08\u5EA6\uFF09",
    "echarts.panel.label.fontSize": "\u5B57\u53F7",
    "echarts.panel.label.fontWeight": "\u5B57\u91CD",
    "echarts.panel.label.color": "\u6587\u5B57\u989C\u8272",
    "echarts.panel.label.backgroundColor": "\u80CC\u666F\u8272",
    "echarts.panel.label.borderColor": "\u8FB9\u6846\u8272",
    "echarts.panel.label.borderWidth": "\u8FB9\u6846\u5BBD\u5EA6",
    "echarts.panel.label.borderRadius": "\u5706\u89D2",
    "echarts.panel.label.padding": "\u5185\u8FB9\u8DDD",
    "echarts.panel.label.show": "\u663E\u793A\u6570\u636E\u6807\u7B7E",
    "echarts.panel.label.content": "\u5185\u5BB9",
    "echarts.panel.label.formatterTitle": "\u6570\u636E\u6807\u7B7E\u5185\u5BB9",
    "echarts.panel.label.formatterCustom": "\u81EA\u5B9A\u4E49 / \u9ED8\u8BA4",
    "echarts.panel.label.formatterPlaceholder": "\u5982 {b}: {c}",
    "echarts.panel.label.overflow": "\u6EA2\u51FA\u5904\u7406",
    "echarts.panel.label.position": "\u4F4D\u7F6E",
    "echarts.panel.label.positionTitle": "\u6807\u7B7E\u4F4D\u7F6E",
    "echarts.panel.label.positionDefault": "\u9ED8\u8BA4",
    "echarts.panel.label.offset": "\u504F\u79FB X / Y",
    "echarts.panel.label.style": "\u6837\u5F0F",
    "echarts.panel.labelLine.fontWeight": "\u5B57\u91CD",
    "echarts.panel.labelLine": "\u5F15\u5BFC\u7EBF",
    "echarts.panel.labelLine.show": "\u663E\u793A\u5F15\u5BFC\u7EBF",
    "echarts.panel.labelLine.length": "\u5F15\u5BFC\u7EBF\u957F\u5EA6",
    "echarts.panel.labelLine.length2": "\u7B2C\u4E8C\u6BB5\u957F\u5EA6",
    "echarts.panel.labelLine.smooth": "\u5E73\u6ED1\u5F15\u5BFC\u7EBF",
    "echarts.panel.dataSourceTitle": "\u6570\u636E\u6E90",
    "echarts.panel.selectField": "\u9009\u62E9\u5B57\u6BB5",
    "echarts.panel.autoSource": "\u81EA\u52A8",
    "echarts.panel.categoryField": "\u7C7B\u76EE\u5B57\u6BB5",
    "echarts.panel.removeField": "\u5220\u9664\u8BE5\u5B57\u6BB5",
    "echarts.panel.addField": "+ \u6DFB\u52A0\u5B57\u6BB5",
    "echarts.panel.seriesField": "\u7CFB\u5217\u62C6\u5206\u5B57\u6BB5",
    "echarts.panel.seriesFieldHint": "\u53EF\u9009\uFF0C\u5982 region\uFF08\u6309\u503C\u62C6\u6210\u591A\u7CFB\u5217\uFF09",
    "echarts.panel.bubbleSize": "\u6C14\u6CE1\u5927\u5C0F",
    "echarts.panel.title": "\u56FE\u8868\u6807\u9898",
    "echarts.panel.titleHint": "\u7559\u7A7A\u4E0D\u663E\u793A\u6807\u9898",
    "echarts.panel.legend": "\u663E\u793A\u56FE\u4F8B",
    "echarts.panel.palette": "\u914D\u8272",
    "echarts.palette.default": "\u9ED8\u8BA4\u84DD",
    "echarts.palette.fresh": "\u6E05\u65B0\u7EFF",
    "echarts.palette.warm": "\u6696\u6A59\u7EA2",
    "echarts.palette.purple": "\u7D2B\u7070",
    "echarts.panel.stack": "\u5806\u53E0\u663E\u793A",
    "echarts.panel.innerRadius": "\u5185\u5F84\uFF08%\uFF09",
    "echarts.panel.paddingTRBL": "\u5185\u8FB9\u8DDD \u4E0A/\u53F3/\u4E0B/\u5DE6 (%)",
    "echarts.panel.paddingTop": "\u4E0A\u8FB9\u8DDD",
    "echarts.panel.paddingRight": "\u53F3\u8FB9\u8DDD\uFF08\u7559\u5916\u7F6E\u6807\u7B7E\uFF09",
    "echarts.panel.paddingBottom": "\u4E0B\u8FB9\u8DDD",
    "echarts.panel.paddingLeft": "\u5DE6\u8FB9\u8DDD",
    "echarts.panel.radius": "\u534A\u5F84\uFF08%\uFF09",
    "echarts.panel.minMax": "\u6700\u5C0F / \u6700\u5927\u503C",
    "echarts.panel.group": "\u56FE\u8868",
    "echarts.series.typeNames.bar": "\u67F1\u72B6\u56FE",
    "echarts.series.typeNames.barH": "\u6761\u5F62\u56FE",
    "echarts.series.typeNames.line": "\u6298\u7EBF\u56FE",
    "echarts.series.typeNames.area": "\u9762\u79EF\u56FE",
    "echarts.series.typeNames.pie": "\u997C\u56FE",
    "echarts.series.typeNames.doughnut": "\u73AF\u5F62\u56FE",
    "echarts.series.typeNames.scatter": "\u6563\u70B9\u56FE",
    "echarts.series.typeNames.radar": "\u96F7\u8FBE\u56FE",
    "echarts.series.typeNames.funnel": "\u6F0F\u6597\u56FE",
    "echarts.series.typeNames.gauge": "\u4EEA\u8868\u76D8",
    "echarts.label.formatter.value": "\u6570\u503C",
    "echarts.label.formatter.nameValue": "\u540D\u79F0: \u6570\u503C",
    "echarts.label.formatter.name": "\u540D\u79F0",
    "echarts.label.formatter.percent": "\u767E\u5206\u6BD4",
    "echarts.label.position.bar.top": "\u9876\u90E8",
    "echarts.label.position.bar.inside": "\u5185\u90E8",
    "echarts.label.position.bar.insideTop": "\u5185\u90E8\u9876\u7AEF",
    "echarts.label.position.bar.bottom": "\u5E95\u90E8",
    "echarts.label.position.bar.insideBottom": "\u5185\u90E8\u5E95\u7AEF",
    "echarts.label.position.bar.right": "\u53F3\u4FA7",
    "echarts.label.position.bar.left": "\u5DE6\u4FA7",
    "echarts.label.position.bar.middle": "\u5C45\u4E2D",
    "echarts.label.position.line.top": "\u9876\u90E8",
    "echarts.label.position.line.bottom": "\u5E95\u90E8",
    "echarts.label.position.line.inside": "\u5185\u90E8",
    "echarts.label.position.line.left": "\u5DE6\u4FA7",
    "echarts.label.position.line.right": "\u53F3\u4FA7",
    "echarts.label.position.pie.outside": "\u5916\u4FA7",
    "echarts.label.position.pie.inside": "\u5185\u90E8",
    "echarts.label.position.pie.center": "\u4E2D\u5FC3",
    "echarts.label.position.scatter.top": "\u9876\u90E8",
    "echarts.label.position.scatter.bottom": "\u5E95\u90E8",
    "echarts.label.position.scatter.left": "\u5DE6\u4FA7",
    "echarts.label.position.scatter.right": "\u53F3\u4FA7",
    "echarts.label.position.scatter.inside": "\u5185\u90E8",
    "echarts.label.position.radar.top": "\u9876\u90E8",
    "echarts.label.position.radar.bottom": "\u5E95\u90E8",
    "echarts.label.position.radar.left": "\u5DE6\u4FA7",
    "echarts.label.position.radar.right": "\u53F3\u4FA7",
    "echarts.label.position.radar.inside": "\u5185\u90E8",
    "echarts.label.position.funnel.outer": "\u5916\u4FA7",
    "echarts.label.position.funnel.inner": "\u5185\u90E8",
    "echarts.label.position.funnel.left": "\u5DE6\u4FA7",
    "echarts.label.position.funnel.right": "\u53F3\u4FA7",
    "echarts.label.position.funnel.top": "\u9876\u90E8",
    "echarts.label.position.funnel.bottom": "\u5E95\u90E8",
    "echarts.meta.chartOption": "\u56FE\u8868 option",
    "echarts.meta.dataSource": "\u6570\u636E\u6E90",
    "echarts.meta.categoryField": "\u7C7B\u76EE\u5B57\u6BB5",
    "echarts.meta.valueFields": "\u6570\u503C\u5B57\u6BB5",
    "echarts.meta.seriesField": "\u7CFB\u5217\u62C6\u5206\u5B57\u6BB5",
    "echarts.meta.bubbleSize": "\u6C14\u6CE1\u5927\u5C0F",
    "echarts.notes.bar": "\u67F1\u72B6\u56FE\uFF1A\u7C7B\u76EE + \u591A\u4E2A\u6570\u503C\u5B57\u6BB5\uFF0C\u6BCF\u5B57\u6BB5\u4E00\u4E2A series\uFF1Bseries[].data \u5199 $data \u5360\u4F4D\uFF1B\u56FA\u5B9A\u9AD8\uFF0C\u7981\u6B62 autoHeight",
    "echarts.notes.barH": "\u6A2A\u5411\u6761\u5F62\u56FE\uFF1AxAxis \u4E3A\u6570\u503C\u3001yAxis \u4E3A\u7C7B\u76EE\uFF1B\u7C7B\u76EE\u5199 yAxis.data \u7684 $data \u5360\u4F4D",
    "echarts.notes.line": "\u6298\u7EBF\u56FE\uFF1A\u7C7B\u76EE + \u591A\u4E2A\u6570\u503C\u5B57\u6BB5\uFF1B\u4E0D\u5199 areaStyle",
    "echarts.notes.area": "\u9762\u79EF\u56FE\uFF1A\u6298\u7EBF + series[].areaStyle\uFF1B\u5176\u4F59\u540C\u6298\u7EBF\u56FE",
    "echarts.notes.pie": "\u997C\u56FE\uFF1A\u7C7B\u76EE + \u9996\u4E2A\u6570\u503C\u5B57\u6BB5\u751F\u6210 { name, value }\uFF1B\u53EA\u9700\u4E00\u4E2A\u6570\u503C\u5B57\u6BB5",
    "echarts.notes.doughnut": "\u73AF\u5F62\u56FE\uFF1A\u997C\u56FE + radius:[\u5185\u5F84,\u5916\u5F84]\uFF1B\u5185\u5F84\u7531\u9762\u677F\u914D\u7F6E",
    "echarts.notes.scatter": "\u6563\u70B9\u56FE\uFF1A\u7C7B\u76EE\u5B57\u6BB5\u4F5C x\u3001\u9996\u4E2A\u6570\u503C\u5B57\u6BB5\u4F5C y\uFF1BchartBubble \u5F00\u542F\u65F6\u7528\u7B2C\u4E8C\u4E2A\u6570\u503C\u5B57\u6BB5\u4F5C\u70B9\u5927\u5C0F",
    "echarts.notes.radar": "\u96F7\u8FBE\u56FE\uFF1A\u6BCF\u4E2A\u6570\u503C\u5B57\u6BB5\u662F\u4E00\u4E2A\u7EF4\u5EA6\uFF08radar.indicator\uFF09\uFF0C\u6BCF\u884C\u6570\u636E\u662F\u4E00\u4E2A\u7CFB\u5217\uFF08\u7C7B\u76EE\u5B57\u6BB5\u4F5C\u7CFB\u5217\u540D\uFF09\uFF1B\u534A\u5F84\u7531\u9762\u677F\u5199 radar.radius\uFF08%\uFF0C\u9ED8\u8BA4 75\uFF09",
    "echarts.notes.funnel": "\u6F0F\u6597\u56FE\uFF1A\u7C7B\u76EE + \u9996\u4E2A\u6570\u503C\u5B57\u6BB5\uFF0C\u6309\u6570\u503C\u964D\u5E8F\uFF1B\u56DB\u8FB9\u5185\u8FB9\u8DDD\u7531\u9762\u677F\u5199 series.left/right/top/bottom\uFF08%\uFF0C\u53F3\u4FA7\u9700\u7559\u5916\u7F6E\u6807\u7B7E\u7A7A\u95F4\uFF09",
    "echarts.notes.gauge": "\u4EEA\u8868\u76D8\uFF1A\u53D6\u9996\u884C\u6570\u636E\u7684\u9996\u4E2A\u6570\u503C\u5B57\u6BB5\u4F5C\u6307\u9488\u503C\uFF1Bmin/max \u7531\u9762\u677F\u5199\u5165 series[0].min/max"
  }
};

// src/i18n/en-US.json
var en_US_default = {
  echarts: {
    "echarts.panel.chart": "Chart",
    "echarts.panel.config": "Config",
    "echarts.panel.dataSource": "Data source",
    "echarts.panel.category": "Category",
    "echarts.panel.value": "Value",
    "echarts.panel.series": "Series",
    "echarts.panel.chartType.bar": "Bar",
    "echarts.panel.chartType.barH": "Horizontal bar",
    "echarts.panel.chartType.line": "Line",
    "echarts.panel.chartType.area": "Area",
    "echarts.panel.chartType.pie": "Pie",
    "echarts.panel.chartType.doughnut": "Doughnut",
    "echarts.panel.chartType.scatter": "Scatter",
    "echarts.panel.chartType.radar": "Radar",
    "echarts.panel.chartType.funnel": "Funnel",
    "echarts.panel.chartType.gauge": "Gauge",
    "echarts.panel.dataLabel": "Data label",
    "echarts.panel.valueLabel": "Value label",
    "echarts.panel.hint.dataBinding": "Data is injected at template binding; keep the `$data` placeholder in series/xAxis data; advanced styles can be written in chartOption in the template JSON.",
    "echarts.panel.field.dimension": "Dimension fields (one per dimension)",
    "echarts.panel.field.value": "Value fields",
    "echarts.panel.field.valueMulti": "Value fields (multiple values, multiple series)",
    "echarts.panel.default": "(default)",
    "echarts.panel.current": "(current)",
    "echarts.panel.defaultFirstArray": "(default: first top-level array)",
    "echarts.panel.error.invalidOption": "Invalid chart option: expected an object",
    "echarts.panel.chartFallback": "Chart",
    "echarts.panel.optionDefault": "(default)",
    "echarts.panel.overflow.default": "Default",
    "echarts.panel.overflow.none": "None (show full)",
    "echarts.panel.overflow.truncate": "Truncate",
    "echarts.panel.overflow.break": "Wrap",
    "echarts.panel.fontWeight.default": "Default",
    "echarts.panel.fontWeight.normal": "Regular",
    "echarts.panel.fontWeight.bold": "Bold",
    "echarts.panel.label.distance": "Distance",
    "echarts.panel.label.rotate": "Rotation (deg)",
    "echarts.panel.label.fontSize": "Font size",
    "echarts.panel.label.fontWeight": "Font weight",
    "echarts.panel.label.color": "Text color",
    "echarts.panel.label.backgroundColor": "Background color",
    "echarts.panel.label.borderColor": "Border color",
    "echarts.panel.label.borderWidth": "Border width",
    "echarts.panel.label.borderRadius": "Radius",
    "echarts.panel.label.padding": "Padding",
    "echarts.panel.label.show": "Show data labels",
    "echarts.panel.label.content": "Content",
    "echarts.panel.label.formatterTitle": "Data label content",
    "echarts.panel.label.formatterCustom": "Custom / Default",
    "echarts.panel.label.formatterPlaceholder": "e.g. {b}: {c}",
    "echarts.panel.label.overflow": "Overflow",
    "echarts.panel.label.position": "Position",
    "echarts.panel.label.positionTitle": "Label position",
    "echarts.panel.label.positionDefault": "Default",
    "echarts.panel.label.offset": "Offset X / Y",
    "echarts.panel.label.style": "Style",
    "echarts.panel.labelLine.fontWeight": "Font weight",
    "echarts.panel.labelLine": "Label line",
    "echarts.panel.labelLine.show": "Show label line",
    "echarts.panel.labelLine.length": "Label line length",
    "echarts.panel.labelLine.length2": "Second segment length",
    "echarts.panel.labelLine.smooth": "Smooth label line",
    "echarts.panel.dataSourceTitle": "Data source",
    "echarts.panel.selectField": "Select field",
    "echarts.panel.autoSource": "Auto",
    "echarts.panel.categoryField": "Category field",
    "echarts.panel.removeField": "Remove this field",
    "echarts.panel.addField": "+ Add field",
    "echarts.panel.seriesField": "Series split field",
    "echarts.panel.seriesFieldHint": "Optional, e.g. region (splits into series by value)",
    "echarts.panel.bubbleSize": "Bubble size",
    "echarts.panel.title": "Chart title",
    "echarts.panel.titleHint": "Leave empty to hide the title",
    "echarts.panel.legend": "Show legend",
    "echarts.panel.palette": "Color palette",
    "echarts.palette.default": "Default blue",
    "echarts.palette.fresh": "Fresh green",
    "echarts.palette.warm": "Warm orange-red",
    "echarts.palette.purple": "Purple grey",
    "echarts.panel.stack": "Stacked",
    "echarts.panel.innerRadius": "Inner radius (%)",
    "echarts.panel.paddingTRBL": "Padding top/right/bottom/left (%)",
    "echarts.panel.paddingTop": "Top padding",
    "echarts.panel.paddingRight": "Right padding (for outer labels)",
    "echarts.panel.paddingBottom": "Bottom padding",
    "echarts.panel.paddingLeft": "Left padding",
    "echarts.panel.radius": "Radius (%)",
    "echarts.panel.minMax": "Min / max",
    "echarts.panel.group": "Chart",
    "echarts.series.typeNames.bar": "Bar chart",
    "echarts.series.typeNames.barH": "Horizontal bar chart",
    "echarts.series.typeNames.line": "Line chart",
    "echarts.series.typeNames.area": "Area chart",
    "echarts.series.typeNames.pie": "Pie chart",
    "echarts.series.typeNames.doughnut": "Doughnut chart",
    "echarts.series.typeNames.scatter": "Scatter chart",
    "echarts.series.typeNames.radar": "Radar chart",
    "echarts.series.typeNames.funnel": "Funnel chart",
    "echarts.series.typeNames.gauge": "Gauge chart",
    "echarts.label.formatter.value": "Value",
    "echarts.label.formatter.nameValue": "Name: Value",
    "echarts.label.formatter.name": "Name",
    "echarts.label.formatter.percent": "Percentage",
    "echarts.label.position.bar.top": "Top",
    "echarts.label.position.bar.inside": "Inside",
    "echarts.label.position.bar.insideTop": "Inside top",
    "echarts.label.position.bar.bottom": "Bottom",
    "echarts.label.position.bar.insideBottom": "Inside bottom",
    "echarts.label.position.bar.right": "Right",
    "echarts.label.position.bar.left": "Left",
    "echarts.label.position.bar.middle": "Center",
    "echarts.label.position.line.top": "Top",
    "echarts.label.position.line.bottom": "Bottom",
    "echarts.label.position.line.inside": "Inside",
    "echarts.label.position.line.left": "Left",
    "echarts.label.position.line.right": "Right",
    "echarts.label.position.pie.outside": "Outside",
    "echarts.label.position.pie.inside": "Inside",
    "echarts.label.position.pie.center": "Center",
    "echarts.label.position.scatter.top": "Top",
    "echarts.label.position.scatter.bottom": "Bottom",
    "echarts.label.position.scatter.left": "Left",
    "echarts.label.position.scatter.right": "Right",
    "echarts.label.position.scatter.inside": "Inside",
    "echarts.label.position.radar.top": "Top",
    "echarts.label.position.radar.bottom": "Bottom",
    "echarts.label.position.radar.left": "Left",
    "echarts.label.position.radar.right": "Right",
    "echarts.label.position.radar.inside": "Inside",
    "echarts.label.position.funnel.outer": "Outside",
    "echarts.label.position.funnel.inner": "Inside",
    "echarts.label.position.funnel.left": "Left",
    "echarts.label.position.funnel.right": "Right",
    "echarts.label.position.funnel.top": "Top",
    "echarts.label.position.funnel.bottom": "Bottom",
    "echarts.meta.chartOption": "Chart option",
    "echarts.meta.dataSource": "Data source",
    "echarts.meta.categoryField": "Category field",
    "echarts.meta.valueFields": "Value fields",
    "echarts.meta.seriesField": "Series split field",
    "echarts.meta.bubbleSize": "Bubble size",
    "echarts.notes.bar": "Bar chart: category + multiple value fields, one series per field; write the $data placeholder in series[].data; fixed height, autoHeight is forbidden",
    "echarts.notes.barH": "Horizontal bar: xAxis is the value axis, yAxis is the category axis; write the $data placeholder in yAxis.data for categories",
    "echarts.notes.line": "Line chart: category + multiple value fields; do not write areaStyle",
    "echarts.notes.area": "Area chart: line + series[].areaStyle; otherwise same as the line chart",
    "echarts.notes.pie": "Pie chart: category + the first value field produce { name, value }; only one value field is needed",
    "echarts.notes.doughnut": "Doughnut: pie + radius:[inner, outer]; the inner radius is configured in the panel",
    "echarts.notes.scatter": "Scatter: the category field is x, the first value field is y; when chartBubble is on, the second value field is the point size",
    "echarts.notes.radar": "Radar: each value field is a dimension (radar.indicator), each data row is a series (the category field is the series name); the radius is written by the panel to radar.radius (%, default 75)",
    "echarts.notes.funnel": "Funnel: category + the first value field, sorted descending; the four insets are written by the panel to series.left/right/top/bottom (%, reserve room on the right for outer labels)",
    "echarts.notes.gauge": "Gauge: the first value field of the first data row is the pointer value; min/max are written by the panel to series[0].min/max"
  }
};

// src/i18n/th-TH.json
var th_TH_default = {
  echarts: {
    "echarts.panel.chart": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34",
    "echarts.panel.config": "\u0E01\u0E32\u0E23\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E04\u0E48\u0E32",
    "echarts.panel.dataSource": "\u0E41\u0E2B\u0E25\u0E48\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
    "echarts.panel.category": "\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48",
    "echarts.panel.value": "\u0E04\u0E48\u0E32",
    "echarts.panel.series": "\u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
    "echarts.panel.chartType.bar": "\u0E41\u0E17\u0E48\u0E07",
    "echarts.panel.chartType.barH": "\u0E41\u0E17\u0E48\u0E07\u0E41\u0E19\u0E27\u0E19\u0E2D\u0E19",
    "echarts.panel.chartType.line": "\u0E40\u0E2A\u0E49\u0E19",
    "echarts.panel.chartType.area": "\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48",
    "echarts.panel.chartType.pie": "\u0E27\u0E07\u0E01\u0E25\u0E21",
    "echarts.panel.chartType.doughnut": "\u0E27\u0E07\u0E01\u0E25\u0E21\u0E27\u0E07\u0E41\u0E2B\u0E27\u0E19",
    "echarts.panel.chartType.scatter": "\u0E08\u0E38\u0E14\u0E01\u0E23\u0E30\u0E08\u0E32\u0E22",
    "echarts.panel.chartType.radar": "\u0E40\u0E23\u0E14\u0E32\u0E23\u0E4C",
    "echarts.panel.chartType.funnel": "\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E32\u0E07",
    "echarts.panel.chartType.gauge": "\u0E40\u0E01\u0E08\u0E27\u0E31\u0E14",
    "echarts.panel.dataLabel": "\u0E1B\u0E49\u0E32\u0E22\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
    "echarts.panel.valueLabel": "\u0E1B\u0E49\u0E32\u0E22\u0E04\u0E48\u0E32",
    "echarts.panel.hint.dataBinding": "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E16\u0E39\u0E01\u0E41\u0E17\u0E23\u0E01\u0E15\u0E2D\u0E19\u0E1C\u0E39\u0E01\u0E40\u0E17\u0E21\u0E40\u0E1E\u0E25\u0E15; \u0E04\u0E07\u0E15\u0E31\u0E27\u0E41\u0E17\u0E19 `$data` \u0E44\u0E27\u0E49\u0E43\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25 series/xAxis; \u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E40\u0E02\u0E35\u0E22\u0E19\u0E2A\u0E44\u0E15\u0E25\u0E4C\u0E02\u0E31\u0E49\u0E19\u0E2A\u0E39\u0E07\u0E43\u0E19 chartOption \u0E02\u0E2D\u0E07 JSON \u0E40\u0E17\u0E21\u0E40\u0E1E\u0E25\u0E15\u0E44\u0E14\u0E49",
    "echarts.panel.field.dimension": "\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E21\u0E34\u0E15\u0E34 (\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E15\u0E48\u0E2D\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E21\u0E34\u0E15\u0E34)",
    "echarts.panel.field.value": "\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E04\u0E48\u0E32",
    "echarts.panel.field.valueMulti": "\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E04\u0E48\u0E32 (\u0E2B\u0E25\u0E32\u0E22\u0E04\u0E48\u0E32 \u0E2B\u0E25\u0E32\u0E22\u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25)",
    "echarts.panel.default": "(\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19)",
    "echarts.panel.current": "(\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19)",
    "echarts.panel.defaultFirstArray": "(\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19: \u0E2D\u0E32\u0E23\u0E4C\u0E40\u0E23\u0E22\u0E4C\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E1A\u0E19\u0E15\u0E31\u0E27\u0E41\u0E23\u0E01)",
    "echarts.panel.error.invalidOption": "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E32\u0E14\u0E27\u0E48\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E2D\u0E47\u0E2D\u0E1A\u0E40\u0E08\u0E01\u0E15\u0E4C",
    "echarts.panel.chartFallback": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34",
    "echarts.panel.optionDefault": "(\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19)",
    "echarts.panel.overflow.default": "\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19",
    "echarts.panel.overflow.none": "\u0E44\u0E21\u0E48\u0E21\u0E35 (\u0E41\u0E2A\u0E14\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14)",
    "echarts.panel.overflow.truncate": "\u0E15\u0E31\u0E14\u0E17\u0E34\u0E49\u0E07",
    "echarts.panel.overflow.break": "\u0E15\u0E31\u0E14\u0E04\u0E33",
    "echarts.panel.fontWeight.default": "\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19",
    "echarts.panel.fontWeight.normal": "\u0E1B\u0E01\u0E15\u0E34",
    "echarts.panel.fontWeight.bold": "\u0E2B\u0E19\u0E32",
    "echarts.panel.label.distance": "\u0E23\u0E30\u0E22\u0E30\u0E2B\u0E48\u0E32\u0E07",
    "echarts.panel.label.rotate": "\u0E01\u0E32\u0E23\u0E2B\u0E21\u0E38\u0E19 (\u0E2D\u0E07\u0E28\u0E32)",
    "echarts.panel.label.fontSize": "\u0E02\u0E19\u0E32\u0E14\u0E1F\u0E2D\u0E19\u0E15\u0E4C",
    "echarts.panel.label.fontWeight": "\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01\u0E1F\u0E2D\u0E19\u0E15\u0E4C",
    "echarts.panel.label.color": "\u0E2A\u0E35\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21",
    "echarts.panel.label.backgroundColor": "\u0E2A\u0E35\u0E1E\u0E37\u0E49\u0E19\u0E2B\u0E25\u0E31\u0E07",
    "echarts.panel.label.borderColor": "\u0E2A\u0E35\u0E40\u0E2A\u0E49\u0E19\u0E02\u0E2D\u0E1A",
    "echarts.panel.label.borderWidth": "\u0E04\u0E27\u0E32\u0E21\u0E01\u0E27\u0E49\u0E32\u0E07\u0E40\u0E2A\u0E49\u0E19\u0E02\u0E2D\u0E1A",
    "echarts.panel.label.borderRadius": "\u0E23\u0E31\u0E28\u0E21\u0E35",
    "echarts.panel.label.padding": "\u0E23\u0E30\u0E22\u0E30\u0E20\u0E32\u0E22\u0E43\u0E19",
    "echarts.panel.label.show": "\u0E41\u0E2A\u0E14\u0E07\u0E1B\u0E49\u0E32\u0E22\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
    "echarts.panel.label.content": "\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32",
    "echarts.panel.label.formatterTitle": "\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32\u0E1B\u0E49\u0E32\u0E22\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
    "echarts.panel.label.formatterCustom": "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07 / \u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19",
    "echarts.panel.label.formatterPlaceholder": "\u0E40\u0E0A\u0E48\u0E19 {b}: {c}",
    "echarts.panel.label.overflow": "\u0E25\u0E49\u0E19",
    "echarts.panel.label.position": "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07",
    "echarts.panel.label.positionTitle": "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E1B\u0E49\u0E32\u0E22",
    "echarts.panel.label.positionDefault": "\u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19",
    "echarts.panel.label.offset": "\u0E2D\u0E2D\u0E1F\u0E40\u0E0B\u0E47\u0E15 X / Y",
    "echarts.panel.label.style": "\u0E2A\u0E44\u0E15\u0E25\u0E4C",
    "echarts.panel.labelLine.fontWeight": "\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01\u0E1F\u0E2D\u0E19\u0E15\u0E4C",
    "echarts.panel.labelLine": "\u0E40\u0E2A\u0E49\u0E19\u0E1B\u0E49\u0E32\u0E22",
    "echarts.panel.labelLine.show": "\u0E41\u0E2A\u0E14\u0E07\u0E40\u0E2A\u0E49\u0E19\u0E1B\u0E49\u0E32\u0E22",
    "echarts.panel.labelLine.length": "\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E40\u0E2A\u0E49\u0E19\u0E1B\u0E49\u0E32\u0E22",
    "echarts.panel.labelLine.length2": "\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E27\u0E17\u0E48\u0E2D\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E2D\u0E07",
    "echarts.panel.labelLine.smooth": "\u0E40\u0E2A\u0E49\u0E19\u0E1B\u0E49\u0E32\u0E22\u0E42\u0E04\u0E49\u0E07",
    "echarts.panel.dataSourceTitle": "\u0E41\u0E2B\u0E25\u0E48\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
    "echarts.panel.selectField": "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1F\u0E34\u0E25\u0E14\u0E4C",
    "echarts.panel.autoSource": "\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34",
    "echarts.panel.categoryField": "\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48",
    "echarts.panel.removeField": "\u0E25\u0E1A\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E19\u0E35\u0E49",
    "echarts.panel.addField": "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1F\u0E34\u0E25\u0E14\u0E4C",
    "echarts.panel.seriesField": "\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E41\u0E22\u0E01\u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
    "echarts.panel.seriesFieldHint": "\u0E44\u0E21\u0E48\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A \u0E40\u0E0A\u0E48\u0E19 region (\u0E41\u0E22\u0E01\u0E40\u0E1B\u0E47\u0E19\u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E15\u0E32\u0E21\u0E04\u0E48\u0E32)",
    "echarts.panel.bubbleSize": "\u0E02\u0E19\u0E32\u0E14\u0E1F\u0E2D\u0E07",
    "echarts.panel.title": "\u0E0A\u0E37\u0E48\u0E2D\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34",
    "echarts.panel.titleHint": "\u0E40\u0E27\u0E49\u0E19\u0E27\u0E48\u0E32\u0E07\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E0B\u0E48\u0E2D\u0E19\u0E0A\u0E37\u0E48\u0E2D",
    "echarts.panel.legend": "\u0E41\u0E2A\u0E14\u0E07\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22",
    "echarts.panel.palette": "\u0E0A\u0E38\u0E14\u0E2A\u0E35",
    "echarts.palette.default": "\u0E2A\u0E35\u0E19\u0E49\u0E33\u0E40\u0E07\u0E34\u0E19\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19",
    "echarts.palette.fresh": "\u0E2A\u0E35\u0E40\u0E02\u0E35\u0E22\u0E27\u0E2A\u0E14\u0E0A\u0E37\u0E48\u0E19",
    "echarts.palette.warm": "\u0E2A\u0E35\u0E2A\u0E49\u0E21\u0E41\u0E14\u0E07\u0E2D\u0E1A\u0E2D\u0E38\u0E48\u0E19",
    "echarts.palette.purple": "\u0E2A\u0E35\u0E21\u0E39\u0E1F\u0E40\u0E17\u0E32",
    "echarts.panel.stack": "\u0E0B\u0E49\u0E2D\u0E19\u0E01\u0E31\u0E19",
    "echarts.panel.innerRadius": "\u0E23\u0E31\u0E28\u0E21\u0E35\u0E43\u0E19 (%)",
    "echarts.panel.paddingTRBL": "\u0E23\u0E30\u0E22\u0E30\u0E1A\u0E19/\u0E02\u0E27\u0E32/\u0E25\u0E48\u0E32\u0E07/\u0E0B\u0E49\u0E32\u0E22 (%)",
    "echarts.panel.paddingTop": "\u0E23\u0E30\u0E22\u0E30\u0E1A\u0E19",
    "echarts.panel.paddingRight": "\u0E23\u0E30\u0E22\u0E30\u0E02\u0E27\u0E32 (\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E1B\u0E49\u0E32\u0E22\u0E14\u0E49\u0E32\u0E19\u0E19\u0E2D\u0E01)",
    "echarts.panel.paddingBottom": "\u0E23\u0E30\u0E22\u0E30\u0E25\u0E48\u0E32\u0E07",
    "echarts.panel.paddingLeft": "\u0E23\u0E30\u0E22\u0E30\u0E0B\u0E49\u0E32\u0E22",
    "echarts.panel.radius": "\u0E23\u0E31\u0E28\u0E21\u0E35 (%)",
    "echarts.panel.minMax": "\u0E15\u0E48\u0E33\u0E2A\u0E38\u0E14 / \u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14",
    "echarts.panel.group": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34",
    "echarts.series.typeNames.bar": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E41\u0E17\u0E48\u0E07",
    "echarts.series.typeNames.barH": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E41\u0E17\u0E48\u0E07\u0E41\u0E19\u0E27\u0E19\u0E2D\u0E19",
    "echarts.series.typeNames.line": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E40\u0E2A\u0E49\u0E19",
    "echarts.series.typeNames.area": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48",
    "echarts.series.typeNames.pie": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E27\u0E07\u0E01\u0E25\u0E21",
    "echarts.series.typeNames.doughnut": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E27\u0E07\u0E01\u0E25\u0E21\u0E27\u0E07\u0E41\u0E2B\u0E27\u0E19",
    "echarts.series.typeNames.scatter": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E01\u0E23\u0E30\u0E08\u0E32\u0E22",
    "echarts.series.typeNames.radar": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E40\u0E23\u0E14\u0E32\u0E23\u0E4C",
    "echarts.series.typeNames.funnel": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E32\u0E07",
    "echarts.series.typeNames.gauge": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E40\u0E01\u0E08\u0E27\u0E31\u0E14",
    "echarts.label.formatter.value": "\u0E04\u0E48\u0E32",
    "echarts.label.formatter.nameValue": "\u0E0A\u0E37\u0E48\u0E2D: \u0E04\u0E48\u0E32",
    "echarts.label.formatter.name": "\u0E0A\u0E37\u0E48\u0E2D",
    "echarts.label.formatter.percent": "\u0E40\u0E1B\u0E2D\u0E23\u0E4C\u0E40\u0E0B\u0E47\u0E19\u0E15\u0E4C",
    "echarts.label.position.bar.top": "\u0E1A\u0E19",
    "echarts.label.position.bar.inside": "\u0E14\u0E49\u0E32\u0E19\u0E43\u0E19",
    "echarts.label.position.bar.insideTop": "\u0E14\u0E49\u0E32\u0E19\u0E43\u0E19\u0E1A\u0E19",
    "echarts.label.position.bar.bottom": "\u0E25\u0E48\u0E32\u0E07",
    "echarts.label.position.bar.insideBottom": "\u0E14\u0E49\u0E32\u0E19\u0E43\u0E19\u0E25\u0E48\u0E32\u0E07",
    "echarts.label.position.bar.right": "\u0E02\u0E27\u0E32",
    "echarts.label.position.bar.left": "\u0E0B\u0E49\u0E32\u0E22",
    "echarts.label.position.bar.middle": "\u0E01\u0E25\u0E32\u0E07",
    "echarts.label.position.line.top": "\u0E1A\u0E19",
    "echarts.label.position.line.bottom": "\u0E25\u0E48\u0E32\u0E07",
    "echarts.label.position.line.inside": "\u0E14\u0E49\u0E32\u0E19\u0E43\u0E19",
    "echarts.label.position.line.left": "\u0E0B\u0E49\u0E32\u0E22",
    "echarts.label.position.line.right": "\u0E02\u0E27\u0E32",
    "echarts.label.position.pie.outside": "\u0E14\u0E49\u0E32\u0E19\u0E19\u0E2D\u0E01",
    "echarts.label.position.pie.inside": "\u0E14\u0E49\u0E32\u0E19\u0E43\u0E19",
    "echarts.label.position.pie.center": "\u0E01\u0E25\u0E32\u0E07",
    "echarts.label.position.scatter.top": "\u0E1A\u0E19",
    "echarts.label.position.scatter.bottom": "\u0E25\u0E48\u0E32\u0E07",
    "echarts.label.position.scatter.left": "\u0E0B\u0E49\u0E32\u0E22",
    "echarts.label.position.scatter.right": "\u0E02\u0E27\u0E32",
    "echarts.label.position.scatter.inside": "\u0E14\u0E49\u0E32\u0E19\u0E43\u0E19",
    "echarts.label.position.radar.top": "\u0E1A\u0E19",
    "echarts.label.position.radar.bottom": "\u0E25\u0E48\u0E32\u0E07",
    "echarts.label.position.radar.left": "\u0E0B\u0E49\u0E32\u0E22",
    "echarts.label.position.radar.right": "\u0E02\u0E27\u0E32",
    "echarts.label.position.radar.inside": "\u0E14\u0E49\u0E32\u0E19\u0E43\u0E19",
    "echarts.label.position.funnel.outer": "\u0E14\u0E49\u0E32\u0E19\u0E19\u0E2D\u0E01",
    "echarts.label.position.funnel.inner": "\u0E14\u0E49\u0E32\u0E19\u0E43\u0E19",
    "echarts.label.position.funnel.left": "\u0E0B\u0E49\u0E32\u0E22",
    "echarts.label.position.funnel.right": "\u0E02\u0E27\u0E32",
    "echarts.label.position.funnel.top": "\u0E1A\u0E19",
    "echarts.label.position.funnel.bottom": "\u0E25\u0E48\u0E32\u0E07",
    "echarts.meta.chartOption": "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34",
    "echarts.meta.dataSource": "\u0E41\u0E2B\u0E25\u0E48\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
    "echarts.meta.categoryField": "\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48",
    "echarts.meta.valueFields": "\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E04\u0E48\u0E32",
    "echarts.meta.seriesField": "\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E41\u0E22\u0E01\u0E0A\u0E38\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
    "echarts.meta.bubbleSize": "\u0E02\u0E19\u0E32\u0E14\u0E1F\u0E2D\u0E07",
    "echarts.notes.bar": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E41\u0E17\u0E48\u0E07: \u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48 + \u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E04\u0E48\u0E32\u0E2B\u0E25\u0E32\u0E22\u0E15\u0E31\u0E27 \u0E2B\u0E19\u0E36\u0E48\u0E07\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E15\u0E48\u0E2D\u0E2B\u0E19\u0E36\u0E48\u0E07 series; \u0E40\u0E02\u0E35\u0E22\u0E19\u0E15\u0E31\u0E27\u0E41\u0E17\u0E19 $data \u0E43\u0E19 series[].data; \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07\u0E04\u0E07\u0E17\u0E35\u0E48 \u0E2B\u0E49\u0E32\u0E21\u0E43\u0E0A\u0E49 autoHeight",
    "echarts.notes.barH": "\u0E41\u0E17\u0E48\u0E07\u0E41\u0E19\u0E27\u0E19\u0E2D\u0E19: xAxis \u0E40\u0E1B\u0E47\u0E19\u0E41\u0E01\u0E19\u0E04\u0E48\u0E32 yAxis \u0E40\u0E1B\u0E47\u0E19\u0E41\u0E01\u0E19\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48; \u0E40\u0E02\u0E35\u0E22\u0E19\u0E15\u0E31\u0E27\u0E41\u0E17\u0E19 $data \u0E43\u0E19 yAxis.data \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48",
    "echarts.notes.line": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E40\u0E2A\u0E49\u0E19: \u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48 + \u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E04\u0E48\u0E32\u0E2B\u0E25\u0E32\u0E22\u0E15\u0E31\u0E27; \u0E44\u0E21\u0E48\u0E40\u0E02\u0E35\u0E22\u0E19 areaStyle",
    "echarts.notes.area": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48: \u0E40\u0E2A\u0E49\u0E19 + series[].areaStyle; \u0E19\u0E2D\u0E01\u0E19\u0E31\u0E49\u0E19\u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E40\u0E2A\u0E49\u0E19",
    "echarts.notes.pie": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E27\u0E07\u0E01\u0E25\u0E21: \u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48 + \u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E04\u0E48\u0E32\u0E15\u0E31\u0E27\u0E41\u0E23\u0E01\u0E2A\u0E23\u0E49\u0E32\u0E07 { name, value }; \u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E40\u0E1E\u0E35\u0E22\u0E07\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E04\u0E48\u0E32",
    "echarts.notes.doughnut": "\u0E27\u0E07\u0E01\u0E25\u0E21\u0E27\u0E07\u0E41\u0E2B\u0E27\u0E19: \u0E27\u0E07\u0E01\u0E25\u0E21 + radius:[\u0E23\u0E31\u0E28\u0E21\u0E35\u0E43\u0E19, \u0E23\u0E31\u0E28\u0E21\u0E35\u0E19\u0E2D\u0E01]; \u0E23\u0E31\u0E28\u0E21\u0E35\u0E43\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E43\u0E19\u0E41\u0E1C\u0E07",
    "echarts.notes.scatter": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E01\u0E23\u0E30\u0E08\u0E32\u0E22: \u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48\u0E40\u0E1B\u0E47\u0E19 x \u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E04\u0E48\u0E32\u0E15\u0E31\u0E27\u0E41\u0E23\u0E01\u0E40\u0E1B\u0E47\u0E19 y; \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E34\u0E14 chartBubble \u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E04\u0E48\u0E32\u0E15\u0E31\u0E27\u0E17\u0E35\u0E48\u0E2A\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E19\u0E32\u0E14\u0E08\u0E38\u0E14",
    "echarts.notes.radar": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E40\u0E23\u0E14\u0E32\u0E23\u0E4C: \u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E04\u0E48\u0E32\u0E17\u0E38\u0E01\u0E15\u0E31\u0E27\u0E04\u0E37\u0E2D\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E21\u0E34\u0E15\u0E34 (radar.indicator) \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E41\u0E15\u0E48\u0E25\u0E30\u0E41\u0E16\u0E27\u0E04\u0E37\u0E2D\u0E2B\u0E19\u0E36\u0E48\u0E07 series (\u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E0A\u0E37\u0E48\u0E2D series); \u0E23\u0E31\u0E28\u0E21\u0E35\u0E40\u0E02\u0E35\u0E22\u0E19\u0E42\u0E14\u0E22\u0E41\u0E1C\u0E07\u0E44\u0E1B\u0E17\u0E35\u0E48 radar.radius (%, \u0E04\u0E48\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19 75)",
    "echarts.notes.funnel": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E0A\u0E48\u0E2D\u0E07\u0E17\u0E32\u0E07: \u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48 + \u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E04\u0E48\u0E32\u0E15\u0E31\u0E27\u0E41\u0E23\u0E01 \u0E40\u0E23\u0E35\u0E22\u0E07\u0E15\u0E32\u0E21\u0E04\u0E48\u0E32\u0E25\u0E07\u0E21\u0E32; \u0E23\u0E30\u0E22\u0E30\u0E20\u0E32\u0E22\u0E43\u0E19\u0E2A\u0E35\u0E48\u0E14\u0E49\u0E32\u0E19\u0E40\u0E02\u0E35\u0E22\u0E19\u0E42\u0E14\u0E22\u0E41\u0E1C\u0E07\u0E44\u0E1B\u0E17\u0E35\u0E48 series.left/right/top/bottom (%, \u0E40\u0E1C\u0E37\u0E48\u0E2D\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E14\u0E49\u0E32\u0E19\u0E02\u0E27\u0E32\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E1B\u0E49\u0E32\u0E22\u0E14\u0E49\u0E32\u0E19\u0E19\u0E2D\u0E01)",
    "echarts.notes.gauge": "\u0E41\u0E1C\u0E19\u0E20\u0E39\u0E21\u0E34\u0E40\u0E01\u0E08\u0E27\u0E31\u0E14: \u0E1F\u0E34\u0E25\u0E14\u0E4C\u0E04\u0E48\u0E32\u0E15\u0E31\u0E27\u0E41\u0E23\u0E01\u0E02\u0E2D\u0E07\u0E41\u0E16\u0E27\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E41\u0E23\u0E01\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E48\u0E32\u0E1C\u0E25\u0E31\u0E01\u0E14\u0E31\u0E19; min/max \u0E40\u0E02\u0E35\u0E22\u0E19\u0E42\u0E14\u0E22\u0E41\u0E1C\u0E07\u0E44\u0E1B\u0E17\u0E35\u0E48 series[0].min/max"
  }
};

// src/ui.ts
import { defineElementUI, registerElementUI } from "@worm-print-platform/plugin-kit";
import { render } from "@worm-print-platform/plugin-kit/dom";
import { colorPicker } from "@worm-print-platform/plugin-kit/controls";
var activeT = globalT;
var t2 = (key, params) => activeT(key, params);
function withTranslator(translator, render2) {
  const prev = activeT;
  activeT = translator ?? globalT;
  try {
    return render2();
  } finally {
    activeT = prev;
  }
}
var CANVAS_STYLE = "width:100%;height:100%;min-width:0;min-height:0;pointer-events:none";
var STYLES = [
  ".echarts-canvas-element{overflow:hidden}",
  ".echarts-field-row{display:flex;gap:6px;align-items:center}",
  ".echarts-field-current{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--pd-text-secondary,#6b7280)}",
  ".echarts-field-row>.pd-input{flex:1;min-width:0}",
  ".echarts-field-row>.pd-button{flex:none}",
  ".echarts-label-group{margin-top:8px;border-top:1px solid var(--pd-border,#e5e7eb);padding-top:8px}",
  ".echarts-label-group>summary{display:flex;align-items:center;cursor:pointer;list-style:none;font-size:12px;font-weight:600}",
  ".echarts-label-summary>.pd-field{flex:1;margin:0;font-weight:400}",
  ".echarts-label-sub{font-size:11px;color:var(--pd-text-secondary,#6b7280);margin:8px 0 4px}"
].join("");
var CHART_OPTION_KEYS = [
  "chartOption",
  "chartDataSource",
  "chartCategoryField",
  "chartValueFields",
  "chartSeriesField",
  "chartBubble"
];
var SEARCH_KEYWORDS = [
  "\u56FE\u8868",
  "echarts",
  "option",
  "\u914D\u7F6E",
  "\u6570\u636E\u6E90",
  "\u7C7B\u76EE",
  "\u6570\u503C",
  "\u7CFB\u5217",
  "\u67F1\u72B6",
  "\u6761\u5F62",
  "\u6298\u7EBF",
  "\u9762\u79EF",
  "\u997C",
  "\u73AF\u5F62",
  "\u6563\u70B9",
  "\u96F7\u8FBE",
  "\u6F0F\u6597",
  "\u4EEA\u8868",
  "\u6570\u636E\u6807\u7B7E",
  "\u6570\u503C\u6807\u7B7E",
  "label"
];
var panelHint = () => t2("echarts.panel.hint.dataBinding");
function escapeHtml2(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function elementType(element) {
  return element.printElementType?.type ?? "";
}
function rawChartOption(element) {
  const raw = element.options.chartOption;
  return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : void 0;
}
function panelOption(element) {
  const raw = rawChartOption(element);
  return cloneChartOption(raw ?? createDefaultChartOption(elementType(element)));
}
function chartHasProperties(element) {
  const options = element?.options;
  if (!options || typeof options !== "object") return false;
  const record = options;
  return CHART_OPTION_KEYS.some((key) => record[key] !== void 0);
}
function commitOption(ctx, type, next, patch = {}) {
  ctx.update({ chartOption: normalizeChartOption(type, next), ...patch });
}
function readValueFields(element) {
  const raw = element.options.chartValueFields;
  return Array.isArray(raw) ? raw.map(String) : [];
}
function maxValueFields(def) {
  switch (def?.seriesType) {
    case "pie":
    case "funnel":
    case "gauge":
      return 1;
    case "scatter":
      return 2;
    default:
      return 8;
  }
}
function valueFieldsLabel(def, limit) {
  if (def?.seriesType === "radar") return t2("echarts.panel.field.dimension");
  return limit === 1 ? t2("echarts.panel.field.value") : t2("echarts.panel.field.valueMulti");
}
function fieldLabelMap(fields) {
  const map = /* @__PURE__ */ new Map();
  for (const field2 of fields ?? []) {
    if (field2.fieldKey && field2.fieldLabel) map.set(field2.fieldKey, field2.fieldLabel);
  }
  return map;
}
function optionLabel(value, labels) {
  if (!value) return t2("echarts.panel.default");
  const name = labels.get(value);
  return name ? `${name}\uFF08${value}\uFF09` : value;
}
function fieldBindingKey(next) {
  if (next.binding) return next.binding;
  const matched = /^\{\s*([^{}]+?)\s*\}$/.exec(next.formatter?.trim() ?? "");
  return matched?.[1]?.trim() ?? "";
}
function fieldPicker(ctx, current, targetPath, fields, labels, onSelect, allowAuto = false) {
  const row = el("div", "echarts-field-row");
  const display = el(
    "span",
    "echarts-field-current",
    current ? optionLabel(current, labels) : allowAuto ? t2("echarts.panel.autoSource") : t2("echarts.panel.default")
  );
  const picker = el("button", "pd-button small echarts-field-picker", t2("echarts.panel.selectField"));
  picker.type = "button";
  picker.addEventListener("click", () => ctx.openExpression({
    elementId: ctx.element.id,
    targetPath,
    value: current ? `{${current}}` : "",
    binding: current || void 0,
    fieldOnly: true,
    fields
  }, (next) => onSelect(fieldBindingKey(next))));
  row.append(display, picker);
  if (allowAuto) {
    const auto = el("button", "pd-button small echarts-auto-source", t2("echarts.panel.autoSource"));
    auto.type = "button";
    auto.addEventListener("click", () => onSelect(""));
    row.appendChild(auto);
  }
  return row;
}
function seriesList(option) {
  return Array.isArray(option.series) ? option.series : [];
}
function clamp2(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function syncValueFields(ctx, type, nextFields) {
  const next = syncSeriesCount(panelOption(ctx.element), nextFields.length, type);
  const series = Array.isArray(next.series) ? next.series : [];
  series.forEach((item, index) => {
    const name = nextFields[index]?.trim();
    if (name) item.name = name;
  });
  commitOption(ctx, type, next, { chartValueFields: nextFields });
}
function renderCanvas(ctx) {
  const element = ctx.element;
  const type = elementType(element);
  const options = element.options;
  const widthMm = Number(options.width) || 0;
  const heightMm = Number(options.height) || 0;
  try {
    const preview = previewChartOption(type, rawChartOption(element) ?? createDefaultChartOption(type));
    const option = normalizeChartOption(type, preview);
    if (!option || typeof option !== "object" || Array.isArray(option)) throw new Error(t2("echarts.panel.error.invalidOption"));
    const fontFamily = typeof options.fontFamily === "string" && options.fontFamily ? options.fontFamily : void 0;
    const svg = renderChartToSvg({ key: element.id, type, option, widthMm, heightMm, fontFamily });
    return `<div class="echarts-canvas-element" style="${CANVAS_STYLE}">${svg}</div>`;
  } catch {
    const title = typeof options.title === "string" && options.title.trim() ? options.title : getChartKindDefinition(type)?.label ?? t2("echarts.panel.chartFallback");
    return `<div class="echarts-canvas-element" style="${CANVAS_STYLE}">${escapeHtml2(title)}</div>`;
  }
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== void 0) node.textContent = text;
  return node;
}
function field(labelText) {
  const wrap = el("div", "pd-field");
  wrap.appendChild(el("span", "pd-label", labelText));
  return wrap;
}
function textInput(init, onCommit) {
  const input = el("input", "pd-input");
  if (init.type) input.type = init.type;
  if (init.placeholder) input.placeholder = init.placeholder;
  if (init.min !== void 0) input.min = String(init.min);
  if (init.max !== void 0) input.max = String(init.max);
  if (init.title) input.title = init.title;
  if (init.list) input.setAttribute("list", init.list);
  input.value = init.value;
  input.addEventListener("change", () => onCommit(input.value));
  return input;
}
function checkboxField(labelText, checked, onCommit) {
  const wrap = field(labelText);
  wrap.style.cssText = "flex-direction:row;align-items:center;justify-content:space-between";
  const input = el("input", "pd-switch");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", () => onCommit(input.checked));
  wrap.appendChild(input);
  return wrap;
}
function selectInput(options, value, onCommit) {
  const select = el("select", "pd-select");
  for (const item of options) {
    const optionEl = el("option");
    optionEl.value = item.value;
    optionEl.textContent = item.label;
    select.appendChild(optionEl);
  }
  select.value = value;
  select.addEventListener("change", () => onCommit(select.value));
  return select;
}
var overflowOptions = () => [
  { value: "", label: t2("echarts.panel.overflow.default") },
  { value: "none", label: t2("echarts.panel.overflow.none") },
  { value: "truncate", label: t2("echarts.panel.overflow.truncate") },
  { value: "break", label: t2("echarts.panel.overflow.break") }
];
var fontWeightOptions = () => [
  { value: "", label: t2("echarts.panel.fontWeight.default") },
  { value: "normal", label: t2("echarts.panel.fontWeight.normal") },
  { value: "bold", label: t2("echarts.panel.fontWeight.bold") }
];
var styleFieldLabels = () => ({
  distance: t2("echarts.panel.label.distance"),
  rotate: t2("echarts.panel.label.rotate"),
  fontSize: t2("echarts.panel.label.fontSize"),
  fontWeight: t2("echarts.panel.label.fontWeight"),
  color: t2("echarts.panel.label.color"),
  backgroundColor: t2("echarts.panel.label.backgroundColor"),
  borderColor: t2("echarts.panel.label.borderColor"),
  borderWidth: t2("echarts.panel.label.borderWidth"),
  borderRadius: t2("echarts.panel.label.borderRadius"),
  padding: t2("echarts.panel.label.padding")
});
function renderLabelGroup(ctx, type) {
  const element = ctx.element;
  const def = getChartKindDefinition(type);
  const fields = labelFieldsOf(type);
  const has = (key) => fields.includes(key);
  const state = readChartLabel(panelOption(element), type);
  const styleLabels = styleFieldLabels();
  const commit = (patch) => {
    commitOption(ctx, type, updateChartLabel(panelOption(element), type, patch));
  };
  const commitNumber = (key, raw) => {
    if (raw.trim() === "") return commit({ [key]: null });
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    commit({ [key]: value });
  };
  const commitLineNumber = (key, raw) => {
    if (raw.trim() === "") return commit({ labelLine: { [key]: null } });
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    commit({ labelLine: { [key]: value } });
  };
  const numberField = (key, value) => {
    const wrap = field(styleLabels[key] ?? key);
    wrap.appendChild(
      textInput({ value: value === void 0 ? "" : String(value), type: "number" }, (raw) => commitNumber(key, raw))
    );
    return wrap;
  };
  const colorField = (key, value) => {
    const wrap = field(styleLabels[key] ?? key);
    const holder = el("span");
    render(colorPicker({
      value: value ?? "",
      title: styleLabels[key] ?? key,
      // 面板点击时才构建，届时候选渲染期 translator 已还原，必须固化 ctx.t
      translator: ctx.t,
      onChange: (next) => commit({ [key]: next ?? "" })
    }), holder);
    wrap.appendChild(holder);
    return wrap;
  };
  const group = el("details", "echarts-label-group");
  group.open = state.show;
  const summary = el("summary", "echarts-label-summary");
  const toggle = checkboxField(t2("echarts.panel.label.show"), state.show, (checked) => commit({ enabled: checked }));
  toggle.querySelector("input")?.addEventListener("click", (event) => event.stopPropagation());
  summary.appendChild(toggle);
  group.appendChild(summary);
  if (has("formatter") || has("overflow")) {
    group.appendChild(el("div", "echarts-label-sub", t2("echarts.panel.label.content")));
    if (has("formatter")) {
      const wrap = field(t2("echarts.panel.label.formatterTitle"));
      wrap.appendChild(
        selectInput(
          [{ value: "", label: t2("echarts.panel.label.formatterCustom") }, ...LABEL_PRESETS.map((preset) => ({ value: preset.formatter, label: t2(preset.labelKey) }))],
          state.formatter ?? "",
          (value) => commit({ formatter: value })
        )
      );
      wrap.appendChild(
        textInput({ value: state.formatter ?? "", placeholder: t2("echarts.panel.label.formatterPlaceholder") }, (value) => commit({ formatter: value }))
      );
      group.appendChild(wrap);
    }
    if (has("overflow")) {
      const wrap = field(t2("echarts.panel.label.overflow"));
      wrap.appendChild(selectInput(overflowOptions(), state.overflow ?? "", (value) => commit({ overflow: value })));
      group.appendChild(wrap);
    }
  }
  if (has("position") || has("distance") || has("rotate") || has("offset")) {
    group.appendChild(el("div", "echarts-label-sub", t2("echarts.panel.label.position")));
    if (has("position")) {
      const wrap = field(t2("echarts.panel.label.positionTitle"));
      const positions = def ? LABEL_POSITIONS[def.seriesType] ?? [] : [];
      wrap.appendChild(
        selectInput([{ value: "", label: t2("echarts.panel.label.positionDefault") }, ...positions.map((p) => ({ value: p.value, label: t2(p.labelKey) }))], state.position ?? "", (value) => commit({ position: value }))
      );
      group.appendChild(wrap);
    }
    if (has("distance")) group.appendChild(numberField("distance", state.distance));
    if (has("rotate")) group.appendChild(numberField("rotate", state.rotate));
    if (has("offset")) {
      let commitOffset2 = function() {
        const parse = (input, fallback) => {
          const text = input.value.trim();
          if (text === "") return 0;
          const value = Number(text);
          return Number.isFinite(value) ? value : fallback;
        };
        commit({ offset: [parse(inputX, current[0] ?? 0), parse(inputY, current[1] ?? 0)] });
      };
      var commitOffset = commitOffset2;
      const wrap = field(t2("echarts.panel.label.offset"));
      const row = el("div", "echarts-field-row");
      const current = state.offset ?? [0, 0];
      const inputX = textInput({ value: String(current[0] ?? 0), type: "number" }, () => commitOffset2());
      const inputY = textInput({ value: String(current[1] ?? 0), type: "number" }, () => commitOffset2());
      row.appendChild(inputX);
      row.appendChild(inputY);
      wrap.appendChild(row);
      group.appendChild(wrap);
    }
  }
  const styleKeys = ["fontSize", "fontWeight", "color", "backgroundColor", "borderColor", "borderWidth", "borderRadius", "padding"];
  if (styleKeys.some(has)) {
    group.appendChild(el("div", "echarts-label-sub", t2("echarts.panel.label.style")));
    if (has("fontSize")) group.appendChild(numberField("fontSize", state.fontSize));
    if (has("fontWeight")) {
      const wrap = field(t2("echarts.panel.labelLine.fontWeight"));
      wrap.appendChild(selectInput(fontWeightOptions(), state.fontWeight ?? "", (value) => commit({ fontWeight: value })));
      group.appendChild(wrap);
    }
    for (const key of ["color", "backgroundColor", "borderColor"]) {
      if (has(key)) group.appendChild(colorField(key, state[key]));
    }
    for (const key of ["borderWidth", "borderRadius", "padding"]) {
      if (has(key)) group.appendChild(numberField(key, state[key]));
    }
  }
  if (has("labelLine.show")) {
    group.appendChild(el("div", "echarts-label-sub", t2("echarts.panel.labelLine")));
    group.appendChild(
      checkboxField(t2("echarts.panel.labelLine.show"), state.labelLine.show === true, (checked) => commit({ labelLine: { show: checked } }))
    );
    if (has("labelLine.length")) {
      const wrap = field(t2("echarts.panel.labelLine.length"));
      wrap.appendChild(
        textInput(
          { value: state.labelLine.length === void 0 ? "" : String(state.labelLine.length), type: "number" },
          (raw) => commitLineNumber("length", raw)
        )
      );
      group.appendChild(wrap);
    }
    if (has("labelLine.length2")) {
      const wrap = field(t2("echarts.panel.labelLine.length2"));
      wrap.appendChild(
        textInput(
          { value: state.labelLine.length2 === void 0 ? "" : String(state.labelLine.length2), type: "number" },
          (raw) => commitLineNumber("length2", raw)
        )
      );
      group.appendChild(wrap);
    }
    if (has("labelLine.smooth")) {
      group.appendChild(
        checkboxField(t2("echarts.panel.labelLine.smooth"), state.labelLine.smooth === true, (checked) => commit({ labelLine: { smooth: checked } }))
      );
    }
  }
  return group;
}
function renderProperty(ctx) {
  return withTranslator(ctx.t, () => renderPropertyInner(ctx));
}
function renderPropertyInner(ctx) {
  if (!ctx.openExpression) throw new Error("[echarts] \u56FE\u8868\u5C5E\u6027\u9762\u677F\u9700\u8981\u5BBF\u4E3B\u63D0\u4F9B openExpression\uFF08\u5B57\u6BB5\u9009\u62E9\u4EC5\u652F\u6301\u8868\u8FBE\u5F0F\u5F39\u6846\uFF09");
  const element = ctx.element;
  const type = elementType(element);
  const def = getChartKindDefinition(type);
  const panelFields = resolveChartPanelFields(type);
  const has = (key) => panelFields.includes(key);
  const options = element.options;
  const widthMm = Number(options.width) || 0;
  const heightMm = Number(options.height) || 0;
  const limit = maxValueFields(def);
  const palettes = getChartPalettes();
  const fieldLabels = fieldLabelMap(ctx.fields);
  const allFields = ctx.fields ?? [];
  const sourceFields = allFields.filter((field2) => field2.fieldType === "list");
  const bound = String(options.chartDataSource ?? "");
  const prefixed = bound ? allFields.filter((field2) => field2.fieldKey.startsWith(`${bound}.`)) : [];
  const rowFields = prefixed.length > 0 ? prefixed : allFields.filter((field2) => field2.fieldType !== "list");
  const root = el("div", "echarts-property");
  const form = el("form", "pd-form");
  form.addEventListener("submit", (event) => event.preventDefault());
  root.appendChild(form);
  if (has("dataSource")) {
    const wrap = field(t2("echarts.panel.dataSourceTitle"));
    wrap.appendChild(fieldPicker(
      ctx,
      String(options.chartDataSource ?? ""),
      "options.chartDataSource",
      sourceFields,
      fieldLabels,
      (value) => commitOption(ctx, type, panelOption(element), { chartDataSource: value }),
      true
    ));
    form.appendChild(wrap);
  }
  if (has("categoryField")) {
    const wrap = field(t2("echarts.panel.categoryField"));
    wrap.appendChild(fieldPicker(
      ctx,
      String(options.chartCategoryField ?? ""),
      "options.chartCategoryField",
      rowFields,
      fieldLabels,
      (value) => commitOption(ctx, type, panelOption(element), { chartCategoryField: value })
    ));
    form.appendChild(wrap);
  }
  if (has("valueFields")) {
    const wrap = field(valueFieldsLabel(def, limit));
    const fieldsNow = readValueFields(element);
    fieldsNow.forEach((value, index) => {
      const row = fieldPicker(
        ctx,
        value,
        `options.chartValueFields.${index}`,
        rowFields,
        fieldLabels,
        (next) => {
          const list = readValueFields(element);
          list[index] = next;
          syncValueFields(ctx, type, list);
        }
      );
      if (fieldsNow.length > 1) {
        const remove = el("button", "pd-button small", "\u2212");
        remove.type = "button";
        remove.title = t2("echarts.panel.removeField");
        remove.addEventListener("click", () => syncValueFields(ctx, type, readValueFields(element).filter((_, i) => i !== index)));
        row.appendChild(remove);
      }
      wrap.appendChild(row);
    });
    if (fieldsNow.length < limit) {
      const add = el("button", "pd-button small", t2("echarts.panel.addField"));
      add.type = "button";
      add.addEventListener("click", () => syncValueFields(ctx, type, [...readValueFields(element), ""]));
      wrap.appendChild(add);
    }
    form.appendChild(wrap);
  }
  if (has("seriesField")) {
    const wrap = field(t2("echarts.panel.seriesField"));
    wrap.appendChild(fieldPicker(
      ctx,
      String(options.chartSeriesField ?? ""),
      "options.chartSeriesField",
      rowFields,
      fieldLabels,
      (value) => commitOption(ctx, type, panelOption(element), { chartSeriesField: value })
    ));
    form.appendChild(wrap);
  }
  if (has("bubble")) {
    form.appendChild(
      checkboxField(t2("echarts.panel.bubbleSize"), options.chartBubble === true, (checked) => {
        commitOption(ctx, type, panelOption(element), { chartBubble: checked });
      })
    );
  }
  if (has("title")) {
    const wrap = field(t2("echarts.panel.title"));
    wrap.appendChild(
      textInput(
        { value: String(asObject(panelOption(element).title).text ?? ""), placeholder: t2("echarts.panel.titleHint") },
        (value) => {
          const next = panelOption(element);
          next.title = { ...asObject(next.title), text: value };
          commitOption(ctx, type, next);
        }
      )
    );
    form.appendChild(wrap);
  }
  if (has("legend")) {
    const show = asObject(panelOption(element).legend).show !== false;
    form.appendChild(
      checkboxField(t2("echarts.panel.legend"), show, (checked) => {
        const next = panelOption(element);
        next.legend = { ...asObject(next.legend), show: checked };
        commitOption(ctx, type, next);
      })
    );
  }
  if (has("palette")) {
    const wrap = field(t2("echarts.panel.palette"));
    const select = el("select", "pd-select");
    for (const palette of palettes) {
      const optionEl = el("option");
      optionEl.value = palette.key;
      optionEl.textContent = palette.labelKey ? t2(palette.labelKey) : palette.label;
      select.appendChild(optionEl);
    }
    select.value = readPaletteKey(panelOption(element), palettes);
    select.addEventListener("change", () => {
      const palette = palettes.find((item) => item.key === select.value) ?? palettes[0];
      const next = panelOption(element);
      next.color = [...palette.colors];
      commitOption(ctx, type, next);
    });
    wrap.appendChild(select);
    form.appendChild(wrap);
  }
  if (has("label")) {
    form.appendChild(renderLabelGroup(ctx, type));
  }
  if (has("stack")) {
    const series = seriesList(panelOption(element));
    const stacked = series.some((item) => item.stack !== void 0 && item.stack !== null && item.stack !== "");
    form.appendChild(
      checkboxField(t2("echarts.panel.stack"), stacked, (checked) => {
        const next = panelOption(element);
        for (const item of seriesList(next)) {
          if (checked) item.stack = "total";
          else delete item.stack;
        }
        commitOption(ctx, type, next);
      })
    );
  }
  if (has("innerRadius")) {
    const wrap = field(t2("echarts.panel.innerRadius"));
    const radius = seriesList(panelOption(element))[0]?.radius;
    const inner = Array.isArray(radius) ? Number(String(radius[0] ?? "40%").replace("%", "")) || 40 : 40;
    wrap.appendChild(
      textInput({ value: String(inner), type: "number", min: 0, max: 90 }, (value) => {
        const next = panelOption(element);
        const series = seriesList(next);
        if (series[0]) series[0].radius = [`${clamp2(Number(value) || 0, 0, 90)}%`, "70%"];
        commitOption(ctx, type, next);
      })
    );
    form.appendChild(wrap);
  }
  if (has("padding")) {
    const wrap = field(t2("echarts.panel.paddingTRBL"));
    const padding = readFunnelPadding(panelOption(element), widthMm, heightMm);
    const row = el("div", "echarts-field-row");
    const sides = [
      { side: "top", title: t2("echarts.panel.paddingTop") },
      { side: "right", title: t2("echarts.panel.paddingRight") },
      { side: "bottom", title: t2("echarts.panel.paddingBottom") },
      { side: "left", title: t2("echarts.panel.paddingLeft") }
    ];
    for (const { side, title } of sides) {
      row.appendChild(
        textInput({ value: String(padding[side]), type: "number", min: 0, max: 60, title }, (value) => {
          const raw = Number(value);
          const next = Number.isFinite(raw) ? clamp2(raw, 0, 60) : FUNNEL_PADDING_DEFAULTS[side];
          const option = panelOption(element);
          const current = readFunnelPadding(option, widthMm, heightMm);
          commitOption(ctx, type, writeFunnelPadding(option, { ...current, [side]: next }));
        })
      );
    }
    wrap.appendChild(row);
    form.appendChild(wrap);
  }
  if (has("radius")) {
    const wrap = field(t2("echarts.panel.radius"));
    wrap.appendChild(
      textInput(
        { value: String(readRadarRadius(panelOption(element), widthMm, heightMm)), type: "number", min: 20, max: 100 },
        (value) => {
          const raw = Number(value);
          const next = Number.isFinite(raw) ? clamp2(raw, 20, 100) : RADAR_RADIUS_DEFAULT;
          commitOption(ctx, type, writeRadarRadius(panelOption(element), next));
        }
      )
    );
    form.appendChild(wrap);
  }
  if (has("gaugeRange")) {
    const wrap = field(t2("echarts.panel.minMax"));
    const series = seriesList(panelOption(element));
    const row = el("div", "echarts-field-row");
    row.appendChild(
      textInput({ value: String(Number(series[0]?.min ?? 0)), type: "number" }, (value) => {
        const next = panelOption(element);
        const list = seriesList(next);
        if (list[0]) list[0].min = Number(value) || 0;
        commitOption(ctx, type, next);
      })
    );
    row.appendChild(
      textInput({ value: String(Number(series[0]?.max ?? 100)), type: "number" }, (value) => {
        const next = panelOption(element);
        const list = seriesList(next);
        if (list[0]) list[0].max = Number(value) || 100;
        commitOption(ctx, type, next);
      })
    );
    wrap.appendChild(row);
    form.appendChild(wrap);
  }
  form.appendChild(el("p", "pd-hint", panelHint()));
  return root;
}
var CHART_ELEMENT_UI = defineElementUI({
  types: CHART_KINDS,
  renderCanvas,
  renderProperty,
  hasProperties: chartHasProperties,
  get group() {
    return t2("echarts.panel.group");
  },
  searchKeywords: SEARCH_KEYWORDS,
  styles: STYLES,
  i18nId: "echarts",
  locales: { "zh-CN": zh_CN_default.echarts, "en-US": en_US_default.echarts, "th-TH": th_TH_default.echarts }
});
var disposeHandle2;
function installChartCommonUI() {
  disposeHandle2?.();
  disposeHandle2 = registerElementUI(CHART_ELEMENT_UI);
  return disposeHandle2;
}
installChartCommonUI();
