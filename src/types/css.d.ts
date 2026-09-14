// Next.js ships type declarations for `*.module.css` only, so a plain global
// stylesheet import such as `import "./globals.css"` has no declaration to
// resolve to. `tsc` hides this by default because it skips side-effect imports,
// but editors running a newer TypeScript report it as TS2882/TS2307.
declare module "*.css";
