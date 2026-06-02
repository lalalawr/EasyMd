import { useState, useEffect, useCallback } from "react";
import {
  loadData,
  seedIfEmpty,
  saveDoc,
  deleteDocById,
  saveFolder,
  deleteFolderById,
} from "../db/idb.js";
import { seedDocs, seedFolders, seedTags } from "../data/seed.js";

export function useStore() {
  const [ready, setReady] = useState(false);
  const [docs, setDocs] = useState([]);
  const [folders, setFolders] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    (async () => {
      await seedIfEmpty({ docs: seedDocs, folders: seedFolders, tags: seedTags });
      const data = await loadData();
      setDocs(data.docs);
      setFolders(data.folders);
      setTags(data.tags);
      setReady(true);
    })();
  }, []);

  // 新增 / 更新单个文档（状态 + 持久化同步）
  const upsertDoc = useCallback((doc) => {
    setDocs((ds) => {
      const exists = ds.some((d) => d.id === doc.id);
      return exists ? ds.map((d) => (d.id === doc.id ? doc : d)) : [doc, ...ds];
    });
    saveDoc(doc);
  }, []);

  // 批量更新（用于批量操作，减少状态更新次数）
  const upsertManyDocs = useCallback((arr) => {
    if (!arr.length) return;
    const map = new Map(arr.map((d) => [d.id, d]));
    setDocs((ds) => {
      const updated = ds.map((d) => (map.has(d.id) ? map.get(d.id) : d));
      const existingIds = new Set(ds.map((d) => d.id));
      const fresh = arr.filter((d) => !existingIds.has(d.id));
      return [...fresh, ...updated];
    });
    arr.forEach((d) => saveDoc(d));
  }, []);

  const upsertDocs = useCallback((arr) => {
    setDocs((ds) => [...arr, ...ds]);
    arr.forEach((d) => saveDoc(d));
  }, []);

  const removeDoc = useCallback((id) => {
    setDocs((ds) => ds.filter((d) => d.id !== id));
    deleteDocById(id);
  }, []);

  const removeManyDocs = useCallback((ids) => {
    const set = new Set(ids);
    setDocs((ds) => ds.filter((d) => !set.has(d.id)));
    ids.forEach((id) => deleteDocById(id));
  }, []);

  const upsertFolder = useCallback((folder) => {
    setFolders((fs) => {
      const exists = fs.some((f) => f.id === folder.id);
      return exists ? fs.map((f) => (f.id === folder.id ? folder : f)) : [...fs, folder];
    });
    saveFolder(folder);
  }, []);

  const removeFolder = useCallback((id) => {
    setFolders((fs) => fs.filter((f) => f.id !== id));
    deleteFolderById(id);
  }, []);

  // 备份导入 / 清空后重新从 IndexedDB 载入
  const reload = useCallback(async () => {
    const data = await loadData();
    setDocs(data.docs);
    setFolders(data.folders);
    setTags(data.tags);
  }, []);

  return {
    ready,
    docs,
    folders,
    tags,
    upsertDoc,
    upsertDocs,
    upsertManyDocs,
    removeDoc,
    removeManyDocs,
    upsertFolder,
    removeFolder,
    reload,
  };
}
