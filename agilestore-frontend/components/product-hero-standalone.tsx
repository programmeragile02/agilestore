import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"
import Image from "next/image"

interface ProductHeroStandaloneProps {
  product: {
    name: string
    tagline: string
    heroImage: string
    slug: string
  }
}

export function ProductHeroStandalone({ product }: ProductHeroStandaloneProps) {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">{product.name}</h1>
            <p className="mt-6 text-xl leading-8 text-gray-600">{product.tagline}</p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-blue-500 px-8 py-4 text-lg font-semibold hover:from-indigo-600 hover:to-blue-600"
                asChild
              >
                <Link href={`/checkout?product=${product.slug}&package=starter&duration=1`}>Try Free</Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg font-semibold bg-transparent" asChild>
                <Link href="#pricing">See Pricing</Link>
              </Button>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4 text-green-500" />
              <span>No credit card required</span>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 shadow-2xl">
              <Image
                src={product.heroImage || "/placeholder.svg"}
                alt={`${product.name} dashboard`}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
