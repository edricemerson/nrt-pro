import { NextResponse } from "next/server";

/**
 * Server-side proxy for Indonesian administrative data.
 *
 * Two upstreams, for two reasons:
 *  - wilayah.id (Permendagri-based, 38 provinces incl. the four created in
 *    2022) sends NO Access-Control-Allow-Origin header, so the browser cannot
 *    call it directly. This route is what makes it reachable.
 *  - kodepos.vercel.app supplies postal codes, which wilayah.id does not have
 *    at all. It does send CORS, but is proxied here anyway so both sources
 *    share one cache and one normalisation path.
 *
 * Responses are cached for a day - these boundaries change on the order of
 * years, and both upstreams are free services worth being gentle with.
 *
 * This is deliberately NOT a general-purpose proxy: `type` is a fixed
 * allowlist and `code` must match the numeric BPS format, so it cannot be
 * pointed at arbitrary URLs.
 */

const WILAYAH = "https://wilayah.id/api";
const KODEPOS = "https://kodepos.vercel.app/search";
const DAY = 86_400;

/** BPS codes: "32" (province), "32.73" (regency), "32.73.02" (district). */
const CODE_RE = /^\d{2}(\.\d{2}){0,2}$/;

type Row = { code: string; name: string };

/** "KOTA BANDUNG" / "Kabupaten Bandung" -> "bandung", for cross-source matching. */
function bareRegency(name: string): string {
  return name
    .replace(/^(kota administrasi|kabupaten administrasi|kota|kabupaten|kab\.?)\s+/i, "")
    .trim()
    .toLowerCase();
}

async function upstream(url: string) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: DAY },
  });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  return res.json();
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const type = params.get("type");

  try {
    if (type === "provinces") {
      const json = (await upstream(`${WILAYAH}/provinces.json`)) as { data: Row[] };
      return cached(json.data);
    }

    if (type === "regencies" || type === "districts") {
      const code = params.get("code") ?? "";
      if (!CODE_RE.test(code)) {
        return NextResponse.json({ error: "Kode wilayah tidak valid" }, { status: 400 });
      }
      const json = (await upstream(`${WILAYAH}/${type}/${code}.json`)) as { data: Row[] };
      return cached(json.data);
    }

    if (type === "postal") {
      const district = (params.get("district") ?? "").trim();
      const regency = (params.get("regency") ?? "").trim();
      const province = (params.get("province") ?? "").trim();
      if (!district) {
        return NextResponse.json({ error: "Kecamatan wajib diisi" }, { status: 400 });
      }

      type PostalRow = {
        code: number;
        village: string;
        district: string;
        regency: string;
        province: string;
      };
      const json = (await upstream(
        `${KODEPOS}/?q=${encodeURIComponent(district)}`,
      )) as { data?: PostalRow[] };

      // The search also matches village names, so keep only rows whose
      // district really is the one asked for, then narrow by regency and
      // province - kodepos reports "Bandung" for both Kota and Kabupaten
      // Bandung, so the prefix has to be stripped from our side too.
      const rows = (json.data ?? []).filter((r) => {
        if (r.district.toLowerCase() !== district.toLowerCase()) return false;
        if (regency && bareRegency(r.regency) !== bareRegency(regency)) return false;
        if (province && r.province.toLowerCase() !== province.toLowerCase()) return false;
        return true;
      });

      // One kecamatan usually spans several postal codes, one per kelurahan.
      const byCode = new Map<string, string[]>();
      for (const r of rows) {
        const key = String(r.code);
        byCode.set(key, [...(byCode.get(key) ?? []), r.village]);
      }
      const postal = [...byCode.entries()]
        .map(([code, villages]) => ({ code, villages: villages.sort() }))
        .sort((a, b) => a.code.localeCompare(b.code));

      return cached(postal);
    }

    return NextResponse.json({ error: "type tidak dikenal" }, { status: 400 });
  } catch {
    // Both upstreams are free community services; a failure here is expected
    // occasionally and the UI falls back to free-text entry.
    return NextResponse.json({ error: "Layanan wilayah sedang tidak tersedia" }, { status: 502 });
  }
}

function cached(data: unknown) {
  return NextResponse.json(
    { data },
    { headers: { "Cache-Control": `public, s-maxage=${DAY}, stale-while-revalidate=${DAY}` } },
  );
}
