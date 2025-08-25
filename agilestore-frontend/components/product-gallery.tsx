import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

const screenshots = [
  {
    title: "Dashboard Overview",
    description: "Get a bird's eye view of all your projects and team performance",
    image: "/placeholder.svg?height=400&width=600",
    badge: "Main Dashboard",
  },
  {
    title: "Management Interface",
    description: "Intuitive interface designed for efficient workflow management",
    image: "/placeholder.svg?height=400&width=600",
    badge: "Core Features",
  },
  {
    title: "Analytics & Reports",
    description: "Comprehensive insights and reporting for data-driven decisions",
    image: "/placeholder.svg?height=400&width=600",
    badge: "Analytics",
  },
]

interface ProductGalleryProps {
  productName: string
}

export function ProductGallery({ productName }: ProductGalleryProps) {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif font-bold text-3xl sm:text-4xl text-gray-900 mb-4">See It In Action</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore the interface and discover how {productName} can transform your workflow
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {screenshots.map((screenshot, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200">
              <div className="relative">
                <div className="aspect-[3/2] relative">
                  <Image
                    src={screenshot.image || "/placeholder.svg"}
                    alt={screenshot.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <Badge className="absolute top-4 left-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
                  {screenshot.badge}
                </Badge>
              </div>
              <div className="p-6">
                <h3 className="font-serif font-semibold text-xl text-gray-900 mb-2">{screenshot.title}</h3>
                <p className="text-gray-600">{screenshot.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
