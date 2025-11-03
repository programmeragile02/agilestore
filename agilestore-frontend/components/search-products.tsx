// components/search-products.tsx
"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { fetchAllProductsLite, type ProductLite } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

type Props = {
  placeholder?: string;
  className?: string;
  useRemote?: boolean;
  defaultQuery?: string;
  syncToURL?: boolean;
};

export function SearchProducts({
  placeholder,
  className,
  useRemote = false,
  defaultQuery = "",
  syncToURL = false,
}: Props) {
  const { lang } = useLanguage(); // ⬅️ bahasa reaktif dari provider
  const router = useRouter();
  const pathname = usePathname();

  const [q, setQ] = React.useState(defaultQuery);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [results, setResults] = React.useState<ProductLite[]>([]);
  const allRef = React.useRef<ProductLite[] | null>(null);

  // Label UI bilingual
  const UI = React.useMemo(
    () =>
      ({
        en: {
          placeholder:
            placeholder ?? "Search products… (e.g., NATABANYU / Nata Banyu)",
          noResult: "No result",
          aria: "Search products",
        },
        id: {
          placeholder:
            placeholder ?? "Cari produk… (mis: NATABANYU / Nata Banyu)",
          noResult: "Tidak ada hasil",
          aria: "Cari produk",
        },
      } as const),
    [lang, placeholder]
  );

  // Load list (client)
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const list = await fetchAllProductsLite();
        if (mounted) allRef.current = list;
      } catch (e) {
        console.warn("Load products failed:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter + optional sync URL (?q=)
  React.useEffect(() => {
    const t = setTimeout(() => {
      const query = q.trim();

      if (syncToURL) {
        const search = query ? `?q=${encodeURIComponent(query)}` : "";
        router.replace(`${pathname}${search}`, { scroll: false });
      }

      const all = allRef.current ?? [];
      if (!query) {
        setResults([]);
        setOpen(false);
        return;
      }
      const nq = norm(query);
      const filtered = all.filter((p) => {
        const name = norm(p.product_name || "");
        const code = norm(p.product_code || "");
        return name.includes(nq) || code.includes(nq);
      });
      setResults(filtered.slice(0, 20));
      setOpen(true);
    }, 200);
    return () => clearTimeout(t);
  }, [q, pathname, router, syncToURL]);

  const go = (p: ProductLite) => {
    setOpen(false);
    setQ("");
    router.push(`/product/${encodeURIComponent(p.product_code)}`);
  };

  return (
    <div className={`relative w-full max-w-2xl ${className ?? ""}`}>
      <div className="flex items-center gap-2 rounded-xl border border-blue-300 bg-white/90 px-3 py-2 shadow-sm ring-1 ring-blue-200 focus-within:ring-2 focus-within:ring-blue-400">
        <Search className="h-4 w-4 text-blue-600" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && setOpen(true)}
          placeholder={UI[lang].placeholder}
          aria-label={UI[lang].aria}
          className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
      </div>

      {open && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-blue-100 bg-white shadow-lg">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              {UI[lang].noResult}
            </div>
          ) : (
            <ul className="max-h-72 overflow-auto">
              {results.map((p) => (
                <li
                  key={`${p.product_code}-${p.product_name}`}
                  className="cursor-pointer px-4 py-3 hover:bg-blue-50"
                  onClick={() => go(p)}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {p.product_name}
                  </div>
                  {!!p.description && (
                    <div className="mt-1 line-clamp-1 text-xs text-gray-500">
                      {p.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
