import { NextResponse } from 'next/server';
import { getLogBuffer, clearLogBuffer, LogEntry } from '@/lib/logger';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level'); // filter by level
  const moduleName = searchParams.get('module'); // filter by module
  const last = parseInt(searchParams.get('last') || '50', 10);

  let logs: LogEntry[] = getLogBuffer();

  if (level) {
    logs = logs.filter(l => l.level === level);
  }
  if (moduleName) {
    logs = logs.filter(l => l.module.includes(moduleName));
  }

  // Return last N entries, most recent first
  logs = logs.slice(-last).reverse();

  return NextResponse.json({
    count: logs.length,
    totalBuffered: getLogBuffer().length,
    logs,
  });
}

export async function DELETE() {
  clearLogBuffer();
  return NextResponse.json({ message: 'Log buffer cleared' });
}
