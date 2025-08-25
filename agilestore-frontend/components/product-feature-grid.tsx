"use client"

import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import * as Icons from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface Feature {
  icon: string
  title: string
  description: string
}

interface ProductFeatureGridProps {
  features: Feature[]
}

export function ProductFeatureGrid({ features }: ProductFeatureGridProps) {
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null)

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Powerful Features</h2>
          <p className="mt-4 text-lg text-gray-600">Everything you need to manage your rental business efficiently</p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const IconComponent = Icons[feature.icon as keyof typeof Icons] as LucideIcon
            const isExpanded = expandedFeature === index

            return (
              <div key={index} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500">
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 p-0 text-indigo-600 hover:text-indigo-700"
                  onClick={() => setExpandedFeature(isExpanded ? null : index)}
                >
                  View details
                  {isExpanded ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                </Button>

                {isExpanded && (
                  <div className="mt-3 rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-700">
                      Advanced {feature.title.toLowerCase()} capabilities with enterprise-grade security, real-time
                      synchronization, and comprehensive analytics to help you make data-driven decisions.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
