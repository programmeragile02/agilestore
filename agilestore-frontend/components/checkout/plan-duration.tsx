"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Clock, DollarSign, Settings } from "lucide-react"

interface PlanData {
  product: string
  package: string
  duration: number
  currency: string
  taxMode: "inclusive" | "exclusive"
}

interface Product {
  id: number
  name: string
  slug: string
  shortDescription: string
}

interface PlanDurationProps {
  data: PlanData
  products: Product[]
  onChange: (data: PlanData) => void
}

const packages = [
  { value: "starter", label: "Starter", description: "Perfect for small teams" },
  { value: "professional", label: "Professional", description: "Ideal for growing businesses", popular: true },
  { value: "enterprise", label: "Enterprise", description: "For large organizations" },
]

const durations = [
  { value: 1, label: "1 Month", discount: 0 },
  { value: 6, label: "6 Months", discount: 10 },
  { value: 12, label: "12 Months", discount: 17 },
]

const currencies = [
  { value: "IDR", label: "Indonesian Rupiah (IDR)" },
  { value: "USD", label: "US Dollar (USD)" },
]

export function PlanDuration({ data, products, onChange }: PlanDurationProps) {
  const handleChange = (field: keyof PlanData, value: string | number) => {
    onChange({ ...data, [field]: value })
  }

  const selectedProduct = products.find((p) => p.slug === data.product)

  return (
    <Card className="bg-white shadow-sm border border-gray-200 rounded-xl">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <Package className="h-5 w-5 text-indigo-500" />
          Plan & Duration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-8">
        {/* Product Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-900">Product</Label>
          {data.product ? (
            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
              <div className="font-bold text-lg text-gray-900">{selectedProduct?.name}</div>
              <div className="text-sm text-gray-600 mt-1">{selectedProduct?.shortDescription}</div>
            </div>
          ) : (
            <Select value={data.product} onValueChange={(value) => handleChange("product", value)}>
              <SelectTrigger className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 h-10">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent className="min-w-[400px]">
                {products.map((product) => (
                  <SelectItem key={product.slug} value={product.slug} className="py-4 px-4">
                    <div className="py-2 px-1">
                      <div className="font-medium text-base">{product.name}</div>
                      <div className="text-sm text-gray-500 mt-2 leading-relaxed">{product.shortDescription}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Package Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-900">Package</Label>
          <Select value={data.package} onValueChange={(value) => handleChange("package", value)}>
            <SelectTrigger className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 h-10">
              <SelectValue placeholder="Select a package" />
            </SelectTrigger>
            <SelectContent className="min-w-[350px]">
              {packages.map((pkg) => (
                <SelectItem key={pkg.value} value={pkg.value} className="py-4 px-4">
                  <div className="flex items-center justify-between gap-3 py-2 px-1 w-full">
                    <div className="flex-1">
                      <div className="font-medium text-base">{pkg.label}</div>
                    </div>
                    {pkg.popular && <Badge className="bg-indigo-100 text-indigo-800 ml-2">Popular</Badge>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {data.package && (
            <p className="text-xs text-gray-500">{packages.find((p) => p.value === data.package)?.description}</p>
          )}
        </div>

        {/* Duration Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-900">Duration</Label>
          <div className="flex gap-2">
            {durations.map((duration) => (
              <Button
                key={duration.value}
                variant={data.duration === duration.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleChange("duration", duration.value)}
                className={`flex-1 h-10 rounded-full ${
                  data.duration === duration.value
                    ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Clock className="h-4 w-4 mr-2" />
                {duration.value === 1 ? "1M" : duration.value === 6 ? "6M" : "12M"}
                {duration.discount > 0 && (
                  <Badge className="ml-2 bg-green-100 text-green-800 text-xs">-{duration.discount}%</Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Currency Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900">Currency</Label>
            <Select value={data.currency} onValueChange={(value) => handleChange("currency", value)}>
              <SelectTrigger className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 h-10 w-fit min-w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="min-w-[200px]">
                {currencies.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value} className="py-3 px-4">
                    <div className="flex items-center gap-3 py-1 px-1">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="text-base">{currency.value}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tax Mode */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-900">Tax Mode</Label>
            <Select
              value={data.taxMode}
              onValueChange={(value: "inclusive" | "exclusive") => handleChange("taxMode", value)}
            >
              <SelectTrigger className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 h-10">
                <Settings className="h-4 w-4 text-gray-400 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="min-w-[180px]">
                <SelectItem value="inclusive" className="py-3 px-4">
                  <div className="flex items-center gap-3 py-1 px-1">
                    <Settings className="h-4 w-4 text-gray-400" />
                    <span className="text-base">Tax Inclusive</span>
                  </div>
                </SelectItem>
                <SelectItem value="exclusive" className="py-3 px-4">
                  <div className="flex items-center gap-3 py-1 px-1">
                    <Settings className="h-4 w-4 text-gray-400" />
                    <span className="text-base">Tax Exclusive</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
