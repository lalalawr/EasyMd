// 通用工具函数
export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const now = () => Date.now();

export const FONT_SIZES = [16, 18, 20, 22];
export const WIDTHS = { narrow: 30, comfortable: 36, wide: 44 };

// 把标题文本转为锚点 id（中英文均可），并保证唯一
export function slugify(text, used) {
  let base =
    text
      .trim()
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "") || "h";
  let id = base,
    n = 1;
  while (used.has(id)) id = base + "-" + n++;
  used.add(id);
  return id;
}

// 中英文混合字数估算
export function countWords(text) {
  const stripped = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-\[\]()!]/g, " ");
  const cjk = (stripped.match(/[\u4e00-\u9fa5]/g) || []).length;
  const latin = (stripped.match(/[A-Za-z0-9]+/g) || []).length;
  return cjk + latin;
}

// 相对时间
export function relTime(ts) {
  if (!ts) return "未打开";
  const d = now() - ts,
    m = 60000,
    h = 3600000,
    day = 86400000;
  if (d < m) return "刚刚";
  if (d < h) return Math.floor(d / m) + " 分钟前";
  if (d < day) return Math.floor(d / h) + " 小时前";
  if (d < day * 7) return Math.floor(d / day) + " 天前";
  return new Date(ts).toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
}

// 从内容提取标题；无 H1 时回退到文件名
export function deriveTitle(content, filename) {
  const m = content.match(/^#\s+(.+)$/m);
  if (m) return m[1].replace(/[*_`]/g, "").trim();
  return filename.replace(/\.(md|markdown|txt)$/i, "");
}

// 提取所有标题，用于生成大纲；锚点 id 与渲染层一致
export function extractHeadings(content) {
  const used = new Set();
  const headings = [];
  const lines = content.split("\n");
  let inFence = false;
  lines.forEach((line) => {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const m = line.match(/^(#{1,6})\s+(.*)$/);
    if (m) {
      const text = m[2].replace(/[*_`]/g, "").trim();
      headings.push({ id: slugify(text, used), level: m[1].length, text });
    }
  });
  return headings;
}
