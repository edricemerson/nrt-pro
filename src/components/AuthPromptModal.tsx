"use client";

import Link from "next/link";
import { useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Blocking prompt for a signed-out visitor who tried to do something that
 * needs an account (view /profile, checkout). Used by SiteHeader's Profil
 * button and the cart page's checkout button - same component so both stay
 * visually and behaviourally identical.
 */
export function AuthPromptModal({
  onClose,
  title = "Masuk dulu, yuk",
  message = "Kamu perlu masuk atau membuat akun untuk melanjutkan.",
  next = "/",
}: {
  onClose: () => void;
  title?: string;
  message?: string;
  /** Where /masuk sends the visitor back to after they sign in. */
  next?: string;
}) {
  // Esc closes it. Callers typically live above page navigation (a layout,
  // or a page that stays mounted while the modal is open), so without this
  // the modal could still be "open" in state after navigating away and back.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Rendered via a portal straight onto <body>. Without this, `position:
  // fixed` here could resolve against a blurred/transformed ancestor instead
  // of the viewport - e.g. SiteHeader's `backdrop-blur` makes it a containing
  // block for fixed descendants - pinning the modal to that box instead of
  // centering it on the screen.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-prompt-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
      />
      <div className="animate-fade-up relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM4 20.25a8 8 0 0116 0 .75.75 0 01-.75.75H4.75a.75.75 0 01-.75-.75z" />
          </svg>
        </span>
        <h2 id="auth-prompt-title" className="mt-4 text-lg font-bold">
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-ink-600">{message}</p>
        <div className="mt-5 flex gap-2">
          <Link
            href={`/masuk?next=${encodeURIComponent(next)}`}
            onClick={onClose}
            className="btn-primary flex-1"
          >
            Masuk
          </Link>
          <button type="button" onClick={onClose} className="btn-secondary">
            Batal
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
