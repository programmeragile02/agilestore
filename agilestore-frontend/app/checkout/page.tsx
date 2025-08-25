"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { ContactInformation } from "@/components/checkout/contact-information"
import { PlanDuration } from "@/components/checkout/plan-duration"
import { PaymentMethod } from "@/components/checkout/payment-method"
import { VoucherCode } from "@/components/checkout/voucher-code"
import { OrderSummary } from "@/components/checkout/order-summary"

// Mock product data (same as in product pages)
const products = [
  {
    id: 1,
    name: "Rent Vix Pro",
    slug: "rent-vix-pro",
    shortDescription: "Smart rental management system with GPS, CCTV, and fuel monitoring.",
  },
  {
    id: 2,
    name: "Ayo Hidupkan Rumah Ibadah",
    slug: "ayo-hidupkan-rumah-ibadah",
    shortDescription: "Donation and activity management app for places of worship.",
  },
  {
    id: 3,
    name: "Absen Fast",
    slug: "absen-fast",
    shortDescription: "Fast and reliable employee attendance system with face recognition.",
  },
  {
    id: 4,
    name: "Salesman Apps",
    slug: "salesman-apps",
    shortDescription: "Mobile CRM for sales teams to manage leads, visits, and orders.",
  },
]

// Mock pricing data
const pricingMatrix = {
  "rent-vix-pro": {
    starter: { 1: 149000, 6: 799000, 12: 1499000 },
    professional: { 1: 249000, 6: 1299000, 12: 2399000 },
    enterprise: { 1: 399000, 6: 2199000, 12: 3999000 },
  },
  "ayo-hidupkan-rumah-ibadah": {
    starter: { 1: 99000, 6: 549000, 12: 999000 },
    professional: { 1: 199000, 6: 1099000, 12: 1999000 },
    enterprise: { 1: 299000, 6: 1649000, 12: 2999000 },
  },
  "absen-fast": {
    starter: { 1: 129000, 6: 699000, 12: 1299000 },
    professional: { 1: 229000, 6: 1249000, 12: 2299000 },
    enterprise: { 1: 349000, 6: 1899000, 12: 3499000 },
  },
  "salesman-apps": {
    starter: { 1: 179000, 6: 949000, 12: 1799000 },
    professional: { 1: 279000, 6: 1499000, 12: 2699000 },
    enterprise: { 1: 429000, 6: 2349000, 12: 4299000 },
  },
}

export interface CheckoutData {
  contact: {
    fullName: string
    email: string
    phone: string
    company: string
  }
  plan: {
    product: string
    package: string
    duration: number
    currency: string
    taxMode: "inclusive" | "exclusive"
  }
  payment: {
    method: "card" | "bank_transfer" | "ewallet"
    cardDetails?: {
      number: string
      expiry: string
      cvv: string
    }
  }
  voucher: {
    code: string
    discount: number
  }
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    contact: { fullName: "", email: "", phone: "", company: "" },
    plan: {
      product: searchParams.get("product") || "",
      package: searchParams.get("package") || "starter",
      duration: Number.parseInt(searchParams.get("duration") || "1"),
      currency: "IDR",
      taxMode: "inclusive",
    },
    payment: { method: "card" },
    voucher: { code: "", discount: 0 },
  })

  const [isValid, setIsValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Validate form
  useEffect(() => {
    const { contact, plan, payment } = checkoutData
    const contactValid = contact.fullName && contact.email && contact.phone
    const planValid = plan.product && plan.package && plan.duration
    const paymentValid = payment.method

    setIsValid(!!(contactValid && planValid && paymentValid))
  }, [checkoutData])

  const selectedProduct = products.find((p) => p.slug === checkoutData.plan.product)
  const basePrice =
    pricingMatrix[checkoutData.plan.product as keyof typeof pricingMatrix]?.[
      checkoutData.plan.package as keyof (typeof pricingMatrix)[keyof typeof pricingMatrix]
    ]?.[
      checkoutData.plan
        .duration as keyof (typeof pricingMatrix)[keyof typeof pricingMatrix][keyof (typeof pricingMatrix)[keyof typeof pricingMatrix]]
    ] || 0

  const handlePlaceOrder = async () => {
    setIsLoading(true)
    // Mock payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Redirect to success page with order data
    const orderId = `ORD-${Date.now()}`
    const orderData = {
      orderId,
      product: selectedProduct?.name,
      package: checkoutData.plan.package,
      duration: checkoutData.plan.duration,
      total: basePrice - checkoutData.voucher.discount,
      paymentMethod: checkoutData.payment.method,
    }

    localStorage.setItem("orderData", JSON.stringify(orderData))
    window.location.href = `/order-success?orderId=${orderId}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="font-serif font-bold text-3xl sm:text-4xl text-gray-900 mb-4">Complete Your Purchase</h1>
              <p className="text-lg text-gray-600">Secure checkout powered by industry-leading encryption</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Left Column - Forms */}
              <div className="lg:col-span-2 space-y-6">
                <ContactInformation
                  data={checkoutData.contact}
                  onChange={(contact) => setCheckoutData((prev) => ({ ...prev, contact }))}
                />

                <PlanDuration
                  data={checkoutData.plan}
                  products={products}
                  onChange={(plan) => setCheckoutData((prev) => ({ ...prev, plan }))}
                />

                <PaymentMethod
                  data={checkoutData.payment}
                  onChange={(payment) => setCheckoutData((prev) => ({ ...prev, payment }))}
                />

                <VoucherCode
                  data={checkoutData.voucher}
                  onChange={(voucher) => setCheckoutData((prev) => ({ ...prev, voucher }))}
                />
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <OrderSummary
                    checkoutData={checkoutData}
                    selectedProduct={selectedProduct}
                    basePrice={basePrice}
                    isValid={isValid}
                    isLoading={isLoading}
                    onPlaceOrder={handlePlaceOrder}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
