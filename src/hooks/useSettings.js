import { useState, useEffect, useCallback } from "react";
import { loadSettings, saveSettings } from "../db/idb.js";

const DEFAULTS = {
  theme: "system", // system | light | dark
  readerFontSize: 18,
  readerLineHeight: 1.75,
  readerFontFamily: "serif", // serif | sans
  readerWidth: "comfortable", // narrow | comfortable | wide
  defaultSort: "updatedAt",
  autoHideToolbar: true,
};

export function useSettings() {
  const [settings, setStateSettings] = useState(DEFAULTS);

  useEffect(() => {
    (async () => {
      const saved = await loadSettings();
      if (saved) setStateSettings({ ...DEFAULTS, ...saved });
    })();
  }, []);

  // 兼容 React setter 的两种用法：对象或更新函数，并持久化
  const setSettings = useCallback((arg) => {
    setStateSettings((prev) => {
      const next = typeof arg === "function" ? arg(prev) : { ...prev, ...arg };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, setSettings };
}
