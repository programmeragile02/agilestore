"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import AuthButtons from "./AuthButtons";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/components/LanguageProvider";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { lang } = useLanguage();

  const T = useMemo(
    () =>
      ({
        en: {
          home: "Home",
          products: "Products",
          pricing: "Pricing",
          about: "About",
          contact: "Contact",
        },
        id: {
          home: "Beranda",
          products: "Produk",
          pricing: "Harga",
          about: "Tentang",
          contact: "Kontak",
        },
      } as const),
    [lang]
  );

  const L = T[lang];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AS</span>
              </div>
              <span className="font-serif font-bold text-xl text-gray-900">
                Agile Store
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-900 hover:text-indigo-600 transition-colors font-medium"
            >
              {L.home}
            </Link>
            <Link
              href="/products"
              className="text-gray-900 hover:text-indigo-600 transition-colors font-medium"
            >
              {L.products}
            </Link>
            <Link
              href="/pricing"
              className="text-gray-900 hover:text-indigo-600 transition-colors font-medium"
            >
              {L.pricing}
            </Link>
            <Link
              href="/about"
              className="text-gray-900 hover:text-indigo-600 transition-colors font-medium"
            >
              {L.about}
            </Link>
            <Link
              href="/contact"
              className="text-gray-900 hover:text-indigo-600 transition-colors font-medium"
            >
              {L.contact}
            </Link>

            {/* Language switcher (desktop) */}
            {/* <LanguageSwitcher /> */}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <AuthButtons />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              <Link
                href="/"
                className="block px-3 py-2 text-gray-900 hover:text-indigo-600 transition-colors"
              >
                {L.home}
              </Link>
              <Link
                href="/products"
                className="block px-3 py-2 text-gray-900 hover:text-indigo-600 transition-colors"
              >
                {L.products}
              </Link>
              <Link
                href="/pricing"
                className="block px-3 py-2 text-gray-900 hover:text-indigo-600 transition-colors"
              >
                {L.pricing}
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-gray-900 hover:text-indigo-600 transition-colors"
              >
                {L.about}
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 text-gray-900 hover:text-indigo-600 transition-colors"
              >
                {L.contact}
              </Link>

              <div className="flex items-center justify-between px-3 py-2">
                <AuthButtons />
                {/* Language switcher (mobile) */}
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
