"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Shield, Loader2, Lock } from "lucide-react"
import type { CheckoutData } from "@/app/checkout/page"

interface Product {
  id: number
  name: string
  slug: string
  shortDescription: string
}

interface OrderSummaryProps {
  checkoutData: CheckoutData
  selectedProduct?: Product
  basePrice: number
  isValid: boolean
  isLoading: boolean
  onPlaceOrder: () => void
}

export function OrderSummary({
  checkoutData,
  selectedProduct,
  basePrice,
  isValid,
  isLoading,
  onPlaceOrder,
}: OrderSummaryProps) {
  const { plan, voucher } = checkoutData

  // Calculate pricing
  const subtotal = basePrice
  const discount = voucher.discount
  const taxRate = plan.taxMode === "exclusive" ? 0.11 : 0
  const tax = plan.taxMode === "exclusive" ? (subtotal - discount) * taxRate : 0
  const total = subtotal - discount + tax

  const formatPrice = (price: number) => {
    return plan.currency === "IDR" ? `IDR ${price.toLocaleString()}` : `$${(price / 15000).toFixed(2)}`
  }

  const getDurationLabel = (months: number) => {
    if (months === 1) return "1 Month"
    if (months === 6) return "6 Months"
    if (months === 12) return "12 Months"
    return `${months} Months`
  }

  const getPackageLabel = (pkg: string) => {
    return pkg.charAt(0).toUpperCase() + pkg.slice(1)
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200 sticky top-8 rounded-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <ShoppingCart className="h-5 w-5 text-indigo-500" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Product Details */}
        {selectedProduct && (
          <div className="space-y-3">
            <div className="mb-3">
              <h3 className="font-bold text-base text-gray-900">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedProduct.shortDescription}</p>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-gray-100 text-gray-800 text-sm rounded-full px-3 py-1">
                {getPackageLabel(plan.package)}
              </Badge>
              <Badge className="bg-gray-100 text-gray-800 text-sm rounded-full px-3 py-1">
                {getDurationLabel(plan.duration)}
              </Badge>
            </div>
          </div>
        )}

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-600">{formatPrice(subtotal)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount ({voucher.code})</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}

          {plan.taxMode === "exclusive" && tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (11%)</span>
              <span className="font-medium text-gray-600">{formatPrice(tax)}</span>
            </div>
          )}

          {plan.taxMode === "inclusive" && <div className="text-xs text-gray-500">* Tax included in price</div>}

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span className="text-gray-900">Total</span>
            <span className="bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">
              {formatPrice(total)}
            </span>
          </div>
        </div>

        {/* Place Order Button */}
        <Button
          onClick={onPlaceOrder}
          disabled={!isValid || isLoading}
          className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-4 shadow-lg font-bold text-white"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Place Order • {formatPrice(total)}
            </>
          )}
        </Button>

        {/* Terms */}
        <p className="text-xs text-gray-500 text-center">
          By completing your purchase, you agree to our{" "}
          <a href="/terms" className="text-indigo-600 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-indigo-600 hover:underline">
            Privacy Policy
          </a>
          .
        </p>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Shield className="h-3 w-3" />
          <span>Secure payment powered by 256-bit SSL encryption</span>
        </div>
      </CardContent>
    </Card>
  )
}
