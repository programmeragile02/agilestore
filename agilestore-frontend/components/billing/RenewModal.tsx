"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { fetchProductDetail } from "@/lib/api";
import { buildPriceIndex, durationLabel, getPrice, type ProductDetail } from "@/lib/plan-utils";

type RenewModalProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  productCode: string;           // dari order lama
  packageCode: string;           // dari order lama
  currentDurationCode?: string;  // contoh: "M12" (kalau ada)

  onConfirm: (opts: { duration_code: string }) => void;
  loading?: boolean;
};

export default function RenewModal({
  open, onOpenChange,
  productCode, packageCode, currentDurationCode,
  onConfirm, loading,
}: RenewModalProps) {
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedDurCode, setSelectedDurCode] = useState<string>("");

  const idx = useMemo(() => buildPriceIndex(detail), [detail]);
  const durations = idx.durations;

  const estimated = useMemo(() => {
    if (!selectedDurCode) return 0;
    return getPrice(idx, packageCode, selectedDurCode);
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

        // default durasi: pakai durasi lama jika masih ada, else ambil pertama
        const hasOld = currentDurationCode && pd.durations?.some(d => d.code === currentDurationCode);
        setSelectedDurCode(hasOld ? (currentDurationCode as string) : (pd.durations?.[0]?.code ?? ""));
      } finally {
        setLoadingDetail(false);
      }
    })();
  }, [open, productCode, currentDurationCode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Perpanjang Langganan</DialogTitle>
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
            onClick={() => onConfirm({ duration_code: selectedDurCode })}
            disabled={!selectedDurCode || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading
              ? "Memproses..."
              : `Konfirmasi Perpanjang${selectedDurCode ? ` • ${durationLabel(selectedDurCode, durations)}` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}