import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, Eye, Pencil, Bold, Italic, Heading, List, Quote, Code, Link2 } from "lucide-react";
import { MarkdownRenderer } from "../lib/markdown.jsx";

export default function Editor({ doc, onSave, onBack }) {
  const [text, setText] = useState(doc.content);
  const [mode, setMode] = useState("edit"); // edit | preview
  const [status, setStatus] = useState("saved"); // saved | saving
  const taRef = useRef(null);
  const saveTimer = useRef(null);
  const latest = useRef(doc.content);

  // 切换到另一篇文档时重置
  useEffect(() => {
    setText(doc.content);
    latest.current = doc.content;
    setStatus("saved");
  }, [doc.id]);

  const scheduleSave = useCallback(
    (value) => {
      latest.current = value;
      setStatus("saving");
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        onSave(value);
        setStatus("saved");
      }, 700);
    },
    [onSave]
  );

  const onChange = (e) => {
    setText(e.target.value);
    scheduleSave(e.target.value);
  };

  // 离开前立即落盘
  const flush = () => {
    clearTimeout(saveTimer.current);
    if (latest.current !== doc.content) onSave(latest.current);
  };
  useEffect(() => () => flush(), []); // eslint-disable-line

  // 工具条：在选区两侧包裹标记
  const wrap = (before, after = before) => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const sel = text.slice(s, e) || "文本";
    const next = text.slice(0, s) + before + sel + after + text.slice(e);
    setText(next);
    scheduleSave(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = s + before.length;
      ta.selectionEnd = s + before.length + sel.length;
    });
  };

  // 工具条：行首插入前缀（标题/列表/引用）
  const linePrefix = (prefix) => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const lineStart = text.lastIndexOf("\n", s - 1) + 1;
    const next = text.slice(0, lineStart) + prefix + text.slice(lineStart);
    setText(next);
    scheduleSave(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = s + prefix.length;
    });
  };

  const insertLink = () => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = text.slice(s, e) || "链接文字";
    const snippet = "[" + sel + "](https://)";
    const next = text.slice(0, s) + snippet + text.slice(e);
    setText(next);
    scheduleSave(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = s + snippet.length - 1;
      ta.selectionStart = ta.selectionEnd = pos;
    });
  };

  return (
    <div className="ink-reader">
      <div className="ink-reader-bar">
        <button className="ink-icon-btn" onClick={() => { flush(); onBack(); }}>
          <ChevronLeft size={24} />
        </button>
        <div className="ink-reader-title">{doc.filename}</div>
        <span className="ink-save-status">{status === "saving" ? "保存中…" : "已保存"}</span>
        <div className="ink-seg ink-editor-seg">
          <button className={"ink-seg-btn" + (mode === "edit" ? " on" : "")} onClick={() => setMode("edit")}>
            <Pencil size={14} /> 编辑
          </button>
          <button className={"ink-seg-btn" + (mode === "preview" ? " on" : "")} onClick={() => setMode("preview")}>
            <Eye size={14} /> 预览
          </button>
        </div>
      </div>

      {mode === "edit" ? (
        <>
          <div className="ink-toolbar">
            <button onClick={() => wrap("**")}><Bold size={17} /></button>
            <button onClick={() => wrap("*")}><Italic size={17} /></button>
            <button onClick={() => linePrefix("# ")}><Heading size={17} /></button>
            <button onClick={() => linePrefix("- ")}><List size={17} /></button>
            <button onClick={() => linePrefix("> ")}><Quote size={17} /></button>
            <button onClick={() => wrap("`")}><Code size={17} /></button>
            <button onClick={insertLink}><Link2 size={17} /></button>
          </div>
          <textarea
            ref={taRef}
            className="ink-textarea"
            value={text}
            onChange={onChange}
            spellCheck={false}
            placeholder="开始书写 Markdown…"
          />
        </>
      ) : (
        <div className="ink-reader-scroll">
          <article className="ink-article" style={{ "--reader-fs": "17px", "--reader-lh": 1.7, maxWidth: "36em" }}>
            <MarkdownRenderer content={text} />
          </article>
        </div>
      )}
    </div>
  );
}
