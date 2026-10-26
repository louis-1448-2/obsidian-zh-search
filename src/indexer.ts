import MiniSearch, { type SearchResult } from "minisearch";
import { tokenizeJoined, tokenize } from "./segmenter.ts";
import { titlePinyin } from "./pinyin.ts";

export interface DocRecord {
  id: string;        // file.path
  title: string;     // 文件名（不含扩展名）
  path: string;
  body: string;      // 分词后的正文（空格连接）
  pinyin: string;    // 标题拼音索引（逐字全拼/全拼连写/首字母连写）
}

export interface Hit {
  path: string;
  title: string;
  score: number;
  snippet: string;   // 命中片段预览
}

const MAX_SNIPPET_RADIUS = 24; // 片段前后字符数

/**
 * 汉搜索引：MiniSearch(BM25) + 中文分词。
 * 全量构建支持分批 + 进度回调，文件事件增量维护。
 */
export class ZhSearchIndex {
  private mini: MiniSearch;
  private rawCache = new Map<string, string>(); // path -> 原始正文（用于片段）
  building = false;
  docCount = 0;

  constructor() {
    this.mini = new MiniSearch({
      fields: ["title", "body", "pinyin"],
      storeFields: ["title", "path"],
      searchOptions: {
        prefix: true,
        fuzzy: 0.2,
        boost: { title: 4, pinyin: 3 },
      },
    });
  }

  /** 分批全量构建；onProgress(已完成, 总数) */
  async buildAll(
    files: { path: string; title: string; content: string }[],
    onProgress?: (done: number, total: number) => void
  ): Promise<void> {
    this.building = true;
    try {
      this.mini.removeAll();
      this.rawCache.clear();
      const BATCH = 200;
      for (let i = 0; i < files.length; i += BATCH) {
        const batch = files.slice(i, i + BATCH).map((f) => this.toDoc(f));
        await this.mini.addAllAsync(batch, { chunkSize: 50 });
        onProgress?.(Math.min(i + BATCH, files.length), files.length);
        // 让出主线程，避免大库卡 UI（globalThis 在浏览器等价 window，且兼容测试环境）
        await new Promise((r) => globalThis.setTimeout(r, 0));
      }
      this.docCount = files.length;
    } finally {
      this.building = false;
    }
  }

  /** 单文件新增/更新（vault modify/create 事件） */
  update(path: string, title: string, content: string): void {
    this.rawCache.set(path, content);
    const doc = this.toDoc({ path, title, content });
    try {
      this.mini.discard(path);
    } catch {
      /* 未索引过的文件 discard 会抛错，忽略 */
    }
    this.mini.add(doc);
    this.docCount = this.mini.documentCount;
  }

  remove(path: string): void {
    this.rawCache.delete(path);
    try {
      this.mini.discard(path);
    } catch {
      /* 忽略未索引 */
    }
    this.docCount = this.mini.documentCount;
  }

  /** 查询：中文查询先分词再交 BM25；返回带片段的命中 */
  search(query: string, limit = 20): Hit[] {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const joined = tokenizeJoined(trimmed);
    const results: SearchResult[] = this.mini.search(joined).slice(0, limit);
    return results.map((r) => ({
      path: r.path as string,
      title: r.title as string,
      score: r.score,
      snippet: this.makeSnippet(r.path as string, trimmed),
    }));
  }

  private toDoc(f: { path: string; title: string; content: string }): DocRecord {
    this.rawCache.set(f.path, f.content);
    return {
      id: f.path,
      title: tokenizeJoined(f.title),
      path: f.path,
      body: tokenizeJoined(f.content).slice(0, 200000), // 单文档索引上限，防超长文档
      pinyin: titlePinyin(f.title),
    };
  }

  /** 从原文提取命中片段：找 query 的任一 token 首次出现位置，截取上下文 */
  private makeSnippet(path: string, query: string): string {
    const raw = this.rawCache.get(path);
    if (!raw) return "";
    const tokens = tokenize(query);
    let idx = -1;
    for (const t of tokens) {
      idx = raw.indexOf(t);
      if (idx >= 0) break;
    }
    if (idx < 0) {
      // 分词后 token 未直接命中原文（如大小写差异），退回取开头
      return raw.slice(0, MAX_SNIPPET_RADIUS * 2).replace(/\s+/g, " ");
    }
    const start = Math.max(0, idx - MAX_SNIPPET_RADIUS);
    const end = Math.min(raw.length, idx + t_len(tokens, raw, idx) + MAX_SNIPPET_RADIUS);
    return (start > 0 ? "…" : "") + raw.slice(start, end).replace(/\s+/g, " ") + (end < raw.length ? "…" : "");
  }
}

/** 片段截取用的命中长度（粗略）：取首个命中 token 的长度 */
function t_len(tokens: string[], raw: string, idx: number): number {
  for (const t of tokens) {
    if (raw.indexOf(t) === idx) return t.length;
  }
  return 4;
}
