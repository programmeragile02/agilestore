// "use client";
// import { useLanguage } from "./LanguageProvider";
// import { Languages } from "lucide-react";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Cookies from "js-cookie";
// import { cn } from "@/lib/utils";

// export default function LanguageSwitcher() {
//   const { lang, setLang } = useLanguage();
//   const [mounted, setMounted] = useState(false);
//   const router = useRouter();
//   useEffect(() => setMounted(true), []);

//   const toggle = () => {
//     const next = lang === "en" ? "id" : "en";
//     setLang(next);
//     // pastikan semua kunci cookie terisi konsisten (server akan baca agile_lang)
//     Cookies.set("agile_lang", next, { path: "/", sameSite: "Lax" });
//     Cookies.set("lang", next, { path: "/", sameSite: "Lax" });
//     Cookies.set("agile.lang", next, { path: "/", sameSite: "Lax" });
//     router.refresh(); // <— penting: re-render server components
//   };

//   return (
//     <div className="fixed right-4 top-4 z-[60]">
//       <div className="relative">
//         <button
//           aria-label="Language"
//           onClick={toggle}
//           className={cn(
//             "flex items-center gap-2 rounded-2xl px-3 py-2 shadow-lg",
//             "bg-white/80 backdrop-blur hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900"
//           )}
//         >
//           <Languages className="w-4 h-4" />
//           {mounted && (
//             <span className="text-sm font-medium uppercase">{lang}</span>
//           )}
//         </button>
//       </div>
//     </div>
//   );
// }

"use client";
import { useLanguage } from "./LanguageProvider";
import { Languages } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  useEffect(() => setMounted(true), []);

  const toggle = () => {
    const next = lang === "en" ? "id" : "en";
    setLang(next);
    Cookies.set("agile_lang", next, { path: "/", sameSite: "Lax" });
    Cookies.set("lang", next, { path: "/", sameSite: "Lax" });
    Cookies.set("agile.lang", next, { path: "/", sameSite: "Lax" });
    router.refresh();
  };

  return (
    <div
      className="
        fixed z-[60]
        top-3 right-1/12 -translate-x-1/2
        sm:top-4 sm:left-auto sm:right-4 sm:translate-x-0
      "
    >
      <button
        aria-label="Language"
        onClick={toggle}
        className={cn(
          "flex items-center gap-2 rounded-2xl px-3 py-2 shadow-lg",
          "bg-white/80 backdrop-blur hover:bg-white dark:bg-slate-900/70 dark:hover:bg-slate-900"
        )}
      >
        <Languages className="w-4 h-4" />
        {mounted && (
          <span className="text-sm font-medium uppercase">{lang}</span>
        )}
      </button>
    </div>
  );
}
