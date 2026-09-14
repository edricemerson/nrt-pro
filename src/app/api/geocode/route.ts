import { NextResponse } from "next/server";

/**
 * Server-side proxy for OpenStreetMap Nominatim (forward + reverse geocoding).
 *
 * The map picker used to call Nominatim straight from the browser, which the
 * Content-Security-Policy now blocks (`connect-src 'self'`). Proxying keeps
 * that directive tight instead of widening it for one third party, and buys
 * two other things:
 *
 *  - Nominatim's usage policy asks for an identifying User-Agent. A browser
 *    cannot set that header; a server can.
 *  - Responses are cached, so repeated lookups of the same address do not
 *    hammer a free service.
 */

const NOMINATIM = "https://nominatim.openstreetmap.org";
const CACHE_SECONDS = 60 * 60 * 24;

// Nominatim asks that clients identify themselves with a contact address.
const USER_AGENT = "nrtpro-shop/1.0 (+https://github.com/nrtpro-shop)";

async function nominatim(path: string, params: Record<string, string>) {
  const url = new URL(`${NOMINATIM}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "id");

  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    next: { revalidate: CACHE_SECONDS },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return res.json();
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  try {
    const q = params.get("q");
    if (q) {
      if (q.length > 300) {
        return NextResponse.json({ error: "Kueri terlalu panjang" }, { status: 400 });
      }
      return cached(await nominatim("/search", { q, limit: "1" }));
    }

    const lat = Number(params.get("lat"));
    const lon = Number(params.get("lon"));
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return NextResponse.json({ error: "Koordinat tidak valid" }, { status: 400 });
      }
      return cached(await nominatim("/reverse", { lat: String(lat), lon: String(lon) }));
    }

    return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Layanan peta sedang tidak tersedia" }, { status: 502 });
  }
}

function cached(data: unknown) {
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
    },
  });
}
