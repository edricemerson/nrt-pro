"use client";

import { usePathname } from "next/navigation";

/**
 * Fades each route in as it mounts. Keying on the pathname is what replays the
 * animation: React tears down the old subtree and mounts a fresh one, so the
 * entrance runs on every navigation instead of only the first paint.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-fade-up">
      {children}
    </div>
  );
}
