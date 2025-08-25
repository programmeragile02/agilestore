"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Starter",
    monthlyPrice: 29,
    yearlyPrice: 290,
    description: "Perfect for small teams getting started",
    features: ["Up to 5 team members", "3 active projects", "Basic reporting", "Email support", "Mobile app access"],
    popular: false,
  },
  {
    name: "Professional",
    monthlyPrice: 79,
    yearlyPrice: 790,
    description: "Ideal for growing teams and businesses",
    features: [
      "Up to 25 team members",
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "Custom integrations",
      "Time tracking",
      "Advanced permissions",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: 149,
    yearlyPrice: 1490,
    description: "For large organizations with complex needs",
    features: [
      "Unlimited team members",
      "Unlimited projects",
      "Custom reporting",
      "24/7 phone support",
      "SSO integration",
      "Advanced security",
      "Dedicated account manager",
      "Custom training",
    ],
    popular: false,
  },
]

interface ProductPricingProps {
  productSlug: string
}

export function ProductPricing({ productSlug }: ProductPricingProps) {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section className="py-16 sm:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif font-bold text-3xl sm:text-4xl text-gray-900 mb-4">Choose Your Plan</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Start with a 14-day free trial. No credit card required.
          </p>

          {/* Pricing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm ${!isYearly ? "text-gray-900 font-medium" : "text-gray-600"}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isYearly ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm ${isYearly ? "text-gray-900 font-medium" : "text-gray-600"}`}>Yearly</span>
            {isYearly && <Badge className="bg-green-100 text-green-800 border-green-200">Save 17%</Badge>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative hover:shadow-lg transition-all duration-300 ${
                plan.popular ? "border-indigo-500 shadow-lg scale-105" : "border-gray-200"
              } bg-white`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white">
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="font-serif font-semibold text-2xl text-gray-900 mb-2">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-gray-600">/{isYearly ? "year" : "month"}</span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </CardHeader>

              <CardContent className="pt-0">
                <Button
                  asChild
                  className={`w-full mb-6 ${
                    plan.popular
                      ? "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
                      : "bg-white border border-gray-300 text-gray-900 hover:bg-gray-50"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  <Link
                    href={`/checkout?product=${productSlug}&package=${plan.name.toLowerCase()}&duration=${isYearly ? "12" : "1"}`}
                  >
                    Subscribe
                  </Link>
                </Button>

                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
