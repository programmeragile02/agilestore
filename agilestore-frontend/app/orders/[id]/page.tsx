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
} from "lucide-react";
import { api } from "@/lib/api";

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
  snap_token: string;
  status: "pending" | "paid" | "failed" | "expired";
  currency: string;
  price: number;
  discount: number;
  total: number;
  product_code: string;
  package_code: string;
  duration_code: string;
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

  const [opening, setOpening] = useState(false);

  const openSnap = () => {
    if (!order?.snap_token) return; // pastikan token ada
    if (!window.snap?.pay) return; // pastikan script sudah loaded
    setOpening(true);
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
        /* user menutup popup */
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
          badgeClass: "bg-green-100 text-green-800",
        };
      case "failed":
        return {
          icon: <XCircle className="h-12 w-12 text-red-600" />,
          title: "Payment Failed",
          badgeClass: "bg-red-100 text-red-800",
        };
      case "expired":
        return {
          icon: <XCircle className="h-12 w-12 text-gray-500" />,
          title: "Payment Expired",
          badgeClass: "bg-gray-200 text-gray-800",
        };
      // default = pending
      default:
        return {
          icon: <Clock className="h-12 w-12 text-yellow-500" />,
          title: "Complete Your Payment",
          badgeClass: "bg-yellow-100 text-yellow-800",
        };
    }
  }

  const load = async () => {
    const { data } = await api.get(`orders/${id}`);
    setOrder(data?.data);
    setLoading(false);
  };

  useEffect(() => {
    load(); // first fetch
    // polling setiap 4s sampai final
    pollRef.current = setInterval(load, 4000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Redirect otomatis ke halaman Success/Failed jika status final
  // useEffect(() => {
  //   if (!order) return;
  //   if (order.status === "paid") {
  //     // (opsional) hapus orderData localStorage yang dipakai halaman lama
  //     try {
  //       localStorage.removeItem("orderData");
  //     } catch {}
  //     router.replace(`/order-success?orderId=${order.id}`);
  //     clearInterval(pollRef.current);
  //   } else if (order.status === "failed" || order.status === "expired") {
  //     router.replace(
  //       `/order-failed?orderId=${order.id}&error=${encodeURIComponent(
  //         order.payment_status || order.status
  //       )}`
  //     );
  //     clearInterval(pollRef.current);
  //   }
  // }, [order, router]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // (opsional) tampilkan toast keberhasilan
    } catch {}
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
  const showPending = order.status === searchParams.get("status");

  const meta = getStatusMeta(order?.status);
  const isPending = order?.status === "pending";
  const isPaid = order?.status === "paid";

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
                <p className="text-slate-600">
                  We’re waiting for your payment confirmation from Midtrans.
                  This page updates automatically.
                </p>

                <Button
                  onClick={openSnap}
                  disabled={!order?.snap_token || opening}
                  className="mt-2 bg-indigo-600 hover:bg-indigo-700"
                >
                  {opening ? "Opening..." : "Bayar sekarang"}
                </Button>
              </>
            ) : (
              <>
                <div className="flex justify-center">{meta.icon}</div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {meta.title}
                </h1>
                <h1 className="text-xl font-semibold text-slate-700 mb-2">
                  ORD-{order.id}
                </h1>
              </>
            )}
          </div>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">Status</div>
                  <div
                    className={`mt-1 px-2 py-1 rounded-md ${meta.badgeClass}`}
                  >
                    {order.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500">Total</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {order.currency}{" "}
                    {Number(order.total).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-500">Product</div>
                  <div className="font-semibold text-slate-900 mt-1">
                    {order.product_code}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Package</div>
                  <div className="font-semibold text-slate-900 mt-1">
                    {order.package_code}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Duration</div>
                  <div className="font-semibold text-slate-900 mt-1">
                    {order.duration_code}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Payment Method</div>
                  <div className="font-semibold text-slate-900 mt-1">
                    {order.payment_type || "-"}
                  </div>
                </div>
                {order.status === "paid" &&
                  searchParams.get("status") === "success" && (
                    <a href="/my-account">ke produk anda</a>
                  )}
                {order.status === "pending" && (
                  <Button
                    onClick={openSnap}
                    disabled={!order?.snap_token || opening}
                    className="mt-2 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {opening ? "Opening..." : "Bayar sekarang"}
                  </Button>
                )}
              </div>

              {/* Instruksi khusus metode pembayaran */}
              {showPending && order.payment_type === "bank_transfer" && (
                <div className="bg-slate-50 rounded-lg p-4">
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
                    Selesaikan pembayaran sebelum masa berlaku habis.
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
                      Buka aplikasi pembayaran Anda dan scan kode QR yang tampil
                      di aplikasi Midtrans Snap.
                    </div>
                  </div>
                )}

              {showPending && (
                <div className="flex items-center justify-center gap-2 text-slate-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Waiting for payment confirmation...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// function Separator() {
//   return <div className="h-px w-full bg-slate-200" />;
// }
