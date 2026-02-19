import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function getFontFormat(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes(".woff2")) return "woff2";
  if (lower.includes(".woff")) return "woff";
  if (lower.includes(".ttf") || lower.includes(".truetype")) return "ttf";
  if (lower.includes(".otf") || lower.includes(".opentype")) return "otf";
  if (lower.includes(".eot")) return "eot";
  if (lower.includes(".svg")) return "svg";
  return "unknown";
}

export function getFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split("/");
    return decodeURIComponent(parts[parts.length - 1]) || "font-file";
  } catch {
    return "font-file";
  }
}

export function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  return url;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function sanitizeFontFamily(family: string): string {
  return family.replace(/['"]/g, '').trim();
}

export function getWeightName(weight: string): string {
  const weightMap: Record<string, string> = {
    '100': 'Thin',
    '200': 'Extra Light',
    '300': 'Light',
    '400': 'Regular',
    '500': 'Medium',
    '600': 'Semi Bold',
    '700': 'Bold',
    '800': 'Extra Bold',
    '900': 'Black',
    'normal': 'Regular',
    'bold': 'Bold',
  };
  return weightMap[weight] || weight;
}
