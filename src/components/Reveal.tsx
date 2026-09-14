"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveals its children once they scroll into view, then stops watching.
 *
 * Revealing only once is deliberate: re-hiding a section when the user scrolls
 * back up is the thing that makes a site feel like a demo rather than a shop.
 *
 * The `reveal` class ships in the server HTML, so `<noscript>` in the root
 * layout un-hides everything for readers without JS.
 */
export function Reveal({
  children,
  className = "",
  /** Multiplied into the CSS stagger step, for lists that should fan in. */
  index,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      // Fires a little before the element is fully on screen so the motion is
      // finishing, not starting, by the time the user is looking at it.
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      data-visible={visible}
      style={
        index === undefined
          ? undefined
          : ({ transitionDelay: `${Math.min(index, 12) * 45}ms` } as React.CSSProperties)
      }
    >
      {children}
    </div>
  );
}
