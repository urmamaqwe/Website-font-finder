import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { createLogger, startTimer } from '@/lib/logger';

const log = createLogger('scan');

interface FontEntry {
  url: string;
  format: string;
  family: string;
  weight: string;
  style: string;
}

function resolveUrl(fontUrl: string, baseUrl: string): string {
  try {
    if (fontUrl.startsWith('data:')) return '';
    if (fontUrl.startsWith('//')) return 'https:' + fontUrl;
    if (fontUrl.startsWith('http')) return fontUrl;
    const base = new URL(baseUrl);
    if (fontUrl.startsWith('/')) {
      return base.origin + fontUrl;
    }
    // relative
    const basePath = base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1);
    return base.origin + basePath + fontUrl;
  } catch {
    return fontUrl;
  }
}

function extractFontFacesFromCSS(cssText: string, cssBaseUrl: string): FontEntry[] {
  const fonts: FontEntry[] = [];
  // Match @font-face blocks
  const fontFaceRegex = /@font-face\s*\{([^}]+)\}/gi;
  let match;

  while ((match = fontFaceRegex.exec(cssText)) !== null) {
    const block = match[1];

    // Extract font-family
    const familyMatch = block.match(/font-family\s*:\s*['"]?([^;'"]+?)['"]?\s*[;}/]/i);
    const family = familyMatch ? familyMatch[1].replace(/['"]/g, '').trim() : 'Unknown';

    // Extract font-weight
    const weightMatch = block.match(/font-weight\s*:\s*([^;}"']+)/i);
    const weight = weightMatch ? weightMatch[1].trim() : '400';

    // Extract font-style
    const styleMatch = block.match(/font-style\s*:\s*([^;}"']+)/i);
    const style = styleMatch ? styleMatch[1].trim() : 'normal';

    // Extract all URLs from src
    const urlRegex = /url\(\s*['"]?([^'")]+?)['"]?\s*\)/gi;
    let urlMatch;
    while ((urlMatch = urlRegex.exec(block)) !== null) {
      const rawUrl = urlMatch[1].trim();
      if (rawUrl.startsWith('data:')) continue;

      const resolvedUrl = resolveUrl(rawUrl, cssBaseUrl);
      if (!resolvedUrl) continue;

      // Determine format
      let format = 'unknown';
      const formatMatch = block.substring(urlMatch.index).match(/format\(\s*['"]?([^'")\s]+)/i);
      if (formatMatch) {
        format = formatMatch[1].toLowerCase();
      } else {
        const lower = resolvedUrl.toLowerCase();
        if (lower.includes('.woff2')) format = 'woff2';
        else if (lower.includes('.woff')) format = 'woff';
        else if (lower.includes('.ttf')) format = 'truetype';
        else if (lower.includes('.otf')) format = 'opentype';
        else if (lower.includes('.eot')) format = 'embedded-opentype';
        else if (lower.includes('.svg')) format = 'svg';
      }

      fonts.push({
        url: resolvedUrl,
        format: format.replace('truetype', 'ttf').replace('opentype', 'otf').replace('embedded-opentype', 'eot'),
        family,
        weight,
        style,
      });
    }
  }

  return fonts;
}

function extractGoogleFonts(html: string): string[] {
  const googleFonts: string[] = [];
  const gfRegex = /fonts\.googleapis\.com\/css2?\?[^"'\s>]+/gi;
  let match;
  while ((match = gfRegex.exec(html)) !== null) {
    googleFonts.push('https://' + match[0]);
  }
  return googleFonts;
}

function extractAdobeFonts(html: string): string[] {
  const adobeFonts: string[] = [];
  const adobeRegex = /use\.typekit\.net\/([a-z0-9]+)\.css/gi;
  let match;
  while ((match = adobeRegex.exec(html)) !== null) {
    adobeFonts.push(match[1]);
  }
  return adobeFonts;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const endScan = startTimer(log, 'Full scan completed');

  try {
    const body = await req.json();
    let { url } = body;

    if (!url) {
      log.warn('Scan rejected: empty URL');
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    log.info(`Starting scan for: ${url}`);

    // Fetch the page
    const fetchStart = Date.now();
    let pageResponse;
    try {
      pageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(15000),
      });
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : 'Unknown fetch error';
      log.error(`Failed to fetch page: ${url}`, { error: msg, latency: Date.now() - fetchStart });
      return NextResponse.json(
        { error: `Could not reach website: ${msg.includes('timeout') ? 'Request timed out (15s)' : msg}` },
        { status: 400 }
      );
    }
    log.info(`Page fetched: ${pageResponse.status}`, { latency: Date.now() - fetchStart, status: pageResponse.status });

    if (!pageResponse.ok) {
      log.warn(`Page returned non-OK status: ${pageResponse.status}`, { url });
      return NextResponse.json({ error: `Website returned error status: ${pageResponse.status}` }, { status: 400 });
    }

    const html = await pageResponse.text();
    log.debug(`HTML received: ${(html.length / 1024).toFixed(1)}KB`);
    const $ = cheerio.load(html);

    // Collect all fonts
    const allFonts: FontEntry[] = [];
    const seenUrls = new Set<string>();

    // 1. Extract inline styles with @font-face
    $('style').each((_, el) => {
      const styleText = $(el).text();
      const inlineFonts = extractFontFacesFromCSS(styleText, url);
      for (const font of inlineFonts) {
        if (!seenUrls.has(font.url)) {
          seenUrls.add(font.url);
          allFonts.push(font);
        }
      }
    });

    // 2. Find external CSS stylesheets
    const cssUrls: string[] = [];
    $('link[rel="stylesheet"], link[type="text/css"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('data:')) {
        const resolved = resolveUrl(href, url);
        if (resolved) cssUrls.push(resolved);
      }
    });

    // 3. Also check for CSS @import in inline styles
    $('style').each((_, el) => {
      const styleText = $(el).text();
      const importRegex = /@import\s+(?:url\(\s*['"]?([^'")]+?)['"]?\s*\)|['"]([^'"]+)['"]);/gi;
      let importMatch;
      while ((importMatch = importRegex.exec(styleText)) !== null) {
        const importUrl = importMatch[1] || importMatch[2];
        if (importUrl) {
          const resolved = resolveUrl(importUrl, url);
          if (resolved) cssUrls.push(resolved);
        }
      }
    });

    // 4. Detect Google Fonts
    const googleFontUrls = extractGoogleFonts(html);
    const googleFontNames: string[] = [];
    for (const gfUrl of googleFontUrls) {
      try {
        const familyMatch = gfUrl.match(/family=([^&]+)/);
        if (familyMatch) {
          const families = familyMatch[1].split('|').map(f => decodeURIComponent(f.split(':')[0].replace(/\+/g, ' ')));
          googleFontNames.push(...families);
        }
        cssUrls.push(gfUrl);
      } catch { /* skip */ }
    }

    // 5. Detect Adobe/Typekit fonts
    const adobeKitIds = extractAdobeFonts(html);
    const adobeFontNames: string[] = adobeKitIds.map(id => `Typekit (${id})`);
    for (const kitId of adobeKitIds) {
      cssUrls.push(`https://use.typekit.net/${kitId}.css`);
    }

    log.info(`Found ${cssUrls.length} CSS URLs to process`, {
      inlineFonts: allFonts.length,
      cssUrls: cssUrls.length,
      googleFonts: googleFontNames.length,
      adobeKits: adobeKitIds.length,
    });

    // 6. Fetch external CSS files and extract @font-face
    const cssPromises = cssUrls.map(async (cssUrl) => {
      try {
        const cssResp = await fetch(cssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/css,*/*;q=0.1',
          },
          signal: AbortSignal.timeout(10000),
        });
        if (cssResp.ok) {
          const cssText = await cssResp.text();

          // Also check for @import within CSS files
          const importRegex = /@import\s+(?:url\(\s*['"]?([^'")]+?)['"]?\s*\)|['"]([^'"]+)['"])\s*;/gi;
          let importMatch;
          const importedCssTexts: string[] = [];
          while ((importMatch = importRegex.exec(cssText)) !== null) {
            const importUrl = importMatch[1] || importMatch[2];
            if (importUrl) {
              try {
                const resolved = resolveUrl(importUrl, cssUrl);
                const importResp = await fetch(resolved, {
                  headers: { 'User-Agent': 'Mozilla/5.0' },
                  signal: AbortSignal.timeout(8000),
                });
                if (importResp.ok) {
                  importedCssTexts.push(await importResp.text());
                }
              } catch { /* skip */ }
            }
          }

          const fonts = extractFontFacesFromCSS(cssText + '\n' + importedCssTexts.join('\n'), cssUrl);
          return fonts;
        }
      } catch { /* skip unreachable CSS */ }
      return [];
    });

    const cssResults = await Promise.all(cssPromises);
    for (const fonts of cssResults) {
      for (const font of fonts) {
        if (!seenUrls.has(font.url)) {
          seenUrls.add(font.url);
          allFonts.push(font);
        }
      }
    }

    // Get file sizes (sample a few, do all in parallel)
    const sizePromises = allFonts.map(async (font) => {
      try {
        const headResp = await fetch(font.url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        });
        const contentLength = headResp.headers.get('content-length');
        return contentLength ? parseInt(contentLength, 10) : 0;
      } catch {
        return 0;
      }
    });

    const sizes = await Promise.all(sizePromises);

    // Build final result
    const fontsWithSize = allFonts.map((font, i) => ({
      ...font,
      size: sizes[i],
      sizeFormatted: formatBytes(sizes[i]),
      filename: getFilenameFromUrl(font.url),
    }));

    // Group into families
    const familyMap = new Map<string, typeof fontsWithSize>();
    for (const font of fontsWithSize) {
      const key = font.family;
      if (!familyMap.has(key)) familyMap.set(key, []);
      familyMap.get(key)!.push(font);
    }

    const families = Array.from(familyMap.entries()).map(([name, fonts]) => ({
      name,
      fonts,
      variants: fonts.length,
    }));

    // Determine custom fonts (not Google, not Adobe/Typekit)
    const customFontNames = families
      .map(f => f.name)
      .filter(name =>
        !googleFontNames.includes(name) &&
        !name.startsWith('Typekit') &&
        name !== 'Unknown'
      );

    const scanDuration = Date.now() - startTime;

    endScan({
      url,
      totalFonts: fontsWithSize.length,
      totalFamilies: families.length,
      googleFonts: googleFontNames.length,
      adobeFonts: adobeFontNames.length,
      customFonts: customFontNames.length,
    });

    log.info(`Scan complete: ${fontsWithSize.length} fonts in ${families.length} families`, {
      url,
      scanDuration,
      families: families.map(f => f.name),
    });

    return NextResponse.json({
      url,
      scannedAt: new Date().toISOString(),
      fonts: fontsWithSize,
      families,
      totalFonts: fontsWithSize.length,
      totalFamilies: families.length,
      scanDuration,
      googleFonts: googleFontNames,
      adobeFonts: adobeFontNames,
      customFonts: customFontNames,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Scan failed`, { error: message, duration: Date.now() - startTime });
    return NextResponse.json({ error: `Scan failed: ${message}` }, { status: 500 });
  }
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return 'Unknown';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('/');
    return decodeURIComponent(parts[parts.length - 1]) || 'font-file';
  } catch {
    return 'font-file';
  }
}
