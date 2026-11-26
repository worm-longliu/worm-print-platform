/** 可安装的官方工具（技能安装器 / 技能 / 插件市场安装器） */
export interface InstallTool {
  name: string
  desc: string
  command: string
}

/** 一个可单独复制的提示词模块 */
export interface PromptModule {
  id: string
  label: string
  prompt: string
}

export const TOOLS: InstallTool[] = [
  {
    name: 'worm-print-platform-integration',
    desc: '宿主集成规范：安装、设计器契约、字段、三条打印链路、故障排查',
    command: 'npx @worm-print-platform/skills worm-print-platform-integration',
  },
  {
    name: 'worm-print-platform-mcp',
    desc: '桌面 MCP 协作：实时画布读写、模板校验、预览与参考图比对',
    command: 'npx @worm-print-platform/skills worm-print-platform-mcp',
  },
  {
    name: '@worm-print-platform/marketplace',
    desc: '插件市场安装器：从 npm / GitHub / Gitee 安装单个插件',
    command: 'npx @worm-print-platform/marketplace install <插件名>',
  },
]

export const MODULES: PromptModule[] = [
  {
    id: 'skill-setup',
    label: '技能接入',
    prompt: `第 0 步：先装官方技能，再动手（未完成禁止改代码）
1. 在项目根目录安装宿主集成技能：
   npx @worm-print-platform/skills worm-print-platform-integration
   如需桌面实时画布协作，再装：
   npx @worm-print-platform/skills worm-print-platform-mcp
2. 完整阅读 .agents/skills/ 下对应技能的 SKILL.md 及 references/ 全部文档。
3. 先输出「已读规范确认」：逐个列出文件路径 + 与本任务相关的 3 条以上约束。
4. 阅读本项目的 AGENTS.md / README / 构建配置，确认宿主框架、构建器、包管理器。
5. 任一文档不存在或读不懂，先提问，禁止臆测 API。

可选参数：--dir <目录> 改安装位置，--repo <地址> 指定 GitHub / Gitee 源，
--force 覆盖已有技能。`,
  },
  {
    id: 'core-install',
    label: '安装核心包',
    prompt: `安装核心包（先锁定版本，再接入）
- 安装 @worm-print-platform/core、@worm-print-platform/canvas、
  @worm-print-platform/plugin-kit，三者精确锁同一版本（如 1.6.6），
  同号同批并提交 lockfile；不要只锁其中两个。
- 禁止引入 @worm-vue3-print/* 旧包名。
- 宿主形态按项目实际选择，不强制：
  * Vue 3 用官方门面 @worm-print-platform/canvas/vue3，免 isCustomElement、免引 CSS；
  * 原生自定义元素 <print-designer>：对象/函数赋 property，字符串开关走 attribute，
    事件用 CustomEvent 监听；
  * 无打包器用 @worm-print-platform/canvas/browser 的 UMD 产物 + dist/canvas.css。
- 样式：Shadow DOM 普通用法无需额外引 CSS；只有 light DOM 才引
  @worm-print-platform/canvas/style.css。
- 浏览器端静默打印 SDK 随 core 提供，从 @worm-print-platform/core/client 导入，无需单独安装。`,
  },
  {
    id: 'plugin-usage',
    label: '插件使用',
    prompt: `插件专属使用要求（import 即注册，不约束宿主技术栈）：
- 图表插件（@worm-print-platform/plugin-echarts，十类图表元素）：
  安装方式一（npm）：npm install @worm-print-platform/plugin-echarts
  安装方式二（市场）：npx @worm-print-platform/marketplace install echarts
  宿主按清单 import 入口即注册图表元素与素材台分组，无需额外调用。
  存量 @worm-print-platform/echarts 保留全部子路径，零改动可用。
- 数据源预览插件（@worm-print-platform/plugin-data-preview）：
  安装源：该包未发布 npm，只能从插件市场源码安装——
    npx @worm-print-platform/marketplace install data-preview
  源码地址：https://github.com/worm-longliu/worm-print-platform/tree/master/marketplace/plugins/data-preview
  Gitee 镜像：https://gitee.com/liulong_oschina/worm-print-platform
  安装后从 .worm-print/plugins/data-preview/dist/index.js 引入，import 即注册。
  宿主按需调用 openDataPreview({ data, fields, title, container, showFieldKey })
  并用自己的开关控制入口显隐；showFieldKey 控制中文名旁是否显示字段 key。
- 未安装的插件不要 import；装上后与打印包版本对齐并固化 lockfile。`,
  },
  {
    id: 'silent-print',
    label: '静默打印',
    prompt: `静默打印（桌面客户端链路）要求：
- 前置：工位机运行桌面打印客户端（仅监听 127.0.0.1，默认端口 17521 起）；
  浏览器侧 SDK 随 core 提供，从 @worm-print-platform/core/client 导入 PrintClient，无需单独安装。
- 推荐链路：浏览器内用 renderHtmlPages + browserCodeRenderer 预渲染，再调
  client.printHtml(rendered, { printerName, copies }, templateName)；
  客户端只出纸，core 升级无需重发客户端。
- 兼容链路：client.print(templateJson, printData, options, templateName) 由客户端本地渲染。
- 连接与枚举：client.onStatusChange 监听状态，client.connect() 探测握手，
  client.listPrinters() 枚举打印机；客户端未启动报 CLIENT_NOT_RUNNING。
- 连续纸（paperSize: CONTINUOUS）无需传纸高，由客户端布局探针推导。
- printHtml 的 options 仅允许 printerName / copies / paperName / color / pageRanges / timeoutMs；
  传 paperSize / margins / landscape 会被以 INVALID_REQUEST 拒绝；HTML 载荷上限 20MB。
- 客户端单任务串行，并发返回 BUSY，由宿主端排队重试；业务打印配置由宿主维护，客户端不持久化。`,
  },
  {
    id: 'business-example',
    label: '业务接入示例',
    prompt: `用一段提示词生成完整业务接入示例（Vue 3 宿主，浏览器打印链路）：
- 先按「技能接入」「安装核心包」装好规范与依赖；图表类场景再装 echarts。
- 复用宿主现有请求封装与 UI 组件库，不引额外 UI 依赖。
- 建两张表：sys_print_template（elements 存设计器 JSON 字符串，不拆表）、
  sys_print_business_field；同一业务类型仅一个默认模板，删默认时提升同类型另一条。
- 建注册表：每种模板类型维护 fields（PrintBusinessField[]）、sampleData、
  createTemplate()（深拷贝，含字段绑定与示例数据）。
- 生成四个页面：① 模板管理列表页（名称/类型查询 + 表格 + 分页 + 新建/编辑/删除/默认）；
  ② 设计器页（PrintDesigner 接 fields/design-data，save 提交 elements，preview 打开预览）；
  ③ 业务打印入口（按类型选模板 → 取 {templateJson, printData, baseUrl}）；
  ④ 预览弹窗（PrintHtmlPreview 渲染 + 打印按钮调 print()）。
- 后端按宿主风格实现 page/save/update/remove/get/listTypes/listFields 与设计器聚合初始化。
- 验收：类型检查/构建通过；保存 → 列表回填 → 再打开设计器能加载 → 预览渲染出真实数据 → 浏览器打印。`,
  },
  {
    id: 'install-fallback',
    label: '安装与离线回退',
    prompt: `安装与离线回退：
- 插件市场安装器：npx @worm-print-platform/marketplace install <插件名>，
  支持 npm / GitHub / Gitee 三源，缺省取最新稳定版。
- 技能默认装到 .agents/skills/<技能名>/；改目录用 --dir，指定源用 --repo，覆盖用 --force。
- 无 npm / git 环境时，从 GitHub 或 Gitee 仓库的 skills/<技能名>/ 目录手动下载，
  放到 AI 工具的技能目录（.agents/skills / .qoder/skills / .claude/skills）后重载。
- 退出码：0 成功，2 参数错误，3 目录已存在，4 技能未找到，5 仓库操作失败，6 缺少 git。`,
  },
]
