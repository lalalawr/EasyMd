import React, { useMemo } from "react";
import { slugify } from "./utils.js";

/* 行内解析 -> React 节点（支持图片/链接/加粗/斜体/行内代码，可选关键词高亮） */
export function parseInline(text, hl) {
  const nodes = [];
  let key = 0;
  const patterns = [
    { re: /!\[([^\]]*)\]\(([^)\s]+)\)/, type: "image" },
    { re: /\[([^\]]+)\]\(([^)\s]+)\)/, type: "link" },
    { re: /\*\*([^*]+)\*\*/, type: "bold" },
    { re: /__([^_]+)__/, type: "bold" },
    { re: /\*([^*\n]+)\*/, type: "italic" },
    { re: /`([^`]+)`/, type: "code" },
  ];

  function hlText(s) {
    if (!hl) return s;
    const idx = s.toLowerCase().indexOf(hl.toLowerCase());
    if (idx < 0) return s;
    return (
      <>
        {s.slice(0, idx)}
        <mark className="ink-mark">{s.slice(idx, idx + hl.length)}</mark>
        {s.slice(idx + hl.length)}
      </>
    );
  }
  function pushText(s) {
    nodes.push(<React.Fragment key={key++}>{hlText(s)}</React.Fragment>);
  }
  function walk(str) {
    if (!str) return;
    let best = null;
    for (const p of patterns) {
      const m = p.re.exec(str);
      if (m && (best === null || m.index < best.m.index)) best = { p, m };
    }
    if (!best) {
      pushText(str);
      return;
    }
    const { p, m } = best;
    if (m.index > 0) pushText(str.slice(0, m.index));
    if (p.type === "image") {
      nodes.push(<img key={key++} src={m[2]} alt={m[1]} className="ink-img" loading="lazy" />);
    } else if (p.type === "link") {
      nodes.push(
        <a key={key++} href={m[2]} target="_blank" rel="noreferrer" className="ink-link">
          {parseInline(m[1], hl)}
        </a>
      );
    } else if (p.type === "bold") {
      nodes.push(<strong key={key++}>{parseInline(m[1], hl)}</strong>);
    } else if (p.type === "italic") {
      nodes.push(<em key={key++}>{parseInline(m[1], hl)}</em>);
    } else if (p.type === "code") {
      nodes.push(<code key={key++} className="ink-icode">{hlText(m[1])}</code>);
    }
    walk(str.slice(m.index + m[0].length));
  }
  walk(text);
  return nodes;
}

function splitRow(line) {
  return line
    .replace(/^\s*\|?/, "")
    .replace(/\|?\s*$/, "")
    .split("|")
    .map((s) => s.trim());
}

/* 块级解析 -> 块数组 */
export function parseBlocks(content) {
  const lines = content.split("\n");
  const blocks = [];
  const used = new Set();
  let i = 0;
  while (i < lines.length) {
    let line = lines[i];
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1];
      const buf = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) buf.push(lines[i++]);
      i++;
      blocks.push({ type: "code", lang, content: buf.join("\n") });
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const text = h[2].replace(/[*_`]/g, "").trim();
      blocks.push({ type: "heading", level: h[1].length, text: h[2], id: slugify(text, used) });
      i++;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push({ type: "quote", content: buf.join("\n") });
      continue;
    }
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) &&
      lines[i + 1].includes("-")
    ) {
      const header = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") rows.push(splitRow(lines[i++]));
      blocks.push({ type: "table", header, rows });
      continue;
    }
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const items = [];
      const ordered = /^\s*\d+\.\s+/.test(line);
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) {
        const indent = (lines[i].match(/^\s*/)[0] || "").length;
        items.push({ text: lines[i].replace(/^\s*([-*+]|\d+\.)\s+/, ""), indent });
        i++;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    const buf = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6}\s|```|\s*>|\s*([-*+]|\d+\.)\s)/.test(lines[i])
    )
      buf.push(lines[i++]);
    blocks.push({ type: "para", content: buf.join(" ") });
  }
  return blocks;
}

export function MarkdownRenderer({ content, highlight }) {
  const blocks = useMemo(() => parseBlocks(content), [content]);
  return (
    <div className="ink-md">
      {blocks.map((b, idx) => {
        switch (b.type) {
          case "heading": {
            const Tag = "h" + Math.min(b.level, 6);
            return (
              <Tag key={idx} id={b.id} className={"ink-h ink-h" + b.level}>
                {parseInline(b.text, highlight)}
              </Tag>
            );
          }
          case "para":
            return <p key={idx} className="ink-p">{parseInline(b.content, highlight)}</p>;
          case "hr":
            return <hr key={idx} className="ink-hr" />;
          case "quote":
            return (
              <blockquote key={idx} className="ink-quote">
                <MarkdownRenderer content={b.content} highlight={highlight} />
              </blockquote>
            );
          case "code":
            return (
              <pre key={idx} className="ink-pre">
                <code>{b.content}</code>
              </pre>
            );
          case "list":
            return b.ordered ? (
              <ol key={idx} className="ink-ol">
                {b.items.map((it, j) => (
                  <li key={j} style={{ marginLeft: Math.min(it.indent, 8) * 2 }}>{parseInline(it.text, highlight)}</li>
                ))}
              </ol>
            ) : (
              <ul key={idx} className="ink-ul">
                {b.items.map((it, j) => (
                  <li key={j} style={{ marginLeft: Math.min(it.indent, 8) * 2 }}>{parseInline(it.text, highlight)}</li>
                ))}
              </ul>
            );
          case "table":
            return (
              <div key={idx} className="ink-table-wrap">
                <table className="ink-table">
                  <thead>
                    <tr>{b.header.map((c, j) => <th key={j}>{parseInline(c, highlight)}</th>)}</tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>{r.map((c, k) => <td key={k}>{parseInline(c, highlight)}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
