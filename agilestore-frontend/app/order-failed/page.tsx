"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, RefreshCw, ArrowLeft, Mail, MessageCircle } from "lucide-react"

function OrderFailedContent() {
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState("")
  const [orderId, setOrderId] = useState("")

  useEffect(() => {
    const error = searchParams.get("error") || "Payment processing failed"
    const id = searchParams.get("orderId") || ""
    setErrorMessage(error)
    setOrderId(id)
  }, [searchParams])

  const handleRetryPayment = () => {
    // Get the original checkout data from localStorage
    const orderData = localStorage.getItem("orderData")
    if (orderData) {
      const data = JSON.parse(orderData)
      // Redirect back to checkout with the same parameters
      window.location.href = `/checkout?product=${data.productSlug}&package=${data.package}&duration=${data.duration}`
    } else {
      // Fallback to checkout page
      window.location.href = "/checkout"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            {/* Error Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
                  <AlertCircle className="h-12 w-12 text-red-600" />
                </div>
              </div>
              <h1 className="font-serif font-bold text-3xl sm:text-4xl text-gray-900 mb-4">Payment Failed</h1>
              <p className="text-lg text-gray-600">
                We encountered an issue processing your payment. Don't worry, no charges were made to your account.
              </p>
            </div>

            {/* Error Details Card */}
            <Card className="bg-white shadow-sm border border-gray-200 mb-8">
              <CardContent className="p-6 sm:p-8">
                <div className="space-y-6">
                  {orderId && (
                    <>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Order Reference</p>
                        <p className="text-xl font-bold text-gray-900 font-mono">{orderId}</p>
                      </div>
                      <hr className="border-gray-200" />
                    </>
                  )}

                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 mb-2">What went wrong?</h3>
                    <p className="text-gray-600 mb-4">{errorMessage}</p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2">Common solutions:</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Check that your card details are correct</li>
                      <li>• Ensure you have sufficient funds available</li>
                      <li>• Try a different payment method</li>
                      <li>• Contact your bank if the issue persists</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Button
                onClick={handleRetryPayment}
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Payment
              </Button>

              <Button variant="outline" size="lg" asChild>
                <Link href="/products">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Products
                </Link>
              </Button>
            </div>

            {/* Support Information */}
            <Card className="bg-blue-50 border border-blue-200">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
                    <p className="text-sm text-blue-800 mb-4">
                      If you continue to experience issues, our support team is here to help. We typically respond
                      within 2 hours during business hours.
                    </p>
                  </div>
                  <div className="flex justify-center gap-4 text-sm">
                    <a href="mailto:support@agilestore.com" className="text-blue-600 hover:text-blue-800 underline">
                      support@agilestore.com
                    </a>
                    <a href="tel:+6281234567890" className="text-blue-600 hover:text-blue-800 underline">
                      +62 812 3456 7890
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function OrderFailedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderFailedContent />
    </Suspense>
  )
}
