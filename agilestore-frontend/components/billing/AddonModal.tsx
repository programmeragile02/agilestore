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
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productCode: string;
  packageCode?: string | null;
  subscriptionInstanceId?: string | null;
};

/** UI dictionary */
const TEXT = {
  en: {
    title: "Buy Add-ons",
    desc: "Pick the paid add-ons you need. Any child features will be activated automatically at no extra cost.",
    loading: "Loading…",
    empty: "No paid add-ons to display.",
    included: "Included in plan",
    purchased: "Already purchased",
    showKids: (n: number) => `Includes ${n} feature${n === 1 ? "" : "s"}`,
    hideKids: "Hide",
    totalLabel: "Total",
    checkout: "Checkout",
    processing: "Processing…",
    errLoadTitle: "Failed to load add-ons",
    errCreateTitle: "Failed to create order",
    errSelectNone: "No add-on selected yet",
  },
  id: {
    title: "Beli Add-On",
    desc: "Pilih add-on berbayar yang Anda butuhkan. Fitur turunan akan aktif otomatis tanpa biaya tambahan.",
    loading: "Memuat…",
    empty: "Tidak ada add-on berbayar untuk ditampilkan.",
    included: "Termasuk paket",
    purchased: "Sudah dibeli",
    showKids: (n: number) => `Mencakup ${n} fitur`,
    hideKids: "Sembunyikan",
    totalLabel: "Total",
    checkout: "Checkout",
    processing: "Memproses…",
    errLoadTitle: "Gagal memuat add-on",
    errCreateTitle: "Gagal membuat order",
    errSelectNone: "Belum ada add-on dipilih",
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

        // default: yang included/purchased -> checked & tidak bisa diubah
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

  // hanya parent yang berharga ditampilkan (anak via toggle)
  const visibleParents = useMemo(
    () => items.filter((f) => (Number(f.price_addon) || 0) > 0),
    [items]
  );

  // formatter harga mengikuti locale & currency
  const fmt = (n: number) => {
    const amount = Number(n || 0);
    try {
      return new Intl.NumberFormat(
        lang === "en" ? "en-US" : "id-ID",
        { style: "currency", currency: currency || "IDR", maximumFractionDigits: 0 }
      ).format(amount);
    } catch {
      // fallback aman
      return `${currency} ${amount.toLocaleString(lang === "en" ? "en-US" : "id-ID")}`;
    }
  };

  // total user-pick yang bisa dibeli (bukan included/purchased)
  const total = useMemo(
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
      await ensureSnap();
      openSnap(res.snap_token, res.order_id);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{L.title}</DialogTitle>
          <DialogDescription>{L.desc}</DialogDescription>
        </DialogHeader>

        <div className="mt-3 border rounded-lg">
          <div className="max-h-80 overflow-y-auto divide-y">
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

                          {/* badges */}
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

                          {/* toggle anak */}
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
                                  {L.showKids(kids.length)}
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
                        {fmt(Number(p.price_addon) || 0)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs sm:text-sm text-slate-600" />
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold">
              {/* {L.totalLabel}:  */}{fmt(total)}
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={submitting || total <= 0}
              onClick={onCheckout}
            >
              {submitting ? L.processing : L.checkout}
            </Button>
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
// import {
//   fetchAddonCatalog,
//   createAddonOrder,
//   type AddonItem,
// } from "@/lib/api";
// import { ensureSnap, openSnap } from "@/lib/midtrans";
// import { toast } from "@/hooks/use-toast";
// import { ChevronDown, ChevronUp } from "lucide-react";

// type Props = {
//   open: boolean;
//   onOpenChange: (v: boolean) => void;
//   productCode: string;
//   packageCode?: string | null;
//   subscriptionInstanceId?: string | null;
// };

// export default function AddonModal({
//   open,
//   onOpenChange,
//   productCode,
//   packageCode,
//   subscriptionInstanceId,
// }: Props) {
//   const [loading, setLoading] = useState(false);
//   const [items, setItems] = useState<AddonItem[]>([]);
//   const [currency, setCurrency] = useState<"IDR" | string>("IDR");
//   const [picked, setPicked] = useState<Record<string, boolean>>({});
//   const [submitting, setSubmitting] = useState(false);
//   const [expanded, setExpanded] = useState<Record<string, boolean>>({});

//   useEffect(() => {
//     if (!open) return;
//     setLoading(true);
//     fetchAddonCatalog(productCode, packageCode ?? null, subscriptionInstanceId ?? null)
//       .then((res) => {
//         const list = res.items || [];
//         setItems(list);
//         setCurrency(res.currency || "IDR");
//         setExpanded({});

//         // ✅ Default: yang included/purchased -> checked & non-editable
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
//           title: "Gagal memuat add-on",
//           description: String(e?.message ?? e),
//         })
//       )
//       .finally(() => setLoading(false));
//   }, [open, productCode, packageCode, subscriptionInstanceId]);

//   // hanya parent berharga ditampilkan (anak via toggle)
//   const visibleParents = useMemo(
//     () => items.filter((f) => (Number(f.price_addon) || 0) > 0),
//     [items]
//   );

//   const fmt = (n: number) =>
//     `${currency} ${Number(n || 0).toLocaleString("id-ID")}`;

//   // ✅ Total hanya dari yang user centang & BISA dibeli (bukan included/purchased)
//   const total = useMemo(
//     () =>
//       visibleParents
//         .filter(
//           (p) =>
//             picked[p.feature_code] && !p.included && !p.purchased
//         )
//         .reduce((s, p) => s + (Number(p.price_addon) || 0), 0),
//     [visibleParents, picked]
//   );

//   async function onCheckout() {
//     // hanya parent yang dipilih & bisa dibeli
//     const features = visibleParents
//       .filter((p) => picked[p.feature_code] && !p.included && !p.purchased)
//       .map((p) => p.feature_code);

//     if (features.length === 0) {
//       toast({ variant: "destructive", title: "Belum ada add-on dipilih" });
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const res = await createAddonOrder({
//         product_code: productCode,
//         subscription_instance_id: subscriptionInstanceId || undefined,
//         features,
//       });
//       await ensureSnap();
//       openSnap(res.snap_token, res.order_id);
//       onOpenChange(false);
//     } catch (e: any) {
//       toast({
//         variant: "destructive",
//         title: "Gagal membuat order",
//         description: String(e?.message ?? e),
//       });
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-2xl">
//         <DialogHeader>
//           <DialogTitle>Beli Add On</DialogTitle>
//           <DialogDescription>
//             Pilih add on <strong> berbayar</strong>. Jika ada fitur di bawahnya akan
//             aktif otomatis tanpa biaya tambahan.
//           </DialogDescription>
//         </DialogHeader>

//         <div className="mt-3 border rounded-lg">
//           <div className="max-h-80 overflow-y-auto divide-y">
//             {loading ? (
//               <div className="p-4 text-sm text-slate-500">Loading…</div>
//             ) : visibleParents.length === 0 ? (
//               <div className="p-4 text-sm text-slate-500">
//                 Tidak ada add-on berbayar untuk ditampilkan.
//               </div>
//             ) : (
//               visibleParents.map((p) => {
//                 const kids = p.children || [];
//                 const isOpen = !!expanded[p.feature_code];
//                 const disabled = !!p.included || !!p.purchased;
//                 const checked = !!picked[p.feature_code]; // default true utk included/purchased

//                 return (
//                   <div key={p.feature_code} className="px-4 py-3">
//                     <div className="flex items-start justify-between gap-3">
//                       <label className="flex items-start gap-3 flex-1 cursor-pointer">
//                         <input
//                           type="checkbox"
//                           checked={checked}
//                           disabled={disabled}
//                           onChange={(e) =>
//                             setPicked((st) => ({
//                               ...st,
//                               [p.feature_code]: e.target.checked,
//                             }))
//                           }
//                           className="mt-1 disabled:cursor-not-allowed"
//                         />
//                         <div className="flex-1">
//                           <div className="font-medium text-slate-900">
//                             {p.name}
//                           </div>

//                           {/* badges di bawah nama */}
//                           <div className="mt-1 flex flex-wrap gap-2">
//                             {p.included && (
//                               <Badge variant="secondary">Termasuk paket</Badge>
//                             )}
//                             {p.purchased && (
//                               <Badge className="bg-emerald-100 text-emerald-700">
//                                 Sudah dibeli
//                               </Badge>
//                             )}
//                           </div>

//                           {/* toggle anak di bawah nama */}
//                           {kids.length > 0 && (
//                             <button
//                               type="button"
//                               onClick={() =>
//                                 setExpanded((ex) => ({
//                                   ...ex,
//                                   [p.feature_code]: !isOpen,
//                                 }))
//                               }
//                               className="mt-2 text-xs text-blue-600 hover:underline inline-flex items-center"
//                             >
//                               {isOpen ? (
//                                 <>
//                                   <ChevronUp className="h-4 w-4 mr-1" />
//                                   Sembunyikan
//                                 </>
//                               ) : (
//                                 <>
//                                   <ChevronDown className="h-4 w-4 mr-1" />
//                                   Mencakup{" "}{kids.length}{" "}fitur
//                                 </>
//                               )}
//                             </button>
//                           )}

//                           {kids.length > 0 && isOpen && (
//                             <ul className="mt-2 space-y-1 text-sm text-slate-700">
//                               {kids.map((c) => (
//                                 <li key={c.feature_code}>• {c.name}</li>
//                               ))}
//                             </ul>
//                           )}
//                         </div>
//                       </label>

//                       <div className="text-sm font-semibold whitespace-nowrap ml-3">
//                         {fmt(Number(p.price_addon) || 0)}
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })
//             )}
//           </div>
//         </div>

//         <div className="mt-4 flex items-center justify-between">
//           <div className="text-xs sm:text-sm text-slate-600">
//             {/* Harga <strong> flat </strong> per add-on. */}
//           </div>
//           <div className="flex items-center gap-3">
//             <div className="text-lg font-bold">{fmt(total)}</div>
//             <Button
//               className="bg-blue-600 hover:bg-blue-700"
//               disabled={submitting || total <= 0}
//               onClick={onCheckout}
//             >
//               {submitting ? "Processing…" : "Checkout"}
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }