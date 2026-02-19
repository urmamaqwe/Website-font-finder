export interface FontFile {
  url: string;
  format: string;
  family: string;
  weight: string;
  style: string;
  size?: number;
  sizeFormatted?: string;
  filename?: string;
}

export interface FontFamily {
  name: string;
  fonts: FontFile[];
  variants: number;
}

export interface ScanResult {
  url: string;
  scannedAt: string;
  fonts: FontFile[];
  families: FontFamily[];
  totalFonts: number;
  totalFamilies: number;
  scanDuration: number;
  googleFonts: string[];
  adobeFonts: string[];
  customFonts: string[];
}

export interface ScanHistoryItem {
  id: string;
  url: string;
  scannedAt: string;
  totalFonts: number;
  totalFamilies: number;
  familyNames: string[];
}

export interface FavoriteFont {
  id: string;
  family: string;
  weight: string;
  style: string;
  url: string;
  format: string;
  addedAt: string;
  sourceUrl: string;
}

export type SortOption = 'name-asc' | 'name-desc' | 'size-asc' | 'size-desc' | 'weight-asc' | 'weight-desc' | 'format';
export type FilterFormat = 'all' | 'woff2' | 'woff' | 'ttf' | 'otf' | 'eot';
export type ThemeMode = 'light' | 'dark' | 'system';
