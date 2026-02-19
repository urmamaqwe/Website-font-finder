'use client';

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-color)',
        padding: '32px 24px',
        marginTop: 60,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          FontFinder — Discover & download fonts from any website
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Supports WOFF2, WOFF, TTF, OTF, EOT
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            Google Fonts · Adobe Fonts · Custom
          </span>
        </div>
      </div>
    </footer>
  );
}
