'use client';

import { useState } from 'react';
import { FontFile } from '@/lib/types';
import { getWeightName } from '@/lib/utils';
import { X, Download, Heart, Copy, Type, Minus, Plus } from 'lucide-react';

interface Props {
  font: FontFile;
  onClose: () => void;
  onDownload: (font: FontFile) => void;
  onToggleFavorite: (font: FontFile) => void;
  onCopyUrl: (url: string) => void;
  isFavorite: boolean;
}

export default function FontPreviewModal({
  font,
  onClose,
  onDownload,
  onToggleFavorite,
  onCopyUrl,
  isFavorite,
}: Props) {
  const [previewText, setPreviewText] = useState(
    'The quick brown fox jumps over the lazy dog'
  );
  const [fontSize, setFontSize] = useState(32);
  const [lineHeight, setLineHeight] = useState(1.4);
  const [letterSpacing, setLetterSpacing] = useState(0);

  const charSets = {
    'Uppercase': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    'Lowercase': 'abcdefghijklmnopqrstuvwxyz',
    'Numbers': '0123456789',
    'Symbols': '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`',
    'Latin Extended': 'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ',
  };

  const sampleTexts = [
    'The quick brown fox jumps over the lazy dog',
    'Pack my box with five dozen liquor jugs',
    'How vexingly quick daft zebras jump',
    'Sphinx of black quartz, judge my vow',
    'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz',
    '0123456789 $€£¥',
  ];

  // Generate CSS for loading page font via URL
  const fontFaceCSS = `@font-face {
  font-family: 'PreviewFont';
  src: url('${font.url}') format('${font.format === 'ttf' ? 'truetype' : font.format === 'otf' ? 'opentype' : font.format}');
  font-weight: ${font.weight};
  font-style: ${font.style};
}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Inject font-face */}
        <style>{fontFaceCSS}</style>

        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 500 }}>{font.family}</h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <span className={`badge badge-${font.format}`}>{font.format}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {getWeightName(font.weight)} ({font.weight}) · {font.style}
              </span>
              {font.sizeFormatted && (
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  · {font.sizeFormatted}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <Type size={14} />
            Size
            <button className="btn-ghost" style={{ padding: '2px 6px' }} onClick={() => setFontSize(prev => Math.max(8, prev - 2))}>
              <Minus size={12} />
            </button>
            <span style={{ minWidth: 32, textAlign: 'center' }}>{fontSize}px</span>
            <button className="btn-ghost" style={{ padding: '2px 6px' }} onClick={() => setFontSize(prev => Math.min(120, prev + 2))}>
              <Plus size={12} />
            </button>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            Line Height
            <input
              type="range"
              min="0.8"
              max="3"
              step="0.1"
              value={lineHeight}
              onChange={e => setLineHeight(parseFloat(e.target.value))}
              style={{ width: 80 }}
            />
            <span style={{ minWidth: 28 }}>{lineHeight}</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            Spacing
            <input
              type="range"
              min="-5"
              max="20"
              step="0.5"
              value={letterSpacing}
              onChange={e => setLetterSpacing(parseFloat(e.target.value))}
              style={{ width: 80 }}
            />
            <span style={{ minWidth: 28 }}>{letterSpacing}px</span>
          </label>
        </div>

        {/* Preview area */}
        <div style={{ padding: 24 }}>
          {/* Custom text input */}
          <input
            type="text"
            value={previewText}
            onChange={e => setPreviewText(e.target.value)}
            className="input-field"
            style={{ marginBottom: 16, fontSize: 14 }}
            placeholder="Type custom preview text..."
          />

          {/* Main preview */}
          <div
            style={{
              fontFamily: "'PreviewFont', sans-serif",
              fontSize,
              lineHeight,
              letterSpacing: `${letterSpacing}px`,
              fontWeight: parseInt(font.weight) || 400,
              fontStyle: font.style,
              padding: '24px 0',
              borderBottom: '1px solid var(--border-color)',
              wordBreak: 'break-word',
            }}
          >
            {previewText}
          </div>

          {/* Sample text shortcuts */}
          <div style={{ margin: '16px 0', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {sampleTexts.map((text, i) => (
              <button
                key={i}
                className="btn-ghost"
                style={{ fontSize: 11, padding: '4px 8px' }}
                onClick={() => setPreviewText(text)}
              >
                {text.slice(0, 30)}...
              </button>
            ))}
          </div>

          {/* Character Map */}
          <h3
            style={{
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 12,
              marginTop: 24,
              color: 'var(--text-secondary)',
            }}
          >
            Character Map
          </h3>
          {Object.entries(charSets).map(([name, chars]) => (
            <div key={name} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                {name}
              </div>
              <div
                style={{
                  fontFamily: "'PreviewFont', sans-serif",
                  fontSize: 24,
                  fontWeight: parseInt(font.weight) || 400,
                  letterSpacing: '2px',
                  lineHeight: 1.6,
                  wordBreak: 'break-all',
                }}
              >
                {chars}
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <button className="btn-primary" onClick={() => onDownload(font)}>
            <Download size={14} /> Download
          </button>
          <button
            className="btn-secondary"
            onClick={() => onToggleFavorite(font)}
            style={{ color: isFavorite ? '#ef4444' : undefined }}
          >
            <Heart size={14} fill={isFavorite ? '#ef4444' : 'none'} />
            {isFavorite ? 'Saved' : 'Save to Favorites'}
          </button>
          <button className="btn-secondary" onClick={() => onCopyUrl(font.url)}>
            <Copy size={14} /> Copy URL
          </button>
        </div>
      </div>
    </div>
  );
}
