import { Shield, DollarSign, Zap, Headphones } from "lucide-react"

export function BenefitsSection() {
  const benefits = [
    {
      icon: Zap,
      title: "Easy Setup",
      description: "Get started in minutes with our intuitive setup process and guided onboarding.",
    },
    {
      icon: DollarSign,
      title: "Affordable Pricing",
      description: "Transparent pricing with no hidden fees. Pay only for what you need.",
    },
    {
      icon: Shield,
      title: "Scalable Solutions",
      description: "Grow your business with solutions that scale from startup to enterprise.",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Get help when you need it with our dedicated customer support team.",
    },
  ]

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-sans font-bold text-3xl sm:text-4xl text-slate-900 mb-4">Why Agile Store</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to succeed, backed by the features that matter most.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <benefit.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-xl text-slate-900 mb-3">{benefit.title}</h3>
              <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
