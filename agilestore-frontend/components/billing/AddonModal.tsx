// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
// import { fetchAddonCatalog, createAddonOrder, AddonItem } from "@/lib/api";
// import { ensureSnap, openSnap } from "@/lib/midtrans";
// import { toast } from "@/hooks/use-toast";

// type Props = {
//   open: boolean;
//   onOpenChange: (v: boolean) => void;
//   productCode: string;
//   packageCode: string;
//   subscriptionInstanceId?: string | null; // kalau perlu
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

//   useEffect(() => {
//     if (!open) return;
//     setLoading(true);
//     fetchAddonCatalog(productCode, packageCode)
//       .then((res) => {
//         setItems(res.items);
//         setCurrency(res.currency);
//         // reset pilihan
//         setPicked({});
//       })
//       .catch((e) => toast({ variant: "destructive", title: "Gagal memuat add-on", description: String(e?.message || e) }))
//       .finally(() => setLoading(false));
//   }, [open, productCode, packageCode]);

//   const selectable = useMemo(() => items.filter((i) => !i.included), [items]);

//   const total = useMemo(
//     () =>
//       selectable
//         .filter((i) => picked[i.feature_code])
//         .reduce((s, i) => s + (i.price_addon || 0), 0),
//     [selectable, picked]
//   );

//   const fmt = (n: number) => `${currency} ${Number(n || 0).toLocaleString("id-ID")}`;

//   async function onCheckout() {
//     const features = selectable.filter((i) => picked[i.feature_code]).map((i) => i.feature_code);
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
//       toast({ variant: "destructive", title: "Gagal membuat order", description: String(e?.message ?? e) });
//     } finally {
//       setSubmitting(false);
//     }
//   }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-2xl">
//         <DialogHeader>
//           <DialogTitle>Add-on Features</DialogTitle>
//         </DialogHeader>

//         {/* List dengan scroll */}
//         <div className="mt-2 border rounded-lg">
//           <div className="max-h-80 overflow-y-auto pr-2 divide-y divide-slate-200">
//             {loading ? (
//               <div className="p-4 text-sm text-slate-500">Loading…</div>
//             ) : (
//               items.map((f) => {
//                 const disabled = f.included;
//                 const checked = disabled ? true : !!picked[f.feature_code];
//                 return (
//                   <label
//                     key={f.feature_code}
//                     className="flex items-center justify-between gap-3 px-4 py-3"
//                   >
//                     <div className="flex items-center gap-3">
//                       <input
//                         type="checkbox"
//                         disabled={disabled}
//                         checked={checked}
//                         onChange={(e) =>
//                           setPicked((p) => ({ ...p, [f.feature_code]: e.target.checked }))
//                         }
//                         className="cursor-pointer disabled:cursor-not-allowed"
//                       />
//                       <div className="text-sm">
//                         <div className="font-medium">{f.name}</div>
//                         <div className="text-xs text-slate-500">{f.feature_code}</div>
//                       </div>
//                       {f.included && (
//                         <Badge variant="secondary" className="ml-2">Included</Badge>
//                       )}
//                     </div>
//                     <div className="text-sm font-semibold">
//                       {f.included ? `${currency} 0` : fmt(f.price_addon)}
//                     </div>
//                   </label>
//                 );
//               })
//             )}
//           </div>
//         </div>

//         {/* Footer total */}
//         <div className="mt-4 flex items-center justify-between">
//           <div className="text-sm text-slate-600">
//             Harga **flat** per fitur (tidak prorate)
//           </div>
//           <div className="flex items-center gap-3">
//             <div className="text-lg font-bold">{fmt(total)}</div>
//             <Button className="bg-blue-600 hover:bg-blue-700" disabled={submitting || total <= 0} onClick={onCheckout}>
//               {submitting ? "Processing…" : "Checkout"}
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }

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
import {
  fetchAddonCatalog,
  createAddonOrder,
  type AddonItem,
} from "@/lib/api";
import { ensureSnap, openSnap } from "@/lib/midtrans";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productCode: string;
  packageCode?: string | null;
  subscriptionInstanceId?: string | null;
};

export default function AddonModal({
  open,
  onOpenChange,
  productCode,
  packageCode,
  subscriptionInstanceId,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AddonItem[]>([]);
  const [currency, setCurrency] = useState<"IDR" | string>("IDR");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchAddonCatalog(productCode, packageCode ?? null, subscriptionInstanceId ?? null)
      .then((res) => {
        const list = res.items || [];
        setItems(list);
        setCurrency(res.currency || "IDR");
        setExpanded({});

        // ✅ Default: yang included/purchased -> checked & non-editable
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
          title: "Gagal memuat add-on",
          description: String(e?.message ?? e),
        })
      )
      .finally(() => setLoading(false));
  }, [open, productCode, packageCode, subscriptionInstanceId]);

  // hanya parent berharga ditampilkan (anak via toggle)
  const visibleParents = useMemo(
    () => items.filter((f) => (Number(f.price_addon) || 0) > 0),
    [items]
  );

  const fmt = (n: number) =>
    `${currency} ${Number(n || 0).toLocaleString("id-ID")}`;

  // ✅ Total hanya dari yang user centang & BISA dibeli (bukan included/purchased)
  const total = useMemo(
    () =>
      visibleParents
        .filter(
          (p) =>
            picked[p.feature_code] && !p.included && !p.purchased
        )
        .reduce((s, p) => s + (Number(p.price_addon) || 0), 0),
    [visibleParents, picked]
  );

  async function onCheckout() {
    // hanya parent yang dipilih & bisa dibeli
    const features = visibleParents
      .filter((p) => picked[p.feature_code] && !p.included && !p.purchased)
      .map((p) => p.feature_code);

    if (features.length === 0) {
      toast({ variant: "destructive", title: "Belum ada add-on dipilih" });
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
        title: "Gagal membuat order",
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
          <DialogTitle>Beli Add On</DialogTitle>
          <DialogDescription>
            Pilih add on <strong> berbayar</strong>. Jika ada fitur di bawahnya akan
            aktif otomatis tanpa biaya tambahan.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 border rounded-lg">
          <div className="max-h-80 overflow-y-auto divide-y">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Loading…</div>
            ) : visibleParents.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                Tidak ada add-on berbayar untuk ditampilkan.
              </div>
            ) : (
              visibleParents.map((p) => {
                const kids = p.children || [];
                const isOpen = !!expanded[p.feature_code];
                const disabled = !!p.included || !!p.purchased;
                const checked = !!picked[p.feature_code]; // default true utk included/purchased

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

                          {/* badges di bawah nama */}
                          <div className="mt-1 flex flex-wrap gap-2">
                            {p.included && (
                              <Badge variant="secondary">Termasuk paket</Badge>
                            )}
                            {p.purchased && (
                              <Badge className="bg-emerald-100 text-emerald-700">
                                Sudah dibeli
                              </Badge>
                            )}
                          </div>

                          {/* toggle anak di bawah nama */}
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
                                  Sembunyikan
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-1" />
                                  Mencakup{" "}{kids.length}{" "}fitur
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
          <div className="text-xs sm:text-sm text-slate-600">
            {/* Harga <strong> flat </strong> per add-on. */}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold">{fmt(total)}</div>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              disabled={submitting || total <= 0}
              onClick={onCheckout}
            >
              {submitting ? "Processing…" : "Checkout"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}