// Helper yang join harga by duration_id (bukan code), tapi tetap nyaman dipakai UI yang pakai code/length.

export type ProductDetail = {
  product?: Array<{
    product_code: string;
    product_name: string;
    description?: string;
    status?: string;
  }>;
  durations?: Array<{
    id: number | string;
    code: string; // contoh: "M1", "M6", "M12" (dinamis dari backend)
    name: string; // contoh: "1 Bulan"
    length?: number; // opsional: 1, 6, 12 (jika ada)
    unit?: string;
  }>;
  packages?: Array<{
    package_code: string;
    name?: string;
    description?: string;
    status?: string;
    pricelist?: Array<{
      id?: string;
      package_code?: string;
      duration_id: number | string; // JOIN KEY
      duration_code?: string; // tidak dipakai untuk join
      price: string | number;
      discount?: string | number;
      effective_start?: string | null;
      effective_end?: string | null;
    }>;
  }>;
};

// Index hasil build, supaya lookup cepat.
export type PriceIndex = {
  // duration_id -> duration_code
  idToCode: Map<string, string>;
  // duration_code -> duration_id
  codeToId: Map<string, string>;
  // length (bulan) -> duration_code (mudah untuk UI yang pilih berdasarkan bulan)
  lengthToCode: Map<number, string>;
  // harga by [package_code][duration_code] = number
  priceByPkgAndDurCode: Record<string, Record<string, number>>;
  // simpan durations mentah untuk label dll.
  durations: NonNullable<ProductDetail["durations"]>;
};

/** Bangun index harga dan durasi. JOIN ketat by duration_id. */
export function buildPriceIndex(detail?: ProductDetail | null): PriceIndex {
  const durations = [...(detail?.durations ?? [])];

  const idToCode = new Map<string, string>();
  const codeToId = new Map<string, string>();
  const lengthToCode = new Map<number, string>();

  for (const d of durations) {
    const idStr = String(d.id);
    idToCode.set(idStr, d.code);
    codeToId.set(d.code, idStr);
    if (typeof d.length === "number") {
      lengthToCode.set(Number(d.length), d.code);
    }
  }

  const priceByPkgAndDurCode: Record<string, Record<string, number>> = {};
  for (const pkg of detail?.packages ?? []) {
    const inner: Record<string, number> = {};
    for (const pl of pkg.pricelist ?? []) {
      const durCode = idToCode.get(String(pl.duration_id));
      if (!durCode) continue; // abaikan jika duration_id tidak dikenal
      inner[durCode] = Number(pl.price ?? 0);
    }
    priceByPkgAndDurCode[pkg.package_code] = inner;
  }

  return { idToCode, codeToId, lengthToCode, priceByPkgAndDurCode, durations };
}

/** Label durasi ramah manusia dari duration_code. */
export function durationLabel(
  code: string,
  durations: PriceIndex["durations"]
) {
  return durations.find((d) => d.code === code)?.name ?? code;
}

/** Resolve duration_code dari jumlah bulan (jika API kirim length). */
export function resolveDurationCodeByMonths(idx: PriceIndex, months: number) {
  return idx.lengthToCode.get(Number(months)) ?? "";
}

/** Ambil harga berdasarkan package_code + duration_code. */
export function getPrice(
  idx: PriceIndex,
  pkgCode: string,
  durationCode: string
) {
  return idx.priceByPkgAndDurCode[pkgCode]?.[durationCode] ?? 0;
}
