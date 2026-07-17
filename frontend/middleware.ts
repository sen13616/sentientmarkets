import { NextRequest, NextResponse } from 'next/server';

/* Wire-level routing for the S&P 500 breadth page.

   The /index and /stock segments have loading.tsx boundaries, so Next
   commits a 200 and streams before page code runs — permanentRedirect()/
   notFound() inside those pages become client-side navigations, not real
   HTTP statuses. Middleware runs before rendering, so the alias redirects
   are true 308s and removed index pages are true 404s. page.tsx keeps the
   same guards for client-side navigations. */

const SP500_ALIASES = new Set(['^GSPC', 'GSPC', 'SPX', '^SPX', 'SP500', 'SPY']);
// Only these lookalikes leave the stock flow; other index tickers (^NDX,
// ^DJI, QQQ, DIA…) keep falling through to the dark AssetPage fallback.
const STOCK_SP500_ALIASES = new Set(['SPY', '^GSPC', 'GSPC', 'SPX', '^SPX']);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const [, segment, rawParam] = pathname.split('/');
  if (!rawParam) return NextResponse.next();
  const param = decodeURIComponent(rawParam);
  const upper = param.toUpperCase();

  if (segment === 'index') {
    if (rawParam === 'sp500') return NextResponse.next();
    if (SP500_ALIASES.has(upper)) {
      return NextResponse.redirect(new URL('/index/sp500', req.url), 308);
    }
    // ^NDX / ^DJI / DOW / anything else: those pages are removed — a real
    // 404, never a redirect that would serve wrong content under a
    // right-looking URL. Rewriting to an unmatched path makes Next return
    // status 404 with the not-found UI while the URL stays put.
    return NextResponse.rewrite(new URL('/__index-removed', req.url));
  }

  if (segment === 'stock' && STOCK_SP500_ALIASES.has(upper)) {
    return NextResponse.redirect(new URL('/index/sp500', req.url), 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/index/:path*', '/stock/:path*'],
};
