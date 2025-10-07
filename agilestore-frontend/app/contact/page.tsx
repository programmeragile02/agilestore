// // app/contact/page.tsx
// import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
// import Header from "@/components/header";
// import { Footer } from "@/components/footer";
// import Link from "next/link";
// import { AgileStoreAPI } from "@/lib/api";
// import { Button } from "@/components/ui/button";

// type ContactContent = {
//   email?: string;
//   phone?: string;
//   address?: string;
//   ctaLabel?: string;
//   headline?: string;
//   subheadline?: string;
// };

// const FALLBACK: Required<ContactContent> = {
//   email: "admin@agilestore.com",
//   phone: "085702212770",
//   address: "Boyolali, Jawa Tengah",
//   ctaLabel: "Send Message",
//   headline: "Get in touch",
//   subheadline: "We’d love to hear from you. Reach out to our team anytime.",
// };

// async function getContact(): Promise<Required<ContactContent>> {
//   const sec = await AgileStoreAPI.getSection<ContactContent>("contact");
//   const c = sec?.content ?? {};
//   return {
//     email: c.email ?? FALLBACK.email,
//     phone: c.phone ?? FALLBACK.phone,
//     address: c.address ?? FALLBACK.address,
//     ctaLabel: c.ctaLabel ?? FALLBACK.ctaLabel,
//     headline: c.headline ?? FALLBACK.headline,
//     subheadline: c.subheadline ?? FALLBACK.subheadline,
//   };
// }

// export default async function ContactPage() {
//   const data = await getContact();
//   const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
//     data.address
//   )}&output=embed`;

//   return (
//     <main>
//       <Header />

//       {/* Hero */}
//       <section className="relative overflow-hidden border-b bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50">
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
//           <div className="relative z-10 text-center max-w-2xl mx-auto">
//             <h1 className="font-serif font-bold text-3xl sm:text-5xl text-foreground">
//               {data.headline}
//             </h1>
//             <p className="mt-4 text-lg text-muted-foreground">
//               {data.subheadline}
//             </p>
//             <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
//               <Link href={`mailto:${data.email}`}>
//                 <Button
//                   size="lg"
//                   className="bg-blue-600 hover:bg-blue-700 text-white"
//                 >
//                   Email Us
//                   <ArrowRight className="ml-2 h-4 w-4" />
//                 </Button>
//               </Link>
//               <Link href={`tel:${data.phone.replace(/\s+/g, "")}`}>
//                 <Button
//                   size="lg"
//                   variant="outline"
//                   className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
//                 >
//                   Call Now
//                 </Button>
//               </Link>
//             </div>
//           </div>

//           {/* soft blobs */}
//           <div className="pointer-events-none absolute inset-0">
//             <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-blue-200/30 blur-3xl" />
//             <div className="absolute -bottom-10 -right-10 w-72 h-72 rounded-full bg-indigo-200/30 blur-3xl" />
//           </div>
//         </div>
//       </section>

//       {/* Content */}
//       <section className="py-16 sm:py-24">
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid gap-8 lg:grid-cols-3">
//             {/* Contact cards */}
//             <div className="space-y-4">
//               <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition">
//                 <div className="flex items-start gap-4">
//                   <div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
//                     <Mail className="h-5 w-5" />
//                   </div>
//                   <div>
//                     <p className="font-medium text-foreground">Email</p>
//                     <p className="text-sm text-muted-foreground mt-1 break-all">
//                       {data.email}
//                     </p>
//                     <Link
//                       href={`mailto:${data.email}`}
//                       className="inline-flex items-center text-sm mt-2 text-blue-600 hover:underline"
//                     >
//                       Send an email <ArrowRight className="ml-1 h-3.5 w-3.5" />
//                     </Link>
//                   </div>
//                 </div>
//               </div>

//               <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition">
//                 <div className="flex items-start gap-4">
//                   <div className="h-10 w-10 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
//                     <Phone className="h-5 w-5" />
//                   </div>
//                   <div>
//                     <p className="font-medium text-foreground">Phone</p>
//                     <p className="text-sm text-muted-foreground mt-1">
//                       {data.phone}
//                     </p>
//                     <Link
//                       href={`tel:${data.phone.replace(/\s+/g, "")}`}
//                       className="inline-flex items-center text-sm mt-2 text-emerald-600 hover:underline"
//                     >
//                       Call now <ArrowRight className="ml-1 h-3.5 w-3.5" />
//                     </Link>
//                   </div>
//                 </div>
//               </div>

//               <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition">
//                 <div className="flex items-start gap-4">
//                   <div className="h-10 w-10 rounded-xl bg-violet-600/10 text-violet-600 flex items-center justify-center">
//                     <MapPin className="h-5 w-5" />
//                   </div>
//                   <div>
//                     <p className="font-medium text-foreground">Address</p>
//                     <p className="text-sm text-muted-foreground mt-1">
//                       {data.address}
//                     </p>
//                     <Link
//                       href={`https://maps.google.com/?q=${encodeURIComponent(
//                         data.address
//                       )}`}
//                       target="_blank"
//                       className="inline-flex items-center text-sm mt-2 text-violet-600 hover:underline"
//                     >
//                       Open in Maps <ArrowRight className="ml-1 h-3.5 w-3.5" />
//                     </Link>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Map */}
//             <div className="lg:col-span-2">
//               <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
//                 <div className="aspect-[16/10] w-full">
//                   <iframe
//                     src={mapSrc}
//                     className="h-full w-full"
//                     loading="lazy"
//                     referrerPolicy="no-referrer-when-downgrade"
//                     allowFullScreen
//                   />
//                 </div>
//                 <div className="p-4 flex items-center justify-between">
//                   <div className="text-sm text-muted-foreground truncate">
//                     Showing map for:{" "}
//                     <span className="text-foreground">{data.address}</span>
//                   </div>
//                   {/* <Link href={`mailto:${data.email}`}>
//                     <Button className="bg-blue-600 hover:bg-blue-700 text-white">
//                       {data.ctaLabel}
//                     </Button>
//                   </Link> */}
//                 </div>
//               </div>
//               <p className="text-xs text-muted-foreground mt-3">
//                 Tip: Drag the map or zoom in/out to explore the surrounding
//                 area.
//               </p>
//             </div>
//           </div>
//         </div>
//       </section>
//       <Footer />
//     </main>
//   );
// }

// app/contact/page.tsx
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import Header from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { AgileStoreAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";

/** ==== Inline brand icons (no lucide, no deprecation) ==== */
function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5zM18 6.25a1.25 1.25 0 1 1-1.25 1.25A1.25 1.25 0 0 1 18 6.25z" />
    </svg>
  );
}
function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M14 3h2a5.7 5.7 0 0 0 5 5v2a7.7 7.7 0 0 1-5-1.6V14a6 6 0 1 1-6-6h1.5v2H10a4 4 0 1 0 4 4V3z" />
    </svg>
  );
}
function YouTubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...props}>
      <path d="M23 12c0-2.2-.2-3.7-.4-4.6-.3-1.2-1.2-2.1-2.4-2.4C18.3 4.7 12 4.7 12 4.7s-6.3 0-8.2.3C2.6 5.3 1.7 6.2 1.4 7.4 1.2 8.3 1 9.8 1 12s.2 3.7.4 4.6c.3 1.2 1.2 2.1 2.4 2.4 1.9.3 8.2.3 8.2.3s6.3 0 8.2-.3c1.2-.3 2.1-1.2 2.4-2.4.2-.9.4-2.4.4-4.6zM10 15.5v-7l6 3.5-6 3.5z" />
    </svg>
  );
}

/** ==== Types & fallback ==== */
type ContactContent = {
  email?: string;
  phone?: string;
  address?: string;
  ctaLabel?: string;
  headline?: string;
  subheadline?: string;
  socials?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
};

const FALLBACK: Required<Omit<ContactContent, "socials">> & {
  socials: Required<NonNullable<ContactContent["socials"]>>;
} = {
  email: "admin@agilestore.com",
  phone: "085702212770",
  address: "Boyolali, Jawa Tengah",
  ctaLabel: "Send Message",
  headline: "Get in touch",
  subheadline: "We’d love to hear from you. Reach out to our team anytime.",
  socials: {
    instagram: "https://instagram.com/agilestore",
    tiktok: "https://www.tiktok.com/@agilestore",
    youtube: "https://www.youtube.com/@agilestore",
  },
};

async function getContact() {
  const sec = await AgileStoreAPI.getSection<ContactContent>("contact");
  const c = sec?.content ?? {};
  const socials = (c as any).socials ?? {};
  return {
    email: c.email ?? FALLBACK.email,
    phone: c.phone ?? FALLBACK.phone,
    address: c.address ?? FALLBACK.address,
    ctaLabel: c.ctaLabel ?? FALLBACK.ctaLabel,
    headline: c.headline ?? FALLBACK.headline,
    subheadline: c.subheadline ?? FALLBACK.subheadline,
    socials: {
      instagram: socials.instagram ?? FALLBACK.socials.instagram,
      tiktok: socials.tiktok ?? FALLBACK.socials.tiktok,
      youtube: socials.youtube ?? FALLBACK.socials.youtube,
    },
  };
}

export default async function ContactPage() {
  const data = await getContact();
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    data.address
  )}&output=embed`;

  return (
    <main>
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h1 className="font-serif font-bold text-3xl sm:text-5xl text-foreground">
              {data.headline}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {data.subheadline}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`mailto:${data.email}`}>
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Email Us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={`tel:${data.phone.replace(/\s+/g, "")}`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
                >
                  Call Now
                </Button>
              </Link>
            </div>
          </div>

          {/* soft blobs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-10 -left-10 w-64 h-64 rounded-full bg-blue-200/30 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 w-72 h-72 rounded-full bg-indigo-200/30 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Contact cards */}
            <div className="space-y-4">
              <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground mt-1 break-all">
                      {data.email}
                    </p>
                    <Link
                      href={`mailto:${data.email}`}
                      className="inline-flex items-center text-sm mt-2 text-blue-600 hover:underline"
                    >
                      {/* Send an email <ArrowRight className="ml-1 h-3.5 w-3.5" /> */}
                    </Link>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Phone</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {data.phone}
                    </p>
                    <Link
                      href={`tel:${data.phone.replace(/\s+/g, "")}`}
                      className="inline-flex items-center text-sm mt-2 text-emerald-600 hover:underline"
                    >
                      Call now <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-violet-600/10 text-violet-600 flex items-center justify-center">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Address</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {data.address}
                    </p>
                    <Link
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        data.address
                      )}`}
                      target="_blank"
                      className="inline-flex items-center text-sm mt-2 text-violet-600 hover:underline"
                    >
                      Open in Maps <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Socials */}
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <p className="font-medium text-foreground mb-3">Follow us</p>
                <div className="flex items-center gap-3">
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="hover:bg-slate-100"
                    aria-label="Instagram"
                  >
                    <a
                      href={data.socials.instagram}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <InstagramIcon className="h-5 w-5" />
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="hover:bg-slate-100"
                    aria-label="TikTok"
                  >
                    <a
                      href={data.socials.tiktok}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <TikTokIcon className="h-5 w-5" />
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="hover:bg-slate-100"
                    aria-label="YouTube"
                  >
                    <a
                      href={data.socials.youtube}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <YouTubeIcon className="h-5 w-5" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                <div className="aspect-[16/10] w-full">
                  <iframe
                    src={mapSrc}
                    className="h-full w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground truncate">
                    Showing map for:{" "}
                    <span className="text-foreground">{data.address}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Tip: Drag the map or zoom in/out to explore the surrounding
                area.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
