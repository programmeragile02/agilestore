import { Button } from "@/components/ui/button"
import { ArrowRight, Search } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50 py-16 sm:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="font-sans font-bold text-4xl sm:text-5xl lg:text-6xl text-slate-900 mb-6 leading-tight">
              Digital Products to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Grow Your Business
              </span>
              , Faster.
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Agile Store provides powerful and affordable digital apps for your business and community. Scale faster
              with our proven solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3 shadow-lg">
                Explore Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-3 border-blue-600 text-blue-600 hover:bg-blue-50 bg-transparent"
              >
                Start Free
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
              <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-white mb-2">
                  <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                  <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                  <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                </div>
                <h3 className="text-white font-semibold text-lg">Agile Store Dashboard</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Search className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 h-3 bg-slate-200 rounded"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 bg-gradient-to-br from-blue-50 to-violet-50 rounded-lg border border-blue-100"></div>
                  <div className="h-16 bg-gradient-to-br from-violet-50 to-blue-50 rounded-lg border border-violet-100"></div>
                </div>
                <div className="h-8 bg-slate-100 rounded"></div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full opacity-20 blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-r from-violet-500 to-blue-500 rounded-full opacity-20 blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
