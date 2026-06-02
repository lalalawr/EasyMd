import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { ChevronLeft, Star, List as ListIcon, Type, X, AlignLeft, Sun, Moon, SunMoon, Pencil } from "lucide-react";
import { MarkdownRenderer } from "../lib/markdown.jsx";
import { FONT_SIZES, WIDTHS } from "../lib/utils.js";
import Sheet from "../components/Sheet.jsx";

export default function Reader({ doc, settings, setSettings, onBack, onProgress, onFav, onEdit }) {
  const scrollRef = useRef(null);
  const [progress, setProgress] = useState(doc.readingProgress.scrollRatio || 0);
  const progressRef = useRef(progress);
  const [toolbar, setToolbar] = useState(true);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [setOpen, setSetOpen] = useState(false);
  const [activeHeading, setActiveHeading] = useState(null);
  const lastScroll = useRef(0);

  // 恢复阅读进度
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      el.scrollTop = (doc.readingProgress.scrollRatio || 0) * (el.scrollHeight - el.clientHeight);
    }, 30);
    return () => clearTimeout(t);
  }, [doc.id]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const r = max > 0 ? el.scrollTop / max : 0;
    setProgress(r);
    progressRef.current = r;
    if (settings.autoHideToolbar) {
      const d = el.scrollTop - lastScroll.current;
      if (el.scrollTop < 12) setToolbar(true);
      else if (d > 6) setToolbar(false);
      else if (d < -6) setToolbar(true);
    }
    lastScroll.current = el.scrollTop;
    const headingEls = el.querySelectorAll(".ink-h");
    let active = null;
    headingEls.forEach((n) => {
      if (n.getBoundingClientRect().top < 120) active = n.id;
    });
    setActiveHeading(active);
  };

  // 退出时保存进度
  useEffect(() => () => onProgress(progressRef.current), []); // eslint-disable-line

  const jumpTo = (id) => {
    const el = scrollRef.current?.querySelector('[id="' + id + '"]');
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setOutlineOpen(false);
    }
  };

  const width = WIDTHS[settings.readerWidth];

  return (
    <div className="ink-reader">
      <div className={"ink-reader-bar" + (toolbar ? "" : " hidden")}>
        <button className="ink-icon-btn" onClick={() => { onProgress(progressRef.current); onBack(); }}>
          <ChevronLeft size={24} />
        </button>
        <div className="ink-reader-title">{doc.title}</div>
        <button className="ink-icon-btn" onClick={onFav}>
          <Star size={20} fill={doc.favorite ? "currentColor" : "none"} className={doc.favorite ? "ink-fav-on" : ""} />
        </button>
        <button className="ink-icon-btn" onClick={onEdit}>
          <Pencil size={19} />
        </button>
        <button className="ink-icon-btn" onClick={() => setOutlineOpen(true)} disabled={doc.extractedHeadings.length === 0}>
          <ListIcon size={20} />
        </button>
        <button className="ink-icon-btn" onClick={() => setSetOpen(true)}>
          <Type size={20} />
        </button>
      </div>

      <div ref={scrollRef} className="ink-reader-scroll" onScroll={onScroll}>
        <article
          className="ink-article"
          style={{
            "--reader-fs": settings.readerFontSize + "px",
            "--reader-lh": settings.readerLineHeight,
            maxWidth: width + "em",
          }}
        >
          <MarkdownRenderer content={doc.content} />
          <div className="ink-article-end">· 全文完 ·</div>
        </article>
      </div>

      <div className="ink-progress-bar">
        <div style={{ width: Math.round(progress * 100) + "%" }} />
      </div>
      <button className="ink-progress-pct" onClick={() => setSetOpen(true)}>
        {Math.round(progress * 100)}%
      </button>

      {outlineOpen && (
        <div className="ink-outline-backdrop" onClick={() => setOutlineOpen(false)}>
          <div className="ink-outline" onClick={(e) => e.stopPropagation()}>
            <div className="ink-outline-head">
              <AlignLeft size={16} /> 目录
              <button onClick={() => setOutlineOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="ink-outline-list">
              {doc.extractedHeadings.map((h) => (
                <button
                  key={h.id}
                  className={"ink-outline-item lvl" + h.level + (activeHeading === h.id ? " on" : "")}
                  onClick={() => jumpTo(h.id)}
                >
                  {h.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Sheet open={setOpen} onClose={() => setSetOpen(false)} title="阅读设置">
        <div className="ink-set-label">主题</div>
        <div className="ink-seg">
          {[
            ["light", Sun, "浅色"],
            ["dark", Moon, "深色"],
            ["system", SunMoon, "系统"],
          ].map(([k, Icon, l]) => (
            <button
              key={k}
              className={"ink-seg-btn" + (settings.theme === k ? " on" : "")}
              onClick={() => setSettings((s) => ({ ...s, theme: k }))}
            >
              <Icon size={15} /> {l}
            </button>
          ))}
        </div>

        <div className="ink-set-label" style={{ marginTop: 14 }}>字体</div>
        <div className="ink-seg">
          {[
            ["serif", "衬线"],
            ["sans", "无衬线"],
          ].map(([k, l]) => (
            <button
              key={k}
              className={"ink-seg-btn" + (settings.readerFontFamily === k ? " on" : "")}
              onClick={() => setSettings((s) => ({ ...s, readerFontFamily: k }))}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="ink-set-label" style={{ marginTop: 14 }}>字号</div>
        <div className="ink-seg">
          {FONT_SIZES.map((s) => (
            <button
              key={s}
              className={"ink-seg-btn" + (settings.readerFontSize === s ? " on" : "")}
              onClick={() => setSettings((p) => ({ ...p, readerFontSize: s }))}
            >
              A<span style={{ fontSize: 9 }}>{s}</span>
            </button>
          ))}
        </div>

        <div className="ink-set-label" style={{ marginTop: 14 }}>行高 {settings.readerLineHeight.toFixed(2)}</div>
        <input
          type="range"
          min="1.5"
          max="2"
          step="0.05"
          value={settings.readerLineHeight}
          onChange={(e) => setSettings((s) => ({ ...s, readerLineHeight: parseFloat(e.target.value) }))}
          className="ink-range"
        />

        <div className="ink-set-label" style={{ marginTop: 14 }}>宽度</div>
        <div className="ink-seg">
          {[
            ["narrow", "窄"],
            ["comfortable", "适中"],
            ["wide", "宽"],
          ].map(([k, l]) => (
            <button
              key={k}
              className={"ink-seg-btn" + (settings.readerWidth === k ? " on" : "")}
              onClick={() => setSettings((s) => ({ ...s, readerWidth: k }))}
            >
              {l}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
