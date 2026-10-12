import { pinyin } from "pinyin-pro";
import { tokenize } from "./segmenter.ts";

/**
 * 标题拼音索引（Pro 卖点：拼音直达）。
 * 只索引标题——"记得发音找不到笔记"的核心场景是按文件名查找，正文用汉字搜即可（全量拼音会让索引膨胀数倍）。
 *
 * 生成三种可查形式（空格连接为 MiniSearch token）：
 *  - 逐字全拼：bi ji（可搜 "bi ji" / 前缀 "bi"）
 *  - 全拼连写：biji（可搜 "biji"）
 *  - 首字母连写：bj（可搜 "bj"）
 */
export function titlePinyin(title: string): string {
  const tokens = tokenize(title).filter((t) => /\p{Script=Han}/u.test(t));
  if (tokens.length === 0) return "";

  const parts: string[] = [];
  for (const tok of tokens) {
    const perChar = pinyin(tok, { toneType: "none", type: "array", nonZh: "consecutive" });
    const joined = perChar.join("");
    if (!joined || !/[a-z]/i.test(joined)) continue;
    parts.push(...perChar.map((p: string) => p.toLowerCase()));
    parts.push(joined.toLowerCase());
    const initials = perChar.map((p: string) => p[0]).join("").toLowerCase();
    if (initials.length > 1) parts.push(initials);
  }
  // 整标题粒度：全拼连写与首字母连写（覆盖跨词查询，如 xmgl→项目管理）
  const full = pinyin(title, { toneType: "none", type: "array", nonZh: "consecutive" })
    .filter((s: string) => /^[a-z]{1,6}$/i.test(s));
  if (full.length > 1) {
    parts.push(full.join("").toLowerCase());
    const fullInitials = full.map((p: string) => p[0]).join("").toLowerCase();
    if (fullInitials.length > 1) parts.push(fullInitials);
  }
  return parts.join(" ");
}
