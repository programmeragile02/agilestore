"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, ChevronLeft, ChevronRight, Monitor, Smartphone, Tablet } from "lucide-react"

interface ProductDemoGalleryProps {
  product: {
    name: string
    slug: string
  }
}

const ProductDemoGalleryComponent = ({ product }: ProductDemoGalleryProps) => {
  const [activeTab, setActiveTab] = useState("desktop")
  const [currentSlide, setCurrentSlide] = useState(0)

  const productName = product?.name || "Product"
  const productSlug = product?.slug || "product"

  const demoItems = [
    {
      type: "video",
      title: "Dashboard Overview",
      description: "See how easy it is to manage your rental properties",
      thumbnail: `/placeholder.svg?height=400&width=600&query=${productName} dashboard overview`,
      duration: "2:30",
    },
    {
      type: "image",
      title: "Property Management",
      description: "Add and organize your rental properties",
      thumbnail: `/placeholder.svg?height=400&width=600&query=${productName} property management interface`,
    },
    {
      type: "image",
      title: "Tenant Portal",
      description: "Tenant-friendly interface for payments and requests",
      thumbnail: `/placeholder.svg?height=400&width=600&query=${productName} tenant portal`,
    },
    {
      type: "video",
      title: "Mobile App Demo",
      description: "Manage everything on the go",
      thumbnail: `/placeholder.svg?height=400&width=600&query=${productName} mobile app demo`,
      duration: "1:45",
    },
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % demoItems.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + demoItems.length) % demoItems.length)
  }

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">See {productName} in Action</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Watch how {productName} transforms your rental property management with intuitive interfaces and powerful
            features.
          </p>
        </div>

        {/* Device Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setActiveTab("desktop")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === "desktop" ? "bg-indigo-600 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Monitor className="w-4 h-4" />
              Desktop
            </button>
            <button
              onClick={() => setActiveTab("tablet")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === "tablet" ? "bg-indigo-600 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Tablet className="w-4 h-4" />
              Tablet
            </button>
            <button
              onClick={() => setActiveTab("mobile")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === "mobile" ? "bg-indigo-600 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile
            </button>
          </div>
        </div>

        {/* Main Demo Display */}
        <div className="relative mb-8">
          <Card className="overflow-hidden shadow-2xl">
            <div className="relative">
              <img
                src={demoItems[currentSlide].thumbnail || "/placeholder.svg"}
                alt={demoItems[currentSlide].title}
                className="w-full h-96 object-cover"
              />

              {/* Video Play Button */}
              {demoItems[currentSlide].type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                  <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 rounded-full p-4">
                    <Play className="w-8 h-8" />
                  </Button>
                </div>
              )}

              {/* Duration Badge */}
              {demoItems[currentSlide].duration && (
                <Badge className="absolute top-4 right-4 bg-black bg-opacity-70 text-white">
                  {demoItems[currentSlide].duration}
                </Badge>
              )}

              {/* Navigation Arrows */}
              <Button
                variant="outline"
                size="icon"
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white shadow-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white shadow-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{demoItems[currentSlide].title}</h3>
              <p className="text-gray-600">{demoItems[currentSlide].description}</p>
            </div>
          </Card>
        </div>

        {/* Thumbnail Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {demoItems.map((item, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                currentSlide === index ? "ring-2 ring-indigo-600" : ""
              }`}
              onClick={() => setCurrentSlide(index)}
            >
              <div className="relative">
                <img
                  src={item.thumbnail || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full h-24 object-cover rounded-t-lg"
                />
                {item.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-t-lg">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <h4 className="font-medium text-sm text-gray-900 truncate">{item.title}</h4>
                {item.duration && <p className="text-xs text-gray-500 mt-1">{item.duration}</p>}
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-8 py-3"
          >
            Start Your Free Trial
          </Button>
          <p className="text-sm text-gray-500 mt-2">No credit card required • 14-day free trial</p>
        </div>
      </div>
    </section>
  )
}

export default ProductDemoGalleryComponent
export { ProductDemoGalleryComponent as ProductDemoGallery }
