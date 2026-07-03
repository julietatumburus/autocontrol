import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "@/components/PWARegister";
import InstallPWA from "@/components/InstallPWA";

export const metadata: Metadata = {
  title: "Autocontrol — Seguí la reparación de tu auto",
  description:
    "Autocontrol conecta a los talleres con sus clientes: seguí en tiempo real cómo avanza la reparación de tu vehículo.",
  applicationName: "Autocontrol",
  appleWebApp: {
    capable: true,
    title: "Autocontrol",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/apple-icon.png",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        {children}
        <PWARegister />
        <InstallPWA />
      </body>
    </html>
  );
}
