"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  // DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

// Icons
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  Play,
  Check,
  CreditCard,
  ArrowRight,
  Star,
  ShoppingCart,
  Menu,
} from "lucide-react";

import {
  fetchLandingPage,
  fetchProductDetail,
  getCustomerToken,
} from "@/lib/api";

import { useLanguage } from "@/components/LanguageProvider";

/* ===================== Types ===================== */

type PackageMatrixRow = {
  id: number;
  product_code: string;
  package_id: number;
  item_type: "feature" | "menu";
  item_id: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

type FeatureRow = {
  id: string;
  product_code: string;
  item_type: "FEATURE" | "SUBFEATURE";
  feature_code: string;
  name: string;
  description?: string;
  module_name?: string;
  menu_parent_code?: string | null;
  is_active: boolean;
  order_number: number;
  price_addon: number;
};

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
      duration_code: string;
      price: string;
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
    code: string;
    name: string;
    length: number;
    unit: string;
    is_default: boolean;
  }>;
  package_matrix: PackageMatrixRow[];
  features: FeatureRow[];
};

type LandingSection = {
  id: string;
  section_key:
    | "hero"
    | "features"
    | "demo"
    | "benefits"
    | "cta"
    | "pricing"
    | "faq"
    | "testimonials"
    | "footer";
  name: string;
  enabled: boolean;
  display_order: number;
  content: any;
  content_en?: any;
};

type LandingPayload = {
  product: {
    id: number;
    product_code: string;
    product_name: string;
    status: string;
  };
  page: any;
  sections: LandingSection[];
};

/* ===================== Helpers ===================== */

function idr(n?: number | string) {
  const v = typeof n === "string" ? Number(n) : n;
  if (!v && v !== 0) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);
}

const getSection = (
  sections: LandingSection[],
  key: LandingSection["section_key"]
) => sections.find((s) => s.enabled && s.section_key === key);

/* ===== Mini 3D/Parallax utils ===== */
function useParallaxTilt() {
  const ref = useRef<HTMLDivElement | null>(null);
  const idleT = useRef(0);
  const raf = useRef<number | null>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const bounds = useRef({ w: 1, h: 1, l: 0, t: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const b = el.getBoundingClientRect();
      bounds.current = { w: b.width, h: b.height, l: b.left, t: b.top };
      mouse.current = { x: e.clientX - b.left, y: e.clientY - b.top };
    };

    const onLeave = () => {
      mouse.current = { x: bounds.current.w / 2, y: bounds.current.h / 2 };
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);

    mouse.current = { x: el.clientWidth / 2, y: el.clientHeight / 2 };

    const loop = () => {
      idleT.current += 0.02;

      const cx = bounds.current.w / 2;
      const cy = bounds.current.h / 2;
      const dx = mouse.current.x - cx;
      const dy = mouse.current.y - cy;

      const wobbleX = Math.sin(idleT.current) * 6;
      const wobbleY = Math.cos(idleT.current * 0.8) * 6;

      const tiltX = (dy / cy) * -10 + wobbleX;
      const tiltY = (dx / cx) * 10 + wobbleY;

      el.style.setProperty("--tiltX", `${tiltX.toFixed(2)}deg`);
      el.style.setProperty("--tiltY", `${tiltY.toFixed(2)}deg`);

      const layers = el.querySelectorAll<HTMLElement>("[data-depth]");
      layers.forEach((layer) => {
        const depth = Number(layer.dataset.depth || 0);
        const tx = (
          (dx / cx) * depth * 10 +
          Math.sin(idleT.current + depth) * depth * 2
        ).toFixed(2);
        const ty = (
          (dy / cy) * depth * 10 +
          Math.cos(idleT.current + depth) * depth * 2
        ).toFixed(2);
        layer.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      });

      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return ref;
}

/* ===== Lokalisasi isi section (ID/EN) ===== */

type Lang = "id" | "en";

type UILang = "id" | "en";

const UI_STRINGS: Record<
  UILang,
  {
    trustedBy: string;
    contactSupport: string;
    choosePlan: string;
    seePricing: string;
    navHome: string;
    navFeatures: string;
    navPricing: string;
    navFAQ: string;
    navContact: string;
    navSignIn: string;
  }
> = {
  id: {
    trustedBy: "Dipercaya tim modern",
    contactSupport: "Hubungi Tim Dukungan",
    choosePlan: "Pilih Paket",
    seePricing: "Lihat Harga",
    navHome: "Beranda",
    navFeatures: "Fitur",
    navPricing: "Harga",
    navFAQ: "FAQ",
    navContact: "Kontak",
    navSignIn: "Masuk",
  },
  en: {
    trustedBy: "Trusted by modern teams",
    contactSupport: "Contact Support",
    choosePlan: "Choose Plan",
    seePricing: "See Pricing",
    navHome: "Home",
    navFeatures: "Features",
    navPricing: "Pricing",
    navFAQ: "FAQ",
    navContact: "Contact",
    navSignIn: "Sign In",
  },
};

const LOCAL_FALLBACKS: Record<
  Lang,
  Partial<Record<LandingSection["section_key"], any>>
> = {
  id: {
    benefits: {
      title: "keuntungan",
      subtitle:
        "Semua yang Anda perlukan untuk live lebih cepat, skalakan mulus, dan kelola operasional sehari-hari dengan mudah.",
    },
  },
  en: {
    benefits: {
      title: "Benefits",
      subtitle:
        "Everything you need to get live faster, scale smoothly, and run day-to-day operations with ease.",
    },
  },
};

function parseMaybeJson(v: any) {
  if (v == null) return null;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    try {
      const j = JSON.parse(s);
      return j && (typeof j === "object" || Array.isArray(j)) ? j : null;
    } catch {
      return null;
    }
  }
  if (typeof v === "object") return v;
  return null;
}

/**
 * Menghasilkan array sections yang sudah dilokalkan:
 * - lang "id": pakai s.content (parse jika string)
 * - lang "en": pakai s.content_en (parse) → fallback ke s.content
 */
function localizeSections<T extends { content?: any; content_en?: any }>(
  sections: T[],
  lang: Lang
) {
  return (sections || []).map((s: any) => {
    const idObj = parseMaybeJson(s.content) ?? {};
    const enObj = parseMaybeJson(s.content_en);

    // ambil fallback lokal sesuai section_key (kalau ada)
    const local = LOCAL_FALLBACKS[lang]?.[s.section_key] ?? null;

    // Prioritas:
    // - ID:   content (ID) + (local ID untuk properti yg kosong)
    // - EN:   content_en (kalau ada) else local EN, lalu fallback terakhir content(ID)
    if (lang === "id") {
      return {
        ...s,
        content: { ...idObj, ...(LOCAL_FALLBACKS.id?.[s.section_key] ?? {}) },
      };
    }
    // lang === 'en'
    if (enObj) {
      return { ...s, content: { ...idObj, ...enObj } };
    }
    if (local) {
      return { ...s, content: { ...idObj, ...local } };
    }
    return { ...s, content: idObj };
  }) as unknown as LandingSection[];
}

/* ===================== UI Components ===================== */

// ===== TOP BAR
function ProductTopBar({
  title,
  productCode,
}: {
  title?: string;
  productCode?: string;
}) {
  const { lang } = useLanguage();
const L = UI_STRINGS[lang as UILang];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-100/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto relative flex h-16 max-w-7xl items-center px-4">
        {/* Brand (kiri) */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-[0_6px_20px_-10px_rgba(16,185,129,0.9)]" />
          <Link href="/" className="font-semibold text-gray-900 tracking-tight">
            {title || "Product"}
          </Link>
        </div>

        {/* Desktop nav (ditengah) */}
        <nav className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center gap-2 text-sm">
          <Link
            href={productCode ? `/product/${productCode}#top` : "/#top"}
            className="rounded-md px-3 py-2 text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {L.navHome}
          </Link>
          <a
            href="#features"
            className="rounded-md px-3 py-2 text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {L.navFeatures}
          </a>
          <a
            href="#pricing"
            className="rounded-md px-3 py-2 text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {L.navPricing}
          </a>
          <a
            href="#faq"
            className="rounded-md px-3 py-2 text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {L.navFAQ}
          </a>
        </nav>

        {/* Mobile menu (kanan) */}
        <div className="ml-auto sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-emerald-200"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-80 sm:w-96 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>Navigate to sections</SheetDescription>
              </SheetHeader>

              <nav className="px-3 py-3 flex flex-col gap-1">
                <Link
                  href={productCode ? `/product/${productCode}#top` : "/#top"}
                  className="rounded-lg px-3 py-2 text-[15px] text-gray-800 hover:text-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {L.navHome}
                </Link>
                <a
                  href="#features"
                  className="rounded-lg px-3 py-2 text-[15px] text-gray-800 hover:text-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {L.navFeatures}
                </a>
                <a
                  href="#pricing"
                  className="rounded-lg px-3 py-2 text-[15px] text-gray-800 hover:text-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {L.navPricing}
                </a>
                <a
                  href="#faq"
                  className="rounded-lg px-3 py-2 text-[15px] text-gray-800 hover:text-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {L.navFAQ}
                </a>

                <div className="my-2" />

                <Link
                  href="#contact"
                  className="rounded-lg px-3 py-2 text-[15px] text-gray-800 hover:text-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {L.navContact}
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-[15px] font-medium text-emerald-700 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {L.navSignIn}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

// ===== HERO
function ProductHeroStandalone({
  name,
  description,
  code,
  productName,
  data,
  ui,
}: {
  name: string;
  description?: string;
  code: string;
  productName: string;
  data: any;
  ui?: { seePricing?: string };
}) {
  const bg = (data?.backgroundImage as string) || "/placeholder.svg";
  const tiltRef = useParallaxTilt();

  // Video: support data.videoUrl || data.url
  const videoSrc: string | undefined = data?.videoUrl || data?.url;
  const [open, setOpen] = useState(false);

  return (
    <section id="top" className="relative overflow-hidden bg-white">
      {/* Soft gradient background */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-emerald-200 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-emerald-300/70 blur-3xl" />
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            {/* <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              New • Green Edition
            </p> */}
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl leading-[1.05]">
              {productName}
            </h1>
            {data?.subtitle ? (
              <p className="mt-4 text-lg text-gray-600 max-w-xl">
                {data.subtitle}
              </p>
            ) : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 px-8 py-4 text-lg font-semibold shadow-lg shadow-emerald-600/30"
                asChild
              >
                <Link
                  href={`/checkout?product=${code}&package=starter&duration=1`}
                >
                  {data?.ctaText || "Start Free Trial"}
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg font-semibold border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                asChild
              >
                <Link href="#pricing">{ui?.seePricing ?? "See Pricing"}</Link>
              </Button>
            </div>
            {/* <div className="mt-6 flex items-center gap-3 text-sm text-gray-600">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span>No credit card required</span>
            </div> */}
          </div>

          {/* 3D stage */}
          <div className="relative">
            <div
              ref={tiltRef}
              className="group relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-100/80 p-4 shadow-2xl [perspective:1000px]"
              style={{
                transform: "rotateX(var(--tiltX)) rotateY(var(--tiltY))" as any,
              }}
            >
              {/* Decorative layers */}
              <div
                className="pointer-events-none absolute inset-0"
                aria-hidden
                data-depth="0.5"
              >
                <div className="absolute -top-10 right-8 h-24 w-24 rounded-2xl bg-emerald-300/50 blur-xl" />
                <div className="absolute bottom-8 -left-8 h-28 w-28 rounded-full bg-emerald-400/40 blur-xl" />
              </div>

              {/* Device chrome bar */}
              <div
                className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-emerald-900/90 px-4 py-1 text-[10px] font-medium tracking-wide text-emerald-50 shadow-md"
                data-depth="1.2"
              >
                Live Preview
              </div>

              {/* Screenshot layer */}
              <div
                className="relative h-full w-full overflow-hidden rounded-2xl border border-emerald-200/70 bg-white shadow-[0_20px_60px_-20px_rgba(4,120,87,0.35)]"
                data-depth="1"
              >
                <Image
                  src={bg}
                  alt={`${productName} hero`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Floating cards */}
              <div
                className="absolute -right-3 top-10 w-40 rounded-xl border border-emerald-200/70 bg-white p-3 shadow-lg"
                data-depth="1.5"
              >
                <div className="text-xs text-gray-600">Uptime</div>
                <div className="text-lg font-semibold text-gray-900">99.9%</div>
              </div>
              <div
                className="absolute -left-3 bottom-10 w-44 rounded-xl border border-emerald-200/70 bg-white p-3 shadow-lg"
                data-depth="1.8"
              >
                <div className="text-xs text-gray-600">Users</div>
                <div className="text-lg font-semibold text-gray-900">
                  10,000+
                </div>
              </div>

              {/* Play button */}
              <button
                onClick={() => setOpen(true)}
                className="absolute inset-0 m-auto h-16 w-16 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                data-depth="0.8"
                aria-label="Play demo video"
              >
                <Play className="w-7 h-7 text-emerald-700" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Dialog (Hero) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{data?.videoTitle || "Demo video"}</DialogTitle>
            <DialogDescription>
              {data?.videoDescription || "Panduan lengkap"}
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            {videoSrc ? (
              <video
                src={videoSrc}
                controls
                autoPlay
                className="w-full h-full"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/70">
                No video URL set
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ===== FEATURES
function ProductFeatureGrid({ data }: { data: any }) {
  const list: { icon?: string; title: string; description?: string }[] =
    data?.features || [];
  if (!list.length) return null;
  return (
    <section id="features" className="bg-white py-16 sm:py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {data?.title || "Powerful Features"}
          </h2>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.slice(0, 6).map((f, i) => (
            <div
              key={i}
              className="group rounded-2xl bg-gradient-to-b from-white to-emerald-50 p-6 shadow-sm ring-1 ring-emerald-100 hover:shadow-md transition"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/10 ring-1 ring-emerald-200">
                <div className="h-6 w-6 rounded-md bg-emerald-500/90" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {f.title}
              </h3>
              <p className="mt-2 text-gray-600">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== DEMO
function ProductDemoGallery({ data }: { data: any }) {
  // Normalisasi item: dukung videoUrl || url
  const raw:
    | Array<{
        title: string;
        duration?: string;
        thumbnail?: string;
        url?: string;
        videoUrl?: string;
      }>
    | undefined = data?.videos;

  const items =
    (raw || []).map((v) => ({
      title: v.title,
      duration: v.duration,
      thumbnail: v.thumbnail,
      videoUrl: v.videoUrl || v.url,
    })) ?? [];

  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  if (!items.length) return null;

  const next = () => setIdx((p) => (p + 1) % items.length);
  const prev = () => setIdx((p) => (p - 1 + items.length) % items.length);

  const current = items[idx];

  return (
    <section
      id="demo"
      className="py-16 bg-gradient-to-br from-emerald-50 to-emerald-100/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {data?.title || "See Product in Action"}
          </h2>
        </div>

        <div className="relative mb-8">
          <Card className="overflow-hidden shadow-2xl border-emerald-100">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current?.thumbnail || "/placeholder.svg"}
                alt={current?.title}
                className="w-full h-96 object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Button
                  size="lg"
                  onClick={() => setOpen(true)}
                  className="bg-white text-emerald-700 hover:bg-gray-100 rounded-full p-4"
                >
                  <Play className="w-8 h-8" />
                </Button>
              </div>
              {current?.duration && (
                <Badge className="absolute top-4 right-4 bg-black/70 text-white">
                  {current?.duration}
                </Badge>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white shadow-lg"
                aria-label="Prev"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white shadow-lg"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {current?.title}
              </h3>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((it, i) => (
            <Card
              key={i}
              className={`cursor-pointer transition-all hover:shadow-lg border-emerald-100 ${
                idx === i ? "ring-2 ring-emerald-600" : ""
              }`}
              onClick={() => setIdx(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.thumbnail || "/placeholder.svg"}
                alt={it.title}
                className="w-full h-24 object-cover rounded-t-lg"
              />
              <div className="p-3">
                <h4 className="font-medium text-sm text-gray-900 truncate">
                  {it.title}
                </h4>
                {it.duration && (
                  <p className="text-xs text-gray-500 mt-1">{it.duration}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Video Dialog (Gallery) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{current?.title || "Demo video"}</DialogTitle>
            <DialogDescription>Video demo</DialogDescription>
          </DialogHeader>
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            {current?.videoUrl ? (
              <video
                src={current.videoUrl}
                controls
                autoPlay
                className="w-full h-full"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/70">
                No video URL set
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// ===== PRICING
function ProductPricingStandalone({
  productCode,
  packages,
  packageMatrix,
  features,
  pricingText,
  lang,
  usdRate = 16700,
}: {
  productCode: string;
  packages: BackendPayload["packages"];
  packageMatrix: BackendPayload["package_matrix"];
  features: BackendPayload["features"];
  pricingText?: any;
  lang: "id" | "en";
  usdRate?: number;
}) {
  const router = useRouter();

  // const [loginOpen, setLoginOpen] = useState(false);
  // const [pendingHref, setPendingHref] = useState<string | null>(null);

  const title: string = pricingText?.title ?? "Choose Your Plan";
  const subtitle: string =
    pricingText?.subtitle ??
    "Start your free trial today. No credit card required.";

  // --- helper tampilan harga ---
  const formatDisplayPrice = (idrValue: number | string) => {
    const idrNum = Number(idrValue) || 0;
    if (lang === "en") {
      const usd = idrNum / usdRate;
      return {
        text: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(usd),
        suffix: "/month",
      };
    }
    return {
      text: idr(idrNum), // fungsi idr() milikmu tetap dipakai
      suffix: "/bulan",
    };
  };

  const planMetaByCode = useMemo(() => {
    const m = new Map<
      string,
      { description?: string; cta?: string; name?: string }
    >();
    const plans: any[] = Array.isArray(pricingText?.plans)
      ? pricingText.plans
      : [];
    for (const p of plans) {
      const code = String(p.package_code || p.id || p.code || "").toLowerCase();
      if (!code) continue;
      m.set(code, {
        description: p.description,
        cta: p.cta,
        name: p.name, // tidak dipakai untuk judul utama, tapi disimpan kalau nanti perlu
      });
    }
    return m;
  }, [pricingText]);

  const isLoggedIn = () => {
    if (typeof window === "undefined") return false;
    const token = getCustomerToken();
    return Boolean(token && String(token).trim() !== "");
  };

  const pickMonthly = (pkg: BackendPayload["packages"][number]) => {
    let row = pkg.pricelist.find((r) => r.duration_id === 1);
    if (!row)
      row = pkg.pricelist.find((r) =>
        ["M1", "DUR-1"].includes(r.duration_code)
      );
    if (!row)
      row = [...pkg.pricelist].sort(
        (a, b) => Number(a.price) - Number(b.price)
      )[0];
    return row!;
  };

  const getPackageId = (pkg: BackendPayload["packages"][number]) =>
    pkg.pricelist?.[0]?.package_id ?? null;

  const featureNameByCode = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of features) m.set(f.feature_code, f.name);
    return m;
  }, [features]);

  const cards = (packages || []).map((pkg) => {
    const monthlyRow = pickMonthly(pkg);
    const pkgId = getPackageId(pkg);
    const rows =
      pkgId == null
        ? []
        : packageMatrix.filter(
            (r) =>
              r.package_id === pkgId && r.item_type === "feature" && r.enabled
          );

    const featureList = rows
      .map(
        (r) =>
          featureNameByCode.get(r.item_id) ||
          r.item_id
            .split(".")
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(" ")
      )
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a.localeCompare(b));

    const meta = planMetaByCode.get(String(pkg.package_code).toLowerCase());

    return {
      id: pkg.package_code,
      name: pkg.name,
      description: meta?.description ?? pkg.description ?? "",
      popular: /premium|business/i.test(pkg.package_code),
      monthlyRow,
      features: featureList,
      ctaLabel: meta?.cta ?? "Choose Plan",
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
    // if (isLoggedIn()) router.push(href);
    // else { setPendingHref(href); setLoginOpen(true); }
    router.push(href);
  };

  return (
    <>
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">{title}</h2>
            <p className="text-lg text-gray-600">{subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {cards.map((c) => {
              const { text, suffix } = formatDisplayPrice(c.monthlyRow.price);
              return (
                <Card
                  key={c.id}
                  className={`relative border-2 ${
                    c.popular ? "border-emerald-600" : "border-emerald-100"
                  } rounded-2xl shadow-[0_20px_60px_-20px_rgba(4,120,87,0.25)]`}
                >
                  {c.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white">
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
                          {text}
                        </span>
                        <span className="text-gray-600 ml-1">{suffix}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      className={`w-full mb-6 ${
                        c.popular
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-emerald-500 hover:bg-emerald-600"
                      }`}
                      size="lg"
                      onClick={() => handleStart(c)}
                    >
                      {c.ctaLabel} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <ul className="space-y-3 text-left">
                      {(c.features.length ? c.features : ["—"]).map(
                        (name, i) => (
                          <li key={i} className="flex items-start">
                            <Check className="h-5 w-5 text-emerald-600 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                              {name}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* <div className="text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-emerald-600 mr-2" />
                <span>30-day money-back guarantee</span>
              </div>
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-emerald-600 mr-2" />
                <span>Secure payment processing</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 text-emerald-600 mr-2" />
                <span>Cancel anytime</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              All plans include free setup and migration assistance
            </p>
          </div> */}
        </div>
      </section>
    </>
  );
}

// ===== TESTIMONIALS
function ProductTestimonials({
  data,
  ui,
}: {
  data: any;
  ui?: { trustedBy?: string };
}) {
  const stats: { label: string; value: string }[] = data?.stats || [];
  const testimonials: { quote: string; author?: string; company?: string }[] =
    data?.testimonials || [];
  const companies: string[] = data?.companies || [];
  if (!stats.length && !testimonials.length) return null;

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "fill-emerald-400 text-emerald-400" : "text-gray-300"
        }`}
      />
    ));

  return (
    <section
      id="testimonials"
      className="py-16 bg-gradient-to-br from-emerald-50 to-emerald-100/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {data?.title || "Loved by teams everywhere"}
          </h2>
          {data?.subtitle ? (
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {data.subtitle}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-center gap-8 mt-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-emerald-600">
                  {s.value}
                </div>
                <div className="text-sm text-gray-600">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Card
              key={i}
              className="h-full hover:shadow-lg transition-shadow duration-300 border-emerald-100"
            >
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center gap-1 mb-4">
                  {renderStars(5)}
                </div>
                <p className="text-gray-700 mb-6 flex-1 leading-relaxed">
                  "{t.quote || "Great product!"}"
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src="/placeholder.svg"
                      alt={t.author || "User"}
                    />
                  </Avatar>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {t.author || "Anonymous"}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t.company && t.company !== "Independent"
                        ? `at ${t.company}`
                        : "User"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">
            {ui?.trustedBy ?? "Trusted by modern teams"}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {companies.map((c, i) => (
              <div key={i} className="text-lg font-semibold text-gray-400">
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== FAQ
function ProductFAQStandalone({
  data,
  ui,
}: {
  data: any;
  ui?: { contactSupport?: string; choosePlan?: string };
}) {
  const faqs: { question: string; answer: string }[] = data?.faqs || [];
  if (!faqs.length) return null;
  return (
    <section id="faq" className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {data?.title || "Frequently Asked Questions"}
          </h2>
          {data?.subtitle ? (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {data.subtitle}
            </p>
          ) : null}
        </div>
        <div className="mb-12">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-emerald-100 rounded-lg px-6 py-2 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-emerald-700 py-4">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4 leading-relaxed">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div
          id="contact"
          className="text-center bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl p-8"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {data?.contactSection?.title || "Need more help?"}
          </h3>
          <p className="text-gray-600 mb-6">
            {data?.contactSection?.subtitle || "Contact our support team."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
            >
              {ui?.contactSupport ?? "Contact Support"}
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {ui?.choosePlan ?? "Choose Plan"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ===== FOOTER
function ProductFooter({ data }: { data?: any }) {
  const sections: Array<{ title?: string; links?: string[] }> =
    data?.sections ?? [];

  const productSec = sections.find(
    (s) =>
      String(s.title || "")
        .toLowerCase()
        .includes("product") // PRODUCT
  );
  const supportSec = sections.find(
    (s) =>
      String(s.title || "")
        .toLowerCase()
        .includes("support") // SUPPORT
  );

  return (
    <footer className="relative overflow-hidden border-t border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200">
      {/* soft diagonal blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-emerald-200/70 blur-3xl" />
        <div className="absolute -bottom-28 -right-24 h-96 w-96 rounded-full bg-emerald-300/70 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-900 bg-clip-text text-transparent"
            >
              {data?.companyName || "Agile Store"}
            </Link>
            <p className="mt-4 text-emerald-950/80 max-w-md">
              {data?.description ||
                "Empowering businesses with digital solutions that drive growth and efficiency. Transform your operations with our suite of professional tools."}
            </p>
            <div className="mt-6 flex space-x-4 text-emerald-900/80">
              {(data?.socialLinks ?? ["facebook", "twitter", "linkedin"]).map(
                (s: string, i: number) => (
                  <a key={i} href="#" className="hover:text-emerald-950">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </a>
                )
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-emerald-950 tracking-wider uppercase">
              {productSec?.title || "PRODUCT"}
            </h3>
            <ul className="mt-4 space-y-4">
              {(productSec?.links ?? ["Features", "Pricing", "Demo", "Reviews"])
                .slice(0, 4)
                .map((label: string, i: number) => {
                  const hrefMap: Record<string, string> = {
                    Features: "#features",
                    Pricing: "#pricing",
                    Demo: "#demo",
                    Reviews: "#testimonials",
                  };
                  const href = hrefMap[label] || "#";
                  return (
                    <li key={i}>
                      <a
                        href={href}
                        className="text-base text-emerald-900/80 hover:text-emerald-950"
                      >
                        {label}
                      </a>
                    </li>
                  );
                })}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-emerald-950 tracking-wider uppercase">
              {supportSec?.title || "SUPPORT"}
            </h3>
            <ul className="mt-4 space-y-4">
              {(
                supportSec?.links ?? [
                  "FAQ",
                  "Contact Support",
                  "Terms of Service",
                  "Privacy Policy",
                ]
              )
                .slice(0, 4)
                .map((label: string, i: number) => {
                  const hrefMap: Record<string, string> = {
                    FAQ: "#faq",
                    "Contact Support": "mailto:support@agilestore.com",
                    "Terms of Service": "/terms",
                    "Privacy Policy": "/privacy",
                  };
                  const href = hrefMap[label] || "#";
                  return (
                    <li key={i}>
                      <a
                        href={href}
                        className="text-base text-emerald-900/80 hover:text-emerald-950"
                      >
                        {label}
                      </a>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-emerald-300/60 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-base text-emerald-900/80">
              {data?.copyright || "© 2024 Agile Store. All rights reserved."}
            </p>
            <div className="mt-4 md:mt-0 flex items-center space-x-6">
              {(data?.badges ?? ["SSL Secured", "Privacy Protected"]).map(
                (b: string, i: number) => (
                  <div key={i} className="flex items-center space-x-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-700" />
                    <span className="text-sm text-emerald-900/90">{b}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ===== PAGE
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
  const [landingSectionsRaw, setLandingSectionsRaw] = useState<
    LandingSection[]
  >([]);
  const [packageMatrix, setPackageMatrix] = useState<PackageMatrixRow[]>([]);
  const [features, setFeatures] = useState<FeatureRow[]>([]);

  // bahasa aktif dari Provider (sinkron cookie/localStorage)
  const { lang: providerLang } = useLanguage();
  const lang: Lang = providerLang === "en" ? "en" : "id";
  const t = UI_STRINGS[lang as UILang];
  const usdRate = Number(process.env.NEXT_PUBLIC_USD_RATE || 16700);

  // sections siap render (sudah pilih content/content_en dan parse JSON)
  const landingSections = useMemo(
    () => localizeSections(landingSectionsRaw, lang),
    [landingSectionsRaw, lang]
  );

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!code) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchProductDetail(code);
        const payload: BackendPayload = (res?.data ? res.data : res) as any;
        const landing: LandingPayload = await fetchLandingPage(code);
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
          setPackageMatrix(payload.package_matrix || []);
          setFeatures(payload.features || []);
          setLandingSectionsRaw(
            (landing?.sections || []).filter((s: LandingSection) => s.enabled)
          );
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
        <section className="container mx-auto max-w-7xl px-4 py-10 sm:py-16">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <Skeleton className="h-10 w-2/3 bg-gray-100" />
              <Skeleton className="mt-4 h-4 w-5/6 bg-gray-100" />
              <Skeleton className="mt-2 h-4 w-2/3 bg-gray-100" />
              <div className="mt-8 flex gap-3">
                <Skeleton className="h-11 w-40 rounded-xl bg-gray-100" />
                <Skeleton className="h-11 w-40 rounded-xl bg-gray-100" />
              </div>
            </div>
            <div className="relative">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-gray-200/70 bg-gray-50 shadow-sm">
                <Skeleton className="absolute inset-0 bg-gray-100" />
                <Skeleton className="absolute right-4 top-6 h-16 w-40 rounded-xl bg-gray-100" />
                <Skeleton className="absolute left-4 bottom-6 h-16 w-44 rounded-xl bg-gray-100" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Skeleton className="h-16 w-16 rounded-full bg-gray-100" />
                </div>
              </div>
            </div>
          </div>
        </section>
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

  const sHero = getSection(landingSections, "hero");
  const sFeatures = getSection(landingSections, "features");
  const sDemo = getSection(landingSections, "demo");
  const sPricing = getSection(landingSections, "pricing");
  const sFAQ = getSection(landingSections, "faq");
  const sTestimonials = getSection(landingSections, "testimonials");
  const sBenefits = getSection(landingSections, "benefits");
  const sFooter = getSection(landingSections, "footer");

  // pilih konten sesuai bahasa (ambil dari kolom content_en ketika EN)
  const pricingText =
    lang === "en" && (sPricing as any)?.content_en
      ? (sPricing as any).content_en
      : sPricing?.content;

  return (
    <div className="min-h-screen bg-white pb-0">
      <ProductTopBar title={productName} productCode={code} />
      <main>
        <ProductHeroStandalone
          name={productName}
          description={productDesc}
          code={code}
          productName={productName}
          data={sHero?.content || {}}
          ui={{ seePricing: t.seePricing }}
        />

        {sBenefits && (
          <section className="py-12 bg-white" id="benefits">
            <div className="max-w-7xl mx-auto px-4">
              {/* heading sama gaya features */}
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  {sBenefits.content?.title || "Benefits"}
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  {sBenefits.content?.subtitle ||
                    "Everything you need to get live faster, scale smoothly, and run day-to-day operations with ease."}
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {(sBenefits.content?.benefits || []).map(
                  (b: any, i: number) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-gradient-to-b from-white to-emerald-50 p-6 ring-1 ring-emerald-100"
                    >
                      <div className="h-10 w-10 rounded-md bg-emerald-600/10 ring-1 ring-emerald-200" />
                      <div className="mt-3 font-semibold text-gray-900">
                        {b.title}
                      </div>
                      <div className="text-sm text-gray-600">
                        {b.description}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {sFeatures && <ProductFeatureGrid data={sFeatures.content} />}
        {sDemo && <ProductDemoGallery data={sDemo.content} />}

        <ProductPricingStandalone
          productCode={code}
          packages={packages}
          packageMatrix={packageMatrix}
          features={features}
          pricingText={pricingText}
          lang={lang}
          usdRate={usdRate}
        />

        {sTestimonials && (
          <ProductTestimonials
            data={sTestimonials.content}
            ui={{ trustedBy: t.trustedBy }}
          />
        )}
        {sFAQ && (
          <ProductFAQStandalone
            data={sFAQ.content}
            ui={{ contactSupport: t.contactSupport, choosePlan: t.choosePlan }}
          />
        )}
      </main>
      <ProductFooter data={sFooter?.content} />
      {/* <ProductMobileCTA productSlug={code} /> */}
    </div>
  );
}
