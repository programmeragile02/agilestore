"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import {
  User,
  Mail,
  Phone,
  Ticket,
  Check,
  X,
  ShoppingCart,
  Shield,
  Loader2,
  Lock,
  Calendar,
  Clock,
} from "lucide-react";

import {
  fetchProducts,
  fetchProductDetail,
  getCustomerMe,
  createPurchaseOrder,
  loginWithGoogle,
  checkProduct,
  api,
} from "@/lib/api";

import { toast } from "@/hooks/use-toast";
import { ensureSnap, openSnap } from "@/lib/midtrans";
import { GoogleLogin } from "@react-oauth/google";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";
import { useLanguage } from "@/components/LanguageProvider";

/* ============================================================================
   TYPES
============================================================================ */
type ProductRow = {
  product_code: string;
  product_name: string;
  description?: string;
  description_en?: string;
};

type ProductDetail = {
  product: {
    product_code: string;
    product_name: string;
    description?: string;
    description_en?: string;
    status?: string;
  };
  packages: Array<{
    package_code: string;
    name: string;
    name_en?: string;
    description?: string;
    description_en?: string;
    status?: string;
    order_number?: number;
    pricelist: Array<{
      id: string;
      pricelist_id: string;
      package_id: number;
      package_code: string;
      duration_id: number;
      duration_code: string;
      price: string;
      discount: string;
      min_billing_cycle: number;
      prorate: boolean;
      effective_start: string | null;
      effective_end: string | null;
      created_at: string;
      updated_at: string;
    }>;
  }>;
  durations: Array<{
    id: number;
    code: string;
    name: string;
    length: number; // months
    unit: "month";
    is_default: boolean;
  }>;
};

type PriceMap = Record<
  string,
  Record<number, { price: number; discount: number }>
>;

export interface CheckoutData {
  contact: {
    fullName: string;
    email: string;
    phone: string;
    company: string;
  };
  plan: {
    product: string;
    package: string;
    duration: number; // 1|6|12 months
    currency: "IDR" | "USD";
    taxMode: "inclusive" | "exclusive";
  };
  payment: {
    method: "card" | "bank_transfer" | "ewallet";
  };
  voucher: { code: string; discount: number };
}

/* ============================================================================
   i18n helpers
============================================================================ */
function makeT(langIn?: "id" | "en") {
  const lang: "id" | "en" = langIn === "en" ? "en" : "id";
  const T = {
    // headings
    pageTitle: {
      en: "Complete Your Purchase",
      id: "Selesaikan Pembelian Anda",
    },
    pageSubtitle: {
      en: "Secure checkout powered by industry-leading encryption",
      id: "Checkout aman dengan enkripsi berkelas industri",
    },

    // contact
    contactInfo: { en: "Contact Information", id: "Informasi Kontak" },
    fullName: { en: "Full Name", id: "Nama Lengkap" },
    fullNamePH: { en: "Enter your full name", id: "Masukkan nama lengkap" },
    email: { en: "Email Address", id: "Alamat Email" },
    emailPH: { en: "Enter your email", id: "Masukkan email" },
    phone: { en: "Phone/WhatsApp", id: "Telepon/WhatsApp" },
    phonePH: { en: "0812 3456 7890", id: "0812 3456 7890" },
    continueWithGoogle: {
      en: "Continue with Google",
      id: "Lanjutkan dengan Google",
    },
    emailInvalid: {
      en: "Please enter a valid email address",
      id: "Mohon masukkan alamat email yang valid",
    },
    phoneInvalid: {
      en: "Phone number must be 8-15 digits",
      id: "Nomor telepon harus 8–15 digit",
    },
    googleFailed: { en: "Google sign-in failed", id: "Masuk Google gagal" },

    // plan & duration
    planDuration: { en: "Plan & Duration", id: "Paket & Durasi" },
    product: { en: "Product", id: "Produk" },
    package: { en: "Package", id: "Paket" },
    duration: { en: "Duration", id: "Durasi" },
    selectProductPH: { en: "Select a product", id: "Pilih produk" },
    loadingProductsPH: { en: "Loading products...", id: "Memuat produk..." },
    selectPackagePH: { en: "Select a package", id: "Pilih paket" },
    loadingPackagesPH: { en: "Loading packages...", id: "Memuat paket..." },
    chooseProductFirst: {
      en: "Choose product first",
      id: "Pilih produk terlebih dahulu",
    },
    active: { en: "Active", id: "Aktif" },

    // voucher
    voucherTitle: { en: "Voucher / Promo Code", id: "Voucher / Kode Promo" },
    voucherPH: { en: "Enter voucher code", id: "Masukkan kode voucher" },
    apply: { en: "Apply", id: "Terapkan" },
    applying: { en: "Applying...", id: "Menerapkan..." },
    applied: { en: "Applied", id: "Diterapkan" },
    remove: { en: "Remove", id: "Hapus" },
    voucherAppliedNote: {
      en: "Voucher applied. Final price is temporarily computed on FE.",
      id: "Voucher diterapkan. Harga akhir untuk sementara dihitung di FE.",
    },

    // order summary
    orderSummary: { en: "Order Summary", id: "Ringkasan Pesanan" },
    subtotal: { en: "Subtotal", id: "Subtotal" },
    discount: { en: "Discount", id: "Diskon" },
    tax: { en: "Tax (11%)", id: "Pajak (11%)" },
    taxIncluded: {
      en: "* Tax included in price",
      id: "* Pajak sudah termasuk harga",
    },
    total: { en: "Total", id: "Total" },
    placeOrder: { en: "Place Order", id: "Buat Pesanan" },
    processing: { en: "Processing...", id: "Memproses..." },
    terms: { en: "Terms of Service", id: "Syarat Layanan" },
    privacy: { en: "Privacy Policy", id: "Kebijakan Privasi" },
    agree1: {
      en: "By completing your purchase, you agree to our",
      id: "Dengan menyelesaikan pembelian, Anda menyetujui",
    },
    and: { en: "and", id: "dan" },
    secureLine: {
      en: "Secure payment powered by 256-bit SSL encryption",
      id: "Pembayaran aman dengan enkripsi SSL 256-bit",
    },

    // modal active product
    youAlreadyHave: {
      en: "You already have this product",
      id: "Anda sudah memiliki produk ini",
    },
    alreadyHaveDesc: {
      en: "You already have an active subscription for",
      id: "Anda sudah memiliki langganan aktif untuk",
    },
    currentPackage: { en: "Current package", id: "Paket saat ini" },
    endDate: { en: "End date", id: "Tanggal berakhir" },
    notAllowedNew: {
      en: "System does not allow new purchase for the same product. Choose Renew to extend duration, or Upgrade to change package.",
      id: "Sistem tidak mengizinkan pembelian baru untuk produk yang sama. Pilih Perpanjang untuk menambah durasi, atau Upgrade untuk ganti paket.",
    },
    cancel: { en: "Cancel", id: "Batal" },
    renew: { en: "Renew", id: "Perpanjang" },
    upgrade: { en: "Upgrade", id: "Upgrade" },

    // set initial password
    setPwTitle: {
      en: "Set Password for Your Account",
      id: "Setel Password untuk Akun Anda",
    },
    setPwDesc: {
      en: "Your account was created automatically. Set a password to login permanently. You can also use the 6-digit code sent to your email.",
      id: "Akun Anda dibuat otomatis. Setel password agar bisa login permanen. Anda juga dapat menggunakan kode 6 digit yang dikirim ke email.",
    },
    newPw: { en: "New password", id: "Password baru" },
    confirmPw: { en: "Confirm password", id: "Konfirmasi password" },
    saving: { en: "Saving...", id: "Menyimpan..." },
    savePw: { en: "Save Password", id: "Simpan Password" },
    close: { en: "Close", id: "Tutup" },
    pwTooShort: {
      en: "Password must be at least 8 characters",
      id: "Password minimal 8 karakter",
    },
    pwNotMatch: {
      en: "Password confirmation does not match",
      id: "Konfirmasi password tidak cocok",
    },

    // action / errors
    mustPickPPP: {
      en: "Please choose product, package, and duration first.",
      id: "Silakan pilih produk, paket, dan durasi terlebih dahulu.",
    },
    invalidDuration: { en: "Invalid duration.", id: "Durasi tidak valid." },
    emailRequired: { en: "Email is required", id: "Email wajib diisi" },
    cannotBuy: {
      en: "Cannot purchase",
      id: "Tidak bisa membeli",
    },
    cannotBuyDesc: {
      en: "This email already has an active subscription for the product. Please login.",
      id: "Email ini sudah memiliki langganan aktif untuk produk tersebut. Silakan login.",
    },
    activeCheckFailed: {
      en: "Failed to check active subscription. Please try again.",
      id: "Gagal memeriksa langganan aktif. Silakan coba lagi.",
    },
    accountCreated: {
      en: "Account created. You are temporarily signed in. After successful payment, please set your password.",
      id: "Akun dibuat. Anda masuk sementara. Setelah pembayaran berhasil, silakan set password.",
    },
    emailExists: {
      en: "Email already registered",
      id: "Email sudah terdaftar",
    },
    emailExistsDesc: {
      en: "The email you entered is already registered. Please login.",
      id: "Email yang Anda masukkan sudah terdaftar. Silakan login.",
    },
    failedOrder: { en: "Failed Order", id: "Gagal Membuat Pesanan" },
  } as const;

  const t = <K extends keyof typeof T>(k: K) => T[k][lang];
  return { t, lang };
}

/* ============================================================================
   HELPERS
============================================================================ */
function normalizeCustomerToContact(u: any) {
  return {
    fullName: u?.full_name ?? "",
    email: u?.email ?? "",
    phone: u?.phone ?? "",
    company: u?.company ?? "",
  };
}
function resolveDurationCode(detail: ProductDetail | null, months: number) {
  const hit = detail?.durations?.find(
    (d) => Number(d.length) === Number(months)
  );
  return hit?.code || ""; // "M1" | "M6" | "M12"
}
// function buildPriceMap(detail: ProductDetail) {
//   const sortedDurations = [...(detail.durations || [])].sort(
//     (a, b) => a.length - b.length
//   );
//   const map: Record<string, Record<number, number>> = {};
//   for (const pkg of detail.packages || []) {
//     const sortedPrices = [...(pkg.pricelist || [])]
//       .map((pl) => ({ raw: pl, priceNum: Number.parseFloat(pl.price) }))
//       .sort((a, b) => a.priceNum - b.priceNum);
//     const m: Record<number, number> = {};
//     for (let i = 0; i < sortedDurations.length; i++) {
//       const d = sortedDurations[i];
//       const priceEntry = sortedPrices[i];
//       if (d && priceEntry) m[d.length] = priceEntry.priceNum;
//     }
//     map[pkg.package_code] = m;
//   }
//   return map;
// }

// Durasi -> label sesuai bahasa UI

function buildPriceMap(detail: ProductDetail) {
  // map: package_code => { [durationMonths]: { price, discount } }
  const map: Record<
    string,
    Record<number, { price: number; discount: number }>
  > = {};

  // buat map id -> length jika durations punya id
  const durationsById = new Map<string | number, number>();
  for (const d of detail.durations || []) {
    if ((d as any).id != null)
      durationsById.set(String((d as any).id), d.length);
  }

  for (const pkg of detail.packages || []) {
    const m: Record<number, { price: number; discount: number }> = {};

    // isi dari pricelist
    for (const pl of pkg.pricelist || []) {
      const priceNum = Number.parseFloat(pl.price) || 0;
      const discountNum = Number.parseFloat(pl.discount) || 0;

      // coba cocokkan duration via duration_id (paling akurat)
      let durLen: number | undefined = undefined;
      if (pl.duration_id != null && durationsById.has(String(pl.duration_id))) {
        durLen = durationsById.get(String(pl.duration_id));
      }

      // fallback: coba cocokan duration_code ke salah satu duration.code
      if (durLen == null && pl.duration_code != null) {
        const found = (detail.durations || []).find(
          (d) =>
            String(d.code) === String(pl.duration_code) ||
            String(d.length) === String(pl.duration_code)
        );
        if (found) durLen = found.length;
      }

      // fallback terakhir: isi first-unfilled duration
      if (durLen == null) {
        const unfilled = (detail.durations || [])
          .map((d) => d.length)
          .find((L) => m[L] == null);
        durLen = unfilled;
      }

      if (durLen != null) {
        m[durLen] = {
          price: Math.round(priceNum),
          discount: Math.round(discountNum),
        };
      }
    }

    map[pkg.package_code] = m;
  }

  return map;
}

function durationLabel(months: number, lang: "id" | "en") {
  if (lang === "id") return months === 1 ? "1 Bulan" : `${months} Bulan`;
  return months === 1 ? "1 Month" : `${months} Months`;
}

/* ============================================================================
   AUTO TRANSLATE HOOK (paksa translate saat lang === "id" & tidak ada *_en)
   Memakai endpoint /api/translate-batch (proxy ke Laravel).
============================================================================ */
function useAutoTranslate(
  text: string | undefined,
  lang: "id" | "en",
  force: boolean = false,
  from: "en" | "id" = "en",
  to: "en" | "id" = "id"
) {
  const [out, setOut] = useState<string>(text || "");
  const src = text || "";

  useEffect(() => {
    if (!src) return setOut("");

    // Jika target EN & tidak dipaksa, pakai teks asli
    if (lang === "en" && !force && to === "id") {
      setOut(src);
      return;
    }

    // Kalau tidak force, hemat request dengan heuristik sederhana
    const looksEnglish =
      /^[\x00-\x7F\s.,;:'"()\-/%&!?0-9]+$/.test(src) &&
      /\b(the|and|for|with|application|water|meter|monitoring)\b/i.test(src);

    const shouldTranslate =
      (lang === "id" && (force || looksEnglish)) ||
      (lang === "en" && to === "en" && force);

    if (!shouldTranslate) {
      setOut(src);
      return;
    }

    let aborted = false;
    (async () => {
      try {
        const res = await fetch("/api/translate-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts: [src], from, to }),
        });
        const json = await res.json();
        const translated =
          json?.data?.[0] ??
          json?.result?.[0] ??
          json?.translations?.[0] ??
          src;
        if (!aborted) setOut(String(translated));
      } catch (e) {
        console.warn("translate-batch failed, fallback to original:", e);
        if (!aborted) setOut(src);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [src, lang, force, from, to]);

  return out;
}

/* ============================================================================
   SUB-COMPONENTS: ContactInformation
============================================================================ */
function ContactInformation({
  data,
  onChange,
  isLoggedIn,
  onGoogleSuccess,
  t,
  lang,
}: {
  data: CheckoutData["contact"];
  onChange: (data: CheckoutData["contact"]) => void;
  isLoggedIn: boolean;
  onGoogleSuccess: (cred: any) => void;
  t: ReturnType<typeof makeT>["t"];
  lang: "id" | "en";
}) {
  const handleChange = (field: keyof CheckoutData["contact"], value: string) =>
    onChange({ ...data, [field]: value });

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length >= 8 && cleaned.length <= 15;
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <User className="h-5 w-5 text-indigo-500" />
          {t("contactInfo")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">
              {t("fullName")} <span className="text-red-600">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="fullName"
                placeholder={t("fullNamePH")}
                value={data.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              {t("email")} <span className="text-red-600">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder={t("emailPH")}
                value={data.email}
                onChange={(e) => handleChange("email", e.target.value)}
                readOnly={isLoggedIn}
                className={`pl-10 ${
                  data.email && !validateEmail(data.email)
                    ? "border-red-300"
                    : ""
                }`}
                required
              />
            </div>
            {data.email && !validateEmail(data.email) && (
              <p className="text-sm text-red-600">{t("emailInvalid")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              {t("phone")} <span className="text-red-600">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                placeholder={t("phonePH")}
                value={data.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className={`pl-10 ${
                  data.phone && !validatePhone(data.phone)
                    ? "border-red-300"
                    : ""
                }`}
                required
              />
            </div>
            {data.phone && !validatePhone(data.phone) && (
              <p className="text-sm text-red-600">{t("phoneInvalid")}</p>
            )}
          </div>
        </div>

        {!isLoggedIn && (
          <div className="flex justify-center">
            {/* Wrapper tombol Google agar label bisa ditranslate tanpa nabrak */}
            <div className="relative w-[260px] h-[40px]">
              {/* Tombol asli */}
              <div className="absolute inset-0">
                <GoogleLogin
                  key={lang}
                  locale={lang}
                  onSuccess={onGoogleSuccess}
                  onError={() =>
                    toast({ variant: "destructive", title: t("googleFailed") })
                  }
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="pill"
                />
              </div>

              {/* Mask putih menutup teks default Google, ikon kiri tetap tampil */}
              <div
                className="pointer-events-none absolute top-0 bottom-0 right-0 rounded-full mt-1 bg-white h-8 mr-2"
                style={{ left: 44, zIndex: 2 }}
              />

              {/* Label terjemahan di atas mask */}
              <span
                className="pointer-events-none absolute inset-0 flex items-center justify-center text-[13px] font-medium text-[#1f1f1f]"
                style={{ zIndex: 3, paddingLeft: 8, paddingRight: 12 }}
              >
                {t("continueWithGoogle")}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ============================================================================
   SUB-COMPONENTS: PlanDuration
============================================================================ */
function PlanDuration({
  data,
  products,
  productDetail,
  priceMap,
  loading,
  onChange,
  onChangeProduct,
  onChangePackage,
  t,
  lang,
}: {
  data: CheckoutData["plan"];
  products: ProductRow[];
  productDetail: ProductDetail | null;
  priceMap: PriceMap;
  loading: { products: boolean; detail: boolean };
  onChange: (plan: CheckoutData["plan"]) => void;
  onChangeProduct: (productCode: string) => void;
  onChangePackage: (packageCode: string) => void;
  t: ReturnType<typeof makeT>["t"];
  lang: "id" | "en";
}) {
  const set = (patch: Partial<CheckoutData["plan"]>) =>
    onChange({ ...data, ...patch });

  const durations = useMemo(
    () =>
      (productDetail?.durations ?? [])
        .slice()
        .sort((a, b) => a.length - b.length),
    [productDetail]
  );

  const selectedProduct = products.find((p) => p.product_code === data.product);
  const selectedProductName =
    selectedProduct?.product_name ??
    productDetail?.product?.product_name ??
    data.product;

  // sumber deskripsi: ambil *_en bila lang EN; ambil ID kalau ID; kalau EN kosong → fallback nanti
  const rawProductDesc =
    lang === "en"
      ? productDetail?.product?.description_en ??
        selectedProduct?.description_en ??
        productDetail?.product?.description ??
        selectedProduct?.description
      : productDetail?.product?.description ??
        selectedProduct?.description ??
        productDetail?.product?.description_en ??
        selectedProduct?.description_en;

  const hasDescEn = Boolean(
    productDetail?.product?.description_en || selectedProduct?.description_en
  );

  // Paksa translate → ID jika lang === "id" dan *_en memang tidak ada
  const productDesc = useAutoTranslate(
    rawProductDesc,
    lang,
    lang === "id" && !hasDescEn,
    "en",
    "id"
  );

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <Calendar className="h-5 w-5 text-indigo-500" />
          {t("planDuration")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-8">
        {/* Product */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-900">
            {t("product")}
          </Label>
          {!data.product ? (
            <Select
              value={data.product}
              onValueChange={(value) => onChangeProduct(value)}
            >
              <SelectTrigger className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 h-10">
                <SelectValue
                  placeholder={
                    loading.products
                      ? t("loadingProductsPH")
                      : t("selectProductPH")
                  }
                />
              </SelectTrigger>
              <SelectContent className="min-w-[400px]">
                {products.map((p) => (
                  <SelectItem
                    key={p.product_code}
                    value={p.product_code}
                    className="py-4 px-4"
                  >
                    <div className="py-2 px-1">
                      <div className="font-medium text-base">
                        {p.product_name}
                      </div>
                      {!!(lang === "en" ? p.description_en : p.description) && (
                        <div className="text-sm text-gray-500 mt-2 leading-relaxed">
                          {lang === "en" ? p.description_en : p.description}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="font-bold text-lg text-gray-900">
                {selectedProductName}
              </div>
              {/* {!!productDesc && (
                <div className="text-sm text-gray-600 mt-1">{productDesc}</div>
              )} */}
            </div>
          )}
        </div>

        {/* Package */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-900">
            {t("package")}
          </Label>
          <Select
            value={data.package}
            onValueChange={(value) => onChangePackage(value)}
            disabled={!data.product || loading.detail}
          >
            <SelectTrigger className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 h-10">
              <SelectValue
                placeholder={
                  !data.product
                    ? t("chooseProductFirst")
                    : loading.detail
                    ? t("loadingPackagesPH")
                    : t("selectPackagePH")
                }
              />
            </SelectTrigger>
            <SelectContent className="min-w-[350px]">
              {(productDetail?.packages ?? []).map((pkg) => {
                const label =
                  lang === "en"
                    ? pkg.name_en ?? pkg.name
                    : pkg.name ?? pkg.name_en;
                return (
                  <SelectItem
                    key={pkg.package_code}
                    value={pkg.package_code}
                    className="py-4 px-4"
                  >
                    <div className="flex items-center justify-between gap-3 py-2 px-1 w-full">
                      <div className="flex-1">
                        <div className="font-medium text-base">{label}</div>
                      </div>
                      {pkg.status === "active" && (
                        <Badge className="bg-indigo-100 text-indigo-800 ml-2">
                          {t("active")}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {!!data.package && (
            <p className="text-xs text-gray-500">
              {(() => {
                const hit = productDetail?.packages?.find(
                  (p) => p.package_code === data.package
                );
                if (!hit) return "";
                return lang === "en"
                  ? hit.description_en ?? hit.description ?? ""
                  : hit.description ?? hit.description_en ?? "";
              })()}
            </p>
          )}
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-900">
            {t("duration")}
          </Label>
          <div className="flex-col gap-5 flex-wrap">
            {durations.map((d) => {
              const active = data.duration === d.length;
              const disabled =
                !data.package ||
                !(priceMap[data.package]?.[d.length]?.price > 0);
              return (
                <Button
                  key={d.code}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  disabled={disabled}
                  onClick={() => set({ duration: d.length })}
                  className={`flex-1 m-1 min-w-[96px] h-10 rounded-full ${
                    active
                      ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {durationLabel(d.length, lang)}
                  {!!priceMap[data.package]?.[d.length] && (
                    <span className="ml-2 text-xs opacity-80">
                      <span className="line-through mr-1 text-xs opacity-60">
                        Rp{" "}
                        {(
                          priceMap[data.package][d.length].price || 0
                        ).toLocaleString("id-ID")}
                      </span>
                      Rp{" "}
                      {(
                        (priceMap[data.package][d.length].price || 0) -
                        (priceMap[data.package][d.length].discount || 0)
                      ).toLocaleString("id-ID")}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================================
   SUB-COMPONENTS: VoucherCode
============================================================================ */
// function VoucherCode({
//   data,
//   onChange,
//   t,
// }: {
//   data: CheckoutData["voucher"];
//   onChange: (data: CheckoutData["voucher"]) => void;
//   t: ReturnType<typeof makeT>["t"];
// }) {
//   const [inputCode, setInputCode] = useState(data.code);
//   const [isApplying, setIsApplying] = useState(false);
//   const [error, setError] = useState("");

//   const handleApplyVoucher = async () => {
//     if (!inputCode.trim()) return;
//     setIsApplying(true);
//     setError("");
//     await new Promise((r) => setTimeout(r, 500));
//     onChange({ code: inputCode.toUpperCase(), discount: 0 });
//     setIsApplying(false);
//   };

//   const handleRemoveVoucher = () => {
//     setInputCode("");
//     onChange({ code: "", discount: 0 });
//     setError("");
//   };

//   return (
//     <Card className="bg-white shadow-sm border border-gray-200">
//       <CardHeader className="pb-4">
//         <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
//           <Ticket className="h-5 w-5 text-indigo-500" />
//           {t("voucherTitle")}
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         {!data.code ? (
//           <div className="space-y-4">
//             <div className="flex gap-2">
//               <Input
//                 placeholder={t("voucherPH")}
//                 value={inputCode}
//                 onChange={(e) => setInputCode(e.target.value.toUpperCase())}
//                 onKeyDown={(e) => e.key === "Enter" && handleApplyVoucher()}
//               />
//               <Button
//                 onClick={handleApplyVoucher}
//                 disabled={!inputCode.trim() || isApplying}
//                 className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
//               >
//                 {isApplying ? t("applying") : t("apply")}
//               </Button>
//             </div>
//             {error && (
//               <div className="flex items-center gap-2 text-red-600 text-sm">
//                 <X className="h-4 w-4" />
//                 {error}
//               </div>
//             )}
//           </div>
//         ) : (
//           <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
//             <div className="flex items-center gap-3">
//               <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
//                 <Check className="h-4 w-4 text-green-600" />
//               </div>
//               <div>
//                 <div className="flex items-center gap-2">
//                   <span className="font-medium text-green-900">
//                     {data.code}
//                   </span>
//                   <Badge className="bg-green-100 text-green-800 border-green-200">
//                     {t("applied")}
//                   </Badge>
//                 </div>
//                 <p className="text-xs text-green-700">
//                   {t("voucherAppliedNote")}
//                 </p>
//               </div>
//             </div>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={handleRemoveVoucher}
//               className="text-green-700 hover:text-green-900 hover:bg-green-100"
//             >
//               {t("remove")}
//             </Button>
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

/* ============================================================================
   SUB-COMPONENTS: OrderSummary
============================================================================ */
function OrderSummary({
  checkoutData,
  productDetail,
  priceMap,
  isValid,
  isLoading,
  onPlaceOrder,
  t,
  lang,
}: {
  checkoutData: CheckoutData;
  productDetail: ProductDetail | null;
  priceMap: PriceMap;
  isValid: boolean;
  isLoading: boolean;
  onPlaceOrder: () => void;
  t: ReturnType<typeof makeT>["t"];
  lang: "id" | "en";
}) {
  const plan = checkoutData.plan;
  // const taxable = Math.max(
  //   0,
  //   (priceMap[plan.package]?.[plan.duration] ?? 0) -
  //     (checkoutData.voucher.discount || 0)
  // );
  const priceEntry = priceMap[plan.package]?.[plan.duration] ?? {
    price: 0,
    discount: 0,
  };
  const basePrice = Math.max(0, priceEntry.price || 0); // harga asli
  const packageDiscount = Math.max(0, priceEntry.discount || 0); // diskon paket dari pricelist
  
  // final price setelah diskon paket (tidak pakai voucher, tidak pakai pajak)
  const finalPrice = Math.max(0, basePrice - packageDiscount);
  
  const taxable = Math.max(0, (basePrice) - (checkoutData.voucher.discount || 0));
  
  const productName = productDetail?.product?.product_name ?? plan.product;

  const formatPrice = (price: number) =>
    plan.currency === "IDR"
      ? `IDR ${price.toLocaleString("id-ID")}`
      : `$${(price / 15000).toFixed(2)}`;

  const getDurationLabel = (m: number) => durationLabel(m, lang);

  const getPackageLabel = (pkg: string) => {
    const hit = productDetail?.packages?.find((p) => p.package_code === pkg);
    if (!hit) return pkg.charAt(0).toUpperCase() + pkg.slice(1);
    return lang === "en" ? hit.name_en ?? hit.name : hit.name ?? hit.name_en;
  };

  // Raw desc & status *_en, lalu paksa translate ke ID bila *_en tidak ada
  const rawDesc =
    lang === "en"
      ? productDetail?.product?.description_en ??
        productDetail?.product?.description
      : productDetail?.product?.description ??
        productDetail?.product?.description_en;

  const hasDescEn2 = Boolean(productDetail?.product?.description_en);

  const productDesc = useAutoTranslate(
    rawDesc,
    lang,
    lang === "id" && !hasDescEn2,
    "en",
    "id"
  );

  return (
    <Card className="bg-white shadow-sm border border-gray-200 sticky top-8 rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <ShoppingCart className="h-5 w-5 text-indigo-500" />
          {t("orderSummary")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!!productName && (
          <div className="space-y-3">
            <div className="mb-3">
              <h3 className="font-bold text-base text-gray-900">
                {productName}
              </h3>
              {/* {!!productDesc && (
                <p className="text-sm text-gray-600 mt-1">{productDesc}</p>
              )} */}
            </div>
            <div className="flex items-center gap-2">
              {!!plan.package && (
                <Badge className="bg-gray-100 text-gray-800 text-sm rounded-full px-3 py-1">
                  {getPackageLabel(plan.package)}
                </Badge>
              )}
              {!!plan.duration && (
                <Badge className="bg-gray-100 text-gray-800 text-sm rounded-full px-3 py-1">
                  {getDurationLabel(plan.duration)}
                </Badge>
              )}
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t("subtotal")}</span>
            <span className="font-medium text-gray-600">
              {formatPrice(basePrice)}
            </span>
          </div>

          {!!packageDiscount && (
            <div className="flex justify-between text-sm text-green-600">
              <span>{t("discount")}</span>
              <span>{formatPrice(packageDiscount)}</span>
            </div>
          )}

          {/* {plan.taxMode === "exclusive" && !!tax && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t("tax")}</span>
              <span className="font-medium text-gray-600">
                {formatPrice(tax)}
              </span>
            </div>
          )} */}

          {/* {plan.taxMode === "inclusive" && (
            <div className="text-xs text-gray-500">{t("taxIncluded")}</div>
          )} */}

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span className="text-gray-900">{t("total")}</span>
            <span className="bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">
              {formatPrice(finalPrice)}
            </span>
          </div>
        </div>

        <Button
          onClick={onPlaceOrder}
          disabled={!isValid || isLoading}
          className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-4 shadow-lg font-bold text-white"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("processing")}
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              {t("placeOrder")}
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          {t("agree1")}{" "}
          <a href="/terms" className="text-indigo-600 hover:underline">
            {t("terms")}
          </a>{" "}
          {t("and")}{" "}
          <a href="/privacy" className="text-indigo-600 hover:underline">
            {t("privacy")}
          </a>
          .
        </p>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Shield className="h-3 w-3" />
          <span>{t("secureLine")}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================================
   SUB-COMPONENTS: ActiveProductModal
============================================================================ */
function ActiveProductModal({
  open,
  onOpenChange,
  info,
  t,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  info: {
    product_code?: string;
    package_name?: string | null;
    package_code?: string | null;
    end_date?: string | null;
    existing_order_id?: string | null;
  } | null;
  t: ReturnType<typeof makeT>["t"];
}) {
  const router = useRouter();
  if (!info) return null;

  const handleRenew = () => router.push("/my-account");
  const handleUpgrade = () => router.push("/my-account");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-500" /> {t("youAlreadyHave")}
          </DialogTitle>
          <DialogDescription>
            {t("alreadyHaveDesc")} <strong>{info.product_code}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-sm text-gray-600">{t("currentPackage")}</div>
            <div className="font-medium text-gray-900">
              {info.package_name ?? info.package_code ?? "-"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {t("endDate")}: {info.end_date ?? "—"}
            </div>
          </div>

          <p className="text-sm text-gray-700">{t("notAllowedNew")}</p>
        </div>

        <DialogFooter className="mt-6 flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleRenew}
            className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
          >
            {t("renew")}
          </Button>
          <Button onClick={handleUpgrade} variant="outline">
            {t("upgrade")}
          </Button>
        </DialogFooter>

        <DialogClose className="sr-only" />
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================================ 
   SUB-COMPONENTS: SetInitialPasswordModal (light)
============================================================================ */
function SetInitialPasswordModal({
  open,
  onOpenChange,
  t,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  t: ReturnType<typeof makeT>["t"];
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSet = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast({ variant: "destructive", title: t("pwTooShort") });
      return;
    }
    if (newPassword !== confirm) {
      toast({ variant: "destructive", title: t("pwNotMatch") });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("customer/set-initial-password", {
        new_password: newPassword,
      });
      if (res?.data?.success) {
        toast({ title: t("savePw") });
        onOpenChange(false);
      } else {
        toast({
          variant: "destructive",
          title: res?.data?.message || "Error",
        });
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: e?.response?.data?.message || e?.message || "Error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("setPwTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">{t("setPwDesc")}</p>
          <Input
            placeholder={t("newPw")}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            placeholder={t("confirmPw")}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
          <Button onClick={handleSet} disabled={loading}>
            {loading ? t("saving") : t("savePw")}
          </Button>
        </DialogFooter>
        <DialogClose className="sr-only" />
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================================
   MAIN CLIENT COMPONENT
============================================================================ */
export default function CheckoutContent() {
  const { lang } = useLanguage();
  const { t } = makeT(lang as any);

  const searchParams = useSearchParams();
  const router = useRouter();

  const initialProduct = searchParams.get("product") || "";
  const initialPackage = searchParams.get("package") || "";
  const initialDuration = Number.parseInt(searchParams.get("duration") || "0");

  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    contact: { fullName: "", email: "", phone: "", company: "" },
    plan: {
      product: initialProduct,
      package: initialPackage || "",
      duration: initialDuration || 0,
      currency: "IDR",
      taxMode: "inclusive",
    },
    payment: { method: "card" },
    voucher: { code: "", discount: 0 },
  });

  // auth
  const [customerAuthenticated, setCustomerAuthenticated] = useState(false);
  const isLoggedIn = customerAuthenticated;

  // cookie flag
  const setAuthCookie = (persistent = true) => {
    const parts = ["customer_auth=1", "Path=/", "SameSite=Lax"];
    if (persistent) parts.push("Max-Age=2592000");
    document.cookie = parts.join("; ");
  };

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(
    null
  );
  const [priceMap, setPriceMap] = useState<PriceMap>({});
  const [loading, setLoading] = useState({ products: false, detail: false });
  const [isValid, setIsValid] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);

  const [showActiveModal, setShowActiveModal] = useState(false);
  const [activeProductInfo, setActiveProductInfo] = useState<{
    product_code?: string;
    package_name?: string | null;
    package_code?: string | null;
    end_date?: string | null;
    existing_order_id?: string | null;
  } | null>(null);

  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);

  useEffect(() => {
    const { contact, plan, payment } = checkoutData;
    const contactValid = !!(contact.fullName && contact.email && contact.phone);
    const planValid = !!(plan.product && plan.package && plan.duration);
    const paymentValid = !!payment.method;
    setIsValid(Boolean(contactValid && planValid && paymentValid));
  }, [checkoutData]);

  // Prefill profil
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await getCustomerMe();
        if (!mounted || !me) return;
        const contact = normalizeCustomerToContact(me);
        setCheckoutData((prev) => ({
          ...prev,
          contact: { ...prev.contact, ...contact },
        }));
        setCustomerAuthenticated(true);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load products
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading((s) => ({ ...s, products: true }));
      try {
        const rows = await fetchProducts();
        if (!mounted) return;
        const normalized: ProductRow[] = (rows || []).map((r: any) => ({
          product_code: r?.product_code ?? r?.code ?? r?.slug ?? "",
          product_name: r?.product_name ?? r?.name ?? "",
          description: r?.description ?? r?.short_description ?? "",
          description_en:
            r?.description_en ?? r?.short_description_en ?? undefined,
        }));
        setProducts(normalized);
      } finally {
        if (mounted) setLoading((s) => ({ ...s, products: false }));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load product detail saat product berubah
  useEffect(() => {
    let mounted = true;
    const prod = checkoutData.plan.product;
    if (!prod) {
      setProductDetail(null);
      setPriceMap({});
      setCheckoutData((prev) => ({
        ...prev,
        plan: { ...prev.plan, package: "", duration: 0 },
      }));
      return;
    }
    (async () => {
      setLoading((s) => ({ ...s, detail: true }));
      try {
        const data = await fetchProductDetail(prod);
        if (!mounted) return;

        const detail: ProductDetail = {
          product: {
            product_code: data?.product?.product_code ?? prod,
            product_name: data?.product?.product_name ?? prod,
            description_en: data?.product?.description_en,
            description: data?.product?.description ?? "",
            status: data?.product?.status,
          },
          packages: (data?.packages ?? []).map((p: any) => ({
            package_code: p?.package_code,
            name: p?.name,
            name_en: p?.name_en,
            description: p?.description,
            description_en: p?.description_en,
            status: p?.status,
            order_number: p?.order_number,
            pricelist: p?.pricelist ?? [],
          })),
          durations: (data?.durations ?? []).map((d: any) => ({
            id: d?.id,
            code: d?.code,
            name: d?.name,
            length: Number(d?.length),
            unit: d?.unit,
            is_default: Boolean(d?.is_default),
          })),
        };

        setProductDetail(detail);
        setPriceMap(buildPriceMap(detail));

        const pkgOk = detail.packages?.some(
          (x) => x.package_code === checkoutData.plan.package
        );
        const durOk = detail.durations?.some(
          (d) => d.length === checkoutData.plan.duration
        );

        setCheckoutData((prev) => ({
          ...prev,
          plan: {
            ...prev.plan,
            package: pkgOk ? prev.plan.package : "",
            duration: durOk
              ? prev.plan.duration
              : detail.durations[0]?.length ?? 0,
          },
        }));
      } catch {
        setProductDetail(null);
        setPriceMap({});
      } finally {
        if (mounted) setLoading((s) => ({ ...s, detail: false }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutData.plan.product]);

  const onChangePlan = (plan: CheckoutData["plan"]) =>
    setCheckoutData((prev) => ({ ...prev, plan }));

  // Google login
  const handleGoogleSuccess = async (cred: any) => {
    try {
      const idToken = cred?.credential;
      if (!idToken) throw new Error("No Google credential");
      await loginWithGoogle(idToken);
      setAuthCookie(true);
      const me = await getCustomerMe();
      const contactFromProfile = normalizeCustomerToContact(me);
      setCheckoutData((prev) => ({
        ...prev,
        contact: { ...prev.contact, ...contactFromProfile },
      }));
      setCustomerAuthenticated(true);
      toast({ title: "Signed in with Google" });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: makeT(lang).t("googleFailed"),
        description: e?.message || "",
      });
    }
  };

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    try {
      const { product, package: pkg, duration } = checkoutData.plan;
      if (!product || !pkg || !duration) {
        throw new Error(makeT(lang).t("mustPickPPP"));
      }

      const duration_code = resolveDurationCode(productDetail, duration);
      if (!duration_code) throw new Error(makeT(lang).t("invalidDuration"));

      try {
        if (!customerAuthenticated) {
          const guestEmail = checkoutData.contact.email?.trim();
          if (!guestEmail) {
            toast({
              variant: "destructive",
              title: makeT(lang).t("emailRequired"),
            });
            setIsPlacing(false);
            return;
          }
          const check = await checkProduct(product, guestEmail);
          if (check?.has_active) {
            toast({
              variant: "destructive",
              title: makeT(lang).t("cannotBuy"),
              description: makeT(lang).t("cannotBuyDesc"),
            });
            setIsPlacing(false);
            return;
          }
        } else {
          const check = await checkProduct(product);
          if (check?.has_active) {
            setActiveProductInfo({
              product_code: product,
              package_name: check.package_name ?? undefined,
              package_code: check.package_code ?? undefined,
              end_date: check.end_date ?? undefined,
              existing_order_id: check.existing_order_id ?? undefined,
            });
            setShowActiveModal(true);
            setIsPlacing(false);
            return;
          }
        }
      } catch (e) {
        console.error("checkProduct failed", e);
        toast({ title: makeT(lang).t("activeCheckFailed") });
        setIsPlacing(false);
        return;
      }

      const payload: any = {
        product_code: product,
        package_code: pkg,
        duration_code,
        payment: checkoutData.payment,
        voucher: checkoutData.voucher,
      };
      if (!customerAuthenticated) {
        payload.contact = checkoutData.contact;
      }

      const resp: any = await createPurchaseOrder(payload);

      if (resp?.email_already_exists) {
        toast({
          variant: "destructive",
          title: makeT(lang).t("emailExists"),
          description: makeT(lang).t("emailExistsDesc"),
        });
        setIsPlacing(false);
        return;
      }

      if (resp?.account_created || resp?.access_token) {
        try {
          const me = await getCustomerMe();
          if (me) {
            setCheckoutData((prev) => ({
              ...prev,
              contact: { ...prev.contact, ...normalizeCustomerToContact(me) },
            }));
            setCustomerAuthenticated(true);
            setAuthCookie(true);
          }
        } catch {}
        toast({ title: makeT(lang).t("accountCreated") });
      }

      const orderId = resp?.order_id ?? null;

      // --- hanya simpan flag kalau guest dan backend BELOM memberikan akun => auto-created OR access_token returned ---
      if (!customerAuthenticated && orderId) {
        const autoCreated = Boolean(
          resp?.account_created || resp?.access_token
        );
        if (autoCreated) {
          try {
            localStorage.setItem(`agile:setpw:order:${orderId}:auto`, "1"); // INDICATOR: auto-create
            localStorage.setItem(
              `agile:setpw:order:${orderId}:email`,
              checkoutData.contact.email ?? ""
            );
            localStorage.setItem(
              `agile:setpw:order:${orderId}:ts`,
              String(Date.now())
            );
          } catch (e) {
            console.warn("setpw localStorage failed", e);
          }
        } else {
          // bersihkan kemungkinan flag lama untuk order yg sama
          try {
            localStorage.removeItem(`agile:setpw:order:${orderId}`);
            localStorage.removeItem(`agile:setpw:order:${orderId}:auto`);
            localStorage.removeItem(`agile:setpw:order:${orderId}:email`);
            localStorage.removeItem(`agile:setpw:order:${orderId}:ts`);
          } catch {}
        }
      }

      const snapToken = resp?.snap_token;
      if (snapToken) {
        await ensureSnap();
        openSnap(snapToken, orderId);
      } else if (orderId) {
        router.push(`/orders/${orderId}`);
      } else {
        throw new Error(makeT(lang).t("failedOrder"));
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: err?.message || makeT(lang).t("failedOrder") });
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-gray-900 mb-4">
              {makeT(lang).t("pageTitle")}
            </h1>
            <p className="text-lg text-gray-600">
              {makeT(lang).t("pageSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              <ContactInformation
                data={checkoutData.contact}
                onChange={(contact) =>
                  setCheckoutData((prev) => ({ ...prev, contact }))
                }
                isLoggedIn={isLoggedIn}
                onGoogleSuccess={handleGoogleSuccess}
                t={makeT(lang).t}
                lang={lang as "id" | "en"}
              />

              <PlanDuration
                data={checkoutData.plan}
                products={products.map((r) => ({
                  product_code: r.product_code,
                  product_name: r.product_name,
                  description: r.description,
                  description_en: r.description_en,
                }))}
                productDetail={productDetail}
                priceMap={priceMap}
                loading={loading}
                onChange={(plan) =>
                  setCheckoutData((prev) => ({ ...prev, plan }))
                }
                onChangeProduct={(productCode) => {
                  setCheckoutData((prev) => ({
                    ...prev,
                    plan: {
                      ...prev.plan,
                      product: productCode,
                      package: "",
                      duration: 0,
                    },
                  }));
                }}
                onChangePackage={(packageCode) => {
                  const firstDur =
                    productDetail?.durations
                      ?.slice()
                      .sort((a, b) => a.length - b.length)[0]?.length ?? 0;
                  setCheckoutData((prev) => ({
                    ...prev,
                    plan: {
                      ...prev.plan,
                      package: packageCode,
                      duration: firstDur,
                    },
                  }));
                }}
                t={makeT(lang).t}
                lang={lang as "id" | "en"}
              />

              {/* <VoucherCode
                data={checkoutData.voucher}
                onChange={(voucher) =>
                  setCheckoutData((prev) => ({ ...prev, voucher }))
                }
                t={makeT(lang).t}
              /> */}
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <OrderSummary
                  checkoutData={checkoutData}
                  productDetail={productDetail}
                  priceMap={priceMap}
                  isValid={isValid}
                  isLoading={isPlacing}
                  onPlaceOrder={handlePlaceOrder}
                  t={makeT(lang).t}
                  lang={lang as "id" | "en"}
                />
              </div>
            </div>

            <ActiveProductModal
              open={showActiveModal}
              onOpenChange={(v) => {
                setShowActiveModal(v);
                if (!v) setActiveProductInfo(null);
              }}
              info={activeProductInfo}
              t={makeT(lang).t}
            />

            <SetInitialPasswordModal
              open={showSetPasswordModal}
              onOpenChange={setShowSetPasswordModal}
              t={makeT(lang).t}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
