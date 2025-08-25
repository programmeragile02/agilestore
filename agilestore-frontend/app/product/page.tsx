import { Header } from "@/components/header"
import { ProductHero } from "@/components/product-hero"
import { FeatureHighlights } from "@/components/feature-highlights"
import { ProductGallery } from "@/components/product-gallery"
import { ProductPricing } from "@/components/product-pricing"
import { CTABanner } from "@/components/cta-banner"
import { ProductFAQ } from "@/components/product-faq"
import { Footer } from "@/components/footer"

export default function ProductPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <ProductHero />
        <FeatureHighlights />
        <ProductGallery />
        <ProductPricing />
        <CTABanner />
        <ProductFAQ />
      </main>
      <Footer />
    </div>
  )
}
