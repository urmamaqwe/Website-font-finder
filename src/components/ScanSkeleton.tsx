'use client';

export default function ScanSkeleton() {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
      {/* Stats skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />
        ))}
      </div>

      {/* Actions skeleton */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton" style={{ width: 140, height: 40, borderRadius: 8 }} />
        ))}
      </div>

      {/* Grid skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 12,
        }}
      >
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="skeleton" style={{ height: 200, borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}
