# 表达式驱动的元素动态显隐：可行性评估

> 日期：2026-11-25
> 状态：评估完成，待拍板（未实施，未改代码）
> 范围：只评估可行性、方案权衡与落点；表格动态列作为同族独立项列出

## 1. 结论摘要

**可行，但不是「接一根线」的改动。** 当前设计器确实没有任何基于表达式的元素级显隐能力，连静态 `visible` 字段都是「模型里有、契约放行、画布挂一个无样式支撑的 class、出纸端完全不消费」的空壳。但底层表达式引擎已经具备三元、逻辑比较、`IF()`、对象字面量等全部所需语义，缺的只是**元素级条件字段 + 绑定期过滤 + 设计态接线 + 三端口径统一**。

推荐路径：**契约新增 `visibleWhen`（纯表达式），在 `bindData` 阶段过滤元素**。因为测量趟、分页、最终 HTML 都消费过滤后的 `bound`，隐藏元素会自动退出占位与分页预算，不需要改分页引擎；批量打印每份独立 `bindData`，天然按份生效。

必须先解决的前置问题：**设计端与出纸端函数注册表不一致**（设计端多 `FORMAT/SUBSTR/NOW/PAD/REPLACE/JSON` 六个函数）。现在无所谓，一旦条件在两端分别求值，就会出现「设计器看得见、打印没了」。

## 2. 现状证据

### 2.1 「预设元素」由三套描述符 + 一张能力表共同定义

仓库不存在名为 `preset element` 的单一类型，「预设元素」实际是：

| 层 | 文件 | 职责 |
|---|---|---|
| canvas 元数据 | `packages/canvas/src/core/element-definitions.ts:38-79` `ElementDefinition` / `BUILTIN_ELEMENT_DEFINITIONS` | 素材卡、图标、图层名、属性分组；内置 13 项（`html`/`pageNumber` 的 `material:false`） |
| core 运行时 | `packages/core/src/designer/element-plugin-registry.ts:43-70,116-131` `ElementPluginKind` / `PrintElementPlugin` | 类型、能力位、默认值、`binding`/`render`/`designer` 钩子 |
| plugin-kit UI | `packages/plugin-kit/src/types.ts:64-83` `ElementUI` + `registry.ts` | 类型清单、`renderCanvas`/`renderProperty`、搜索关键词 |
| 语义兜底 | `packages/core/src/designer/element-capabilities.ts:19-40,100-212` `ElementCapabilities` | 区限制、旋转限制、绑定声明、出厂默认 |

ECharts 十类图表是插件实例：`marketplace/plugins/echarts/src/plugin.ts:45-65` + `kinds.ts:32-103` + `ui.ts:766-776`。

**推论**：通用字段加在 `ElementOptions` 上能一次性覆盖内置 13 种与所有插件元素，不需要逐类型改描述符。

### 2.2 元素属性模型与现有「显隐」字段

`packages/core/src/designer/types.ts:301-474` `ElementOptions` 是序列化到 JSON 的属性全集：

- 几何：`left/top/width/height`、四边 `margin*`
- 外观：`fontSize/fontWeight/fontFamily/color/backgroundColor/textAlign/verticalAlign/lineHeight/textFit/wordWrap/keepLineBreaks`
- 分页层级：`repeatOnEveryPage`、`fixed`、`locked`、`zIndex`、`groupId`
- 表达式绑定：`formatter`、`src`、`dataSource`、`exampleValue`
- **可见性**：`visible?: boolean`（346-347，注释「图层面板切换」）
- **条件样式（预留未接线）**：`styler?: string`、`rowStyler?: string`（440-441）

`visible` 的真实状态：

1. `canvas/src/shell/elements.ts:322` 仅挂 `o.visible === false ? 'hidden' : ''`；跨全仓 CSS 搜索确认**没有 `.print-element.hidden` 的样式规则**，所以这个 class 目前只是无视觉效果的标记。
2. `canvas/src/shell/panels.ts:214-255` 图层面板只有选中/图标/名称/区标签/z 值/层级与编组按钮，**没有眼睛图标**；`PARITY.md:122` 记载 `visible` 由 dead listener 引用，权威实现未接写链路。
3. `core/src/render/html-generator.ts` 全文 11 处 `visible` 全是 CSS `overflow:visible`，`renderElement` 从不读 `opts.visible`，没有 `if (!opts.visible) return ''`，也不输出 `display:none`。
4. `core/src/render/data-binder.ts` 全文 **0 处** `visible`。
5. `contract/src/option-meta.ts:45` 把它登记为 `bool`，`schema/element.ts` 由 `OPTION_KEYS` 派生，所以契约放行，但渲染端无行为。

`styler`/`rowStyler` 同样只是「合法键」：契约 `option-meta.ts:50` 登记、MCP `tools.ts:122-125` 校验提示、双击编辑目标，**没有任何生产代码求值**。

契约里没有 `condition/visibleWhen/showWhen/hiddenWhen/if/display/hidden` 等条件字段。`schema/template.ts:114` 与 `schema/element.ts:127` 都有 `.catchall(z.unknown())`，手写字段不会被 schema 判错，但 `validate.ts:261-270` 的 `KNOWN_OPTION_KEYS` 会报 `unknownKeys`，且渲染端不会有任何行为。

### 2.3 表达式引擎能力

底层位于 `packages/core/src`：`lexer.ts` → `parser.ts` → `evaluator.ts` → `template-parser.ts`，门面 `index.ts:8-30` `TemplateEngine`（支持 `registerFunction`）。

- 分隔符是**单花括号** `{expr}`，不是 `{{ }}`；`\{` 可转义。
- 语法：三元 `cond ? a : b`、`||`/`&&`、`==/!=/===/!==`、比较、`+ - * / %`、一元 `! - +`、成员访问、函数调用、数组/对象字面量；标识符允许中文（`{姓名}`）。
- 安全边界：禁赋值、多语句、箭头函数、保留字、原型链属性；只允许 `Math`/`Number`/`String`/`Boolean`/`parseInt`/`parseFloat`/`isNaN`；拒绝 `window/document/globalThis`。
- `+` 走十进制精确运算，避免浮点噪声。
- `IF(cond, trueVal, falseVal)` 在 `functions/format.ts:115-119`，**只能返回值，不能改变渲染结构**。
- `SUM/AVG/COUNT/MIN/MAX` 不是注册函数，是 `expression-eval.ts:118-126` 的正则预处理，依赖 `ctx.rows`。

**两套上层封装，函数集不一致**：

| 端 | 文件 | 额外函数 |
|---|---|---|
| 设计端 | `designer/utils/expression-eval.ts:27-56` | 比出纸端多 `FORMAT/SUBSTR/NOW/PAD/REPLACE/JSON` |
| 出纸端 | `render/expression-eval.ts:52-72` | 仅 `MONEY/DATE/UPER/IF/CONCAT/IFEMPTY/LEN/ADD/SUB/MUL/DIV/ROUND/ROUNDUP/CEIL/ROUNDDOWN/FLOOR/ROUNDBANK` |

### 2.4 渲染管线与求值时机

`packages/core/src/print/pipeline.ts`：

- `prepareWithSession`（65-156）分流单份/批量/拼版
- `prepareSingleWithSession`（215-287）：
  1. `bindData`（220）——**表达式主求值时机**
  2. 测量趟 HTML（227-229）→ `session.measure()`（230）→ `applyTextFitSizes`（233）
  3. `paginate(bound, measurements)`（234）——消费绑定后的模板
  4. 最终趟 HTML（237-240）——页码相关 `rawFormatter` 在此按页重算
- 输出是完整 HTML 字符串（含 `@page`、`@font-face`、绝对定位元素），由浏览器/Playwright 测量与出 PDF。

`bindData`（`data-binder.ts:28-66`）深拷贝模板后对 `header/footer/elements` 逐元素 `bindElement`（68-132）：

- `formatter` 求值失败整段回落 `exampleValue`/默认值
- 引用页码的表达式标记 `rawFormatter`，延迟到最终趟
- `src` 求值 + 拼 baseUrl
- 表格 `bindTableData`、流式列表 `bindFlowListData`
- 插件 `binding.bind(options, data)` 扩展

上下文 `data = { ...resolveSystemVariables(), ...printData }`，系统变量含 `printDate/printTime/pageIndex/totalPages`。表格行作用域 `{ ...data, ...item, [key]: item }`，聚合上下文 `{ rows, ...data }`。

设计器预览用 `designData[0]` 或内置 `DEFAULT_DEMO_DATA`（`canvas/src/print-designer.ts:220-227,409`、`shell/elements.ts:215-218`），**不是真实业务数据**。客户端（`clients/client/src/main/template-renderer.ts`）与 render 服务（`services/render`）共用同一套 core 求值。

### 2.5 同族问题：表格动态列

`docs/gitee-issues-reproduction.md:24-42` 已确认「表格动态列」完全未实现：`TableCell`（`types.ts:209-265`）无显隐字段，列集合由 `tableColWidths` 长度隐式定义；`html-generator.ts:836-838,922-923` 单元格过滤只处理合并、`colgroup` 全量输出；属性台只有「列宽」，右键只有物理增删列；全仓无 `visibleWhen/showWhen/hiddenWhen/columnHidden`。当前唯一规避路径是多模板（`core/src/print/multi-template.ts`）。

## 3. 可行性判断

**结论：可行，工程风险集中在三处。**

1. **引擎不是瓶颈**：三元、比较、`IF()`、对象字面量、安全求值都已具备；条件显隐是「接线问题」而非「造轮子问题」。
2. **出纸侧落点清晰**：在 `bindData` 的元素遍历处过滤，后续测量/分页/最终 HTML 自动基于剔除后的元素集，**分页占位重算免费获得**；每份数据独立绑定，批量天然按份生效。
3. **真正的风险**：
   - 三端函数集不一致 → 必须在实现前统一，否则「设计器与打印不一致」；
   - 条件依赖 `pageIndex`/`totalPages` 时绑定期无值 → 必须禁用或设计延迟剔除；
   - 隐藏元素与 `repeatOnEveryPage`/`fixed`/跟随区成员/`collectFollowMemberIds` 的交互需测试覆盖。

## 4. 方案对比

### 4.1 方案 A：契约扩展 + 绑定期过滤（推荐）

在 `ElementOptions` 加 `visibleWhen?: string`（纯表达式，如 `amount > 0`），`bindData` 的元素遍历先按 `safeEval(visibleWhen, data)` 求值，falsy 则剔除；设计态属性台加输入框，画布按 `designData` 求值展示。

- **优点**：通用覆盖内置 13 种 + 插件元素；复用现有绑定上下文；分页自动重算；批量按份生效；与设计器现有 `formatter` 心智一致。
- **代价**：前置统一三端函数集；需设计「设计态是否真隐藏」的产品口径；不能依赖页码。

### 4.2 方案 B：接线 `styler` 做 CSS 隐藏

复用已有的 `styler`/`rowStyler`，在 `html-generator` 输出元素样式时求 `styler`，得到 `{display:'none'}` 则隐藏。

- **优点**：复用已登记字段，契约改动最小；语义可扩展为「条件样式」。
- **代价**：用户要写对象字面量表达式，门槛高；CSS 隐藏不自动退出分页占位，易留空白；语义混杂。更适合作为独立「条件样式」特性。

### 4.3 方案 C：宿主侧模板预处理（零核心改动）

宿主提交前用 core 的 `evaluateTemplate` 筛掉元素，再送 `prepareDocument`。

- **优点**：立刻可用，不改设计器/契约。
- **代价**：设计器不可视、不可配；每个宿主重复实现；设计态与出纸态割裂。仅适合过渡或 demo。

### 4.4 表格动态列（同族独立项）

需在 `bindTableData` 阶段过滤列、收缩 `tableColWidths`、同步 `colgroup` 与分页高度，属性台/右键加列条件 UI。对应 Gitee IKWHUY，建议作为方案 A 的后续独立项，不与元素级混在一个改动里。

## 5. 推荐方案的实施落点（分阶段）

**阶段 0 · 前置统一**
- 把设计端 6 个额外函数补到 `render/expression-eval.ts`，或让两端共用同一函数表；增加三端一致性测试。

**阶段 1 · 契约与模型**
- `core/src/designer/types.ts` `ElementOptions` 加 `visibleWhen?: string`
- `contract/src/option-meta.ts` + `schema/element.ts` 登记为新键（string）
- `core/src/designer/utils/property-search.ts` 登记提示与搜索关键词

**阶段 2 · 出纸端**
- `render/data-binder.ts:42-48` 元素遍历改为「先过滤再绑定」；新增条件求值（建议 `safeEval` 直接求纯表达式并 `Boolean()` 归一）
- 校验禁止 `pageIndex/totalPages` 出现在 `visibleWhen`（或走延迟剔除的复杂路径）

**阶段 3 · 设计态**
- `canvas/src/shell/property-panel.ts` 「高级」分组加表达式输入框
- `canvas/src/shell/elements.ts` 按 `designData` 求值决定展示（隐藏 / 置灰标记，见待拍板项）
- `binding-registry` 视情况登记为可绑定字段

**阶段 4 · MCP 与文档**
- `packages/mcp/src/tools.ts` `print_check_expression` 支持 `visibleWhen`
- `skills/worm-print-platform-mcp/references/template-schema.md` 增字段说明
- `core` / `canvas` README 与 CHANGELOG 同步

**阶段 5 · 测试**
- 同一模板同一数据在三端渲染结果一致
- 隐藏元素不出现在测量 DOM、最终 DOM、分页布局
- 下方元素位置正确上移，跟随区/`repeatOnEveryPage`/`fixed` 行为正确
- 批量每份独立生效
- 存量模板零行为变化；非法/缺字段表达式容错（建议「求值失败不隐藏」）

## 6. 风险与约束

| 风险 | 应对 |
|---|---|
| 三端函数集不一致 | 阶段 0 前置统一，作为硬门槛 |
| 页码依赖条件 | 绑定期无法求值；明确禁用并校验，或单列延迟方案 |
| 隐藏元素占位与跟随区 | 过滤后 `paginate`/`collectFollowMemberIds` 自动重算，需测试锁住 |
| 设计态求值数据源 | `designData` vs `DEFAULT_DEMO_DATA` 会导致用户困惑，需定口径 |
| 存量兼容 | 新增可选字段，缺省等价于「永远显示」；禁止复用 `visible` 语义 |
| 插件元素 | 过滤后插件 `binding.bind` 与 SSR 渲染器不会被调用，符合预期；需插件测试 |
| 非布尔求值结果 | `Boolean()` 归一；求值异常按「显示」处理，避免误隐藏 |

## 7. 待用户拍板的问题

1. **字段语法**：`visibleWhen: 'amount > 0'`（纯表达式 + `safeEval`，推荐）还是 `visibleWhen: '{amount > 0}'`（模板串 + `evaluateTemplate`）？推荐前者：语义清晰、返回布尔、可用 `IF()`。
2. **设计态展示**：按 `designData` 真隐藏（所见即所得，但编辑时元素可能「消失」），还是仅置灰标记不真隐藏（编辑友好，但预览与出纸不一致）？推荐「按数据求值 + 显式预览开关」。
3. **范围**：只做元素级，还是同时做表格列级（Gitee IKWHUY）？建议分两期。
4. **函数集统一策略**：补齐出纸端 6 个函数（推荐），还是限制条件表达式只能用两端交集函数？
5. **隐藏元素是否保留在图层面板**：建议保留并标记，避免用户误以为元素被删除。

## 8. 验收口径

- 三端（浏览器预览 / 服务端 PDF / 客户端静默打印）对同一模板与数据产出一致的显隐结果。
- 被隐藏元素不进入测量 DOM、最终 DOM 与分页布局；其下方元素位置正确上移。
- 批量打印中每份依自身数据独立显隐。
- 契约校验识别新键；手写旧字段仍按 `unknownKeys` 诊断。
- 既有模板与元素行为零变化。
- `npm run build`、`npm test` 及 render workspace 测试通过。

## 9. 参考

- `docs/gitee-issues-reproduction.md:24-42`（动态列 Issue 与最小修复落点）
- `skills/worm-print-platform-mcp/references/template-schema.md:61-91`（元素类型与通用 options）
- `packages/canvas/PARITY.md:84,122`（可见性口径与 dead listener）
