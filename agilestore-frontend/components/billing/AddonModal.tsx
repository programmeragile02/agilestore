"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { fetchAddonCatalog, createAddonOrder, type AddonItem } from "@/lib/api";
import { ensureSnap, openSnap } from "@/lib/midtrans";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productCode: string;
  packageCode?: string | null;
  subscriptionInstanceId?: string | null;
};

const TEXT = {
  en: {
    title: "Buy Add-ons",
    desc: "Pick the paid add-ons you need. Child features (if any) will be activated automatically at no extra cost.",
    policyTitle: "Billing policy",
    policyDetail:
      "Add-ons you activate now will be billed on your 2nd invoice — i.e., your 2nd next renewal after activation today. Today’s activation is free.",
    loading: "Loading…",
    empty: "No paid add-ons to display.",
    included: "Included in plan",
    purchased: "Already purchased",
    showKids: (n: number) => `Includes ${n} feature${n === 1 ? "" : "s"}`,
    hideKids: "Hide",
    totalLabel: "Subtotal (billed at next renewal)",
    todayFree: "Activation today: Free",
    checkout: "Checkout",
    processing: "Processing…",
    errLoadTitle: "Failed to load add-ons",
    errCreateTitle: "Failed to create order",
    errSelectNone: "No add-on selected yet",
    successTitle: "Add-ons activated",
    successDesc: (when?: string) =>
      when
        ? `Your add-ons are active now. They will be billed on the next renewal starting ${when}.`
        : "Your add-ons are active now. They will be billed on the next renewal.",
  },
  id: {
    title: "Beli Add-On",
    desc: "Pilih add-on berbayar yang dibutuhkan. Fitur turunan (jika ada) akan aktif otomatis tanpa biaya tambahan.",
    policyTitle: "Kebijakan penagihan",
    policyDetail:
      "Add-on yang Anda aktifkan sekarang akan ditagihkan pada tagihan ke-2 — yaitu saat perpanjangan kedua setelah aktivasi hari ini. Aktivasi add-on hari ini gratis.",
    loading: "Memuat…",
    empty: "Tidak ada add-on berbayar untuk ditampilkan.",
    included: "Termasuk paket",
    purchased: "Sudah dibeli",
    showKids: (n: number) => `Mencakup ${n} fitur`,
    hideKids: "Sembunyikan",
    totalLabel: "Subtotal (ditagihkan saat perpanjangan berikutnya)",
    todayFree: "Aktivasi hari ini: Gratis",
    checkout: "Checkout",
    processing: "Memproses…",
    errLoadTitle: "Gagal memuat add-on",
    errCreateTitle: "Gagal membuat order",
    errSelectNone: "Belum ada add-on dipilih",
    successTitle: "Add-on aktif",
    successDesc: (when?: string) =>
      when
        ? `Add-on sudah aktif sekarang. Penagihan dimulai pada perpanjangan berikutnya per ${when}.`
        : "Add-on sudah aktif sekarang. Penagihan dimulai pada perpanjangan berikutnya.",
  },
} as const;

export default function AddonModal({
  open,
  onOpenChange,
  productCode,
  packageCode,
  subscriptionInstanceId,
}: Props) {
  const { lang } = useLanguage();
  const L = TEXT[lang === "en" ? "en" : "id"];

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AddonItem[]>([]);
  const [currency, setCurrency] = useState<"IDR" | string>("IDR");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const dateLocale = lang === "en" ? "en-US" : "id-ID";
  const fmtDate = (s?: string | null) =>
    s
      ? new Date(s).toLocaleDateString(dateLocale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : undefined;

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchAddonCatalog(
      productCode,
      packageCode ?? null,
      subscriptionInstanceId ?? null
    )
      .then((res) => {
        const list: AddonItem[] = res.items || [];
        setItems(list);
        setCurrency(res.currency || "IDR");
        setExpanded({});

        const nextPicked: Record<string, boolean> = {};
        for (const p of list) {
          const disabled = !!p.included || !!p.purchased;
          nextPicked[p.feature_code] = disabled ? true : false;
        }
        setPicked(nextPicked);
      })
      .catch((e: any) =>
        toast({
          variant: "destructive",
          title: L.errLoadTitle,
          description: String(e?.message ?? e),
        })
      )
      .finally(() => setLoading(false));
  }, [open, productCode, packageCode, subscriptionInstanceId]); // eslint-disable-line

  const visibleParents = useMemo(
    () => items.filter((f) => (Number(f.price_addon) || 0) > 0),
    [items]
  );

  const fmtMoney = (n: number) => {
    const amount = Number(n || 0);
    try {
      return new Intl.NumberFormat(dateLocale, {
        style: "currency",
        currency: currency || "IDR",
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toLocaleString(dateLocale)}`;
    }
  };

  // Subtotal UI (informasi saja) — tidak menghitung yang sudah termasuk/purchased
  const uiSubtotal = useMemo(
    () =>
      visibleParents
        .filter((p) => picked[p.feature_code] && !p.included && !p.purchased)
        .reduce((s, p) => s + (Number(p.price_addon) || 0), 0),
    [visibleParents, picked]
  );

  async function onCheckout() {
    const features = visibleParents
      .filter((p) => picked[p.feature_code] && !p.included && !p.purchased)
      .map((p) => p.feature_code);

    if (features.length === 0) {
      toast({ variant: "destructive", title: L.errSelectNone });
      return;
    }

    setSubmitting(true);
    try {
      const res = await createAddonOrder({
        product_code: productCode,
        subscription_instance_id: subscriptionInstanceId || undefined,
        features,
      });

      const amount =
        Number((res as any)?.amount ?? (res as any)?.total ?? 0) || 0;
      const snapToken: string | undefined =
        (res as any)?.snap_token || undefined;
      const billFrom: string | undefined = (res as any)?.billable_from_start;

      if (!snapToken || amount <= 0) {
        toast({
          title: L.successTitle,
          description: L.successDesc(fmtDate(billFrom)),
        });
        onOpenChange(false);
        try {
          setTimeout(() => {
            if (typeof window !== "undefined") window.location.reload();
          }, 400);
        } catch {}
        return;
      }

      await ensureSnap();
      openSnap(snapToken, (res as any)?.order_id);
      onOpenChange(false);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: L.errCreateTitle,
        description: String(e?.message ?? e),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Lebarkan sedikit & beri ruang untuk grid; konten dibatasi tinggi agar tidak ketutupan */}
      <DialogContent
        className="max-w-[100vw] w-[100vw] h-[100dvh] rounded-none p-4
      md:w-[68vw] md:max-w-[1280px] md:h-auto md:rounded-xl md:p-6"
      >
        <DialogHeader>
          <DialogTitle>{L.title}</DialogTitle>
          <DialogDescription>{L.desc}</DialogDescription>
        </DialogHeader>

        {/* Grid responsif: mobile 1 kolom (stack), desktop 2 kolom */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Kolom kiri: kebijakan + ringkasan harga (sticky agar selalu terlihat saat kanan discroll) */}
          <div className="space-y-4 lg:sticky lg:top-4 self-start">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 text-sm flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5" />
              <div>
                <div className="font-medium">{L.policyTitle}</div>
                <div className="opacity-90">{L.policyDetail}</div>
              </div>
            </div>

            {/* Ringkasan harga UI */}
            <div className="rounded-lg border bg-slate-50 p-4">
              <div className="text-sm text-slate-600">{L.totalLabel}</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {fmtMoney(uiSubtotal)}
              </div>
              <div className="mt-2 text-xs text-slate-600">{L.todayFree}</div>

              <div className="mt-4 flex gap-3">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={submitting}
                  onClick={onCheckout}
                >
                  {submitting ? L.processing : L.checkout}
                </Button>
                {/* <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button> */}
              </div>
            </div>
          </div>

          {/* Kolom kanan: daftar add-on — scrollable & dibatasi tinggi */}
          <div className="rounded-lg border">
            <div className="max-h-[55vh] lg:max-h-[65vh] overflow-y-auto divide-y">
              {loading ? (
                <div className="p-4 text-sm text-slate-500">{L.loading}</div>
              ) : visibleParents.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">{L.empty}</div>
              ) : (
                visibleParents.map((p) => {
                  const kids = p.children || [];
                  const isOpen = !!expanded[p.feature_code];
                  const disabled = !!p.included || !!p.purchased;
                  const checked = !!picked[p.feature_code];

                  return (
                    <div key={p.feature_code} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-start gap-3 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={(e) =>
                              setPicked((st) => ({
                                ...st,
                                [p.feature_code]: e.target.checked,
                              }))
                            }
                            className="mt-1 disabled:cursor-not-allowed"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">
                              {p.name}
                            </div>

                            <div className="mt-1 flex flex-wrap gap-2">
                              {p.included && (
                                <Badge variant="secondary">{L.included}</Badge>
                              )}
                              {p.purchased && (
                                <Badge className="bg-emerald-100 text-emerald-700">
                                  {L.purchased}
                                </Badge>
                              )}
                            </div>

                            {kids.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpanded((ex) => ({
                                    ...ex,
                                    [p.feature_code]: !isOpen,
                                  }))
                                }
                                className="mt-2 text-xs text-blue-600 hover:underline inline-flex items-center"
                              >
                                {isOpen ? (
                                  <>
                                    <ChevronUp className="h-4 w-4 mr-1" />
                                    {L.hideKids}
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4 mr-1" />
                                    {TEXT[lang === "en" ? "en" : "id"].showKids(
                                      kids.length
                                    )}
                                  </>
                                )}
                              </button>
                            )}

                            {kids.length > 0 && isOpen && (
                              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                                {kids.map((c) => (
                                  <li key={c.feature_code}>• {c.name}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </label>

                        <div className="text-sm font-semibold whitespace-nowrap ml-3">
                          {fmtMoney(Number(p.price_addon) || 0)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
