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
import { AgileStoreAPI } from "@/lib/api";

// Fallback jika content belum diisi
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

type FooterContent = typeof FALLBACK;

// mapping label → href yang aman
function linkHref(label: string) {
  const key = label.trim().toLowerCase();
  if (key.includes("product")) return "/products";
  if (key.includes("pricing")) return "/pricing";
  if (key.includes("about")) return "/about";
  if (key.includes("contact")) return "/contact";
  if (key.includes("support") || key.includes("help")) return "/support";
  return `/${key.replace(/\s+/g, "-")}`;
}

async function getFooterContent(): Promise<FooterContent> {
  const sec = await AgileStoreAPI.getSection<FooterContent>("footer");
  const c = (sec?.content as FooterContent) ?? FALLBACK;

  return {
    brand: c.brand ?? FALLBACK.brand,
    contact: {
      email: c.contact?.email ?? FALLBACK.contact.email,
      phone: c.contact?.phone ?? FALLBACK.contact.phone,
      address: c.contact?.address ?? FALLBACK.contact.address,
    },
    quickLinks:
      Array.isArray(c.quickLinks) && c.quickLinks.length
        ? c.quickLinks
        : FALLBACK.quickLinks,
    description: c.description ?? FALLBACK.description,
    newsletterLabel: c.newsletterLabel ?? FALLBACK.newsletterLabel,
  };
}

async function Footer() {
  const data = await getFooterContent();
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
                    .map((s) => s[0])
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
              >
                <Facebook className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-background/80 hover:text-background hover:bg-background/10"
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-background/80 hover:text-background hover:bg-background/10"
              >
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-background/80 hover:text-background hover:bg-background/10"
              >
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-serif font-semibold text-lg">Quick Links</h3>
            <ul className="space-y-2">
              {data.quickLinks.map((label, i) => (
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
            <h3 className="font-serif font-semibold text-lg">Contact Info</h3>
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
            <h3 className="font-serif font-semibold text-lg">Stay Updated</h3>
            <p className="text-background/80 text-sm">
              Subscribe to our newsletter for the latest updates and exclusive
              offers.
            </p>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder={data.newsletterLabel || "Enter your email"}
                className="bg-background/10 border-background/20 text-background placeholder:text-background/60"
              />
              <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-background/80 text-sm">
              © {year} {data.brand}. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link
                href="/privacy"
                className="text-background/80 hover:text-background transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-background/80 hover:text-background transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/cookies"
                className="text-background/80 hover:text-background transition-colors"
              >
                Cookie Policy
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
