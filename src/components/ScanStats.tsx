'use client';

import { ScanResult } from '@/lib/types';
import { Clock, Layers, FileType, Globe } from 'lucide-react';

interface Props {
  result: ScanResult;
}

export default function ScanStats({ result }: Props) {
  const stats = [
    {
      label: 'Total Fonts',
      value: result.totalFonts,
      icon: FileType,
      color: '#6366f1',
    },
    {
      label: 'Font Families',
      value: result.totalFamilies,
      icon: Layers,
      color: '#8b5cf6',
    },
    {
      label: 'Scan Time',
      value: `${(result.scanDuration / 1000).toFixed(1)}s`,
      icon: Clock,
      color: '#06b6d4',
    },
    {
      label: 'Source',
      value: new URL(result.url).hostname,
      icon: Globe,
      color: '#22c55e',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}
      className="animate-fade-in"
    >
      {stats.map(stat => (
        <div
          key={stat.label}
          className="card"
          style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `${stat.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <stat.icon size={18} style={{ color: stat.color }} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.01em' }}>
              {stat.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
