import React, { useState, useRef } from "react";
import { Star, Trash2, Folder, MoreHorizontal, Check } from "lucide-react";
import { parseInline } from "../lib/markdown.jsx";
import { relTime } from "../lib/utils.js";

export default function DocRow({
  doc,
  folderName,
  tagNames,
  onOpen,
  onFav,
  onDelete,
  onLongPress,
  highlight,
  snippet,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}) {
  const [dx, setDx] = useState(0);
  const start = useRef(null);
  const moved = useRef(false);
  const pressTimer = useRef(null);

  const onStart = (x) => {
    if (selectionMode) return;
    start.current = x;
    moved.current = false;
    pressTimer.current = setTimeout(() => {
      moved.current = true;
      onLongPress();
    }, 480);
  };
  const onMove = (x) => {
    if (selectionMode || start.current == null) return;
    const d = x - start.current;
    if (Math.abs(d) > 6) clearTimeout(pressTimer.current);
    if (d < 0) setDx(Math.max(d, -132));
    else if (dx < 0) setDx(Math.min(0, d));
  };
  const onEnd = () => {
    if (selectionMode) return;
    clearTimeout(pressTimer.current);
    setDx((p) => (p < -66 ? -132 : 0));
    start.current = null;
  };
  const tap = () => {
    if (selectionMode) {
      onToggleSelect();
      return;
    }
    if (dx < -20) {
      setDx(0);
      return;
    }
    if (!moved.current) onOpen();
  };

  return (
    <div className="ink-row-wrap">
      {!selectionMode && (
        <div className="ink-row-actions">
          <button className="ink-swipe fav" onClick={() => { onFav(); setDx(0); }}>
            <Star size={18} fill={doc.favorite ? "currentColor" : "none"} />
          </button>
          <button className="ink-swipe del" onClick={() => { onDelete(); setDx(0); }}>
            <Trash2 size={18} />
          </button>
        </div>
      )}
      <div
        className={"ink-row" + (selectionMode && selected ? " selected" : "")}
        style={{ transform: `translateX(${dx}px)` }}
        onMouseDown={(e) => onStart(e.clientX)}
        onMouseMove={(e) => e.buttons === 1 && onMove(e.clientX)}
        onMouseUp={onEnd}
        onMouseLeave={() => start.current != null && onEnd()}
        onTouchStart={(e) => onStart(e.touches[0].clientX)}
        onTouchMove={(e) => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onClick={tap}
      >
        {selectionMode && (
          <div className={"ink-check" + (selected ? " on" : "")}>
            {selected && <Check size={14} />}
          </div>
        )}
        <div className="ink-row-main">
          <div className="ink-row-title">
            {highlight ? parseInline(doc.title, highlight) : doc.title}
            {doc.favorite && <Star size={13} className="ink-row-star" fill="currentColor" />}
          </div>
          {snippet && <div className="ink-row-snippet">{snippet}</div>}
          <div className="ink-row-meta">
            {folderName && (
              <span className="ink-meta-chip">
                <Folder size={11} />
                {folderName}
              </span>
            )}
            <span>{doc.wordCount} 字</span>
            <span>·</span>
            <span>{relTime(doc.updatedAt)}</span>
          </div>
          {tagNames.length > 0 && (
            <div className="ink-row-tags">
              {tagNames.map((t) => (
                <span key={t} className="ink-minitag">#{t}</span>
              ))}
            </div>
          )}
        </div>
        {!selectionMode && (
          <MoreHorizontal
            size={18}
            className="ink-row-more"
            onClick={(e) => {
              e.stopPropagation();
              onLongPress();
            }}
          />
        )}
      </div>
    </div>
  );
}
