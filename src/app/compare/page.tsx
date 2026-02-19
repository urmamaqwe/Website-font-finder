'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { X, Plus, Type, Minus } from 'lucide-react';

interface CompareFont {
  url: string;
  label: string;
}

export default function ComparePage() {
  const [fonts, setFonts] = useState<CompareFont[]>([
    { url: '', label: '' },
    { url: '', label: '' },
  ]);
  const [previewText, setPreviewText] = useState('The quick brown fox jumps over the lazy dog');
  const [fontSize, setFontSize] = useState(36);

  const updateFont = (index: number, field: 'url' | 'label', value: string) => {
    setFonts(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addSlot = () => {
    if (fonts.length < 6) {
      setFonts(prev => [...prev, { url: '', label: '' }]);
    }
  };

  const removeSlot = (index: number) => {
    if (fonts.length > 2) {
      setFonts(prev => prev.filter((_, i) => i !== index));
    }
  };

  const activeFonts = fonts.filter(f => f.url.trim());

  const fontFaceCSS = activeFonts
    .map(
      (f, i) => `@font-face {
  font-family: 'ManualCompare${i}';
  src: url('${f.url}');
  font-display: swap;
}`
    )
    .join('\n');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, maxWidth: 1100, margin: '0 auto', padding: '40px 24px', width: '100%' }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, marginBottom: 8 }}>
          Font Comparison Tool
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
          Paste font URLs to compare them side by side. You can get URLs from your scan results.
        </p>

        {/* Font URL inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {fonts.map((font, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                placeholder={`Font ${i + 1} label`}
                value={font.label}
                onChange={e => updateFont(i, 'label', e.target.value)}
                className="input-field"
                style={{ maxWidth: 180, fontSize: 13, padding: '8px 12px' }}
              />
              <input
                type="text"
                placeholder="Paste font URL (woff2, woff, ttf, otf)..."
                value={font.url}
                onChange={e => updateFont(i, 'url', e.target.value)}
                className="input-field"
                style={{ flex: 1, fontSize: 13, padding: '8px 12px' }}
              />
              {fonts.length > 2 && (
                <button className="btn-ghost" onClick={() => removeSlot(i)} style={{ padding: 4 }}>
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          {fonts.length < 6 && (
            <button className="btn-ghost" onClick={addSlot} style={{ alignSelf: 'flex-start' }}>
              <Plus size={14} /> Add Font
            </button>
          )}
        </div>

        {/* Controls */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <input
            type="text"
            value={previewText}
            onChange={e => setPreviewText(e.target.value)}
            className="input-field"
            style={{ flex: 1, fontSize: 14, minWidth: 200 }}
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

        {/* Preview */}
        {activeFonts.length > 0 && (
          <>
            <style>{fontFaceCSS}</style>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(activeFonts.length, 3)}, 1fr)`,
                gap: 20,
              }}
            >
              {activeFonts.map((font, i) => (
                <div key={i} className="card" style={{ padding: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, color: 'var(--accent)' }}>
                    {font.label || `Font ${i + 1}`}
                  </div>
                  <div
                    style={{
                      fontFamily: `'ManualCompare${i}', sans-serif`,
                      fontSize,
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                      marginBottom: 16,
                    }}
                  >
                    {previewText}
                  </div>

                  {/* Size ramp */}
                  {[12, 16, 20, 28, 40, 56].map(size => (
                    <div
                      key={size}
                      style={{
                        fontFamily: `'ManualCompare${i}', sans-serif`,
                        fontSize: size,
                        lineHeight: 1.3,
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          marginRight: 8,
                          fontFamily: "'Lay Grotesk', sans-serif",
                        }}
                      >
                        {size}px
                      </span>
                      Aa Bb Cc 123
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

        {activeFonts.length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Paste at least one font URL above to start comparing.
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
