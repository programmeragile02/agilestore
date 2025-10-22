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
  DollarSign,
  Settings,
} from "lucide-react";

import {
  fetchProducts,
  fetchProductDetail,
  getCustomerMe,
  createPurchaseOrder,
  loginWithGoogle,
  checkProduct,
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
} from "../ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";

/* ============================================================================
   TYPES
============================================================================ */
type ProductRow = {
  product_code: string;
  product_name: string;
  description?: string;
};

type ProductDetail = {
  product: {
    product_code: string;
    product_name: string;
    description?: string;
    status?: string;
  };
  packages: Array<{
    package_code: string;
    name: string;
    description?: string;
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
    code: string;
    name: string;
    length: number; // months
    unit: "month";
    is_default: boolean;
  }>;
};

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
function buildPriceMap(detail: ProductDetail) {
  const sortedDurations = [...(detail.durations || [])].sort(
    (a, b) => a.length - b.length
  );
  const map: Record<string, Record<number, number>> = {};
  for (const pkg of detail.packages || []) {
    const sortedPrices = [...(pkg.pricelist || [])]
      .map((pl) => ({ raw: pl, priceNum: Number.parseFloat(pl.price) }))
      .sort((a, b) => a.priceNum - b.priceNum);
    const m: Record<number, number> = {};
    for (let i = 0; i < sortedDurations.length; i++) {
      const d = sortedDurations[i];
      const priceEntry = sortedPrices[i];
      if (d && priceEntry) m[d.length] = priceEntry.priceNum;
    }
    map[pkg.package_code] = m;
  }
  return map;
}

/* ============================================================================
   SUB-COMPONENTS
============================================================================ */
function ContactInformation({
  data,
  onChange,
  isLoggedIn,
  onGoogleSuccess,
}: {
  data: CheckoutData["contact"];
  onChange: (data: CheckoutData["contact"]) => void;
  isLoggedIn: boolean;
  onGoogleSuccess: (cred: any) => void;
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
          Contact Information
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Form SELALU tampil */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Full Name<span className="text-red-600">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={data.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address<span className="text-red-600">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
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
              <p className="text-sm text-red-600">
                Please enter a valid email address
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone/WhatsApp<span className="text-red-600">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="+62 812 3456 7890"
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
              <p className="text-sm text-red-600">
                Phone number must be 8-15 digits
              </p>
            )}
          </div>
        </div>
        {/* Saat BELUM login, tampilkan tombol Google di atas form */}
        {!isLoggedIn && (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={() =>
                toast({
                  variant: "destructive",
                  title: "Google sign-in failed",
                })
              }
              useOneTap={false}
              theme="outline"
              size="large"
              text="continue_with"
              shape="pill"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlanDuration({
  data,
  products,
  productDetail,
  priceMap,
  loading,
  onChange,
  onChangeProduct,
  onChangePackage,
}: {
  data: CheckoutData["plan"];
  products: ProductRow[];
  productDetail: ProductDetail | null;
  priceMap: Record<string, Record<number, number>>;
  loading: { products: boolean; detail: boolean };
  onChange: (plan: CheckoutData["plan"]) => void;
  onChangeProduct: (productCode: string) => void;
  onChangePackage: (packageCode: string) => void;
}) {
  const set = (patch: Partial<CheckoutData["plan"]>) =>
    onChange({ ...data, ...patch });

  const packages = productDetail?.packages ?? [];
  const durations = useMemo(
    () =>
      (productDetail?.durations ?? [])
        .slice()
        .sort((a, b) => a.length - b.length),
    [productDetail]
  );

  const selectedProductName =
    products.find((p) => p.product_code === data.product)?.product_name ??
    productDetail?.product?.product_name ??
    data.product;

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <Calendar className="h-5 w-5 text-indigo-500" />
          Plan & Duration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-8">
        {/* Product */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-900">Product</Label>
          {!data.product ? (
            <Select
              value={data.product}
              onValueChange={(value) => onChangeProduct(value)}
            >
              <SelectTrigger className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 h-10">
                <SelectValue
                  placeholder={
                    loading.products
                      ? "Loading products..."
                      : "Select a product"
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
                      {!!p.description && (
                        <div className="text-sm text-gray-500 mt-2 leading-relaxed">
                          {p.description}
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
              <div className="text-sm text-gray-600 mt-1">
                {productDetail?.product?.description}
              </div>
            </div>
          )}
        </div>

        {/* Package */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-900">
            <span className="inline-flex items-center gap-2">Package</span>
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
                    ? "Pilih produk terlebih dahulu"
                    : loading.detail
                    ? "Loading packages..."
                    : "Select a package"
                }
              />
            </SelectTrigger>
            <SelectContent className="min-w-[350px]">
              {(productDetail?.packages ?? []).map((pkg) => (
                <SelectItem
                  key={pkg.package_code}
                  value={pkg.package_code}
                  className="py-4 px-4"
                >
                  <div className="flex items-center justify-between gap-3 py-2 px-1 w-full">
                    <div className="flex-1">
                      <div className="font-medium text-base">{pkg.name}</div>
                    </div>
                    {pkg.status === "active" && (
                      <Badge className="bg-indigo-100 text-indigo-800 ml-2">
                        Active
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!!data.package && (
            <p className="text-xs text-gray-500">
              {
                productDetail?.packages?.find(
                  (p) => p.package_code === data.package
                )?.description
              }
            </p>
          )}
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-900">
            Duration
          </Label>
          <div className="flex gap-2 flex-wrap">
            {durations.map((d) => {
              const active = data.duration === d.length;
              const disabled =
                !data.package || !(priceMap[data.package]?.[d.length] > 0);
              return (
                <Button
                  key={d.code}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  disabled={disabled}
                  onClick={() => set({ duration: d.length })}
                  className={`flex-1 min-w-[96px] h-10 rounded-full ${
                    active
                      ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {d.name}
                  {!!priceMap[data.package]?.[d.length] && (
                    <span className="ml-2 text-xs opacity-80">
                      Rp{" "}
                      {priceMap[data.package][d.length].toLocaleString("id-ID")}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Currency & Tax Mode */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900">
              Currency
            </Label>
            <Select
              value={data.currency}
              onValueChange={(value: "IDR" | "USD") =>
                onChange({ ...data, currency: value })
              }
            >
              <SelectTrigger className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 h-10 w-fit min-w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="min-w-[200px]">
                <SelectItem value="IDR" className="py-3 px-4">
                  <div className="flex items-center gap-3 py-1 px-1">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-base">IDR</span>
                  </div>
                </SelectItem>
                <SelectItem value="USD" className="py-3 px-4">
                  <div className="flex items-center gap-3 py-1 px-1">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-base">USD</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900">
              Tax Mode
            </Label>
            <Select
              value={data.taxMode}
              onValueChange={(value: "inclusive" | "exclusive") =>
                onChange({ ...data, taxMode: value })
              }
            >
              <SelectTrigger className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 h-10">
                <Settings className="h-4 w-4 text-gray-400 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="min-w-[180px]">
                <SelectItem value="inclusive" className="py-3 px-4">
                  <div className="flex items-center gap-3 py-1 px-1">
                    <Settings className="h-4 w-4 text-gray-400" />
                    <span className="text-base">Tax Inclusive</span>
                  </div>
                </SelectItem>
                <SelectItem value="exclusive" className="py-3 px-4">
                  <div className="flex items-center gap-3 py-1 px-1">
                    <Settings className="h-4 w-4 text-gray-400" />
                    <span className="text-base">Tax Exclusive</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VoucherCode({
  data,
  onChange,
}: {
  data: CheckoutData["voucher"];
  onChange: (data: CheckoutData["voucher"]) => void;
}) {
  const [inputCode, setInputCode] = useState(data.code);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState("");

  const handleApplyVoucher = async () => {
    if (!inputCode.trim()) return;
    setIsApplying(true);
    setError("");
    await new Promise((r) => setTimeout(r, 500));
    onChange({ code: inputCode.toUpperCase(), discount: 0 });
    setIsApplying(false);
  };

  const handleRemoveVoucher = () => {
    setInputCode("");
    onChange({ code: "", discount: 0 });
    setError("");
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <Ticket className="h-5 w-5 text-indigo-500" />
          Voucher / Promo Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!data.code ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter voucher code"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleApplyVoucher()}
              />
              <Button
                onClick={handleApplyVoucher}
                disabled={!inputCode.trim() || isApplying}
                className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
              >
                {isApplying ? "Applying..." : "Apply"}
              </Button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <X className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-green-900">
                    {data.code}
                  </span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Applied
                  </Badge>
                </div>
                <p className="text-xs text-green-700">
                  Voucher applied. Final price computed here (FE) sementara.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveVoucher}
              className="text-green-700 hover:text-green-900 hover:bg-green-100"
            >
              Remove
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OrderSummary({
  checkoutData,
  productDetail,
  priceMap,
  isValid,
  isLoading,
  onPlaceOrder,
}: {
  checkoutData: CheckoutData;
  productDetail: ProductDetail | null;
  priceMap: Record<string, Record<number, number>>;
  isValid: boolean;
  isLoading: boolean;
  onPlaceOrder: () => void;
}) {
  const plan = checkoutData.plan;
  const taxable = Math.max(
    0,
    (priceMap[plan.package]?.[plan.duration] ?? 0) -
      (checkoutData.voucher.discount || 0)
  ); // keep same calc style below
  const basePrice = priceMap[plan.package]?.[plan.duration] ?? 0;
  const discount = Math.max(0, checkoutData.voucher.discount || 0);
  const tax = plan.taxMode === "exclusive" ? Math.round(taxable * 0.11) : 0;
  const total = Math.max(0, taxable + tax);

  const productName = productDetail?.product?.product_name ?? plan.product;

  const formatPrice = (price: number) =>
    plan.currency === "IDR"
      ? `IDR ${price.toLocaleString("id-ID")}`
      : `$${(price / 15000).toFixed(2)}`;

  const getDurationLabel = (m: number) =>
    m === 1
      ? "1 Month"
      : m === 6
      ? "6 Months"
      : m === 12
      ? "12 Months"
      : `${m} Months`;

  const getPackageLabel = (pkg: string) =>
    productDetail?.packages.find((p) => p.package_code === pkg)?.name ??
    pkg.charAt(0).toUpperCase() + pkg.slice(1);

  return (
    <Card className="bg-white shadow-sm border border-gray-200 sticky top-8 rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <ShoppingCart className="h-5 w-5 text-indigo-500" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!!productName && (
          <div className="space-y-3">
            <div className="mb-3">
              <h3 className="font-bold text-base text-gray-900">
                {productName}
              </h3>
              {!!productDetail?.product?.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {productDetail.product.description}
                </p>
              )}
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
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-600">
              {formatPrice(basePrice)}
            </span>
          </div>

          {!!discount && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}

          {plan.taxMode === "exclusive" && !!tax && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (11%)</span>
              <span className="font-medium text-gray-600">
                {formatPrice(tax)}
              </span>
            </div>
          )}

          {plan.taxMode === "inclusive" && (
            <div className="text-xs text-gray-500">* Tax included in price</div>
          )}

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span className="text-gray-900">Total</span>
            <span className="bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">
              {formatPrice(total)}
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
              Processing...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Place Order • {formatPrice(total)}
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          By completing your purchase, you agree to our{" "}
          <a href="/terms" className="text-indigo-600 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-indigo-600 hover:underline">
            Privacy Policy
          </a>
          .
        </p>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Shield className="h-3 w-3" />
          <span>Secure payment powered by 256-bit SSL encryption</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveProductModal({
  open,
  onOpenChange,
  info,
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
}) {
  const router = useRouter();

  if (!info) return null;

  const handleRenew = () => {
    // const base = encodeURIComponent(String(info.existing_order_id ?? ""));
    // router.push(`/orders/renew?base_order_id=${base}`);
    router.push("/my-account");
  };
  const handleUpgrade = () => {
    // const base = encodeURIComponent(String(info.existing_order_id ?? ""));
    // router.push(`/orders/upgrade?base_order_id=${base}&product=${encodeURIComponent(info.product_code ?? "")}`);
    router.push("/my-account");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-500" /> You already have this
            product
          </DialogTitle>
          <DialogDescription>
            Anda sudah memiliki langganan aktif untuk{" "}
            <strong>{info.product_code}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-sm text-gray-600">Current package</div>
            <div className="font-medium text-gray-900">
              {info.package_name ?? info.package_code ?? "-"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              End date: {info.end_date ?? "—"}
            </div>
          </div>

          <p className="text-sm text-gray-700">
            Sistem tidak mengizinkan pembelian baru untuk produk yang sama.
            Pilih Perpanjang (renew) untuk menambah durasi, atau Upgrade untuk
            beralih paket.
          </p>
        </div>

        <DialogFooter className="mt-6 flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRenew}
            className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
          >
            Perpanjang
          </Button>
          <Button onClick={handleUpgrade} variant="outline">
            Upgrade Paket
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

  const isLoggedIn = Boolean(checkoutData.contact.email);

  // cookie flag untuk middleware FE
  const setAuthCookie = (persistent = true) => {
    const parts = ["customer_auth=1", "Path=/", "SameSite=Lax"];
    if (persistent) parts.push("Max-Age=2592000"); // 30 hari
    document.cookie = parts.join("; ");
  };

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(
    null
  );
  const [priceMap, setPriceMap] = useState<
    Record<string, Record<number, number>>
  >({});
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

  useEffect(() => {
    const { contact, plan, payment } = checkoutData;
    const contactValid = !!(contact.fullName && contact.email && contact.phone);
    const planValid = !!(plan.product && plan.package && plan.duration);
    const paymentValid = !!payment.method;
    setIsValid(Boolean(contactValid && planValid && paymentValid));
  }, [checkoutData]);

  // Prefill profil bila sudah login
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
        const normalized: ProductRow[] = rows.map((r: any) => ({
          product_code: r.product_code ?? r.code ?? r.slug ?? "",
          product_name: r.product_name ?? r.name ?? "",
          description: r.description ?? r.short_description ?? "",
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
            product_code: data.product?.product_code ?? prod,
            product_name: data.product?.product_name ?? prod,
            description: data.product?.description ?? "",
            status: data.product?.status,
          },
          packages: (data.packages ?? []).map((p: any) => ({
            package_code: p.package_code,
            name: p.name,
            description: p.description,
            status: p.status,
            order_number: p.order_number,
            pricelist: p.pricelist ?? [],
          })),
          durations: (data.durations ?? []).map((d: any) => ({
            code: d.code,
            name: d.name,
            length: Number(d.length),
            unit: d.unit,
            is_default: Boolean(d.is_default),
          })),
        };

        setProductDetail(detail);
        setPriceMap(buildPriceMap(detail));

        const pkgOk = detail.packages.some(
          (x) => x.package_code === checkoutData.plan.package
        );
        const durOk = detail.durations.some(
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

  // handler Google login
  const handleGoogleSuccess = async (cred: any) => {
    try {
      const idToken = cred?.credential;
      if (!idToken) throw new Error("No Google credential");
      await loginWithGoogle(idToken);
      setAuthCookie(true);

      // Prefill contact
      const me = await getCustomerMe();
      const contactFromProfile = normalizeCustomerToContact(me);
      setCheckoutData((prev) => ({
        ...prev,
        contact: { ...prev.contact, ...contactFromProfile },
      }));

      toast({ title: "Signed in with Google" });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Google sign-in failed",
        description: e?.message || "",
      });
    }
  };

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    try {
      const { product, package: pkg, duration } = checkoutData.plan;
      if (!product || !pkg || !duration)
        throw new Error("Pilih produk, paket, dan durasi dahulu.");

      const duration_code = resolveDurationCode(productDetail, duration);
      if (!duration_code) throw new Error("Durasi tidak valid.");

      try {
        const check = await checkProduct(product);
        if (check?.has_active) {
          // Terdapat langganan aktif -> tampilkan modal
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
      } catch (e) {
        // jika checkProduct gagal (network/auth), kita hentikan dan beri tahu user
        console.error("checkProduct failed", e);
        toast({ title: "Gagal memeriksa langganan aktif. Silakan coba lagi." });
        setIsPlacing(false);
        return;
      }

      const { order_id, snap_token } = await createPurchaseOrder({
        product_code: product,
        package_code: pkg,
        duration_code,
      });

      await ensureSnap();
      openSnap(snap_token, order_id);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed Order" });
    } finally {
      setIsPlacing(false);
    }
  };

  // === UI ===
  return (
    <div className="py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-gray-900 mb-4">
              Complete Your Purchase
            </h1>
            <p className="text-lg text-gray-600">
              Secure checkout powered by industry-leading encryption
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
              />

              <PlanDuration
                data={checkoutData.plan}
                products={products.map((r) => ({
                  product_code: r.product_code,
                  product_name: r.product_name,
                  description: r.description,
                }))}
                productDetail={productDetail}
                priceMap={priceMap}
                loading={loading}
                onChange={onChangePlan}
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
              />

              <VoucherCode
                data={checkoutData.voucher}
                onChange={(voucher) =>
                  setCheckoutData((prev) => ({ ...prev, voucher }))
                }
              />
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
