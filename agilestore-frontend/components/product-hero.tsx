"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { useEffect, useMemo, useState } from "react";

type Lang = "id" | "en";

const UI: Record<Lang, { title: string; subtitle: string; cta: string }> = {
  en: {
    title: "All-in-One SaaS Marketplace",
    subtitle:
      "Discover powerful solutions designed to streamline your business operations and boost productivity",
    cta: "Explore Products",
  },
  id: {
    title: "Marketplace SaaS Serba Ada",
    subtitle:
      "Temukan solusi andal yang dirancang untuk menyederhanakan operasional bisnismu dan meningkatkan produktivitas",
    cta: "Jelajahi Produk",
  },
};

// Fallback baca cookie/localStorage bila context belum siap
function getLangFromStorage(): Lang {
  try {
    // cookie
    const cookies = document.cookie || "";
    const get = (k: string) =>
      (cookies.match(new RegExp(`(?:^|; )${k}=([^;]*)`)) || [])[1];
    const ck =
      decodeURIComponent(get("agile.lang") || "") ||
      decodeURIComponent(get("agile_lang") || "") ||
      decodeURIComponent(get("lang") || "");
    if (ck === "en") return "en";

    // localStorage
    const ls =
      (localStorage.getItem("agile:lang") || "").replace(/"/g, "") || "";
    if (ls === "en") return "en";
  } catch {}
  return "id";
}

export default function ProductsHero() {
  // 1) Coba context (kalau LanguageProvider ada)
  let ctxLang: Lang | undefined = undefined;
  try {
    // @ts-ignore – provider mungkin tidak ada di tree tertentu
    ctxLang = (useLanguage()?.lang as Lang | undefined) ?? undefined;
  } catch {
    // ignore jika dipakai di luar provider
  }

  // 2) State lokal dengan fallback cookie/LS + dengarkan event
  const [lang, setLang] = useState<Lang>(ctxLang || getLangFromStorage());

  // Sinkronkan bila context berubah
  useEffect(() => {
    if (ctxLang && ctxLang !== lang) setLang(ctxLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxLang]);

  // Dengarkan broadcast custom event dari LanguageSwitcher
  useEffect(() => {
    const onChange = (e: any) => {
      const v = e?.detail?.lang as Lang | undefined;
      if (v === "en" || v === "id") setLang(v);
    };
    window.addEventListener("agile:lang-changed", onChange as any);
    return () =>
      window.removeEventListener("agile:lang-changed", onChange as any);
  }, []);

  const T = useMemo(() => UI[lang === "en" ? "en" : "id"], [lang]);

  return (
    <section
      id="products-hero"
      className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-indigo-500 to-blue-500 py-16 sm:py-24 text-white"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center" key={lang}>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
            {T.title}
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-white/90">{T.subtitle}</p>

          <div className="mt-8">
            <Link href="#products-grid" aria-label={T.cta}>
              <Button
                size="lg"
                className="bg-white text-indigo-600 hover:bg-blue-50"
              >
                {T.cta}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* dekorasi */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      </div>
    </section>
  );
}
