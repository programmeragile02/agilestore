"use client"

import { useState } from "react"
import { Check, Shield, CreditCard, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface PricingPlan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  popular?: boolean
  cta: string
}

interface ProductPricingStandaloneProps {
  product: {
    slug: string
    name: string
  }
}

const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small rental businesses",
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      "Up to 50 properties",
      "Basic booking management",
      "Email notifications",
      "Mobile app access",
      "Basic reporting",
    ],
    cta: "Start Free Trial",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Best for growing rental companies",
    monthlyPrice: 79,
    yearlyPrice: 790,
    popular: true,
    features: [
      "Up to 200 properties",
      "Advanced booking system",
      "SMS & email notifications",
      "Multi-user access",
      "Advanced analytics",
      "Payment processing",
      "Custom branding",
      "Priority support",
    ],
    cta: "Start Free Trial",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large rental operations",
    monthlyPrice: 149,
    yearlyPrice: 1490,
    features: [
      "Unlimited properties",
      "Full feature access",
      "White-label solution",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "24/7 phone support",
      "Custom training",
    ],
    cta: "Contact Sales",
  },
]

function ProductPricingStandalone({ product }: ProductPricingStandaloneProps) {
  const [isYearly, setIsYearly] = useState(false)

  const handlePlanSelect = (plan: PricingPlan) => {
    const duration = isYearly ? "yearly" : "monthly"
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice

    if (plan.id === "enterprise") {
      // For enterprise, could redirect to contact form
      return `/contact?product=${product.slug}&package=${plan.id}`
    }

    return `/checkout?product=${product.slug}&package=${plan.id}&duration=${duration}&price=${price}`
  }

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
          <p className="text-xl text-gray-600 mb-8">Start your free trial today. No credit card required.</p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm font-medium ${!isYearly ? "text-blue-600" : "text-gray-500"}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                isYearly ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isYearly ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? "text-blue-600" : "text-gray-500"}`}>Yearly</span>
            {isYearly && (
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                Save 17%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {pricingPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular ? "border-2 border-blue-500 shadow-xl scale-105" : "border border-gray-200 shadow-lg"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">{plan.name}</CardTitle>
                <p className="text-sm text-gray-600 mt-2">{plan.description}</p>

                <div className="mt-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-gray-600 ml-1">/{isYearly ? "year" : "month"}</span>
                  </div>
                  {isYearly && (
                    <p className="text-sm text-gray-500 mt-1">
                      ${Math.round(plan.yearlyPrice / 12)}/month billed annually
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <Link href={handlePlanSelect(plan)}>
                  <Button
                    className={`w-full mb-6 ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        : ""
                    }`}
                    size="lg"
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-gray-600">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-green-500 mr-2" />
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 text-blue-500 mr-2" />
              <span>Secure payment processing</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span>Cancel anytime</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4">All plans include free setup and migration assistance</p>
        </div>
      </div>
    </section>
  )
}

export { ProductPricingStandalone }
