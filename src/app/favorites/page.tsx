'use client';

import { useState, useEffect } from 'react';
import { FavoriteFont } from '@/lib/types';
import { getFavorites, removeFavorite, clearFavorites } from '@/lib/storage';
import { getWeightName } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast, ToastContainer } from '@/components/Toast';
import { Heart, Trash2, Download, Copy, X, Search } from 'lucide-react';

export default function FavoritesPage() {
  const [favorites, setFavoritesState] = useState<FavoriteFont[]>([]);
  const [search, setSearch] = useState('');
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    setFavoritesState(getFavorites());
  }, []);

  const handleRemove = (id: string) => {
    removeFavorite(id);
    setFavoritesState(getFavorites());
    addToast('Removed from favorites', 'info');
  };

  const handleClear = () => {
    clearFavorites();
    setFavoritesState([]);
    addToast('Favorites cleared', 'info');
  };

  const handleDownload = (font: FavoriteFont) => {
    const a = document.createElement('a');
    const filename = font.url.split('/').pop() || 'font';
    a.href = `/api/download?url=${encodeURIComponent(font.url)}&filename=${encodeURIComponent(filename)}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    addToast(`Downloading ${font.family}`, 'info');
  };

  const handleCopyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    addToast('URL copied!', 'success');
  };

  const filtered = search
    ? favorites.filter(f => f.family.toLowerCase().includes(search.toLowerCase()))
    : favorites;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, maxWidth: 900, margin: '0 auto', padding: '40px 24px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 500, marginBottom: 4 }}>
              <Heart size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: '#ef4444' }} />
              Favorite Fonts
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {favorites.length} font{favorites.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          {favorites.length > 0 && (
            <button className="btn-ghost" onClick={handleClear} style={{ color: 'var(--error)' }}>
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>

        {favorites.length > 0 && (
          <div style={{ marginBottom: 20, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search favorites..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 36, fontSize: 14 }}
            />
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            {favorites.length === 0
              ? 'No favorites yet. Scan a website and save fonts you like!'
              : 'No matching favorites.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {filtered.map(font => (
              <div key={font.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{font.family}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className={`badge badge-${font.format}`}>{font.format}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {getWeightName(font.weight)} · {font.style}
                      </span>
                    </div>
                  </div>
                  <button className="btn-ghost" onClick={() => handleRemove(font.id)} style={{ padding: 4 }}>
                    <X size={16} />
                  </button>
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                  From: {font.sourceUrl ? new URL(font.sourceUrl).hostname : 'Unknown'}
                  <br />
                  Saved: {new Date(font.addedAt).toLocaleDateString()}
                </div>

                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-ghost" onClick={() => handleDownload(font)} style={{ fontSize: 12 }}>
                    <Download size={14} /> Download
                  </button>
                  <button className="btn-ghost" onClick={() => handleCopyUrl(font.url)} style={{ fontSize: 12 }}>
                    <Copy size={14} /> Copy URL
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
