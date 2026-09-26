import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/toaster";
import { Pwa } from "@/components/pwa";
import { I18nProvider } from "@/i18n/client";
import { getLocale, getT } from "@/i18n/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { ...baseMetadata, description: t("meta.description") };
}

const baseMetadata: Metadata = {
  title: { default: "LingYu Chinese", template: "%s · LingYu Chinese" },
  applicationName: "LingYu Chinese",
  appleWebApp: { capable: true, title: "LingYu", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F6FBFF",
  colorScheme: "light",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale}>
          <Pwa>{children}</Pwa>
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}
