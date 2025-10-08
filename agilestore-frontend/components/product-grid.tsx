// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import { fetchProducts } from "@/lib/api";

// export default function ProductGrid() {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [products, setProducts] = useState<any[]>([]);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         setLoading(true);
//         const rows = await fetchProducts();
//         setProducts(rows);
//       } catch (e: any) {
//         setError(e.message || "Failed to load products");
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, []);

//   const ProductCard = ({ product }: { product: any }) => {
//     const heroImage = "/placeholder.svg?height=300&width=400";
//     const isDisabled = !product.product_code;

//     const cardContent = (
//       <Card
//         className={`h-full transition-all duration-200 ${
//           isDisabled
//             ? "opacity-50 cursor-not-allowed"
//             : "hover:shadow-lg hover:-translate-y-1 hover:ring-2 hover:ring-indigo-500/20 cursor-pointer"
//         }`}
//       >
//         <CardContent className="p-0">
//           <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
//             <Image
//               src={heroImage || "/placeholder.svg"}
//               alt={product.product_name}
//               fill
//               className="object-cover"
//             />
//           </div>
//           <div className="p-6">
//             <h3 className="text-xl font-semibold text-gray-900 mb-3">
//               {product.product_name}
//             </h3>
//             <p className="text-gray-600 mb-4 line-clamp-3">
//               {product.description || "No description available."}
//             </p>
//             <Button
//               className={`w-full ${
//                 isDisabled
//                   ? "bg-gray-300 cursor-not-allowed"
//                   : "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
//               }`}
//               disabled={isDisabled}
//             >
//               View Details
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     );

//     if (isDisabled) {
//       return (
//         <TooltipProvider>
//           <Tooltip>
//             <TooltipTrigger asChild>
//               <div>{cardContent}</div>
//             </TooltipTrigger>
//             <TooltipContent>
//               <p>Landing page not available</p>
//             </TooltipContent>
//           </Tooltip>
//         </TooltipProvider>
//       );
//     }

//     return (
//       <Link href={`/product/${product.product_code}`} className="block h-full">
//         {cardContent}
//       </Link>
//     );
//   };

//   const ProductSkeleton = () => (
//     <Card className="h-full">
//       <CardContent className="p-0">
//         <Skeleton className="aspect-[4/3] rounded-t-lg" />
//         <div className="p-6">
//           <Skeleton className="h-6 mb-3" />
//           <Skeleton className="h-4 mb-2" />
//           <Skeleton className="h-4 mb-4 w-3/4" />
//           <Skeleton className="h-10 w-full" />
//         </div>
//       </CardContent>
//     </Card>
//   );

//   return (
//     <section className="py-16 bg-gray-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="text-center mb-12">
//           <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
//             Our Products
//           </h2>
//           <p className="text-xl text-gray-600 max-w-2xl mx-auto">
//             Choose from our comprehensive suite of business solutions
//           </p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//           {loading
//             ? Array.from({ length: 4 }).map((_, index) => (
//                 <ProductSkeleton key={index} />
//               ))
//             : products.map((product) => (
//                 <ProductCard key={product.product_code} product={product} />
//               ))}
//         </div>
//       </div>
//     </section>
//   );
// }

"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fetchProducts } from "@/lib/api";

type ProductRow = {
  product_code?: string;
  product_name: string;
  description?: string | null;
  // tambah field lain bila ada di backend-mu
};

export default function ProductGrid({ query = "" }: { query?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const rows = await fetchProducts();
        setProducts(rows || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const nq = query.trim().toLowerCase();
    if (!nq) return products;
    return products.filter((p) => {
      const name = (p.product_name || "").toLowerCase();
      const code = (p.product_code || "").toLowerCase();
      return name.includes(nq) || code.includes(nq);
    });
  }, [products, query]);

  const ProductCard = ({ product }: { product: ProductRow }) => {
    const heroImage = "/placeholder.svg?height=300&width=400";
    const isDisabled = !product.product_code;

    const cardContent = (
      <Card
        className={`h-full transition-all duration-200 ${
          isDisabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:shadow-lg hover:-translate-y-1 hover:ring-2 hover:ring-indigo-500/20 cursor-pointer"
        }`}
      >
        <CardContent className="p-0">
          <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
            <Image
              src={heroImage || "/placeholder.svg"}
              alt={product.product_name}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {product.product_name}
            </h3>
            <p className="text-gray-600 mb-4 line-clamp-3">
              {product.description || "No description available."}
            </p>
            <Button
              className={`w-full ${
                isDisabled
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
              }`}
              disabled={isDisabled}
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );

    if (isDisabled) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>{cardContent}</div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Landing page not available</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Link href={`/product/${product.product_code}`} className="block h-full">
        {cardContent}
      </Link>
    );
  };

  const ProductSkeleton = () => (
    <Card className="h-full">
      <CardContent className="p-0">
        <Skeleton className="aspect-[4/3] rounded-t-lg" />
        <div className="p-6">
          <Skeleton className="h-6 mb-3" />
          <Skeleton className="h-4 mb-2" />
          <Skeleton className="h-4 mb-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Products
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose from our comprehensive suite of business solutions
          </p>
          {error && (
            <p className="mt-4 text-sm text-red-600">
              {error || "Failed to load products"}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))
            : filtered.map((product) => (
                <ProductCard
                  key={product.product_code ?? product.product_name}
                  product={product}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
