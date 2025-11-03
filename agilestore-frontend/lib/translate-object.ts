// lib/translate-object.ts
import {
  translateBatch,
  type TranslateBatchOptions,
} from "@/lib/translate-batch";

/** Opsi filter tambahan */
type TranslateObjectOptions = TranslateBatchOptions & {
  /** Skip key tertentu (misal warna, kode, dsb.) */
  skipKeys?: (keyPath: string[]) => boolean;
  /** Skip value tertentu (misal URL, hex color) */
  skipValue?: (value: string, keyPath: string[]) => boolean;
  /** Jika true, string kosong juga diterjemahkan (default: false = lewati) */
  includeEmpty?: boolean;
};

/** Deteksi string yang sebaiknya di-skip (URL, hex color, email, dsb.) */
function defaultSkipValue(value: string): boolean {
  const v = value.trim();
  if (!v) return true; // kosong: biasanya tidak perlu diterjemahkan
  // URL
  if (/^(https?:)?\/\//i.test(v)) return true;
  // HEX color
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return true;
  // Email / phone-ish
  if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(v)) return true;
  if (/^\+?\d[\d\s().-]{4,}$/.test(v)) return true;
  // Icon/name token (kebab/camel) pendek
  if (/^[a-z0-9-_.]{1,24}$/i.test(v) && v.indexOf(" ") === -1) return true;
  return false;
}

/** Walk object dan kumpulkan semua path + string */
function collectLeafStrings(
  node: unknown,
  basePath: string[],
  out: { path: string[]; value: string }[],
  opts: TranslateObjectOptions
) {
  if (node == null) return;
  if (typeof node === "string") {
    const keyPath = basePath;
    const shouldSkipKey = opts.skipKeys?.(keyPath) ?? false;
    const shouldSkipVal =
      opts.skipValue?.(node, keyPath) ?? defaultSkipValue(node);

    if (!shouldSkipKey && (!shouldSkipVal || opts.includeEmpty)) {
      out.push({ path: [...keyPath], value: node });
    }
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((child, idx) =>
      collectLeafStrings(child, [...basePath, String(idx)], out, opts)
    );
    return;
  }

  if (typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      collectLeafStrings(v, [...basePath, k], out, opts);
    }
  }
}

/** Tulis balik ke object sesuai path */
function setByPath(target: any, path: string[], value: string) {
  let cur = target;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    if (cur[key] == null || typeof cur[key] !== "object") {
      // buat node intermediates sesuai bentuk index/obj
      cur[key] = /^\d+$/.test(path[i + 1] ?? "") ? [] : {};
    }
    cur = cur[key];
  }
  cur[path[path.length - 1]!] = value;
}

/**
 * Terjemahkan SEMUA leaf-string dalam object (nested/array) pakai translateBatch.
 * Mengembalikan SALINAN object dengan nilai yang sudah diterjemahkan.
 */
export async function translateObjectStrings<T>(
  input: T,
  options: TranslateObjectOptions = {}
): Promise<T> {
  const { includeEmpty = false, ...batchOpts } = options;

  // 1) kumpulkan semua string beserta path-nya
  const bucket: { path: string[]; value: string }[] = [];
  collectLeafStrings(input as unknown, [], bucket, {
    includeEmpty,
    ...batchOpts,
  });

  if (bucket.length === 0) return structuredClone(input);

  // 2) panggil translateBatch sekali
  const texts = bucket.map((b) => b.value);
  const translated = await translateBatch(texts, batchOpts);

  // 3) tulis balik
  const clone = structuredClone(input) as any;
  bucket.forEach((b, i) => {
    setByPath(clone, b.path, translated[i] ?? "");
  });

  return clone as T;
}
