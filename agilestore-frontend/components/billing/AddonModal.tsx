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

/* =========================================================
   i18n text
========================================================= */
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
    qty: "Qty",
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
    qty: "Jumlah",
  },
} as const;

/* =========================================================
   Props
========================================================= */
type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productCode: string;
  packageCode?: string | null;
  subscriptionInstanceId?: string | null;
};

/* =========================================================
   Accessors aman untuk mengatasi variasi field dari backend
========================================================= */
type AnyAddon = AddonItem & Record<string, any>;
type AnyChild = Record<string, any>;

const codeOf = (p: AnyAddon) =>
  String(
    p.feature_code ?? p.addon_code ?? p.code ?? p.master_code ?? p.id ?? ""
  ).trim();

const nameOf = (p: AnyAddon) => String(p.name ?? p.title ?? p.label ?? "");

const parentOf = (p: AnyAddon) =>
  p.menu_parent_code ?? p.parent_code ?? p.parent ?? null;

const childrenOf = (p: AnyAddon): AnyChild[] =>
  Array.isArray(p.children) ? p.children : p.kids ?? p.items ?? [];

const priceOf = (p: AnyAddon) =>
  Number(p.price_addon ?? p.unit_price ?? p.price ?? 0);

/** heuristik: add-on bertipe kuantitas (seat/pengguna/pelanggan) */
const isQtyAddon = (p: AnyAddon): boolean => {
  // MASTER_ADDON pasti kuantitas (atau flat), utamakan flag 'type' & pricing_mode
  if ((p.type ?? "").toString().toUpperCase() === "MASTER_ADDON") return true;
  if ((p.pricing_mode ?? "").toString().toLowerCase() === "per_unit")
    return true;
  if (p.qty_enabled) return true;
  const s = `${codeOf(p)} ${nameOf(p)}`.toLowerCase();
  return /pelanggan|seat|user|pengguna|license|quota|kuota/.test(s);
};

function getQtyCaps(p: AnyAddon) {
  // Backend kirim min_qty/step_qty/max_qty → map ke min/max/default
  const min = Number(p.min_qty ?? p.qty_min ?? 1) || 1;
  // step_qty bisa kamu pakai bila perlu melakukan snapping; untuk sekarang abaikan
  const max = Number(p.max_qty ?? p.qty_max ?? 9999) || 9999;
  const def = Number(p.qty_default ?? p.min_qty ?? 1) || 1;
  return {
    qty_min: Math.max(1, min),
    qty_max: Math.max(min, max),
    qty_default: Math.min(Math.max(def, min), Math.max(min, max)),
  };
}

/* =========================================================
   Komponen
========================================================= */
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
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const dateLocale = lang === "en" ? "en-US" : "id-ID";
  const fmtDate = (s?: string | null) =>
    s
      ? new Date(s).toLocaleDateString(dateLocale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : undefined;

  /* -------------------- load catalog -------------------- */
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

        // inisialisasi picked & qty
        const nextPicked: Record<string, boolean> = {};
        const nextQty: Record<string, number> = {};
        for (const p of list as AnyAddon[]) {
          const code = codeOf(p);
          const disabled = !!p.included || !!p.purchased;
          nextPicked[code] = disabled ? true : false;

          if (isQtyAddon(p)) {
            nextQty[code] = getQtyCaps(p).qty_default;
          } else {
            nextQty[code] = 1;
          }

          if ((p.type ?? "").toString().toUpperCase() === "MASTER_ADDON" || isQtyAddon(p)) {
            nextQty[code] = getQtyCaps(p).qty_default;
          } else {
            nextQty[code] = 1;
          }
        }
        setPicked(nextPicked);
        setQtyMap(nextQty);
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

  /* -------------------- daftar parent berbayar -------------------- */
  const parents = useMemo(
    () =>
      (items as AnyAddon[])
        .filter((it) => parentOf(it) == null && priceOf(it) > 0)
        .sort((a, b) => nameOf(a).localeCompare(nameOf(b))),
    [items]
  );

  /* -------------------- formatter uang -------------------- */
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

  /* -------------------- subtotal UI -------------------- */
  const uiSubtotal = useMemo(
    () =>
      parents
        .filter((p) => picked[codeOf(p)] && !p.included && !p.purchased)
        .reduce((s, p) => {
          const code = codeOf(p);
          const base = priceOf(p);
          const qty = isQtyAddon(p) ? Math.max(1, qtyMap[code] || 1) : 1;
          return s + base * qty;
        }, 0),
    [parents, picked, qtyMap]
  );

  /* -------------------- helpers qty -------------------- */
  function decQty(code: string, p: AnyAddon) {
    setQtyMap((st) => {
      const { qty_min } = getQtyCaps(p);
      const cur = st[code] ?? 1;
      const next = Math.max(qty_min, cur - 1);
      return { ...st, [code]: next };
    });
  }
  function incQty(code: string, p: AnyAddon) {
    setQtyMap((st) => {
      const { qty_max } = getQtyCaps(p);
      const cur = st[code] ?? 1;
      const next = Math.min(qty_max, cur + 1);
      return { ...st, [code]: next };
    });
  }
  function onQtyInput(code: string, p: AnyAddon, v: string) {
    const { qty_min, qty_max } = getQtyCaps(p);
    const num = Math.max(qty_min, Math.min(qty_max, Number(v) || qty_min));
    setQtyMap((st) => ({ ...st, [code]: num }));
  }

  /* -------------------- checkout -------------------- */
  async function onCheckout() {
    // Parent yang dipilih & tidak included/purchased
    const selectedParents = parents.filter(
      (p) => picked[codeOf(p)] && !p.included && !p.purchased
    );

    // Pisahkan FEATURE vs MASTER_ADDON
    const selFeatures = selectedParents.filter(
      (p) => (p.type ?? "").toString().toUpperCase() !== "MASTER_ADDON"
    );
    const selMaster = selectedParents.filter(
      (p) => (p.type ?? "").toString().toUpperCase() === "MASTER_ADDON"
    );

    const features = selFeatures.map(codeOf);

    const addons = selMaster.map((p) => {
      const code = codeOf(p);
      const qty = isQtyAddon(p) ? Math.max(1, qtyMap[code] || 1) : 1;
      return { addon_code: code, qty };
    });

    if (features.length === 0 && addons.length === 0) {
      toast({ variant: "destructive", title: L.errSelectNone });
      return;
    }

    setSubmitting(true);
    try {
      const res = await createAddonOrder({
        product_code: productCode,
        subscription_instance_id: subscriptionInstanceId || undefined,
        ...(features.length ? { features } : {}),
        ...(addons.length ? { addons } : {}),
      });

      const amount =
        Number((res as any)?.amount ?? (res as any)?.total ?? 0) || 0;
      const token = (res as any)?.snap_token as string | undefined;
      const billFrom = (res as any)?.billable_from_start as string | undefined;

      if (!token || amount <= 0) {
        toast({
          title: L.successTitle,
          description: L.successDesc(fmtDate(billFrom)),
        });
        onOpenChange(false);
        try {
          setTimeout(() => window.location.reload(), 400);
        } catch {}
        return;
      }

      await ensureSnap();
      openSnap(token, (res as any)?.order_id);
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

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[100vw] w-[100vw] h-[100dvh] rounded-none p-4
        md:w-[920px] md:max-w-[920px] md:h-auto md:rounded-xl md:p-6"
      >
        <DialogHeader>
          <DialogTitle>{L.title}</DialogTitle>
          <DialogDescription>{L.desc}</DialogDescription>
        </DialogHeader>

        {/* Kebijakan + Ringkasan harga */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4 lg:sticky lg:top-4 self-start">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 text-sm flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5" />
              <div>
                <div className="font-medium">{L.policyTitle}</div>
                <div className="opacity-90">{L.policyDetail}</div>
              </div>
            </div>

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
              </div>
            </div>
          </div>

          {/* Daftar Add-on (single list) */}
          <div className="rounded-lg border">
            <div className="max-h-[55vh] lg:max-h-[65vh] overflow-y-auto divide-y">
              {loading ? (
                <div className="p-4 text-sm text-slate-500">{L.loading}</div>
              ) : parents.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">{L.empty}</div>
              ) : (
                parents.map((p) => {
                  const code = codeOf(p);
                  const kids = childrenOf(p);
                  const isOpen = !!expanded[code];
                  const disabled = !!p.included || !!p.purchased;
                  const checked = !!picked[code];
                  const unit = priceOf(p);
                  const qtyEnabled = isQtyAddon(p);
                  const qty = qtyEnabled ? Math.max(1, qtyMap[code] || 1) : 1;
                  const caps = qtyEnabled ? getQtyCaps(p) : null;

                  return (
                    <div key={code} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-start gap-3 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={(e) =>
                              setPicked((st) => ({
                                ...st,
                                [code]: e.target.checked,
                              }))
                            }
                            className="mt-1 disabled:cursor-not-allowed"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">
                              {nameOf(p)}
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
                                    [code]: !isOpen,
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
                                {kids.map((c) => {
                                  const childCode = String(
                                    c.feature_code ?? c.code ?? c.id ?? ""
                                  );
                                  return <li key={childCode}>• {c.name}</li>;
                                })}
                              </ul>
                            )}

                            {/* Qty controls (hanya untuk addon kuantitas) */}
                            {qtyEnabled && !disabled && (
                              <div className="mt-3 inline-flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                  {L.qty}
                                </span>
                                <div className="inline-flex items-center border rounded-md">
                                  <button
                                    type="button"
                                    className="px-2 py-1"
                                    onClick={() => decQty(code, p)}
                                    aria-label="decrease quantity"
                                  >
                                    −
                                  </button>
                                  <input
                                    className="w-14 text-center px-2 py-1 outline-none bg-transparent"
                                    value={qty}
                                    onChange={(e) =>
                                      onQtyInput(code, p, e.target.value)
                                    }
                                    inputMode="numeric"
                                  />
                                  <button
                                    type="button"
                                    className="px-2 py-1"
                                    onClick={() => incQty(code, p)}
                                    aria-label="increase quantity"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </label>

                        <div className="text-sm font-semibold whitespace-nowrap ml-3 text-right">
                          {/* tampilkan harga unit & total jika qty */}
                          <div>{fmtMoney(unit)}</div>
                          {qtyEnabled && checked && (
                            <div className="text-xs text-slate-500">
                              × {qty} ={" "}
                              <span className="font-medium">
                                {fmtMoney(unit * qty)}
                              </span>
                            </div>
                          )}
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

// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { fetchAddonCatalog, createAddonOrder, type AddonItem } from "@/lib/api";
// import { ensureSnap, openSnap } from "@/lib/midtrans";
// import { toast } from "@/hooks/use-toast";
// import { ChevronDown, ChevronUp, Info } from "lucide-react";
// import { useLanguage } from "@/components/LanguageProvider";

// type Props = {
//   open: boolean;
//   onOpenChange: (v: boolean) => void;
//   productCode: string;
//   packageCode?: string | null;
//   subscriptionInstanceId?: string | null;
// };

// const TEXT = {
//   en: {
//     title: "Buy Add-ons",
//     desc: "Pick the paid add-ons you need. Child features (if any) will be activated automatically at no extra cost.",
//     policyTitle: "Billing policy",
//     policyDetail:
//       "Add-ons you activate now will be billed on your 2nd invoice — i.e., your 2nd next renewal after activation today. Today’s activation is free.",
//     loading: "Loading…",
//     empty: "No paid add-ons to display.",
//     included: "Included in plan",
//     purchased: "Already purchased",
//     showKids: (n: number) => `Includes ${n} feature${n === 1 ? "" : "s"}`,
//     hideKids: "Hide",
//     totalLabel: "Subtotal (billed at next renewal)",
//     todayFree: "Activation today: Free",
//     checkout: "Checkout",
//     processing: "Processing…",
//     errLoadTitle: "Failed to load add-ons",
//     errCreateTitle: "Failed to create order",
//     errSelectNone: "No add-on selected yet",
//     successTitle: "Add-ons activated",
//     successDesc: (when?: string) =>
//       when
//         ? `Your add-ons are active now. They will be billed on the next renewal starting ${when}.`
//         : "Your add-ons are active now. They will be billed on the next renewal.",
//   },
//   id: {
//     title: "Beli Add-On",
//     desc: "Pilih add-on berbayar yang dibutuhkan. Fitur turunan (jika ada) akan aktif otomatis tanpa biaya tambahan.",
//     policyTitle: "Kebijakan penagihan",
//     policyDetail:
//       "Add-on yang Anda aktifkan sekarang akan ditagihkan pada tagihan ke-2 — yaitu saat perpanjangan kedua setelah aktivasi hari ini. Aktivasi add-on hari ini gratis.",
//     loading: "Memuat…",
//     empty: "Tidak ada add-on berbayar untuk ditampilkan.",
//     included: "Termasuk paket",
//     purchased: "Sudah dibeli",
//     showKids: (n: number) => `Mencakup ${n} fitur`,
//     hideKids: "Sembunyikan",
//     totalLabel: "Subtotal (ditagihkan saat perpanjangan berikutnya)",
//     todayFree: "Aktivasi hari ini: Gratis",
//     checkout: "Checkout",
//     processing: "Memproses…",
//     errLoadTitle: "Gagal memuat add-on",
//     errCreateTitle: "Gagal membuat order",
//     errSelectNone: "Belum ada add-on dipilih",
//     successTitle: "Add-on aktif",
//     successDesc: (when?: string) =>
//       when
//         ? `Add-on sudah aktif sekarang. Penagihan dimulai pada perpanjangan berikutnya per ${when}.`
//         : "Add-on sudah aktif sekarang. Penagihan dimulai pada perpanjangan berikutnya.",
//   },
// } as const;

// export default function AddonModal({
//   open,
//   onOpenChange,
//   productCode,
//   packageCode,
//   subscriptionInstanceId,
// }: Props) {
//   const { lang } = useLanguage();
//   const L = TEXT[lang === "en" ? "en" : "id"];

//   const [loading, setLoading] = useState(false);
//   const [items, setItems] = useState<AddonItem[]>([]);
//   const [currency, setCurrency] = useState<"IDR" | string>("IDR");
//   const [picked, setPicked] = useState<Record<string, boolean>>({});
//   const [submitting, setSubmitting] = useState(false);
//   const [expanded, setExpanded] = useState<Record<string, boolean>>({});

//   const dateLocale = lang === "en" ? "en-US" : "id-ID";
//   const fmtDate = (s?: string | null) =>
//     s
//       ? new Date(s).toLocaleDateString(dateLocale, {
//           year: "numeric",
//           month: "long",
//           day: "numeric",
//         })
//       : undefined;

//   useEffect(() => {
//     if (!open) return;
//     setLoading(true);
//     fetchAddonCatalog(
//       productCode,
//       packageCode ?? null,
//       subscriptionInstanceId ?? null
//     )
//       .then((res) => {
//         const list: AddonItem[] = res.items || [];
//         setItems(list);
//         setCurrency(res.currency || "IDR");
//         setExpanded({});

//         const nextPicked: Record<string, boolean> = {};
//         for (const p of list) {
//           const disabled = !!p.included || !!p.purchased;
//           nextPicked[p.feature_code] = disabled ? true : false;
//         }
//         setPicked(nextPicked);
//       })
//       .catch((e: any) =>
//         toast({
//           variant: "destructive",
//           title: L.errLoadTitle,
//           description: String(e?.message ?? e),
//         })
//       )
//       .finally(() => setLoading(false));
//   }, [open, productCode, packageCode, subscriptionInstanceId]); // eslint-disable-line

//   const visibleParents = useMemo(
//     () => items.filter((f) => (Number(f.price_addon) || 0) > 0),
//     [items]
//   );

//   const fmtMoney = (n: number) => {
//     const amount = Number(n || 0);
//     try {
//       return new Intl.NumberFormat(dateLocale, {
//         style: "currency",
//         currency: currency || "IDR",
//         maximumFractionDigits: 0,
//       }).format(amount);
//     } catch {
//       return `${currency} ${amount.toLocaleString(dateLocale)}`;
//     }
//   };

//   // Subtotal UI (informasi saja) — tidak menghitung yang sudah termasuk/purchased
//   const uiSubtotal = useMemo(
//     () =>
//       visibleParents
//         .filter((p) => picked[p.feature_code] && !p.included && !p.purchased)
//         .reduce((s, p) => s + (Number(p.price_addon) || 0), 0),
//     [visibleParents, picked]
//   );

//   async function onCheckout() {
//     const features = visibleParents
//       .filter((p) => picked[p.feature_code] && !p.included && !p.purchased)
//       .map((p) => p.feature_code);

//     if (features.length === 0) {
//       toast({ variant: "destructive", title: L.errSelectNone });
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const res = await createAddonOrder({
//         product_code: productCode,
//         subscription_instance_id: subscriptionInstanceId || undefined,
//         features,
//       });

//       const amount =
//         Number((res as any)?.amount ?? (res as any)?.total ?? 0) || 0;
//       const snapToken: string | undefined =
//         (res as any)?.snap_token || undefined;
//       const billFrom: string | undefined = (res as any)?.billable_from_start;

//       if (!snapToken || amount <= 0) {
//         toast({
//           title: L.successTitle,
//           description: L.successDesc(fmtDate(billFrom)),
//         });
//         onOpenChange(false);
//         try {
//           setTimeout(() => {
//             if (typeof window !== "undefined") window.location.reload();
//           }, 400);
//         } catch {}
//         return;
//       }

//       await ensureSnap();
//       openSnap(snapToken, (res as any)?.order_id);
//       onOpenChange(false);
//     } catch (e: any) {
//       toast({
//         variant: "destructive",
//         title: L.errCreateTitle,
//         description: String(e?.message ?? e),
//       });
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       {/* Lebarkan sedikit & beri ruang untuk grid; konten dibatasi tinggi agar tidak ketutupan */}
//       <DialogContent
//         className="max-w-[100vw] w-[100vw] h-[100dvh] rounded-none p-4
//       md:w-[68vw] md:max-w-[1280px] md:h-auto md:rounded-xl md:p-6"
//       >
//         <DialogHeader>
//           <DialogTitle>{L.title}</DialogTitle>
//           <DialogDescription>{L.desc}</DialogDescription>
//         </DialogHeader>

//         {/* Grid responsif: mobile 1 kolom (stack), desktop 2 kolom */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
//           {/* Kolom kiri: kebijakan + ringkasan harga (sticky agar selalu terlihat saat kanan discroll) */}
//           <div className="space-y-4 lg:sticky lg:top-4 self-start">
//             <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 text-sm flex items-start gap-2">
//               <Info className="h-4 w-4 mt-0.5" />
//               <div>
//                 <div className="font-medium">{L.policyTitle}</div>
//                 <div className="opacity-90">{L.policyDetail}</div>
//               </div>
//             </div>

//             {/* Ringkasan harga UI */}
//             <div className="rounded-lg border bg-slate-50 p-4">
//               <div className="text-sm text-slate-600">{L.totalLabel}</div>
//               <div className="mt-1 text-2xl font-semibold text-slate-900">
//                 {fmtMoney(uiSubtotal)}
//               </div>
//               <div className="mt-2 text-xs text-slate-600">{L.todayFree}</div>

//               <div className="mt-4 flex gap-3">
//                 <Button
//                   className="bg-blue-600 hover:bg-blue-700"
//                   disabled={submitting}
//                   onClick={onCheckout}
//                 >
//                   {submitting ? L.processing : L.checkout}
//                 </Button>
//                 {/* <Button variant="outline" onClick={() => onOpenChange(false)}>
//                   Close
//                 </Button> */}
//               </div>
//             </div>
//           </div>

//           {/* Kolom kanan: daftar add-on — scrollable & dibatasi tinggi */}
//           <div className="rounded-lg border">
//             <div className="max-h-[55vh] lg:max-h-[65vh] overflow-y-auto divide-y">
//               {loading ? (
//                 <div className="p-4 text-sm text-slate-500">{L.loading}</div>
//               ) : visibleParents.length === 0 ? (
//                 <div className="p-4 text-sm text-slate-500">{L.empty}</div>
//               ) : (
//                 visibleParents.map((p) => {
//                   const kids = p.children || [];
//                   const isOpen = !!expanded[p.feature_code];
//                   const disabled = !!p.included || !!p.purchased;
//                   const checked = !!picked[p.feature_code];

//                   return (
//                     <div key={p.feature_code} className="px-4 py-3">
//                       <div className="flex items-start justify-between gap-3">
//                         <label className="flex items-start gap-3 flex-1 cursor-pointer">
//                           <input
//                             type="checkbox"
//                             checked={checked}
//                             disabled={disabled}
//                             onChange={(e) =>
//                               setPicked((st) => ({
//                                 ...st,
//                                 [p.feature_code]: e.target.checked,
//                               }))
//                             }
//                             className="mt-1 disabled:cursor-not-allowed"
//                           />
//                           <div className="flex-1">
//                             <div className="font-medium text-slate-900">
//                               {p.name}
//                             </div>

//                             <div className="mt-1 flex flex-wrap gap-2">
//                               {p.included && (
//                                 <Badge variant="secondary">{L.included}</Badge>
//                               )}
//                               {p.purchased && (
//                                 <Badge className="bg-emerald-100 text-emerald-700">
//                                   {L.purchased}
//                                 </Badge>
//                               )}
//                             </div>

//                             {kids.length > 0 && (
//                               <button
//                                 type="button"
//                                 onClick={() =>
//                                   setExpanded((ex) => ({
//                                     ...ex,
//                                     [p.feature_code]: !isOpen,
//                                   }))
//                                 }
//                                 className="mt-2 text-xs text-blue-600 hover:underline inline-flex items-center"
//                               >
//                                 {isOpen ? (
//                                   <>
//                                     <ChevronUp className="h-4 w-4 mr-1" />
//                                     {L.hideKids}
//                                   </>
//                                 ) : (
//                                   <>
//                                     <ChevronDown className="h-4 w-4 mr-1" />
//                                     {TEXT[lang === "en" ? "en" : "id"].showKids(
//                                       kids.length
//                                     )}
//                                   </>
//                                 )}
//                               </button>
//                             )}

//                             {kids.length > 0 && isOpen && (
//                               <ul className="mt-2 space-y-1 text-sm text-slate-700">
//                                 {kids.map((c) => (
//                                   <li key={c.feature_code}>• {c.name}</li>
//                                 ))}
//                               </ul>
//                             )}
//                           </div>
//                         </label>

//                         <div className="text-sm font-semibold whitespace-nowrap ml-3">
//                           {fmtMoney(Number(p.price_addon) || 0)}
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })
//               )}
//             </div>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }
