import { Search, Package, Rocket } from "lucide-react"

export function HowItWorksSection() {
  const steps = [
    {
      icon: Search,
      title: "Choose your product",
      description: "Browse our collection of digital products and find the perfect solution for your business needs.",
      step: "01",
    },
    {
      icon: Package,
      title: "Select a package",
      description: "Pick the plan that fits your requirements and budget. Upgrade or downgrade anytime.",
      step: "02",
    },
    {
      icon: Rocket,
      title: "Start using instantly",
      description: "Get immediate access to your product with quick setup and comprehensive onboarding support.",
      step: "03",
    },
  ]

  return (
    <section className="py-16 sm:py-24 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-sans font-bold text-3xl sm:text-4xl text-slate-900 mb-4">How It Works</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Get started with Agile Store in three simple steps and transform your business today.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center group">
              <div className="relative">
                <div className="w-20 h-20 bg-white border-4 border-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{step.step}</span>
                </div>
              </div>

              <h3 className="font-semibold text-xl text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-600 leading-relaxed">{step.description}</p>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-violet-200 transform -translate-x-1/2 z-0"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
