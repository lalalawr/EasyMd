# EasyMd · 移动端 Markdown 阅读与文件管理工具

一个安静、舒适、专注于阅读的 iPhone Markdown 知识库 / 文件柜。React + Vite + IndexedDB + PWA。

## 快速开始

需要 Node.js ≥ 18。

```bash
npm install
npm run dev
```

启动后终端会打印两个地址：

- **Local**：`http://localhost:5173` —— 在电脑浏览器查看（建议用开发者工具切到 iPhone 尺寸）。
- **Network**：`http://192.168.x.x:5173` —— 让 **iPhone 连同一个 WiFi**，用 Safari 打开这个地址即可在真机体验。

在 iPhone Safari 里点「分享 → 添加到主屏幕」，就会得到一个全屏、带图标的 App，支持离线打开。

## 构建与部署

```bash
npm run build      # 产物在 dist/
npm run preview    # 本地预览构建产物
```

PWA 的安装与离线能力需要 **HTTPS**（`localhost` 也可）。本工程**已为 GitHub Pages 预配置完毕**：`vite.config.js` 的 `base` 已设为 `/EasyMd/`，PWA manifest 的 `start_url`/`scope` 一并对齐，且自带 `.github/workflows/deploy.yml` 自动部署工作流。你只需把仓库命名为 **EasyMd** 推上去并开启 Pages 即可。

### 一、推送到 GitHub

在项目根目录执行（把 `<你的用户名>` 换成你的 GitHub 用户名）：

```bash
git init
git add .
git commit -m "EasyMd: Markdown reader"
git branch -M main
git remote add origin https://github.com/<你的用户名>/EasyMd.git
git push -u origin main
```

> 仓库名必须是 **EasyMd**（大小写一致），否则与 `base: "/EasyMd/"` 不匹配，页面会白屏。
> 若仓库还不存在，先到 GitHub 点 **New repository** 建一个名为 `EasyMd` 的空仓库（不要勾选自动生成 README，以免与本地冲突）。

### 二、开启 GitHub Pages

1. 打开仓库 → **Settings → Pages**。
2. **Build and deployment → Source** 选择 **GitHub Actions**。
3. 完成。每次 `git push` 到 `main`，`.github/workflows/deploy.yml` 会自动构建并发布。

首次推送后到仓库 **Actions** 标签可看到部署进度；约 1–2 分钟后，访问地址为：

```
https://<你的用户名>.github.io/EasyMd/
```

用 iPhone Safari 打开该地址 → 分享 → 添加到主屏幕，即为可离线的全屏 App。

### 备选：部署到 Vercel（根路径）

如果改用 Vercel/Netlify 或根路径自定义域名，需要把子路径配置改回根路径：把 `vite.config.js` 里的 `const base = "/EasyMd/"` 改为 `const base = "/"`（manifest 的 `start_url`/`scope` 会随之变为 `/`）。然后在 [vercel.com](https://vercel.com) 用 GitHub 登录 → Add New… → Project → 选中仓库 Import，框架自动识别为 Vite（Build：`npm run build`，Output：`dist`）→ Deploy。

## 功能

- **阅读**：自研 Markdown 渲染（标题/列表/引用/代码块横滚/表格/链接/图片）、浅深色、字号/行高/宽度/衬线无衬线调节、自动大纲与点击跳转、当前章节高亮、底部进度条、阅读进度记忆、工具栏滚动自动隐藏。
- **编辑**：纯文本编辑器 + 编辑/预览切换 + 防抖自动保存 + Markdown 快捷工具条（加粗/斜体/标题/列表/引用/代码/链接）；阅读页与操作面板均可进入编辑，新建文档直接进入编辑。
- **管理**：**多级文件夹**（面包屑导航、文件夹重命名/删除并自动把内容移至上级）、标签、收藏、最近阅读；导入多个文件、新建文档；重命名、移动、删除（确认 + Toast 撤销）；四种排序；左滑收藏/删除、长按操作面板；**批量多选**（移动/收藏/删除）。
- **搜索**：分词倒排索引（中文 unigram + bigram、拉丁按词），按文件名/标题/标题层级/标签/正文加权，收藏与最近打开优先，关键词高亮 + 正文匹配片段。
- **备份**：设置页一键导出 JSON 备份、导入备份恢复、清空所有数据。
- **系统**：底部四 Tab、安全区适配、深色模式、PWA 可安装可离线；附带 Capacitor 配置脚手架，便于壳化为原生 App。

## 数据与持久化

所有数据保存在浏览器 **IndexedDB**（库名 `inkwell`，对象仓库 `documents` / `folders` / `tags` / `settings`）。首次启动会写入演示用种子数据；之后导入、编辑、整理均会持久化，刷新不丢失。封装见 `src/db/idb.js`。

> 清空数据：在浏览器开发者工具 Application → IndexedDB 中删除 `inkwell` 库即可恢复到初始种子数据。

## 在 iPhone 上导入文件

点右上角 **+ → 导入 Markdown 文件**，会唤起系统「文件」选择器，可从 iCloud Drive、「我的 iPhone」或第三方网盘里选取，支持一次多选。

针对 iOS 做了两处适配：（1）选择器**不限制扩展名**——iOS 按 UTI 而非后缀过滤，限制 `.md` 会导致文件被置灰点不动，因此放开后在选完时再按扩展名/内容筛出文本与 Markdown 文件，并跳过明显的二进制文件；（2）用原生 `<label>` 唤起选择器、文件 input 以「视觉隐藏」而非 `display:none` 保留在 DOM 中，避免部分 iOS 上程序化点击失效。

## 目录结构

```
inkwell/
├── index.html
├── vite.config.js          # Vite + PWA 配置（manifest 在此）
├── capacitor.config.json   # 壳化为原生 App 的配置脚手架
├── package.json
├── public/
│   ├── favicon.svg
│   └── icons/              # PWA 与 apple-touch 图标
└── src/
    ├── main.jsx            # 入口
    ├── App.jsx             # 导航 / 浮层 / 操作编排（含编辑、多级文件夹、批量、备份）
    ├── styles.css          # 设计令牌 + 阅读排版
    ├── lib/
    │   ├── utils.js        # 工具函数（字数/时间/slug/标题提取…）
    │   └── markdown.jsx    # Markdown 解析与渲染
    ├── search/indexer.js   # 分词倒排索引（CJK n-gram + 拉丁）
    ├── data/seed.js        # 种子数据
    ├── db/idb.js           # IndexedDB 持久化封装（含备份导出/导入/清空）
    ├── hooks/
    │   ├── useStore.js     # 文档/文件夹/标签状态 + 持久化（含批量、删除文件夹、reload）
    │   └── useSettings.js  # 设置状态 + 持久化
    ├── components/         # Sheet / Toast / EmptyState / DocRow / FolderRow
    └── views/              # Library / Search / Favorites / Settings / Reader / Editor
```

## 二期能力（已实现）

下述能力已内置到工程中：

- **编辑器**（`src/views/Editor.jsx`）：`<textarea>` 纯文本编辑 + 编辑/预览切换（预览复用 `MarkdownRenderer` 与阅读排版），输入防抖 700ms 自动保存，保存时用 `deriveTitle`/`extractHeadings`/`countWords` 刷新标题、大纲与字数；底部 Markdown 快捷工具条按选区插入语法。
- **多级文件夹**：基于 `Folder.parentId` 的层级，库页用面包屑导航，子文件夹以列表呈现，新建文件夹默认建在当前层级；删除文件夹会把其直接文档与子文件夹移至上级再删除。
- **批量多选**：库页右上「多选」进入选择模式，底部批量条支持移动 / 收藏 / 删除；`useStore` 提供 `upsertManyDocs` / `removeManyDocs` 批量写以减少 IndexedDB 写次数。
- **数据备份**：设置页「导出备份（JSON）/ 导入备份 / 清空所有数据」，底层用 `db/idb.js` 的 `exportAll` / `replaceAll` / `clearAll`，导入后经 `reload()` 刷新内存状态。
- **倒排索引搜索**（`src/search/indexer.js`）：中文 unigram + bigram、拉丁按词分词，字段分权（文件名 5 / 标题 4 / 标题层级 3 / 标签 2 / 正文 1），叠加收藏与最近打开权重；规模更大时可平滑替换为 flexsearch。

## 仍可继续扩展

- **拖拽整理**：当前文件夹间移动走长按菜单 / 批量条，可再接入 `@dnd-kit` 实现触摸拖拽。
- **Capacitor 壳化为原生 App**：工程已含 `capacitor.config.json`。安装 `@capacitor/core @capacitor/cli`，`npx cap add ios`，`npm run build && npx cap copy`，用 Xcode 运行；再接入 `@capacitor/filesystem` 与 share-extension 插件实现 Document Picker、「用 Inkwell 打开」与 iCloud 同步。UI 与业务代码完全复用现有这套。

## 说明

Markdown 为自研轻量渲染层（`src/lib/markdown.jsx`），覆盖常用语法但**并非完整 CommonMark**，已支持：标题、段落、无序/有序列表、引用、围栏代码块（横向滚动）、表格、分割线、图片，以及行内的加粗、斜体、行内代码、链接，并带关键词高亮。

暂未覆盖：嵌套列表的多级缩进、任务勾选框的交互态、脚注、删除线、自动链接、HTML 内联、数学公式等。如需这些，推荐接入成熟解析器：用 `marked`（项目里已可用）或 `markdown-it` 搭配插件（`markdown-it-task-lists`、`markdown-it-footnote`、KaTeX 等）替换 `parseBlocks` / `parseInline`，**输出仍套用现有 `.ink-md` 阅读排版样式**即可无缝衔接；标题锚点请继续用 `lib/utils.js` 的 `slugify` 生成，保证与大纲跳转一致。
