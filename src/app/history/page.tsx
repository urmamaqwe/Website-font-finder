'use client';

import { useState, useEffect } from 'react';
import { ScanHistoryItem } from '@/lib/types';
import { getHistory, removeHistory, clearHistory } from '@/lib/storage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast, ToastContainer } from '@/components/Toast';
import { Trash2, ExternalLink, Clock, X, Search } from 'lucide-react';

export default function HistoryPage() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleRemove = (id: string) => {
    removeHistory(id);
    setHistory(getHistory());
    addToast('Removed from history', 'info');
  };

  const handleClear = () => {
    clearHistory();
    setHistory([]);
    addToast('History cleared', 'info');
  };

  const filtered = search
    ? history.filter(
        h =>
          h.url.toLowerCase().includes(search.toLowerCase()) ||
          h.familyNames.some(n => n.toLowerCase().includes(search.toLowerCase()))
      )
    : history;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, maxWidth: 900, margin: '0 auto', padding: '40px 24px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 500, marginBottom: 4 }}>
              <Clock size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Scan History
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {history.length} scan{history.length !== 1 ? 's' : ''} saved locally
            </p>
          </div>
          {history.length > 0 && (
            <button className="btn-ghost" onClick={handleClear} style={{ color: 'var(--error)' }}>
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>

        {history.length > 0 && (
          <div style={{ marginBottom: 20, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search history..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 36, fontSize: 14 }}
            />
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            {history.length === 0 ? 'No scans yet. Go scan some websites!' : 'No matching results.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(item => (
              <div key={item.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a
                      href={`/?url=${encodeURIComponent(item.url)}`}
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {new URL(item.url).hostname}
                      <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
                    </a>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {new Date(item.scannedAt).toLocaleString()} · {item.totalFonts} fonts · {item.totalFamilies} families
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {item.familyNames.slice(0, 5).map(name => (
                        <span key={name} className="badge" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                          {name}
                        </span>
                      ))}
                      {item.familyNames.length > 5 && (
                        <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                          +{item.familyNames.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="btn-ghost" onClick={() => handleRemove(item.id)} style={{ padding: 4 }}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
