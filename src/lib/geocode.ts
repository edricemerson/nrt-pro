/**
 * Address <-> coordinate lookup.
 *
 * Requests go through /api/geocode rather than straight to Nominatim: the
 * Content-Security-Policy pins `connect-src` to 'self', and the proxy is also
 * where the identifying User-Agent and response caching that Nominatim's usage
 * policy expects are applied.
 *
 * Nominatim caps clients near 1 request/second and forbids bulk querying, so
 * these are only ever called on an explicit user action - opening the map
 * picker, pressing search, or moving the pin - never per keystroke.
 *
 * To move to a keyed provider (Google, Mapbox, self-hosted Nominatim), change
 * src/app/api/geocode/route.ts; this file does not need to know.
 */
/** Roughly the geographic centre of Indonesia, used when we know nothing. */
export const DEFAULT_CENTER = { lat: -2.5489, lng: 118.0149 };
export const DEFAULT_ZOOM = 4;

export interface Coords {
  lat: number;
  lng: number;
}

export interface GeocodeResult extends Coords {
  /** Full formatted address Nominatim matched, for showing back to the buyer. */
  label: string;
}

/** The address fields the register / profile forms collect. */
export interface AddressParts {
  address?: string;
  district?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

/**
 * Builds the query string sent to the geocoder, coarsest part last.
 * Returns "" when the buyer has not typed anything worth searching.
 */
export function addressQuery(parts: AddressParts): string {
  return [parts.address, parts.district, parts.city, parts.province, parts.postalCode]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

async function nominatim<T>(params: Record<string, string>): Promise<T> {
  const url = new URL("/api/geocode", window.location.origin);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Geocoder menjawab ${res.status}`);
  return (await res.json()) as T;
}

type NominatimSearchRow = { lat: string; lon: string; display_name: string };

/**
 * Address text -> coordinates. Retries with progressively coarser queries, so
 * a house number the geocoder has never seen still lands on the right
 * kecamatan or city instead of failing outright.
 */
export async function geocodeAddress(parts: AddressParts): Promise<GeocodeResult | null> {
  const attempts = [
    addressQuery(parts),
    addressQuery({ ...parts, address: undefined }),
    addressQuery({ address: undefined, district: undefined, ...parts, postalCode: undefined }),
    addressQuery({ city: parts.city, province: parts.province }),
  ].filter((q, i, all) => q && all.indexOf(q) === i);

  for (const q of attempts) {
    const rows = await nominatim<NominatimSearchRow[]>({ q });
    const hit = rows[0];
    if (hit) {
      return {
        lat: Number(hit.lat),
        lng: Number(hit.lon),
        label: hit.display_name,
      };
    }
  }
  return null;
}

type NominatimReverseRow = { display_name?: string };

/** Coordinates -> a human-readable address, shown under the map pin. */
export async function reverseGeocode(coords: Coords): Promise<string | null> {
  const row = await nominatim<NominatimReverseRow>({
    lat: String(coords.lat),
    lon: String(coords.lng),
  });
  return row.display_name ?? null;
}
