import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GüvenCheck — Dijital risk kontrolü",
  description: "Şüpheli mesaj, link ve ekran görüntülerindeki dijital risk sinyallerini kontrol et; risk seviyesini ve ne yapman gerektiğini sade Türkçeyle gör.",
  applicationName: "GüvenCheck",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "GüvenCheck",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#071f17",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
