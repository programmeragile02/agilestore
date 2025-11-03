// import type React from "react";
// import type { Metadata } from "next";
// import { Montserrat, Inter } from "next/font/google";
// import "./globals.css";
// import { Toaster } from "@/components/ui/toaster";
// import Script from "next/script";
// import { GoogleOAuthProvider } from "@react-oauth/google";
// import Providers from "./providers";
// import AutoTranslateClient from "@/components/AutoTranslateClient";
// import LanguageSwitcher from "@/components/LanguageSwitcher";

// const montserrat = Montserrat({
//   subsets: ["latin"],
//   weight: ["400", "600", "700", "900"],
//   variable: "--font-montserrat",
//   display: "swap",
// });

// const inter = Inter({
//   subsets: ["latin"],
//   weight: ["400", "500", "600"],
//   variable: "--font-inter",
//   display: "swap",
// });

// export const metadata: Metadata = {
//   title: "Agile Store - Transform Your Workflow",
//   description:
//     "Professional e-commerce solutions for agile teams and businesses",
//   generator: "v0.app",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en" className={`${montserrat.variable} ${inter.variable}`}>
//       <body className="font-sans antialiased">
//         <Providers>{children}</Providers>
//         {/* <AutoTranslateClient /> */}
//       </body>
//     </html>
//   );
// }

// app/layout.tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/toaster";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AutoTranslateClient from "@/components/AutoTranslateClient";
import GooglePageTranslate from "@/components/GooglePageTranslate";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agile Store - Transform Your Workflow",
  description:
    "Professional e-commerce solutions for agile teams and businesses",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/favicon.ico?v=4", sizes: "any" },
      { url: "/favicon-32x32.png?v=4", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png?v=4", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=4", sizes: "180x180" }],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        type: "image/svg+xml",
      },
    ],
  },
  openGraph: {
    title: "Agile Store - Transform Your Workflow",
    description:
      "Professional e-commerce solutions for agile teams and businesses",
    url: "https://agile-dev.top",
    siteName: "Agile Store",
    images: [
      {
        url: "https://i.postimg.cc/zG3t7wmB/Chat-GPT-Image-Oct-22-2025-09-24-08-AM.png",
        width: 1200,
        height: 630,
        alt: "Agile Store Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agile Store - Transform Your Workflow",
    description:
      "Professional e-commerce solutions for agile teams and businesses",
    images: [
      "https://i.postimg.cc/zG3t7wmB/Chat-GPT-Image-Oct-22-2025-09-24-08-AM.png",
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // cookies() bisa sync (Node) atau Promise (Edge). Handle keduanya:
  const maybeStore = cookies() as any;
  const store =
    typeof maybeStore?.then === "function" ? await maybeStore : maybeStore;

  // dukung dua nama cookie yang kamu pakai: "agile.lang" dan "agile_lang"
  const cookieLangRaw =
    store.get("agile.lang")?.value ?? store.get("agile_lang")?.value;

  const cookieLang = cookieLangRaw === "id" ? "id" : "en";

  return (
    <html
      lang={cookieLang}
      suppressHydrationWarning
      className={`${montserrat.variable} ${inter.variable}`}
    >
      <body className="font-sans antialiased">
        <Providers initialLang={cookieLang}>
          <LanguageSwitcher />
          {/* <GooglePageTranslate /> */}
          <AutoTranslateClient />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
