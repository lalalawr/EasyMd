import React from "react";
import { Sun, Moon, SunMoon, Download, Upload, Trash2 } from "lucide-react";
import { FONT_SIZES } from "../lib/utils.js";

export default function SettingsView({
  settings,
  setSettings,
  docs,
  folders,
  tags,
  onExportBackup,
  onImportBackup,
  onClearData,
}) {
  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const totalWords = docs.reduce((a, d) => a + d.wordCount, 0);

  return (
    <div className="ink-page">
      <header className="ink-header">
        <h1 className="ink-h1">设置</h1>
      </header>

      <section className="ink-card">
        <div className="ink-set-label">外观</div>
        <div className="ink-seg">
          {[
            ["light", Sun, "浅色"],
            ["dark", Moon, "深色"],
            ["system", SunMoon, "跟随系统"],
          ].map(([k, Icon, l]) => (
            <button key={k} className={"ink-seg-btn" + (settings.theme === k ? " on" : "")} onClick={() => set("theme", k)}>
              <Icon size={15} /> {l}
            </button>
          ))}
        </div>
      </section>

      <section className="ink-card">
        <div className="ink-set-label">默认阅读字体</div>
        <div className="ink-seg">
          {[["serif", "衬线"], ["sans", "无衬线"]].map(([k, l]) => (
            <button key={k} className={"ink-seg-btn" + (settings.readerFontFamily === k ? " on" : "")} onClick={() => set("readerFontFamily", k)}>
              {l}
            </button>
          ))}
        </div>

        <div className="ink-set-label" style={{ marginTop: 16 }}>默认字号</div>
        <div className="ink-seg">
          {FONT_SIZES.map((s) => (
            <button key={s} className={"ink-seg-btn" + (settings.readerFontSize === s ? " on" : "")} onClick={() => set("readerFontSize", s)}>
              {s}
            </button>
          ))}
        </div>

        <div className="ink-set-label" style={{ marginTop: 16 }}>阅读宽度</div>
        <div className="ink-seg">
          {[["narrow", "窄"], ["comfortable", "适中"], ["wide", "宽"]].map(([k, l]) => (
            <button key={k} className={"ink-seg-btn" + (settings.readerWidth === k ? " on" : "")} onClick={() => set("readerWidth", k)}>
              {l}
            </button>
          ))}
        </div>
      </section>

      <section className="ink-card">
        <div className="ink-set-label">数据备份</div>
        <div className="ink-menu">
          <button className="ink-menu-item" onClick={onExportBackup}>
            <Download size={18} /> 导出备份（JSON）
          </button>
          <label className="ink-menu-item" htmlFor="ink-backup-input">
            <Upload size={18} /> 导入备份
          </label>
          <button className="ink-menu-item danger" onClick={onClearData}>
            <Trash2 size={18} /> 清空所有数据
          </button>
        </div>
        <input
          id="ink-backup-input"
          type="file"
          className="ink-visually-hidden"
          onChange={(e) => {
            const f = e.target.files && e.target.files[0];
            if (f) onImportBackup(f);
            e.target.value = "";
          }}
        />
      </section>

      <section className="ink-card">
        <div className="ink-set-label">知识库</div>
        <div className="ink-stats">
          <div><b>{docs.length}</b><span>文档</span></div>
          <div><b>{folders.length}</b><span>文件夹</span></div>
          <div><b>{tags.length}</b><span>标签</span></div>
          <div><b>{totalWords}</b><span>总字数</span></div>
        </div>
      </section>

      <div className="ink-set-foot">EasyMd · 安静地阅读 Markdown</div>
    </div>
  );
}
