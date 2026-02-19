import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { createLogger } from '@/lib/logger';

const log = createLogger('download-zip');

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const body = await req.json();
    const { fonts, siteName } = body;

    if (!fonts || !Array.isArray(fonts) || fonts.length === 0) {
      log.warn('ZIP rejected: no fonts provided');
      return NextResponse.json({ error: 'No fonts provided' }, { status: 400 });
    }

    log.info(`Creating ZIP for ${siteName || 'unknown site'}`, { fontCount: fonts.length });

    const zip = new JSZip();

    // Download all fonts and add to ZIP
    const downloadPromises = fonts.map(async (font: { url: string; filename: string; family: string }) => {
      try {
        const response = await fetch(font.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          // Organize by family folder
          const folder = font.family.replace(/[^\w\s-]/g, '').trim() || 'Unknown';
          zip.file(`${folder}/${font.filename}`, buffer);
          return { success: true, filename: font.filename };
        }
        return { success: false, filename: font.filename, error: `HTTP ${response.status}` };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Download failed';
        return { success: false, filename: font.filename, error: msg };
      }
    });

    const results = await Promise.all(downloadPromises);
    const successCount = results.filter(r => r.success).length;
    const failedFonts = results.filter(r => !r.success);

    log.info(`Font downloads: ${successCount}/${fonts.length} succeeded`, {
      succeeded: successCount,
      failed: failedFonts.length,
      failedFiles: failedFonts.map(f => f.filename),
    });

    if (successCount === 0) {
      log.error('ZIP creation aborted: all font downloads failed');
      return NextResponse.json({ error: 'Failed to download any fonts' }, { status: 500 });
    }

    // Add a README
    const readme = `Font Pack - ${siteName || 'Website Fonts'}
Downloaded by FontFinder
Date: ${new Date().toISOString()}

Fonts included: ${successCount}/${fonts.length}

${results.map(r => `${r.success ? '✓' : '✗'} ${r.filename}${r.success ? '' : ' - ' + (r as { error?: string }).error}`).join('\n')}
`;
    zip.file('README.txt', readme);

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
    const zipFilename = `${(siteName || 'fonts').replace(/[^\w-]/g, '_')}_fonts.zip`;

    log.info(`ZIP created: ${zipFilename} (${(zipBuffer.byteLength / 1024).toFixed(1)}KB)`, {
      latency: Date.now() - start,
      zipSize: zipBuffer.byteLength,
      fontCount: successCount,
    });

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': zipBuffer.byteLength.toString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ZIP creation failed';
    log.error('ZIP creation failed', { error: message, latency: Date.now() - start });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
