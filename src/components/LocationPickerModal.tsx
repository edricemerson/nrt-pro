"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Map as LeafletMap, Marker } from "leaflet";
// Without Leaflet's own stylesheet the tiles stack vertically instead of
// tiling into a map.
import "leaflet/dist/leaflet.css";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  addressQuery,
  geocodeAddress,
  reverseGeocode,
  type AddressParts,
  type Coords,
} from "@/lib/geocode";

/** Zoom level once we have a real point - close enough to see the street. */
const PIN_ZOOM = 17;

type Status =
  | { kind: "idle" }
  | { kind: "locating"; label: string }
  | { kind: "error"; label: string };

/**
 * Drag-a-pin map for choosing the exact delivery point.
 *
 * On open it geocodes whatever the buyer already typed into the address
 * fields and drops the pin there, so they usually only need to nudge it
 * rather than hunt across the whole country. Falls back to device GPS, then
 * to a wide view of Indonesia.
 */
export function LocationPickerModal({
  parts,
  initial,
  onCancel,
  onPick,
}: {
  /** Address fields already filled in on the form, used to centre the map. */
  parts: AddressParts;
  /** Existing saved pin, if the buyer is editing rather than setting one. */
  initial: Coords | null;
  onCancel: () => void;
  onPick: (coords: Coords) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);

  const [coords, setCoords] = useState<Coords | null>(initial);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [addressLabel, setAddressLabel] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const query = addressQuery(parts);

  // Reverse-geocode the pin so the buyer can sanity-check what they picked.
  const describe = useCallback(async (next: Coords) => {
    setAddressLabel(null);
    try {
      setAddressLabel(await reverseGeocode(next));
    } catch {
      /* Label is a nicety - a failed lookup should not break picking. */
    }
  }, []);

  const movePin = useCallback(
    (next: Coords, zoom = PIN_ZOOM) => {
      setCoords(next);
      const map = mapRef.current;
      const marker = markerRef.current;
      if (map && marker) {
        marker.setLatLng(next);
        map.setView(next, zoom);
      }
      void describe(next);
    },
    [describe],
  );

  // Leaflet touches `window`, so it is imported only once mounted in the
  // browser. Everything below runs a single time, for this modal instance.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      const start = initial ?? DEFAULT_CENTER;
      const map = L.map(containerRef.current, {
        center: [start.lat, start.lng],
        zoom: initial ? PIN_ZOOM : DEFAULT_ZOOM,
        zoomControl: true,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      // A divIcon avoids Leaflet's default marker PNGs, whose relative asset
      // paths break under the bundler, and lets the pin use the brand colour.
      const icon = L.divIcon({
        className: "",
        html: `<span style="display:block;width:28px;height:28px;border-radius:9999px;background:#d8111a;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([start.lat, start.lng], { icon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        setCoords({ lat, lng });
        void describe({ lat, lng });
      });
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setCoords({ lat, lng });
        void describe({ lat, lng });
      });

      mapRef.current = map;
      markerRef.current = marker;
      setReady(true);

      if (initial) {
        void describe(initial);
        return;
      }

      // No saved pin: centre on whatever address they typed.
      if (query) {
        setStatus({ kind: "locating", label: "Mencari alamat di peta..." });
        try {
          const hit = await geocodeAddress(parts);
          if (cancelled) return;
          if (hit) {
            marker.setLatLng([hit.lat, hit.lng]);
            map.setView([hit.lat, hit.lng], PIN_ZOOM);
            setCoords({ lat: hit.lat, lng: hit.lng });
            setAddressLabel(hit.label);
            setStatus({ kind: "idle" });
            return;
          }
          setStatus({
            kind: "error",
            label: "Alamat tidak ketemu di peta. Geser pin ke lokasi kamu.",
          });
        } catch {
          if (!cancelled) {
            setStatus({
              kind: "error",
              label: "Gagal menghubungi layanan peta. Geser pin secara manual.",
            });
          }
        }
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Deliberately mount-only: re-running would tear down the buyer's map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  function useDeviceLocation() {
    if (!("geolocation" in navigator)) {
      setStatus({ kind: "error", label: "Browser ini tidak mendukung berbagi lokasi." });
      return;
    }
    setStatus({ kind: "locating", label: "Mengambil lokasi perangkat..." });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        movePin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus({ kind: "idle" });
      },
      (err) => {
        setStatus({
          kind: "error",
          label:
            err.code === err.PERMISSION_DENIED
              ? "Izin lokasi ditolak. Geser pin di peta saja."
              : "Lokasi perangkat tidak bisa diambil. Geser pin di peta saja.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function searchTypedAddress() {
    if (!query) return;
    setStatus({ kind: "locating", label: "Mencari alamat di peta..." });
    try {
      const hit = await geocodeAddress(parts);
      if (!hit) {
        setStatus({
          kind: "error",
          label: "Alamat tidak ketemu di peta. Geser pin ke lokasi kamu.",
        });
        return;
      }
      movePin({ lat: hit.lat, lng: hit.lng });
      setAddressLabel(hit.label);
      setStatus({ kind: "idle" });
    } catch {
      setStatus({
        kind: "error",
        label: "Gagal menghubungi layanan peta. Geser pin secara manual.",
      });
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
    >
      <button
        type="button"
        aria-label="Tutup"
        onClick={onCancel}
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
      />

      <div className="animate-fade-up relative flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-ink-200 p-5">
          <div className="min-w-0">
            <h2 id="map-picker-title" className="text-lg font-bold">
              Tandai lokasi di peta
            </h2>
            <p className="mt-0.5 text-sm text-ink-500">
              Geser pin merah atau klik peta sampai tepat di rumah kamu.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Tutup"
            className="btn-ghost shrink-0 px-2 py-1 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <div className="relative">
          <div ref={containerRef} className="h-80 w-full bg-ink-100 sm:h-96" />
          {!ready && (
            <div className="absolute inset-0 grid place-items-center bg-ink-50 text-sm text-ink-500">
              Memuat peta...
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-ink-200 p-5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={searchTypedAddress}
              className="btn-secondary btn-sm"
              disabled={!query || status.kind === "locating"}
              title={query || "Isi alamat dulu di formulir"}
            >
              Cari dari alamat
            </button>
            <button
              type="button"
              onClick={useDeviceLocation}
              className="btn-secondary btn-sm"
              disabled={status.kind === "locating"}
            >
              Gunakan lokasi perangkat
            </button>
          </div>

          {status.kind === "locating" && (
            <p className="text-xs text-ink-500">{status.label}</p>
          )}
          {status.kind === "error" && (
            <p className="animate-fade-in text-xs text-brand-700">{status.label}</p>
          )}

          {coords && (
            <div className="rounded-lg bg-ink-50 p-3">
              <p className="text-xs font-medium text-ink-700">
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
              {addressLabel && (
                <p className="mt-1 line-clamp-2 text-xs text-ink-500">{addressLabel}</p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => coords && onPick(coords)}
              className="btn-primary flex-1"
              disabled={!coords}
            >
              Pakai lokasi ini
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary">
              Batal
            </button>
          </div>

          <p className="text-[11px] text-ink-400">
            Peta &copy; OpenStreetMap contributors
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
