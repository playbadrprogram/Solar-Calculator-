import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import { Analytics } from "@vercel/analytics/next";

const BASE_PATH = "/Solar-Calculator-";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F59E0B",
};

export const metadata: Metadata = {
  title: "حاسبة المنظومة الشمسية - Solar System Calculator",
  description:
    "أداة احترافية لحساب مكونات المنظومة الشمسية من الألواح والبطاريات والعاكس ومنظم الشحن",
  manifest: `${BASE_PATH}/manifest.json`,
  icons: {
    icon: `${BASE_PATH}/favicon.svg`,
    apple: `${BASE_PATH}/icon-192.png`,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "حاسبة شمسية",
  },
  openGraph: {
    title: "حاسبة المنظومة الشمسية",
    description: "أداة احترافية لحساب مكونات المنظومة الشمسية",
    type: "website",
    locale: "ar_SA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="manifest" href={`${BASE_PATH}/manifest.json`} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="حاسبة شمسية" />
        <link rel="apple-touch-icon" href={`${BASE_PATH}/icon-192.png`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch {}
            `,
          }}
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('${BASE_PATH}/sw.js', { scope: '${BASE_PATH}/' }).then(function(reg) {
                    console.log('Service Worker registered with scope:', reg.scope);
                  }).catch(function(err) {
                    console.error('Service Worker registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
