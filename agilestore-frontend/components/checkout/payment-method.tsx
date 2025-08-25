"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, Building, Smartphone } from "lucide-react"

interface PaymentData {
  method: "card" | "bank_transfer" | "ewallet"
  cardDetails?: {
    number: string
    expiry: string
    cvv: string
  }
}

interface PaymentMethodProps {
  data: PaymentData
  onChange: (data: PaymentData) => void
}

export function PaymentMethod({ data, onChange }: PaymentMethodProps) {
  const [cardDetails, setCardDetails] = useState(data.cardDetails || { number: "", expiry: "", cvv: "" })

  const handleMethodChange = (method: "card" | "bank_transfer" | "ewallet") => {
    onChange({ ...data, method, cardDetails: method === "card" ? cardDetails : undefined })
  }

  const handleCardChange = (field: keyof typeof cardDetails, value: string) => {
    const newCardDetails = { ...cardDetails, [field]: value }
    setCardDetails(newCardDetails)
    onChange({ ...data, cardDetails: newCardDetails })
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(" ")
    } else {
      return v
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4)
    }
    return v
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <CreditCard className="h-5 w-5 text-indigo-500" />
          Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={data.method} onValueChange={handleMethodChange}>
          {/* Credit/Debit Card */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                <CreditCard className="h-4 w-4" />
                Credit/Debit Card
              </Label>
            </div>

            {data.method === "card" && (
              <div className="ml-6 space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">
                    Card Number
                  </Label>
                  <Input
                    id="cardNumber"
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.number}
                    onChange={(e) => handleCardChange("number", formatCardNumber(e.target.value))}
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    maxLength={19}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="text-sm font-medium text-gray-700">
                      Expiry Date
                    </Label>
                    <Input
                      id="expiry"
                      type="text"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={(e) => handleCardChange("expiry", formatExpiry(e.target.value))}
                      className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      maxLength={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="text-sm font-medium text-gray-700">
                      CVV
                    </Label>
                    <Input
                      id="cvv"
                      type="text"
                      placeholder="123"
                      value={cardDetails.cvv}
                      onChange={(e) => handleCardChange("cvv", e.target.value.replace(/\D/g, ""))}
                      className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bank Transfer */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bank_transfer" id="bank_transfer" />
              <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer">
                <Building className="h-4 w-4" />
                Bank Transfer / Virtual Account
              </Label>
            </div>

            {data.method === "bank_transfer" && (
              <div className="ml-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  After clicking "Place Order", you'll receive bank transfer instructions via email and WhatsApp.
                  Payment must be completed within 24 hours.
                </p>
              </div>
            )}
          </div>

          {/* E-Wallet */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ewallet" id="ewallet" />
              <Label htmlFor="ewallet" className="flex items-center gap-2 cursor-pointer">
                <Smartphone className="h-4 w-4" />
                E-Wallet (GoPay, OVO, DANA)
              </Label>
            </div>

            {data.method === "ewallet" && (
              <div className="ml-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  You'll be redirected to your e-wallet app to complete the payment. Make sure you have the app
                  installed on your device.
                </p>
              </div>
            )}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  )
}
