import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GüvenCheck — Dijital risk kontrolü",
  description: "Şüpheli mesaj, link ve ekran görüntülerindeki dijital risk sinyallerini kontrol et; risk seviyesini ve ne yapman gerektiğini sade Türkçeyle gör.",
  applicationName: "GüvenCheck",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/guvencheck-favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/guvencheck-favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/brand/guvencheck-favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/brand/guvencheck-app-icon-1024.png", sizes: "1024x1024", type: "image/png" }],
  },
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
