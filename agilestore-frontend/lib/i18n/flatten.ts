// lib/i18n/flatten.ts
export type StringLeafDict = Record<string, string>;

const SEP = "›"; // pemisah path, aman utk kunci biasa

export function isPlainObject(v: any) {
  return Object.prototype.toString.call(v) === "[object Object]";
}

/** Ambil semua daun string dari object (rekursif), kembalikan dict path -> string */
export function extractStringLeaves(
  input: any,
  basePath: string[] = [],
  out: StringLeafDict = {}
): StringLeafDict {
  if (typeof input === "string") {
    out[basePath.join(SEP)] = input;
    return out;
  }
  if (Array.isArray(input)) {
    input.forEach((v, i) =>
      extractStringLeaves(v, [...basePath, String(i)], out)
    );
    return out;
  }
  if (isPlainObject(input)) {
    for (const [k, v] of Object.entries(input)) {
      extractStringLeaves(v, [...basePath, k], out);
    }
  }
  return out;
}

/** Rekonstruksi object asal dari dict path->string, menimpa hanya jalur string */
export function applyStringLeaves(
  original: any,
  translated: StringLeafDict
): any {
  const clone = structuredClone(original);
  for (const [path, text] of Object.entries(translated)) {
    const parts = path.split(SEP);
    let cur: any = clone;
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i]!;
      const nextIsIndex = /^\d+$/.test(parts[i + 1] ?? "");
      if (i === parts.length - 1) {
        // daun
        cur[key] = text;
      } else {
        if (cur[key] == null) {
          cur[key] = nextIsIndex ? [] : {};
        }
        cur = cur[key];
      }
    }
  }
  return clone;
}
