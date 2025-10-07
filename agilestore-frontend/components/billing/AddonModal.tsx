// "use client";

// import * as React from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Checkbox } from "@/components/ui/checkbox";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Search, PackagePlus, X } from "lucide-react";
// import {
//   fetchAddonCatalog,
//   createAddonOrder,
//   type AddonCatalogItem,
// } from "@/lib/api";
// import { ensureSnap, openSnap } from "@/lib/midtrans";
// import { toast } from "@/hooks/use-toast";

// type Props = {
//   open: boolean;
//   onOpenChange: (v: boolean) => void;
//   productCode: string;
//   packageCode: string;
//   subscriptionInstanceId?: string | null;
// };

// export default function AddonModal({
//   open,
//   onOpenChange,
//   productCode,
//   packageCode,
//   subscriptionInstanceId,
// }: Props) {
//   const [loading, setLoading] = React.useState(false);
//   const [submitting, setSubmitting] = React.useState(false);
//   const [query, setQuery] = React.useState("");
//   const [items, setItems] = React.useState<AddonCatalogItem[]>([]);
//   const [currency, setCurrency] = React.useState("IDR");
//   const [selected, setSelected] = React.useState<Record<string, boolean>>({});

//   const filtered = React.useMemo(() => {
//     const q = query.trim().toLowerCase();
//     if (!q) return items;
//     return items.filter(
//       (i) =>
//         i.feature_code.toLowerCase().includes(q) ||
//         (i.feature_name || "").toLowerCase().includes(q) ||
//         (i.description || "").toLowerCase().includes(q)
//     );
//   }, [items, query]);

//   const total = React.useMemo(() => {
//     return Object.entries(selected)
//       .filter(([, v]) => v)
//       .map(([k]) => items.find((i) => i.feature_code === k)?.price || 0)
//       .reduce((a, b) => a + b, 0);
//   }, [selected, items]);

//   React.useEffect(() => {
//     if (!open) return;
//     const load = async () => {
//       try {
//         setLoading(true);
//         const res = await fetchAddonCatalog(productCode, packageCode);
//         setItems(res.items || []);
//         setCurrency(res.currency || "IDR");
//         setSelected({});
//       } catch (e: any) {
//         console.error(e);
//         toast({
//           variant: "destructive",
//           title: "Gagal memuat Add-ons",
//           description: String(e?.message ?? "Unknown error"),
//         });
//         setItems([]);
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, [open, productCode, packageCode]);

//   const formatPrice = (n: number) =>
//     `${currency} ${Number(n || 0).toLocaleString("id-ID")}`;

//   const toggle = (code: string, disabled?: boolean) => {
//     if (disabled) return;
//     setSelected((s) => ({ ...s, [code]: !s[code] }));
//   };

//   const submit = async () => {
//     const features = Object.entries(selected)
//       .filter(([, v]) => v)
//       .map(([k]) => k);

//     if (features.length === 0) {
//       toast({ variant: "destructive", title: "Pilih minimal 1 fitur add-on" });
//       return;
//     }

//     setSubmitting(true);
//     try {
//       const res = await createAddonOrder({
//         product_code: productCode,
//         features,
//         subscription_instance_id: subscriptionInstanceId || undefined,
//       });
//       await ensureSnap();
//       openSnap(res.snap_token, res.order_id);
//       onOpenChange(false);
//     } catch (e: any) {
//       console.error(e);
//       toast({
//         variant: "destructive",
//         title: "Gagal membuat order add-on",
//         description: String(e?.message ?? "Unknown error"),
//       });
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-2xl">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <PackagePlus className="h-5 w-5 text-blue-600" />
//             Add-ons
//           </DialogTitle>
//           <DialogDescription>
//             Pilih fitur tambahan untuk paket <b>{packageCode}</b> pada produk{" "}
//             <b>{productCode}</b>. Harga adalah flat per fitur (tanpa prorate).
//           </DialogDescription>
//         </DialogHeader>

//         <div className="space-y-4">
//           {/* Search */}
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
//             <Input
//               className="pl-9"
//               placeholder="Cari fitur add-on…"
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//             />
//           </div>

//           {/* List */}
//           <div className="border rounded-xl">
//             <ScrollArea className="max-h-[360px]">
//               <div className="divide-y">
//                 {loading && (
//                   <div className="p-6 text-slate-500 text-sm">
//                     Loading add-ons…
//                   </div>
//                 )}
//                 {!loading && filtered.length === 0 && (
//                   <div className="p-6 text-slate-500 text-sm">
//                     Tidak ada add-on yang cocok.
//                   </div>
//                 )}
//                 {!loading &&
//                   filtered.map((it) => {
//                     const disabled = it.included === true;
//                     const checked = !!selected[it.feature_code];
//                     return (
//                       <label
//                         key={it.feature_code}
//                         className={`flex items-start justify-between gap-3 p-4 ${
//                           disabled
//                             ? "opacity-60 cursor-not-allowed"
//                             : "cursor-pointer"
//                         }`}
//                         onClick={() => toggle(it.feature_code, disabled)}
//                       >
//                         <div className="flex items-start gap-3">
//                           <Checkbox
//                             checked={checked}
//                             disabled={disabled}
//                             onCheckedChange={() =>
//                               toggle(it.feature_code, disabled)
//                             }
//                           />
//                           <div>
//                             <div className="flex items-center gap-2">
//                               <span className="font-medium">
//                                 {it.feature_name || it.feature_code}
//                               </span>
//                               {disabled && (
//                                 <Badge variant="secondary">Included</Badge>
//                               )}
//                             </div>
//                             {it.description && (
//                               <p className="text-sm text-slate-600">
//                                 {it.description}
//                               </p>
//                             )}
//                           </div>
//                         </div>
//                         <div className="text-right font-semibold">
//                           {formatPrice(it.price)}
//                         </div>
//                       </label>
//                     );
//                   })}
//               </div>
//             </ScrollArea>
//           </div>

//           {/* Total */}
//           <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
//             <span className="text-sm text-slate-600">Total</span>
//             <span className="text-lg font-bold">{formatPrice(total)}</span>
//           </div>
//         </div>

//         <DialogFooter className="flex items-center justify-between gap-2">
//           <Button variant="outline" onClick={() => onOpenChange(false)}>
//             <X className="h-4 w-4 mr-2" />
//             Cancel
//           </Button>
//           <Button
//             className="bg-blue-600 hover:bg-blue-700"
//             disabled={submitting || total <= 0}
//             onClick={submit}
//           >
//             <PackagePlus className="h-4 w-4 mr-2" />
//             Proceed to Pay
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { fetchAddonCatalog, createAddonOrder, AddonItem } from "@/lib/api";
import { ensureSnap, openSnap } from "@/lib/midtrans";
import { toast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productCode: string;
  packageCode: string;
  subscriptionInstanceId?: string | null; // kalau perlu
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

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchAddonCatalog(productCode, packageCode)
      .then((res) => {
        setItems(res.items);
        setCurrency(res.currency);
        // reset pilihan
        setPicked({});
      })
      .catch((e) => toast({ variant: "destructive", title: "Gagal memuat add-on", description: String(e?.message || e) }))
      .finally(() => setLoading(false));
  }, [open, productCode, packageCode]);

  const selectable = useMemo(() => items.filter((i) => !i.included), [items]);

  const total = useMemo(
    () =>
      selectable
        .filter((i) => picked[i.feature_code])
        .reduce((s, i) => s + (i.price_addon || 0), 0),
    [selectable, picked]
  );

  const fmt = (n: number) => `${currency} ${Number(n || 0).toLocaleString("id-ID")}`;

  async function onCheckout() {
    const features = selectable.filter((i) => picked[i.feature_code]).map((i) => i.feature_code);
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
      toast({ variant: "destructive", title: "Gagal membuat order", description: String(e?.message ?? e) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add-on Features</DialogTitle>
        </DialogHeader>

        {/* List dengan scroll */}
        <div className="mt-2 border rounded-lg">
          <div className="max-h-80 overflow-y-auto pr-2 divide-y divide-slate-200">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Loading…</div>
            ) : (
              items.map((f) => {
                const disabled = f.included;
                const checked = disabled ? true : !!picked[f.feature_code];
                return (
                  <label
                    key={f.feature_code}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={checked}
                        onChange={(e) =>
                          setPicked((p) => ({ ...p, [f.feature_code]: e.target.checked }))
                        }
                        className="cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div className="text-sm">
                        <div className="font-medium">{f.name}</div>
                        <div className="text-xs text-slate-500">{f.feature_code}</div>
                      </div>
                      {f.included && (
                        <Badge variant="secondary" className="ml-2">Included</Badge>
                      )}
                    </div>
                    <div className="text-sm font-semibold">
                      {f.included ? `${currency} 0` : fmt(f.price_addon)}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Footer total */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Harga **flat** per fitur (tidak prorate)
          </div>
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold">{fmt(total)}</div>
            <Button className="bg-blue-600 hover:bg-blue-700" disabled={submitting || total <= 0} onClick={onCheckout}>
              {submitting ? "Processing…" : "Checkout"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}