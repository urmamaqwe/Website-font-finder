'use client';

import { ScanResult } from '@/lib/types';
import { getWeightName } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Props {
  result: ScanResult;
}

export default function FamilyGroupView({ result }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(result.families.map(f => f.name)));

  const toggle = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>
        Font Families ({result.totalFamilies})
      </h3>
      {result.families.map(family => (
        <div
          key={family.name}
          className="card"
          style={{ marginBottom: 8, overflow: 'hidden' }}
        >
          <button
            onClick={() => toggle(family.name)}
            style={{
              width: '100%',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontFamily: "'Lay Grotesk', sans-serif",
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            <span>{family.name}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {family.variants} variant{family.variants > 1 ? 's' : ''}
              </span>
              {expanded.has(family.name) ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </span>
          </button>

          {expanded.has(family.name) && (
            <div
              style={{
                padding: '0 20px 14px',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                <thead>
                  <tr style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '4px 0' }}>Weight</th>
                    <th>Style</th>
                    <th>Format</th>
                    <th>Size</th>
                    <th>Filename</th>
                  </tr>
                </thead>
                <tbody>
                  {family.fonts.map((font, i) => (
                    <tr
                      key={i}
                      style={{
                        fontSize: 13,
                        borderTop: i > 0 ? '1px solid var(--border-color)' : undefined,
                      }}
                    >
                      <td style={{ padding: '8px 0' }}>
                        {getWeightName(font.weight)} ({font.weight})
                      </td>
                      <td>{font.style}</td>
                      <td>
                        <span className={`badge badge-${font.format}`}>{font.format}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{font.sizeFormatted}</td>
                      <td
                        style={{
                          color: 'var(--text-muted)',
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={font.filename}
                      >
                        {font.filename}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {/* Source indicators */}
      <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {result.googleFonts.length > 0 && (
          <div
            className="card"
            style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span style={{ fontSize: 12, fontWeight: 500, color: '#4285f4' }}>G</span>
            <span style={{ fontSize: 13 }}>
              Google Fonts: {result.googleFonts.join(', ')}
            </span>
          </div>
        )}
        {result.adobeFonts.length > 0 && (
          <div
            className="card"
            style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span style={{ fontSize: 12, fontWeight: 500, color: '#ff0000' }}>Tk</span>
            <span style={{ fontSize: 13 }}>
              Adobe Fonts: {result.adobeFonts.join(', ')}
            </span>
          </div>
        )}
        {result.customFonts.length > 0 && (
          <div
            className="card"
            style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent)' }}>✦</span>
            <span style={{ fontSize: 13 }}>
              Custom Fonts: {result.customFonts.join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
