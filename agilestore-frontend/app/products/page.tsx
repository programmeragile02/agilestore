import type { Metadata } from "next"
import Header from "@/components/header"
import Footer from "@/components/footer"
import ProductGrid from "@/components/product-grid"
import ProductsHero from "@/components/products-hero"

export const metadata: Metadata = {
  title: "Products - Agile Store",
  description: "Discover our comprehensive suite of SaaS solutions designed to transform your business workflow.",
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <ProductsHero />
        <ProductGrid />
      </main>
      <Footer />
    </div>
  )
}
