// "use client";

// import { GoogleOAuthProvider } from "@react-oauth/google";
// import { Toaster } from "@/components/ui/toaster";
// import Script from "next/script";

// export default function Providers({ children }: { children: React.ReactNode }) {
//   const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
//   return (
//     <>
//       <GoogleOAuthProvider clientId={clientId}>
//         {children}
//         <Toaster />
//       </GoogleOAuthProvider>

//       {/* Midtrans Snap (tetap jalan di client) */}
//       <Script
//         src={
//           process.env.NEXT_PUBLIC_MIDTRANS_ENV === "production"
//             ? "https://app.midtrans.com/snap/snap.js"
//             : "https://app.sandbox.midtrans.com/snap/snap.js"
//         }
//         data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
//         strategy="afterInteractive"
//       />
//     </>
//   );
// }
// app/providers.tsx
"use client";

import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/components/LanguageProvider";

export default function Providers({
  children,
  initialLang = "en",
}: {
  children: React.ReactNode;
  initialLang?: "en" | "id";
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

  return (
    <>
      <GoogleOAuthProvider clientId={clientId}>
        <LanguageProvider initialLang={initialLang}>
          {children}
          <Toaster />
        </LanguageProvider>
      </GoogleOAuthProvider>

      <Script
        src={
          process.env.NEXT_PUBLIC_MIDTRANS_ENV === "production"
            ? "https://app.midtrans.com/snap/snap.js"
            : "https://app.sandbox.midtrans.com/snap/snap.js"
        }
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />
    </>
  );
}
