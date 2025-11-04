// // components/footer.tsx
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Facebook,
//   Twitter,
//   Linkedin,
//   Instagram,
//   Mail,
//   Phone,
//   MapPin,
// } from "lucide-react";
// import { AgileStoreAPI } from "@/lib/api";
// import { cookies } from "next/headers";

// type Lang = "id" | "en";

// // Fallback jika content belum diisi
// const FALLBACK = {
//   brand: "Agile Store",
//   contact: {
//     email: "hello@agilestore.com",
//     phone: "+1 (555) 123-4567",
//     address: "San Francisco, CA",
//   },
//   quickLinks: ["Products", "Pricing", "About", "Contact", "Support"],
//   description:
//     "Transform your workflow with professional e-commerce solutions designed for agile teams and modern businesses.",
//   newsletterLabel: "Enter your email",
// };

// type FooterContent = typeof FALLBACK;

// async function readLang(): Promise<Lang> {
//   const maybe = cookies() as any;
//   const store = typeof maybe?.then === "function" ? await maybe : maybe;
//   const raw =
//     store.get("agile.lang")?.value ??
//     store.get("agile_lang")?.value ??
//     store.get("lang")?.value ??
//     "";
//   return raw === "en" ? "en" : "id";
// }

// // mapping label → href yang aman
// function linkHref(label: string) {
//   const key = label.trim().toLowerCase();
//   if (key.includes("product") || key.includes("produk")) return "/products";
//   if (key.includes("pricing") || key.includes("harga")) return "/pricing";
//   if (key.includes("about") || key.includes("tentang")) return "/about";
//   if (key.includes("contact") || key.includes("kontak")) return "/contact";
//   if (
//     key.includes("support") ||
//     key.includes("dukungan") ||
//     key.includes("bantuan")
//   )
//     return "/support";
//   return `/${key.replace(/\s+/g, "-")}`;
// }

// async function getFooterContent(lang: Lang): Promise<FooterContent> {
//   const sec = await AgileStoreAPI.getSection<any>("footer");

//   // Pilih payload sesuai bahasa (berapa pun struktur yang ada)
//   const contentEn =
//     sec?.content_en ?? sec?.content?.en ?? sec?.content?.["en"] ?? null;

//   const base: FooterContent =
//     lang === "en" && contentEn
//       ? (contentEn as FooterContent)
//       : (sec?.content as FooterContent) ?? FALLBACK;

//   return {
//     brand: base.brand ?? FALLBACK.brand,
//     contact: {
//       email: base.contact?.email ?? FALLBACK.contact.email,
//       phone: base.contact?.phone ?? FALLBACK.contact.phone,
//       address: base.contact?.address ?? FALLBACK.contact.address,
//     },
//     quickLinks:
//       Array.isArray(base.quickLinks) && base.quickLinks.length
//         ? base.quickLinks
//         : FALLBACK.quickLinks,
//     description: base.description ?? FALLBACK.description,
//     newsletterLabel: base.newsletterLabel ?? FALLBACK.newsletterLabel,
//   };
// }

// async function Footer() {
//   const lang = await readLang();
//   const data = await getFooterContent(lang);
//   const year = new Date().getFullYear();

//   // Label UI statis bilingual
//   const T = {
//     en: {
//       quickLinks: "Quick Links",
//       contactInfo: "Contact Info",
//       stayUpdated: "Stay Updated",
//       newsletterDesc:
//         "Subscribe to our newsletter for the latest updates and exclusive offers.",
//       subscribe: "Subscribe",
//       privacy: "Privacy Policy",
//       terms: "Terms of Service",
//       cookie: "Cookie Policy",
//       allRights: "All rights reserved.",
//     },
//     id: {
//       quickLinks: "Tautan Cepat",
//       contactInfo: "Kontak",
//       stayUpdated: "Tetap Terupdate",
//       newsletterDesc:
//         "Berlangganan newsletter kami untuk update terbaru dan penawaran eksklusif.",
//       subscribe: "Berlangganan",
//       privacy: "Kebijakan Privasi",
//       terms: "Syarat Layanan",
//       cookie: "Kebijakan Cookie",
//       allRights: "Hak cipta dilindungi.",
//     },
//   } as const;

//   const L = T[lang];

//   return (
//     <footer className="bg-foreground text-background">
//       <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
//           {/* Company Info */}
//           <div className="space-y-4">
//             <div className="flex items-center space-x-2">
//               <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
//                 <span className="text-white font-bold text-sm">
//                   {data.brand
//                     ?.split(" ")
//                     .map((s: string) => s[0])
//                     .join("")
//                     .slice(0, 2)
//                     .toUpperCase() || "AS"}
//                 </span>
//               </div>
//               <span className="font-serif font-bold text-xl">{data.brand}</span>
//             </div>
//             <p className="text-background/80 leading-relaxed">
//               {data.description}
//             </p>
//             <div className="flex space-x-4">
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="text-background/80 hover:text-background hover:bg-background/10"
//                 aria-label="Facebook"
//               >
//                 <Facebook className="h-4 w-4" />
//               </Button>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="text-background/80 hover:text-background hover:bg-background/10"
//                 aria-label="Twitter / X"
//               >
//                 <Twitter className="h-4 w-4" />
//               </Button>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="text-background/80 hover:text-background hover:bg-background/10"
//                 aria-label="LinkedIn"
//               >
//                 <Linkedin className="h-4 w-4" />
//               </Button>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="text-background/80 hover:text-background hover:bg-background/10"
//                 aria-label="Instagram"
//               >
//                 <Instagram className="h-4 w-4" />
//               </Button>
//             </div>
//           </div>

//           {/* Quick Links */}
//           <div className="space-y-4">
//             <h3 className="font-serif font-semibold text-lg">{L.quickLinks}</h3>
//             <ul className="space-y-2">
//               {data.quickLinks.map((label: string, i: number) => (
//                 <li key={`${label}-${i}`}>
//                   <Link
//                     href={linkHref(label)}
//                     className="text-background/80 hover:text-background transition-colors"
//                   >
//                     {label}
//                   </Link>
//                 </li>
//               ))}
//             </ul>
//           </div>

//           {/* Contact Info */}
//           <div className="space-y-4">
//             <h3 className="font-serif font-semibold text-lg">
//               {L.contactInfo}
//             </h3>
//             <ul className="space-y-3">
//               <li className="flex items-center space-x-3">
//                 <Mail className="h-4 w-4 text-background/80" />
//                 <span className="text-background/80">{data.contact.email}</span>
//               </li>
//               <li className="flex items-center space-x-3">
//                 <Phone className="h-4 w-4 text-background/80" />
//                 <span className="text-background/80">{data.contact.phone}</span>
//               </li>
//               <li className="flex items-center space-x-3">
//                 <MapPin className="h-4 w-4 text-background/80" />
//                 <span className="text-background/80">
//                   {data.contact.address}
//                 </span>
//               </li>
//             </ul>
//           </div>

//           {/* Newsletter */}
//           <div className="space-y-4">
//             <h3 className="font-serif font-semibold text-lg">
//               {L.stayUpdated}
//             </h3>
//             <p className="text-background/80 text-sm">{L.newsletterDesc}</p>
//             <div className="space-y-2">
//               <Input
//                 type="email"
//                 placeholder={
//                   data.newsletterLabel ||
//                   (lang === "en" ? "Enter your email" : "Masukkan email Anda")
//                 }
//                 className="bg-background/10 border-background/20 text-background placeholder:text-background/60"
//               />
//               <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
//                 {L.subscribe}
//               </Button>
//             </div>
//           </div>
//         </div>

//         <div className="border-t border-background/20 mt-12 pt-8">
//           <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
//             <p className="text-background/80 text-sm">
//               © {year} {data.brand}. {L.allRights}
//             </p>
//             <div className="flex space-x-6 text-sm">
//               <Link
//                 href="/privacy"
//                 className="text-background/80 hover:text-background transition-colors"
//               >
//                 {T[lang].privacy}
//               </Link>
//               <Link
//                 href="/terms"
//                 className="text-background/80 hover:text-background transition-colors"
//               >
//                 {T[lang].terms}
//               </Link>
//               <Link
//                 href="/cookies"
//                 className="text-background/80 hover:text-background transition-colors"
//               >
//                 {T[lang].cookie}
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// }

// export { Footer };
// export default Footer;

// components/footer.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { AgileStoreAPI, pickLocale } from "@/lib/api";
import { cookies } from "next/headers";

type Lang = "id" | "en";

/* =========================
   Fallback statis
========================= */
const FALLBACK = {
  brand: "Agile Store",
  contact: {
    email: "hello@agilestore.com",
    phone: "+1 (555) 123-4567",
    address: "San Francisco, CA",
  },
  quickLinks: ["Products", "Pricing", "About", "Contact", "Support"],
  description:
    "Transform your workflow with professional e-commerce solutions designed for agile teams and modern businesses.",
  newsletterLabel: "Enter your email",
};

const T = {
  en: {
    quickLinks: "Quick Links",
    contactInfo: "Contact Info",
    stayUpdated: "Stay Updated",
    newsletterDesc:
      "Subscribe to our newsletter for the latest updates and exclusive offers.",
    subscribe: "Subscribe",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    cookie: "Cookie Policy",
    allRights: "All rights reserved.",
  },
  id: {
    quickLinks: "Tautan Cepat",
    contactInfo: "Kontak",
    stayUpdated: "Tetap Terupdate",
    newsletterDesc:
      "Berlangganan newsletter kami untuk update terbaru dan penawaran eksklusif.",
    subscribe: "Berlangganan",
    privacy: "Kebijakan Privasi",
    terms: "Syarat Layanan",
    cookie: "Kebijakan Cookie",
    allRights: "Hak cipta dilindungi.",
  },
} as const;

/* =========================
   Helpers
========================= */
async function readLang(): Promise<Lang> {
  const maybe = cookies() as any;
  const store = typeof maybe?.then === "function" ? await maybe : maybe;
  const raw =
    store.get("agile.lang")?.value ??
    store.get("agile_lang")?.value ??
    store.get("lang")?.value ??
    "";
  return raw === "en" ? "en" : "id";
}

// mapping label → href yang aman
function linkHref(label: string) {
  const key = (label || "").trim().toLowerCase();
  if (key.includes("product") || key.includes("produk")) return "/products";
  if (key.includes("pricing") || key.includes("harga")) return "/pricing";
  if (key.includes("about") || key.includes("tentang")) return "/about";
  if (key.includes("contact") || key.includes("kontak")) return "/contact";
  if (
    key.includes("support") ||
    key.includes("dukungan") ||
    key.includes("bantuan")
  )
    return "/support";
  return `/${key.replace(/\s+/g, "-")}`;
}

// normalisasi array quick links dari berbagai bentuk
function normalizeQuickLinks(src: any): string[] {
  if (!src) return [];
  // langsung array string
  if (Array.isArray(src) && src.every((x) => typeof x === "string")) {
    return src as string[];
  }
  // array objek { label|name|title }
  const arr =
    (Array.isArray(src) && src) ||
    (Array.isArray(src?.items) && src.items) ||
    [];
  const labels = arr
    .map((it: any) => {
      if (typeof it === "string") return it;
      return it?.label ?? it?.name ?? it?.title ?? null;
    })
    .filter(Boolean);
  return labels.length ? labels : [];
}

/* =========================
   Fetch footer + contact with locale
========================= */
async function getFooterContent(lang: Lang) {
  const [footerSec, contactSec] = await Promise.all([
    AgileStoreAPI.getSection<any>("footer"),
    AgileStoreAPI.getSection<any>("contact"),
  ]);

  // pilih locale (AgileStoreAPI sudah parse content_en kalau string JSON)
  const footer = pickLocale<any>(footerSec, lang).content ?? {};
  const contact = pickLocale<any>(contactSec, lang).content ?? {};

  // brand/desc/newsletter
  const brand = footer?.brand ?? footer?.title ?? FALLBACK.brand;

  const description =
    footer?.description ?? footer?.subtitle ?? FALLBACK.description;

  const newsletterLabel =
    footer?.newsletterLabel ??
    footer?.newsletter_label ??
    FALLBACK.newsletterLabel;

  // quick links dari footer: quickLinks | links | items[]
  const quickLinks =
    normalizeQuickLinks(footer?.quickLinks) ||
    normalizeQuickLinks(footer?.links) ||
    normalizeQuickLinks(footer?.items) ||
    FALLBACK.quickLinks;

  // contact: prioritaskan section "contact" (sesuai permintaan)
  const contactEmail =
    contact?.email ??
    contact?.contact?.email ??
    footer?.contact?.email ??
    FALLBACK.contact.email;

  const contactPhone =
    contact?.phone ??
    contact?.contact?.phone ??
    footer?.contact?.phone ??
    FALLBACK.contact.phone;

  const contactAddress =
    contact?.address ??
    contact?.contact?.address ??
    footer?.contact?.address ??
    FALLBACK.contact.address;

  return {
    brand,
    description,
    newsletterLabel,
    quickLinks,
    contact: {
      email: contactEmail,
      phone: contactPhone,
      address: contactAddress,
    },
  };
}

/* =========================
   Component
========================= */
async function Footer() {
  const lang = await readLang();
  const data = await getFooterContent(lang);
  const L = T[lang];
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {data.brand
                    ?.split(" ")
                    .map((s: string) => s[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "AS"}
                </span>
              </div>
              <span className="font-serif font-bold text-xl">{data.brand}</span>
            </div>
            <p className="text-background/80 leading-relaxed">
              {data.description}
            </p>
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-background/80 hover:text-background hover:bg-background/10"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-background/80 hover:text-background hover:bg-background/10"
                aria-label="Twitter / X"
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-background/80 hover:text-background hover:bg-background/10"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-background/80 hover:text-background hover:bg-background/10"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-serif font-semibold text-lg">{L.quickLinks}</h3>
            <ul className="space-y-2">
              {data.quickLinks.map((label: string, i: number) => (
                <li key={`${label}-${i}`}>
                  <Link
                    href={linkHref(label)}
                    className="text-background/80 hover:text-background transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-serif font-semibold text-lg">
              {L.contactInfo}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-background/80" />
                <span className="text-background/80">{data.contact.email}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-background/80" />
                <span className="text-background/80">{data.contact.phone}</span>
              </li>
              <li className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-background/80" />
                <span className="text-background/80">
                  {data.contact.address}
                </span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-serif font-semibold text-lg">
              {L.stayUpdated}
            </h3>
            <p className="text-background/80 text-sm">{L.newsletterDesc}</p>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder={
                  data.newsletterLabel ||
                  (lang === "en" ? "Enter your email" : "Masukkan email Anda")
                }
                className="bg-background/10 border-background/20 text-background placeholder:text-background/60"
              />
              <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                {L.subscribe}
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-background/80 text-sm">
              © {year} {data.brand}. {T[lang].allRights}
            </p>
            <div className="flex space-x-6 text-sm">
              <Link
                href="/privacy"
                className="text-background/80 hover:text-background transition-colors"
              >
                {T[lang].privacy}
              </Link>
              <Link
                href="/terms"
                className="text-background/80 hover:text-background transition-colors"
              >
                {T[lang].terms}
              </Link>
              <Link
                href="/cookies"
                className="text-background/80 hover:text-background transition-colors"
              >
                {T[lang].cookie}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
export default Footer;
