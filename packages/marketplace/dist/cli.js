#!/usr/bin/env node
import {
  BUNDLED_CATALOG,
  MarketError,
  installPlugin,
  localize,
  removePlugin,
  validateIndex
} from "./chunk-EI5FJ455.js";

// src/cli.ts
import { realpathSync } from "fs";
import { pathToFileURL } from "url";
var VERSION = true ? "1.6.6" : "1.6.6";
var SOURCES = /* @__PURE__ */ new Set(["npm", "github", "gitee", "auto", "local"]);
var PLUGIN_TYPES = /* @__PURE__ */ new Set(["element", "functional", "export"]);
var VALUE_FLAGS = /* @__PURE__ */ new Set([
  "--source",
  "--dir",
  "--repo",
  "--index",
  "--type",
  "--category",
  "--label",
  "--search",
  "--locale",
  "--sort"
]);
var USAGE = `\u7528\u6CD5: worm-print-marketplace <\u547D\u4EE4> [\u9009\u9879]

\u547D\u4EE4:
  list                       \u5217\u51FA\u5185\u7F6E\u7D22\u5F15\u4E2D\u7684\u63D2\u4EF6\uFF08\u53EF\u6309\u7C7B\u578B/\u5206\u7C7B/\u6807\u7B7E/\u5173\u952E\u8BCD\u7B5B\u9009\uFF09
  validate                   \u6821\u9A8C\u5185\u7F6E\u7D22\u5F15\u6216\u7528 --index \u6307\u5B9A\u7684\u7D22\u5F15\u6587\u4EF6
  install <\u540D\u79F0>[@\u7248\u672C]      \u5B89\u88C5\u5355\u4E2A\u63D2\u4EF6\uFF08\u7F3A\u7701\u7248\u672C = \u6700\u65B0\u7A33\u5B9A\u7248\uFF09
  remove <\u540D\u79F0>              \u5378\u8F7D\u63D2\u4EF6

\u9009\u9879:
  --source npm|gitee|github|auto   \u5B89\u88C5\u6765\u6E90\uFF0C\u9ED8\u8BA4 auto\uFF08npm \u2192 Gitee \u2192 GitHub\uFF09
  --dir <\u8DEF\u5F84>                     \u63D2\u4EF6\u6839\u76EE\u5F55\uFF0C\u9ED8\u8BA4 .worm-print/plugins
  --repo <\u8DEF\u5F84\u6216URL>               \u672C\u5730\u5E02\u573A\u76EE\u5F55\u6216\u81EA\u5B9A\u4E49 git \u4ED3\u5E93\u5730\u5740
  --force                         \u5DF2\u5B58\u5728\u65F6\u8986\u76D6\u5B89\u88C5
  --index <\u8DEF\u5F84>                   validate \u6821\u9A8C\u7684\u7D22\u5F15\u6587\u4EF6\uFF08\u7F3A\u7701\u7528\u5185\u7F6E\u7D22\u5F15\uFF09
  --type element|functional|export list \u6309\u63D2\u4EF6\u7C7B\u578B\u7B5B\u9009
  --category <id>                  list \u6309\u5206\u7C7B\u7B5B\u9009
  --label <id>                     list \u6309\u6807\u7B7E\u7B5B\u9009
  --search <\u6587\u672C>                  list \u6309\u6807\u8BC6/\u540D\u79F0/\u6807\u9898/\u63CF\u8FF0\u641C\u7D22
  --locale <bcp47>                 list \u5C55\u793A\u8BED\u8A00\uFF0C\u9ED8\u8BA4 zh-CN
  --sort <\u6392\u5E8F\u952E>                  list \u6309\u7D22\u5F15\u58F0\u660E\u7684\u6392\u5E8F\u952E\u6392\u5E8F
  --json                           list \u8F93\u51FA\u7ED3\u6784\u5316 JSON
  -h, --help                      \u663E\u793A\u5E2E\u52A9
  -v, --version                   \u663E\u793A\u7248\u672C`;
function parseArgs(argv) {
  const result = {
    source: "auto",
    json: false,
    force: false,
    help: false,
    helpVersion: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      result.help = true;
      continue;
    }
    if (arg === "-v" || arg === "--version") {
      result.helpVersion = true;
      continue;
    }
    if (arg === "--force") {
      result.force = true;
      continue;
    }
    if (arg === "--json") {
      result.json = true;
      continue;
    }
    if (VALUE_FLAGS.has(arg)) {
      const value = argv[++i];
      if (!value) throw new MarketError("BAD_ARGUMENT", `${arg} \u7F3A\u5C11\u503C`);
      if (arg === "--source") {
        if (!SOURCES.has(value)) throw new MarketError("BAD_ARGUMENT", `\u4E0D\u652F\u6301\u7684\u6765\u6E90\uFF08--source\uFF09\uFF1A${value}`);
        result.source = value;
      } else if (arg === "--dir") result.dir = value;
      else if (arg === "--repo") result.repo = value;
      else if (arg === "--index") result.index = value;
      else if (arg === "--type") {
        if (!PLUGIN_TYPES.has(value)) throw new MarketError("BAD_ARGUMENT", `\u4E0D\u652F\u6301\u7684\u63D2\u4EF6\u7C7B\u578B\uFF08--type\uFF09\uFF1A${value}`);
        result.type = value;
      } else if (arg === "--category") result.category = value;
      else if (arg === "--label") result.label = value;
      else if (arg === "--search") result.search = value;
      else if (arg === "--locale") result.locale = value;
      else if (arg === "--sort") result.sort = value;
      continue;
    }
    if (arg.startsWith("-")) throw new MarketError("BAD_ARGUMENT", `\u672A\u77E5\u9009\u9879\uFF1A${arg}`);
    if (!result.command) {
      if (arg === "list" || arg === "validate" || arg === "install" || arg === "remove") result.command = arg;
      else throw new MarketError("BAD_ARGUMENT", `\u672A\u77E5\u547D\u4EE4\uFF1A${arg}`);
      continue;
    }
    if (!result.name) {
      const at = arg.lastIndexOf("@");
      if (at > 0) {
        result.name = arg.slice(0, at);
        result.version = arg.slice(at + 1);
      } else {
        result.name = arg;
      }
    }
  }
  return result;
}
function resolveType(plugin) {
  if (plugin.type) return plugin.type;
  if (plugin.exportFormats.length) return "export";
  if (plugin.kinds.length) return "element";
  return "functional";
}
function filterAndSortPlugins(index, opts) {
  const search = opts.search?.trim().toLowerCase();
  const matches = index.plugins.filter((plugin) => {
    if (opts.type && resolveType(plugin) !== opts.type) return false;
    if (opts.category && plugin.metadata?.category !== opts.category) return false;
    if (opts.label && !plugin.metadata?.labels?.includes(opts.label)) return false;
    if (search) {
      const haystack = [
        plugin.uniqueId ?? plugin.id,
        plugin.id,
        plugin.name,
        ...Object.values(typeof plugin.title === "string" ? {} : plugin.title ?? {}),
        ...Object.values(typeof plugin.description === "string" ? {} : plugin.description ?? {})
      ].join(" ").toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
  if (!opts.sort) return [...matches];
  const order = index.metadata?.sortKeys?.[opts.sort]?.order ?? "asc";
  const direction = order === "desc" ? -1 : 1;
  return [...matches].sort((a, b) => {
    const av = a.metadata?.sortKeys?.[opts.sort];
    const bv = b.metadata?.sortKeys?.[opts.sort];
    if (av === null || av === void 0) return bv === null || bv === void 0 ? 0 : 1;
    if (bv === null || bv === void 0) return -1;
    return (av - bv) * direction;
  });
}
var BUILTIN_TYPE_NAMES = {
  element: { "zh-CN": "\u5143\u7D20\u63D2\u4EF6", en: "Element" },
  functional: { "zh-CN": "\u529F\u80FD\u63D2\u4EF6", en: "Functional" },
  export: { "zh-CN": "\u5BFC\u51FA\u63D2\u4EF6", en: "Export" }
};
function formatPluginLines(entries, locale, categories) {
  const wanted = locale || "zh-CN";
  return entries.map((plugin) => {
    const categoryId = plugin.metadata?.category ?? resolveType(plugin);
    const categoryTitle = categories?.[categoryId]?.title ?? BUILTIN_TYPE_NAMES[categoryId];
    const typeName = localize(categoryTitle, wanted);
    const title = localize(plugin.title ?? plugin.name, wanted);
    const engine = plugin.engines?.core ?? plugin.minCoreVersion;
    const labels = plugin.metadata?.labels?.length ? ` \xB7 ${plugin.metadata.labels.join("\u3001")}` : "";
    const head = `${plugin.uniqueId ?? plugin.id}  ${typeName}  ${title}  v${plugin.version}`;
    const second = `  npm ${plugin.npmName}${engine ? ` \xB7 core ${engine}` : ""}${labels}`;
    return `${head}
${second}`;
  }).join("\n");
}
function errorCode(err) {
  if (err instanceof MarketError) {
    const map = {
      BAD_ARGUMENT: 2,
      BAD_PLUGIN_ID: 2,
      BAD_REPO: 2,
      NOT_FOUND: 3,
      VERSION_NOT_FOUND: 3,
      ALREADY_EXISTS: 4,
      INVALID_PLUGIN: 5,
      INVALID_INDEX: 5,
      NPM_FAILED: 6,
      CLONE_FAILED: 6,
      GIT_MISSING: 6
    };
    return map[err.code] ?? 1;
  }
  return 1;
}
async function loadIndex(path, fallback, err) {
  if (!path) return fallback;
  try {
    const { readFileSync } = await import("fs");
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (readErr) {
    err(`\u8BFB\u53D6\u7D22\u5F15\u5931\u8D25\uFF1A${readErr instanceof Error ? readErr.message : String(readErr)}`);
    return null;
  }
}
async function main(argv, deps = {}) {
  const out = deps.out ?? console.log;
  const err = deps.err ?? console.error;
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (err2) {
    out(err2 instanceof Error ? err2.message : String(err2));
    return 1;
  }
  if (parsed.help) {
    out(USAGE);
    return 0;
  }
  if (parsed.helpVersion) {
    out(`@worm-print-platform/marketplace ${VERSION}`);
    return 0;
  }
  if (!parsed.command) {
    out(USAGE);
    return 1;
  }
  const fallbackIndex = deps.index ?? BUNDLED_CATALOG;
  if (parsed.command === "list" || parsed.command === "validate") {
    const target = await loadIndex(parsed.index, fallbackIndex, err);
    if (!target) return 1;
    if (parsed.command === "list") {
      const entries = filterAndSortPlugins(target, parsed);
      if (parsed.json) {
        out(JSON.stringify(entries, null, 2));
      } else {
        out(formatPluginLines(entries, parsed.locale ?? "zh-CN", target.metadata?.categories) || "\uFF08\u7D22\u5F15\u4E3A\u7A7A\uFF09");
      }
      return 0;
    }
    const issues = validateIndex(target);
    if (issues.length) {
      for (const issue of issues) err(`${issue.path}: ${issue.message}`);
      return 1;
    }
    out("\u7D22\u5F15\u6821\u9A8C\u901A\u8FC7");
    return 0;
  }
  if (!parsed.name) {
    out("\u7F3A\u5C11\u63D2\u4EF6\u540D");
    return 1;
  }
  const index = fallbackIndex;
  try {
    if (parsed.command === "install") {
      const options = {
        name: parsed.name,
        version: parsed.version,
        source: parsed.source,
        dir: parsed.dir,
        repo: parsed.repo,
        force: parsed.force,
        index
      };
      const result = await (deps.install ?? installPlugin)(options);
      out(`\u5DF2\u5B89\u88C5 ${result.id}@${result.version}\uFF08\u6765\u6E90 ${result.source}\uFF09\u2192 ${result.target}`);
      return 0;
    }
    await (deps.remove ?? removePlugin)({
      name: parsed.name,
      dir: parsed.dir,
      repo: parsed.repo
    });
    out(`\u5DF2\u5378\u8F7D ${parsed.name}`);
    return 0;
  } catch (err2) {
    out(err2 instanceof Error ? err2.message : String(err2));
    return errorCode(err2);
  }
}
function isCliEntry(argv1, moduleUrl) {
  if (!argv1) return false;
  try {
    return pathToFileURL(realpathSync(argv1)).href === moduleUrl;
  } catch {
    return false;
  }
}
if (isCliEntry(process.argv[1], import.meta.url)) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
export {
  filterAndSortPlugins,
  formatPluginLines,
  isCliEntry,
  main,
  parseArgs
};
