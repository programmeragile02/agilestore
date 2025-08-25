import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Building2, Users, Calendar, TrendingUp } from "lucide-react"
import Link from "next/link"

export function FeaturedProductsSection() {
  const products = [
    {
      name: "Rent Vix Pro",
      tagline: "Complete rental management solution for your business",
      description:
        "Streamline your rental operations with inventory tracking, booking management, and automated billing.",
      icon: Building2,
      slug: "rent-vix-pro",
    },
    {
      name: "Absen Fast",
      tagline: "Smart attendance system for modern workplaces",
      description: "Track employee attendance with facial recognition, real-time reporting, and mobile integration.",
      icon: Users,
      slug: "absen-fast",
    },
    {
      name: "Ayo Hidupkan Rumah Ibadah",
      tagline: "Donation and activity management for places of worship",
      description: "Manage donations, events, and community activities with transparency and ease.",
      icon: Calendar,
      slug: "ayo-hidupkan-rumah-ibadah",
    },
    {
      name: "Salesman Apps",
      tagline: "Boost your sales team performance",
      description: "CRM, lead tracking, and sales analytics to maximize your team's potential.",
      icon: TrendingUp,
      slug: "salesman-apps",
    },
  ]

  return (
    <section className="py-16 sm:py-24 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-sans font-bold text-3xl sm:text-4xl text-slate-900 mb-4">Our Products</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Powerful digital solutions designed to grow your business and streamline your operations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {products.map((product, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-slate-200 bg-white">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
                    <product.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </CardTitle>
                  </div>
                </div>
                <CardDescription className="text-slate-600 font-medium">{product.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-slate-600 mb-6 leading-relaxed">{product.description}</p>
                <Link href={`/product/${product.slug}`}>
                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300 bg-transparent"
                  >
                    View Product
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
