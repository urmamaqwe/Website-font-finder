'use client';

import { Type } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header
      className="glass"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <a
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'var(--text-primary)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: 'var(--gradient-1)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Type size={20} color="white" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em' }}>
            Font<span className="gradient-text">Finder</span>
          </span>
        </a>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <a href="/" className="btn-ghost">Scanner</a>
          <a href="/history" className="btn-ghost">History</a>
          <a href="/favorites" className="btn-ghost">Favorites</a>
          <a href="/compare" className="btn-ghost">Compare</a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
