"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/header";
import Footer from "@/components/footer";
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
} from "lucide-react";
import { api, getOrder, refreshOrderStatus } from "@/lib/api";
import Link from "next/link";

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

// ----- client key dari env (Next) -----
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

  payment_status?: string;
  payment_type?: string; // bank_transfer, qris, credit_card, ewallet, dsb
  va_number?: string;
  bank?: string;
  permata_va_number?: string;
  qris_data?: string; // qr_string dari midtrans (optional)
  customer?: { id: string; name: string; email: string; phone?: string };
  created_at?: string;
  paid_at?: string | null;
};

/* =========================
   Helpers label & format
   ========================= */

const toTitle = (s?: string) =>
  (s || "")
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const durationLabel = (o: Order) => {
  // 1) Jika BE sudah kirim name, pakai itu
  if (o.duration_name && o.duration_name.trim()) return o.duration_name;

  // 2) Parse dari code (M1/M6/M12 atau DUR-1/6/12)
  const code = (o.duration_code || "").toUpperCase();
  const m = code.match(/^M(\d+)$/);
  if (m) {
    const n = Number(m[1]);
    return n === 1 ? "1 Month" : `${n} Months`;
  }
  const d = code.match(/^DUR-(\d+)$/);
  if (d) {
    const n = Number(d[1]);
    return n === 1 ? "1 Month" : `${n} Months`;
  }
  // fallback
  return toTitle(code || "Unknown");
};

const paymentMethodLabel = (v?: string) => {
  switch ((v || "").toLowerCase()) {
    case "credit_card":
    case "card":
      return "Credit Card";
    case "bank_transfer":
      return "Bank Transfer";
    case "qris":
      return "QRIS";
    case "ewallet":
    case "e-wallet":
      return "E-Wallet";
    default:
      return toTitle(v || "-");
  }
};

export default function OrderDetailPage() {
  useEffect(() => {
    // jika sudah ada, jangan load lagi
    if (window.snap) return;

    const script = document.createElement("script");
    // sandbox
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [opening, setOpening] = useState(false);

  const openSnap = () => {
    if (!order?.snap_token) return; // pastikan token ada
    if (!window.snap?.pay) return; // pastikan script sudah loaded
    setOpening(true);
    if (pollRef.current) clearInterval(pollRef.current); // optional stop

    window.snap.pay(order.snap_token, {
      onSuccess: () => {
        /* optional: reload order */
      },
      onPending: () => {
        /* biarkan polling jalan */
      },
      onError: () => {
        /* tampilkan toast error */
      },
      onClose: () => {
        // optional: trigger sekali refresh setelah ditutup
        refreshStatus();
      },
    });
    setOpening(false);
  };

  const fromSnapHint = searchParams.get("status"); // "success" | "pending" | "failed" | "closed"

  const isFinal = useMemo(() => {
    return order ? ["paid", "failed", "expired"].includes(order.status) : false;
  }, [order]);

  // helper status -> meta ui
  function getStatusMeta(status?: string) {
    switch (status) {
      case "paid":
        return {
          icon: <CheckCircle2 className="h-12 w-12 text-green-600" />,
          title: "Payment Successful",
          subtitle:
            "Thank you! We’ve activated your account and sent details via Email and WhatsApp",
          badgeClass: "bg-green-100 text-green-800",
        };
      case "failed":
        return {
          icon: <XCircle className="h-12 w-12 text-red-600" />,
          title: "Payment Failed",
          subtitle:
            "We encountered an issue processing your payment. Don't worry, no charges were made to your account.",
          badgeClass: "bg-red-100 text-red-800",
        };
      case "expired":
        return {
          icon: <XCircle className="h-12 w-12 text-gray-500" />,
          title: "Payment Expired",
          subtitle:
            "Your payment window has expired. Please create a new order to continue.",
          badgeClass: "bg-gray-200 text-gray-800",
        };
      // default = pending
      default:
        return {
          icon: <Clock className="h-12 w-12 text-yellow-500" />,
          title: "Complete Your Payment",
          badgeClass: "bg-yellow-100 text-yellow-800",
          subtitle:
            "We’re waiting for your payment confirmation from Midtrans. This page updates automatically.",
        };
    }
  }

  // load API Order details
  const load = async () => {
    const res = await getOrder(id);
    setOrder(res?.data);
    setLoading(false);
  };

  useEffect(() => {
    load(); // first fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // polling refresh-status kalau pending
  useEffect(() => {
    if (!order || order.status !== "pending") return;

    let tries = 0;
    const maxTries = 5; // ~1 menit jika interval 5s
    pollRef.current = setInterval(async () => {
      tries++;
      await refreshStatus(); // panggil endpoint refresh-status
      if (tries >= maxTries) clearInterval(pollRef.current);
    }, 15000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // (opsional) tampilkan toast keberhasilan
    } catch {}
  };

  // refresh status order
  const refreshStatus = async () => {
    const currentId = order?.id ?? order?.order_id; // <— gunakan salah satu
    if (!currentId) return;

    try {
      setRefreshing(true);
      const res = await refreshOrderStatus(currentId);
      const newStatus = res?.data?.status;
      if (newStatus && order && newStatus !== order.status) {
        setOrder({ ...order, status: newStatus });
      } else {
        await load();
      }
    } finally {
      setRefreshing(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-20">
          <div className="container mx-auto px-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-indigo-500" />
            <p className="mt-3 text-gray-600">Loading your order...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Pending view (menunggu pembayaran) — hanya tampil jika belum final
  const showPending = order.status === "pending";

  const meta = getStatusMeta(order?.status);
  const isPending = order?.status === "pending";
  const isPaid = order?.status === "paid";

  // ======== LABELS (prioritas name → fallback code/beautify) ========
  const productLabel =
    order.product_name?.trim() || toTitle(order.product_code || "");
  const packageLabel =
    order.package_name?.trim() || toTitle(order.package_code || "");
  const durationNice = durationLabel(order);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8">
            {showPending ? (
              <>
                <Clock className="h-12 w-12 mx-auto text-yellow-500 mb-3" />
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Complete Your Payment
                </h1>
                <p className="text-lg font-semibold text-slate-700 mb-2">
                  We’re waiting for your payment confirmation from Midtrans.
                  This page updates automatically.
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
                Order Summary
              </h3>

              <div className="space-y-6">
                {/* Product Name */}
                <div className="flex justify-between items-start">
                  <span className="text-slate-600 font-medium">
                    Product Name:
                  </span>
                  <span className="text-slate-900 font-semibold text-right">
                    {productLabel}
                  </span>
                </div>

                {/* Order ID */}
                <div className="flex justify-between items-start">
                  <span className="text-slate-600 font-medium">Order ID:</span>
                  <span className="text-slate-900 font-mono font-semibold">
                    {order.midtrans_order_id}
                  </span>
                </div>

                {/* Amount Paid */}
                <div className="flex justify-between items-start">
                  <span className="text-slate-600 font-medium">
                    Amount Paid:
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {order.currency}{" "}
                    {Number(order.total).toLocaleString("id-ID")}
                  </span>
                </div>

                {/* Payment Method */}
                <div className="flex justify-between items-start">
                  <span className="text-slate-600 font-medium">
                    Payment Method:
                  </span>
                  <span className="text-slate-900 font-semibold">
                    {paymentMethodLabel(order.payment_type)}
                  </span>
                </div>

                {/* Status */}
                <div className="flex justify-between items-start">
                  <span className="text-slate-600 font-medium">Status:</span>
                  <span
                    className={`mt-1 px-2 py-1 rounded-md ${meta.badgeClass} uppercase font-semibold`}
                  >
                    {order.status}
                  </span>
                </div>

                <Separator className="my-6" />

                {/* Package Details */}
                <div className="flex justify-center gap-3">
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

              {/* Instruksi khusus metode pembayaran */}
              {showPending && order.payment_type === "bank_transfer" && (
                <div className="bg-slate-50 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote className="h-5 w-5 text-slate-500" />
                    <div className="font-semibold">Virtual Account</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div>
                      <div className="text-sm text-slate-500">Bank</div>
                      <div className="font-semibold mt-1">
                        {(order.bank || "Bank").toUpperCase()}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-sm text-slate-500">VA Number</div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="px-2 py-1 rounded bg-white border font-mono text-slate-900">
                          {order.va_number || order.permata_va_number}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copy(
                              order.va_number || order.permata_va_number || ""
                            )
                          }
                        >
                          <Copy className="h-4 w-4 mr-2" /> Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    Complete the payment before the expiration date.
                  </p>
                </div>
              )}

              {showPending &&
                order.payment_type === "qris" &&
                order.qris_data && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <QrCode className="h-5 w-5 text-slate-500" />
                      <div className="font-semibold">Scan QRIS</div>
                    </div>
                    <div className="text-sm text-slate-600">
                      Open your payment app and scan the QR code displayed in
                      the Midtrans Snap app.
                    </div>
                  </div>
                )}

              {showPending && (
                <div className="flex items-center justify-center gap-2 text-slate-500 mt-4">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Waiting for payment confirmation...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {order.status === "pending" && (
            <>
              {/* Secondary Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <Button
                  onClick={openSnap}
                  size="lg"
                  disabled={!order?.snap_token || opening}
                  className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  {opening ? "Opening..." : "Pay Now"}
                </Button>

                {/* refresh status */}
                <Button
                  variant="outline"
                  size="lg"
                  disabled={refreshing}
                  onClick={refreshStatus}
                  className="border-indigo-600 hover:bg-indigo-600 bg-transparent cursor-pointer"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                  {refreshing ? "Refreshing…" : "Refresh Status"}
                </Button>

                <div className="col-span-full flex justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="border-slate-300 hover:bg-indigo-600 bg-transparent"
                  >
                    <Link href="/support">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Support
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}

          {order.status === "expired" && (
            <>
              {/* Secondary Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <Button
                  size="lg"
                  asChild
                  className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                >
                  <Link href="/products">
                    <Wallet className="h-4 w-4 mr-2" />
                    New Order
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="border-slate-300 hover:bg-indigo-600 bg-transparent"
                >
                  <Link href="/support">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Support
                  </Link>
                </Button>
              </div>
            </>
          )}

          {order.status === "failed" && (
            <>
              {/* Secondary Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <Button
                  size="lg"
                  asChild
                  className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                >
                  <Link href="/products">
                    <Wallet className="h-4 w-4 mr-2" />
                    New Order
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="border-slate-300 hover:bg-indigo-600 bg-transparent"
                >
                  <Link href="/support">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Support
                  </Link>
                </Button>
              </div>
            </>
          )}

          {order.status === "paid" &&
            searchParams.get("status") === "success" && (
              <>
                {/* Main CTA Button */}
                <div className="text-center mb-8">
                  <Button
                    asChild
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 shadow-lg"
                  >
                    <Link href="/my-account">
                      View Dashboard
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Link>
                  </Button>
                </div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <Button
                    variant="outline"
                    size="lg"
                    // onClick={handleDownloadInvoice}
                    className="border-slate-300 hover:bg-indigo-600 bg-transparent cursor-pointer"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Invoice
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="border-slate-300 hover:bg-indigo-600 bg-transparent"
                  >
                    <Link href="/support">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Support
                    </Link>
                  </Button>
                </div>
              </>
            )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// function Separator() {
//   return <div className="h-px w-full bg-slate-200" />;
// }
