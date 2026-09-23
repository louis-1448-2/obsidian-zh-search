# Zh Search (汉搜)

**Chinese-first full-text search for Obsidian** — 为中文而生的 Obsidian 全文搜索插件。

Obsidian 的原生搜索是子串匹配：搜「笔记管理」找不到「笔记 **的管理**」，没有分词，没有相关度排序。「汉搜」为中文从头设计。

## ✨ 特性

- 🔤 **真正的中文分词索引** — 基于 ICU 分词器（`Intl.Segmenter`），中英混合内容统一索引
- 🎯 **BM25 相关度排序** — 最相关的结果排最前，标题命中加权
- 📝 **命中片段预览** — 结果中直接显示上下文片段
- ⚡ **毫秒级查询** — 180 篇 / 67 万字实测：全量索引 575ms，查询 < 5ms
- 🔁 **实时增量索引** — 保存即更新，无需手动重建
- 🖥️📱 **桌面 + 移动端** — 零原生依赖，纯 JS

## 🚀 使用

1. 启用插件后，按 `Ctrl/Cmd + Shift + K`（或命令面板搜索「汉搜」）
2. 直接输入关键词——中文按**词**搜索，不再要求连续匹配

**搜索「笔记管理」，能找到含有「笔记」「管理」分开出现的段落。**

## 📦 安装

- **社区插件市场**：搜索 "Zh Search"（审核中）
- **手动安装**：从 [Releases](../../releases) 下载 `main.js`、`manifest.json`、`styles.css`，放入 `.obsidian/plugins/zh-search/`

## ⚙️ 设置

- 结果数量上限（默认 20）
- 排除目录（逗号分隔）
- 手动重建索引

## 🗺️ Roadmap（Pro）

- 拼音全拼/首字母搜索（输入 `bj` 找到「笔记」）
- 模糊音容错（z/zh、n/l）
- 大库（万篇级）性能优化

高级功能在 [爱发电](https://afdian.com/a/zhsearch) 订阅「Pro 会员」获取，核心搜索永久免费开源。

## 🛠️ 开发

```bash
npm install
npm test     # 核心逻辑自测（分词/索引/排序）
npm run dev  # watch 构建
```

MIT License © [louis-1448-2](https://github.com/louis-1448-2)

---

<div align="center">

**如果汉搜帮到了你，欢迎来 [爱发电 ⚡](https://afdian.com/a/zhsearch) 支持开发**

</div>
