import React, { useState } from "react";
import { Star, Hash } from "lucide-react";
import DocRow from "../components/DocRow.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function FavoritesView({ docs, tags, folderName, tagName, onOpen, onFav, onDelete, onLong }) {
  const [activeTag, setActiveTag] = useState(null);
  const favs = docs.filter((d) => d.favorite);
  const tagged = activeTag ? docs.filter((d) => d.tags.includes(activeTag)) : favs;

  return (
    <div className="ink-page">
      <header className="ink-header">
        <h1 className="ink-h1">收藏</h1>
      </header>
      <div className="ink-folder-strip">
        <button
          className={"ink-folder-chip" + (activeTag === null ? " on" : "")}
          onClick={() => setActiveTag(null)}
        >
          <Star size={13} /> 收藏
        </button>
        {tags.map((t) => (
          <button
            key={t.id}
            className={"ink-folder-chip" + (activeTag === t.id ? " on" : "")}
            onClick={() => setActiveTag(t.id)}
          >
            <Hash size={12} /> {t.name}
          </button>
        ))}
      </div>
      <section className="ink-section">
        {tagged.length === 0 ? (
          <EmptyState
            icon={<Star size={34} />}
            title={activeTag ? "该标签下没有文档" : "还没有收藏"}
            desc={activeTag ? null : "在列表左滑或长按即可收藏"}
          />
        ) : (
          <div className="ink-list">
            {tagged.map((d) => (
              <DocRow
                key={d.id}
                doc={d}
                folderName={folderName(d.folderId)}
                tagNames={d.tags.map(tagName)}
                onOpen={() => onOpen(d.id)}
                onFav={() => onFav(d.id)}
                onDelete={() => onDelete(d.id)}
                onLongPress={() => onLong(d)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
