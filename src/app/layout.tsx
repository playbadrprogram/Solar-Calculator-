import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "حاسبة المنظومة الشمسية - Solar System Calculator",
  description:
    "أداة احترافية لحساب مكونات المنظومة الشمسية من الألواح والبطاريات والعاكس ومنظم الشحن",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
