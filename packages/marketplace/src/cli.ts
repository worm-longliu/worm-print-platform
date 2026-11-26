#!/usr/bin/env node
import { realpathSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { installPlugin, removePlugin } from './install.js'
import { BUNDLED_CATALOG } from './catalog.generated.js'
import { localize } from './localize.js'
import { validateIndex } from './validate-index.js'
import {
  MarketError,
  type InstallOptions,
  type MarketIndex,
  type MarketIndexEntry,
  type MarketMetadataDecl,
  type MarketSource,
  type PluginType,
} from './types.js'

declare const PLUGIN_MARKETPLACE_VERSION: string
const VERSION = typeof PLUGIN_MARKETPLACE_VERSION !== 'undefined'
  ? PLUGIN_MARKETPLACE_VERSION
  : '1.6.6'

const SOURCES = new Set(['npm', 'github', 'gitee', 'auto', 'local'])
const PLUGIN_TYPES = new Set(['element', 'functional', 'export'])
const VALUE_FLAGS = new Set([
  '--source', '--dir', '--repo', '--index', '--type',
  '--category', '--label', '--search', '--locale', '--sort',
])
const USAGE = `用法: worm-print-marketplace <命令> [选项]

命令:
  list                       列出内置索引中的插件（可按类型/分类/标签/关键词筛选）
  validate                   校验内置索引或用 --index 指定的索引文件
  install <名称>[@版本]      安装单个插件（缺省版本 = 最新稳定版）
  remove <名称>              卸载插件

选项:
  --source npm|gitee|github|auto   安装来源，默认 auto（npm → Gitee → GitHub）
  --dir <路径>                     插件根目录，默认 .worm-print/plugins
  --repo <路径或URL>               本地市场目录或自定义 git 仓库地址
  --force                         已存在时覆盖安装
  --index <路径>                   validate 校验的索引文件（缺省用内置索引）
  --type element|functional|export list 按插件类型筛选
  --category <id>                  list 按分类筛选
  --label <id>                     list 按标签筛选
  --search <文本>                  list 按标识/名称/标题/描述搜索
  --locale <bcp47>                 list 展示语言，默认 zh-CN
  --sort <排序键>                  list 按索引声明的排序键排序
  --json                           list 输出结构化 JSON
  -h, --help                      显示帮助
  -v, --version                   显示版本`

export interface ParsedArgs {
  command?: 'list' | 'validate' | 'install' | 'remove'
  name?: string
  version?: string
  source: MarketSource | 'auto'
  dir?: string
  repo?: string
  index?: string
  type?: PluginType
  category?: string
  label?: string
  search?: string
  locale?: string
  sort?: string
  json: boolean
  force: boolean
  help: boolean
  helpVersion: boolean
}

export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {
    source: 'auto', json: false, force: false, help: false, helpVersion: false,
  }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '-h' || arg === '--help') { result.help = true; continue }
    if (arg === '-v' || arg === '--version') { result.helpVersion = true; continue }
    if (arg === '--force') { result.force = true; continue }
    if (arg === '--json') { result.json = true; continue }
    if (VALUE_FLAGS.has(arg)) {
      const value = argv[++i]
      if (!value) throw new MarketError('BAD_ARGUMENT', `${arg} 缺少值`)
      if (arg === '--source') {
        if (!SOURCES.has(value)) throw new MarketError('BAD_ARGUMENT', `不支持的来源（--source）：${value}`)
        result.source = value as MarketSource | 'auto'
      } else if (arg === '--dir') result.dir = value
      else if (arg === '--repo') result.repo = value
      else if (arg === '--index') result.index = value
      else if (arg === '--type') {
        if (!PLUGIN_TYPES.has(value)) throw new MarketError('BAD_ARGUMENT', `不支持的插件类型（--type）：${value}`)
        result.type = value as PluginType
      } else if (arg === '--category') result.category = value
      else if (arg === '--label') result.label = value
      else if (arg === '--search') result.search = value
      else if (arg === '--locale') result.locale = value
      else if (arg === '--sort') result.sort = value
      continue
    }
    if (arg.startsWith('-')) throw new MarketError('BAD_ARGUMENT', `未知选项：${arg}`)
    if (!result.command) {
      if (arg === 'list' || arg === 'validate' || arg === 'install' || arg === 'remove') result.command = arg
      else throw new MarketError('BAD_ARGUMENT', `未知命令：${arg}`)
      continue
    }
    if (!result.name) {
      const at = arg.lastIndexOf('@')
      if (at > 0) {
        result.name = arg.slice(0, at)
        result.version = arg.slice(at + 1)
      } else {
        result.name = arg
      }
    }
  }
  return result
}

export interface ListOptions {
  type?: PluginType
  category?: string
  label?: string
  search?: string
  locale?: string
  sort?: string
}

/** 缺 type 时按 spec §5.3 从 exportFormats / kinds 推断。 */
function resolveType(plugin: MarketIndexEntry): PluginType {
  if (plugin.type) return plugin.type
  if (plugin.exportFormats.length) return 'export'
  if (plugin.kinds.length) return 'element'
  return 'functional'
}

/** 按筛选条件过滤并按可选排序键排序；缺值排最后，保持原数组顺序稳定。 */
export function filterAndSortPlugins(index: MarketIndex, opts: ListOptions): MarketIndexEntry[] {
  const search = opts.search?.trim().toLowerCase()
  const matches = index.plugins.filter(plugin => {
    if (opts.type && resolveType(plugin) !== opts.type) return false
    if (opts.category && plugin.metadata?.category !== opts.category) return false
    if (opts.label && !plugin.metadata?.labels?.includes(opts.label)) return false
    if (search) {
      const haystack = [
        plugin.uniqueId ?? plugin.id, plugin.id, plugin.name,
        ...Object.values(typeof plugin.title === 'string' ? {} : plugin.title ?? {}),
        ...Object.values(typeof plugin.description === 'string' ? {} : plugin.description ?? {}),
      ].join(' ').toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })

  if (!opts.sort) return [...matches]
  const order = index.metadata?.sortKeys?.[opts.sort]?.order ?? 'asc'
  const direction = order === 'desc' ? -1 : 1
  return [...matches].sort((a, b) => {
    const av = a.metadata?.sortKeys?.[opts.sort!]
    const bv = b.metadata?.sortKeys?.[opts.sort!]
    if (av === null || av === undefined) return bv === null || bv === undefined ? 0 : 1
    if (bv === null || bv === undefined) return -1
    return (av - bv) * direction
  })
}

const BUILTIN_TYPE_NAMES: Record<PluginType, { 'zh-CN': string; en: string }> = {
  element: { 'zh-CN': '元素插件', en: 'Element' },
  functional: { 'zh-CN': '功能插件', en: 'Functional' },
  export: { 'zh-CN': '导出插件', en: 'Export' },
}

/** 格式化 list 的展示行；categories 缺省时用内置中文类型名。 */
export function formatPluginLines(
  entries: readonly MarketIndexEntry[],
  locale: string,
  categories?: MarketMetadataDecl['categories'],
): string {
  const wanted = locale || 'zh-CN'
  return entries.map(plugin => {
    const categoryId = plugin.metadata?.category ?? resolveType(plugin)
    const categoryTitle = categories?.[categoryId]?.title ?? BUILTIN_TYPE_NAMES[categoryId as PluginType]
    const typeName = localize(categoryTitle, wanted)
    const title = localize(plugin.title ?? plugin.name, wanted)
    const engine = plugin.engines?.core ?? plugin.minCoreVersion
    const labels = plugin.metadata?.labels?.length ? ` · ${plugin.metadata.labels.join('、')}` : ''
    const head = `${plugin.uniqueId ?? plugin.id}  ${typeName}  ${title}  v${plugin.version}`
    const second = `  npm ${plugin.npmName}${engine ? ` · core ${engine}` : ''}${labels}`
    return `${head}\n${second}`
  }).join('\n')
}

export interface CliDeps {
  install?: typeof installPlugin
  remove?: typeof removePlugin
  index?: MarketIndex
  out?: (message: string) => void
  err?: (message: string) => void
}

function errorCode(err: unknown): number {
  if (err instanceof MarketError) {
    const map: Record<string, number> = {
      BAD_ARGUMENT: 2, BAD_PLUGIN_ID: 2, BAD_REPO: 2,
      NOT_FOUND: 3, VERSION_NOT_FOUND: 3,
      ALREADY_EXISTS: 4, INVALID_PLUGIN: 5, INVALID_INDEX: 5,
      NPM_FAILED: 6, CLONE_FAILED: 6, GIT_MISSING: 6,
    }
    return map[err.code] ?? 1
  }
  return 1
}

/** 解析 --index：指定则从文件读取，否则用注入/内置索引。 */
async function loadIndex(path: string | undefined, fallback: MarketIndex, err: (m: string) => void): Promise<MarketIndex | null> {
  if (!path) return fallback
  try {
    const { readFileSync } = await import('node:fs')
    return JSON.parse(readFileSync(path, 'utf8')) as MarketIndex
  } catch (readErr) {
    err(`读取索引失败：${readErr instanceof Error ? readErr.message : String(readErr)}`)
    return null
  }
}

export async function main(argv: string[], deps: CliDeps = {}): Promise<number> {
  const out = deps.out ?? console.log
  const err = deps.err ?? console.error
  let parsed: ParsedArgs
  try {
    parsed = parseArgs(argv)
  } catch (err) {
    out(err instanceof Error ? err.message : String(err))
    return 1
  }
  if (parsed.help) { out(USAGE); return 0 }
  if (parsed.helpVersion) { out(`@worm-print-platform/marketplace ${VERSION}`); return 0 }
  if (!parsed.command) { out(USAGE); return 1 }

  const fallbackIndex = deps.index ?? BUNDLED_CATALOG
  if (parsed.command === 'list' || parsed.command === 'validate') {
    const target = await loadIndex(parsed.index, fallbackIndex, err)
    if (!target) return 1
    if (parsed.command === 'list') {
      const entries = filterAndSortPlugins(target, parsed)
      if (parsed.json) {
        out(JSON.stringify(entries, null, 2))
      } else {
        out(formatPluginLines(entries, parsed.locale ?? 'zh-CN', target.metadata?.categories) || '（索引为空）')
      }
      return 0
    }
    const issues = validateIndex(target)
    if (issues.length) {
      for (const issue of issues) err(`${issue.path}: ${issue.message}`)
      return 1
    }
    out('索引校验通过')
    return 0
  }
  if (!parsed.name) { out('缺少插件名'); return 1 }
  const index = fallbackIndex

  try {
    if (parsed.command === 'install') {
      const options: InstallOptions = {
        name: parsed.name,
        version: parsed.version,
        source: parsed.source,
        dir: parsed.dir,
        repo: parsed.repo,
        force: parsed.force,
        index,
      }
      const result = await (deps.install ?? installPlugin)(options)
      out(`已安装 ${result.id}@${result.version}（来源 ${result.source}）→ ${result.target}`)
      return 0
    }
    await (deps.remove ?? removePlugin)({
      name: parsed.name, dir: parsed.dir, repo: parsed.repo,
    })
    out(`已卸载 ${parsed.name}`)
    return 0
  } catch (err) {
    out(err instanceof Error ? err.message : String(err))
    return errorCode(err)
  }
}

/** 判断是否直接执行本 CLI；经 npm bin 软链调用时 argv[1] 是链接路径，需先归一。 */
export function isCliEntry(argv1: string | undefined, moduleUrl: string): boolean {
  if (!argv1) return false
  try {
    return pathToFileURL(realpathSync(argv1)).href === moduleUrl
  } catch {
    return false
  }
}

if (isCliEntry(process.argv[1], import.meta.url)) {
  main(process.argv.slice(2)).then(code => { process.exitCode = code })
}
