import Link from "next/link";
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
   Types (aligned with your api.ts)
========================= */
type ProductDetail = Awaited<ReturnType<typeof fetchProductDetail>>;

function formatIDR(n: number) {
  // Keep currency in IDR; English UI text elsewhere
  return n.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });
}

/** Find monthly duration: unit=month & length=1; fallback to code like "M1"; else first duration */
function findMonthlyDurationId(durations: ProductDetail["durations"]) {
  const exact = durations.find((d) => d.unit === "month" && d.length === 1);
  if (exact) return exact.id;
  const codeM1 = durations.find((d) =>
    (d.code || "").toUpperCase().includes("M1")
  );
  return codeM1?.id ?? durations[0]?.id ?? null;
}

/** Pick price row for monthly duration_id from a package's pricelist */
function pickMonthlyPrice(
  pricelist: NonNullable<ProductDetail["packages"][number]["pricelist"]>,
  monthlyDurationId: number | null
) {
  if (!monthlyDurationId) return null;
  const row = pricelist.find((p) => p.duration_id === monthlyDurationId);
  if (!row) return null;
  const price = Number(row.price || 0);
  const discount = Number(row.discount || 0);
  const final = Math.max(price - discount, 0);
  // penting: kirim duration_code ke checkout (contohmu pakai DUR-1)
  const duration_code = (row as any).duration_code ?? "M1";
  return {
    price,
    discount,
    final,
    duration_id: monthlyDurationId,
    duration_code,
  };
}

/** Map feature_code -> human label (name) */
function buildFeatureMap(features: ProductDetail["features"]) {
  const map = new Map<string, string>();
  for (const f of features) map.set(f.feature_code, f.name ?? f.feature_code);
  return map;
}

/** Enabled feature codes for a specific package (item_type === "feature") */
function getEnabledFeatureCodesForPackage(
  pkgId: number,
  matrix: ProductDetail["package_matrix"]
) {
  return matrix
    .filter(
      (m) => m.package_id === pkgId && m.item_type === "feature" && m.enabled
    )
    .map((m) => m.item_id);
}

/** Union of all feature codes that appear in enabled matrix rows for listed packages */
function getAllFeatureCodes(
  pkgs: ProductDetail["packages"],
  matrix: ProductDetail["package_matrix"]
) {
  const pkgIds = new Set<number>();
  for (const p of pkgs) {
    const pid = p.pricelist?.[0]?.package_id as number | undefined;
    if (pid != null) pkgIds.add(pid);
  }
  const set = new Set<string>();
  for (const m of matrix) {
    if (m.item_type !== "feature" || !m.enabled) continue;
    if (!pkgIds.has(m.package_id)) continue;
    set.add(m.item_id);
  }
  return Array.from(set);
}

/* =========================
   PAGE (Server Component)
========================= */
export default async function PricingPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const productCode = (searchParams?.product as string) || "NATABANYU";
  const data = (await fetchProductDetail(productCode)) as ProductDetail;

  const monthlyDurationId = findMonthlyDurationId(data.durations);
  const monthlyDurationCode =
    data.durations.find((d) => d.id === monthlyDurationId)?.code ?? "M1";

  // Sort packages by order_number then name
  const pkgsSorted = [...data.packages].sort((a, b) => {
    if (a.order_number !== b.order_number)
      return a.order_number - b.order_number;
    return a.name.localeCompare(b.name);
  });

  const featureMap = buildFeatureMap(data.features);
  const allFeatureCodes = getAllFeatureCodes(pkgsSorted, data.package_matrix);

  //default cta paket dan durasi
  const defaultPkg =
    pkgsSorted[Math.min(1, Math.max(0, pkgsSorted.length - 1))];
  const defaultMonthly = defaultPkg
    ? pickMonthlyPrice(defaultPkg.pricelist ?? [], monthlyDurationId)
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main>
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50 py-14 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="font-sans font-bold text-4xl sm:text-5xl text-slate-900 leading-tight">
                {data.product.product_name} Pricing
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 mt-4">
                {data.product.description ??
                  "Choose a monthly plan that fits you—instant activation, no hidden fees."}
              </p>
              {/* <p className="text-sm text-slate-500 mt-3">
                Billing: Monthly • Product code:{" "}
                <span className="font-mono">{data.product.product_code}</span>
              </p> */}
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
            <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
              {pkgsSorted.map((pkg, idx) => {
                const pkgId = pkg.pricelist?.[0]?.package_id as
                  | number
                  | undefined;
                const monthly = pickMonthlyPrice(
                  pkg.pricelist ?? [],
                  monthlyDurationId
                );

                const enabledCodes =
                  pkgId != null
                    ? getEnabledFeatureCodesForPackage(
                        pkgId,
                        data.package_matrix
                      )
                    : [];
                const enabledLabels = enabledCodes
                  .map((c) => featureMap.get(c) ?? c)
                  .filter(Boolean);

                // Heuristic: mark middle or "pro/premium/professional" as popular
                const nameLc = pkg.name.toLowerCase();
                const popular =
                  idx === 1 ||
                  //   nameLc.includes("pro") ||
                  nameLc.includes("premium");

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
                        <Badge className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-4 py-1 shadow">
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <div className="p-6 pb-3 text-center">
                      <h3 className="text-2xl font-bold text-slate-900">
                        {pkg.name}
                      </h3>

                      <div className="flex items-baseline justify-center gap-1 mt-3">
                        <span className="text-4xl font-extrabold text-slate-900">
                          {monthly ? formatIDR(monthly.final) : "—"}
                        </span>
                        <span className="text-slate-600">/month</span>
                      </div>

                      <p className="mt-2 text-slate-600">
                        {pkg.description ?? ""}
                      </p>

                      {monthly && Number(monthly.discount) > 0 && (
                        <p className="mt-1 text-xs text-emerald-600">
                          Discount {formatIDR(Number(monthly.discount))} applied
                        </p>
                      )}
                    </div>

                    <div className="px-6 pt-0 pb-6 flex flex-col flex-1">
                      <ul className="space-y-3 mb-6">
                        {enabledLabels.slice(0, 7).map((label) => (
                          <li key={label} className="flex items-center gap-3">
                            <Check className="h-5 w-5 text-emerald-600" />
                            <span className="text-slate-700">{label}</span>
                          </li>
                        ))}
                        {enabledLabels.length > 7 && (
                          <li className="text-sm text-slate-500">
                            + {enabledLabels.length - 7} more features
                          </li>
                        )}
                      </ul>

                      <div className="mt-auto">
                        {monthly && (
                          <Link
                            href={{
                              pathname: "/checkout",
                              query: {
                                product: data.product.product_code,
                                package: pkg.package_code,
                                duration: monthly.duration_code, // <-- pakai DUR-*
                                price: String(Math.round(monthly.final)), // <-- kirim harga final
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
                              Choose {pkg.name}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mini perks row */}
            <div className="grid gap-4 sm:grid-cols-3 mt-10 max-w-5xl mx-auto">
              <div className="flex items-center gap-3 justify-center rounded-lg border bg-slate-50 p-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-slate-700">No hidden fees</span>
              </div>
              <div className="flex items-center gap-3 justify-center rounded-lg border bg-slate-50 p-3">
                <Zap className="h-5 w-5 text-violet-600" />
                <span className="text-sm text-slate-700">
                  Instant activation
                </span>
              </div>
              <div className="flex items-center gap-3 justify-center rounded-lg border bg-slate-50 p-3">
                <Headphones className="h-5 w-5 text-emerald-600" />
                <span className="text-sm text-slate-700">Priority support</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FEATURE COMPARISON ===== */}
        <section className="py-12 sm:py-16 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-8">
              <h2 className="font-sans font-bold text-3xl text-slate-900">
                Feature Comparison
              </h2>
              <p className="text-slate-600 mt-2">
                See what’s included in each plan.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 rounded-xl overflow-hidden bg-white">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-50 to-violet-50">
                    <th className="text-left text-slate-900 font-semibold p-4 border-b border-slate-200">
                      Feature
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
                  {allFeatureCodes.map((code) => {
                    const label = featureMap.get(code) ?? code;
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
                                  <span className="text-sm">Included</span>
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
                  View Product Details
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
                Ready to use {data.product.product_name}?
              </h2>

              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
                Pick your monthly plan, activate instantly, and streamline
                billing & reports today.
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
                            price: String(Math.round(defaultMonthly.final)),
                          },
                        }
                      : `/signup?product=${data.product.product_code}`
                  }
                >
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 shadow-xl font-semibold"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white/10 text-lg px-8 py-4 bg-transparent"
                  >
                    Talk to Sales
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex items-center justify-center gap-8 text-blue-100 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span>No setup fees</span>
                </div>
                {/* <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span>Cancel anytime</span>
                </div> */}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span>24/7 support</span>
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
