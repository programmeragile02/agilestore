import { Button } from "@/components/ui/button"
import { ShoppingCart, Play } from "lucide-react"
import Link from "next/link"

interface ProductMobileCTAProps {
  productSlug: string
}

function ProductMobileCTA({ productSlug }: ProductMobileCTAProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-4 shadow-lg md:hidden">
      <div className="flex gap-3">
        <Button
          asChild
          variant="outline"
          size="lg"
          className="flex-1 border-indigo-200 text-indigo-600 hover:bg-indigo-50 bg-transparent"
        >
          <Link href={`/checkout?product=${productSlug}&package=starter&duration=monthly`}>
            <Play className="w-4 h-4 mr-2" />
            Try Free
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg"
        >
          <Link href={`/checkout?product=${productSlug}&package=professional&duration=yearly`}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Buy Now
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default ProductMobileCTA
export { ProductMobileCTA }
