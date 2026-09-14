import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "NRT-PRO Tools - Distributor Resmi NRT-PRO & YAMAMAX PRO",
  description:
    "Distributor resmi NRT-PRO Power Tools dan YAMAMAX PRO - bor, gerinda, mesin potong, cordless, spray gun.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        {/* Scroll-reveal sections start hidden and are un-hidden by JS. Without
            this, a reader with JS off would see empty space where they should. */}
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-screen font-sans antialiased">
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
