import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('health');

export async function GET() {
  const start = Date.now();

  const checks: Record<string, { status: string; latency?: number; message?: string }> = {};

  // 1. Check external fetch capability
  try {
    const t = Date.now();
    const resp = await fetch('https://example.com', {
      signal: AbortSignal.timeout(5000),
    });
    checks.externalFetch = {
      status: resp.ok ? 'ok' : 'degraded',
      latency: Date.now() - t,
    };
  } catch (err) {
    checks.externalFetch = {
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown',
    };
  }

  // 2. Memory usage (if available in Node)
  try {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const mem = process.memoryUsage();
      checks.memory = {
        status: 'ok',
        message: `RSS: ${(mem.rss / 1024 / 1024).toFixed(1)}MB, Heap: ${(mem.heapUsed / 1024 / 1024).toFixed(1)}/${(mem.heapTotal / 1024 / 1024).toFixed(1)}MB`,
      };
    }
  } catch {
    checks.memory = { status: 'unknown' };
  }

  // 3. Uptime
  try {
    if (typeof process !== 'undefined' && process.uptime) {
      const uptimeSec = process.uptime();
      const hours = Math.floor(uptimeSec / 3600);
      const mins = Math.floor((uptimeSec % 3600) / 60);
      checks.uptime = {
        status: 'ok',
        message: `${hours}h ${mins}m`,
      };
    }
  } catch {
    checks.uptime = { status: 'unknown' };
  }

  const overallStatus = Object.values(checks).every(c => c.status === 'ok')
    ? 'healthy'
    : Object.values(checks).some(c => c.status === 'error')
      ? 'unhealthy'
      : 'degraded';

  const totalLatency = Date.now() - start;

  log.info(`Health check: ${overallStatus}`, { overallStatus, totalLatency });

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      latency: totalLatency,
      checks,
      version: '1.0.0',
    },
    {
      status: overallStatus === 'unhealthy' ? 503 : 200,
    }
  );
}
