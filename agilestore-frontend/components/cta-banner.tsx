import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface CTABannerProps {
  productSlug: string
}

export function CTABanner({ productSlug }: CTABannerProps) {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-r from-indigo-500 to-blue-500">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-serif font-bold text-3xl sm:text-4xl text-white mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-white/90 mb-8 leading-relaxed">
            Join thousands of businesses already transforming their operations. Start your journey today with our
            powerful solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-indigo-600 hover:bg-gray-50 text-lg px-8 py-3 font-medium"
            >
              <Link href={`/checkout?product=${productSlug}`}>
                Subscribe Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-3 border-white text-white hover:bg-white/10 bg-transparent"
            >
              Contact Sales
            </Button>
          </div>
          <p className="text-sm text-white/80 mt-4">No credit card required • 14-day free trial • Cancel anytime</p>
        </div>
      </div>
    </section>
  )
}
