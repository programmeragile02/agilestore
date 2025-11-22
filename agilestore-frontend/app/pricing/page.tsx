import Link from "next/link";
import { cookies } from "next/headers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  ArrowRight,
  Shield,
  Zap,
  Headphones,
  Sparkles,
} from "lucide-react";
import { fetchProductDetail } from "@/lib/api";

/* =========================
   Types
========================= */
type ProductDetail = Awaited<ReturnType<typeof fetchProductDetail>>;
type Lang = "id" | "en";

/* =========================
   Helpers: language & currency
========================= */

// Edge/Node safe cookies()
async function readLangFromCookies(): Promise<Lang> {
  const maybe = cookies() as any;
  const store = typeof maybe?.then === "function" ? await maybe : maybe;
  const raw =
    store.get("agile.lang")?.value ??
    store.get("agile_lang")?.value ??
    store.get("lang")?.value ??
    "";
  return raw === "en" ? "en" : "id";
}

async function readUsdRate(): Promise<number> {
  const maybe = cookies() as any;
  const store = typeof maybe?.then === "function" ? await maybe : maybe;
  const num = Number(store.get("usd_idr")?.value);
  return Number.isFinite(num) && num > 0 ? num : 15500;
}

/** Normalisasi angka dari berbagai bentuk (number / "Rp 100.000" / "100,000" / "$79") */
function normalizePriceToNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const digits = v.replace(/[^\d]/g, "");
    if (!digits) return 0;
    return Number(digits);
  }
  return 0;
}

/** Format harga dari nilai IDR -> tampil sesuai locale (IDR untuk id, USD untuk en) */
function formatPriceFromIDR(amountIdr: number, locale: Lang, usdRate: number) {
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

/** Find monthly duration: unit=month & length=1; fallback ke code "M1"; else first duration */
function findMonthlyDurationId(durations: ProductDetail["durations"]) {
  const exact = durations.find((d) => d.unit === "month" && d.length === 1);
  if (exact) return exact.id;
  const codeM1 = durations.find((d) =>
    (d.code || "").toUpperCase().includes("M1")
  );
  return codeM1?.id ?? durations[0]?.id ?? null;
}

type PickedMonthlyPrice = {
  price: number;
  discount: number;
  final: number;
  duration_id: number;
  duration_code: string;
} | null;

/** Pick price row untuk durasi bulanan dari pricelist package */
function pickMonthlyPrice(
  pricelist: NonNullable<ProductDetail["packages"][number]["pricelist"]>,
  monthlyDurationId: number | null
): PickedMonthlyPrice {
  if (!monthlyDurationId) return null;
  const row = pricelist.find((p) => p.duration_id === monthlyDurationId);
  if (!row) return null;
  const price = Number(row.price || 0);
  const discount = Number(row.discount || 0);
  const final = Math.max(price - discount, 0);
  const duration_code = (row as any).duration_code ?? "M1";
  return {
    price,
    discount,
    final,
    duration_id: monthlyDurationId,
    duration_code,
  };
}

/* =========================
   I18N: UI text
========================= */
const UI = {
  en: {
    heroTitle: (name: string) => `${name} Pricing`,
    heroSubtitle:
      "Choose a monthly plan that fits you—instant activation, no hidden fees.",
    mostPopular: "Most Popular",
    featureComparison: "Feature Comparison",
    featureSubtitle: "See what’s included in each plan.",
    featureCol: "Feature",
    included: "Included",
    viewProductDetails: "View Product Details",
    finalCtaTitle: (name: string) => `Ready to use ${name}?`,
    finalCtaSubtitle:
      "Pick your monthly plan, activate instantly, and streamline billing & reports today.",
    getStarted: "Get Started",
    talkToSales: "Talk to Sales",
    noHiddenFees: "No hidden fees",
    instantActivation: "Instant activation",
    prioritySupport: "Priority support",
    choose: "Choose",
  },
  id: {
    heroTitle: (name: string) => `Harga ${name}`,
    heroSubtitle:
      "Pilih paket bulanan yang pas—aktivasi instan, tanpa biaya tersembunyi.",
    mostPopular: "Paling Populer",
    featureComparison: "Perbandingan Fitur",
    featureSubtitle: "Lihat apa saja yang termasuk di tiap paket.",
    featureCol: "Fitur",
    included: "Termasuk",
    viewProductDetails: "Lihat Detail Produk",
    finalCtaTitle: (name: string) => `Siap pakai ${name}?`,
    finalCtaSubtitle:
      "Pilih paket bulananmu, aktifkan instan, dan sederhanakan tagihan & laporan hari ini.",
    getStarted: "Mulai Sekarang",
    talkToSales: "Hubungi Sales",
    noHiddenFees: "Tanpa biaya tersembunyi",
    instantActivation: "Aktivasi instan",
    prioritySupport: "Dukungan prioritas",
    choose: "Pilih",
  },
} as const;

/* =========================
   I18N: Features by feature_code
   (Gunakan code sebagai kunci agar stabil)
========================= */
const FEATURE_I18N: Record<string, { id: string; en: string }> = {
  // contoh dari DB & screenshot
  "setting.wa.sender": {
    id: "Setting Whatsapp Sender",
    en: "WhatsApp Sender Settings",
  },
  "kirim.notif.whatsapp": {
    id: "Kirim Notif Whatsapp",
    en: "Send WhatsApp Notification",
  },
  "akses.role": {
    id: "Manajemen Akses Role",
    en: "Role Access Management",
  },
  "export.excel": {
    id: "Export Excel",
    en: "Export to Excel",
  },
  "download.bill": {
    id: "Unduh Tagihan",
    en: "Download Bill",
  },
  "download.receipt": {
    id: "Unduh Kwitansi",
    en: "Download Receipt",
  },
  "dashboard.kpi": {
    id: "Dashboard & KPI",
    en: "Dashboard & KPI",
  },
  "max.customers": {
    id: "Maksimal Pelanggan",
    en: "Max Customers",
  },
  "max.block": {
    id: "Maksimal Blok",
    en: "Max Blocks",
  },
  "max.tandon": {
    id: "Maksimal Tandon",
    en: "Max Reservoirs",
  },
  rekonsiliasi: { id: "Rekonsiliasi", en: "Reconciliation" },
  "peta.pemakaian.air": {
    id: "Peta Pemakaian Air",
    en: "Water Usage Map",
  },
  laporan: { id: "Laporan", en: "Reports" },
  "setting.logo": { id: "Setting Logo", en: "Logo Settings" },
  "monitoring.keuangan": {
    id: "Monitoring Keuangan",
    en: "Finance Monitoring",
  },
  "monitoring.water": {
    id: "Monitoring Pemakaian Air",
    en: "Water Meter Monitoring",
  },
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

// Limit per fitur per paket (UI-only, belum dari backend)
const FEATURE_LIMIT_UI: Record<
  string, // feature_code
  Partial<Record<string, string | number>> // package_code -> value
> = {
  "maksimal.pelanggan": {
    basic: 20,
    premium: 40,
    professional: 70,
  },
  "maksimal.blok": {
    basic: 2,
    premium: 5,
    professional: 10,
  },
  "maksimal.tandon": {
    basic: 1,
    premium: 3,
    professional: 5,
  },
  "manajemen.akses.role": {
    basic: 3,
    premium: 4,
    professional: 6,
  },
};

function getUiFeatureLimit(
  featureCode: string,
  packageCode: string
): string | null {
  const map = FEATURE_LIMIT_UI[featureCode];
  if (!map) return null;
  const raw = map[packageCode];
  if (raw == null) return null;
  return String(raw);
}

function formatFeatureWithUiLimit(
  code: string,
  baseLabel: string,
  pkgCode: string,
  lang: Lang
): string {
  const v = getUiFeatureLimit(code, pkgCode);
  if (!v) return baseLabel;

  // kalau mau beda untuk EN/ID bisa diatur di sini:
  if (lang === "en") {
    // contoh: "Max Customers: 500"
    return `${baseLabel}: ${v}`;
  }
  // contoh: "Maksimal Pelanggan 500"
  return `${baseLabel} ${v}`;
}

function featureLabelByCode(
  code: string,
  fallbackName: string | undefined,
  lang: Lang
): string {
  const hit = FEATURE_I18N[code];
  if (hit) return lang === "en" ? hit.en : hit.id;

  // Fallback heuristik: terjemahkan beberapa kata umum
  const name = (fallbackName || code || "").trim();
  if (lang === "en") {
    return name
      .replace(/^Unduh\b/i, "Download")
      .replace(/\bKwitansi\b/i, "Receipt")
      .replace(/\bTagihan\b/i, "Bill")
      .replace(/\bManajemen\b/i, "Management")
      .replace(/\bAkses\b/i, "Access")
      .replace(/\bPeran\b|\bRole\b/i, "Role")
      .replace(/\bAktivasi\b/i, "Activation")
      .replace(/\bPemakaian Air\b/i, "Water Usage")
      .replace(/\bPeta\b/i, "Map")
      .replace(/\bLaporan\b/i, "Reports")
      .replace(/\bEkspor\b|\bExport\b/i, "Export")
      .replace(/\bPengaturan\b|\bSetting\b/i, "Settings")
      .replace(/\bDukungan\b/i, "Support");
  }
  // ID fallback (biarkan apa adanya)
  return name;
}

/** Translate product.description khusus frasa “Water meter monitoring application” */
function localizedProductDescription(
  desc: string | null | undefined,
  lang: Lang
) {
  if (!desc) return null;
  const base = String(desc).trim();
  if (lang === "id") {
    if (/water\s+meter\s+monitoring/i.test(base)) {
      return "Aplikasi pemantauan meter air";
    }
  }
  return base;
}

/* =========================
   PAGE (Server Component)
========================= */
export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  // ===== Ambil bahasa & kurs dari cookie yang sama dengan LanguageSwitcher =====
  const locale = await readLangFromCookies();
  const usdRate = await readUsdRate();
  const T = UI[locale];

  const productCode = (searchParams?.product as string) || "NATABANYU";
  const data = (await fetchProductDetail(productCode)) as ProductDetail;

  const monthlyDurationId = findMonthlyDurationId(data.durations);
  const pkgsSorted = [...data.packages].sort((a, b) => {
    if (a.order_number !== b.order_number)
      return a.order_number - b.order_number;
    return a.name.localeCompare(b.name);
  });

  // default CTA
  const defaultPkg =
    pkgsSorted[Math.min(1, Math.max(0, pkgsSorted.length - 1))];
  const defaultMonthly = defaultPkg
    ? pickMonthlyPrice(defaultPkg.pricelist ?? [], monthlyDurationId)
    : null;

  // deskripsi produk terlokalisasi
  const productDesc = localizedProductDescription(
    data.product.description ?? null,
    locale
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main>
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50 py-14 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="font-sans font-bold text-4xl sm:text-5xl text-slate-900 leading-tight">
                {T.heroTitle(data.product.product_name)}
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 mt-4">
                {productDesc ?? T.heroSubtitle}
              </p>
            </div>
          </div>

          {/* soft blobs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />
            <div className="absolute -bottom-12 -left-8 h-56 w-56 rounded-full bg-violet-400/10 blur-3xl" />
          </div>
        </section>

        {/* ===== PACKAGES GRID ===== */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-stretch gap-8 max-w-7xl mx-auto">
              {pkgsSorted.map((pkg, idx) => {
                const pkgId = pkg.pricelist?.[0]?.package_id as
                  | number
                  | undefined;
                const monthly = pickMonthlyPrice(
                  pkg.pricelist ?? [],
                  monthlyDurationId
                );

                // fitur enabled untuk paket ini
                const enabledItems = data.package_matrix
                  .filter(
                    (m) =>
                      m.package_id === pkgId &&
                      m.item_type === "feature" &&
                      m.enabled
                  )
                  .map((m) => {
                    const code = m.item_id;
                    const rawName = data.features.find(
                      (f) => f.feature_code === code
                    )?.name;
                    const baseLabel = featureLabelByCode(code, rawName, locale);

                    return {
                      code,
                      label: formatFeatureWithUiLimit(
                        code,
                        baseLabel,
                        pkg.package_code, // penting: pakai package_code
                        locale
                      ),
                    };
                  });

                const nameLc = pkg.name.toLowerCase();
                const popular = idx === 1 || nameLc.includes("premium");

                // Harga tampil sesuai locale
                const priceBlock =
                  monthly &&
                  formatPriceFromIDR(
                    normalizePriceToNumber(monthly.final),
                    locale,
                    usdRate
                  );
                const discountText =
                  monthly &&
                  Number(monthly.discount) > 0 &&
                  formatPriceFromIDR(
                    normalizePriceToNumber(monthly.discount),
                    locale,
                    usdRate
                  ).priceText;

                return (
                  <div
                    key={pkg.package_code}
                    className={`relative h-full flex flex-col border rounded-2xl bg-white transition-all duration-300 hover:shadow-lg ${
                      popular
                        ? "border-blue-600 shadow-xl scale-[1.02]"
                        : "border-slate-200"
                    }`}
                  >
                    {popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="inline-flex whitespace-nowrap bg-gradient-to-r from-blue-600 to-violet-600 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow">
                          {T.mostPopular}
                        </span>
                      </div>
                    )}

                    <div className="p-6 pb-3 text-center">
                      <h3 className="text-2xl font-bold text-slate-900">
                        {pkg.name}
                      </h3>

                      {monthly ? (
                        (() => {
                          const orig = formatPriceFromIDR(
                            normalizePriceToNumber(monthly.price),
                            locale,
                            usdRate
                          );
                          const fin = formatPriceFromIDR(
                            normalizePriceToNumber(monthly.final),
                            locale,
                            usdRate
                          );
                          const hasDiscount = Number(monthly.discount) > 0;
                          return (
                            <div className="mt-3">
                              {hasDiscount ? (
                                <>
                                  {/* Harga awal: nominal + /bulan dicoret SAKALIGUS dan diberi warna merah */}
                                  <div className="text-center">
                                    <span className="text-sm font-medium text-red-600 line-through">
                                      {orig.priceText} {orig.periodText}
                                    </span>
                                  </div>

                                  {/* Harga akhir setelah diskon */}
                                  <div className="flex items-baseline justify-center gap-1 mt-1">
                                    <span className="text-4xl font-extrabold text-slate-900">
                                      {fin.priceText}
                                    </span>
                                    <span className="text-slate-600">
                                      {fin.periodText}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-baseline justify-center gap-1">
                                  <span className="text-4xl font-extrabold text-slate-900">
                                    {fin.priceText}
                                  </span>
                                  <span className="text-slate-600">
                                    {fin.periodText}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="flex items-baseline justify-center gap-1 mt-3">
                          <span className="text-4xl font-extrabold text-slate-900">
                            —
                          </span>
                        </div>
                      )}

                      <p className="mt-2 text-slate-600">
                        {/* deskripsi paket biarkan sesuai sumber; bisa ditambah kamus jika perlu */}
                        {locale === "id"
                          ? (pkg.description ?? "").replace(
                              /Water meter monitoring application/gi,
                              "Aplikasi pemantauan meter air"
                            )
                          : pkg.description ?? ""}
                      </p>

                      {/* {monthly && Number(monthly.discount) > 0 && (
                        <p className="mt-1 text-xs text-emerald-600">
                          {locale === "id" ? "Diskon" : "Discount"}{" "}
                          {discountText}{" "}
                          {locale === "id" ? "diterapkan" : "applied"}
                        </p>
                      )} */}
                    </div>

                    <div className="px-6 pt-0 pb-6 flex flex-col flex-1">
                      <ul className="space-y-3 mb-6">
                        {enabledItems.map((item) => (
                          <li
                            key={item.code}
                            className="flex items-center gap-3"
                          >
                            <Check className="h-5 w-5 text-emerald-600" />
                            <span className="text-slate-700">{item.label}</span>
                          </li>
                        ))}
                        {/* {enabledLabels.length > 7 && (
                          <li className="text-sm text-slate-500">
                            + {enabledLabels.length - 7}{" "}
                            {locale === "id"
                              ? "fitur lainnya"
                              : "more features"}
                          </li>
                        )} */}
                      </ul>

                      <div className="mt-auto">
                        {monthly && (
                          <Link
                            href={{
                              pathname: "/checkout",
                              query: {
                                product: data.product.product_code,
                                package: pkg.package_code,
                                duration: monthly.duration_code, // DUR-*
                                price: String(Math.round(monthly.final)), // tetap IDR
                              },
                            }}
                          >
                            <Button
                              size="lg"
                              className={`w-full ${
                                popular
                                  ? "bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90"
                                  : "bg-slate-900 hover:bg-slate-800"
                              } text-white`}
                            >
                              {T.choose} {pkg.name}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* ===== Lifetime Manual Card (no price) ===== */}
              {(() => {
                const LT = LIFETIME_TEXT[locale];
                const FEAT = LIFETIME_FEATURES[locale];

                return (
                  <div className="relative bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl text-white shadow-xl border border-transparent flex flex-col h-full">
                    {/* Badge aman (nowrap) */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                      <span className="inline-flex whitespace-nowrap px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-violet-600 backdrop-blur border border-white/30 shadow">
                        {LT.badge}
                      </span>
                    </div>

                    {/* Heading + deskripsi (font lebih kecil) */}
                    <div className="pt-8 px-6 pb-4 text-center">
                      <h3 className="text-xl sm:text-2xl font-bold">
                        {LT.title}
                      </h3>

                      <div className="mt-3 flex flex-col items-center gap-1">
                        <div className="text-[11px] sm:text-xs font-medium tracking-wide text-white/80 uppercase">
                          {locale === "id"
                            ? "Akses Selamanya"
                            : "Lifetime Access"}
                        </div>
                        <p className="text-sm sm:text-base text-white/90 max-w-[300px] mx-auto leading-relaxed">
                          {LT.desc}
                        </p>
                      </div>
                    </div>

                    {/* Fitur + CTA */}
                    <div className="px-6 pt-0 pb-6 flex-1 flex flex-col">
                      <div className="border-t border-white/20 pt-4">
                        <div className="text-xs sm:text-sm font-semibold mb-3 text-white/90">
                          {LT.featuresTitle}
                        </div>
                        <ul className="grid grid-cols-1 gap-2">
                          {FEAT.map((label, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-white flex-shrink-0" />
                              <span className="text-white/95">{label}</span>
                            </li>
                          ))}
                        </ul>

                        <Link href="/contact" className="block mt-4">
                          <Button
                            size="lg"
                            className="w-full bg-white text-blue-700 hover:bg-white/90"
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

            {/* Mini perks row */}
            <div className="grid gap-4 sm:grid-cols-3 mt-10 max-w-5xl mx-auto">
              <div className="flex items-center gap-3 justify-center rounded-lg border bg-slate-50 p-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-slate-700">{T.noHiddenFees}</span>
              </div>
              <div className="flex items-center gap-3 justify-center rounded-lg border bg-slate-50 p-3">
                <Zap className="h-5 w-5 text-violet-600" />
                <span className="text-sm text-slate-700">
                  {T.instantActivation}
                </span>
              </div>
              <div className="flex items-center gap-3 justify-center rounded-lg border bg-slate-50 p-3">
                <Headphones className="h-5 w-5 text-emerald-600" />
                <span className="text-sm text-slate-700">
                  {T.prioritySupport}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FEATURE COMPARISON ===== */}
        <section className="py-12 sm:py-16 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-8">
              <h2 className="font-sans font-bold text-3xl text-slate-900">
                {T.featureComparison}
              </h2>
              <p className="text-slate-600 mt-2">{T.featureSubtitle}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 rounded-xl overflow-hidden bg-white">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-violet-50">
                    <th className="text-left text-slate-900 font-semibold p-4 border-b border-slate-200">
                      {T.featureCol}
                    </th>
                    {pkgsSorted.map((p) => (
                      <th
                        key={p.package_code}
                        className="text-left text-slate-900 font-semibold p-4 border-b border-slate-200"
                      >
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(
                    new Set(
                      data.package_matrix
                        .filter((m) => m.item_type === "feature" && m.enabled)
                        .map((m) => m.item_id)
                    )
                  ).map((code) => {
                    const rawName =
                      data.features.find((f) => f.feature_code === code)
                        ?.name ?? code;
                    const label = featureLabelByCode(code, rawName, locale);
                    return (
                      <tr key={code} className="hover:bg-slate-50">
                        <td className="p-4 text-slate-700 border-b border-slate-200">
                          {label}
                        </td>
                        {pkgsSorted.map((p) => {
                          const pid = p.pricelist?.[0]?.package_id as
                            | number
                            | undefined;
                          const included =
                            pid != null &&
                            data.package_matrix.some(
                              (m) =>
                                m.package_id === pid &&
                                m.item_type === "feature" &&
                                m.enabled &&
                                m.item_id === code
                            );
                          return (
                            <td
                              key={`${p.package_code}-${code}`}
                              className="p-4 border-b border-slate-200"
                            >
                              {included ? (
                                <div className="inline-flex items-center gap-2 text-emerald-600 font-medium">
                                  <Check className="h-5 w-5" />
                                  <span className="text-sm">{T.included}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="text-center mt-8">
              <Link href={`/product/${data.product.product_code}`}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
                >
                  {T.viewProductDetails}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="py-16 sm:py-24 bg-gradient-to-r from-blue-600 to-violet-600 relative overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>

              <h2 className="font-sans font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6 leading-tight">
                {T.finalCtaTitle(data.product.product_name)}
              </h2>

              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
                {T.finalCtaSubtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href={
                    defaultPkg && defaultMonthly
                      ? {
                          pathname: "/checkout",
                          query: {
                            product: data.product.product_code,
                            package: defaultPkg.package_code,
                            duration: defaultMonthly.duration_code,
                            price: String(Math.round(defaultMonthly.final)), // tetap IDR
                          },
                        }
                      : `/signup?product=${data.product.product_code}`
                  }
                >
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 shadow-xl font-semibold"
                  >
                    {T.getStarted}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white/10 text-lg px-8 py-4 bg-transparent"
                  >
                    {T.talkToSales}
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center gap-8 text-blue-100 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span>{T.noHiddenFees}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span>{T.prioritySupport}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-yellow-300/10 rounded-full blur-3xl" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
