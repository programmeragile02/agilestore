// // app/about/page.tsx
// import Link from "next/link";
// import { Header } from "@/components/header";
// import { Footer } from "@/components/footer";
// import { AgileStoreAPI } from "@/lib/api";

// type AboutContent = {
//   steps?: { title: string; description: string }[];
//   features?: string[];
//   headline?: string;
//   subheadline?: string;
//   testimonials?: {
//     name?: string;
//     role?: string;
//     quote?: string;
//     content?: string;
//     description?: string;
//   }[];
//   featuresHeadline?: string;
//   testimonialsHeadline?: string;
// };

// type Normalized = {
//   headline: string;
//   subheadline: string;
//   steps: { title: string; description: string }[];
//   features: string[];
//   testimonialsHeadline: string;
//   testimonials: { name: string; role: string; quote: string }[];
//   featuresHeadline: string;
// };

// // Fallback (mutable)
// const FALLBACK: AboutContent = {
//   headline: "All-in-One SaaS Marketplace",
//   subheadline:
//     "Discover powerful solutions designed to streamline your business operations and boost productivity.",
//   steps: [
//     {
//       title: "Choose your products",
//       description: "Browse our collection and find the perfect solution.",
//     },
//     {
//       title: "Select a package",
//       description: "Pick the plan that fits your needs and budget.",
//     },
//     {
//       title: "Start using instantly",
//       description: "Get access immediately with quick setup.",
//     },
//   ],
//   features: [
//     "Easy Setup",
//     "Affordable Pricing",
//     "Scalable Solutions",
//     "24/7 Support",
//   ],
//   testimonialsHeadline: "Trusted by 100+ businesses and organizations",
//   testimonials: [
//     {
//       name: "Sarah Johnson",
//       role: "Business Owner",
//       quote: "Agile Store transformed our rental business completely.",
//     },
//     {
//       name: "Ahmad Rahman",
//       role: "Community Leader",
//       quote: "Perfect solution for managing our activities.",
//     },
//     {
//       name: "Lisa Chen",
//       role: "Sales Manager",
//       quote: "Our team productivity increased by 60%.",
//     },
//   ],
//   featuresHeadline: "Why Agile Store",
// };

// function normalizeTestimonialsFromContent(arr: any[] | undefined | null) {
//   if (!Array.isArray(arr)) return null;
//   const mapped = arr.map((t) => ({
//     name: t?.name ?? t?.person_name ?? t?.title ?? "",
//     role: t?.role ?? t?.person_role ?? t?.subtitle ?? "",
//     quote: t?.quote ?? t?.content ?? t?.description ?? "",
//   }));
//   return mapped.filter((x) => x.name || x.quote);
// }

// function normalizeTestimonialsFromItems(items: any[] | undefined | null) {
//   if (!Array.isArray(items)) return null;
//   const mapped = items.map((it) => {
//     const ex = it?.extras ?? {};
//     return {
//       name: it?.title ?? ex?.person_name ?? ex?.name ?? it?.name ?? "",
//       role: it?.subtitle ?? ex?.person_role ?? ex?.role ?? "",
//       quote: ex?.quote ?? it?.description ?? it?.content ?? "",
//     };
//   });
//   return mapped.filter((x) => x.name || x.quote);
// }

// async function getAbout(): Promise<Normalized> {
//   // Ambil about + testimonials
//   const [aboutSec, testiSec] = await Promise.all([
//     AgileStoreAPI.getSection<AboutContent>("about"),
//     AgileStoreAPI.getSection<any>("testimonials"),
//   ]);
//   const c = aboutSec?.content ?? {};

//   // 1) from about.content
//   const t1 = normalizeTestimonialsFromContent((c as any).testimonials);
//   // 2) from about.items
//   const t2 = normalizeTestimonialsFromItems((aboutSec as any)?.items);
//   // 3) from testimonials.items (global section testimonials)
//   const t3 = normalizeTestimonialsFromItems((testiSec as any)?.items);

//   const testimonialsSrc =
//     (t1 && t1.length ? t1 : null) ??
//     (t2 && t2.length ? t2 : null) ??
//     (t3 && t3.length ? t3 : null) ??
//     (FALLBACK.testimonials as any[]);

//   return {
//     headline: (c.headline ?? FALLBACK.headline) as string,
//     subheadline: (c.subheadline ?? FALLBACK.subheadline) as string,
//     steps:
//       Array.isArray(c.steps) && c.steps.length
//         ? [...c.steps]
//         : [...(FALLBACK.steps as any[])],
//     features:
//       Array.isArray(c.features) && c.features.length
//         ? [...c.features]
//         : [...(FALLBACK.features as any[])],
//     testimonialsHeadline: (c.testimonialsHeadline ??
//       FALLBACK.testimonialsHeadline) as string,
//     testimonials: testimonialsSrc.map((t: any) => ({
//       name: String(t.name ?? ""),
//       role: String(t.role ?? ""),
//       quote: String(t.quote ?? ""),
//     })),
//     featuresHeadline: (c.featuresHeadline ??
//       FALLBACK.featuresHeadline) as string,
//   };
// }

// export default async function AboutPage() {
//   const data = await getAbout();

//   // Siapkan 4 item “values” dari steps (atau pad dengan features)
//   const valuesGrid = (() => {
//     const steps = data.steps.slice(0, 4);
//     if (steps.length === 4) return steps;
//     const extra = data.features.slice(0, 4 - steps.length).map((f) => ({
//       title: f,
//       description: "Built to help you move faster with clarity and support.",
//     }));
//     return [...steps, ...extra].slice(0, 4);
//   })();

//   return (
//     <main>
//       <Header />

//       {/* Hero */}
//       <section className="bg-muted/30 border-b bg-gradient-to-r from-blue-600 to-violet-600">
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
//           <div className="max-w-3xl">
//             <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase text-white">
//               About Agile Store
//             </p>
//             <h1 className="mt-3 font-serif font-bold text-3xl sm:text-5xl text-balance text-foreground text-white">
//               {data.headline}
//             </h1>
//             <p className="mt-4 text-lg text-muted-foreground text-white">
//               {data.subheadline}
//             </p>
//             <div className="mt-6 flex items-center gap-3">
//               <Link
//                 href="/products"
//                 className="inline-flex items-center rounded-lg px-4 py-2 font-medium text-white bg-gradient-to-r from-indigo-500 to-blue-500 hover:opacity-90"
//               >
//                 Explore Products
//               </Link>
//               <Link
//                 href="/contact"
//                 className="inline-flex items-center rounded-lg px-4 py-2 font-medium border border-border bg-background hover:bg-muted"
//               >
//                 Contact Us
//               </Link>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Mission + Values */}
//       <section className="py-14 sm:py-20">
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid gap-10 md:grid-cols-2">
//             {/* Mission */}
//             <div className="rounded-xl border bg-background p-6 sm:p-8">
//               <h2 className="font-serif text-2xl font-bold text-foreground">
//                 Our Mission
//               </h2>
//               <p className="mt-3 text-muted-foreground">{data.subheadline}</p>

//               <ul className="mt-6 grid gap-3">
//                 {data.features.slice(0, 3).map((feat, i) => (
//                   <li key={i} className="flex items-start gap-3">
//                     <span
//                       className={[
//                         "mt-1 h-2.5 w-2.5 rounded-full",
//                         ["bg-indigo-500", "bg-blue-500", "bg-slate-400"][i % 3],
//                       ].join(" ")}
//                     />
//                     <span className="text-foreground">{feat}</span>
//                   </li>
//                 ))}
//               </ul>
//             </div>

//             {/* Values */}
//             <div className="rounded-xl border bg-background p-6 sm:p-8">
//               <h3 className="font-serif text-2xl font-bold text-foreground">
//                 {data.featuresHeadline}
//               </h3>
//               <div className="mt-6 grid gap-4 sm:grid-cols-2">
//                 {valuesGrid.map((v, i) => (
//                   <div key={i} className="rounded-lg border p-4">
//                     <p className="font-medium text-foreground">{v.title}</p>
//                     <p className="text-sm text-muted-foreground mt-1">
//                       {v.description}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Stats (placeholder) */}
//           <div className="mt-10 grid gap-4 sm:grid-cols-3">
//             <div className="rounded-lg border p-6 text-center">
//               <p className="text-3xl font-bold text-foreground">50k+</p>
//               <p className="text-sm text-muted-foreground mt-1">Active users</p>
//             </div>
//             <div className="rounded-lg border p-6 text-center">
//               <p className="text-3xl font-bold text-foreground">99.9%</p>
//               <p className="text-sm text-muted-foreground mt-1">
//                 Uptime across products
//               </p>
//             </div>
//             <div className="rounded-lg border p-6 text-center">
//               <p className="text-3xl font-bold text-foreground">24/7</p>
//               <p className="text-sm text-muted-foreground mt-1">
//                 Priority support
//               </p>
//             </div>
//           </div>

//           {/* Testimonials mini */}
//           <div className="mt-12">
//             <h4 className="text-center font-serif text-xl font-bold text-foreground">
//               {data.testimonialsHeadline}
//             </h4>
//             <div className="mt-6 grid gap-4 md:grid-cols-3">
//               {data.testimonials.slice(0, 3).map((t, i) => (
//                 <div key={i} className="rounded-lg border p-5">
//                   <p className="text-sm text-muted-foreground mb-4">
//                     “
//                     {(t.quote ?? "").toString().trim().length
//                       ? t.quote
//                       : "Great experience using Agile Store."}
//                     ”
//                   </p>
//                   <div>
//                     <p className="font-medium text-foreground">
//                       {t.name || "—"}
//                     </p>
//                     {t.role ? (
//                       <p className="text-xs text-muted-foreground">{t.role}</p>
//                     ) : null}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>
//       <Footer />
//     </main>
//   );
// }

// app/about/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { AgileStoreAPI } from "@/lib/api";

type Lang = "id" | "en";

type AboutContent = {
  steps?: { title: string; description: string }[];
  features?: string[];
  headline?: string;
  subheadline?: string;
  testimonials?: {
    name?: string;
    role?: string;
    quote?: string;
    content?: string;
    description?: string;
  }[];
  featuresHeadline?: string;
  testimonialsHeadline?: string;
};

type Normalized = {
  headline: string;
  subheadline: string;
  steps: { title: string; description: string }[];
  features: string[];
  testimonialsHeadline: string;
  testimonials: { name: string; role: string; quote: string }[];
  featuresHeadline: string;
};

/* ========= Lang dari cookie (Edge/Node safe) ========= */
async function readLangFromCookies(): Promise<Lang> {
  const maybe = cookies() as any;
  const store = typeof maybe?.then === "function" ? await maybe : maybe;
  const raw =
    store.get("agile.lang")?.value ??
    store.get("agile_lang")?.value ??
    store.get("lang")?.value ??
    "";
  return raw === "id" ? "id" : "en";
}

/* ========= Fallback EN & ID ========= */
const FALLBACK_EN: Required<Normalized> = {
  headline: "All-in-One SaaS Marketplace",
  subheadline:
    "Discover powerful solutions designed to streamline your business operations and boost productivity.",
  steps: [
    {
      title: "Choose your products",
      description: "Browse our collection and find the perfect solution.",
    },
    {
      title: "Select a package",
      description: "Pick the plan that fits your needs and budget.",
    },
    {
      title: "Start using instantly",
      description: "Get access immediately with quick setup.",
    },
  ],
  features: [
    "Easy Setup",
    "Affordable Pricing",
    "Scalable Solutions",
    "24/7 Support",
  ],
  testimonialsHeadline: "Trusted by 100+ businesses and organizations",
  testimonials: [
    {
      name: "Sarah Johnson",
      role: "Business Owner",
      quote: "Agile Store transformed our rental business completely.",
    },
    {
      name: "Ahmad Rahman",
      role: "Community Leader",
      quote: "Perfect solution for managing our activities.",
    },
    {
      name: "Lisa Chen",
      role: "Sales Manager",
      quote: "Our team productivity increased by 60%.",
    },
  ],
  featuresHeadline: "Why Agile Store",
};

const FALLBACK_ID: Required<Normalized> = {
  headline: "Marketplace SaaS All-in-One",
  subheadline:
    "Temukan solusi kuat untuk merampingkan operasional dan meningkatkan produktivitas bisnismu.",
  steps: [
    {
      title: "Pilih produkmu",
      description: "Jelajahi koleksi dan temukan solusi yang tepat.",
    },
    {
      title: "Pilih paket",
      description: "Ambil paket yang sesuai kebutuhan dan anggaran.",
    },
    {
      title: "Langsung pakai",
      description: "Akses instan dengan setup cepat.",
    },
  ],
  features: [
    "Setup Mudah",
    "Harga Terjangkau",
    "Solusi Skalabel",
    "Dukungan 24/7",
  ],
  testimonialsHeadline: "Dipercaya 100+ bisnis dan organisasi",
  testimonials: [
    {
      name: "Sarah Johnson",
      role: "Pemilik Bisnis",
      quote: "Agile Store mengubah total bisnis rental kami.",
    },
    {
      name: "Ahmad Rahman",
      role: "Tokoh Komunitas",
      quote: "Solusi yang pas untuk kelola aktivitas kami.",
    },
    {
      name: "Lisa Chen",
      role: "Manajer Penjualan",
      quote: "Produktivitas tim kami naik 60%.",
    },
  ],
  featuresHeadline: "Mengapa Agile Store",
};

/* ========= Helper normalisasi ========= */
function normalizeTestimonialsFromContent(arr: any[] | undefined | null) {
  if (!Array.isArray(arr)) return null;
  const mapped = arr.map((t) => ({
    name: t?.name ?? t?.person_name ?? t?.title ?? "",
    role: t?.role ?? t?.person_role ?? t?.subtitle ?? "",
    quote: t?.quote ?? t?.content ?? t?.description ?? "",
  }));
  return mapped.filter((x) => x.name || x.quote);
}
function normalizeTestimonialsFromItems(items: any[] | undefined | null) {
  if (!Array.isArray(items)) return null;
  const mapped = items.map((it) => {
    const ex = it?.extras ?? {};
    return {
      name: it?.title ?? ex?.person_name ?? ex?.name ?? it?.name ?? "",
      role: it?.subtitle ?? ex?.person_role ?? ex?.role ?? "",
      quote: ex?.quote ?? it?.description ?? it?.content ?? "",
    };
  });
  return mapped.filter((x) => x.name || x.quote);
}

/* Ambil & rakit konten sesuai bahasa (server) */
async function getAbout(lang: Lang): Promise<Normalized> {
  const [aboutSec, testiSec] = await Promise.all([
    AgileStoreAPI.getSection<any>("about"),
    AgileStoreAPI.getSection<any>("testimonials"),
  ]);

  const pick = (section: any, l: Lang) => {
    if (!section) return { content: {}, items: null as any[] | null };
    if (l === "en") {
      return {
        content:
          section?.content_en ??
          section?.content?.en ??
          section?.content?.["en"] ??
          section?.content ??
          {},
        items: section?.items_en ?? section?.items ?? null,
      };
    }
    return {
      content:
        section?.content ?? section?.content_id ?? section?.content?.id ?? {},
      items: section?.items ?? null,
    };
  };

  const fb = lang === "en" ? FALLBACK_EN : FALLBACK_ID;
  const aboutPick = pick(aboutSec, lang);
  const testiPick = pick(testiSec, lang);
  const c = (aboutPick.content ?? {}) as AboutContent;

  const t1 = normalizeTestimonialsFromContent((c as any).testimonials);
  const t2 = normalizeTestimonialsFromItems(aboutPick.items);
  const t3 = normalizeTestimonialsFromItems(testiPick.items);
  const testimonialsSrc =
    (t1 && t1.length ? t1 : null) ??
    (t2 && t2.length ? t2 : null) ??
    (t3 && t3.length ? t3 : null) ??
    fb.testimonials;

  return {
    headline: (c.headline ?? fb.headline) as string,
    subheadline: (c.subheadline ?? fb.subheadline) as string,
    steps:
      Array.isArray(c.steps) && c.steps.length ? [...c.steps] : [...fb.steps],
    features:
      Array.isArray(c.features) && c.features.length
        ? [...c.features]
        : [...fb.features],
    testimonialsHeadline: (c.testimonialsHeadline ??
      fb.testimonialsHeadline) as string,
    testimonials: testimonialsSrc.map((t: any) => ({
      name: String(t.name ?? ""),
      role: String(t.role ?? ""),
      quote: String(t.quote ?? ""),
    })),
    featuresHeadline: (c.featuresHeadline ?? fb.featuresHeadline) as string,
  };
}

/* ================== PAGE (Server) ================== */
export default async function AboutPage() {
  const lang = await readLangFromCookies();
  const data = await getAbout(lang);

  // Label statis bilingual (server-side)
  const UI = {
    en: {
      aboutLabel: "About Agile Store",
      explore: "Explore Products",
      contact: "Contact Us",
      mission: "Our Mission",
      activeUsers: "Active users",
      uptime: "Uptime across products",
      support: "Priority support",
    },
    id: {
      aboutLabel: "Tentang Agile Store",
      explore: "Jelajahi Produk",
      contact: "Hubungi Kami",
      mission: "Misi Kami",
      activeUsers: "Pengguna aktif",
      uptime: "Uptime lintas produk",
      support: "Dukungan prioritas",
    },
  } as const;
  const t = UI[lang];

  const valuesGrid = (() => {
    const steps = data.steps.slice(0, 4);
    if (steps.length === 4) return steps;
    const extra = data.features.slice(0, 4 - steps.length).map((f) => ({
      title: f,
      description:
        lang === "id"
          ? "Dibangun untuk membantu kamu bergerak lebih cepat dengan jelas dan terdukung."
          : "Built to help you move faster with clarity and support.",
    }));
    return [...steps, ...extra].slice(0, 4);
  })();

  return (
    <main>
      <Header />

      {/* Hero */}
      <section className="bg-muted/30 border-b bg-gradient-to-r from-blue-600 to-violet-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-xs font-medium tracking-widest uppercase text-white">
              {t.aboutLabel}
            </p>
            <h1 className="mt-3 font-serif font-bold text-3xl sm:text-5xl text-balance text-white">
              {data.headline}
            </h1>
            <p className="mt-4 text-lg text-white/90">{data.subheadline}</p>
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/products"
                className="inline-flex items-center rounded-lg px-4 py-2 font-medium text-white bg-gradient-to-r from-indigo-500 to-blue-500 hover:opacity-90"
              >
                {t.explore}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-lg px-4 py-2 font-medium border border-border bg-background/90 hover:bg-muted"
              >
                {t.contact}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission + Values */}
      <section className="py-14 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2">
            {/* Mission */}
            <div className="rounded-xl border bg-background p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-bold text-foreground">
                {t.mission}
              </h2>
              <p className="mt-3 text-muted-foreground">{data.subheadline}</p>

              <ul className="mt-6 grid gap-3">
                {data.features.slice(0, 3).map((feat, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className={[
                        "mt-1 h-2.5 w-2.5 rounded-full",
                        ["bg-indigo-500", "bg-blue-500", "bg-slate-400"][i % 3],
                      ].join(" ")}
                    />
                    <span className="text-foreground">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Values */}
            <div className="rounded-xl border bg-background p-6 sm:p-8">
              <h3 className="font-serif text-2xl font-bold text-foreground">
                {data.featuresHeadline}
              </h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {valuesGrid.map((v, i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <p className="font-medium text-foreground">{v.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {v.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-6 text-center">
              <p className="text-3xl font-bold text-foreground">50k+</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t.activeUsers}
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <p className="text-3xl font-bold text-foreground">99.9%</p>
              <p className="text-sm text-muted-foreground mt-1">{t.uptime}</p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <p className="text-3xl font-bold text-foreground">24/7</p>
              <p className="text-sm text-muted-foreground mt-1">{t.support}</p>
            </div>
          </div>

          {/* Testimonials mini */}
          <div className="mt-12">
            <h4 className="text-center font-serif text-xl font-bold text-foreground">
              {data.testimonialsHeadline}
            </h4>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {data.testimonials.slice(0, 3).map((tst, i) => (
                <div key={i} className="rounded-lg border p-5">
                  <p className="text-sm text-muted-foreground mb-4">
                    “
                    {(tst.quote ?? "").toString().trim().length
                      ? tst.quote
                      : lang === "id"
                      ? "Pengalaman yang menyenangkan memakai Agile Store."
                      : "Great experience using Agile Store."}
                    ”
                  </p>
                  <div>
                    <p className="font-medium text-foreground">
                      {tst.name || "—"}
                    </p>
                    {tst.role ? (
                      <p className="text-xs text-muted-foreground">
                        {tst.role}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
