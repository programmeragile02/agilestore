"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  CheckCircle2,
  Clock,
  RefreshCw,
  Banknote,
  Copy,
  QrCode,
  XCircle,
  MessageCircle,
  Download,
  ArrowRight,
  Wallet,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  downloadInvoice,
  getOrder,
  refreshOrderStatus,
  getCustomerMe,
  api,
} from "@/lib/api";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/LanguageProvider";

/* ========================= Types & Globals ========================= */

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        opts?: {
          onSuccess?: (r: any) => void;
          onPending?: (r: any) => void;
          onError?: (r: any) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!;

type Order = {
  id: string;
  order_id?: string;
  midtrans_order_id: string;
  snap_token: string;
  status: "pending" | "paid" | "failed" | "expired";
  currency: string;
  price: number;
  discount: number;
  total: number;

  product_code: string;
  product_name?: string;
  package_code: string;
  package_name?: string;
  duration_code: string;
  duration_name?: string;

  intent: string;

  payment_status?: string;
  payment_type?: string;
  va_number?: string;
  bank?: string;
  permata_va_number?: string;
  qris_data?: string;
  customer?: { id: string; name: string; email: string; phone?: string };
  created_at?: string;
  paid_at?: string | null;
};

/* ========================= i18n helpers ========================= */

const toTitle = (s?: string) =>
  (s || "")
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const durationLabel = (o: Order, lang: "id" | "en") => {
  if (o.duration_name && o.duration_name.trim()) return o.duration_name;
  const code = (o.duration_code || "").toUpperCase();
  const m = code.match(/^M(\d+)$/) || code.match(/^DUR-(\d+)$/);
  if (m) {
    const n = Number(m[1]);
    if (lang === "id") return n === 1 ? "1 Bulan" : `${n} Bulan`;
    return n === 1 ? "1 Month" : `${n} Months`;
  }
  return toTitle(code || (lang === "id" ? "Tidak Diketahui" : "Unknown"));
};

const paymentMethodLabel = (v: string | undefined, lang: "id" | "en") => {
  const val = (v || "").toLowerCase();
  const map: Record<string, { en: string; id: string }> = {
    credit_card: { en: "Credit Card", id: "Kartu Kredit" },
    card: { en: "Credit Card", id: "Kartu Kredit" },
    bank_transfer: { en: "Bank Transfer", id: "Transfer Bank" },
    qris: { en: "QRIS", id: "QRIS" },
    ewallet: { en: "E-Wallet", id: "Dompet Digital" },
    "e-wallet": { en: "E-Wallet", id: "Dompet Digital" },
  };
  const found =
    map[val] ?? ({ en: toTitle(v || "-"), id: toTitle(v || "-") } as const);
  return found[lang];
};

function formatIntent(intent: string | undefined, lang: "id" | "en"): string {
  if (!intent) return "";
  const key = intent.toLowerCase();
  const map: Record<string, { en: string; id: string }> = {
    renew: { en: "Renewal", id: "Perpanjangan" },
    upgrade: { en: "Upgrade Package", id: "Upgrade Paket" },
    purchase: { en: "Purchase", id: "Pembelian" },
  };
  return (map[key] ?? { en: toTitle(intent), id: toTitle(intent) })[lang];
}

const statusLabel = (status: string | undefined, lang: "id" | "en") => {
  const k = (status || "").toLowerCase();
  const map: Record<string, { en: string; id: string }> = {
    paid: { en: "PAID", id: "LUNAS" },
    pending: { en: "PENDING", id: "MENUNGGU" },
    failed: { en: "FAILED", id: "GAGAL" },
    expired: { en: "EXPIRED", id: "KEDALUWARSA" },
  };
  return (map[k] ?? {
    en: (status || "-").toUpperCase(),
    id: (status || "-").toUpperCase(),
  })[lang];
};

/* ========================= Modal SetInitialPassword ========================= */

function SetInitialPasswordModal({
  open,
  onOpenChange,
  email,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  email?: string | null;
  onSaved?: () => void;
}) {
  const { lang } = useLanguage();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const minLen = 8;
  const validLength = newPassword.length >= minLen;
  const matches = newPassword === confirm && newPassword.length > 0;

  const T = {
    title: { en: "Set Account Password", id: "Atur Password Akun" },
    emailNA: { en: "email not available", id: "email tidak tersedia" },
    desc: {
      en: "Your account was created automatically. Set your password to access the dashboard. You can also use Forgot Password if the session has expired.",
      id: "Akun dibuat otomatis. Silakan atur password untuk masuk ke dashboard. Anda juga dapat memakai Lupa Password bila sesi sudah kadaluarsa.",
    },
    newPw: { en: "New password", id: "Password baru" },
    newPwPh: { en: "At least 8 characters", id: "Minimal 8 karakter" },
    confirmPw: { en: "Confirm password", id: "Konfirmasi password" },
    confirmPwPh: { en: "Re-type your password", id: "Ketik ulang password" },
    lenRule: {
      en: `At least ${minLen} characters`,
      id: `Minimal ${minLen} karakter`,
    },
    matchOk: { en: "Match", id: "Cocok" },
    matchNo: { en: "Not match", id: "Tidak cocok" },
    cancel: { en: "Cancel", id: "Batal" },
    save: { en: "Save password", id: "Simpan password" },
    saving: { en: "Saving...", id: "Menyimpan..." },
    toastLen: {
      en: `Password must be at least ${minLen} characters`,
      id: `Password minimal ${minLen} karakter`,
    },
    toastMatch: {
      en: "Password and confirmation do not match",
      id: "Password dan konfirmasi tidak cocok",
    },
    toastSaved: { en: "Password saved", id: "Password berhasil disimpan" },
    toastExpired: {
      en: "Session expired. Use Forgot Password to reset.",
      id: "Sesi kadaluarsa. Silakan gunakan Lupa Password untuk menyetel ulang.",
    },
    toastError: { en: "An error occurred", id: "Terjadi kesalahan" },
  } as const;

  const t = useCallback(<K extends keyof typeof T>(k: K) => T[k][lang], [lang]);

  const clearState = () => {
    setNewPassword("");
    setConfirm("");
    setShow(false);
  };

  const handleClose = () => {
    if (loading) return;
    onOpenChange(false);
  };

  const removeLocalFlag = () => {
    try {
      if (typeof window !== "undefined") {
        for (const k of Object.keys(localStorage)) {
          if (
            k.startsWith("agile:setpw:order:") &&
            (email ? localStorage.getItem(`${k}:email`) === email : true)
          ) {
            localStorage.removeItem(k);
            localStorage.removeItem(`${k}:email`);
            localStorage.removeItem(`${k}:ts`);
          }
        }
      }
    } catch {}
  };

  const handleSet = async () => {
    if (!validLength) {
      toast({ variant: "destructive", title: t("toastLen") });
      return;
    }
    if (!matches) {
      toast({ variant: "destructive", title: t("toastMatch") });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/customer/set-initial-password", {
        new_password: newPassword,
      });
      if (res?.data?.success) {
        toast({ title: t("toastSaved") });
        removeLocalFlag();
        clearState();
        onOpenChange(false);
        onSaved?.();
      } else {
        toast({
          variant: "destructive",
          title: res?.data?.message || t("toastError"),
        });
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        toast({ variant: "destructive", title: t("toastExpired") });
      } else {
        toast({
          variant: "destructive",
          title:
            err?.response?.data?.message || err?.message || t("toastError"),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Set initial password"
    >
      <div
        className={`absolute inset-0 bg-black/40 ${
          loading ? "pointer-events-none" : "cursor-pointer"
        }`}
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-lg p-6 z-10">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <span>{t("title")}</span>
          <span className="text-xs text-gray-400 font-normal">
            ({email ?? t("emailNA")})
          </span>
        </h3>

        <p className="text-sm text-gray-600 mb-4">{t("desc")}</p>

        <div className="mb-3 relative">
          <label className="text-xs text-gray-600 block mb-1">
            {t("newPw")}
          </label>
          <input
            className="w-full border rounded px-3 py-2 pr-10"
            placeholder={t("newPwPh")}
            type={show ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            aria-invalid={!validLength}
            aria-describedby="pw-help"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-8 text-gray-500"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
          <div id="pw-help" className="text-xs mt-1">
            <span className={validLength ? "text-green-600" : "text-gray-500"}>
              {validLength ? "✓" : "•"} {t("lenRule")}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs text-gray-600 block mb-1">
            {t("confirmPw")}
          </label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder={t("confirmPwPh")}
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading}
            aria-invalid={!matches}
          />
          <div className="text-xs mt-1">
            {confirm.length > 0 ? (
              matches ? (
                <span className="text-green-600 flex items-center gap-1">
                  <Check className="h-4 w-4" /> {t("matchOk")}
                </span>
              ) : (
                <span className="text-red-600">{t("matchNo")}</span>
              )
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-gray-100"
            onClick={handleClose}
            disabled={loading}
          >
            {t("cancel")}
          </button>

          <button
            className="px-4 py-2 rounded bg-indigo-600 text-white flex items-center gap-2 disabled:opacity-60"
            onClick={handleSet}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                <span>{t("saving")}</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>{t("save")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================= Main Page ========================= */

export default function OrderDetailContent() {
  const { lang } = useLanguage();

  // load midtrans snap
  useEffect(() => {
    if (window.snap) return;
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.type = "text/javascript";
    script.async = true;
    script.setAttribute("data-client-key", MIDTRANS_CLIENT_KEY);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [opening, setOpening] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [showSetPwModal, setShowSetPwModal] = useState(false);
  const [setPwEmail, setSetPwEmail] = useState<string | null>(null);
  const [flagChecked, setFlagChecked] = useState(false);

  // Kamus UI (tidak di-memo statis)
  const T = {
    loading: { en: "Loading your order...", id: "Memuat pesanan Anda..." },
    completePay: { en: "Complete Your Payment", id: "Selesaikan Pembayaran" },
    waiting: {
      en: "We’re waiting for your payment confirmation from Midtrans. This page updates automatically.",
      id: "Kami menunggu konfirmasi pembayaran dari Midtrans. Halaman ini akan memperbarui otomatis.",
    },
    paySuccess: { en: "Payment Successful", id: "Pembayaran Berhasil" },
    payFailed: { en: "Payment Failed", id: "Pembayaran Gagal" },
    payExpired: { en: "Payment Expired", id: "Pembayaran Kedaluwarsa" },
    paySuccessSub: {
      en: "Thank you! We’ve activated your account and sent details via Email and WhatsApp",
      id: "Terima kasih! Akun Anda telah diaktifkan dan detail dikirim via Email dan WhatsApp",
    },
    payFailedSub: {
      en: "We encountered an issue processing your payment. Don't worry, no charges were made to your account.",
      id: "Terjadi kendala memproses pembayaran Anda. Tenang, tidak ada biaya yang dikenakan.",
    },
    payExpiredSub: {
      en: "Your payment window has expired. Please create a new order to continue.",
      id: "Batas waktu pembayaran berakhir. Silakan buat pesanan baru untuk melanjutkan.",
    },
    orderSummary: { en: "Order Summary", id: "Ringkasan Pesanan" },
    productName: { en: "Product Name:", id: "Nama Produk:" },
    orderId: { en: "Order ID:", id: "ID Pesanan:" },
    amountPaid: { en: "Amount Paid:", id: "Jumlah Dibayar:" },
    paymentMethod: { en: "Payment Method:", id: "Metode Pembayaran:" },
    status: { en: "Status:", id: "Status:" },
    virtualAccount: { en: "Virtual Account", id: "Virtual Account" },
    bank: { en: "Bank", id: "Bank" },
    vaNumber: { en: "VA Number", id: "Nomor VA" },
    copy: { en: "Copy", id: "Salin" },
    payBefore: {
      en: "Complete the payment before the expiration date.",
      id: "Selesaikan pembayaran sebelum tanggal kedaluwarsa.",
    },
    scanQris: { en: "Scan QRIS", id: "Pindai QRIS" },
    qrisHint: {
      en: "Open your payment app and scan the QR code displayed in the Midtrans Snap app.",
      id: "Buka aplikasi pembayaran Anda dan pindai kode QR yang tampil di aplikasi Midtrans Snap.",
    },
    waitingConfirm: {
      en: "Waiting for payment confirmation...",
      id: "Menunggu konfirmasi pembayaran...",
    },
    payNow: { en: "Pay Now", id: "Bayar Sekarang" },
    opening: { en: "Opening...", id: "Membuka..." },
    refresh: { en: "Refresh Status", id: "Perbarui Status" },
    refreshing: { en: "Refreshing…", id: "Memperbarui…" },
    contactSupport: { en: "Contact Support", id: "Hubungi Dukungan" },
    newOrder: { en: "New Order", id: "Pesanan Baru" },
    viewDashboard: { en: "View Dashboard", id: "Lihat Dashboard" },
    downloadInvoice: { en: "Download Invoice", id: "Unduh Invoice" },
    preparing: { en: "Preparing…", id: "Menyiapkan…" },
  } as const;

  const t = useCallback(<K extends keyof typeof T>(k: K) => T[k][lang], [lang]);

  const openSnap = () => {
    if (!order?.snap_token || !window.snap?.pay) return;
    setOpening(true);
    if (pollRef.current) clearInterval(pollRef.current);
    window.snap.pay(order.snap_token, {
      onClose: () => {
        refreshStatus();
      },
    });
    setOpening(false);
  };

  const getStatusMeta = useCallback(
    (status?: string) => {
      switch (status) {
        case "paid":
          return {
            icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
            title: t("paySuccess"),
            subtitle: t("paySuccessSub"),
            badgeClass: "bg-green-100 text-green-800",
          };
        case "failed":
          return {
            icon: <XCircle className="h-12 w-12 text-red-600" />,
            title: t("payFailed"),
            subtitle: t("payFailedSub"),
            badgeClass: "bg-red-100 text-red-800",
          };
        case "expired":
          return {
            icon: <XCircle className="h-12 w-12 text-gray-500" />,
            title: t("payExpired"),
            subtitle: t("payExpiredSub"),
            badgeClass: "bg-gray-200 text-gray-800",
          };
        default:
          return {
            icon: <Clock className="h-12 w-12 text-yellow-500" />,
            title: t("completePay"),
            subtitle: t("waiting"),
            badgeClass: "bg-yellow-100 text-yellow-800",
          };
      }
    },
    [t]
  );

  // fetch order
  const load = async () => {
    const res = await getOrder(id);
    setOrder(res?.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // check flag for set-password once
  useEffect(() => {
    if (!id || flagChecked) return;
    setFlagChecked(true);
    const key = `agile:setpw:order:${id}`;
    try {
      if (typeof window !== "undefined") {
        const v = localStorage.getItem(key);
        if (v) {
          const emailKey = `${key}:email`;
          setSetPwEmail(localStorage.getItem(emailKey) ?? null);

          if (
            order &&
            (order.status === "paid" ||
              searchParams.get("status") === "success")
          ) {
            (async () => {
              try {
                await getCustomerMe();
                setShowSetPwModal(true);
                localStorage.removeItem(key);
                localStorage.removeItem(emailKey);
              } catch {
                // ignore
              }
            })();
          }
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, order, searchParams]);

  // polling while pending
  const refreshStatus = async () => {
    const currentId = order?.id ?? order?.order_id;
    if (!currentId) return;
    try {
      setRefreshing(true);
      const res = await refreshOrderStatus(currentId);
      const newStatus = res?.data?.status;
      if (newStatus && order && newStatus !== order.status)
        setOrder({ ...order, status: newStatus });
      else await load();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!order || order.status !== "pending") return;
    let tries = 0;
    const maxTries = 5;
    pollRef.current = setInterval(async () => {
      tries++;
      await refreshStatus();
      if (tries >= maxTries) clearInterval(pollRef.current);
    }, 15000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status]);

  // show modal after paid if flag exists
  useEffect(() => {
    const key = `agile:setpw:order:${id}`;
    if (!order || typeof window === "undefined") return;
    const v = localStorage.getItem(key);
    if (!v) return;
    if (order.status === "paid" || searchParams.get("status") === "success") {
      (async () => {
        try {
          await getCustomerMe();
          setShowSetPwModal(true);
          localStorage.removeItem(key);
          localStorage.removeItem(`${key}:email`);
        } catch {
          // ignore
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, id, searchParams]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  async function handleDownloadInvoice() {
    if (!order) return;
    try {
      setDownloading(true);
      const orderId = (order as any).order_id;
      if (!orderId) throw new Error("Order ID not found");
      const blob = await downloadInvoice(orderId);
      const filename = `invoice-${order.midtrans_order_id}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  if (loading || !order) {
    return (
      <div className="py-20">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-indigo-500" />
          <p className="mt-3 text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  const showPending = order.status === "pending";
  const meta = getStatusMeta(order?.status);
  const productLabel =
    order.product_name?.trim() || toTitle(order.product_code || "");
  const packageLabel =
    order.package_name?.trim() || toTitle(order.package_code || "");
  const durationNice = durationLabel(order, lang);

  return (
    <div className="py-10" key={lang}>
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-8">
          {showPending ? (
            <>
              <Clock className="h-12 w-12 mx-auto text-yellow-500 mb-3" />
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {meta.title}
              </h1>
              <p className="text-lg font-semibold text-slate-700 mb-2">
                {meta.subtitle}
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center">{meta.icon}</div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {meta.title}
              </h1>
              <p className="text-lg font-semibold text-slate-700 mb-2">
                {meta.subtitle}
              </p>
            </>
          )}
        </div>

        <Card className="bg-white shadow-lg border-0 mb-8">
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold text-slate-900 mb-6 text-center">
              {t("orderSummary")}
            </h3>
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <span className="text-slate-600 font-medium">
                  {t("productName")}
                </span>
                <span className="text-slate-900 font-semibold text-right">
                  {productLabel}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-600 font-medium">
                  {t("orderId")}
                </span>
                <span className="text-slate-900 font-mono font-semibold">
                  {order.midtrans_order_id}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-600 font-medium">
                  {t("amountPaid")}
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {order.currency}{" "}
                  {Number(order.total).toLocaleString(
                    lang === "id" ? "id-ID" : "en-US"
                  )}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-600 font-medium">
                  {t("paymentMethod")}
                </span>
                <span className="text-slate-900 font-semibold">
                  {paymentMethodLabel(order.payment_type, lang)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-600 font-medium">
                  {t("status")}
                </span>
                <span
                  className={`mt-1 px-2 py-1 rounded-md ${meta.badgeClass} uppercase font-semibold`}
                >
                  {statusLabel(order.status, lang)}
                </span>
              </div>

              <Separator className="my-6" />

              <div className="flex justify-center gap-3">
                <Badge
                  variant="outline"
                  className="border-indigo-200 text-indigo-700 px-4 py-2"
                >
                  {formatIntent(order.intent, lang)}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-blue-200 text-blue-700 px-4 py-2"
                >
                  {packageLabel}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-green-200 text-green-700 px-4 py-2"
                >
                  {durationNice}
                </Badge>
              </div>
            </div>

            {showPending && order.payment_type === "bank_transfer" && (
              <div className="bg-slate-50 rounded-lg p-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="h-5 w-5 text-slate-500" />
                  <div className="font-semibold">{t("virtualAccount")}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div>
                    <div className="text-sm text-slate-500">{t("bank")}</div>
                    <div className="font-semibold mt-1">
                      {(order.bank || "Bank").toUpperCase()}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-sm text-slate-500">
                      {t("vaNumber")}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="px-2 py-1 rounded bg-white border font-mono text-slate-900">
                        {order.va_number || order.permata_va_number}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copy(order.va_number || order.permata_va_number || "")
                        }
                      >
                        <Copy className="h-4 w-4 mr-2" /> {t("copy")}
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">{t("payBefore")}</p>
              </div>
            )}

            {showPending &&
              order.payment_type === "qris" &&
              order.qris_data && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="h-5 w-5 text-slate-500" />
                    <div className="font-semibold">{t("scanQris")}</div>
                  </div>
                  <div className="text-sm text-slate-600">{t("qrisHint")}</div>
                </div>
              )}

            {showPending && (
              <div className="flex items-center justify-center gap-2 text-slate-500 mt-4">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>{t("waitingConfirm")}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {order.status === "pending" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Button
              onClick={openSnap}
              size="lg"
              disabled={!order?.snap_token || opening}
              className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
            >
              <Wallet className="h-4 w-4 mr-2" />
              {opening ? t("opening") : t("payNow")}
            </Button>

            <Button
              variant="outline"
              size="lg"
              disabled={refreshing}
              onClick={refreshStatus}
              className="border-indigo-600 hover:bg-indigo-600 bg-transparent cursor-pointer"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? t("refreshing") : t("refresh")}
            </Button>

            <div className="col-span-full flex justify-center">
              <Button
                variant="outline"
                size="lg"
                asChild
                className="border-slate-300 hover:bg-indigo-600 bg-transparent"
              >
                <Link href="/contact">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {t("contactSupport")}
                </Link>
              </Button>
            </div>
          </div>
        )}

        {order.status === "expired" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Button
              size="lg"
              asChild
              className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
            >
              <Link href="/products">
                <Wallet className="h-4 w-4 mr-2" />
                {t("newOrder")}
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-slate-300 hover:bg-indigo-600 bg-transparent"
            >
              <Link href="/contact">
                <MessageCircle className="h-4 w-4 mr-2" />
                {t("contactSupport")}
              </Link>
            </Button>
          </div>
        )}

        {order.status === "failed" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Button
              size="lg"
              asChild
              className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
            >
              <Link href="/products">
                <Wallet className="h-4 w-4 mr-2" />
                {t("newOrder")}
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-slate-300 hover:bg-indigo-600 bg-transparent"
            >
              <Link href="/contact">
                <MessageCircle className="h-4 w-4 mr-2" />
                {t("contactSupport")}
              </Link>
            </Button>
          </div>
        )}

        {order.status === "paid" &&
          searchParams.get("status") === "success" && (
            <>
              <div className="text-center mb-8">
                <Button
                  asChild
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 shadow-lg"
                >
                  <Link href="/my-account">
                    {t("viewDashboard")}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDownloadInvoice}
                  disabled={downloading}
                  className="border-slate-300 hover:bg-indigo-600 bg-transparent cursor-pointer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloading ? t("preparing") : t("downloadInvoice")}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="border-slate-300 hover:bg-indigo-600 bg-transparent"
                >
                  <Link href="/contact">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {t("contactSupport")}
                  </Link>
                </Button>
              </div>
            </>
          )}

        <SetInitialPasswordModal
          open={showSetPwModal}
          onOpenChange={setShowSetPwModal}
          email={setPwEmail}
          onSaved={() => {
            /* optional */
          }}
        />
      </div>
    </div>
  );
}
