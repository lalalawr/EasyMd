import { openDB } from "idb";

const DB_NAME = "inkwell";
const DB_VERSION = 1;

let _db = null;
export async function getDB() {
  if (_db) return _db;
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("documents")) db.createObjectStore("documents", { keyPath: "id" });
      if (!db.objectStoreNames.contains("folders")) db.createObjectStore("folders", { keyPath: "id" });
      if (!db.objectStoreNames.contains("tags")) db.createObjectStore("tags", { keyPath: "id" });
      if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings"); // key/value
    },
  });
  return _db;
}

/* ---- 读取 ---- */
export async function loadData() {
  const db = await getDB();
  const [docs, folders, tags] = await Promise.all([
    db.getAll("documents"),
    db.getAll("folders"),
    db.getAll("tags"),
  ]);
  return { docs, folders, tags };
}

// 首次启动：库为空则写入种子数据
export async function seedIfEmpty(seed) {
  const db = await getDB();
  const count = await db.count("documents");
  if (count > 0) return false;
  const tx = db.transaction(["documents", "folders", "tags"], "readwrite");
  seed.docs.forEach((d) => tx.objectStore("documents").put(d));
  seed.folders.forEach((f) => tx.objectStore("folders").put(f));
  seed.tags.forEach((t) => tx.objectStore("tags").put(t));
  await tx.done;
  return true;
}

/* ---- 文档 ---- */
export async function saveDoc(doc) {
  const db = await getDB();
  await db.put("documents", doc);
}
export async function deleteDocById(id) {
  const db = await getDB();
  await db.delete("documents", id);
}

/* ---- 文件夹 / 标签 ---- */
export async function saveFolder(folder) {
  const db = await getDB();
  await db.put("folders", folder);
}
export async function deleteFolderById(id) {
  const db = await getDB();
  await db.delete("folders", id);
}
export async function saveTag(tag) {
  const db = await getDB();
  await db.put("tags", tag);
}

/* ---- 设置（单条 key="app"） ---- */
export async function loadSettings() {
  const db = await getDB();
  return (await db.get("settings", "app")) || null;
}
export async function saveSettings(settings) {
  const db = await getDB();
  await db.put("settings", settings, "app");
}

/* ---- 导出 / 导入 / 清空（设置页用） ---- */
export async function exportAll() {
  return loadData();
}
export async function clearAll() {
  const db = await getDB();
  const tx = db.transaction(["documents", "folders", "tags", "settings"], "readwrite");
  await Promise.all([
    tx.objectStore("documents").clear(),
    tx.objectStore("folders").clear(),
    tx.objectStore("tags").clear(),
    tx.objectStore("settings").clear(),
  ]);
  await tx.done;
}
// 用备份数据整库替换（导入恢复）
export async function replaceAll({ docs, folders, tags, settings }) {
  const db = await getDB();
  const tx = db.transaction(["documents", "folders", "tags", "settings"], "readwrite");
  tx.objectStore("documents").clear();
  tx.objectStore("folders").clear();
  tx.objectStore("tags").clear();
  (docs || []).forEach((d) => tx.objectStore("documents").put(d));
  (folders || []).forEach((f) => tx.objectStore("folders").put(f));
  (tags || []).forEach((t) => tx.objectStore("tags").put(t));
  if (settings) tx.objectStore("settings").put(settings, "app");
  await tx.done;
}
