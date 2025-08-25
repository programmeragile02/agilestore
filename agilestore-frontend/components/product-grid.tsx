"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Sample product data - later replace with API
const products = [
  {
    id: 1,
    name: "Rent Vix Pro",
    shortDescription: "Smart rental management system with GPS, CCTV, and fuel monitoring.",
    heroImage: "/placeholder.svg?height=300&width=400",
    slug: "rent-vix-pro",
  },
  {
    id: 2,
    name: "Ayo Hidupkan Rumah Ibadah",
    shortDescription: "Donation and activity management app for places of worship.",
    heroImage: "/placeholder.svg?height=300&width=400",
    slug: "ayo-hidupkan-rumah-ibadah",
  },
  {
    id: 3,
    name: "Absen Fast",
    shortDescription: "Fast and reliable employee attendance system with face recognition.",
    heroImage: "/placeholder.svg?height=300&width=400",
    slug: "absen-fast",
  },
  {
    id: 4,
    name: "Salesman Apps",
    shortDescription: "Mobile CRM for sales teams to manage leads, visits, and orders.",
    heroImage: "/placeholder.svg?height=300&width=400",
    slug: "salesman-apps",
  },
]

export default function ProductGrid() {
  const [loading, setLoading] = useState(false)

  const ProductCard = ({ product }: { product: (typeof products)[0] }) => {
    const isDisabled = !product.slug

    const cardContent = (
      <Card
        className={`h-full transition-all duration-200 ${
          isDisabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:shadow-lg hover:-translate-y-1 hover:ring-2 hover:ring-indigo-500/20 cursor-pointer"
        }`}
      >
        <CardContent className="p-0">
          <div className="aspect-[4/3] relative overflow-hidden rounded-t-lg">
            <Image src={product.heroImage || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{product.name}</h3>
            <p className="text-gray-600 mb-4 line-clamp-3">{product.shortDescription}</p>
            <Button
              className={`w-full ${
                isDisabled
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
              }`}
              disabled={isDisabled}
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    )

    if (isDisabled) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>{cardContent}</div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Landing page not available</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return (
      <Link href={`/product/${product.slug}`} className="block h-full">
        {cardContent}
      </Link>
    )
  }

  const ProductSkeleton = () => (
    <Card className="h-full">
      <CardContent className="p-0">
        <Skeleton className="aspect-[4/3] rounded-t-lg" />
        <div className="p-6">
          <Skeleton className="h-6 mb-3" />
          <Skeleton className="h-4 mb-2" />
          <Skeleton className="h-4 mb-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Products</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose from our comprehensive suite of business solutions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <ProductSkeleton key={index} />)
            : products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </div>
    </section>
  )
}
