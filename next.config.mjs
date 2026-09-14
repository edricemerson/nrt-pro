/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

/**
 * Content Security Policy.
 *
 * Scoped to what the app actually loads:
 *  - img-src needs tile.openstreetmap.org for the Leaflet map picker, plus
 *    data:/blob: because ProductForm previews uploads as data URLs.
 *  - connect-src needs 'self' only; wilayah.id and kodepos are reached through
 *    /api/wilayah, and Supabase is only ever called server-side.
 *
 * 'unsafe-inline' on style-src is required: Next injects inline <style> tags,
 * and Leaflet sets inline styles on every tile as it positions them.
 *
 * In development 'unsafe-eval' is required for React Fast Refresh, so it is
 * added only when NODE_ENV !== production - production keeps script-src tight.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
  "font-src 'self' data:",
  "connect-src 'self'",
  // No <object>/<embed>, and no other site may frame this one - the
  // frame-ancestors directive is the modern replacement for X-Frame-Options.
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  // Stops a hijacked form from POSTing credentials to an attacker's server.
  "form-action 'self'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Legacy equivalent of frame-ancestors, for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  // Stops the browser guessing a response is HTML/JS when it is not.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send the full URL only to ourselves; other origins see just the origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Geolocation stays allowed for the map picker; the rest is switched off.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

// HSTS only in production: sending it from http://localhost would pin the
// browser to HTTPS for localhost and break every other local project.
if (isProd) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

const nextConfig = {
  reactStrictMode: true,
  // Lets a build run into a scratch directory (NEXT_DIST_DIR=.next-test) so it
  // does not clobber the .next a running `next dev` owns. Defaults to normal.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Do not advertise the framework version to scanners.
  poweredByHeader: false,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Never let a shared cache hold an authenticated API response.
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
