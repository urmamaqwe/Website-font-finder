'use client';

import { ScanResult, FontFile } from '@/lib/types';
import {
  Download,
  FileJson,
  Share2,
  Package,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
  result: ScanResult;
  onBulkDownload: (fonts: FontFile[]) => void;
  onToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function BulkActions({ result, onBulkDownload, onToast }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleBulkZipDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch('/api/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fonts: result.fonts.map(f => ({
            url: f.url,
            filename: f.filename || 'font',
            family: f.family,
          })),
          siteName: new URL(result.url).hostname,
        }),
      });

      if (!response.ok) {
        throw new Error('ZIP creation failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${new URL(result.url).hostname.replace(/\./g, '_')}_fonts.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      onToast('ZIP downloaded successfully!', 'success');
    } catch (err) {
      onToast('Failed to create ZIP file', 'error');
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const exportAsJson = () => {
    const data = {
      url: result.url,
      scannedAt: result.scannedAt,
      totalFonts: result.totalFonts,
      totalFamilies: result.totalFamilies,
      families: result.families.map(f => ({
        name: f.name,
        variants: f.variants,
        fonts: f.fonts.map(ff => ({
          url: ff.url,
          format: ff.format,
          weight: ff.weight,
          style: ff.style,
          size: ff.sizeFormatted,
          filename: ff.filename,
        })),
      })),
      googleFonts: result.googleFonts,
      adobeFonts: result.adobeFonts,
      customFonts: result.customFonts,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${new URL(result.url).hostname}_fonts.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    onToast('JSON exported!', 'success');
  };

  const exportAsCss = () => {
    const css = result.fonts
      .map(
        f => `@font-face {
  font-family: '${f.family}';
  src: url('${f.url}') format('${f.format === 'ttf' ? 'truetype' : f.format === 'otf' ? 'opentype' : f.format}');
  font-weight: ${f.weight};
  font-style: ${f.style};
  font-display: swap;
}`
      )
      .join('\n\n');

    const blob = new Blob([css], { type: 'text/css' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${new URL(result.url).hostname}_fonts.css`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    onToast('CSS exported!', 'success');
  };

  const shareResults = async () => {
    const text = `Fonts found on ${result.url}:\n\n${result.families
      .map(f => `${f.name} (${f.variants} variant${f.variants > 1 ? 's' : ''})`)
      .join('\n')}\n\nScanned with FontFinder`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'FontFinder Results', text });
        onToast('Shared!', 'success');
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      onToast('Results copied to clipboard!', 'success');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 24,
      }}
      className="animate-fade-in"
    >
      <button
        className="btn-primary"
        onClick={handleBulkZipDownload}
        disabled={isDownloading}
      >
        {isDownloading ? (
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <Package size={14} />
        )}
        {isDownloading ? 'Creating ZIP...' : `Download All as ZIP (${result.totalFonts})`}
      </button>

      <button className="btn-secondary" onClick={() => onBulkDownload(result.fonts)}>
        <Download size={14} /> Download Individually
      </button>

      <button className="btn-secondary" onClick={exportAsJson}>
        <FileJson size={14} /> Export JSON
      </button>

      <button className="btn-secondary" onClick={exportAsCss}>
        <FileJson size={14} /> Export CSS
      </button>

      <button className="btn-secondary" onClick={shareResults}>
        <Share2 size={14} /> Share
      </button>
    </div>
  );
}
