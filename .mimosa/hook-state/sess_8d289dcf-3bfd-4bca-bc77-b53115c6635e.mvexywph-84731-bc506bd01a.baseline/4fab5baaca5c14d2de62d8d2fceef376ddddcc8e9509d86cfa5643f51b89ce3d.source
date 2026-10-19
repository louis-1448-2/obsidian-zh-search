import { Notice, Plugin, TFile, TAbstractFile, debounce } from "obsidian";
import { ZhSearchIndex } from "./indexer.ts";
import { SearchModal } from "./modal.ts";
import { ZhSearchSettingTab } from "./settings.ts";

interface ZhSearchSettings {
  maxResults: number;
  excludeFolders: string[];
}

const DEFAULT_SETTINGS: ZhSearchSettings = {
  maxResults: 20,
  excludeFolders: [],
};

export default class ZhSearchPlugin extends Plugin {
  settings: ZhSearchSettings = DEFAULT_SETTINGS;
  index = new ZhSearchIndex();

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: "search-notes",
      name: "全文搜索",
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "k" }],
      callback: () => {
        new SearchModal(this.app, this).open();
      },
    });

    this.addSettingTab(new ZhSearchSettingTab(this.app, this));

    // 启动后后台建索引（等 workspace 就绪，避免拖慢启动）
    this.app.workspace.onLayoutReady(() => {
      this.rebuildIndex(false);
    });

    // 文件事件增量维护（debounce 单独存成员，避免 on() 重载类型问题）
    const debouncedIndex = debounce((file: TFile) => this.indexFile(file), 800, true);
    this.registerEvent(
      this.app.vault.on("modify", (file: TAbstractFile) => {
        if (file instanceof TFile) debouncedIndex(file);
      })
    );
    this.registerEvent(
      this.app.vault.on("create", (file: TAbstractFile) => {
        if (file instanceof TFile && file.extension === "md") this.indexFile(file);
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", (file: TAbstractFile, oldPath: string) => {
        this.index.remove(oldPath);
        if (file instanceof TFile && file.extension === "md") this.indexFile(file);
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file: TAbstractFile) => {
        this.index.remove(file.path);
      })
    );
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private shouldIndex(file: TFile): boolean {
    if (file.extension !== "md") return false;
    return !this.settings.excludeFolders.some((folder) =>
      file.path.startsWith(folder + "/")
    );
  }

  private async indexFile(file: TFile): Promise<void> {
    if (!this.shouldIndex(file)) return;
    try {
      const content = await this.app.vault.cachedRead(file);
      const title = file.basename;
      this.index.update(file.path, title, content);
    } catch (e) {
      console.warn("汉搜：索引失败", file.path, e);
    }
  }

  async rebuildIndex(notify: boolean): Promise<void> {
    const files = this.app.vault.getMarkdownFiles().filter((f) => this.shouldIndex(f));
    const total = files.length;
    let notice: Notice | null = null;
    if (notify) notice = new Notice(`汉搜：正在建立索引（0/${total}）…`, 0);

    const contents: { path: string; title: string; content: string }[] = [];
    for (const f of files) {
      try {
        contents.push({
          path: f.path,
          title: f.basename,
          content: await this.app.vault.cachedRead(f),
        });
      } catch {
        /* 跳过读不了的文件 */
      }
    }

    await this.index.buildAll(contents, (done, t) => {
      if (notice && t > 300) {
        notice.setMessage(`汉搜：正在建立索引（${done}/${t}）…`);
      }
    });

    if (notice) notice.hide();
    const msg = `汉搜：索引完成，共 ${this.index.docCount} 篇`;
    if (notify) new Notice(msg);
    else console.info(msg);
  }
}
