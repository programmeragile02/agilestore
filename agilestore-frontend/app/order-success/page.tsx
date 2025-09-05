"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Download,
  ArrowRight,
  Mail,
  MessageCircle,
} from "lucide-react";

interface OrderData {
  orderId: string;
  product: string;
  package: string;
  duration: number;
  total: number;
  paymentMethod: string;
  customerEmail?: string;
  customerPhone?: string;
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get order data from localStorage (set during checkout)
    const storedOrderData = localStorage.getItem("orderData");
    if (storedOrderData) {
      setOrderData(JSON.parse(storedOrderData));
    }
    setIsLoading(false);
  }, []);

  const formatPrice = (price: number) => {
    return `IDR ${price.toLocaleString()}`;
  };

  const getDurationLabel = (months: number) => {
    if (months === 1) return "1 Month";
    if (months === 6) return "6 Months";
    if (months === 12) return "12 Months";
    return `${months} Months`;
  };

  const getPackageLabel = (pkg: string) => {
    return pkg.charAt(0).toUpperCase() + pkg.slice(1);
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "card":
        return "Credit/Debit Card";
      case "bank_transfer":
        return "Bank Transfer";
      case "ewallet":
        return "E-Wallet";
      default:
        return method;
    }
  };

  const handleDownloadInvoice = () => {
    // Mock invoice download
    const invoiceData = `
AGILE STORE - INVOICE
Order ID: ${orderData?.orderId}
Product: ${orderData?.product}
Package: ${getPackageLabel(orderData?.package || "")}
Duration: ${getDurationLabel(orderData?.duration || 1)}
Total: ${formatPrice(orderData?.total || 0)}
Payment Method: ${getPaymentMethodLabel(orderData?.paymentMethod || "")}
Date: ${new Date().toLocaleDateString()}
    `;

    const blob = new Blob([invoiceData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${orderData?.orderId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Order Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              We couldn't find your order details.
            </p>
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="flex items-center justify-center w-24 h-24 bg-green-100 rounded-full shadow-lg">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
              </div>
              <h1 className="font-bold text-4xl sm:text-5xl text-slate-900 mb-4">
                Thank You! Your purchase was successful.
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Your product is now active. You can manage it anytime in your
                account.
              </p>
            </div>

            {/* Order Summary Card */}
            <Card className="bg-white shadow-lg border-0 mb-8">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-6 text-center">
                  Order Summary
                </h3>

                <div className="space-y-6">
                  {/* Product Name */}
                  <div className="flex justify-between items-start">
                    <span className="text-slate-600 font-medium">
                      Product Name:
                    </span>
                    <span className="text-slate-900 font-semibold text-right">
                      {orderData.product}
                    </span>
                  </div>

                  {/* Order ID */}
                  <div className="flex justify-between items-start">
                    <span className="text-slate-600 font-medium">
                      Order ID:
                    </span>
                    <span className="text-slate-900 font-mono font-semibold">
                      {orderData.orderId}
                    </span>
                  </div>

                  {/* Amount Paid */}
                  <div className="flex justify-between items-start">
                    <span className="text-slate-600 font-medium">
                      Amount Paid:
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatPrice(orderData.total)}
                    </span>
                  </div>

                  {/* Payment Method */}
                  <div className="flex justify-between items-start">
                    <span className="text-slate-600 font-medium">
                      Payment Method:
                    </span>
                    <span className="text-slate-900 font-semibold">
                      {getPaymentMethodLabel(orderData.paymentMethod)}
                    </span>
                  </div>

                  <Separator className="my-6" />

                  {/* Package Details */}
                  <div className="flex justify-center gap-3">
                    <Badge
                      variant="outline"
                      className="border-blue-200 text-blue-700 px-4 py-2"
                    >
                      {getPackageLabel(orderData.package)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-green-200 text-green-700 px-4 py-2"
                    >
                      {getDurationLabel(orderData.duration)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main CTA Button */}
            <div className="text-center mb-8">
              <Button
                asChild
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg"
              >
                <Link href="/my-account">
                  Go to My Account
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Button
                variant="outline"
                size="lg"
                onClick={handleDownloadInvoice}
                className="border-slate-300 bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>

              <Button
                variant="outline"
                size="lg"
                asChild
                className="border-slate-300 bg-transparent"
              >
                <Link href="/support">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Link>
              </Button>
            </div>

            {/* Contact Information */}
            <Card className="bg-blue-50 border border-blue-200">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                      <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">
                      What's Next?
                    </h4>
                    <p className="text-sm text-blue-800 mb-4">
                      You'll receive login credentials and setup instructions
                      via email within 15 minutes.
                    </p>
                    <p className="text-xs text-blue-700">
                      Need help? Contact us at{" "}
                      <a
                        href="mailto:support@agilestore.com"
                        className="underline font-medium"
                      >
                        support@agilestore.com
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
