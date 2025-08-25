import { Star } from "lucide-react"

export function TrustedBySection() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Business Owner",
      content: "Agile Store transformed our rental business completely.",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      name: "Ahmad Rahman",
      role: "Community Leader",
      content: "Perfect solution for managing our mosque activities.",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      name: "Lisa Chen",
      role: "Sales Manager",
      content: "Our team productivity increased by 60% using these apps.",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  return (
    <section className="py-12 bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-slate-600 font-medium">Trusted by 100+ businesses and organizations</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 mb-4 text-sm leading-relaxed">"{testimonial.content}"</p>
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar || "/placeholder.svg"}
                  alt={testimonial.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{testimonial.name}</p>
                  <p className="text-slate-600 text-xs">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
