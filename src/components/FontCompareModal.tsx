'use client';

import { useState } from 'react';
import { FontFile } from '@/lib/types';
import { getWeightName } from '@/lib/utils';
import { X, Minus, Plus, Type } from 'lucide-react';

interface Props {
  fonts: FontFile[];
  onClose: () => void;
}

export default function FontCompareModal({ fonts, onClose }: Props) {
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');
  const [fontSize, setFontSize] = useState(36);

  if (fonts.length < 2) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
            Select at least 2 fonts to compare.
          </p>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const fontFaceCSS = fonts
    .map(
      (f, i) => `@font-face {
  font-family: 'Compare${i}';
  src: url('${f.url}') format('${f.format === 'ttf' ? 'truetype' : f.format === 'otf' ? 'opentype' : f.format}');
  font-weight: ${f.weight};
  font-style: ${f.style};
}`
    )
    .join('\n');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 1000 }}
      >
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
          <h2 style={{ fontSize: 20, fontWeight: 500 }}>Font Comparison</h2>
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
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={previewText}
            onChange={e => setPreviewText(e.target.value)}
            className="input-field"
            style={{ flex: 1, fontSize: 14 }}
            placeholder="Type preview text..."
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Type size={14} />
            <button className="btn-ghost" style={{ padding: '2px 6px' }} onClick={() => setFontSize(prev => Math.max(12, prev - 4))}>
              <Minus size={12} />
            </button>
            <span style={{ fontSize: 13, minWidth: 36, textAlign: 'center' }}>{fontSize}px</span>
            <button className="btn-ghost" style={{ padding: '2px 6px' }} onClick={() => setFontSize(prev => Math.min(100, prev + 4))}>
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* Comparison */}
        <div style={{ padding: 24 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${fonts.length}, 1fr)`,
              gap: 24,
            }}
          >
            {fonts.map((font, i) => (
              <div key={font.url + i}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
                    {font.family}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className={`badge badge-${font.format}`}>{font.format}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {getWeightName(font.weight)}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: `'Compare${i}', sans-serif`,
                    fontSize,
                    fontWeight: parseInt(font.weight) || 400,
                    fontStyle: font.style,
                    lineHeight: 1.4,
                    padding: '20px 0',
                    borderTop: '1px solid var(--border-color)',
                    wordBreak: 'break-word',
                  }}
                >
                  {previewText}
                </div>

                {/* Size comparison */}
                <div style={{ marginTop: 8 }}>
                  {[14, 18, 24, 32, 48].map(size => (
                    <div
                      key={size}
                      style={{
                        fontFamily: `'Compare${i}', sans-serif`,
                        fontSize: size,
                        fontWeight: parseInt(font.weight) || 400,
                        lineHeight: 1.3,
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 8, fontFamily: "'Lay Grotesk', sans-serif" }}>
                        {size}px
                      </span>
                      Aa Bb Cc Dd Ee
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
