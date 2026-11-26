# 打印设计器集成提示词（Vue 3 宿主）

把下面整段复制给你的 AI 编程工具（opencode / Claude Code / Codex 等），按其要求执行。方括号 `[...]` 处按你的项目情况填写或勾选。

---

```
请把打印设计器接入到我的项目中。先做第 0 步门控，未完成禁止改代码。

## 第 0 步：门控（先读规范，再动手）
1. 完整阅读打印设计器集成技能文档：SKILL.md 及 references/ 下
   installation.md、integration-api.md、host-integration-guide.md、troubleshooting.md。
2. 先输出「已读规范确认」：逐个列出文件路径 + 与本任务相关的 3 条以上约束。
3. 阅读本项目的 AGENTS.md / README / 构建配置，确认宿主框架、构建器、
   包管理器、请求封装与 UI 组件库。
4. 任一文档不存在或读不懂，先提问，禁止臆测 API。

## 集成目标
- 安装方式：NPM 包（不要用 file: / 源码别名 / 浏览器直挂）
- 宿主形态：Vue 3 正式门面 @worm-print-platform/canvas/vue3
- 打印链路：A 浏览器打印（如要 B 服务端 PDF 或 C 静默打印，先说明再补）
- 版本：四个打印包精确锁 1.6.6，core / canvas / plugin-kit / echarts 同号同批，
  提交锁文件；不要只锁其中两个版本；禁止引入 @worm-vue3-print/* 旧包名。

## 插件依赖范围（先勾选，再安装）
必选（任何场景都要）：
  [ ] @worm-print-platform/core@1.6.6      —— 表达式、同构渲染
  [ ] @worm-print-platform/canvas@1.6.6    —— 设计器权威实现
  [ ] @worm-print-platform/plugin-kit@1.6.6 —— canvas 运行时自带，显式声明避免版本漂移
图表 / 体检报告 / 数据可视化类必选：
  [ ] @worm-print-platform/echarts@1.6.6   —— 从 @worm-print-platform/echarts/ui import 即注册
                                              图表元素（barChart / lineChart 等）
可选（按业务场景勾选）：
  [ ] @worm-print-platform/plugin-data-preview（市场 id 为 data-preview，不单独发 npm；
      需要时执行 npx @worm-print-platform/marketplace install data-preview --force）
不需要就不要装；装上就必须同号锁定，并在 lockfile 中固化。

## Vue 3 门面接入要点
- 组件从 @worm-print-platform/canvas/vue3 导入 PrintDesigner / PrintHtmlPreview，
  类型 PrintBusinessField / TemplateData 也从同一子路径 import type。
- 无需 isCustomElement 配置、无需引 CSS（门面组件自行处理样式）。
- PrintDesigner props：initial-template / fields / design-data / is-edit /
  upload-image / show-help / show-preview / show-save；
  事件 save(json: string) / preview()（无载荷）；
  ref 暴露 getTemplateJson()（返回对象）、validateTemplate()、getGeometryWarnings()。
- PrintHtmlPreview props：template-json / print-data / base-url；
  事件 rendered / error；ref 暴露 print() / rerender()。
- 模板 JSON（elements）与宿主元信息分开存储；elements 存 JSON 字符串，不拆表。
- 不使用文档外的组件方法/事件（不存在 back 事件、setTemplateMeta 方法）。

## 数据库表设计（PostgreSQL；MySQL 用等价类型改写）
复用平台既有两表，不新建表；如项目没有则按下面 DDL 建。注意 is_default 是
平台存量列名，新建业务表请按规范改用 default_flag。

CREATE TABLE IF NOT EXISTS sys_print_template (
    id            BIGINT PRIMARY KEY NOT NULL,
    name          VARCHAR(255),
    business_type VARCHAR(255),
    paper_config  VARCHAR(255),
    elements      TEXT,
    remark        TEXT,
    is_default    BOOLEAN DEFAULT false,
    tenant_id     BIGINT NOT NULL,
    deleted       BOOLEAN NOT NULL DEFAULT false,
    create_time   TIMESTAMP NOT NULL DEFAULT NOW(),
    update_time   TIMESTAMP NOT NULL DEFAULT NOW(),
    creator_id    BIGINT,
    updater_id    BIGINT,
    deleted_time  TIMESTAMP
);
COMMENT ON TABLE sys_print_template IS '打印模板元信息（elements 存设计器 JSON 字符串）';
COMMENT ON COLUMN sys_print_template.elements IS '设计器 getTemplateJson() 的 JSON 字符串';
COMMENT ON COLUMN sys_print_template.is_default IS '是否该业务类型默认模板(TRUE=是 FALSE=否)';
COMMENT ON COLUMN sys_print_template.deleted IS '逻辑删除(FALSE=未删除 TRUE=已删除)';

CREATE TABLE IF NOT EXISTS sys_print_business_field (
    id           BIGINT PRIMARY KEY NOT NULL,
    business_type VARCHAR(255),
    field_key    VARCHAR(255),
    field_label  VARCHAR(255),
    field_type   VARCHAR(255),
    sort_order   INTEGER DEFAULT 0,
    tenant_id    BIGINT NOT NULL,
    deleted      BOOLEAN NOT NULL DEFAULT false,
    create_time  TIMESTAMP NOT NULL DEFAULT NOW(),
    update_time  TIMESTAMP NOT NULL DEFAULT NOW(),
    creator_id   BIGINT,
    updater_id   BIGINT,
    deleted_time TIMESTAMP
);
COMMENT ON TABLE sys_print_business_field IS '打印业务字段元数据';
COMMENT ON COLUMN sys_print_business_field.field_type IS '字段类型；list=明细表数据源';
COMMENT ON COLUMN sys_print_business_field.deleted IS '逻辑删除(FALSE=未删除 TRUE=已删除)';

-- 同一业务类型（多租户再加 tenant_id）仅一个默认模板
CREATE UNIQUE INDEX IF NOT EXISTS uk_print_template_default
    ON sys_print_template (business_type, tenant_id) WHERE is_default = TRUE AND deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_print_template_business
    ON sys_print_template (business_type) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_print_field_business
    ON sys_print_business_field (business_type) WHERE deleted = FALSE;

规则：business_type 存模板类型枚举 value；每种类型可有多条实际模板适配不同业务场景；
删除默认模板时把同类型另一条提升为默认；elements 必须是 JSON 字符串，不能留空
（新建时按模板类型用预置版式写入，版式含字段绑定与示例数据；体检报告类型包含图表元素）。

## 模板类型枚举（按你的业务替换 value/label，禁止照搬业务域枚举）
参考 5 个通用值：express / label / receipt / invoice / healthReport。
每类在前端注册表里维护三样东西：字段树 fields（PrintBusinessField[]）、
示例打印数据 sampleData（与字段路径对应）、初始模板 createTemplate()。
本 demo 的默认值取自打印平台 demos/apps/vue3 官方示例库，映射为：
express→express-waybill（快递电子面单）、label→weight-label（称签打印）、
receipt→thermal-receipt（零售小票）、invoice→payment-request（付款申请单）、
healthReport→health-report（健康体检报告，自带 barChart/lineChart 且为多页模板）。
官方样本以本地 TS 数据文件交付，运行时不依赖打印平台仓库；createTemplate()
必须返回深拷贝；接入自己的项目时替换为你的业务示例即可，不要照搬这些业务数据。

## 后端契约（按宿主现有代码风格实现）
- 响应包裹：ApiResult<T> = { ret, msg, data }；分页 PageResult<T> =
  { records, totalRow, size, current, pages }；分页请求 PageParam = { current, size }。
- 统一 POST + @RequestBody；动作词 page / save / update / remove / get / list。
- 模板管理：分页列表（只返回元信息，不带 elements）、新建、更新、详情、
  删除（逻辑删除 + 默认提升）、类型字典、默认模板查询/设置。
- 设计器初始化聚合：一次返回 { template, fields, printData }。
- 渲染数据组装（链路 A 核心）：按模板 id 产出
  { templateJson: Object, printData: Object|Object[], baseUrl?: string }，
  其中 templateJson 是 elements 的 JSON.parse 结果。

## 前端五个必备片段（复用项目现有请求封装与 UI 组件库，不引额外 UI 依赖）
1. 模板管理列表页：查询（名称/类型）+ 表格（名称/类型/备注/默认/操作）+ 分页。
2. 新建/编辑弹窗：元信息表单 + 按模板类型用预置版式（含字段绑定与示例数据）序列化写入 elements；体检报告类型包含图表元素。
3. 设计器页：PrintDesigner 接 fields / design-data / upload-image，
   save 事件提交 elements，preview 事件打开预览。
4. 业务打印入口：按类型选模板 → 取 {templateJson, printData, baseUrl} → 打开预览。
5. 预览弹窗：PrintHtmlPreview 同构渲染 + 底部打印按钮调 print()。
所有 API 调用检查 res.ret，else 分支 ElMessage.error(res.msg)。

## 验收标准
- 类型检查 / 构建通过。
- 设计器保存模板 JSON → 列表回填 elements → 再次打开设计器能正确加载。
- 最小链路跑通：保存 → 预览渲染出含真实业务数据的页面 → 浏览器打印对话框。
- 若勾选 echarts：体检报告类模板的柱状图/折线图可见。
- 不使用文档之外的组件方法/事件。
```

---

本 demo 的完整可运行参考见 `src/`（API 层、注册表、MSW 模拟、列表页、设计器页、预览弹窗）。
