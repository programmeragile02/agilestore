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
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/toaster";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import AutoTranslateClient from "@/components/AutoTranslateClient";

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          {/* <div className="p-3">
            <LanguageSwitcher />
          </div> */}

          {children}
          <Toaster />
        </Providers>

        {/* PENTING: jalankan auto-translate di client */}
        <AutoTranslateClient />
      </body>
    </html>
  );
}
