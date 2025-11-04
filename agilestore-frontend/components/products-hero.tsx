"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider"; // ✅ pakai hook aman

export default function ProductsHero() {
  const { lang } = useLanguage(); // ✅ baca bahasa dari LanguageProvider atau fallback cookie

  const T = {
    en: {
      title: "All-in-One SaaS Marketplace",
      subtitle:
        "Discover powerful solutions designed to streamline your business operations and boost productivity",
      cta: "Explore Products",
    },
    id: {
      title: "Toko SaaS Serba Ada",
      subtitle:
        "Temukan solusi andal yang dirancang untuk menyederhanakan operasional bisnismu dan meningkatkan produktivitas",
      cta: "Jelajahi Produk",
    },
  }[lang];

  return (
    <section className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">{T.title}</h1>

        <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
          {T.subtitle}
        </p>

        <Link href="#products-grid">
          <Button
            size="lg"
            className="bg-white text-indigo-600 hover:bg-gray-50 font-semibold px-8 py-3"
          >
            {T.cta}
          </Button>
        </Link>
      </div>
    </section>
  );
}
