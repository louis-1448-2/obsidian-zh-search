import { SuggestModal, TFile, App, Platform } from "obsidian";
import type ZhSearchPlugin from "./main.ts";
import type { Hit } from "./indexer";

/**
 * 汉搜搜索框：原生 SuggestModal 体验。
 * 每次输入即查（索引模式下查询是毫秒级），展示 标题 + 路径 + 命中片段。
 */
export class SearchModal extends SuggestModal<Hit> {
  plugin: ZhSearchPlugin;

  constructor(app: App, plugin: ZhSearchPlugin) {
    super(app);
    this.plugin = plugin;
    this.setPlaceholder("汉搜：输入关键词，中文可按词搜索（如：笔记管理）…");
    // 结果多时给更高的窗口
    if (!Platform.isMobile) {
      this.modalEl.addClass("zh-search-modal");
    }
  }

  getSuggestions(query: string): Hit[] {
    if (!query.trim()) return [];
    return this.plugin.index.search(query, this.plugin.settings.maxResults);
  }

  renderSuggestion(hit: Hit, el: HTMLElement): void {
    const row = el.createEl("div", { cls: "zh-search-item" });
    row.createEl("div", { cls: "zh-search-title", text: hit.title });
    row.createEl("div", { cls: "zh-search-path", text: hit.path });
    if (hit.snippet) {
      row.createEl("div", { cls: "zh-search-snippet", text: hit.snippet });
    }
  }

  onChooseSuggestion(hit: Hit): void {
    const file = this.app.vault.getAbstractFileByPath(hit.path);
    if (file instanceof TFile) {
      this.app.workspace.getLeaf(false).openFile(file);
    }
  }
}
