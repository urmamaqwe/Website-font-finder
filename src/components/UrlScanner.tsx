'use client';

import { useState, FormEvent, useRef, useImperativeHandle, forwardRef } from 'react';
import { Search, Loader2, Globe, Command } from 'lucide-react';

interface Props {
  onScan: (url: string) => void;
  isLoading: boolean;
}

export interface UrlScannerRef {
  focusInput: () => void;
  triggerScan: (url: string) => void;
}

const UrlScanner = forwardRef<UrlScannerRef, Props>(function UrlScanner({ onScan, isLoading }, ref) {
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focusInput: () => inputRef.current?.focus(),
    triggerScan: (scanUrl: string) => {
      setUrl(scanUrl);
      onScan(scanUrl);
    },
  }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onScan(url.trim());
    }
  };

  const exampleSites = [
    'apple.com',
    'stripe.com',
    'linear.app',
    'vercel.com',
    'github.com',
    'dribbble.com',
  ];

  return (
    <div style={{ textAlign: 'center', padding: '60px 24px 40px' }}>
      <div className="animate-fade-in">
        <h1
          style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: 16,
          }}
        >
          Discover fonts from{' '}
          <span className="gradient-text">any website</span>
        </h1>
        <p
          style={{
            fontSize: 18,
            color: 'var(--text-secondary)',
            maxWidth: 560,
            margin: '0 auto 36px',
            lineHeight: 1.6,
          }}
        >
          Enter a URL to scan and find all fonts used. Preview, compare, and download them individually or in bulk.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="animate-slide-up"
        style={{
          maxWidth: 640,
          margin: '0 auto',
          display: 'flex',
          gap: 8,
        }}
      >
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Globe
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Enter website URL (e.g. stripe.com)"
            className="input-field"
            style={{ paddingLeft: 42, paddingRight: 70 }}
            disabled={isLoading}
            autoFocus
          />
          <span
            style={{
              position: 'absolute',
              right: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              fontSize: 11,
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              opacity: 0.6,
            }}
          >
            <Command size={11} /> K
          </span>
        </div>
        <button
          type="submit"
          className="btn-primary"
          disabled={!url.trim() || isLoading}
          style={{ whiteSpace: 'nowrap', padding: '12px 24px' }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Scanning...
            </>
          ) : (
            <>
              <Search size={16} />
              Scan Fonts
            </>
          )}
        </button>
      </form>

      <div
        style={{
          marginTop: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Try:</span>
        {exampleSites.map(site => (
          <button
            key={site}
            onClick={() => { setUrl(site); onScan(site); }}
            className="btn-ghost"
            style={{ fontSize: 13, padding: '4px 10px' }}
            disabled={isLoading}
          >
            {site}
          </button>
        ))}
      </div>
    </div>
  );
});

export default UrlScanner;
