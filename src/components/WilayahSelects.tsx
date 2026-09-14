"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cascading Provinsi -> Kota/Kabupaten -> Kecamatan -> Kode pos pickers,
 * fed by /api/wilayah.
 *
 * Values are stored as plain names, matching the existing DeliveryProfile
 * fields, so nothing about the saved shape changes - these selects just stop
 * buyers from typing "Jawa barat", "JABAR" and "jawabarat" into the same
 * column.
 *
 * If the upstream data services are unreachable the whole thing degrades to
 * the four free-text inputs it replaced, so a buyer is never blocked from
 * finishing the form.
 */

interface Region {
  code: string;
  name: string;
}

interface PostalOption {
  code: string;
  villages: string[];
}

export interface WilayahValue {
  province: string;
  city: string;
  district: string;
  postalCode: string;
}

async function load<T>(query: string): Promise<T[]> {
  const res = await fetch(`/api/wilayah?${query}`);
  if (!res.ok) throw new Error(`wilayah ${res.status}`);
  const json = (await res.json()) as { data: T[] };
  return json.data;
}

export function WilayahSelects({
  value,
  onChange,
  idPrefix,
}: {
  value: WilayahValue;
  onChange: (patch: Partial<WilayahValue>) => void;
  /** Keeps input ids unique when two forms share a page. */
  idPrefix: string;
}) {
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [regencies, setRegencies] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [postals, setPostals] = useState<PostalOption[]>([]);

  const [busy, setBusy] = useState<null | "regencies" | "districts" | "postal">(null);
  const [failed, setFailed] = useState(false);
  const [postalUnavailable, setPostalUnavailable] = useState(false);

  // Names are what we store, but the API cascades on BPS codes.
  const provinceCode = provinces.find((p) => p.name === value.province)?.code ?? "";
  const cityCode = regencies.find((r) => r.name === value.city)?.code ?? "";

  const hydrated = useRef(false);

  const loadPostal = useCallback(
    async (district: string, city: string, province: string) => {
      setBusy("postal");
      setPostalUnavailable(false);
      try {
        const rows = await load<PostalOption>(
          `type=postal&district=${encodeURIComponent(district)}` +
            `&regency=${encodeURIComponent(city)}` +
            `&province=${encodeURIComponent(province)}`,
        );
        setPostals(rows);
        // A kecamatan with no match upstream still needs a way to enter one.
        setPostalUnavailable(rows.length === 0);
      } catch {
        setPostals([]);
        setPostalUnavailable(true);
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  // First load: fetch provinces, then walk down whatever is already saved so
  // an existing profile opens with all four selects populated.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const provinceRows = await load<Region>("type=provinces");
        if (cancelled) return;
        setProvinces(provinceRows);

        if (hydrated.current) return;
        hydrated.current = true;

        const province = provinceRows.find((p) => p.name === value.province);
        if (!province) return;

        const regencyRows = await load<Region>(`type=regencies&code=${province.code}`);
        if (cancelled) return;
        setRegencies(regencyRows);

        const regency = regencyRows.find((r) => r.name === value.city);
        if (!regency) return;

        const districtRows = await load<Region>(`type=districts&code=${regency.code}`);
        if (cancelled) return;
        setDistricts(districtRows);

        if (value.district) {
          await loadPostal(value.district, value.city, value.province);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Mount-only: re-running would fight the buyer's own selections.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pickProvince(name: string) {
    onChange({ province: name, city: "", district: "", postalCode: "" });
    setRegencies([]);
    setDistricts([]);
    setPostals([]);
    const code = provinces.find((p) => p.name === name)?.code;
    if (!code) return;
    setBusy("regencies");
    try {
      setRegencies(await load<Region>(`type=regencies&code=${code}`));
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  async function pickCity(name: string) {
    onChange({ city: name, district: "", postalCode: "" });
    setDistricts([]);
    setPostals([]);
    const code = regencies.find((r) => r.name === name)?.code;
    if (!code) return;
    setBusy("districts");
    try {
      setDistricts(await load<Region>(`type=districts&code=${code}`));
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  async function pickDistrict(name: string) {
    onChange({ district: name, postalCode: "" });
    setPostals([]);
    if (!name) return;
    await loadPostal(name, value.city, value.province);
  }

  // Upstream is down - fall back to the plain inputs these selects replaced
  // rather than trapping the buyer with four empty dropdowns.
  if (failed) {
    return (
      <>
        <p className="hint sm:col-span-2">
          Daftar wilayah sedang tidak bisa dimuat. Silakan ketik manual.
        </p>
        <TextField
          id={`${idPrefix}-province`}
          label="Provinsi"
          value={value.province}
          onChange={(v) => onChange({ province: v })}
        />
        <TextField
          id={`${idPrefix}-city`}
          label="Kota / Kabupaten"
          value={value.city}
          onChange={(v) => onChange({ city: v })}
        />
        <TextField
          id={`${idPrefix}-district`}
          label="Kecamatan"
          value={value.district}
          onChange={(v) => onChange({ district: v })}
        />
        <TextField
          id={`${idPrefix}-postal`}
          label="Kode pos"
          value={value.postalCode}
          inputMode="numeric"
          onChange={(v) => onChange({ postalCode: v.replace(/\D/g, "").slice(0, 5) })}
        />
      </>
    );
  }

  return (
    <>
      <div>
        <label className="label" htmlFor={`${idPrefix}-province`}>
          Provinsi
        </label>
        <select
          id={`${idPrefix}-province`}
          className="input"
          value={value.province}
          onChange={(e) => pickProvince(e.target.value)}
          required
        >
          <option value="">
            {provinces.length ? "Pilih provinsi" : "Memuat provinsi..."}
          </option>
          {/* Keeps a previously saved value selectable even if it is not in
              the current list, so editing a profile cannot silently drop it. */}
          {value.province && !provinces.some((p) => p.name === value.province) && (
            <option value={value.province}>{value.province}</option>
          )}
          {provinces.map((p) => (
            <option key={p.code} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor={`${idPrefix}-city`}>
          Kota / Kabupaten
        </label>
        <select
          id={`${idPrefix}-city`}
          className="input"
          value={value.city}
          onChange={(e) => pickCity(e.target.value)}
          disabled={!value.province || busy === "regencies"}
          required
        >
          <option value="">
            {!value.province
              ? "Pilih provinsi dulu"
              : busy === "regencies"
                ? "Memuat..."
                : "Pilih kota / kabupaten"}
          </option>
          {value.city && !regencies.some((r) => r.name === value.city) && (
            <option value={value.city}>{value.city}</option>
          )}
          {regencies.map((r) => (
            <option key={r.code} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor={`${idPrefix}-district`}>
          Kecamatan
        </label>
        <select
          id={`${idPrefix}-district`}
          className="input"
          value={value.district}
          onChange={(e) => pickDistrict(e.target.value)}
          disabled={!value.city || busy === "districts"}
          required
        >
          <option value="">
            {!value.city
              ? "Pilih kota dulu"
              : busy === "districts"
                ? "Memuat..."
                : "Pilih kecamatan"}
          </option>
          {value.district && !districts.some((d) => d.name === value.district) && (
            <option value={value.district}>{value.district}</option>
          )}
          {districts.map((d) => (
            <option key={d.code} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor={`${idPrefix}-postal`}>
          Kode pos
        </label>
        {postalUnavailable ? (
          // Some kecamatan are missing from the postal dataset; let them type.
          <input
            id={`${idPrefix}-postal`}
            className="input"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="40132"
            value={value.postalCode}
            onChange={(e) =>
              onChange({ postalCode: e.target.value.replace(/\D/g, "").slice(0, 5) })
            }
            required
          />
        ) : (
          <select
            id={`${idPrefix}-postal`}
            className="input"
            value={value.postalCode}
            onChange={(e) => onChange({ postalCode: e.target.value })}
            disabled={!value.district || busy === "postal"}
            required
          >
            <option value="">
              {!value.district
                ? "Pilih kecamatan dulu"
                : busy === "postal"
                  ? "Memuat..."
                  : "Pilih kode pos"}
            </option>
            {value.postalCode && !postals.some((p) => p.code === value.postalCode) && (
              <option value={value.postalCode}>{value.postalCode}</option>
            )}
            {postals.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code} - {p.villages.join(", ")}
              </option>
            ))}
          </select>
        )}
        {postalUnavailable && value.district && (
          <p className="hint">Kode pos kecamatan ini belum ada di daftar, isi manual.</p>
        )}
      </div>
    </>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: "numeric";
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="input"
        value={value}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}
