import Link from "next/link"
import { ArrowRight, Shield, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProductFinalCTAProps {
  productSlug: string
}

function ProductFinalCTA({ productSlug }: ProductFinalCTAProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=400')] opacity-10"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Main Headline */}
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Ready to Transform Your
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Property Management?
            </span>
          </h2>

          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Join thousands of property managers who've streamlined their operations with Rent Vix Pro
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 mb-10 text-blue-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">10,000+ Users</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">30-Day Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Setup in 5 Minutes</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              asChild
              size="lg"
              className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <Link href={`/checkout?product=${productSlug}&package=professional&duration=yearly`}>
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-indigo-600 font-semibold px-8 py-4 text-lg transition-all duration-300 bg-transparent"
            >
              <Link href={`/checkout?product=${productSlug}&package=starter&duration=monthly`}>View Pricing</Link>
            </Button>
          </div>

          {/* Risk-Free Message */}
          <p className="text-blue-200 text-sm">
            No credit card required • Cancel anytime • 30-day money-back guarantee
          </p>
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">99.9%</div>
            <div className="text-blue-200 text-sm">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">24/7</div>
            <div className="text-blue-200 text-sm">Support</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">50+</div>
            <div className="text-blue-200 text-sm">Integrations</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">4.9★</div>
            <div className="text-blue-200 text-sm">User Rating</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProductFinalCTA
export { ProductFinalCTA }
