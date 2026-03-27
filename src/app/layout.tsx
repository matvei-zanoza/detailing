import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { getRequestLocale } from "@/lib/i18n/server";
import { MESSAGES_BY_LOCALE } from "@/lib/i18n/messages";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DetailingOS",
  description: "Luxury operations system for professional auto detailing studios",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/images/logo.png", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1f",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          <I18nProvider locale={locale} messages={MESSAGES_BY_LOCALE[locale]}>
            {children}
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
