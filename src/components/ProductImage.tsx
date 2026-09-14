/**
 * Product thumbnail. Falls back to a lettered placeholder while the catalog has
 * no photos yet - admin can add image URLs or upload files on the edit page.
 */
export function ProductImage({
  images,
  name,
  sku,
  className = "",
}: {
  images: string[];
  name: string;
  sku: string;
  className?: string;
}) {
  const src = images[0];

  if (src) {
    // Plain <img>: images may be data URLs or arbitrary hosts, so next/image
    // remote patterns would have to be configured per host.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-ink-100 text-ink-400 ${className}`}
      aria-label={`${name} (belum ada foto)`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-7 w-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
        />
      </svg>
      <span className="mt-1 px-2 text-center text-[10px] font-medium tracking-wide">
        {sku}
      </span>
    </div>
  );
}
