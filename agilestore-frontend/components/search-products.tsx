// "use client";

// import * as React from "react";
// import { useRouter } from "next/navigation";
// import { Search, Loader2 } from "lucide-react";
// import { fetchAllProductsLite, type ProductLite } from "@/lib/api";

// function norm(s: string) {
//   return s
//     .toLowerCase()
//     .normalize("NFD")
//     .replace(/\p{Diacritic}/gu, "");
// }

// export function SearchProducts({
//   placeholder = "Cari produk… (cth: TIRTABENING / Tirta Bening)",
//   className,
// }: {
//   placeholder?: string;
//   className?: string;
// }) {
//   const router = useRouter();
//   const [q, setQ] = React.useState("");
//   const [loading, setLoading] = React.useState(true);
//   const [open, setOpen] = React.useState(false);
//   const [results, setResults] = React.useState<ProductLite[]>([]);
//   const allRef = React.useRef<ProductLite[]>([]);

//   // load sekali (client) – lewat rewrites jadi aman CORS
//   React.useEffect(() => {
//     let mounted = true;
//     (async () => {
//       try {
//         const list = await fetchAllProductsLite();
//         if (mounted) allRef.current = list;
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     })();
//     return () => {
//       mounted = false;
//     };
//   }, []);

//   React.useEffect(() => {
//     const t = setTimeout(() => {
//       const s = q.trim();
//       if (!s) {
//         setResults([]);
//         setOpen(false);
//         return;
//       }
//       const nq = norm(s);
//       const filtered = allRef.current.filter((p) => {
//         const name = norm(p.product_name || "");
//         const code = norm(p.product_code || "");
//         return name.includes(nq) || code.includes(nq);
//       });
//       setResults(filtered.slice(0, 20));
//       setOpen(true);
//     }, 200);
//     return () => clearTimeout(t);
//   }, [q]);

//   const go = (p: ProductLite) => {
//     setOpen(false);
//     setQ("");
//     router.push(`/product/${encodeURIComponent(p.product_code)}`);
//   };

//   return (
//     <div className={`relative w-full max-w-2xl ${className ?? ""}`}>
//       <div className="flex items-center gap-2 rounded-xl border border-blue-300 bg-white/90 px-3 py-2 shadow-sm ring-1 ring-blue-200 focus-within:ring-2 focus-within:ring-blue-400">
//         <Search className="h-4 w-4 text-blue-600" />
//         <input
//           value={q}
//           onChange={(e) => setQ(e.target.value)}
//           onFocus={() => q && setOpen(true)}
//           placeholder={placeholder}
//           aria-label="Search products"
//           className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
//         />
//         {loading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
//       </div>

//       {open && (
//         <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-blue-100 bg-white shadow-lg">
//           {results.length === 0 ? (
//             <div className="px-4 py-3 text-sm text-gray-500">
//               Tidak ada hasil
//             </div>
//           ) : (
//             <ul className="max-h-72 overflow-auto">
//               {results.map((p) => (
//                 <li
//                   key={`${p.product_code}-${p.product_name}`}
//                   className="cursor-pointer px-4 py-3 hover:bg-blue-50"
//                   onClick={() => go(p)}
//                 >
//                   <div className="text-sm font-medium text-gray-900">
//                     {p.product_name}
//                   </div>
//                   {/* <div className="text-xs text-gray-500">
//                     /product/{p.product_code}
//                   </div> */}
//                   {!!p.description && (
//                     <div className="mt-1 line-clamp-1 text-xs text-gray-500">
//                       {p.description}
//                     </div>
//                   )}
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { fetchAllProductsLite, type ProductLite } from "@/lib/api";

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

type Props = {
  placeholder?: string;
  className?: string;
  useRemote?: boolean; // tetap false sesuai kebutuhanmu
  defaultQuery?: string; // ⬅️ awal dari ?q= di URL
  syncToURL?: boolean; // ⬅️ kalau true, update ?q= saat ketik
};

export function SearchProducts({
  placeholder = "Cari produk… (cth: TIRTABENING / Tirta Bening)",
  className,
  useRemote = false,
  defaultQuery = "",
  syncToURL = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = React.useState(defaultQuery);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [results, setResults] = React.useState<ProductLite[]>([]);
  const allRef = React.useRef<ProductLite[] | null>(null);

  // load list untuk dropdown (client-side)
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await fetchAllProductsLite();
        if (mounted) allRef.current = list;
      } catch (e) {
        console.warn("Load products failed:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // filter + (opsional) update URL (?q=)
  React.useEffect(() => {
    const t = setTimeout(() => {
      const query = q.trim();
      // update URL supaya server components re-render
      if (syncToURL) {
        const search = query ? `?q=${encodeURIComponent(query)}` : "";
        router.replace(`${pathname}${search}`, { scroll: false });
      }

      // dropdown suggestions
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
    router.push(`/product/${p.product_code}`);
  };

  return (
    <div className={`relative w-full max-w-2xl ${className ?? ""}`}>
      <div className="flex items-center gap-2 rounded-xl border border-blue-300 bg-white/90 px-3 py-2 shadow-sm ring-1 ring-blue-200 focus-within:ring-2 focus-within:ring-blue-400">
        <Search className="h-4 w-4 text-blue-600" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && setOpen(true)}
          placeholder={placeholder}
          aria-label="Search products"
          className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
      </div>

      {open && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-blue-100 bg-white shadow-lg">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Tidak ada hasil
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
                  {/* <div className="text-xs text-gray-500">
                    /product/{p.product_code}
                  </div> */}
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
