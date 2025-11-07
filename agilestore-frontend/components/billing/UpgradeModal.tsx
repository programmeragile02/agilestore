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

type UpgradeModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  productCode: string; // dari order lama
  currentPackageCode: string; // contoh: "starter-package"
  currentDurationCode?: string; // contoh: "M6" (boleh null)

  onConfirm: (opts: { package_code: string; duration_code: string }) => void;
  loading?: boolean;
};

const TEXT = {
  en: {
    title: "Upgrade Package",
    pickPackage: "Choose Package",
    pickPackagePh: "Select package",
    pickDuration: "Choose Duration",
    pickDurationPh: "Select duration",
    price: "Price",
    cancel: "Cancel",
    processing: "Processing...",
    confirmPrefix: "Confirm Upgrade",
    originalLabel: "Original price",
    discountLabel: "Discount",
    totalLabel: "Total to pay",
    estimatedNote: "*estimated price",
  },
  id: {
    title: "Upgrade Paket",
    pickPackage: "Pilih Paket",
    pickPackagePh: "Pilih paket",
    pickDuration: "Pilih Durasi",
    pickDurationPh: "Pilih durasi",
    price: "Harga",
    cancel: "Batal",
    processing: "Memproses...",
    confirmPrefix: "Konfirmasi Upgrade",
    originalLabel: "Harga awal",
    discountLabel: "Diskon",
    totalLabel: "Total dibayar",
    estimatedNote: "*perkiraan harga",
  },
} as const;

export default function UpgradeModal({
  open,
  onOpenChange,
  productCode,
  currentPackageCode,
  currentDurationCode,
  onConfirm,
  loading,
}: UpgradeModalProps) {
  const { lang } = useLanguage();
  const L = TEXT[lang === "en" ? "en" : "id"];

  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<string>("");
  const [selectedDurCode, setSelectedDurCode] = useState<string>("");

  const idx = useMemo(() => buildPriceIndex(detail), [detail]);
  const durations = idx.durations;
  const packages = useMemo(() => detail?.packages ?? [], [detail]);

  const currency = (detail as any)?.product?.currency || "IDR";
  const locale = lang === "en" ? "en-US" : "id-ID";

  // estimated fallback dari util getPrice
  const estimated = useMemo(() => {
    if (!selectedPkg || !selectedDurCode) return 0;
    try {
      const val = getPrice(idx, selectedPkg, selectedDurCode);
      return Number(val || 0);
    } catch {
      return 0;
    }
  }, [idx, selectedPkg, selectedDurCode]);

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

        // Default paket: paket saat ini jika masih ada; jika tidak, paket pertama.
        const hasCurrentPkg = pd.packages?.some(
          (p) => p.package_code === currentPackageCode
        );
        const defaultPkg = hasCurrentPkg
          ? currentPackageCode
          : pd.packages?.[0]?.package_code ?? "";
        setSelectedPkg(defaultPkg);

        // Default durasi: durasi lama jika masih ada; jika tidak, durasi pertama.
        const hasOldDur =
          currentDurationCode &&
          pd.durations?.some((d) => d.code === currentDurationCode);
        const defaultDur = hasOldDur
          ? (currentDurationCode as string)
          : pd.durations?.[0]?.code ?? "";
        setSelectedDurCode(defaultDur);
      } finally {
        setLoadingDetail(false);
      }
    })();
  }, [open, productCode, currentPackageCode, currentDurationCode]);

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

  // cari pricelist row untuk selectedPkg + selectedDurCode dari `detail`
  const priceRow = useMemo(() => {
    try {
      if (!detail || !detail.packages) return null;
      const pkg = (detail.packages || []).find(
        (p: any) => String(p.package_code) === String(selectedPkg)
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
        // fallback by duration_code
        row =
          (pkg.pricelist || []).find(
            (r: any) =>
              String(r.duration_code || "").toUpperCase() ===
              String(selectedDurCode || "").toUpperCase()
          ) ?? null;
      }

      if (!row) {
        // final fallback: ambil pricelist pertama
        row = (pkg.pricelist || [])[0] ?? null;
      }

      return row;
    } catch {
      return null;
    }
  }, [detail, selectedPkg, selectedDurCode]);

  // compute original, discount, percent, final
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

  // Label durasi bilingual
  const labelForDuration = (code: string) => {
    const d = durations.find((x) => x.code === code);
    const fromApi =
      (lang === "en" ? (d as any)?.name_en : (d as any)?.name_id) ||
      (d as any)?.display_name ||
      d?.name;
    return fromApi || durationLabel(code, durations);
  };

  // Label paket bilingual
  const labelForPackage = (pkg: any) => {
    const byLang =
      (lang === "en" ? pkg?.name_en : pkg?.name_id) ||
      pkg?.display_name ||
      pkg?.name;
    return byLang ?? pkg?.package_code ?? "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{L.title}</DialogTitle>
        </DialogHeader>

        {loadingDetail ? (
          <div className="space-y-3">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-200 rounded" />
            <div className="h-5 w-40 bg-slate-200 rounded mt-4" />
            <div className="h-10 w-full bg-slate-200 rounded" />
            <div className="h-5 w-36 bg-slate-200 rounded mt-4" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Pilih Paket */}
            <div>
              <Label className="mb-2 block">{L.pickPackage}</Label>
              <Select value={selectedPkg} onValueChange={setSelectedPkg}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={L.pickPackagePh} />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((p) => (
                    <SelectItem key={p.package_code} value={p.package_code}>
                      {labelForPackage(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pilih Durasi */}
            <div>
              <Label className="mb-2 block">{L.pickDuration}</Label>
              <Select
                value={selectedDurCode}
                onValueChange={setSelectedDurCode}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={L.pickDurationPh} />
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

            {/* Rincian Harga (vertical) */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-sm text-slate-600 mb-2">{L.price}:</div>

              <div className="flex flex-col gap-2">
                {/* Harga awal */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    {L.originalLabel}
                  </div>
                  <div className={"text-sm text-slate-900"}>
                    {fmtMoney(priceCalc.original)}
                  </div>
                </div>

                {/* Discount */}
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
                  <div className="flex items-center justify-between opacity-60">
                    <div className="text-sm text-slate-500">{/* spacer */}</div>
                    <div className="text-sm text-slate-500">{/* spacer */}</div>
                  </div>
                )}

                <div className="border-t border-slate-200 mt-1 pt-2"></div>

                {/* Total */}
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-700">
                    {L.totalLabel}
                  </div>
                  <div className="text-xl font-semibold text-slate-900">
                    {priceCalc.final > 0 ? fmtMoney(priceCalc.final) : "-"}
                  </div>
                </div>

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
            onClick={() =>
              onConfirm({
                package_code: selectedPkg,
                duration_code: selectedDurCode,
              })
            }
            disabled={!selectedPkg || !selectedDurCode || loading}
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

// type UpgradeModalProps = {
//   open: boolean;
//   onOpenChange: (v: boolean) => void;

//   productCode: string; // dari order lama
//   currentPackageCode: string; // contoh: "starter-package"
//   currentDurationCode?: string; // contoh: "M6" (boleh null)

//   onConfirm: (opts: { package_code: string; duration_code: string }) => void;
//   loading?: boolean;
// };

// const TEXT = {
//   en: {
//     title: "Upgrade Package",
//     pickPackage: "Choose Package",
//     pickPackagePh: "Select package",
//     pickDuration: "Choose Duration",
//     pickDurationPh: "Select duration",
//     price: "Price",
//     cancel: "Cancel",
//     processing: "Processing...",
//     confirmPrefix: "Confirm Upgrade",
//   },
//   id: {
//     title: "Upgrade Paket",
//     pickPackage: "Pilih Paket",
//     pickPackagePh: "Pilih paket",
//     pickDuration: "Pilih Durasi",
//     pickDurationPh: "Pilih durasi",
//     price: "Harga",
//     cancel: "Batal",
//     processing: "Memproses...",
//     confirmPrefix: "Konfirmasi Upgrade",
//   },
// } as const;

// export default function UpgradeModal({
//   open,
//   onOpenChange,
//   productCode,
//   currentPackageCode,
//   currentDurationCode,
//   onConfirm,
//   loading,
// }: UpgradeModalProps) {
//   const { lang } = useLanguage();
//   const L = TEXT[lang === "en" ? "en" : "id"];

//   const [detail, setDetail] = useState<ProductDetail | null>(null);
//   const [loadingDetail, setLoadingDetail] = useState(false);
//   const [selectedPkg, setSelectedPkg] = useState<string>("");
//   const [selectedDurCode, setSelectedDurCode] = useState<string>("");

//   const idx = useMemo(() => buildPriceIndex(detail), [detail]);
//   const durations = idx.durations;
//   const packages = useMemo(() => detail?.packages ?? [], [detail]);

//   const currency = (detail as any)?.product?.currency || "IDR";
//   const locale = lang === "en" ? "en-US" : "id-ID";

//   const estimated = useMemo(() => {
//     if (!selectedPkg || !selectedDurCode) return 0;
//     return getPrice(idx, selectedPkg, selectedDurCode);
//   }, [idx, selectedPkg, selectedDurCode]);

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

//         // Default paket: paket saat ini jika masih ada; jika tidak, paket pertama.
//         const hasCurrentPkg = pd.packages?.some(
//           (p) => p.package_code === currentPackageCode
//         );
//         const defaultPkg = hasCurrentPkg
//           ? currentPackageCode
//           : pd.packages?.[0]?.package_code ?? "";
//         setSelectedPkg(defaultPkg);

//         // Default durasi: durasi lama jika masih ada; jika tidak, durasi pertama.
//         const hasOldDur =
//           currentDurationCode &&
//           pd.durations?.some((d) => d.code === currentDurationCode);
//         const defaultDur = hasOldDur
//           ? (currentDurationCode as string)
//           : pd.durations?.[0]?.code ?? "";
//         setSelectedDurCode(defaultDur);
//       } finally {
//         setLoadingDetail(false);
//       }
//     })();
//   }, [open, productCode, currentPackageCode, currentDurationCode]);

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

//   // Label durasi bilingual: utamakan field API bilingual bila ada
//   const labelForDuration = (code: string) => {
//     const d = durations.find((x) => x.code === code);
//     const fromApi =
//       (lang === "en" ? (d as any)?.name_en : (d as any)?.name_id) ||
//       (d as any)?.display_name ||
//       d?.name;
//     return fromApi || durationLabel(code, durations);
//   };

//   // Label paket bilingual: coba `name_en` / `name_id` jika tersedia
//   const labelForPackage = (pkg: any) => {
//     const byLang =
//       (lang === "en" ? pkg?.name_en : pkg?.name_id) ||
//       pkg?.display_name ||
//       pkg?.name;
//     return byLang ?? pkg?.package_code ?? "";
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-lg">
//         <DialogHeader>
//           <DialogTitle>{L.title}</DialogTitle>
//         </DialogHeader>

//         {loadingDetail ? (
//           <div className="space-y-3">
//             <div className="h-5 w-48 bg-slate-200 rounded" />
//             <div className="h-10 w-full bg-slate-200 rounded" />
//             <div className="h-5 w-40 bg-slate-200 rounded mt-4" />
//             <div className="h-10 w-full bg-slate-200 rounded" />
//             <div className="h-5 w-36 bg-slate-200 rounded mt-4" />
//           </div>
//         ) : (
//           <div className="space-y-5">
//             {/* Pilih Paket */}
//             <div>
//               <Label className="mb-2 block">{L.pickPackage}</Label>
//               <Select value={selectedPkg} onValueChange={setSelectedPkg}>
//                 <SelectTrigger className="w-full">
//                   <SelectValue placeholder={L.pickPackagePh} />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {packages.map((p) => (
//                     <SelectItem key={p.package_code} value={p.package_code}>
//                       {labelForPackage(p)}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             {/* Pilih Durasi */}
//             <div>
//               <Label className="mb-2 block">{L.pickDuration}</Label>
//               <Select
//                 value={selectedDurCode}
//                 onValueChange={setSelectedDurCode}
//               >
//                 <SelectTrigger className="w-full">
//                   <SelectValue placeholder={L.pickDurationPh} />
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

//             {/* Estimasi Harga */}
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
//             onClick={() =>
//               onConfirm({
//                 package_code: selectedPkg,
//                 duration_code: selectedDurCode,
//               })
//             }
//             disabled={!selectedPkg || !selectedDurCode || loading}
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

// type UpgradeModalProps = {
//   open: boolean;
//   onOpenChange: (v: boolean) => void;

//   productCode: string;            // dari order lama
//   currentPackageCode: string;     // contoh: "starter-package"
//   currentDurationCode?: string;   // contoh: "M6" (boleh null)

//   onConfirm: (opts: { package_code: string; duration_code: string }) => void;
//   loading?: boolean;
// };

// export default function UpgradeModal({
//   open, onOpenChange,
//   productCode, currentPackageCode, currentDurationCode,
//   onConfirm, loading,
// }: UpgradeModalProps) {
//   const [detail, setDetail] = useState<ProductDetail | null>(null);
//   const [loadingDetail, setLoadingDetail] = useState(false);
//   const [selectedPkg, setSelectedPkg] = useState<string>("");
//   const [selectedDurCode, setSelectedDurCode] = useState<string>("");

//   const idx = useMemo(() => buildPriceIndex(detail), [detail]);
//   const durations = idx.durations;
//   const packages = useMemo(() => detail?.packages ?? [], [detail]);

//   const estimated = useMemo(() => {
//     if (!selectedPkg || !selectedDurCode) return 0;
//     return getPrice(idx, selectedPkg, selectedDurCode);
//   }, [idx, selectedPkg, selectedDurCode]);

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

//         // Default paket: paket saat ini jika masih ada; jika tidak, paket pertama.
//         const hasCurrentPkg = pd.packages?.some(p => p.package_code === currentPackageCode);
//         const defaultPkg = hasCurrentPkg ? currentPackageCode : (pd.packages?.[0]?.package_code ?? "");
//         setSelectedPkg(defaultPkg);

//         // Default durasi: durasi lama jika masih ada; jika tidak, durasi pertama.
//         const hasOldDur = currentDurationCode && pd.durations?.some(d => d.code === currentDurationCode);
//         const defaultDur = hasOldDur ? (currentDurationCode as string) : (pd.durations?.[0]?.code ?? "");
//         setSelectedDurCode(defaultDur);
//       } finally {
//         setLoadingDetail(false);
//       }
//     })();
//   }, [open, productCode, currentPackageCode, currentDurationCode]);

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-lg">
//         <DialogHeader>
//           <DialogTitle>Upgrade Paket</DialogTitle>
//         </DialogHeader>

//         {loadingDetail ? (
//           <div className="space-y-3">
//             <div className="h-5 w-48 bg-slate-200 rounded" />
//             <div className="h-10 w-full bg-slate-200 rounded" />
//             <div className="h-5 w-40 bg-slate-200 rounded mt-4" />
//             <div className="h-10 w-full bg-slate-200 rounded" />
//             <div className="h-5 w-36 bg-slate-200 rounded mt-4" />
//           </div>
//         ) : (
//           <div className="space-y-5">
//             {/* Pilih Paket */}
//             <div>
//               <Label className="mb-2 block">Pilih Paket</Label>
//               <Select value={selectedPkg} onValueChange={setSelectedPkg}>
//                 <SelectTrigger className="w-full">
//                   <SelectValue placeholder="Pilih paket" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {packages.map((p) => (
//                     <SelectItem key={p.package_code} value={p.package_code}>
//                       {p.name ?? p.package_code}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             </div>

//             {/* Pilih Durasi */}
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

//             {/* Estimasi Harga */}
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
//             onClick={() => onConfirm({ package_code: selectedPkg, duration_code: selectedDurCode })}
//             disabled={!selectedPkg || !selectedDurCode || loading}
//             className="bg-blue-600 hover:bg-blue-700"
//           >
//             {loading
//               ? "Memproses..."
//               : `Konfirmasi Upgrade${selectedDurCode ? ` • ${durationLabel(selectedDurCode, durations)}` : ""}`}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }
