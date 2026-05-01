import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { UserSettings } from "../types";
import { loadSettings, saveSettings } from "../utils/storage";

interface SettingsCtx {
  settings: UserSettings;
  update: (partial: Partial<UserSettings>) => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);

  const update = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings 必须在 SettingsProvider 内使用");
  return ctx;
}
