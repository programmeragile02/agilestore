"use client"

import { useState } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  Calendar,
  CreditCard,
  User,
  Settings,
  Download,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

// Mock user data
const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+62 812 3456 7890",
  company: "PT. Example Company",
  joinDate: "2024-01-15",
}

// Mock subscription data
const mockSubscriptions = [
  {
    id: "sub-001",
    productName: "Rent Vix Pro",
    package: "Professional",
    duration: 12,
    startDate: "2024-01-15",
    endDate: "2025-01-15",
    status: "active",
    price: 2399000,
    autoRenew: true,
  },
  {
    id: "sub-002",
    productName: "Absen Fast",
    package: "Starter",
    duration: 6,
    startDate: "2024-02-01",
    endDate: "2024-08-01",
    status: "expired",
    price: 699000,
    autoRenew: false,
  },
]

// Mock invoice data
const mockInvoices = [
  {
    id: "INV-2024-001",
    date: "2024-01-15",
    product: "Rent Vix Pro",
    package: "Professional",
    amount: 2399000,
    status: "paid",
    downloadUrl: "#",
  },
  {
    id: "INV-2024-002",
    date: "2024-02-01",
    product: "Absen Fast",
    package: "Starter",
    amount: 699000,
    status: "paid",
    downloadUrl: "#",
  },
]

export default function MemberDashboard() {
  const [user, setUser] = useState(mockUser)
  const [subscriptions, setSubscriptions] = useState(mockSubscriptions)
  const [invoices, setInvoices] = useState(mockInvoices)

  const formatPrice = (price: number) => {
    return `IDR ${price.toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date()
    const expiry = new Date(endDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
      case "expired":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Paid</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="font-serif font-bold text-3xl sm:text-4xl text-gray-900 mb-2">
                Welcome back, {user.name}!
              </h1>
              <p className="text-lg text-gray-600">Manage your subscriptions and account settings</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {subscriptions.filter((s) => s.status === "active").length}
                      </p>
                      <p className="text-sm text-gray-600">Active Subscriptions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.min(
                          ...subscriptions
                            .filter((s) => s.status === "active")
                            .map((s) => getDaysUntilExpiry(s.endDate)),
                        )}
                      </p>
                      <p className="text-sm text-gray-600">Days Until Next Renewal</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg">
                      <CreditCard className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
                      <p className="text-sm text-gray-600">Total Invoices</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="subscriptions" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
                <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  My Subscriptions
                </TabsTrigger>
                <TabsTrigger value="billing" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Billing & Invoices
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile Settings
                </TabsTrigger>
              </TabsList>

              {/* Subscriptions Tab */}
              <TabsContent value="subscriptions" className="space-y-6">
                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-indigo-500" />
                      My Subscriptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {subscriptions.map((subscription) => (
                      <div key={subscription.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{subscription.productName}</h3>
                            <p className="text-gray-600">{subscription.package} Plan</p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(subscription.status)}
                            <p className="text-lg font-bold text-gray-900 mt-1">{formatPrice(subscription.price)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Start Date</p>
                            <p className="font-medium">{formatDate(subscription.startDate)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">End Date</p>
                            <p className="font-medium">{formatDate(subscription.endDate)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Duration</p>
                            <p className="font-medium">{subscription.duration} months</p>
                          </div>
                        </div>

                        {subscription.status === "active" && (
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              {getDaysUntilExpiry(subscription.endDate)} days remaining
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Access Product
                              </Button>
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-2" />
                                Manage
                              </Button>
                            </div>
                          </div>
                        )}

                        {subscription.status === "expired" && (
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              Subscription expired
                            </div>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
                            >
                              Renew Subscription
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing" className="space-y-6">
                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-indigo-500" />
                      Billing & Invoices
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                              <CreditCard className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{invoice.id}</p>
                              <p className="text-sm text-gray-600">
                                {invoice.product} - {invoice.package}
                              </p>
                              <p className="text-sm text-gray-500">{formatDate(invoice.date)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{formatPrice(invoice.amount)}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getPaymentStatusBadge(invoice.status)}
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-indigo-500" />
                      Profile Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Personal Information</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">Full Name</p>
                            <p className="font-medium">{user.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Email Address</p>
                            <p className="font-medium">{user.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Phone Number</p>
                            <p className="font-medium">{user.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Company</p>
                            <p className="font-medium">{user.company}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Account Information</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">Member Since</p>
                            <p className="font-medium">{formatDate(user.joinDate)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Account Status</p>
                            <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex gap-4">
                      <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button variant="outline">Change Password</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
