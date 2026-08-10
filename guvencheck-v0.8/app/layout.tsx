import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GüvenCheck — Tıklamadan önce kontrol et",
  description: "Şüpheli mesaj, link ve ekran görüntülerini risk sinyalleri açısından kontrol et.",
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
  themeColor: "#07130f",
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
