import { useCallback, useState } from "react";

const STORAGE_KEY = "mockdash-settings";

interface PersistedSettings {
  theme: string;
  dark: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  chartColors: string[] | null;
}

const DEFAULTS: PersistedSettings = {
  theme: "slate",
  dark: window.matchMedia("(prefers-color-scheme: dark)").matches,
  reducedMotion: false,
  highContrast: false,
  chartColors: null,
};

function load(): PersistedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function save(settings: PersistedSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // quota exceeded or private browsing -- silently ignore
  }
}

export function usePersistedSettings() {
  const [settings, setSettings] = useState<PersistedSettings>(load);

  const update = useCallback(
    (patch: Partial<PersistedSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        save(next);
        return next;
      });
    },
    []
  );

  return { settings, update };
}
