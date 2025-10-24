"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { fetchProductDetail } from "@/lib/api";
import { buildPriceIndex, durationLabel, getPrice, type ProductDetail } from "@/lib/plan-utils";

type UpgradeModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  productCode: string;            // dari order lama
  currentPackageCode: string;     // contoh: "starter-package"
  currentDurationCode?: string;   // contoh: "M6" (boleh null)

  onConfirm: (opts: { package_code: string; duration_code: string }) => void;
  loading?: boolean;
};

export default function UpgradeModal({
  open, onOpenChange,
  productCode, currentPackageCode, currentDurationCode,
  onConfirm, loading,
}: UpgradeModalProps) {
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<string>("");
  const [selectedDurCode, setSelectedDurCode] = useState<string>("");

  const idx = useMemo(() => buildPriceIndex(detail), [detail]);
  const durations = idx.durations;
  const packages = useMemo(() => detail?.packages ?? [], [detail]);

  const estimated = useMemo(() => {
    if (!selectedPkg || !selectedDurCode) return 0;
    return getPrice(idx, selectedPkg, selectedDurCode);
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
        const hasCurrentPkg = pd.packages?.some(p => p.package_code === currentPackageCode);
        const defaultPkg = hasCurrentPkg ? currentPackageCode : (pd.packages?.[0]?.package_code ?? "");
        setSelectedPkg(defaultPkg);

        // Default durasi: durasi lama jika masih ada; jika tidak, durasi pertama.
        const hasOldDur = currentDurationCode && pd.durations?.some(d => d.code === currentDurationCode);
        const defaultDur = hasOldDur ? (currentDurationCode as string) : (pd.durations?.[0]?.code ?? "");
        setSelectedDurCode(defaultDur);
      } finally {
        setLoadingDetail(false);
      }
    })();
  }, [open, productCode, currentPackageCode, currentDurationCode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upgrade Paket</DialogTitle>
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
              <Label className="mb-2 block">Pilih Paket</Label>
              <Select value={selectedPkg} onValueChange={setSelectedPkg}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih paket" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((p) => (
                    <SelectItem key={p.package_code} value={p.package_code}>
                      {p.name ?? p.package_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pilih Durasi */}
            <div>
              <Label className="mb-2 block">Pilih Durasi</Label>
              <Select value={selectedDurCode} onValueChange={setSelectedDurCode}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih durasi" />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((d) => (
                    <SelectItem key={d.code} value={d.code}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estimasi Harga */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-sm text-slate-600">Harga:</div>
              <div className="text-xl font-semibold">
                {estimated > 0 ? `IDR ${estimated.toLocaleString("id-ID")}` : "-"}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button
            onClick={() => onConfirm({ package_code: selectedPkg, duration_code: selectedDurCode })}
            disabled={!selectedPkg || !selectedDurCode || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading
              ? "Memproses..."
              : `Konfirmasi Upgrade${selectedDurCode ? ` • ${durationLabel(selectedDurCode, durations)}` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
