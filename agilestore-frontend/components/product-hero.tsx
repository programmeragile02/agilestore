"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

type Lang = "id" | "en";

interface ProductHeroProps {
  product: {
    name: string;
    tagline?: string;
    shortDescription: string;
    heroImage: string;
    slug: string;

    // opsional: konten Inggris eksplisit dari backend
    name_en?: string;
    tagline_en?: string;
    shortDescription_en?: string;
  };
  ctaHrefTry?: string;
  ctaHrefPricing?: string;
}

export function ProductHero({
  product,
  ctaHrefTry = "/signup",
  ctaHrefPricing = "/pricing",
}: ProductHeroProps) {
  const { lang } = useLanguage();

  const UI: Record<Lang, { try: string; pricing: string; alt: string }> = {
    en: {
      try: "Try for Free",
      pricing: "View Pricing",
      alt: `${product.name_en ?? product.name} interface`,
    },
    id: {
      try: "Coba Gratis",
      pricing: "Lihat Harga",
      alt: `Antarmuka ${product.name_en ?? product.name}`,
    },
  };

  // pilih payload sesuai bahasa; gunakan *_en bila tersedia untuk EN
  const name = lang === "en" ? product.name_en ?? product.name : product.name;
  const tagline =
    lang === "en" ? product.tagline_en ?? product.tagline : product.tagline;
  const shortDesc =
    lang === "en"
      ? product.shortDescription_en ?? product.shortDescription
      : product.shortDescription;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted py-16 sm:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="font-serif font-bold text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6">
              {name}
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
              {tagline || shortDesc}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
              <Link href={ctaHrefTry}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-lg px-8 py-3"
                >
                  {UI[lang].try}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Link href={ctaHrefPricing}>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-3 bg-transparent"
                >
                  {UI[lang].pricing}
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] relative overflow-hidden rounded-2xl shadow-2xl">
              <Image
                src={product.heroImage || "/placeholder.svg"}
                alt={UI[lang].alt}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-full blur-3xl" />
      </div>
    </section>
  );
}

export default ProductHero;
