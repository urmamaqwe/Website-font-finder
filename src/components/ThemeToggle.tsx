'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { ThemeMode } from '@/lib/types';
import { getTheme, setTheme as saveTheme } from '@/lib/storage';

export default function ThemeToggle() {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    const saved = getTheme();
    setThemeState(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    let resolved = mode;
    if (mode === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', resolved);
  };

  const cycle = () => {
    const modes: ThemeMode[] = ['dark', 'light', 'system'];
    const idx = modes.indexOf(theme);
    const next = modes[(idx + 1) % modes.length];
    setThemeState(next);
    saveTheme(next);
    applyTheme(next);
  };

  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <button
      onClick={cycle}
      className="btn-ghost"
      title={`Theme: ${theme}`}
      aria-label={`Switch theme, current: ${theme}`}
    >
      <Icon size={18} />
    </button>
  );
}
