import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ProductsHero from "@/components/products-hero";
import ProductGrid from "@/components/product-grid";
import { SearchProducts } from "@/components/search-products";

export const metadata: Metadata = {
  title: "Products - Agile Store",
  description:
    "Discover our comprehensive suite of SaaS solutions designed to transform your business workflow.",
};

export default function ProductsPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const q = (searchParams?.q ?? "").toString();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <ProductsHero />

        <section className="bg-gradient-to-b from-blue-50 to-white">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16 text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Cari Produk
            </h1>
            <p className="mt-2 text-gray-600">
              Ketik nama atau kode produk untuk membuka halamannya.
            </p>

            <div className="mt-6 flex justify-center">
              {/* ⬇️ komponen client, otomatis sinkron ke URL */}
              <SearchProducts
                className="mt-2 w-full"
                useRemote={false}
                defaultQuery={q}
                syncToURL
              />
            </div>
          </div>
        </section>

        {/* grid akan memfilter berdasarkan query dari URL */}
        <ProductGrid query={q} />
      </main>
      <Footer />
    </div>
  );
}
