/**
 * 真实规模性能实测：对 vault 全部 md 建索引 + 典型查询，输出耗时。
 * 使用与插件完全相同的 segmenter/indexer 逻辑。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const VAULT = "/Users/louis/Desktop/ly/Obsidian/vault";

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || name === "louis-bookbar") continue; // 跳过隐藏/特殊目录
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (name.endsWith(".md")) yield p;
  }
}

const { tokenizeJoined } = await import("../src/segmenter.ts");
const { ZhSearchIndex } = await import("../src/indexer.ts");

const files = [];
for (const p of walk(VAULT)) {
  files.push({ path: p.replace(VAULT + "/", ""), title: p.split("/").pop().replace(/\.md$/, ""), content: readFileSync(p, "utf8") });
}
console.log(`笔记数: ${files.length}, 总字符: ${files.reduce((s, f) => s + f.content.length, 0).toLocaleString()}`);

const idx = new ZhSearchIndex();
let t0 = Date.now();
await idx.buildAll(files);
console.log(`全量索引耗时: ${Date.now() - t0} ms (docCount=${idx.docCount})`);

const queries = ["笔记管理", "obsidian", "项目排期", "读书", "工作流"];
for (const q of queries) {
  t0 = performance.now();
  const hits = idx.search(q, 20);
  const ms = (performance.now() - t0).toFixed(1);
  console.log(`查询「${q}」: ${hits.length} 条命中, ${ms} ms, 首条: ${hits[0]?.path ?? "-"} | ${hits[0]?.snippet?.slice(0, 40) ?? ""}`);
}
