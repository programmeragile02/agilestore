import Link from "next/link";
import { cookies } from "next/headers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
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
import {
  AgileStoreAPI,
  fetchProductDetail,
  pickLocale,
  type AgileStoreSectionResp,
} from "@/lib/api";

/* =========================
   Locale & Currency Helpers
========================= */
type Lang = "id" | "en";

/** Edge/Node-safe: baca bahasa dari cookie yang diset LanguageProvider/LanguageSwitcher */
async function readLang(): Promise<Lang> {
  const maybe = cookies() as any;
  const store = typeof maybe?.then === "function" ? await maybe : maybe;

  const raw =
    store.get("agile.lang")?.value ?? // utama: yang ditulis LanguageProvider
    store.get("agile_lang")?.value ?? // alternatif lama
    store.get("locale")?.value ?? // fallback lain
    store.get("lang")?.value ?? // fallback lain
    "id";

  return raw === "en" ? "en" : "id";
}

/** Normalisasi angka harga ke number (terima number / "Rp 100.000" / "100,000" / "$79") */
function normalizePriceToNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const digits = v.replace(/[^\d]/g, "");
    if (!digits) return null;
    return Number(digits);
  }
  return null;
}

/**
 * Pilih & format harga sesuai locale.
 * Asumsi sumber = IDR (dari DB).
 * - 'id' → tampil Rp ... /bulan
 * - 'en' → konversi USD memakai usdRate (IDR per 1 USD) → $ ... /month
 */
function resolvePrice(plan: any, locale: Lang, usdRate: number) {
  const p = plan?.price;
  let rawPrice: any =
    (p && (typeof p === "object" ? p.monthly ?? p.yearly : p)) ??
    plan?.priceMonthly ??
    plan?.price_monthly ??
    plan?.priceYearly ??
    plan?.price_yearly ??
    null;

  let amountIdr = normalizePriceToNumber(rawPrice);
  if (amountIdr == null) amountIdr = 0;

  if (locale === "id") {
    const priceText = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amountIdr);
    return { priceText, periodText: "/bulan" };
  } else {
    const rate = usdRate > 0 ? usdRate : 15500;
    const amountUsd = amountIdr / rate;
    const priceText = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amountUsd);
    return { priceText, periodText: "/month" };
  }
}

/* =========================
   FALLBACKS (UI tidak diubah)
========================= */
const FALLBACK_HERO = {
  title: "Digital Products to",
  highlight: "Grow Your Business",
  trailing: ", Faster.",
  tagline:
    "Agile Store provides powerful and affordable digital apps for your business and community. Scale faster with our proven solutions.",
  primaryCta: { label: "Explore Products", href: "/products" },
  secondaryCta: {
    label: "Start Free",
    href: "/signup",
    variant: "outline" as const,
  },
  ui: { gradientFrom: "blue-600", gradientTo: "violet-600" },
};

const FALLBACK_TRUSTED = {
  headline: "Trusted by 100+ businesses and organizations",
  items: [
    {
      name: "Sarah Johnson",
      role: "Business Owner",
      content: "Agile Store transformed our rental business completely.",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      name: "Ahmad Rahman",
      role: "Community Leader",
      content: "Perfect solution for managing our mosque activities.",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      name: "Lisa Chen",
      role: "Sales Manager",
      content: "Our team productivity increased by 60% using these apps.",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ],
};

const FALLBACK_FEATURED = {
  title: "Our Products",
  subtitle:
    "Powerful digital solutions designed to grow your business and streamline your operations.",
  products: [
    {
      name: "Rent Vix Pro",
      tagline: "Complete rental management solution for your business",
      description:
        "Streamline your rental operations with inventory tracking, booking management, and automated billing.",
      icon: "Building2",
      slug: "rent-vix-pro",
    },
    {
      name: "Absen Fast",
      tagline: "Smart attendance system for modern workplaces",
      description:
        "Track employee attendance with facial recognition, real-time reporting, and mobile integration.",
      icon: "Users",
      slug: "absen-fast",
    },
    {
      name: "Ayo Hidupkan Rumah Ibadah",
      tagline: "Donation and activity management for places of worship",
      description:
        "Manage donations, events, and community activities with transparency and ease.",
      icon: "Calendar",
      slug: "ayo-hidupkan-rumah-ibadah",
    },
    {
      name: "Salesman Apps",
      tagline: "Boost your sales team performance",
      description:
        "CRM, lead tracking, and sales analytics to maximize your team's potential.",
      icon: "TrendingUp",
      slug: "salesman-apps",
    },
  ],
};

const FALLBACK_BENEFITS = {
  title: "Why Agile Store",
  subtitle:
    "Everything you need to succeed, backed by the features that matter most.",
  items: [
    {
      icon: "Zap",
      title: "Easy Setup",
      description:
        "Get started in minutes with our intuitive setup process and guided onboarding.",
    },
    {
      icon: "DollarSign",
      title: "Affordable Pricing",
      description:
        "Transparent pricing with no hidden fees. Pay only for what you need.",
    },
    {
      icon: "Shield",
      title: "Scalable Solutions",
      description:
        "Grow your business with solutions that scale from startup to enterprise.",
    },
    {
      icon: "Headphones",
      title: "24/7 Support",
      description:
        "Get help when you need it with our dedicated customer support team.",
    },
  ],
};

const FALLBACK_HIW = {
  title: "How It Works",
  subtitle:
    "Get started with Agile Store in three simple steps and transform your business today.",
  steps: [
    {
      icon: "Search",
      title: "Choose your product",
      description:
        "Browse our collection of digital products and find the perfect solution for your business needs.",
      step: "01",
    },
    {
      icon: "Package",
      title: "Select a package",
      description:
        "Pick the plan that fits your requirements and budget. Upgrade or downgrade anytime.",
      step: "02",
    },
    {
      icon: "Rocket",
      title: "Start using instantly",
      description:
        "Get immediate access to your product with quick setup and comprehensive onboarding support.",
      step: "03",
    },
  ],
};

const FALLBACK_PRICING = {
  title: "Simple Pricing for Everyone",
  subtitle:
    "Choose the perfect plan for your business. All plans include our core features with no hidden fees.",
  plans: [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "Perfect for small businesses getting started",
      features: [
        "Up to 3 products",
        "Basic analytics",
        "Email support",
        "Mobile app access",
      ],
      popular: false,
    },
    {
      name: "Pro",
      price: "$79",
      period: "/month",
      description: "Best for growing businesses",
      features: [
        "Unlimited products",
        "Advanced analytics",
        "Priority support",
        "API access",
        "Custom integrations",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "/month",
      description: "For large organizations",
      features: [
        "Everything in Pro",
        "Dedicated account manager",
        "Custom development",
        "SLA guarantee",
        "White-label options",
      ],
      popular: false,
    },
  ],
};

const FALLBACK_TESTIMONIALS = {
  title: "What Our Customers Say",
  subtitle:
    "Join thousands of satisfied customers who have transformed their workflows with Agile Store",
  autoplayMs: 5000,
  items: [
    {
      name: "Sarah Johnson",
      role: "Product Manager",
      company: "TechCorp Inc.",
      content:
        "Agile Store transformed our workflow completely. The project management tools are intuitive and our team productivity increased by 40% in just two months.",
      rating: 5,
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Michael Chen",
      role: "Engineering Lead",
      company: "StartupXYZ",
      content:
        "The collaboration features are outstanding. Our remote team feels more connected than ever, and the analytics help us make data-driven decisions.",
      rating: 5,
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Emily Rodriguez",
      role: "Scrum Master",
      company: "Digital Solutions",
      content:
        "Implementation was seamless and the support team is exceptional. The automation features save us hours every week.",
      rating: 5,
      avatar: "/placeholder.svg?height=60&width=60",
    },
  ],
};

const FALLBACK_FINAL_CTA = {
  titleHTML: `Ready to boost your business with <span class="text-yellow-300">Agile Store</span>?`,
  subtitle:
    "Join thousands of businesses already growing with our digital solutions. Start your journey today and see results in days, not months.",
  primary: { label: "Get Started Today", href: "/products" },
  secondary: { label: "Talk to Sales", href: "/contact" },
  bullets: ["No setup fees", "Cancel anytime", "24/7 support"],
};

/* =========================
   Lifetime (manual card)
========================= */
const LIFETIME_TEXT = {
  id: {
    title: "Lifetime",
    badge: "Sekali Bayar",
    desc: "Akses selamanya dengan satu kali pembayaran. Cocok untuk instansi yang ingin biaya tetap tanpa langganan bulanan",
    cta: "Hubungi Kami",
    featuresTitle: "Fitur termasuk",
  },
  en: {
    title: "Lifetime",
    badge: "One-time Payment",
    desc: "Lifetime access with a single upfront payment. Perfect for teams that prefer fixed cost without monthly subscriptions",
    cta: "Contact Us",
    featuresTitle: "Included features",
  },
} as const;

const LIFETIME_FEATURES = {
  id: [
    "Setting Whatsapp Sender",
    "Kirim Notif Whatsapp",
    "Manajemen Akses Role",
    "Export Excel",
    "Unduh Tagihan",
    "Unduh Kwitansi",
    "Monitoring Keuangan",
    "Dashboard & KPI",
    "KPI",
    "Hirarki",
    "Rekonsiliasi",
    "Peta Pemakaian Air",
    "Setting Logo",
    "Unlimited Pelanggan",
    "Unlimited Blok",
    "Unlimited Tandon",
  ],
  en: [
    "Setting Whatsapp Sender",
    "Kirim Notif Whatsapp",
    "Manajemen Akses Role",
    "Export Excel",
    "Unduh Tagihan",
    "Unduh Kwitansi",
    "Monitoring Keuangan",
    "Dashboard & KPI",
    "KPI",
    "Hirarki",
    "Rekonsiliasi",
    "Peta Pemakaian Air",
    "Setting Logo",
    "Unlimited Pelanggan",
    "Unlimited Blok",
    "Unlimited Tandon",
  ],
} as const;

/* =========================
   Icon mapper
========================= */
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

/* =========================
   Normalizers per section (respect locale via pickLocale)
========================= */
function parseHeroPartsFromTitle(
  full?: string | null,
  locale?: "id" | "en",
  explicitHighlight?: string | null
) {
  if (!full || typeof full !== "string") return null;

  // 1) Kalau DB menyediakan highlight sendiri, hormati itu
  if (explicitHighlight && full.includes(explicitHighlight)) {
    const idx = full.indexOf(explicitHighlight);
    const before = full.slice(0, idx).trim();
    const after = full.slice(idx + explicitHighlight.length).trim();
    const trailing = after
      ? after.startsWith(",")
        ? after
        : ", " + after
      : "";
    return { title: before, highlight: explicitHighlight, trailing };
  }

  // 2) Heuristik bahasa: coba beberapa frasa umum
  const candidates = [
    "Grow Your Business",
    "Kembangkan Bisnis Anda",
    "Mengembangkan Bisnis Anda",
    "Usahamu", // longgar — bisa kamu tambah sesuai copywritingmu
  ];
  for (const key of candidates) {
    const i = full.indexOf(key);
    if (i >= 0) {
      const before = full.slice(0, i).trim();
      const after = full.slice(i + key.length).trim();
      const trailing = after
        ? after.startsWith(",")
          ? after
          : ", " + after
        : "";
      return { title: before, highlight: key, trailing };
    }
  }

  // 3) Kalau ada koma, pecah di koma pertama
  const comma = full.indexOf(",");
  if (comma > 0) {
    return {
      title: full.slice(0, comma).trim(),
      highlight: "",
      trailing: full.slice(comma).trim(), // termasuk koma
    };
  }

  // 4) Gagal pecah → biarkan utuh (akan dirender tanpa highlight)
  return null;
}

function normalizeHero(
  section: AgileStoreSectionResp<any> | null,
  locale: "id" | "en"
) {
  const { content } = pickLocale<any>(section, locale);

  // Mulai dari objek kosong, JANGAN dari fallback (agar tak “terkunci” Inggris)
  const base = {
    title: "",
    highlight: "",
    trailing: "",
    tagline: "",
    primaryCta: { label: "", href: "/products" },
    secondaryCta: { label: "", href: "/signup", variant: "outline" as const },
  };

  // Pakai judul dari DB (utuh) jika ada
  const parts = parseHeroPartsFromTitle(
    content?.title,
    locale,
    content?.highlight
  );
  if (parts) {
    base.title = parts.title || "";
    base.highlight = parts.highlight || "";
    base.trailing = parts.trailing || "";
  } else if (content?.title) {
    // ← KUNCI PERBAIKAN: kalau tak bisa di-split, render apa adanya sebagai title
    base.title = String(content.title);
    base.highlight = "";
    base.trailing = "";
  } else {
    // benar-benar tak ada di DB → terakhir barulah fallback
    Object.assign(base, FALLBACK_HERO);
  }

  if (content?.subtitle) base.tagline = content.subtitle;
  if (content?.primaryCta)
    base.primaryCta = { label: String(content.primaryCta), href: "/products" };
  if (content?.secondaryCta)
    base.secondaryCta = {
      label: String(content.secondaryCta),
      href: "/signup",
      variant: "outline" as const,
    };

  // Isi default untuk field kosong saja (bukan overwrite)
  if (!base.tagline) base.tagline = FALLBACK_HERO.tagline;
  if (!base.primaryCta?.label) base.primaryCta = FALLBACK_HERO.primaryCta;
  if (!base.secondaryCta?.label) base.secondaryCta = FALLBACK_HERO.secondaryCta;

  return base;
}

function normalizeBenefits(
  section: AgileStoreSectionResp<any> | null,
  locale: Lang
) {
  const { content } = pickLocale<any>(section, locale);
  return {
    title:
      content?.title ??
      (locale === "id" ? "Mengapa Agile Store" : "Why Agile Store"),
    subtitle: content?.subtitle ?? STATIC_FALLBACK[locale].benefitsSubtitle,
    items: content?.items ?? FALLBACK_BENEFITS.items,
  };
}

function normalizeHow(
  section: AgileStoreSectionResp<any> | null,
  locale: Lang
) {
  const { content } = pickLocale<any>(section, locale);
  return {
    title: content?.title ?? FALLBACK_HIW.title,
    subtitle: content?.subtitle ?? FALLBACK_HIW.subtitle,
    steps: content?.steps ?? content?.items ?? FALLBACK_HIW.steps,
  };
}

function normalizeProducts(
  section: AgileStoreSectionResp<any> | null,
  locale: Lang
) {
  const { content } = pickLocale<any>(section, locale);
  const baseItems = content?.items ?? content?.products;
  return {
    title: content?.title ?? FALLBACK_FEATURED.title,
    subtitle: content?.subtitle ?? FALLBACK_FEATURED.subtitle,
    products: baseItems ?? FALLBACK_FEATURED.products,
  };
}

function normalizePricing(
  section: AgileStoreSectionResp<any> | null,
  locale: Lang
) {
  const { content } = pickLocale<any>(section, locale);
  return {
    title: content?.title ?? FALLBACK_PRICING.title,
    subtitle: content?.subtitle ?? FALLBACK_PRICING.subtitle,
    plans: content?.plans ?? content?.items ?? FALLBACK_PRICING.plans,
  };
}

function normalizeCTA(
  section: AgileStoreSectionResp<any> | null,
  locale: Lang
) {
  const { content } = pickLocale<any>(section, locale);
  return {
    titleHTML:
      content?.titleHTML ??
      content?.title_html ??
      content?.title ??
      FALLBACK_FINAL_CTA.titleHTML,
    subtitle: content?.subtitle ?? FALLBACK_FINAL_CTA.subtitle,
    primary:
      typeof content?.primary === "string"
        ? { label: content?.primary, href: "/products" }
        : content?.primary ?? FALLBACK_FINAL_CTA.primary,
    secondary:
      typeof content?.secondary === "string"
        ? { label: content?.secondary, href: "/contact" }
        : content?.secondary ?? FALLBACK_FINAL_CTA.secondary,
    bullets: content?.bullets ?? FALLBACK_FINAL_CTA.bullets,
  };
}

function normalizeTestimonials(
  section: AgileStoreSectionResp<any> | null,
  locale: Lang
) {
  const { content } = pickLocale<any>(section, locale);
  const items = Array.isArray(content?.items)
    ? content.items.map((r: any) => ({
        name: r.name ?? r.person_name ?? r.title ?? "",
        role: r.role ?? r.person_role ?? r.subtitle ?? "",
        content: r.content ?? r.quote ?? r.description ?? "",
        rating: Number(r.rating ?? 5),
        avatar: r.avatar ?? "",
      }))
    : null;

  return {
    title:
      content?.title ??
      (locale === "id" ? "Apa Kata Pelanggan Kami" : "What Our Customers Say"),
    subtitle: content?.subtitle ?? STATIC_FALLBACK[locale].testimonialsSubtitle,
    autoplayMs: content?.autoplayMs ?? FALLBACK_TESTIMONIALS.autoplayMs,
    items: items ?? FALLBACK_TESTIMONIALS.items,
  };
}

/* =========================
   Server-side fetch (RESPECTS locale via pickLocale)
========================= */
async function fetchAllSections(locale: Lang) {
  const [heroSec, whySec, howSec, productsSec, pricingSec, ctaSec, testiSec] =
    await Promise.all([
      AgileStoreAPI.getSection<any>("hero"),
      AgileStoreAPI.getSection<any>("why"),
      AgileStoreAPI.getSection<any>("how"),
      AgileStoreAPI.getSection<any>("products"),
      AgileStoreAPI.getSection<any>("pricing"),
      AgileStoreAPI.getSection<any>("cta"),
      AgileStoreAPI.getSection<any>("testimonials"),
    ]);

  const hero = normalizeHero(heroSec, locale);
  const benefits = normalizeBenefits(whySec, locale);
  const hiw = normalizeHow(howSec, locale);
  const featured = normalizeProducts(productsSec, locale);
  const pricing = normalizePricing(pricingSec, locale);
  const finalCta = normalizeCTA(ctaSec, locale);
  const testimonials = normalizeTestimonials(testiSec, locale);
  const trusted = {
    headline:
      locale === "id"
        ? "Dipercaya oleh pelanggan kami"
        : "Trusted by our customers",
    items: (testimonials.items || []).slice(0, 3).map((t: any) => ({
      name: t.name,
      role: t.role,
      content: t.content,
      avatar: t.avatar,
    })),
  };
  return {
    hero,
    benefits,
    hiw,
    featured,
    pricing,
    finalCta,
    testimonials,
    trusted,
  };
}

/* =========================
   i18n static labels (yang tidak berasal dari DB)
========================= */
const UI_TEXT = {
  en: {
    viewProduct: "View Product",
    mostPopular: "Most Popular",
    compareAllPlans: "Compare All Plans",
    startNow: "Start Now",
  },
  id: {
    viewProduct: "Lihat Produk",
    mostPopular: "Paling Populer",
    compareAllPlans: "Bandingkan Semua Paket",
    startNow: "Mulai Sekarang",
  },
} as const;

const STATIC_FALLBACK = {
  en: {
    benefitsSubtitle:
      "Everything you need to succeed, backed by the features that matter most.",
    testimonialsSubtitle:
      "Join thousands of satisfied customers who have transformed their workflows with Agile Store",
  },
  id: {
    benefitsSubtitle:
      "Semua yang Anda butuhkan untuk sukses, didukung fitur-fitur yang paling penting.",
    testimonialsSubtitle:
      "Bergabunglah dengan ribuan pelanggan yang telah mentransformasi alur kerja mereka dengan Agile Store",
  },
} as const;

/* =========================
   PAGE (Server Component)
========================= */
export default async function HomePage() {
  const locale = await readLang(); // ← baca dari cookie LanguageProvider
  const cookieStore = await cookies();
  const usdRateRaw = Number(cookieStore.get("usd_idr")?.value);
  const usdRate =
    Number.isFinite(usdRateRaw) && usdRateRaw > 0 ? usdRateRaw : 15500;

  const data = await fetchAllSections(locale);
  const T = UI_TEXT[locale];

  let natabanyuProduct: any = null;
  try {
    // pastikan product code sesuai — ganti "NATABANYU" kalau beda
    natabanyuProduct = await fetchProductDetail("NATABANYU");
  } catch (e) {
    console.warn("fetchProductDetail(NATABANYU) failed", e);
    natabanyuProduct = null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main>
        {/* ========== HeroSection ========== */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50 py-16 sm:py-24 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="font-sans font-bold text-4xl sm:text-5xl lg:text-6xl text-slate-900 mb-6 leading-tight">
                  {data.hero.highlight ? (
                    <>
                      {data.hero.title}{" "}
                      <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                        {data.hero.highlight}
                      </span>
                      {data.hero.trailing}
                    </>
                  ) : (
                    // judul utuh tanpa highlight
                    <>{data.hero.title || FALLBACK_HERO.title}</>
                  )}
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  {data.hero.tagline}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                  <Link href={data.hero.primaryCta?.href ?? "/products"}>
                    <Button
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3 shadow-lg"
                    >
                      {data.hero.primaryCta?.label ?? "Explore Products"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href={data.hero.secondaryCta?.href ?? "/signup"}>
                    <Button
                      variant={data.hero.secondaryCta?.variant ?? "outline"}
                      size="lg"
                      className="text-lg px-8 py-3 border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
                    >
                      {data.hero.secondaryCta?.label ?? "Start Free"}
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
                  <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-white mb-2">
                      <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                      <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                      <div className="w-3 h-3 bg-white/30 rounded-full"></div>
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
                      <div className="flex-1 h-3 bg-slate-200 rounded"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-16 bg-gradient-to-br from-blue-50 to-violet-50 rounded-lg border border-blue-100"></div>
                      <div className="h-16 bg-gradient-to-br from-violet-50 to-blue-50 rounded-lg border border-violet-100"></div>
                    </div>
                    <div className="h-8 bg-slate-100 rounded"></div>
                  </div>
                </div>

                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full opacity-20 blur-xl"></div>
                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full opacity-20 blur-xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== TrustedBy ========== */}
        <section className="py-12 bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <p className="text-slate-600 font-medium">
                {data.trusted.headline ??
                  (locale === "id"
                    ? "Dipercaya oleh pelanggan kami"
                    : "Trusted by our customers")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {(data.trusted.items ?? FALLBACK_TRUSTED.items)
                .slice(0, 3)
                .map((t: any, i: number) => (
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
                      "{t.content}"
                    </p>
                    <div className="flex items-center gap-3">
                      <img
                        src={t.avatar || "/placeholder.svg"}
                        alt={t.name || "User"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">
                          {t.name}
                        </p>
                        <p className="text-slate-600 text-xs">{t.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* ========== Featured Products ========== */}
        <section className="py-16 sm:py-24 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-sans font-bold text-3xl sm:text-4xl text-slate-900 mb-4">
                {data.featured.title}
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {data.featured.subtitle}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {(data.featured.products ?? FALLBACK_FEATURED.products).map(
                (p: any, idx: number) => {
                  const Icon = IconByName(p.icon, Building2);
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
                              {p.name}
                            </h3>
                          </div>
                        </div>
                        <p className="text-slate-600 font-medium">
                          {p.tagline}
                        </p>
                      </div>
                      <div className="px-6 pt-0 pb-6">
                        <p className="text-slate-600 mb-6 leading-relaxed">
                          {p.description}
                        </p>
                        <Link href={`/product/${p.slug ?? "#"}`}>
                          <Button
                            variant="outline"
                            className="w-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300 bg-transparent"
                          >
                            {p.cta?.label ?? T.viewProduct}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* ========== Benefits ========== */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-sans font-bold text-3xl sm:text-4xl text-slate-900 mb-4">
                {data.benefits.title}
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {data.benefits.subtitle}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {(data.benefits.items ?? FALLBACK_BENEFITS.items).map(
                (b: any, i: number) => {
                  const Icon = IconByName(b.icon, Zap);
                  return (
                    <div key={i} className="text-center group">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-semibold text-xl text-slate-900 mb-3">
                        {b.title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        {b.description}
                      </p>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* ========== How It Works ========== */}
        <section className="py-16 sm:py-24 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-sans font-bold text-3xl sm:text-4xl text-slate-900 mb-4">
                {data.hiw.title}
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {data.hiw.subtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {(data.hiw.steps ?? FALLBACK_HIW.steps).map(
                (s: any, idx: number) => {
                  const Icon = IconByName(s.icon, Search);
                  return (
                    <div key={idx} className="relative text-center group">
                      <div className="relative">
                        <div className="w-20 h-20 bg-white border-4 border-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                          <Icon className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {s.step}
                          </span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-xl text-slate-900 mb-3">
                        {s.title}
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        {s.description}
                      </p>
                      {idx < (data.hiw.steps?.length ?? 3) - 1 && (
                        <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-violet-200 transform -translate-x-1/2 z-0"></div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </section>

        {/* ========== Pricing ========== */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-sans font-bold text-3xl sm:text-4xl text-slate-900 mb-4">
                {data.pricing.title}
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                {data.pricing.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-stretch gap-8 max-w-7xl mx-auto">
              {
                // choose source: if natabanyuProduct present use its packages; else fallback to data.pricing.plans
                (() => {
                  if (
                    typeof natabanyuProduct === "object" &&
                    Array.isArray(natabanyuProduct?.packages) &&
                    natabanyuProduct.packages.length
                  ) {
                    // render using natabanyuProduct.packages
                    const findMonthlyDurationId = (durations: any[] = []) => {
                      const exact = (durations || []).find(
                        (d) => Number(d.length) === 1
                      );
                      if (exact) return exact.id ?? null;
                      const byCode = (durations || []).find((d) =>
                        String(d.code || "")
                          .toUpperCase()
                          .includes("M1")
                      );
                      return byCode?.id ?? durations?.[0]?.id ?? null;
                    };

                    const monthlyDurationId = findMonthlyDurationId(
                      natabanyuProduct.durations || []
                    );

                    const pickMonthlyRow = (pkg: any) => {
                      if (!pkg || !Array.isArray(pkg.pricelist)) return null;
                      if (monthlyDurationId != null) {
                        const r = pkg.pricelist.find(
                          (x: any) =>
                            Number(x.duration_id) === Number(monthlyDurationId)
                        );
                        if (r) return r;
                      }
                      const durObj = (natabanyuProduct.durations || []).find(
                        (d) => Number(d.length) === 1
                      );
                      if (durObj && durObj.id != null) {
                        const r2 = pkg.pricelist.find(
                          (x: any) =>
                            Number(x.duration_id) === Number(durObj.id)
                        );
                        if (r2) return r2;
                      }
                      return (
                        pkg.pricelist.find((x: any) =>
                          String(x.duration_code || "")
                            .toUpperCase()
                            .includes("M1")
                        ) ??
                        pkg.pricelist[0] ??
                        null
                      );
                    };

                    return natabanyuProduct.packages.map(
                      (pkg: any, index: number) => {
                        const row = pickMonthlyRow(pkg);
                        const priceIdr = row ? Number(row.price || 0) : 0;
                        const discountIdr = row ? Number(row.discount || 0) : 0;
                        const finalIdr = Math.max(0, priceIdr - discountIdr);

                        const nameLc = String(
                          pkg.name || pkg.package_code || ""
                        ).toLowerCase();
                        const popular =
                          index === 1 || nameLc.includes("premium");

                        const fmtIdr = (v: number) =>
                          new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0,
                          }).format(Math.round(v));
                        const fmtUsd = (v: number) => {
                          const rate = usdRate > 0 ? usdRate : 15500;
                          return new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                            maximumFractionDigits: 0,
                          }).format(v / rate);
                        };

                        return (
                          <div
                            key={pkg.package_code ?? index}
                            className={`relative ${
                              popular
                                ? "border-blue-600 shadow-xl scale-105"
                                : "border-slate-200"
                            } bg-white hover:shadow-lg transition-all duration-300 border rounded-lg`}
                          >
                            {popular && (
                              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                <span className="inline-flex whitespace-nowrap bg-gradient-to-r from-blue-600 to-violet-600 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow">
                                  {T.mostPopular}
                                </span>
                              </div>
                            )}

                            <div className="p-6 pb-4 text-center">
                              <h3 className="text-2xl font-bold text-slate-900">
                                {pkg.name}
                              </h3>

                              {/* Harga: tetap jaga UI — hanya ubah data & tambah coret ketika ada diskon */}
                              {(() => {
                                if (locale === "id") {
                                  if (discountIdr > 0) {
                                    return (
                                      <div className="mt-4">
                                        <div className="text-sm font-medium line-through text-red-600">
                                          {fmtIdr(priceIdr)} /bulan
                                        </div>
                                        <div className="text-4xl font-bold text-slate-900 mt-1">
                                          {fmtIdr(finalIdr)}
                                        </div>
                                        <div className="text-slate-600">
                                          /bulan
                                        </div>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="flex items-baseline justify-center gap-1 mt-4">
                                        <span className="text-4xl font-bold text-slate-900">
                                          {fmtIdr(priceIdr)}
                                        </span>
                                        <span className="text-slate-600">
                                          /bulan
                                        </span>
                                      </div>
                                    );
                                  }
                                } else {
                                  const orig = fmtUsd(priceIdr);
                                  const fin = fmtUsd(finalIdr);
                                  if (discountIdr > 0) {
                                    return (
                                      <div className="mt-4">
                                        <div className="text-sm font-medium line-through text-red-600">
                                          {orig} /month
                                        </div>
                                        <div className="text-4xl font-bold text-slate-900 mt-1">
                                          {fin}
                                        </div>
                                        <div className="text-slate-600">
                                          /month
                                        </div>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="flex items-baseline justify-center gap-1 mt-4">
                                        <span className="text-4xl font-bold text-slate-900">
                                          {orig}
                                        </span>
                                        <span className="text-slate-600">
                                          /month
                                        </span>
                                      </div>
                                    );
                                  }
                                }
                              })()}

                              <p className="mt-2 text-slate-600">
                                {pkg.description}
                              </p>
                            </div>

                            {/* Matrix fitur (tetap tampil di bawah tombol) */}
                            <div className="px-6 pt-0 pb-6">
                              {(() => {
                                const pkgId =
                                  pkg.package_id ??
                                  pkg.pricelist?.[0]?.package_id ??
                                  null;
                                if (
                                  !pkgId ||
                                  !Array.isArray(
                                    natabanyuProduct.package_matrix
                                  )
                                )
                                  return null;

                                const enabledCodes: string[] =
                                  natabanyuProduct.package_matrix
                                    .filter(
                                      (m: any) =>
                                        Number(m.package_id) ===
                                          Number(pkgId) &&
                                        m.item_type === "feature" &&
                                        (m.enabled === true || m.enabled === 1)
                                    )
                                    .map((m: any) => m.item_id);

                                const uniqueCodes = Array.from(
                                  new Set(enabledCodes)
                                );
                                const enabledLabels: string[] = uniqueCodes
                                  .map((code: string) => {
                                    const f = (
                                      natabanyuProduct.features || []
                                    ).find(
                                      (ff: any) => ff.feature_code === code
                                    );
                                    return f?.name ?? code;
                                  })
                                  .filter(Boolean);

                                if (!enabledLabels.length) return null;

                                const visible = enabledLabels;
                                // const more = Math.max(
                                //   0,
                                //   enabledLabels.length - visible.length
                                // );

                                return (
                                  <div className="border-t border-slate-100 px-2 pt-4">
                                    <div className="text-sm text-slate-700 mb-3 font-semibold">
                                      {locale === "id"
                                        ? "Fitur termasuk"
                                        : "Included features"}
                                    </div>
                                    <ul className="grid grid-cols-1 gap-2 text-md">
                                      {visible.map(
                                        (label: string, i: number) => (
                                          <li
                                            key={i}
                                            className="flex items-center gap-2 text-slate-600"
                                          >
                                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                            <span>{label}</span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                    {/* {more > 0 && (
                                      <div className="mt-3 text-xs text-slate-500">
                                        +{more} fitur lainnya
                                      </div>
                                    )} */}
                                    <Link
                                      href={`/product/NATABANYU`}
                                    >
                                      <Button
                                        className={`w-full mt-4 ${
                                          popular
                                            ? "bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90"
                                            : "bg-slate-900 hover:bg-slate-800"
                                        } text-white`}
                                        size="lg"
                                      >
                                        {pkg.cta?.label ?? T.startNow}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                      </Button>
                                    </Link>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      }
                    );
                  }

                  // fallback: original static plans
                  return (data.pricing.plans ?? FALLBACK_PRICING.plans).map(
                    (plan: any, index: number) => {
                      // parse price & discount from static plan if provided
                      const rawPrice = normalizePriceToNumber(plan.price) ?? 0;
                      let discountIdr = 0;
                      if (plan?.discount != null) {
                        if (
                          typeof plan.discount === "string" &&
                          plan.discount.includes("%")
                        ) {
                          const pct =
                            parseFloat(plan.discount.replace(/[^\d.]/g, "")) ||
                            0;
                          discountIdr = Math.round((rawPrice * pct) / 100);
                        } else {
                          const n = normalizePriceToNumber(plan.discount);
                          if (n !== null) discountIdr = n;
                        }
                      }
                      const final = Math.max(0, rawPrice - discountIdr);

                      const fmtIdr = (v: number) =>
                        new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          maximumFractionDigits: 0,
                        }).format(Math.round(v));
                      const fmtUsd = (v: number) => {
                        const rate = usdRate > 0 ? usdRate : 15500;
                        return new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                          maximumFractionDigits: 0,
                        }).format(v / rate);
                      };

                      return (
                        <div
                          key={index}
                          className={`relative ${
                            plan.popular
                              ? "border-blue-600 shadow-xl scale-105"
                              : "border-slate-200"
                          } bg-white hover:shadow-lg transition-all duration-300 border rounded-lg flex flex-col h-full`}
                        >
                          {plan.popular && (
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                              <span className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                                {T.mostPopular}
                              </span>
                            </div>
                          )}
                          <div className="p-6 pb-4 text-center">
                            <h3 className="text-2xl font-bold text-slate-900">
                              {plan.name}
                            </h3>

                            {/* Harga statis fallback */}
                            {(() => {
                              if (discountIdr > 0) {
                                return (
                                  <div className="mt-4">
                                    <div className="text-sm font-medium line-through text-red-600">
                                      {locale === "id"
                                        ? `${fmtIdr(rawPrice)} /bulan`
                                        : `${fmtUsd(rawPrice)} /month`}
                                    </div>
                                    <div className="text-4xl font-bold text-slate-900 mt-1">
                                      {locale === "id"
                                        ? `${fmtIdr(final)} /bulan`
                                        : `${fmtUsd(final)} /month`}
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div className="flex items-baseline justify-center gap-1 mt-4">
                                  <span className="text-4xl font-bold text-slate-900">
                                    {plan.price}
                                  </span>
                                  <span className="text-slate-600">
                                    {plan.period}
                                  </span>
                                </div>
                              );
                            })()}

                            <p className="mt-2 text-slate-600">
                              {plan.description}
                            </p>
                          </div>
                          <div className="px-6 pt-0 pb-6 mt-auto">
                            <ul className="space-y-3 mb-8">
                              {(plan.features ?? []).map(
                                (feature: string, featureIndex: number) => (
                                  <li
                                    key={featureIndex}
                                    className="flex items-center gap-3"
                                  >
                                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span className="text-slate-600">
                                      {feature}
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                            <Link href="">
                              <Button
                                className={`w-full ${
                                  plan.popular
                                    ? "bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90"
                                    : "bg-slate-900 hover:bg-slate-800"
                                } text-white`}
                                size="lg"
                              >
                                {plan.cta?.label ?? T.startNow}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      );
                    }
                  );
                })()
              }

              {/* ===== Lifetime Manual Card (no price) ===== */}
              {(() => {
                const LT = LIFETIME_TEXT[locale];
                const FEAT = LIFETIME_FEATURES[locale];

                return (
                  <div className="relative border-blue-600 shadow-xl bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg text-white">
                    {/* Badge: sekarang di dalam kartu & tidak terpotong */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <span className="inline-flex whitespace-nowrap px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-violet-600 backdrop-blur border border-white/30 shadow">
                        {LT.badge}
                      </span>
                    </div>

                    {/* Tambah padding atas supaya badge punya ruang */}
                    <div className="pt-8 px-6 pb-4 text-center">
                      <h3 className="text-2xl font-bold">{LT.title}</h3>

                      {/* No numeric price — info lifetime */}
                      <div className="mt-4 flex flex-col items-center gap-1">
                        <div className="text-sm font-medium uppercase tracking-wider text-white/80">
                          {locale === "id"
                            ? "Akses Selamanya"
                            : "Lifetime Access"}
                        </div>
                        <div className="text-white/90">{LT.desc}</div>
                      </div>
                    </div>

                    {/* Fitur */}
                    <div className="px-6 pt-0 pb-6">
                      <div className="border-t border-white/20 pt-4">
                        <div className="text-sm font-semibold mb-3 text-white/90">
                          {LT.featuresTitle}
                        </div>
                        <ul className="grid grid-cols-1 gap-2 text-md">
                          {FEAT.map((label, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-white flex-shrink-0" />
                              <span className="text-white/95">{label}</span>
                            </li>
                          ))}
                        </ul>

                        <Link href="/contact">
                          <Button
                            size="lg"
                            className="w-full mt-4 bg-white text-blue-700 hover:bg-white/90"
                          >
                            {LT.cta}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="text-center mt-12">
              <Link href="/products">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
                >
                  {T.compareAllPlans}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ========== Testimonials ========== */}
        <section className="py-16 sm:py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif font-bold text-3xl sm:text-4xl text-foreground mb-4">
                {data.testimonials.title}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {data.testimonials.subtitle}
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <div className="border-border shadow-lg rounded-lg">
                  <div className="p-8 sm:p-12">
                    <div className="flex items-center justify-center mb-6">
                      <svg
                        className="h-12 w-12 text-primary/20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M7 7h4v10H5V9a2 2 0 0 1 2-2zm10 0h4v10h-6V9a2 2 0 0 1 2-2z"
                          stroke="currentColor"
                          strokeWidth="1"
                        />
                      </svg>
                    </div>
                    {(() => {
                      const t = (data.testimonials.items ??
                        FALLBACK_TESTIMONIALS.items)[0];
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
                                {t?.company ? ` at ${t.company}` : ""}
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
          </div>
        </section>

        {/* ========== Final CTA ========== */}
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
                  __html:
                    typeof data.finalCta.titleHTML === "string"
                      ? data.finalCta.titleHTML
                      : FALLBACK_FINAL_CTA.titleHTML,
                }}
              />
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
                {data.finalCta.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href={data.finalCta.primary?.href ?? "/products"}>
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 shadow-xl font-semibold"
                  >
                    {data.finalCta.primary?.label ?? "Get Started Today"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href={data.finalCta.secondary?.href ?? "/contact"}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white/10 text-lg px-8 py-4 bg-transparent"
                  >
                    {data.finalCta.secondary?.label ?? "Talk to Sales"}
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center gap-8 text-blue-100 text-sm">
                {(data.finalCta.bullets ?? FALLBACK_FINAL_CTA.bullets).map(
                  (b: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>{b}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-yellow-300/10 rounded-full blur-3xl"></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
