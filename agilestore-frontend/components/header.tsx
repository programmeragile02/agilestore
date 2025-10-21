"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, ShoppingCart } from "lucide-react";
import AuthButtons from "./AuthButtons";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LanguageToggle from "@/components/LanguageToogle";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-900 hover:text-indigo-600 transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              href="/products"
              className="text-gray-900 hover:text-indigo-600 transition-colors font-medium"
            >
              Products
            </Link>
            <Link
              href="/pricing"
              className="text-gray-900 hover:text-indigo-600 transition-colors font-medium"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              className="text-gray-900 hover:text-indigo-600 transition-colors font-medium"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-900 hover:text-indigo-600 transition-colors font-medium"
            >
              Contact
            </Link>
            {/* <LanguageSwitcher /> */}
            <LanguageToggle className="ml-2" />
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <ShoppingCart className="h-4 w-4" />
            </Button> */}
            <AuthButtons />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
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
                Home
              </Link>
              <Link
                href="/products"
                className="block px-3 py-2 text-gray-900 hover:text-indigo-600 transition-colors"
              >
                Products
              </Link>
              <Link
                href="/pricing"
                className="block px-3 py-2 text-gray-900 hover:text-indigo-600 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-gray-900 hover:text-indigo-600 transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 text-gray-900 hover:text-indigo-600 transition-colors"
              >
                Contact
              </Link>
              <div className="flex items-center space-x-2 px-3 py-2">
                <AuthButtons />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
