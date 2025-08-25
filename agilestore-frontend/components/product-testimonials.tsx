import { Star, Quote } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Testimonial {
  id: number
  name: string
  role: string
  company: string
  avatar: string
  rating: number
  content: string
  featured?: boolean
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Property Manager",
    company: "Urban Properties",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    content:
      "Rent Vix Pro has completely transformed how we manage our rental properties. The automated rent collection and maintenance tracking features have saved us countless hours every month.",
    featured: true,
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Real Estate Investor",
    company: "Chen Holdings",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    content:
      "The financial reporting features are incredible. I can see exactly how each property is performing and make data-driven decisions about my portfolio.",
  },
  {
    id: 3,
    name: "Lisa Rodriguez",
    role: "Landlord",
    company: "Independent",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    content:
      "My tenants love the tenant portal. They can pay rent online, submit maintenance requests, and communicate with me easily. It's made everything so much smoother.",
  },
  {
    id: 4,
    name: "David Thompson",
    role: "Property Owner",
    company: "Thompson Rentals",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    content:
      "The maintenance tracking system is a game-changer. I can schedule repairs, track costs, and ensure everything is documented properly.",
  },
  {
    id: 5,
    name: "Amanda Foster",
    role: "Portfolio Manager",
    company: "Foster Real Estate",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    content:
      "Managing 50+ properties used to be overwhelming. Now with Rent Vix Pro, I have everything organized and automated. Best investment I've made for my business.",
  },
  {
    id: 6,
    name: "Robert Kim",
    role: "Real Estate Agent",
    company: "Kim Realty Group",
    avatar: "/placeholder.svg?height=40&width=40",
    rating: 5,
    content:
      "I recommend Rent Vix Pro to all my clients who are getting into rental properties. The learning curve is minimal and the results are immediate.",
  },
]

export { ProductTestimonials }
export default function ProductTestimonials({ testimonials: propTestimonials }: { testimonials?: any[] }) {
  // Use prop testimonials if provided, otherwise use default data
  const testimonialData = propTestimonials && propTestimonials.length > 0 ? propTestimonials : testimonials

  const featuredTestimonial = testimonialData.find((t: any) => t.featured)
  const regularTestimonials = testimonialData.filter((t: any) => !t.featured)

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
    ))
  }

  const getInitials = (name: string | undefined) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Trusted by Property Managers Worldwide</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of property managers who have transformed their business with Rent Vix Pro
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">10,000+</div>
              <div className="text-sm text-gray-600">Properties Managed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">98%</div>
              <div className="text-sm text-gray-600">Customer Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">4.9/5</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>

        {/* Featured Testimonial */}
        {featuredTestimonial && (
          <Card className="mb-12 border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <Quote className="w-8 h-8 text-indigo-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                    "{featuredTestimonial.content || "Great product!"}"
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage
                          src={featuredTestimonial.avatar || "/placeholder.svg"}
                          alt={featuredTestimonial.name || "User"}
                        />
                        <AvatarFallback>{getInitials(featuredTestimonial.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-900">{featuredTestimonial.name || "Anonymous"}</div>
                        <div className="text-sm text-gray-600">
                          {featuredTestimonial.role || "User"} at {featuredTestimonial.company || "Company"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">{renderStars(featuredTestimonial.rating || 5)}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Regular Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularTestimonials.map((testimonial) => (
            <Card key={testimonial.id} className="h-full hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center gap-1 mb-4">{renderStars(testimonial.rating || 5)}</div>
                <p className="text-gray-700 mb-6 flex-1 leading-relaxed">"{testimonial.content || "Great product!"}"</p>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name || "User"} />
                    <AvatarFallback>{getInitials(testimonial.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{testimonial.name || "Anonymous"}</div>
                    <div className="text-xs text-gray-600">
                      {testimonial.role || "User"}
                      {testimonial.company && testimonial.company !== "Independent" && ` at ${testimonial.company}`}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 mb-4">Trusted by leading property management companies</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-lg font-semibold text-gray-400">PropertyPro</div>
            <div className="text-lg font-semibold text-gray-400">RentMaster</div>
            <div className="text-lg font-semibold text-gray-400">Urban Holdings</div>
            <div className="text-lg font-semibold text-gray-400">Elite Properties</div>
            <div className="text-lg font-semibold text-gray-400">Premier Rentals</div>
          </div>
        </div>
      </div>
    </section>
  )
}
