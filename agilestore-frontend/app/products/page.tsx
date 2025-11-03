// app/products/page.tsx
import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductsHero from "@/components/products-hero";
import ProductGrid from "@/components/product-grid";
import { SearchProducts } from "@/components/search-products";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Products - Agile Store",
  description:
    "Discover our comprehensive suite of SaaS solutions designed to transform your business workflow.",
};

type Lang = "id" | "en";

// Edge/Node-safe cookies -> selaras dengan LanguageProvider/LanguageSwitcher
async function readLang(): Promise<Lang> {
  const maybe = cookies() as any;
  const store = typeof maybe?.then === "function" ? await maybe : maybe;
  const raw =
    store.get("agile.lang")?.value ??
    store.get("agile_lang")?.value ??
    store.get("lang")?.value ??
    "";
  return raw === "en" ? "en" : "id";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const q = (searchParams?.q ?? "").toString();
  const lang = await readLang();

  const T = {
    en: {
      title: "Search Product",
      desc: "Type the product name or code to open its page.",
    },
    id: {
      title: "Cari Produk",
      desc: "Ketik nama atau kode produk untuk membuka halamannya.",
    },
  } as const;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <ProductsHero />

        <section className="bg-gradient-to-b from-blue-50 to-white">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16 text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              {T[lang].title}
            </h1>
            <p className="mt-2 text-gray-600">{T[lang].desc}</p>

            <div className="mt-6 flex justify-center">
              {/* Client component: placeholder & label akan ikut toggle langsung */}
              <SearchProducts
                className="mt-2 w-full"
                useRemote={false}
                defaultQuery={q}
                syncToURL
              />
            </div>
          </div>
        </section>

        {/* Grid filter berdasarkan ?q= dari URL (SSR); akan ikut router.refresh() saat toggle */}
        <ProductGrid query={q} />
      </main>
      <Footer />
    </div>
  );
}
