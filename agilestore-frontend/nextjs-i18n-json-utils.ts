/*
  nextjs-i18n-json-utils.ts
  -----------------------------------------------------
  Lightweight JSON-based i18n utilities for Next.js apps that consume
  sections like the payload you shared. No external API/proxy required.

  ✔ Handles `content_en` being a JSON *string* or object
  ✔ Picks the right language with sensible fallback rules
  ✔ Normalizes the whole sections array → easy keyed access
  ✔ Tiny helpers to read nested fields safely (e.g. t('hero', 'title'))
  ✔ Works in Server Components or Client Components

  Usage quickstart (Server Component example):

  import { normalizeSections, localizeSection, tFrom } from "./nextjs-i18n-json-utils";
  import { cookies } from "next/headers";

  export default async function Page() {
    const lang = (cookies().get("agile_lang")?.value as Lang) || "id";
    const res = await fetch(process.env.NEXT_PUBLIC_API_BASE + "/catalog/products/NATABANYU/landing", { cache: "no-store" });
    const json = await res.json();

    const { byKey } = normalizeSections(json?.data ?? json ?? {});

    // Access a localized section object:
    const hero = localizeSection(byKey.hero, lang);

    // Read specific fields with type-safe access:
    const title = tFrom(byKey, lang)("hero", "title") || "";

    return (
      <div>
        <h1>{title}</h1>
        <p>{hero?.subtitle}</p>
      </div>
    );
  }
*/

/* ===================== Types ===================== */
export type Lang = "id" | "en";

type Primitive = string | number | boolean | null | undefined;

type Json = Primitive | Json[] | { [key: string]: Json };

export interface ApiSectionRaw {
  id?: string | number;
  key: string; // e.g. "hero", "pricing"
  name?: string | null;
  enabled?: boolean;
  order?: number;
  theme?: Record<string, any> | null;
  content?: Json | null; // usually Indonesian
  content_en?: Json | string | null; // EN, sometimes JSON string
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  [k: string]: any;
}

export interface NormalizedSection {
  id?: string | number;
  key: string;
  name?: string | null;
  enabled: boolean;
  order: number;
  theme?: Record<string, any> | null;
  // Canonical, parsed objects (never string):
  content_id: Record<string, any> | null;
  content_en: Record<string, any> | null;
  raw: ApiSectionRaw; // keep original for debugging
}

export interface NormalizedBundle {
  list: NormalizedSection[];
  byKey: Record<string, NormalizedSection>;
}

/* ===================== Core helpers ===================== */
/** Parse JSON if it's a string; return object/null without throwing. */
export function safeParseObject<T = Record<string, any>>(
  maybe: unknown
): T | null {
  if (maybe == null) return null;
  if (typeof maybe === "object" && !Array.isArray(maybe)) return maybe as T;
  if (typeof maybe === "string") {
    try {
      const parsed = JSON.parse(maybe);
      return typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
        ? (parsed as T)
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Ensure value is a plain object (else null). */
export function toPlainObject<T = Record<string, any>>(v: unknown): T | null {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as T;
  return null;
}

/** Convert an arbitrary `content` field to object. */
export function coerceContentObject(
  maybe: unknown
): Record<string, any> | null {
  return safeParseObject<Record<string, any>>(maybe) ?? toPlainObject(maybe);
}

/** Normalize a single API section into a strongly-typed shape. */
export function normalizeSection(raw: ApiSectionRaw): NormalizedSection {
  const content_id = coerceContentObject(raw.content);
  const content_en = coerceContentObject(raw.content_en);

  return {
    id: raw.id,
    key: raw.key,
    name: raw.name ?? null,
    enabled: Boolean(raw.enabled ?? true),
    order: Number(raw.order ?? 0),
    theme: raw.theme ?? null,
    content_id: content_id ?? null,
    content_en: content_en ?? null,
    raw,
  };
}

/** Normalize the payload's `data` array (or root array) into list + byKey. */
export function normalizeSections(payload: any): NormalizedBundle {
  const arr: ApiSectionRaw[] = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.sections)
    ? payload.sections
    : [];

  const list = arr.map(normalizeSection).sort((a, b) => a.order - b.order);
  const byKey: Record<string, NormalizedSection> = {};
  for (const s of list) byKey[s.key] = s;
  return { list, byKey };
}

/* ===================== Locale picking ===================== */
/**
 * Pick localized object for a section.
 * Rules:
 * - lang === 'en' → prefer content_en, else fallback to content_id
 * - lang === 'id' → prefer content_id, else fallback to content_en
 */
export function pickLocalizedContent(
  section: NormalizedSection | undefined,
  lang: Lang
): Record<string, any> | null {
  if (!section) return null;
  if (lang === "en") return section.content_en ?? section.content_id;
  return section.content_id ?? section.content_en;
}

/** Get a *copy* of the localized object so downstream code can mutate safely. */
export function localizeSection(
  section: NormalizedSection | undefined,
  lang: Lang
): Record<string, any> | null {
  const obj = pickLocalizedContent(section, lang);
  return obj ? structuredClone(obj) : null;
}

/* ===================== Tiny accessors ===================== */
/** Safe nested read using dot-path (e.g., "price.monthly"). */
export function getAtPath<T = any>(obj: any, path: string): T | undefined {
  if (!obj) return undefined;
  const parts = path.split(".").filter(Boolean);
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur as T;
}

/** Build a translator fn bound to a normalized bundle. */
export function tFrom(byKey: NormalizedBundle["byKey"], lang: Lang) {
  return (sectionKey: string, path: string) => {
    const section = byKey[sectionKey];
    const localized = pickLocalizedContent(section, lang);
    return localized ? getAtPath(localized, path) : undefined;
  };
}

/* ===================== Example render helpers ===================== */
export function localizedHero(byKey: NormalizedBundle["byKey"], lang: Lang) {
  const s = localizeSection(byKey["hero"], lang);
  return {
    title: s?.title ?? "",
    subtitle: s?.subtitle ?? "",
    primaryCta: s?.primaryCta ?? "",
    secondaryCta: s?.secondaryCta ?? "",
  };
}

export function localizedWhy(byKey: NormalizedBundle["byKey"], lang: Lang) {
  const s = localizeSection(byKey["why"], lang);
  return {
    title: s?.title ?? "",
    items: Array.isArray(s?.items)
      ? (s!.items as Array<{ title: string; description: string }>)
      : [],
  };
}

export function localizedHow(byKey: NormalizedBundle["byKey"], lang: Lang) {
  const s = localizeSection(byKey["how"], lang);
  return {
    title: s?.title ?? "",
    subtitle: s?.subtitle ?? "",
    steps: Array.isArray(s?.steps)
      ? (s!.steps as Array<{ title: string; description: string }>)
      : [],
  };
}

export function localizedProducts(
  byKey: NormalizedBundle["byKey"],
  lang: Lang
) {
  const s = localizeSection(byKey["products"], lang);
  return {
    title: s?.title ?? "",
    subtitle: s?.subtitle ?? "",
    items: Array.isArray(s?.items)
      ? (s!.items as Array<{
          name: string;
          description: string;
          product_code?: string;
          cta?: string;
        }>)
      : [],
  };
}

export function localizedPricing(byKey: NormalizedBundle["byKey"], lang: Lang) {
  const s = localizeSection(byKey["pricing"], lang);
  type Plan = {
    name: string;
    cta?: string;
    popular?: boolean;
    price?: { monthly?: number; yearly?: number };
    features?: string[];
  };
  const plans = Array.isArray(s?.plans) ? (s!.plans as Plan[]) : [];
  return {
    title: s?.title ?? "",
    subtitle: s?.subtitle ?? "",
    refProductCode: s?.refProductCode ?? null,
    plans,
  };
}

export function localizedCTA(byKey: NormalizedBundle["byKey"], lang: Lang) {
  const s = localizeSection(byKey["cta"], lang);
  return {
    title: s?.title ?? "",
    subtitle: s?.subtitle ?? "",
    primary: s?.primary ?? "",
    secondary: s?.secondary ?? "",
    bullets: Array.isArray(s?.bullets) ? (s!.bullets as string[]) : [],
  };
}

export function localizedTestimonials(
  byKey: NormalizedBundle["byKey"],
  lang: Lang
) {
  const s = localizeSection(byKey["testimonials"], lang);
  return {
    title: s?.title ?? "",
    items: Array.isArray(s?.items)
      ? (s!.items as Array<{ name: string; role?: string; quote: string }>)
      : [],
  };
}

export function localizedFooter(byKey: NormalizedBundle["byKey"], lang: Lang) {
  const s = localizeSection(byKey["footer"], lang);
  return {
    brand: s?.brand ?? "",
    description: s?.description ?? "",
    quickLinks: Array.isArray(s?.quickLinks) ? (s!.quickLinks as string[]) : [],
    contact:
      toPlainObject<{ email?: string; phone?: string; address?: string }>(
        s?.contact
      ) ?? {},
    newsletterLabel: s?.newsletterLabel ?? "",
  };
}

export function localizedAbout(byKey: NormalizedBundle["byKey"], lang: Lang) {
  const s = localizeSection(byKey["about"], lang);
  return {
    headline: s?.headline ?? "",
    subheadline: s?.subheadline ?? "",
    featuresHeadline: s?.featuresHeadline ?? "",
    testimonialsHeadline: s?.testimonialsHeadline ?? "",
    steps: Array.isArray(s?.steps)
      ? (s!.steps as Array<{ title: string; description: string }>)
      : [],
    features: Array.isArray(s?.features) ? (s!.features as string[]) : [],
    testimonials: Array.isArray(s?.testimonials)
      ? (s!.testimonials as Array<{
          name: string;
          role?: string;
          quote: string;
        }>)
      : [],
  };
}

export function localizedContact(byKey: NormalizedBundle["byKey"], lang: Lang) {
  const s = localizeSection(byKey["contact"], lang);
  return {
    headline: s?.headline ?? "",
    subheadline: s?.subheadline ?? "",
    ctaLabel: s?.ctaLabel ?? "",
    email: s?.email ?? "",
    phone: s?.phone ?? "",
    address: s?.address ?? "",
  };
}

/* ===================== Optional: simple typo fixer ===================== */
/** Fix a few obvious EN typos you showed in sample data. Call this before render if desired. */
export function fixEnglishTypos<T extends Record<string, any>>(
  obj: T | null
): T | null {
  if (!obj) return obj;
  const json = JSON.stringify(obj);
  const fixed = json
    .replaceAll(/Productsss\b/g, "Products")
    .replaceAll(
      /All-in-One SaaS Marketplaces\b/g,
      "All-in-One SaaS Marketplace"
    )
    .replaceAll(/Easy Setups\b/g, "Easy Setup")
    .replaceAll(/Choose your productss\b/g, "Choose your product");
  try {
    return JSON.parse(fixed) as T;
  } catch {
    return obj; // best effort
  }
}

/* ===================== Client helper (optional) ===================== */
/**
 * Read lang from cookie/localStorage on the client. Use only in Client Components.
 * Server Components should read from cookies() directly.
 */
export function getClientLang(defaultLang: Lang = "id"): Lang {
  if (typeof window === "undefined") return defaultLang;
  const fromLS = (
    window.localStorage?.getItem("agile_lang") ?? ""
  ).toLowerCase();
  if (fromLS === "en" || fromLS === "id") return fromLS as Lang;
  const fromCookie = document.cookie.match(/(?:^|; )agile_lang=([^;]+)/)?.[1];
  const normalized = decodeURIComponent(fromCookie || "").toLowerCase();
  return normalized === "en" || normalized === "id"
    ? (normalized as Lang)
    : defaultLang;
}
