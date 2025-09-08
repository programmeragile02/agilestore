"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import * as Lucide from "lucide-react";
import {
  Shield,
  ChevronDown,
  ChevronUp,
  Play,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  Check,
  CreditCard,
  ArrowRight,
  Star,
  Quote,
  ShoppingCart,
  Clock,
  Users,
} from "lucide-react";

import { fetchProductDetail, getCustomerToken } from "@/lib/api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Types
type BackendPayload = {
  product: {
    product_code: string;
    product_name: string;
    category?: string;
    status?: string;
    description?: string;
    total_features?: number;
    upstream_updated_at?: string | null;
  };
  packages: Array<{
    package_code: string;
    name: string;
    description?: string;
    status?: string;
    order_number?: number;
    pricelist: Array<{
      id: string;
      pricelist_id: string;
      package_id: number;
      package_code: string;
      duration_id: number;
      duration_code: string; // e.g. DUR-1/2/3 (tidak sama dengan durations.code)
      price: string; // string dari backend
      discount: string;
      min_billing_cycle: number;
      prorate: boolean;
      effective_start: string | null;
      effective_end: string | null;
      created_at: string;
      updated_at: string;
    }>;
  }>;
  durations: Array<{
    code: string; // e.g. M1, M6, Y1
    name: string; // e.g. 1 Bulan
    length: number;
    unit: string; // month | year
    is_default: boolean;
  }>;
};

function idr(n?: number | string) {
  const v = typeof n === "string" ? Number(n) : n;
  if (!v && v !== 0) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);
}

// ===================== TOP BAR =====================
function ProductTopBar({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500" />
            <span className="font-bold text-gray-900">
              {title || "Product"}
            </span>
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="#contact">Contact</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/member">Sign In</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

// ===================== HERO =====================
function ProductHeroStandalone({
  name,
  description,
  code,
}: {
  name: string;
  description?: string;
  code: string;
}) {
  const img = "/placeholder.svg";
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              {name}
            </h1>
            {description ? (
              <p className="mt-4 text-lg text-gray-600">{description}</p>
            ) : null}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-blue-500 px-8 py-4 text-lg font-semibold hover:from-indigo-600 hover:to-blue-600"
                asChild
              >
                <Link
                  href={`/checkout?product=${code}&package=starter&duration=1`}
                >
                  Try Free
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg font-semibold bg-transparent"
                asChild
              >
                <Link href="#pricing">See Pricing</Link>
              </Button>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4 text-green-500" />
              <span>No credit card required</span>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 shadow-2xl">
              <Image
                // ganti kalau udah ada gambarnya
                src={"/placeholder.svg"}
                alt={`${name} hero`}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===================== VALUE PROPS =====================
// function ProductValueProps({
//   valueProps,
// }: {
//   valueProps: { icon: string; title: string; description: string }[];
// }) {
//   return (
//     <section className="bg-gray-50 py-16 sm:py-24">
//       <div className="container mx-auto max-w-7xl px-4">
//         <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
//           {valueProps.map((prop, i) => {
//             const Icon = (Lucide as any)[prop.icon] as React.ComponentType<any>;
//             return (
//               <div key={i} className="text-center">
//                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-blue-500">
//                   {Icon ? <Icon className="h-8 w-8 text-white" /> : null}
//                 </div>
//                 <h3 className="mt-4 text-lg font-semibold text-gray-900">
//                   {prop.title}
//                 </h3>
//                 <p className="mt-2 text-gray-600">{prop.description}</p>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </section>
//   );
// }

// ===================== FEATURES =====================
// function ProductFeatureGrid({
//   features,
// }: {
//   features: { icon: string; title: string; description: string }[];
// }) {
//   const [expanded, setExpanded] = useState<number | null>(null);
//   return (
//     <section className="bg-white py-16 sm:py-24">
//       <div className="container mx-auto max-w-7xl px-4">
//         <div className="text-center">
//           <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
//             Powerful Features
//           </h2>
//           <p className="mt-4 text-lg text-gray-600">
//             Everything you need to manage your rental business efficiently
//           </p>
//         </div>
//         <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
//           {features.map((f, i) => {
//             const Icon = (Lucide as any)[f.icon] as React.ComponentType<any>;
//             const isOpen = expanded === i;
//             return (
//               <div
//                 key={i}
//                 className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200"
//               >
//                 <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500">
//                   {Icon ? <Icon className="h-6 w-6 text-white" /> : null}
//                 </div>
//                 <h3 className="mt-4 text-lg font-semibold text-gray-900">
//                   {f.title}
//                 </h3>
//                 <p className="mt-2 text-gray-600">{f.description}</p>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   className="mt-3 p-0 text-indigo-600 hover:text-indigo-700"
//                   onClick={() => setExpanded(isOpen ? null : i)}
//                 >
//                   View details{" "}
//                   {isOpen ? (
//                     <ChevronUp className="ml-1 h-4 w-4" />
//                   ) : (
//                     <ChevronDown className="ml-1 h-4 w-4" />
//                   )}
//                 </Button>
//                 {isOpen && (
//                   <div className="mt-3 rounded-lg bg-gray-50 p-4">
//                     <p className="text-sm text-gray-700">
//                       Advanced {f.title.toLowerCase()} capabilities with
//                       enterprise-grade security, real-time synchronization, and
//                       comprehensive analytics to help you make data-driven
//                       decisions.
//                     </p>
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </section>
//   );
// }

// ===================== DEMO GALLERY =====================
// function ProductDemoGallery({
//   product,
// }: {
//   product: { name: string; slug: string };
// }) {
//   const [activeTab, setActiveTab] = useState<"desktop" | "tablet" | "mobile">(
//     "desktop"
//   );
//   const [idx, setIdx] = useState(0);
//   const name = product?.name || "Product";
//   const items = [
//     {
//       type: "video",
//       title: "Dashboard Overview",
//       description: "See how easy it is to manage your rental properties",
//       thumbnail: `/placeholder.svg?height=400&width=600&query=${name} dashboard overview`,
//       duration: "2:30",
//     },
//     {
//       type: "image",
//       title: "Property Management",
//       description: "Add and organize your rental properties",
//       thumbnail: `/placeholder.svg?height=400&width=600&query=${name} property management interface`,
//     },
//     {
//       type: "image",
//       title: "Tenant Portal",
//       description: "Tenant-friendly interface for payments and requests",
//       thumbnail: `/placeholder.svg?height=400&width=600&query=${name} tenant portal`,
//     },
//     {
//       type: "video",
//       title: "Mobile App Demo",
//       description: "Manage everything on the go",
//       thumbnail: `/placeholder.svg?height=400&width=600&query=${name} mobile app demo`,
//       duration: "1:45",
//     },
//   ];
//   const next = () => setIdx((p) => (p + 1) % items.length);
//   const prev = () => setIdx((p) => (p - 1 + items.length) % items.length);
//   return (
//     <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="text-center mb-12">
//           <h2 className="text-3xl font-bold text-gray-900 mb-4">
//             See {name} in Action
//           </h2>
//           <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//             Watch how {name} transforms your rental property management with
//             intuitive interfaces and powerful features.
//           </p>
//         </div>
//         <div className="flex justify-center mb-8">
//           <div className="flex bg-white rounded-lg p-1 shadow-sm border">
//             <button
//               onClick={() => setActiveTab("desktop")}
//               className={`flex items-center gap-2 px-4 py-2 rounded-md ${
//                 activeTab === "desktop"
//                   ? "bg-indigo-600 text-white"
//                   : "text-gray-600 hover:text-gray-900"
//               }`}
//             >
//               <Monitor className="w-4 h-4" /> Desktop
//             </button>
//             <button
//               onClick={() => setActiveTab("tablet")}
//               className={`flex items-center gap-2 px-4 py-2 rounded-md ${
//                 activeTab === "tablet"
//                   ? "bg-indigo-600 text-white"
//                   : "text-gray-600 hover:text-gray-900"
//               }`}
//             >
//               <Tablet className="w-4 h-4" /> Tablet
//             </button>
//             <button
//               onClick={() => setActiveTab("mobile")}
//               className={`flex items-center gap-2 px-4 py-2 rounded-md ${
//                 activeTab === "mobile"
//                   ? "bg-indigo-600 text-white"
//                   : "text-gray-600 hover:text-gray-900"
//               }`}
//             >
//               <Smartphone className="w-4 h-4" /> Mobile
//             </button>
//           </div>
//         </div>
//         <div className="relative mb-8">
//           <Card className="overflow-hidden shadow-2xl">
//             <div className="relative">
//               {/* eslint-disable-next-line @next/next/no-img-element */}
//               <img
//                 src={items[idx].thumbnail || "/placeholder.svg"}
//                 alt={items[idx].title}
//                 className="w-full h-96 object-cover"
//               />
//               {items[idx].type === "video" && (
//                 <div className="absolute inset-0 flex items-center justify-center bg-black/20">
//                   <Button
//                     size="lg"
//                     className="bg-white text-indigo-600 hover:bg-gray-100 rounded-full p-4"
//                   >
//                     <Play className="w-8 h-8" />
//                   </Button>
//                 </div>
//               )}
//               {items[idx].duration && (
//                 <Badge className="absolute top-4 right-4 bg-black/70 text-white">
//                   {items[idx].duration}
//                 </Badge>
//               )}
//               <Button
//                 variant="outline"
//                 size="icon"
//                 onClick={prev}
//                 className="absolute left-4 top-1/2 -translate-y-1/2 bg-white shadow-lg"
//               >
//                 <ChevronLeft className="w-4 h-4" />
//               </Button>
//               <Button
//                 variant="outline"
//                 size="icon"
//                 onClick={next}
//                 className="absolute right-4 top-1/2 -translate-y-1/2 bg-white shadow-lg"
//               >
//                 <ChevronRight className="w-4 h-4" />
//               </Button>
//             </div>
//             <div className="p-6">
//               <h3 className="text-xl font-semibold text-gray-900 mb-2">
//                 {items[idx].title}
//               </h3>
//               <p className="text-gray-600">{items[idx].description}</p>
//             </div>
//           </Card>
//         </div>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//           {items.map((it, i) => (
//             <Card
//               key={i}
//               className={`cursor-pointer transition-all hover:shadow-lg ${
//                 idx === i ? "ring-2 ring-indigo-600" : ""
//               }`}
//               onClick={() => setIdx(i)}
//             >
//               <div className="relative">
//                 {/* eslint-disable-next-line @next/next/no-img-element */}
//                 <img
//                   src={it.thumbnail || "/placeholder.svg"}
//                   alt={it.title}
//                   className="w-full h-24 object-cover rounded-t-lg"
//                 />
//                 {it.type === "video" && (
//                   <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-t-lg">
//                     <Play className="w-6 h-6 text-white" />
//                   </div>
//                 )}
//               </div>
//               <div className="p-3">
//                 <h4 className="font-medium text-sm text-gray-900 truncate">
//                   {it.title}
//                 </h4>
//                 {it.duration && (
//                   <p className="text-xs text-gray-500 mt-1">{it.duration}</p>
//                 )}
//               </div>
//             </Card>
//           ))}
//         </div>
//         <div className="text-center mt-12">
//           <Button
//             size="lg"
//             className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-8 py-3"
//           >
//             Start Your Free Trial
//           </Button>
//           <p className="text-sm text-gray-500 mt-2">
//             No credit card required • 14-day free trial
//           </p>
//         </div>
//       </div>
//     </section>
//   );
// }

// ===================== PRICING =====================
function ProductPricingStandalone({
  productCode,
  packages,
}: {
  productCode: string;
  packages: BackendPayload["packages"];
}) {
  const router = useRouter();

  // modal state
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // cek login via helper api.ts (localStorage "customer_access_token")
  const isLoggedIn = () => {
    if (typeof window === "undefined") return false;
    const token = getCustomerToken();
    return Boolean(token && String(token).trim() !== "");
  };

  // Ambil baris bulanan; kalau nggak ada, fallback ke harga termurah
  const pickMonthly = (pkg: BackendPayload["packages"][number]) => {
    // cek by duration_id dulu
    let row = pkg.pricelist.find((r) => r.duration_id === 1);
    // kalau backend pakai kode, coba deteksi code umum (opsional)
    if (!row)
      row = pkg.pricelist.find((r) =>
        ["M1", "DUR-1"].includes(r.duration_code)
      );
    // fallback: termurah
    if (!row)
      row = [...pkg.pricelist].sort(
        (a, b) => Number(a.price) - Number(b.price)
      )[0];
    return row!;
  };

  const cards = (packages || []).map((pkg) => {
    const monthlyRow = pickMonthly(pkg);
    return {
      id: pkg.package_code,
      name: pkg.name,
      description: pkg.description || "",
      popular:
        // pkg.package_code.toLowerCase().includes("professional") ||
        pkg.package_code.toLowerCase().includes("medium"),
      monthlyRow,
    };
  });

  if (!cards.length) return null;

  const buildCheckoutHref = (c: (typeof cards)[number]) => {
    const duration = c.monthlyRow.duration_code || "M1";
    const price = Number(c.monthlyRow.price) || 0;
    return `/checkout?product=${productCode}&package=${
      c.id
    }&duration=${encodeURIComponent(duration)}&price=${price}`;
  };

  const handleStart = (c: (typeof cards)[number]) => {
    const href = buildCheckoutHref(c);
    if (isLoggedIn()) {
      router.push(href);
    } else {
      setPendingHref(href);
      setLoginOpen(true);
    }
  };

  const goToLogin = () => {
    const next = pendingHref || "/";
    router.push(`/login?next=${encodeURIComponent(next)}`);
  };

  return (
    <>
      <section
        id="pricing"
        className="py-16 bg-gradient-to-br from-slate-50 to-blue-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Start your free trial today. No credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {cards.map((c) => (
              <Card
                key={c.id}
                className={`relative ${
                  c.popular
                    ? "border-2 border-blue-500 shadow-xl scale-105"
                    : "border border-gray-200 shadow-lg"
                }`}
              >
                {c.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {c.name}
                  </CardTitle>
                  {c.description ? (
                    <p className="text-sm text-gray-600 mt-2">
                      {c.description}
                    </p>
                  ) : null}
                  <div className="mt-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">
                        {idr(Number(c.monthlyRow.price))}
                      </span>
                      <span className="text-gray-600 ml-1">/month</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    className={`w-full mb-6 ${
                      c.popular
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        : ""
                    }`}
                    size="lg"
                    onClick={() => handleStart(c)}
                  >
                    Choose Plan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-green-500 mr-2" />
                <span>30-day money-back guarantee</span>
              </div>
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-blue-500 mr-2" />
                <span>Secure payment processing</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span>Cancel anytime</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              All plans include free setup and migration assistance
            </p>
          </div>
        </div>
      </section>

      {/* Modal: belum login */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>You are not logged in yet</DialogTitle>
            <DialogDescription>
              Please login first to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLoginOpen(false)}>
              Cancel
            </Button>
            <Button onClick={goToLogin}>Go to login page</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===================== TESTIMONIALS =====================
// function ProductTestimonials({
//   testimonials,
// }: {
//   testimonials?: {
//     id?: number;
//     name?: string;
//     role?: string;
//     company?: string;
//     avatar?: string;
//     rating?: number;
//     content?: string;
//     featured?: boolean;
//   }[];
// }) {
//   const defaultData = [
//     {
//       id: 1,
//       name: "Sarah Johnson",
//       role: "Property Manager",
//       company: "Urban Properties",
//       avatar: "/placeholder.svg?height=40&width=40",
//       rating: 5,
//       content:
//         "Rent Vix Pro has completely transformed how we manage our rental properties. The automated rent collection and maintenance tracking features have saved us countless hours every month.",
//       featured: true,
//     },
//     {
//       id: 2,
//       name: "Michael Chen",
//       role: "Real Estate Investor",
//       company: "Chen Holdings",
//       avatar: "/placeholder.svg?height=40&width=40",
//       rating: 5,
//       content:
//         "The financial reporting features are incredible. I can see exactly how each property is performing and make data-driven decisions about my portfolio.",
//     },
//     {
//       id: 3,
//       name: "Lisa Rodriguez",
//       role: "Landlord",
//       company: "Independent",
//       avatar: "/placeholder.svg?height=40&width=40",
//       rating: 5,
//       content:
//         "My tenants love the tenant portal. They can pay rent online, submit maintenance requests, and communicate with me easily. It's made everything so much smoother.",
//     },
//     {
//       id: 4,
//       name: "David Thompson",
//       role: "Property Owner",
//       company: "Thompson Rentals",
//       avatar: "/placeholder.svg?height=40&width=40",
//       rating: 5,
//       content:
//         "The maintenance tracking system is a game-changer. I can schedule repairs, track costs, and ensure everything is documented properly.",
//     },
//     {
//       id: 5,
//       name: "Amanda Foster",
//       role: "Portfolio Manager",
//       company: "Foster Real Estate",
//       avatar: "/placeholder.svg?height=40&width=40",
//       rating: 5,
//       content:
//         "Managing 50+ properties used to be overwhelming. Now with Rent Vix Pro, I have everything organized and automated. Best investment I've made for my business.",
//     },
//     {
//       id: 6,
//       name: "Robert Kim",
//       role: "Real Estate Agent",
//       company: "Kim Realty Group",
//       avatar: "/placeholder.svg?height=40&width=40",
//       rating: 5,
//       content:
//         "I recommend Rent Vix Pro to all my clients who are getting into rental properties. The learning curve is minimal and the results are immediate.",
//     },
//   ];
//   const data = (
//     testimonials && testimonials.length > 0 ? testimonials : defaultData
//   ) as any[];
//   const featured = data.find((t) => t.featured);
//   const rest = data.filter((t) => !t.featured);
//   const Stars = ({ n = 5 }: { n?: number }) => (
//     <div className="flex items-center gap-1">
//       {Array.from({ length: 5 }).map((_, i) => (
//         <Star
//           key={i}
//           className={`w-4 h-4 ${
//             i < (n || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
//           }`}
//         />
//       ))}
//     </div>
//   );
//   const initials = (name?: string) =>
//     !name
//       ? "?"
//       : name
//           .split(" ")
//           .map((s) => s[0])
//           .join("")
//           .toUpperCase();
//   return (
//     <section
//       id="testimonials"
//       className="py-16 bg-gradient-to-br from-slate-50 to-blue-50"
//     >
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="text-center mb-16">
//           <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
//             Trusted by Property Managers Worldwide
//           </h2>
//           <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//             Join thousands of property managers who have transformed their
//             business with Rent Vix Pro
//           </p>
//           <div className="flex flex-wrap justify-center gap-8 mt-8">
//             <div className="text-center">
//               <div className="text-3xl font-bold text-indigo-600">10,000+</div>
//               <div className="text-sm text-gray-600">Properties Managed</div>
//             </div>
//             <div className="text-center">
//               <div className="text-3xl font-bold text-indigo-600">98%</div>
//               <div className="text-sm text-gray-600">Customer Satisfaction</div>
//             </div>
//             <div className="text-center">
//               <div className="text-3xl font-bold text-indigo-600">4.9/5</div>
//               <div className="text-sm text-gray-600">Average Rating</div>
//             </div>
//           </div>
//         </div>
//         {featured && (
//           <Card className="mb-12 border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
//             <CardContent className="p-8">
//               <div className="flex items-start gap-4">
//                 <Quote className="w-8 h-8 text-indigo-600 flex-shrink-0 mt-1" />
//                 <div className="flex-1">
//                   <p className="text-lg text-gray-700 mb-6 leading-relaxed">
//                     "{featured.content || "Great product!"}"
//                   </p>
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-4">
//                       <Avatar className="w-12 h-12">
//                         <AvatarImage
//                           src={featured.avatar || "/placeholder.svg"}
//                           alt={featured.name || "User"}
//                         />
//                         <AvatarFallback>
//                           {initials(featured.name)}
//                         </AvatarFallback>
//                       </Avatar>
//                       <div>
//                         <div className="font-semibold text-gray-900">
//                           {featured.name || "Anonymous"}
//                         </div>
//                         <div className="text-sm text-gray-600">
//                           {featured.role || "User"}
//                           {featured.company ? ` at ${featured.company}` : ""}
//                         </div>
//                       </div>
//                     </div>
//                     <Stars n={featured.rating || 5} />
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         )}
//         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {rest.map((t) => (
//             <Card
//               key={t.id}
//               className="h-full hover:shadow-lg transition-shadow duration-300"
//             >
//               <CardContent className="p-6 h-full flex flex-col">
//                 <div className="mb-4">
//                   <Stars n={t.rating || 5} />
//                 </div>
//                 <p className="text-gray-700 mb-6 flex-1 leading-relaxed">
//                   "{t.content || "Great product!"}"
//                 </p>
//                 <div className="flex items-center gap-3">
//                   <Avatar className="w-10 h-10">
//                     <AvatarImage
//                       src={t.avatar || "/placeholder.svg"}
//                       alt={t.name || "User"}
//                     />
//                     <AvatarFallback>{initials(t.name)}</AvatarFallback>
//                   </Avatar>
//                   <div>
//                     <div className="font-semibold text-gray-900 text-sm">
//                       {t.name || "Anonymous"}
//                     </div>
//                     <div className="text-xs text-gray-600">
//                       {t.role || "User"}
//                       {t.company && t.company !== "Independent"
//                         ? ` at ${t.company}`
//                         : ""}
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }

// ===================== FAQ =====================
// function ProductFAQStandalone({ productSlug }: { productSlug: string }) {
//   const faqs = [
//     {
//       question: "How does Rent Vix Pro help manage my rental business?",
//       answer:
//         "Rent Vix Pro streamlines your entire rental operation with automated booking management, inventory tracking, customer communication, and financial reporting. You can manage multiple properties, track maintenance schedules, and process payments all from one dashboard.",
//     },
//     {
//       question: "Can I customize the booking forms and customer portal?",
//       answer:
//         "Yes! Rent Vix Pro offers extensive customization options including branded booking forms, custom fields, automated email templates, and a white-label customer portal that matches your business branding.",
//     },
//     {
//       question: "What payment methods are supported?",
//       answer:
//         "We support all major payment methods including credit cards, bank transfers, digital wallets, and local payment options. Automatic payment processing and recurring billing are included in all plans.",
//     },
//     {
//       question: "Is there a mobile app for managing rentals on the go?",
//       answer:
//         "Yes, Rent Vix Pro includes native mobile apps for iOS and Android, allowing you to manage bookings, communicate with customers, and track inventory from anywhere.",
//     },
//     {
//       question: "How secure is my data?",
//       answer:
//         "We use enterprise-grade security with 256-bit SSL encryption, regular security audits, and comply with GDPR and other data protection regulations. Your data is backed up daily and stored in secure data centers.",
//     },
//     {
//       question: "Can I integrate with my existing tools?",
//       answer:
//         "Rent Vix Pro integrates with popular tools like QuickBooks, Mailchimp, Google Calendar, and many others through our API and Zapier connections.",
//     },
//     {
//       question: "What kind of support do you provide?",
//       answer:
//         "We offer 24/7 customer support via chat, email, and phone. Plus, you get access to our knowledge base, video tutorials, and dedicated onboarding specialist to help you get started.",
//     },
//     {
//       question: "Can I try it before purchasing?",
//       answer:
//         "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start your trial.",
//     },
//   ];
//   return (
//     <section id="faq" className="py-16 bg-white">
//       <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="text-center mb-12">
//           <h2 className="text-3xl font-bold text-gray-900 mb-4">
//             Frequently Asked Questions
//           </h2>
//           <p className="text-lg text-gray-600 max-w-2xl mx-auto">
//             Get answers to common questions about Rent Vix Pro and how it can
//             transform your rental business.
//           </p>
//         </div>
//         <div className="mb-12">
//           <Accordion type="single" collapsible className="space-y-4">
//             {faqs.map((faq, i) => (
//               <AccordionItem
//                 key={i}
//                 value={`item-${i}`}
//                 className="border border-gray-200 rounded-lg px-6 py-2 bg-white shadow-sm hover:shadow-md transition-shadow"
//               >
//                 <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-indigo-600 py-4">
//                   {faq.question}
//                 </AccordionTrigger>
//                 <AccordionContent className="text-gray-600 pb-4 leading-relaxed">
//                   {faq.answer}
//                 </AccordionContent>
//               </AccordionItem>
//             ))}
//           </Accordion>
//         </div>
//         <div className="text-center bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-8">
//           <h3 className="text-xl font-semibold text-gray-900 mb-2">
//             Still have questions?
//           </h3>
//           <p className="text-gray-600 mb-6">
//             Our support team is here to help you get started with Rent Vix Pro.
//           </p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <Button
//               variant="outline"
//               className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 bg-transparent"
//             >
//               Contact Support
//             </Button>
//             <Button
//               className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
//               onClick={() =>
//                 (window.location.href = `/checkout?product=${productSlug}&package=professional&duration=monthly`)
//               }
//             >
//               Start Free Trial
//             </Button>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// ===================== FINAL CTA =====================
// function ProductFinalCTA({ productSlug }: { productSlug: string }) {
//   return (
//     <section className="py-20 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 relative overflow-hidden">
//       <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=400')] opacity-10" />
//       <div className="container mx-auto px-4 relative z-10">
//         <div className="max-w-4xl mx-auto text-center text-white">
//           <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
//             Ready to Transform Your
//             <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
//               Property Management?
//             </span>
//           </h2>
//           <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
//             Join thousands of property managers who've streamlined their
//             operations with Rent Vix Pro
//           </p>
//           <div className="flex flex-wrap justify-center items-center gap-8 mb-10 text-blue-100">
//             <div className="flex items-center gap-2">
//               <Users className="w-5 h-5" />
//               <span className="text-sm font-medium">10,000+ Users</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Shield className="w-5 h-5" />
//               <span className="text-sm font-medium">30-Day Guarantee</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Clock className="w-5 h-5" />
//               <span className="text-sm font-medium">Setup in 5 Minutes</span>
//             </div>
//           </div>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
//             <Button
//               asChild
//               size="lg"
//               className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
//             >
//               <Link
//                 href={`/checkout?product=${productSlug}&package=professional&duration=yearly`}
//               >
//                 Start Free Trial
//                 <ArrowRight className="ml-2 w-5 h-5" />
//               </Link>
//             </Button>
//             <Button
//               asChild
//               variant="outline"
//               size="lg"
//               className="border-2 border-white text-white hover:bg-white hover:text-indigo-600 font-semibold px-8 py-4 text-lg transition-all duration-300 bg-transparent"
//             >
//               <Link
//                 href={`/checkout?product=${productSlug}&package=starter&duration=monthly`}
//               >
//                 View Pricing
//               </Link>
//             </Button>
//           </div>
//           <p className="text-blue-200 text-sm">
//             No credit card required • Cancel anytime • 30-day money-back
//             guarantee
//           </p>
//         </div>
//         <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
//           <div className="text-center">
//             <div className="text-3xl font-bold text-white mb-2">99.9%</div>
//             <div className="text-blue-200 text-sm">Uptime</div>
//           </div>
//           <div className="text-center">
//             <div className="text-3xl font-bold text-white mb-2">24/7</div>
//             <div className="text-blue-200 text-sm">Support</div>
//           </div>
//           <div className="text-center">
//             <div className="text-3xl font-bold text-white mb-2">50+</div>
//             <div className="text-blue-200 text-sm">Integrations</div>
//           </div>
//           <div className="text-center">
//             <div className="text-3xl font-bold text-white mb-2">4.9★</div>
//             <div className="text-blue-200 text-sm">User Rating</div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// ===================== FOOTER & MOBILE CTA =====================
function ProductFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent"
            >
              Agile Store
            </Link>
            <p className="mt-4 text-gray-600 max-w-md">
              Empowering businesses with digital solutions that drive growth and
              efficiency. Transform your operations with our suite of
              professional tools.
            </p>
            <div className="mt-6 flex space-x-4 text-gray-400">
              <a href="#" className="hover:text-gray-500">
                Facebook
              </a>
              <a href="#" className="hover:text-gray-500">
                Twitter
              </a>
              <a href="#" className="hover:text-gray-500">
                LinkedIn
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
              Product
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a
                  href="#features"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#demo"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Demo
                </a>
              </li>
              <li>
                <a
                  href="#testimonials"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Reviews
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
              Support
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a
                  href="#faq"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@agilestore.com"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Contact Support
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-top border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-base text-gray-400">
              &copy; 2024 Agile Store. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">SSL Secured</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Privacy Protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ProductMobileCTA({ productSlug }: { productSlug: string }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-4 shadow-lg md:hidden">
      <div className="flex gap-3">
        <Button
          asChild
          variant="outline"
          size="lg"
          className="flex-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50 bg-transparent"
        >
          <Link
            href={`/checkout?product=${productSlug}&package=starter&duration=monthly`}
          >
            <Play className="w-4 h-4 mr-2" />
            Try Free
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg"
        >
          <Link
            href={`/checkout?product=${productSlug}&package=professional&duration=yearly`}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy Now
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ===================== PAGE =====================
export default function ProductPage() {
  const params = useParams() as { code?: string };
  const router = useRouter();
  const code = params?.code as string | undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [productName, setProductName] = useState<string>("");
  const [productDesc, setProductDesc] = useState<string | undefined>(undefined);
  const [packages, setPackages] = useState<BackendPayload["packages"]>([]);
  const [durations, setDurations] = useState<BackendPayload["durations"]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!code) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchProductDetail(code);
        // fungsi kamu mengembalikan data.data; tapi untuk aman, cek dua pola
        const payload: BackendPayload = (res?.data ? res.data : res) as any;

        if (!payload?.product) {
          if (mounted) {
            setError("NOT_FOUND");
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setProductName(payload.product.product_name);
          setProductDesc(payload.product.description || undefined);
          setPackages(payload.packages || []);
          setDurations(payload.durations || []);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load product");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [code]);

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Product code tidak valid.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <ProductTopBar title="Loading…" />
        <div className="container mx-auto max-w-7xl px-4 py-10 space-y-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error === "NOT_FOUND") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
        <h1 className="text-3xl font-bold mb-2">Product Not Found</h1>
        <p className="text-gray-600 mb-6">
          Produk dengan code <b>{code}</b> tidak ditemukan.
        </p>
        <Button onClick={() => router.push("/")}>Back to Home</Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
        <h1 className="text-3xl font-bold mb-2">Error</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={() => router.refresh()}>Reload</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <ProductTopBar title={productName} />
      <main>
        <ProductHeroStandalone
          name={productName}
          description={productDesc}
          code={code}
        />
        {/* {product.valueProps?.length ? (
          <ProductValueProps valueProps={product.valueProps as any} />
        ) : null} */}
        {/* {product.features?.length ? (
          <ProductFeatureGrid features={product.features as any} />
        ) : null} */}
        {/* <ProductDemoGallery
          product={{ name: product.name, slug: product.slug }}
        /> */}
        <ProductPricingStandalone
          productCode={code}
          packages={packages}
        />
        {/* <ProductTestimonials testimonials={product.testimonials as any} />
        <ProductFAQStandalone productSlug={product.slug} />
        <ProductFinalCTA productSlug={product.slug} /> */}
      </main>
      <ProductFooter />
      {/* <ProductMobileCTA productSlug={product.slug} /> */}
    </div>
  );
}
