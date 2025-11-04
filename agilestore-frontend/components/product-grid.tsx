"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchProducts } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";

type ProductRow = {
  product_code?: string;
  product_name: string;
  description?: string | null;
  image?: string | null;
};

function localizeDescription(
  desc: string | null | undefined,
  lang: "id" | "en"
) {
  if (!desc) return null;
  const base = String(desc);
  if (lang === "id" && /water\s+meter\s+monitoring/i.test(base)) {
    return "Aplikasi pemantauan meter air";
  }
  return base;
}

export default function ProductGrid({ query = "" }: { query?: string }) {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);

  const UI = {
    en: {
      sectionTitle: "Our Products",
      sectionDesc: "Choose from our comprehensive suite of business solutions",
      viewDetails: "View Details",
      tooltip: "Landing page not available",
      noDesc: "No description available.",
      loadFail: "Failed to load products",
    },
    id: {
      sectionTitle: "Produk Kami",
      sectionDesc:
        "Pilih dari rangkaian solusi bisnis lengkap yang kami sediakan",
      viewDetails: "Lihat Detail",
      tooltip: "Halaman produk belum tersedia",
      noDesc: "Deskripsi belum tersedia.",
      loadFail: "Gagal memuat produk",
    },
  } as const;

  const T = UI[lang];

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const rows = await fetchProducts();
        setProducts(rows || []);
      } catch (e: any) {
        setError(e?.message || T.loadFail);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // jangan re-run saat lang berubah (grid statis), teks UI sudah reaktif

  const filtered = useMemo(() => {
    const nq = query.trim().toLowerCase();
    if (!nq) return products;
    return products.filter((p) => {
      const name = (p.product_name || "").toLowerCase();
      const code = (p.product_code || "").toLowerCase();
      return name.includes(nq) || code.includes(nq);
    });
  }, [products, query]);

  const ProductCard = ({ product }: { product: ProductRow }) => {
    const panelBase = process.env.NEXT_PUBLIC_PANEL_BASE;
    const heroImage = product.image
      ? `${panelBase}/storage/${product.image}`
      : "/placeholder.svg";
    const isDisabled = !product.product_code;

    const desc = localizeDescription(product.description, lang) ?? T.noDesc;

    const cardContent = (
      <Card
        className={`h-full transition-all duration-200 ${
          isDisabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:shadow-lg hover:-translate-y-1 hover:ring-2 hover:ring-indigo-500/20 cursor-pointer"
        }`}
      >
        <CardContent className="p-0">
          <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
            <Image
              src={heroImage}
              alt={product.product_name}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {product.product_name}
            </h3>
            <p className="text-gray-600 mb-4 line-clamp-3">{desc}</p>
            <Button
              className={`w-full ${
                isDisabled
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
              }`}
              disabled={isDisabled}
            >
              {T.viewDetails}
            </Button>
          </div>
        </CardContent>
      </Card>
    );

    if (isDisabled) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>{cardContent}</div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{T.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Link href={`/product/${product.product_code}`} className="block h-full">
        {cardContent}
      </Link>
    );
  };

  const ProductSkeleton = () => (
    <Card className="h-full">
      <CardContent className="p-0">
        <Skeleton className="aspect-[4/3] rounded-t-lg" />
        <div className="p-6">
          <Skeleton className="h-6 mb-3" />
          <Skeleton className="h-4 mb-2" />
          <Skeleton className="h-4 mb-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section id="products-grid" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {T.sectionTitle}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {T.sectionDesc}
          </p>
          {error && (
            <p className="mt-4 text-sm text-red-600">{error || T.loadFail}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))
            : filtered.map((product) => (
                <ProductCard
                  key={product.product_code ?? product.product_name}
                  product={product}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
