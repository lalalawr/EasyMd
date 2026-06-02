import React, { useState, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
import DocRow from "../components/DocRow.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { now } from "../lib/utils.js";
import { buildIndex, queryIndex, makeSnippet } from "../search/indexer.js";

function SnippetHL({ text, q }) {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="ink-mark">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export default function SearchView({ docs, folderName, tagName, onOpen, onFav, onDelete, onLong }) {
  const [raw, setRaw] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(raw.trim()), 150);
    return () => clearTimeout(t);
  }, [raw]);

  // 倒排索引：随文档集变化重建
  const index = useMemo(() => buildIndex(docs, tagName), [docs, tagName]);
  const byId = useMemo(() => new Map(docs.map((d) => [d.id, d])), [docs]);

  const results = useMemo(() => {
    if (!q) return [];
    const hits = queryIndex(index, q);
    const scored = [];
    for (const { docId, score: base } of hits) {
      const d = byId.get(docId);
      if (!d) continue;
      let score = base;
      if (d.favorite) score += 2; // 收藏优先
      if (d.lastOpenedAt) score += Math.max(0, 1.5 - ((now() - d.lastOpenedAt) / 8.64e7) * 0.2); // 最近打开优先
      scored.push({ d, score, snippet: makeSnippet(d.content, q) });
    }
    scored.sort((a, b) => b.score - a.score || b.d.updatedAt - a.d.updatedAt);
    return scored;
  }, [q, index, byId]);

  return (
    <div className="ink-page">
      <header className="ink-header">
        <h1 className="ink-h1">搜索</h1>
      </header>
      <div className="ink-searchbar">
        <Search size={18} />
        <input
          autoFocus
          className="ink-search-input"
          placeholder="文件名、标题、正文、标签…"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
        />
        {raw && (
          <button onClick={() => setRaw("")}>
            <X size={16} />
          </button>
        )}
      </div>
      <section className="ink-section">
        {!q && (
          <EmptyState icon={<Search size={34} />} title="搜索你的知识库" desc="分词倒排索引，支持中英文文件名、标题、标签与正文" />
        )}
        {q && results.length === 0 && (
          <EmptyState icon={<Search size={34} />} title="没有匹配结果" desc={"未找到与「" + q + "」相关的内容"} />
        )}
        {results.length > 0 && (
          <div className="ink-list">
            <div className="ink-section-title">{results.length} 条结果</div>
            {results.map(({ d, snippet }) => (
              <DocRow
                key={d.id}
                doc={d}
                folderName={folderName(d.folderId)}
                tagNames={d.tags.map(tagName)}
                highlight={q}
                snippet={snippet ? <SnippetHL text={snippet} q={q} /> : null}
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
