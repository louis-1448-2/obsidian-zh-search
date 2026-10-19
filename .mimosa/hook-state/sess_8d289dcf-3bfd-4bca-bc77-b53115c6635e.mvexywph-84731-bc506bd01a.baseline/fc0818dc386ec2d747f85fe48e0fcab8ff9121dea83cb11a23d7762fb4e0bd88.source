/**
 * 中文分词：基于 Intl.Segmenter（Chromium/Node 内置，零依赖）。
 * 中英混合文本统一处理：中文按词切分，英文/数字按词切分，过滤标点与空白。
 */

const zhSegmenter = new Intl.Segmenter("zh-Hans", { granularity: "word" });

/** 常见中文虚词/停用词：索引价值低且干扰相关度 */
const STOPWORDS = new Set([
  "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一",
  "一个", "上", "也", "很", "到", "说", "要", "去", "你", "会", "着",
  "没有", "看", "好", "自己", "这", "那", "他", "她", "它", "们", "么",
  "什么", "与", "及", "或", "而", "被", "把", "让", "从", "对", "为",
]);

/** 判断一个 token 是否值得进索引（过滤标点、空白、单字符非CJK噪音） */
function isUseful(seg: string): boolean {
  if (!seg) return false;
  // 纯标点/空白
  if (/^[\s\p{P}\p{S}]+$/u.test(seg)) return false;
  // 单个英文字母/数字噪音太大（除非是 CJK 单字，CJK 单字有意义）
  if (seg.length === 1 && !/\p{Script=Han}/u.test(seg)) return false;
  return true;
}

/** 把任意中英混合文本切成 token 数组 */
export function tokenize(text: string): string[] {
  const tokens: string[] = [];
  for (const { segment, isWordLike } of zhSegmenter.segment(text)) {
    if (!isWordLike) continue;
    if (!isUseful(segment)) continue;
    if (STOPWORDS.has(segment)) continue;
    tokens.push(segment);
    // 英文词附加小写形式，使查询大小写不敏感
    if (/[A-Za-z]/.test(segment) && segment !== segment.toLowerCase()) {
      tokens.push(segment.toLowerCase());
    }
  }
  return tokens;
}

/** 把文本切成空格连接的字符串（MiniSearch 默认按空白分词） */
export function tokenizeJoined(text: string): string {
  return tokenize(text).join(" ");
}
