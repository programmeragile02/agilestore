"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { fetchProductDetail } from "@/lib/api";
import {
  buildPriceIndex,
  durationLabel,
  getPrice,
  type ProductDetail,
} from "@/lib/plan-utils";
import { useLanguage } from "@/components/LanguageProvider";

type RenewModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  productCode: string;
  packageCode: string;
  currentDurationCode?: string;

  onConfirm: (opts: { duration_code: string }) => void;
  loading?: boolean;
};

/** Static UI copy */
const TEXT = {
  en: {
    title: "Renew Subscription",
    chooseDuration: "Choose Duration",
    placeholder: "Select duration",
    price: "Price",
    cancel: "Cancel",
    processing: "Processing...",
    confirmPrefix: "Confirm Renewal",
    originalLabel: "Original price",
    discountLabel: "Discount",
    totalLabel: "Total to pay",
    estimatedNote: "*estimated price",
  },
  id: {
    title: "Perpanjang Langganan",
    chooseDuration: "Pilih Durasi",
    placeholder: "Pilih durasi",
    price: "Harga",
    cancel: "Batal",
    processing: "Memproses...",
    confirmPrefix: "Konfirmasi Perpanjang",
    originalLabel: "Harga awal",
    discountLabel: "Diskon",
    totalLabel: "Total dibayar",
    estimatedNote: "*perkiraan harga",
  },
} as const;

export default function RenewModal({
  open,
  onOpenChange,
  productCode,
  packageCode,
  currentDurationCode,
  onConfirm,
  loading,
}: RenewModalProps) {
  const { lang } = useLanguage();
  const L = TEXT[lang === "en" ? "en" : "id"];

  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedDurCode, setSelectedDurCode] = useState<string>("");

  const idx = useMemo(() => buildPriceIndex(detail), [detail]);
  const durations = idx.durations;

  const currency = (detail as any)?.product?.currency || "IDR";
  const locale = lang === "en" ? "en-US" : "id-ID";

  // estimated fallback dari util getPrice
  const estimated = useMemo(() => {
    if (!selectedDurCode) return 0;
    try {
      const val = getPrice(idx, packageCode, selectedDurCode);
      return Number(val || 0);
    } catch {
      return 0;
    }
  }, [idx, packageCode, selectedDurCode]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoadingDetail(true);
      try {
        const res = await fetchProductDetail(productCode);
        const pd: ProductDetail = {
          product: res?.product,
          packages: res?.packages ?? [],
          durations: res?.durations ?? [],
        };
        setDetail(pd);

        const hasOld =
          currentDurationCode &&
          pd.durations?.some((d) => d.code === currentDurationCode);
        setSelectedDurCode(
          hasOld
            ? (currentDurationCode as string)
            : pd.durations?.[0]?.code ?? ""
        );
      } finally {
        setLoadingDetail(false);
      }
    })();
  }, [open, productCode, currentDurationCode]);

  const fmtMoney = (n: number) => {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(Number(n || 0));
    } catch {
      return `${currency} ${Number(n || 0).toLocaleString(locale)}`;
    }
  };

  // ambil pricelist row untuk packageCode + selectedDurCode dari `detail`
  const priceRow = useMemo(() => {
    try {
      if (!detail || !detail.packages) return null;
      const pkg = (detail.packages || []).find(
        (p: any) => String(p.package_code) === String(packageCode)
      );
      if (!pkg) return null;

      const durObj =
        (detail.durations || []).find(
          (d: any) => String(d.code) === String(selectedDurCode)
        ) ?? null;

      let row =
        (pkg.pricelist || []).find(
          (r: any) =>
            durObj &&
            r.duration_id != null &&
            Number(r.duration_id) === Number(durObj.id)
        ) ?? null;

      if (!row) {
        row =
          (pkg.pricelist || []).find(
            (r: any) =>
              String(r.duration_code || "").toUpperCase() ===
              String(selectedDurCode || "").toUpperCase()
          ) ?? null;
      }

      if (!row) {
        row = (pkg.pricelist || [])[0] ?? null;
      }

      return row;
    } catch {
      return null;
    }
  }, [detail, packageCode, selectedDurCode]);

  // compute original, discount, percent, final (robust terhadap format)
  const priceCalc = useMemo(() => {
    if (!priceRow) {
      return {
        original: Number(estimated || 0),
        discountAmount: 0,
        discountPercent: 0,
        final: Number(estimated || 0),
        source: "estimated" as const,
      };
    }

    const rawPrice = Number(priceRow.price ?? 0) || 0;

    let discountAmount = 0;
    let discountPercent = 0;
    const dRaw = priceRow.discount ?? null;

    if (dRaw != null) {
      if (typeof dRaw === "string" && dRaw.includes("%")) {
        discountPercent = parseFloat(String(dRaw).replace(/[^\d.]/g, "")) || 0;
        discountAmount = Math.round((rawPrice * discountPercent) / 100);
      } else {
        const n = Number(String(dRaw).replace(/[^\d.-]/g, ""));
        if (!Number.isNaN(n) && Number.isFinite(n) && n !== 0) {
          discountAmount = Math.round(n);
          if (rawPrice > 0) {
            discountPercent =
              Math.round((discountAmount / rawPrice) * 100 * 100) / 100;
          }
        }
      }
    }

    const final = Math.max(
      0,
      Math.round(rawPrice) - Math.round(discountAmount)
    );

    return {
      original: Math.round(rawPrice),
      discountAmount: Math.round(discountAmount),
      discountPercent: Number.isFinite(discountPercent) ? discountPercent : 0,
      final: final,
      source: "pricelist" as const,
    };
  }, [priceRow, estimated]);

  // friendly label for duration
  const labelForDuration = (code: string) => {
    const d = durations.find((x) => x.code === code);
    const fromApi =
      (lang === "en" ? (d as any)?.name_en : (d as any)?.name_id) ||
      (d as any)?.display_name ||
      d?.name;
    return fromApi || durationLabel(code, durations);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{L.title}</DialogTitle>
        </DialogHeader>

        {loadingDetail ? (
          <div className="space-y-3">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-200 rounded" />
            <div className="h-5 w-32 bg-slate-200 rounded mt-4" />
            <div className="h-6 w-56 bg-slate-200 rounded" />
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block">{L.chooseDuration}</Label>
              <Select
                value={selectedDurCode}
                onValueChange={setSelectedDurCode}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={L.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((d) => (
                    <SelectItem key={d.code} value={d.code}>
                      {labelForDuration(d.code)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rincian harga: vertical layout */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-sm text-slate-600 mb-2">{L.price}:</div>

              <div className="flex flex-col gap-2">
                {/* Harga awal (coret jika ada diskon) */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    {L.originalLabel}
                  </div>
                  <div
                    className={
                      "text-sm text-slate-900"
                    }
                  >
                    {fmtMoney(priceCalc.original)}
                  </div>
                </div>

                {/* Discount row (persen besar + nominal kecil) */}
                {priceCalc.discountAmount > 0 ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-slate-900">
                        {L.discountLabel}
                      </div>
                      <div className="text-sm font-medium text-red-600">
                        {priceCalc.discountPercent > 0
                          ? `-${priceCalc.discountPercent}%`
                          : `-${fmtMoney(priceCalc.discountAmount)}`}
                      </div>
                    </div>
                    <div className="text-sm text-red-600">
                      -{fmtMoney(priceCalc.discountAmount)}
                    </div>
                  </div>
                ) : (
                  // kalau tidak ada diskon, munculkan bar kecil kosong atau nothing
                  <div className="flex items-center justify-between opacity-60">
                    <div className="text-sm text-slate-500">{/* spacer */}</div>
                    <div className="text-sm text-slate-500">{/* spacer */}</div>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-slate-200 mt-1 pt-2"></div>

                {/* Total yang dibayar */}
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-700">
                    {L.totalLabel}
                  </div>
                  <div className="text-xl font-semibold text-slate-900">
                    {priceCalc.final > 0 ? fmtMoney(priceCalc.final) : "-"}
                  </div>
                </div>

                {/* Estimation note */}
                {priceCalc.source === "estimated" && (
                  <div className="text-xs text-slate-500">
                    {L.estimatedNote}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {L.cancel}
          </Button>
          <Button
            onClick={() => onConfirm({ duration_code: selectedDurCode })}
            disabled={!selectedDurCode || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading
              ? L.processing
              : `${L.confirmPrefix}${
                  selectedDurCode
                    ? ` • ${labelForDuration(selectedDurCode)}`
                    : ""
                }`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// "use client";

// import { useEffect, useMemo, useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";
// import { fetchProductDetail } from "@/lib/api";
// import {
//   buildPriceIndex,
//   durationLabel,
//   getPrice,
//   type ProductDetail,
// } from "@/lib/plan-utils";
// import { useLanguage } from "@/components/LanguageProvider";

// type RenewModalProps = {
//   open: boolean;
//   onOpenChange: (v: boolean) => void;

//   productCode: string; // dari order lama
//   packageCode: string; // dari order lama
//   currentDurationCode?: string; // contoh: "M12" (kalau ada)

//   onConfirm: (opts: { duration_code: string }) => void;
//   loading?: boolean;
// };

// /** Static UI copy */
// const TEXT = {
//   en: {
//     title: "Renew Subscription",
//     chooseDuration: "Choose Duration",
//     placeholder: "Select duration",
//     price: "Price",
//     cancel: "Cancel",
//     processing: "Processing...",
//     confirmPrefix: "Confirm Renewal",
//   },
//   id: {
//     title: "Perpanjang Langganan",
//     chooseDuration: "Pilih Durasi",
//     placeholder: "Pilih durasi",
//     price: "Harga",
//     cancel: "Batal",
//     processing: "Memproses...",
//     confirmPrefix: "Konfirmasi Perpanjang",
//   },
// } as const;

// export default function RenewModal({
//   open,
//   onOpenChange,
//   productCode,
//   packageCode,
//   currentDurationCode,
//   onConfirm,
//   loading,
// }: RenewModalProps) {
//   const { lang } = useLanguage();
//   const L = TEXT[lang === "en" ? "en" : "id"];

//   const [detail, setDetail] = useState<ProductDetail | null>(null);
//   const [loadingDetail, setLoadingDetail] = useState(false);
//   const [selectedDurCode, setSelectedDurCode] = useState<string>("");

//   const idx = useMemo(() => buildPriceIndex(detail), [detail]);
//   const durations = idx.durations;

//   const currency = (detail as any)?.product?.currency || "IDR";
//   const locale = lang === "en" ? "en-US" : "id-ID";

//   const estimated = useMemo(() => {
//     if (!selectedDurCode) return 0;
//     return getPrice(idx, packageCode, selectedDurCode);
//   }, [idx, packageCode, selectedDurCode]);

//   useEffect(() => {
//     if (!open) return;
//     (async () => {
//       setLoadingDetail(true);
//       try {
//         const res = await fetchProductDetail(productCode);
//         const pd: ProductDetail = {
//           product: res?.product,
//           packages: res?.packages ?? [],
//           durations: res?.durations ?? [],
//         };
//         setDetail(pd);

//         // default durasi: pakai durasi lama jika masih ada, else ambil pertama
//         const hasOld =
//           currentDurationCode &&
//           pd.durations?.some((d) => d.code === currentDurationCode);
//         setSelectedDurCode(
//           hasOld
//             ? (currentDurationCode as string)
//             : pd.durations?.[0]?.code ?? ""
//         );
//       } finally {
//         setLoadingDetail(false);
//       }
//     })();
//   }, [open, productCode, currentDurationCode]);

//   const fmtMoney = (n: number) => {
//     try {
//       return new Intl.NumberFormat(locale, {
//         style: "currency",
//         currency,
//         maximumFractionDigits: 0,
//       }).format(Number(n || 0));
//     } catch {
//       return `${currency} ${Number(n || 0).toLocaleString(locale)}`;
//     }
//   };

//   // Label durasi yang ramah bahasa
//   const labelForDuration = (code: string) => {
//     // prioritas: nama dari API jika punya field bilingual
//     const d = durations.find((x) => x.code === code);
//     const fromApi =
//       (lang === "en" ? (d as any)?.name_en : (d as any)?.name_id) ||
//       (d as any)?.display_name ||
//       d?.name;
//     return fromApi || durationLabel(code, durations);
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-lg">
//         <DialogHeader>
//           <DialogTitle>{L.title}</DialogTitle>
//         </DialogHeader>

//         {loadingDetail ? (
//           <div className="space-y-3">
//             <div className="h-5 w-40 bg-slate-200 rounded" />
//             <div className="h-10 w-full bg-slate-200 rounded" />
//             <div className="h-5 w-32 bg-slate-200 rounded mt-4" />
//             <div className="h-6 w-56 bg-slate-200 rounded" />
//           </div>
//         ) : (
//           <div className="space-y-5">
//             <div>
//               <Label className="mb-2 block">{L.chooseDuration}</Label>
//               <Select
//                 value={selectedDurCode}
//                 onValueChange={setSelectedDurCode}
//               >
//                 <SelectTrigger className="w-full">
//                   <SelectValue placeholder={L.placeholder} />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {durations.map((d) => (
//                     <SelectItem key={d.code} value={d.code}>
//                       {labelForDuration(d.code)}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
//               <div className="text-sm text-slate-600">{L.price}:</div>
//               <div className="text-xl font-semibold">
//                 {estimated > 0 ? fmtMoney(estimated) : "-"}
//               </div>
//             </div>
//           </div>
//         )}

//         <DialogFooter>
//           <Button variant="outline" onClick={() => onOpenChange(false)}>
//             {L.cancel}
//           </Button>
//           <Button
//             onClick={() => onConfirm({ duration_code: selectedDurCode })}
//             disabled={!selectedDurCode || loading}
//             className="bg-blue-600 hover:bg-blue-700"
//           >
//             {loading
//               ? L.processing
//               : `${L.confirmPrefix}${
//                   selectedDurCode
//                     ? ` • ${labelForDuration(selectedDurCode)}`
//                     : ""
//                 }`}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
// import { fetchProductDetail } from "@/lib/api";
// import { buildPriceIndex, durationLabel, getPrice, type ProductDetail } from "@/lib/plan-utils";

// type RenewModalProps = {
//   open: boolean;
//   onOpenChange: (v: boolean) => void;

//   productCode: string;           // dari order lama
//   packageCode: string;           // dari order lama
//   currentDurationCode?: string;  // contoh: "M12" (kalau ada)

//   onConfirm: (opts: { duration_code: string }) => void;
//   loading?: boolean;
// };

// export default function RenewModal({
//   open, onOpenChange,
//   productCode, packageCode, currentDurationCode,
//   onConfirm, loading,
// }: RenewModalProps) {
//   const [detail, setDetail] = useState<ProductDetail | null>(null);
//   const [loadingDetail, setLoadingDetail] = useState(false);
//   const [selectedDurCode, setSelectedDurCode] = useState<string>("");

//   const idx = useMemo(() => buildPriceIndex(detail), [detail]);
//   const durations = idx.durations;

//   const estimated = useMemo(() => {
//     if (!selectedDurCode) return 0;
//     return getPrice(idx, packageCode, selectedDurCode);
//   }, [idx, packageCode, selectedDurCode]);

//   useEffect(() => {
//     if (!open) return;
//     (async () => {
//       setLoadingDetail(true);
//       try {
//         const res = await fetchProductDetail(productCode);
//         const pd: ProductDetail = {
//           product: res?.product,
//           packages: res?.packages ?? [],
//           durations: res?.durations ?? [],
//         };
//         setDetail(pd);

//         // default durasi: pakai durasi lama jika masih ada, else ambil pertama
//         const hasOld = currentDurationCode && pd.durations?.some(d => d.code === currentDurationCode);
//         setSelectedDurCode(hasOld ? (currentDurationCode as string) : (pd.durations?.[0]?.code ?? ""));
//       } finally {
//         setLoadingDetail(false);
//       }
//     })();
//   }, [open, productCode, currentDurationCode]);

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-lg">
//         <DialogHeader>
//           <DialogTitle>Perpanjang Langganan</DialogTitle>
//         </DialogHeader>

//         {loadingDetail ? (
//           <div className="space-y-3">
//             <div className="h-5 w-40 bg-slate-200 rounded" />
//             <div className="h-10 w-full bg-slate-200 rounded" />
//             <div className="h-5 w-32 bg-slate-200 rounded mt-4" />
//             <div className="h-6 w-56 bg-slate-200 rounded" />
//           </div>
//         ) : (
//           <div className="space-y-5">
//             <div>
//               <Label className="mb-2 block">Pilih Durasi</Label>
//               <Select value={selectedDurCode} onValueChange={setSelectedDurCode}>
//                 <SelectTrigger className="w-full">
//                   <SelectValue placeholder="Pilih durasi" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {durations.map((d) => (
//                     <SelectItem key={d.code} value={d.code}>
//                       {d.name}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
//               <div className="text-sm text-slate-600">Harga:</div>
//               <div className="text-xl font-semibold">
//                 {estimated > 0 ? `IDR ${estimated.toLocaleString("id-ID")}` : "-"}
//               </div>
//             </div>
//           </div>
//         )}

//         <DialogFooter>
//           <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
//           <Button
//             onClick={() => onConfirm({ duration_code: selectedDurCode })}
//             disabled={!selectedDurCode || loading}
//             className="bg-blue-600 hover:bg-blue-700"
//           >
//             {loading
//               ? "Memproses..."
//               : `Konfirmasi Perpanjang${selectedDurCode ? ` • ${durationLabel(selectedDurCode, durations)}` : ""}`}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }
