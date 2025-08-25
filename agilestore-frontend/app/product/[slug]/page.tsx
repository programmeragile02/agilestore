import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductTopBar } from "@/components/product-top-bar"
import { ProductHeroStandalone } from "@/components/product-hero-standalone"
import { ProductValueProps } from "@/components/product-value-props"
import { ProductFeatureGrid } from "@/components/product-feature-grid"
import { ProductDemoGallery } from "@/components/product-demo-gallery"
import { ProductPricingStandalone } from "@/components/product-pricing-standalone"
import { ProductTestimonials } from "@/components/product-testimonials"
import { ProductFAQStandalone } from "@/components/product-faq-standalone"
import { ProductFinalCTA } from "@/components/product-final-cta"
import { ProductFooter } from "@/components/product-footer"
import { ProductMobileCTA } from "@/components/product-mobile-cta"

const products = [
  {
    id: 1,
    name: "Rent Vix Pro",
    shortDescription: "Smart rental management system with GPS, CCTV, and fuel monitoring.",
    heroImage: "/placeholder.svg?height=600&width=800",
    slug: "rent-vix-pro",
    tagline: "Smart rental management with GPS, CCTV & finance",
    primaryBenefit: "Complete rental fleet management solution",
    features: [
      {
        icon: "MapPin",
        title: "GPS Tracking",
        description: "Real-time vehicle location monitoring with geofencing alerts",
      },
      {
        icon: "Camera",
        title: "CCTV Integration",
        description: "Security camera system with live streaming and recording",
      },
      { icon: "Fuel", title: "Fuel Monitoring", description: "Track fuel consumption, costs, and detect anomalies" },
      {
        icon: "Calendar",
        title: "Booking System",
        description: "Advanced reservation management with automated scheduling",
      },
      {
        icon: "CreditCard",
        title: "Payment Processing",
        description: "Integrated billing and payment collection system",
      },
      {
        icon: "BarChart",
        title: "Analytics Dashboard",
        description: "Comprehensive reporting and business intelligence",
      },
    ],
    valueProps: [
      { icon: "Zap", title: "Faster Setup", description: "Get started in minutes, not hours" },
      { icon: "Target", title: "Accurate Reporting", description: "Real-time data you can trust" },
      { icon: "Users", title: "Scales with Your Team", description: "From 1 to 1000+ vehicles" },
      { icon: "Heart", title: "Friendly Support", description: "24/7 customer success team" },
    ],
    pricing: {
      starter: { "1": 149000, "6": 799000, "12": 1499000 },
      pro: { "1": 249000, "6": 1299000, "12": 2399000 },
      ultimate: { "1": 399000, "6": 2199000, "12": 3999000 },
    },
    testimonials: [
      {
        quote: "Rent Vix Pro transformed our rental business. We reduced theft by 80% and increased efficiency by 60%.",
        author: "Ahmad Santoso",
        role: "Fleet Manager, Jakarta Rentals",
        avatar: "/placeholder.svg?height=60&width=60",
      },
      {
        quote: "The GPS tracking and fuel monitoring features alone saved us millions in operational costs.",
        author: "Sari Dewi",
        role: "Operations Director, Bali Transport",
        avatar: "/placeholder.svg?height=60&width=60",
      },
    ],
  },
  {
    id: 2,
    name: "Ayo Hidupkan Rumah Ibadah",
    shortDescription: "Donation and activity management app for places of worship.",
    heroImage: "/placeholder.svg?height=600&width=800",
    slug: "ayo-hidupkan-rumah-ibadah",
    tagline: "Empowering places of worship through digital transformation",
    features: [
      { icon: "Heart", title: "Donation Management", description: "Secure online donation processing" },
      { icon: "Calendar", title: "Event Planning", description: "Organize religious activities and events" },
      { icon: "Users", title: "Community Building", description: "Connect congregation members" },
      { icon: "BarChart", title: "Financial Reports", description: "Transparent financial tracking" },
    ],
    valueProps: [],
    pricing: {},
    testimonials: [],
  },
  {
    id: 3,
    name: "Absen Fast",
    shortDescription: "Fast and reliable employee attendance system with face recognition.",
    heroImage: "/placeholder.svg?height=600&width=800",
    slug: "absen-fast",
    tagline: "Next-generation attendance tracking with AI",
    features: [
      { icon: "Scan", title: "Face Recognition", description: "AI-powered facial recognition technology" },
      { icon: "Clock", title: "Real-time Tracking", description: "Instant attendance recording" },
      { icon: "Shield", title: "Anti-fraud", description: "Prevent buddy punching and fraud" },
      { icon: "Analytics", title: "Smart Reports", description: "Comprehensive attendance analytics" },
    ],
    valueProps: [],
    pricing: {},
    testimonials: [],
  },
  {
    id: 4,
    name: "Salesman Apps",
    shortDescription: "Mobile CRM for sales teams to manage leads, visits, and orders.",
    heroImage: "/placeholder.svg?height=600&width=800",
    slug: "salesman-apps",
    tagline: "Supercharge your sales team with mobile CRM",
    features: [
      { icon: "Users", title: "Lead Management", description: "Track and nurture potential customers" },
      { icon: "MapPin", title: "Visit Tracking", description: "GPS-enabled visit logging" },
      { icon: "ShoppingCart", title: "Order Processing", description: "Mobile order management system" },
      { icon: "TrendingUp", title: "Sales Analytics", description: "Performance tracking and insights" },
    ],
    valueProps: [],
    pricing: {},
    testimonials: [],
  },
]

interface ProductPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = products.find((p) => p.slug === params.slug)

  if (!product) {
    return {
      title: "Product Not Found - Agile Store",
      description: "The requested product could not be found.",
    }
  }

  return {
    title: `${product.name} - Agile Store`,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} - Agile Store`,
      description: product.shortDescription,
      images: [product.heroImage],
    },
  }
}

export async function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }))
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = products.find((p) => p.slug === params.slug)

  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      <ProductTopBar />

      <main>
        <ProductHeroStandalone product={product} />

        <ProductValueProps valueProps={product.valueProps} />

        <ProductFeatureGrid features={product.features} />

        <ProductDemoGallery productName={product.name} />

        <ProductPricingStandalone product={product} />

        <ProductTestimonials testimonials={product.testimonials} />

        <ProductFAQStandalone />

        <ProductFinalCTA productSlug={product.slug} />
      </main>

      <ProductFooter productName={product.name} />

      <ProductMobileCTA productSlug={product.slug} />
    </div>
  )
}
