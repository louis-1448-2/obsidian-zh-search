/**
 * 汉搜核心逻辑自测（Node 端，不依赖 Obsidian）：
 * 验证分词、跨词命中、相关度排序、片段生成。
 * 运行：npm test
 */
import { tokenize, tokenizeJoined } from "../src/segmenter.ts";
import { ZhSearchIndex } from "../src/indexer.ts";

let failed = 0;
function assert(cond, name) {
  if (cond) console.log("  ✓ " + name);
  else {
    console.error("  ✗ " + name);
    failed++;
  }
}

console.log("[1] 分词");
const tokens = tokenize("笔记管理是知识工作者的核心能力");
assert(tokens.includes("笔记"), "分出「笔记」");
assert(tokens.includes("管理"), "分出「管理」");
assert(!tokens.some((t) => t === "的"), "过滤虚词「的」");
const mixed = tokenize("用Obsidian做笔记NoteTaking");
assert(mixed.includes("Obsidian") || mixed.includes("obsidian"), "英文词保留");
assert(mixed.includes("笔记"), "中英混合下中文成词");

console.log("[2] 跨词命中（原生搜索做不到的场景）");
const idx = new ZhSearchIndex();
await idx.buildAll([
  { path: "a/我的笔记.md", title: "我的笔记", content: "长期积累的笔记与整理方法" },
  { path: "b/项目管理.md", title: "项目管理", content: "项目排期与风险管理实践" },
  { path: "c/无关.md", title: "无关", content: "今天天气不错" },
]);
// 原生子串搜索「笔记管理」找不到「笔记…管理」分开的内容；汉搜分词后应命中
const hits = idx.search("笔记管理");
assert(hits.length >= 1, "查询「笔记管理」命中分词内容");
assert(hits[0].path === "a/我的笔记.md", "相关度排序：最相关排第一");

console.log("[3] 片段与边界");
assert(typeof hits[0].snippet === "string" && hits[0].snippet.length > 0, "生成命中片段");
const empty = idx.search("");
assert(empty.length === 0, "空查询安全返回");

console.log("[4] 增量更新");
idx.update("c/无关.md", "无关", "这里新增了关于检索引擎的讨论");
const hits2 = idx.search("检索引擎");
assert(hits2.length === 1 && hits2[0].path === "c/无关.md", "modify 后立即可搜");
idx.remove("c/无关.md");
const hits3 = idx.search("检索引擎");
assert(hits3.length === 0, "删除后不再命中");

console.log(failed === 0 ? "\n全部通过 ✓" : `\n${failed} 项失败 ✗`);
process.exit(failed === 0 ? 0 : 1);
