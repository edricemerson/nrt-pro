/**
 * Vector recreations of the two brand marks the shop distributes.
 *
 * The project ships no image assets, so these are drawn inline: they stay crisp
 * at any size and need no `public/` files. Every wordmark is pinned with
 * `textLength` + `lengthAdjust` so the proportions hold even on machines that
 * lack the exact display faces.
 *
 * To swap in the official artwork later, drop the files in `public/` and replace
 * the `<svg>` body with an `<Image>` - the exported props stay the same.
 */

const RED = "#d8111a";
const RED_DARK = "#8f1116";

type LogoProps = {
  className?: string;
  title?: string;
};

/** NRT-PRO Power Tools: red banner over a brushed-steel bar. */
export function NrtProLogo({ className, title = "NRT-PRO Power Tools" }: LogoProps) {
  return (
    <svg viewBox="0 0 320 128" role="img" aria-label={title} className={className}>
      <defs>
        <linearGradient id="nrtproRed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8f0f14" />
          <stop offset="22%" stopColor="#cc161e" />
          <stop offset="52%" stopColor="#d8111a" />
          <stop offset="82%" stopColor="#a91218" />
          <stop offset="100%" stopColor="#7d0d12" />
        </linearGradient>
        <linearGradient id="nrtproSteel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9aa1a8" />
          <stop offset="18%" stopColor="#e8ebed" />
          <stop offset="48%" stopColor="#f8f9fa" />
          <stop offset="78%" stopColor="#d5d9dd" />
          <stop offset="100%" stopColor="#a6adb4" />
        </linearGradient>
      </defs>

      <rect width="320" height="70" fill="url(#nrtproRed)" />
      <rect y="70" width="320" height="58" fill="url(#nrtproSteel)" />

      <text
        x="22"
        y="53"
        textLength="252"
        lengthAdjust="spacingAndGlyphs"
        fill="#ffffff"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="48"
        fontStyle="italic"
        fontWeight="700"
      >
        NRT-PRO
      </text>
      <text
        x="282"
        y="27"
        fill="#ffffff"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="15"
      >
        &#174;
      </text>

      <text
        x="30"
        y="112"
        textLength="260"
        lengthAdjust="spacingAndGlyphs"
        fill={RED_DARK}
        fontFamily="'Arial Black', 'Segoe UI', Impact, sans-serif"
        fontSize="36"
        fontWeight="700"
      >
        Power Tools
      </text>
    </svg>
  );
}

/** YAMAMAX PRO: flat red wordmark inside a rounded stadium outline. */
export function YamamaxProLogo({ className, title = "YAMAMAX PRO" }: LogoProps) {
  return (
    <svg viewBox="0 0 420 130" role="img" aria-label={title} className={className}>
      <rect
        x="6.5"
        y="6.5"
        width="407"
        height="117"
        rx="58.5"
        fill="#ffffff"
        stroke={RED}
        strokeWidth="13"
      />

      <text
        x="40"
        y="84"
        textLength="232"
        lengthAdjust="spacingAndGlyphs"
        fill={RED}
        fontFamily="'Arial Black', 'Segoe UI', Impact, sans-serif"
        fontSize="54"
        fontWeight="900"
      >
        YAMAMAX
      </text>

      {/* Angled badge standing in for the arrow flash behind "PRO". */}
      <path d="M298 33 L384 33 L370 97 L284 97 Z" fill={RED} />
      <text
        x="302"
        y="80"
        textLength="66"
        lengthAdjust="spacingAndGlyphs"
        fill="#ffffff"
        fontFamily="'Arial Black', 'Segoe UI', Impact, sans-serif"
        fontSize="46"
        fontWeight="900"
      >
        PRO
      </text>
      <text
        x="388"
        y="95"
        fill={RED}
        fontFamily="'Arial Black', 'Segoe UI', Impact, sans-serif"
        fontSize="13"
      >
        &#174;
      </text>
    </svg>
  );
}
