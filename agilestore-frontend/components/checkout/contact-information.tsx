"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Phone, Building } from "lucide-react"

interface ContactData {
  fullName: string
  email: string
  phone: string
  company: string
}

interface ContactInformationProps {
  data: ContactData
  onChange: (data: ContactData) => void
}

export function ContactInformation({ data, onChange }: ContactInformationProps) {
  const handleChange = (field: keyof ContactData, value: string) => {
    onChange({ ...data, [field]: value })
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "")
    return cleaned.length >= 8 && cleaned.length <= 15
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-900">
          <User className="h-5 w-5 text-indigo-500" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
              Full Name *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={data.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="pl-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={data.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={`pl-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                  data.email && !validateEmail(data.email) ? "border-red-300" : ""
                }`}
                required
              />
            </div>
            {data.email && !validateEmail(data.email) && (
              <p className="text-sm text-red-600">Please enter a valid email address</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Phone/WhatsApp *
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="+62 812 3456 7890"
                value={data.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className={`pl-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                  data.phone && !validatePhone(data.phone) ? "border-red-300" : ""
                }`}
                required
              />
            </div>
            {data.phone && !validatePhone(data.phone) && (
              <p className="text-sm text-red-600">Phone number must be 8-15 digits</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium text-gray-700">
              Company/Organization
            </Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="company"
                type="text"
                placeholder="Enter company name (optional)"
                value={data.company}
                onChange={(e) => handleChange("company", e.target.value)}
                className="pl-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
