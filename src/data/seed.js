import { deriveTitle, extractHeadings, countWords, now } from "../lib/utils.js";

export const seedFolders = [
  { id: "f-read", name: "阅读", parentId: null, createdAt: now() - 9e8, sort: 0 },
  { id: "f-work", name: "工作笔记", parentId: null, createdAt: now() - 8e8, sort: 1 },
  { id: "f-idea", name: "灵感", parentId: null, createdAt: now() - 7e8, sort: 2 },
];

export const seedTags = [
  { id: "t-design", name: "设计", createdAt: now() },
  { id: "t-tech", name: "技术", createdAt: now() },
  { id: "t-life", name: "生活", createdAt: now() },
];

const docA = [
  "# 论安静的阅读",
  "",
  "好的阅读工具应当像一扇朝向庭院的窗：你几乎注意不到它，却因为它，看见了想看的风景。",
  "",
  "## 为什么排版重要",
  "",
  "排版不是装饰，而是**理解的脚手架**。合适的行高、留白与字号，决定了眼睛在文字间游走的舒适度。",
  "",
  "> 文字的密度，应当让呼吸有节奏。",
  "",
  "### 几条经验",
  "",
  "- 行高保持在 1.7 到 1.8 之间",
  "- 段落之间留出一个空行的呼吸",
  "- 阅读宽度不宜过宽，约 35 到 40 个汉字一行",
  "",
  "## 衬线还是无衬线",
  "",
  "长文阅读，衬线字体往往更耐看；界面文字则用无衬线更利落。两者可以共存。",
  "",
  "| 场景 | 推荐 |",
  "| --- | --- |",
  "| 正文长文 | 衬线 |",
  "| 界面与标题 | 无衬线 |",
  "",
  "阅读，是一件可以被精心对待的小事。",
].join("\n");

const docB = [
  "# Markdown 渲染要点",
  "",
  "一个轻量渲染器需要稳妥地处理以下结构。",
  "",
  "## 代码块",
  "",
  "代码块应当横向滚动而非换行，保持原始格式：",
  "",
  "```js",
  "function greet(name) {",
  "  return `Hello, ${name}! 这是一段较长的演示代码，用来验证横向滚动是否顺滑`;",
  "}",
  "```",
  "",
  "## 行内元素",
  "",
  "支持 `行内代码`、**加粗**、*斜体*，以及 [链接](https://example.com)。",
  "",
  "## 列表与引用",
  "",
  "1. 解析块级结构",
  "2. 再解析行内元素",
  "3. 输出为可访问的语义标签",
  "",
  "> 渲染的目标不是炫技，而是让人忘记渲染本身。",
].join("\n");

const docC = [
  "# 一个产品灵感",
  "",
  "把手机里散落的笔记，整理成一个能随手翻阅的小书架。",
  "",
  "## 关键词",
  "",
  "安静 · 舒适 · 高效 · 单手友好",
  "",
  "## 待办",
  "",
  "- 验证导入体验",
  "- 打磨阅读页动效",
  "- 设计空状态插画",
].join("\n");

const docD = [
  "# 晨间随笔",
  "",
  "今天醒得很早，窗外的光是淡青色的。煮了一杯咖啡，坐下来读了几页书。",
  "",
  "有些清晨值得被记下来，不为别的，只因当时心很静。",
].join("\n");

export function makeDoc(o) {
  const headings = extractHeadings(o.content);
  return {
    id: o.id,
    title: deriveTitle(o.content, o.filename),
    filename: o.filename,
    content: o.content,
    folderId: o.folderId ?? null,
    tags: o.tags ?? [],
    favorite: !!o.favorite,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    lastOpenedAt: o.lastOpenedAt ?? null,
    readingProgress: { scrollRatio: o.scrollRatio ?? 0, lastHeadingId: null, updatedAt: 0 },
    wordCount: countWords(o.content),
    characterCount: o.content.length,
    extractedHeadings: headings,
  };
}

export const seedDocs = [
  makeDoc({ id: "d1", filename: "quiet-reading.md", content: docA, folderId: "f-read", tags: ["t-design", "t-life"], favorite: true, createdAt: now() - 6e8, updatedAt: now() - 2e7, lastOpenedAt: now() - 3e6, scrollRatio: 0.28 }),
  makeDoc({ id: "d2", filename: "markdown-render.md", content: docB, folderId: "f-work", tags: ["t-tech"], createdAt: now() - 5e8, updatedAt: now() - 9e7, lastOpenedAt: now() - 9e7 }),
  makeDoc({ id: "d3", filename: "product-idea.md", content: docC, folderId: "f-idea", tags: ["t-design"], favorite: true, createdAt: now() - 4e8, updatedAt: now() - 4e8, lastOpenedAt: null }),
  makeDoc({ id: "d4", filename: "morning.md", content: docD, folderId: "f-read", tags: ["t-life"], createdAt: now() - 3e8, updatedAt: now() - 1.5e8, lastOpenedAt: now() - 1.5e8 }),
];
