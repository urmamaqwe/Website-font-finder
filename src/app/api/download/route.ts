import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

const log = createLogger('download');

export async function GET(req: NextRequest) {
  const fontUrl = req.nextUrl.searchParams.get('url');
  const filename = req.nextUrl.searchParams.get('filename') || 'font-file';

  if (!fontUrl) {
    log.warn('Download rejected: no URL parameter');
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  log.info(`Downloading font: ${filename}`, { url: fontUrl });
  const start = Date.now();

  try {
    const response = await fetch(fontUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      log.error(`Font fetch failed: ${response.status}`, { url: fontUrl, status: response.status });
      return NextResponse.json({ error: `Failed to fetch font: ${response.status}` }, { status: 400 });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    log.info(`Font downloaded: ${filename} (${(buffer.byteLength / 1024).toFixed(1)}KB)`, {
      latency: Date.now() - start,
      size: buffer.byteLength,
    });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Download failed';
    log.error(`Download failed: ${filename}`, { error: message, latency: Date.now() - start });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
