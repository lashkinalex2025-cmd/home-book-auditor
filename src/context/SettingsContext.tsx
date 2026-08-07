import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppSettings } from '@/types/book';
import { DEFAULT_SETTINGS } from '@/types/book';
import { ensureSettings, updateSettings as saveSettings } from '@/db/database';

interface SettingsContextValue {
  settings: AppSettings;
  loading: boolean;
  updateSettings: (patch: Partial<Omit<AppSettings, 'id'>>) => Promise<void>;
  resolvedTheme: 'light' | 'dark';
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function resolveTheme(theme: AppSettings['theme']): 'light' | 'dark' {
  if (theme === 'light' || theme === 'dark') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() =>
    resolveTheme(DEFAULT_SETTINGS.theme),
  );

  useEffect(() => {
    let cancelled = false;
    ensureSettings().then((s) => {
      if (!cancelled) {
        setSettings(s);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const apply = () => {
      const next = resolveTheme(settings.theme);
      setResolvedTheme(next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      document.documentElement.style.colorScheme = next;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', next === 'dark' ? '#0f172a' : '#0f766e');
      }
    };

    apply();

    if (settings.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => apply();
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme]);

  const updateSettings = useCallback(async (patch: Partial<Omit<AppSettings, 'id'>>) => {
    const next = await saveSettings(patch);
    setSettings(next);
  }, []);

  const value = useMemo(
    () => ({ settings, loading, updateSettings, resolvedTheme }),
    [settings, loading, updateSettings, resolvedTheme],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
