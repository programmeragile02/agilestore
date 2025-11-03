"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  Star,
  Building2,
  Users,
  Calendar,
  TrendingUp,
  Search,
  Package,
  Rocket,
  Check,
  Zap,
  DollarSign,
  Shield,
  Headphones,
} from "lucide-react";

type Lang = "id" | "en";

/* ===== Icon mapper ===== */
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Users,
  Calendar,
  TrendingUp,
  Search,
  Package,
  Rocket,
  Zap,
  DollarSign,
  Shield,
  Headphones,
};
function IconByName(
  name?: string,
  fallback?: React.ComponentType<{ className?: string }>
) {
  return (name && ICONS[name]) || fallback || Search;
}

/* ===== Defaults untuk client (cadangan kedua) ===== */
const DEF = {
  hero: {
    title: "Digital Products to",
    highlight: "Grow Your Business",
    trailing: ", Faster.",
    tagline: "Agile Store provides powerful and affordable digital apps.",
    primaryCta: { label: "Explore Products", href: "/products" },
    secondaryCta: {
      label: "Start Free",
      href: "/signup",
      variant: "outline" as const,
    },
  },
  featured: {
    title: "Our Products",
    subtitle: "Powerful digital solutions.",
    products: [] as any[],
  },
  benefits: {
    title: "Why Agile Store",
    subtitle: "Everything you need.",
    items: [] as any[],
  },
  hiw: {
    title: "How It Works",
    subtitle: "Three simple steps.",
    steps: [] as any[],
  },
  pricing: {
    title: "Simple Pricing for Everyone",
    subtitle: "No hidden fees.",
    plans: [] as any[],
  },
  testimonials: {
    title: "What Our Customers Say",
    subtitle: "Loved by teams.",
    autoplayMs: 5000,
    items: [] as any[],
  },
  finalCta: {
    titleHTML: `Ready to boost your business with <span class="text-yellow-300">Agile Store</span>?`,
    subtitle:
      "Join thousands of businesses already growing with our digital solutions.",
    primary: { label: "Get Started Today", href: "/products" },
    secondary: { label: "Talk to Sales", href: "/contact" },
    bullets: ["No setup fees", "Cancel anytime", "24/7 support"],
  },
  trusted: { headline: "Trusted by our customers", items: [] as any[] },
} as const;

/* ===== Helpers harga ===== */
function normalizePriceToNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const digits = v.replace(/[^\d]/g, "");
    if (!digits) return 0;
    return Number(digits);
  }
  return 0;
}
function resolvePrice(plan: any, locale: Lang, usdRate: number) {
  const p = plan?.price;
  let raw =
    (p && (typeof p === "object" ? p.monthly ?? p.yearly : p)) ??
    plan?.priceMonthly ??
    plan?.price_monthly ??
    plan?.priceYearly ??
    plan?.price_yearly ??
    "0";

  const idr = normalizePriceToNumber(raw);
  if (locale === "id") {
    return {
      priceText: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(idr),
      periodText: "/bulan",
    };
  }
  const amountUsd = idr / (usdRate > 0 ? usdRate : 15500);
  return {
    priceText: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amountUsd),
    periodText: "/month",
  };
}

/* ===== Komponen utama ===== */
export default function HomeClient({
  data,
  usdRate,
}: {
  data: { id: any; en: any };
  usdRate: number;
}) {
  const { lang } = useLanguage();

  // pilih dataset & pastikan setiap section ada
  const base = lang === "en" ? data?.en : data?.id;

  const d = {
    hero: base?.hero ?? DEF.hero,
    featured: {
      title: base?.featured?.title ?? DEF.featured.title,
      subtitle: base?.featured?.subtitle ?? DEF.featured.subtitle,
      products: Array.isArray(base?.featured?.products)
        ? base.featured.products
        : [],
    },
    benefits: {
      title: base?.benefits?.title ?? DEF.benefits.title,
      subtitle: base?.benefits?.subtitle ?? DEF.benefits.subtitle,
      items: Array.isArray(base?.benefits?.items) ? base.benefits.items : [],
    },
    hiw: {
      title: base?.hiw?.title ?? DEF.hiw.title,
      subtitle: base?.hiw?.subtitle ?? DEF.hiw.subtitle,
      steps: Array.isArray(base?.hiw?.steps) ? base.hiw.steps : [],
    },
    pricing: {
      title: base?.pricing?.title ?? DEF.pricing.title,
      subtitle: base?.pricing?.subtitle ?? DEF.pricing.subtitle,
      plans: Array.isArray(base?.pricing?.plans) ? base.pricing.plans : [],
    },
    testimonials: {
      title: base?.testimonials?.title ?? DEF.testimonials.title,
      subtitle: base?.testimonials?.subtitle ?? DEF.testimonials.subtitle,
      autoplayMs: base?.testimonials?.autoplayMs ?? DEF.testimonials.autoplayMs,
      items: Array.isArray(base?.testimonials?.items)
        ? base.testimonials.items
        : [],
    },
    finalCta: {
      titleHTML: base?.finalCta?.titleHTML ?? DEF.finalCta.titleHTML,
      subtitle: base?.finalCta?.subtitle ?? DEF.finalCta.subtitle,
      primary: base?.finalCta?.primary ?? DEF.finalCta.primary,
      secondary: base?.finalCta?.secondary ?? DEF.finalCta.secondary,
      bullets: Array.isArray(base?.finalCta?.bullets)
        ? base.finalCta.bullets
        : DEF.finalCta.bullets,
    },
    trusted: {
      headline: base?.trusted?.headline ?? DEF.trusted.headline,
      items: Array.isArray(base?.trusted?.items) ? base.trusted.items : [],
    },
  };

  /* =========================================
     SECTION: HERO
  ========================================= */
  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50 py-16 sm:py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="font-sans font-bold text-4xl sm:text-5xl lg:text-6xl text-slate-900 mb-6 leading-tight">
                {d.hero.title}{" "}
                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  {d.hero.highlight}
                </span>
                {d.hero.trailing}
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {d.hero.tagline}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <Link href={d.hero.primaryCta?.href ?? "/products"}>
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3 shadow-lg"
                  >
                    {d.hero.primaryCta?.label ??
                      (lang === "en" ? "Explore Products" : "Lihat Produk")}
                  </Button>
                </Link>
                <Link href={d.hero.secondaryCta?.href ?? "/signup"}>
                  <Button
                    variant={d.hero.secondaryCta?.variant ?? "outline"}
                    size="lg"
                    className="text-lg px-8 py-3 border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
                  >
                    {d.hero.secondaryCta?.label ??
                      (lang === "en" ? "Start Free" : "Mulai Gratis")}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mockup */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
                <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-white mb-2">
                    <div className="w-3 h-3 bg-white/30 rounded-full" />
                    <div className="w-3 h-3 bg-white/30 rounded-full" />
                    <div className="w-3 h-3 bg-white/30 rounded-full" />
                  </div>
                  <h3 className="text-white font-semibold text-lg">
                    Agile Store Dashboard
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Search className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 h-3 bg-slate-200 rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-16 bg-gradient-to-br from-blue-50 to-violet-50 rounded-lg border border-blue-100" />
                    <div className="h-16 bg-gradient-to-br from-violet-50 to-blue-50 rounded-lg border border-violet-100" />
                  </div>
                  <div className="h-8 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full opacity-20 blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full opacity-20 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-slate-600 font-medium">
              {lang === "en"
                ? "Trusted by our customers"
                : "Dipercaya pelanggan kami"}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {(d.trusted.items ?? []).slice(0, 3).map((t: any, i: number) => (
              <div
                key={i}
                className="bg-slate-50 rounded-xl p-6 border border-slate-200"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, ii) => (
                    <Star
                      key={ii}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 text-sm leading-relaxed">
                  "{t?.content ?? ""}"
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={t?.avatar || "/placeholder.svg"}
                    alt={t?.name || "User"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {t?.name ?? ""}
                    </p>
                    <p className="text-slate-600 text-xs">{t?.role ?? ""}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-sans font-bold text-3xl sm:text-4xl text-slate-900 mb-4">
              {d.featured.title}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {d.featured.subtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {(d.featured.products ?? []).map((p: any, idx: number) => {
              const Icon = IconByName(p?.icon, Building2);
              return (
                <div
                  key={idx}
                  className="group hover:shadow-xl transition-all duration-300 border-slate-200 bg-white border rounded-lg"
                >
                  <div className="p-6 pb-4">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {p?.name ?? "-"}
                        </h3>
                      </div>
                    </div>
                    <p className="text-slate-600 font-medium">
                      {p?.tagline ?? ""}
                    </p>
                  </div>
                  <div className="px-6 pt-0 pb-6">
                    <p className="text-slate-600 mb-6 leading-relaxed">
                      {p?.description ?? ""}
                    </p>
                    <Link href={`/product/${p?.slug ?? "#"}`}>
                      <Button
                        variant="outline"
                        className="w-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300 bg-transparent"
                      >
                        {lang === "en" ? "View Product" : "Lihat Produk"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-sans font-bold text-3xl sm:text-4xl text-slate-900 mb-4">
              {d.benefits.title}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {d.benefits.subtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(d.benefits.items ?? []).map((b: any, i: number) => {
              const Icon = IconByName(b?.icon, Zap);
              return (
                <div key={i} className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-xl text-slate-900 mb-3">
                    {b?.title ?? "-"}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {b?.description ?? ""}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-sans font-bold text-3xl sm:text-4xl text-slate-900 mb-4">
              {d.hiw.title}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {d.hiw.subtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {(d.hiw.steps ?? []).map((s: any, idx: number) => {
              const Icon = IconByName(s?.icon, Search);
              return (
                <div key={idx} className="relative text-center group">
                  <div className="relative">
                    <div className="w-20 h-20 bg-white border-4 border-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {s?.step ?? String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-xl text-slate-900 mb-3">
                    {s?.title ?? "-"}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {s?.description ?? ""}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-sans font-bold text-3xl sm:text-4xl text-slate-900 mb-4">
              {d.pricing.title}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {d.pricing.subtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {(d.pricing.plans ?? []).map((plan: any, index: number) => {
              const { priceText, periodText } = resolvePrice(
                plan,
                lang,
                usdRate
              );
              return (
                <div
                  key={index}
                  className={`relative ${
                    plan?.popular
                      ? "border-blue-600 shadow-xl scale-105"
                      : "border-slate-200"
                  } bg-white hover:shadow-lg transition-all duration-300 border rounded-lg`}
                >
                  {plan?.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        {lang === "en" ? "Most Popular" : "Paling Populer"}
                      </span>
                    </div>
                  )}
                  <div className="p-6 pb-4 text-center">
                    <h3 className="text-2xl font-bold text-slate-900">
                      {plan?.name ?? "-"}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1 mt-4">
                      <span className="text-4xl font-bold text-slate-900">
                        {priceText}
                      </span>
                      <span className="text-slate-600">{periodText}</span>
                    </div>
                    <p className="mt-2 text-slate-600">
                      {plan?.description ?? ""}
                    </p>
                  </div>
                  <div className="px-6 pt-0 pb-6">
                    <ul className="space-y-3 mb-8">
                      {(plan?.features ?? []).map((f: string, i: number) => (
                        <li key={i} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <span className="text-slate-600">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/checkout">
                      <Button
                        className={`w-full ${
                          plan?.popular
                            ? "bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90"
                            : "bg-slate-900 hover:bg-slate-800"
                        } text-white`}
                        size="lg"
                      >
                        {lang === "en" ? "Start Now" : "Mulai Sekarang"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-12">
            <Link href="/products">
              <Button
                variant="outline"
                size="lg"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
              >
                {lang === "en" ? "Compare All Plans" : "Bandingkan Semua Paket"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif font-bold text-3xl sm:text-4xl text-foreground mb-4">
              {d.testimonials.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {d.testimonials.subtitle}
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="relative border-border shadow-lg rounded-lg">
              <div className="p-8 sm:p-12">
                {(() => {
                  const t = (d.testimonials.items ?? [])[0] ?? {
                    content: "",
                    name: "",
                    role: "",
                    avatar: "/placeholder.svg",
                  };
                  const stars = Array.from(
                    { length: 5 },
                    (_, i) => i < (t?.rating ?? 5)
                  );
                  return (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-4">
                        {stars.map((on, i) => (
                          <Star
                            key={i}
                            className={
                              on
                                ? "h-5 w-5 text-yellow-400 fill-current"
                                : "h-5 w-5 text-muted-foreground/30"
                            }
                          />
                        ))}
                      </div>
                      <blockquote className="text-lg sm:text-xl text-foreground mb-6 leading-relaxed">
                        “{t?.content}”
                      </blockquote>
                      <div className="flex items-center justify-center space-x-4">
                        <img
                          src={t?.avatar || "/placeholder.svg"}
                          alt={t?.name || "User"}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="text-left">
                          <div className="font-semibold text-foreground">
                            {t?.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t?.role ?? ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-blue-600 to-violet-600 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2
              className="font-sans font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6 leading-tight"
              dangerouslySetInnerHTML={{
                __html: String(d.finalCta.titleHTML ?? DEF.finalCta.titleHTML),
              }}
            />
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              {d.finalCta.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href={d.finalCta.primary?.href ?? "/products"}>
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 shadow-xl font-semibold"
                >
                  {d.finalCta.primary?.label ??
                    (lang === "en" ? "Get Started Today" : "Mulai Hari Ini")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href={d.finalCta.secondary?.href ?? "/contact"}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white/10 text-lg px-8 py-4 bg-transparent"
                >
                  {d.finalCta.secondary?.label ??
                    (lang === "en" ? "Talk to Sales" : "Hubungi Sales")}
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-8 text-blue-100 text-sm">
              {(d.finalCta.bullets ?? []).map((b: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-yellow-300/10 rounded-full blur-3xl" />
        </div>
      </section>
    </main>
  );
}
