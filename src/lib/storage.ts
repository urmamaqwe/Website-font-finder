import { ScanHistoryItem, FavoriteFont, ThemeMode } from './types';

const HISTORY_KEY = 'fontfinder_history';
const FAVORITES_KEY = 'fontfinder_favorites';
const THEME_KEY = 'fontfinder_theme';
const MAX_HISTORY = 50;

// --- History ---
export function getHistory(): ScanHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addHistory(item: ScanHistoryItem): void {
  const history = getHistory();
  const existing = history.findIndex(h => h.url === item.url);
  if (existing !== -1) history.splice(existing, 1);
  history.unshift(item);
  if (history.length > MAX_HISTORY) history.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function removeHistory(id: string): void {
  const history = getHistory().filter(h => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// --- Favorites ---
export function getFavorites(): FavoriteFont[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addFavorite(font: FavoriteFont): void {
  const favorites = getFavorites();
  if (!favorites.find(f => f.url === font.url)) {
    favorites.unshift(font);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

export function removeFavorite(id: string): void {
  const favorites = getFavorites().filter(f => f.id !== id);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function isFavorite(url: string): boolean {
  return getFavorites().some(f => f.url === url);
}

export function clearFavorites(): void {
  localStorage.removeItem(FAVORITES_KEY);
}

// --- Theme ---
export function getTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem(THEME_KEY) as ThemeMode) || 'dark';
}

export function setTheme(mode: ThemeMode): void {
  localStorage.setItem(THEME_KEY, mode);
}
