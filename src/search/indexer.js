// 轻量倒排索引：CJK 采用 unigram + bigram，拉丁按词切分。
// 字段加权：filename 5 / title 4 / heading 3 / tag 2 / body 1。
// 这是 flexsearch 的自研替代，便于离线运行与按需调权。

const FIELD_WEIGHT = { filename: 5, title: 4, heading: 3, tag: 2, body: 1 };

export function tokenize(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const tokens = [];
  // 拉丁/数字词
  const latin = lower.match(/[a-z0-9]+/g);
  if (latin) tokens.push(...latin);
  // CJK：逐字 + 相邻两字
  const cjk = lower.match(/[\u4e00-\u9fa5]/g) || [];
  // 连续 CJK 串做 bigram
  const runs = lower.match(/[\u4e00-\u9fa5]+/g) || [];
  for (const run of runs) {
    for (let i = 0; i < run.length; i++) {
      tokens.push(run[i]); // unigram
      if (i + 1 < run.length) tokens.push(run.slice(i, i + 2)); // bigram
    }
  }
  return tokens;
}

// 构建索引：token -> Map(docId -> 累计权重)
export function buildIndex(docs, tagNameFn) {
  const index = new Map();
  const addField = (docId, text, weight) => {
    const seen = new Set();
    for (const tk of tokenize(text)) {
      // 同字段同 token 只计一次权重，避免长文反复加分
      const key = tk;
      if (seen.has(key)) continue;
      seen.add(key);
      let posting = index.get(key);
      if (!posting) {
        posting = new Map();
        index.set(key, posting);
      }
      posting.set(docId, (posting.get(docId) || 0) + weight);
    }
  };
  for (const d of docs) {
    addField(d.id, d.filename, FIELD_WEIGHT.filename);
    addField(d.id, d.title, FIELD_WEIGHT.title);
    addField(d.id, d.extractedHeadings.map((h) => h.text).join(" "), FIELD_WEIGHT.heading);
    addField(d.id, d.tags.map((t) => tagNameFn(t)).join(" "), FIELD_WEIGHT.tag);
    addField(d.id, d.content, FIELD_WEIGHT.body);
  }
  return index;
}

// 检索：返回 [{docId, score}]，按分数降序
export function queryIndex(index, query) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  const scores = new Map();
  const uniq = [...new Set(tokens)];
  for (const tk of uniq) {
    const posting = index.get(tk);
    if (!posting) continue;
    for (const [docId, w] of posting) {
      scores.set(docId, (scores.get(docId) || 0) + w);
    }
  }
  return [...scores.entries()].map(([docId, score]) => ({ docId, score }));
}

// 从正文提取匹配片段（优先整词命中，其次首个 token）
export function makeSnippet(content, query) {
  const lc = content.toLowerCase();
  let idx = lc.indexOf(query.toLowerCase());
  let len = query.length;
  if (idx < 0) {
    const tks = tokenize(query);
    for (const tk of tks) {
      const p = lc.indexOf(tk);
      if (p >= 0) {
        idx = p;
        len = tk.length;
        break;
      }
    }
  }
  if (idx < 0) return null;
  const s = Math.max(0, idx - 30);
  const e = Math.min(content.length, idx + len + 40);
  return (
    (s > 0 ? "…" : "") +
    content.slice(s, e).replace(/\n/g, " ").replace(/[#>*`]/g, "") +
    (e < content.length ? "…" : "")
  );
}
