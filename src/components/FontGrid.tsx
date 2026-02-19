'use client';

import { useState } from 'react';
import { FontFile, SortOption, FilterFormat } from '@/lib/types';
import { getWeightName } from '@/lib/utils';
import {
  Download,
  Heart,
  Copy,
  Eye,
  ArrowUpDown,
  Filter,
  CheckSquare,
  Square,
  Code,
} from 'lucide-react';

/**
 * Dynamically inject @font-face rules so grid cards show the actual font.
 * Each unique URL gets a unique CSS family name ('FontPreview_<hash>').
 */
const loadedFontUrls = new Set<string>();

function loadFontForPreview(font: FontFile): string {
  const familyName = `FontPreview_${hashUrl(font.url)}`;
  if (loadedFontUrls.has(font.url)) return familyName;
  loadedFontUrls.add(font.url);

  const formatMap: Record<string, string> = {
    woff2: 'woff2',
    woff: 'woff',
    ttf: 'truetype',
    otf: 'opentype',
    eot: 'embedded-opentype',
  };
  const fmt = formatMap[font.format] || font.format;

  try {
    const style = document.createElement('style');
    style.textContent = `@font-face {
  font-family: '${familyName}';
  src: url('${font.url}') format('${fmt}');
  font-weight: ${font.weight};
  font-style: ${font.style};
  font-display: swap;
}`;
    document.head.appendChild(style);
  } catch { /* SSR guard */ }

  return familyName;
}

function hashUrl(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = ((h << 5) - h + url.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

interface Props {
  fonts: FontFile[];
  onDownload: (font: FontFile) => void;
  onToggleFavorite: (font: FontFile) => void;
  onPreview: (font: FontFile) => void;
  onCopyUrl: (url: string) => void;
  onCopyCss: (font: FontFile) => void;
  onSelectForCompare: (font: FontFile) => void;
  isFavorite: (url: string) => boolean;
  selectedForCompare: string[];
}

export default function FontGrid({
  fonts,
  onDownload,
  onToggleFavorite,
  onPreview,
  onCopyUrl,
  onCopyCss,
  onSelectForCompare,
  isFavorite,
  selectedForCompare,
}: Props) {
  const [sort, setSort] = useState<SortOption>('name-asc');
  const [filter, setFilter] = useState<FilterFormat>('all');
  const [search, setSearch] = useState('');
  const [selectedFonts, setSelectedFonts] = useState<Set<string>>(new Set());

  // Filter
  let filtered = fonts;
  if (filter !== 'all') {
    filtered = filtered.filter(f => f.format === filter);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      f =>
        f.family.toLowerCase().includes(q) ||
        f.format.toLowerCase().includes(q) ||
        f.filename?.toLowerCase().includes(q)
    );
  }

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'name-asc': return a.family.localeCompare(b.family);
      case 'name-desc': return b.family.localeCompare(a.family);
      case 'size-asc': return (a.size || 0) - (b.size || 0);
      case 'size-desc': return (b.size || 0) - (a.size || 0);
      case 'weight-asc': return parseInt(a.weight) - parseInt(b.weight);
      case 'weight-desc': return parseInt(b.weight) - parseInt(a.weight);
      case 'format': return a.format.localeCompare(b.format);
      default: return 0;
    }
  });

  const toggleSelect = (url: string) => {
    setSelectedFonts(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedFonts.size === sorted.length) {
      setSelectedFonts(new Set());
    } else {
      setSelectedFonts(new Set(sorted.map(f => f.url)));
    }
  };

  const formats: FilterFormat[] = ['all', 'woff2', 'woff', 'ttf', 'otf', 'eot'];
  const formatCounts: Record<string, number> = {};
  for (const f of fonts) {
    formatCounts[f.format] = (formatCounts[f.format] || 0) + 1;
  }

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
          <input
            type="text"
            placeholder="Search fonts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field"
            style={{ fontSize: 13, padding: '8px 12px' }}
          />
        </div>

        <div className="tab-list" style={{ flexShrink: 0 }}>
          {formats.map(fmt => {
            const count = fmt === 'all' ? fonts.length : (formatCounts[fmt] || 0);
            if (fmt !== 'all' && count === 0) return null;
            return (
              <button
                key={fmt}
                className={`tab-item ${filter === fmt ? 'active' : ''}`}
                onClick={() => setFilter(fmt)}
              >
                <Filter size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                {fmt === 'all' ? 'All' : fmt.toUpperCase()} ({count})
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            className="input-field"
            style={{ fontSize: 13, padding: '8px 12px', width: 'auto', cursor: 'pointer' }}
          >
            <option value="name-asc">Name A→Z</option>
            <option value="name-desc">Name Z→A</option>
            <option value="size-asc">Size ↑</option>
            <option value="size-desc">Size ↓</option>
            <option value="weight-asc">Weight ↑</option>
            <option value="weight-desc">Weight ↓</option>
            <option value="format">Format</option>
          </select>
          <ArrowUpDown size={14} style={{ color: 'var(--text-muted)' }} />
        </div>

        <button className="btn-ghost" onClick={selectAll} style={{ fontSize: 13 }}>
          {selectedFonts.size === sorted.length && sorted.length > 0 ? (
            <><CheckSquare size={14} /> Deselect All</>
          ) : (
            <><Square size={14} /> Select All</>
          )}
        </button>
      </div>

      {/* Results count */}
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
        Showing {sorted.length} of {fonts.length} fonts
        {selectedFonts.size > 0 && (
          <span style={{ marginLeft: 8, color: 'var(--accent)' }}>
            ({selectedFonts.size} selected)
          </span>
        )}
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div
          className="card"
          style={{
            padding: 40,
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          No fonts match your filters.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 12,
          }}
        >
          {sorted.map((font, idx) => {
            // Load font dynamically for live preview
            const previewFamily = typeof window !== 'undefined' ? loadFontForPreview(font) : '';

            return (
            <div
              key={font.url + idx}
              className="card animate-fade-in"
              style={{
                padding: 20,
                animationDelay: `${idx * 30}ms`,
                opacity: 0,
                border: selectedFonts.has(font.url)
                  ? '1px solid var(--accent)'
                  : undefined,
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {font.family}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span className={`badge badge-${font.format}`}>{font.format}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {getWeightName(font.weight)} ({font.weight})
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {font.style}
                    </span>
                    {font.sizeFormatted && (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        · {font.sizeFormatted}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleSelect(font.url)}
                  className="btn-ghost"
                  style={{ padding: 4 }}
                >
                  {selectedFonts.has(font.url) ? (
                    <CheckSquare size={16} style={{ color: 'var(--accent)' }} />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </div>

              {/* Preview — uses live-loaded font */}
              <div
                style={{
                  padding: '12px 0',
                  borderTop: '1px solid var(--border-color)',
                  borderBottom: '1px solid var(--border-color)',
                  marginBottom: 12,
                  fontSize: 20,
                  fontFamily: previewFamily ? `'${previewFamily}', sans-serif` : 'inherit',
                  fontWeight: parseInt(font.weight) || 400,
                  fontStyle: font.style,
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                The quick brown fox jumps over the lazy dog
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <button
                  onClick={() => onDownload(font)}
                  className="btn-ghost"
                  style={{ fontSize: 12 }}
                  title="Download font"
                >
                  <Download size={14} /> Download
                </button>
                <button
                  onClick={() => onPreview(font)}
                  className="btn-ghost"
                  style={{ fontSize: 12 }}
                  title="Preview font"
                >
                  <Eye size={14} /> Preview
                </button>
                <button
                  onClick={() => onToggleFavorite(font)}
                  className="btn-ghost"
                  style={{
                    fontSize: 12,
                    color: isFavorite(font.url) ? '#ef4444' : undefined,
                  }}
                  title={isFavorite(font.url) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart
                    size={14}
                    fill={isFavorite(font.url) ? '#ef4444' : 'none'}
                  />{' '}
                  {isFavorite(font.url) ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={() => onCopyCss(font)}
                  className="btn-ghost"
                  style={{ fontSize: 12 }}
                  title="Copy CSS @font-face"
                >
                  <Code size={14} /> CSS
                </button>
                <button
                  onClick={() => onCopyUrl(font.url)}
                  className="btn-ghost"
                  style={{ fontSize: 12 }}
                  title="Copy font URL"
                >
                  <Copy size={14} /> URL
                </button>
                <button
                  onClick={() => onSelectForCompare(font)}
                  className="btn-ghost"
                  style={{
                    fontSize: 12,
                    color: selectedForCompare.includes(font.url)
                      ? 'var(--accent)'
                      : undefined,
                  }}
                  title="Select for comparison"
                >
                  <ArrowUpDown size={14} /> Compare
                </button>
              </div>

              {/* Filename */}
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={font.filename}
              >
                {font.filename}
              </div>
            </div>
          );
          })}
        </div>
      )}

      {/* Bulk actions bar */}
      {selectedFonts.size > 0 && (
        <div
          className="glass animate-slide-up"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            borderRadius: 14,
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            zIndex: 90,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {selectedFonts.size} fonts selected
          </span>
          <button
            className="btn-primary"
            style={{ fontSize: 13, padding: '8px 16px' }}
            onClick={() => {
              const selected = sorted.filter(f => selectedFonts.has(f.url));
              selected.forEach(f => onDownload(f));
            }}
          >
            <Download size={14} /> Download Selected
          </button>
          <button
            className="btn-secondary"
            style={{ fontSize: 13, padding: '8px 16px' }}
            onClick={() => setSelectedFonts(new Set())}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
