'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { ScanResult, FontFile, FavoriteFont, ScanHistoryItem } from '@/lib/types';
import { generateId, normalizeUrl } from '@/lib/utils';
import {
  addHistory,
  addFavorite,
  removeFavorite,
  isFavorite as checkIsFavorite,
  getFavorites,
  getHistory,
} from '@/lib/storage';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';
import { useToast, ToastContainer } from '@/components/Toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import UrlScanner from '@/components/UrlScanner';
import ScanStats from '@/components/ScanStats';
import ScanSkeleton from '@/components/ScanSkeleton';
import FontGrid from '@/components/FontGrid';
import FontPreviewModal from '@/components/FontPreviewModal';
import FontCompareModal from '@/components/FontCompareModal';
import BulkActions from '@/components/BulkActions';
import FamilyGroupView from '@/components/FamilyGroupView';
import { Clock, RotateCcw } from 'lucide-react';

export default function HomePage() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFont, setPreviewFont] = useState<FontFile | null>(null);
  const [compareUrls, setCompareUrls] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'families'>('grid');
  const scannerRef = useRef<{ focusInput: () => void; triggerScan: (url: string) => void } | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      return getFavorites().map(f => f.url);
    }
    return [];
  });
  const { toasts, addToast, removeToast } = useToast();

  // Recent scans for quick re-scan
  const recentScans = useMemo<ScanHistoryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    return getHistory().slice(0, 5);
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useKeyboardShortcuts(
    useMemo(
      () => ({
        'ctrl+k': () => scannerRef.current?.focusInput(),
        'escape': () => {
          if (previewFont) setPreviewFont(null);
          else if (showCompare) setShowCompare(false);
        },
        'ctrl+shift+d': () => {
          if (result) {
            const a = document.createElement('a');
            a.href = `/api/download-zip`;
            addToast('Use the Download All button to get ZIP', 'info');
          }
        },
      }),
      [previewFont, showCompare, result, addToast]
    )
  );

  const handleScan = useCallback(
    async (url: string) => {
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const normalizedUrl = normalizeUrl(url);
        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: normalizedUrl }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Scan failed');
        }

        setResult(data);

        // Save to history
        addHistory({
          id: generateId(),
          url: data.url,
          scannedAt: data.scannedAt,
          totalFonts: data.totalFonts,
          totalFamilies: data.totalFamilies,
          familyNames: data.families.map((f: { name: string }) => f.name),
        });

        addToast(`Found ${data.totalFonts} fonts in ${data.totalFamilies} families!`, 'success');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Scan failed';
        setError(message);
        addToast(message, 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [addToast]
  );

  const handleDownload = useCallback(
    (font: FontFile) => {
      const a = document.createElement('a');
      a.href = `/api/download?url=${encodeURIComponent(font.url)}&filename=${encodeURIComponent(
        font.filename || 'font'
      )}`;
      a.download = font.filename || 'font';
      document.body.appendChild(a);
      a.click();
      a.remove();
      addToast(`Downloading ${font.filename}`, 'info');
    },
    [addToast]
  );

  const handleBulkDownload = useCallback(
    (fonts: FontFile[]) => {
      fonts.forEach((font, i) => {
        setTimeout(() => handleDownload(font), i * 300);
      });
    },
    [handleDownload]
  );

  const handleToggleFavorite = useCallback(
    (font: FontFile) => {
      if (checkIsFavorite(font.url)) {
        const favs = getFavorites();
        const fav = favs.find(f => f.url === font.url);
        if (fav) removeFavorite(fav.id);
        setFavorites(prev => prev.filter(u => u !== font.url));
        addToast(`Removed ${font.family} from favorites`, 'info');
      } else {
        const newFav: FavoriteFont = {
          id: generateId(),
          family: font.family,
          weight: font.weight,
          style: font.style,
          url: font.url,
          format: font.format,
          addedAt: new Date().toISOString(),
          sourceUrl: result?.url || '',
        };
        addFavorite(newFav);
        setFavorites(prev => [...prev, font.url]);
        addToast(`Added ${font.family} to favorites!`, 'success');
      }
    },
    [addToast, result]
  );

  const handleCopyUrl = useCallback(
    async (url: string) => {
      await navigator.clipboard.writeText(url);
      addToast('URL copied to clipboard!', 'success');
    },
    [addToast]
  );

  const handleCopyCss = useCallback(
    async (font: FontFile) => {
      const css = `@font-face {
  font-family: '${font.family}';
  src: url('${font.url}') format('${font.format === 'ttf' ? 'truetype' : font.format === 'otf' ? 'opentype' : font.format}');
  font-weight: ${font.weight};
  font-style: ${font.style};
  font-display: swap;
}`;
      await navigator.clipboard.writeText(css);
      addToast('CSS copied to clipboard!', 'success');
    },
    [addToast]
  );

  const handleSelectForCompare = useCallback(
    (font: FontFile) => {
      setCompareUrls(prev => {
        if (prev.includes(font.url)) {
          return prev.filter(u => u !== font.url);
        }
        if (prev.length >= 4) {
          addToast('Maximum 4 fonts for comparison', 'info');
          return prev;
        }
        return [...prev, font.url];
      });
    },
    [addToast]
  );

  const compareFonts = result?.fonts.filter(f => compareUrls.includes(f.url)) || [];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1 }}>
        <UrlScanner ref={scannerRef} onScan={handleScan} isLoading={isLoading} />

        {/* Recent Scans (only when no active scan result) */}
        {!result && !isLoading && recentScans.length > 0 && (
          <div
            style={{
              maxWidth: 640,
              margin: '0 auto 32px',
              padding: '0 24px',
            }}
            className="animate-fade-in"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                justifyContent: 'center',
              }}
            >
              <Clock size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Recent scans</span>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {recentScans.map(scan => (
                <button
                  key={scan.id}
                  className="card"
                  onClick={() => handleScan(scan.url)}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    border: '1px solid var(--border-color)',
                    background: 'var(--card-bg)',
                    transition: 'border-color 0.2s',
                  }}
                  title={`Re-scan ${scan.url} (${scan.totalFonts} fonts found)`}
                >
                  <RotateCcw size={12} style={{ color: 'var(--accent)' }} />
                  <span style={{ color: 'var(--text-primary)' }}>
                    {new URL(scan.url).hostname}
                  </span>
                  <span className="badge badge-woff2">{scan.totalFonts}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && <ScanSkeleton />}

        {error && !isLoading && (
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 24px' }}>
            <div
              className="card animate-fade-in"
              style={{
                padding: '20px 24px',
                borderColor: 'var(--error)',
                textAlign: 'center',
              }}
            >
              <p style={{ color: 'var(--error)', fontSize: 15, marginBottom: 8 }}>
                {error}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Make sure the URL is correct and the website is accessible.
              </p>
            </div>
          </div>
        )}

        {result && !isLoading && (
          <div
            style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}
            className="animate-fade-in"
          >
            <ScanStats result={result} />

            <BulkActions
              result={result}
              onBulkDownload={handleBulkDownload}
              onToast={addToast}
            />

            {/* View mode toggle + compare button */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
              <div className="tab-list">
                <button
                  className={`tab-item ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  Grid View
                </button>
                <button
                  className={`tab-item ${viewMode === 'families' ? 'active' : ''}`}
                  onClick={() => setViewMode('families')}
                >
                  Family View
                </button>
              </div>

              {compareUrls.length >= 2 && (
                <button
                  className="btn-primary"
                  style={{ fontSize: 13, padding: '8px 16px' }}
                  onClick={() => setShowCompare(true)}
                >
                  Compare {compareUrls.length} Fonts
                </button>
              )}
              {compareUrls.length > 0 && (
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12 }}
                  onClick={() => setCompareUrls([])}
                >
                  Clear Compare
                </button>
              )}
            </div>

            {viewMode === 'grid' ? (
              <FontGrid
                fonts={result.fonts}
                onDownload={handleDownload}
                onToggleFavorite={handleToggleFavorite}
                onPreview={setPreviewFont}
                onCopyUrl={handleCopyUrl}
                onCopyCss={handleCopyCss}
                onSelectForCompare={handleSelectForCompare}
                isFavorite={url => favorites.includes(url)}
                selectedForCompare={compareUrls}
              />
            ) : (
              <FamilyGroupView result={result} />
            )}
          </div>
        )}
      </main>

      <Footer />

      {/* Modals */}
      {previewFont && (
        <FontPreviewModal
          font={previewFont}
          onClose={() => setPreviewFont(null)}
          onDownload={handleDownload}
          onToggleFavorite={handleToggleFavorite}
          onCopyUrl={handleCopyUrl}
          isFavorite={favorites.includes(previewFont.url)}
        />
      )}

      {showCompare && (
        <FontCompareModal
          fonts={compareFonts}
          onClose={() => setShowCompare(false)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
