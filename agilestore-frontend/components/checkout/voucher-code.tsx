"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Ticket, Check, X } from "lucide-react"

interface VoucherData {
  code: string
  discount: number
}

interface VoucherCodeProps {
  data: VoucherData
  onChange: (data: VoucherData) => void
}

// Mock voucher codes
const validVouchers = {
  WELCOME10: { discount: 50000, description: "Welcome discount" },
  SAVE20: { discount: 100000, description: "Save 20%" },
  NEWUSER: { discount: 75000, description: "New user discount" },
}

export function VoucherCode({ data, onChange }: VoucherCodeProps) {
  const [inputCode, setInputCode] = useState(data.code)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState("")

  const handleApplyVoucher = async () => {
    if (!inputCode.trim()) return

    setIsApplying(true)
    setError("")

    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const voucher = validVouchers[inputCode.toUpperCase() as keyof typeof validVouchers]

    if (voucher) {
      onChange({ code: inputCode.toUpperCase(), discount: voucher.discount })
      setError("")
    } else {
      setError("Invalid voucher code")
      onChange({ code: "", discount: 0 })
    }

    setIsApplying(false)
  }

  const handleRemoveVoucher = () => {
    setInputCode("")
    onChange({ code: "", discount: 0 })
    setError("")
  }

  const appliedVoucher = data.code ? validVouchers[data.code as keyof typeof validVouchers] : null

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <Ticket className="h-5 w-5 text-indigo-500" />
          Voucher / Promo Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!data.code ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter voucher code"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                onKeyPress={(e) => e.key === "Enter" && handleApplyVoucher()}
              />
              <Button
                onClick={handleApplyVoucher}
                disabled={!inputCode.trim() || isApplying}
                className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
              >
                {isApplying ? "Applying..." : "Apply"}
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <X className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="text-sm text-gray-500">
              <p className="font-medium mb-2">Available vouchers for testing:</p>
              <ul className="space-y-1">
                <li>
                  • <code className="bg-gray-100 px-1 rounded">WELCOME10</code> - IDR 50,000 off
                </li>
                <li>
                  • <code className="bg-gray-100 px-1 rounded">SAVE20</code> - IDR 100,000 off
                </li>
                <li>
                  • <code className="bg-gray-100 px-1 rounded">NEWUSER</code> - IDR 75,000 off
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-green-900">{data.code}</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">Applied</Badge>
                </div>
                <p className="text-sm text-green-700">
                  {appliedVoucher?.description} - IDR {data.discount.toLocaleString()} discount
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveVoucher}
              className="text-green-700 hover:text-green-900 hover:bg-green-100"
            >
              Remove
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
