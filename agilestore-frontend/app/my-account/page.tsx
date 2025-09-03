"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Package,
  Calendar,
  CreditCard,
  User,
  Download,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  LogOut,
  Home,
  Shield,
  FileText,
  RefreshCw,
  ArrowUpCircle,
  MessageCircle,
  Phone,
  Mail,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCustomerMe,
  logoutCustomer,
  updateCustomerProfile,
  type CustomerUser,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

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
    appUrl: "https://rentvix.com/dashboard",
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
    appUrl: "https://absenfast.com/login",
  },
];

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
  {
    id: "INV-2024-003",
    date: "2024-12-01",
    product: "Rent Vix Pro",
    package: "Professional",
    amount: 2399000,
    status: "pending",
    downloadUrl: "#",
  },
];

// FAQ data
const faqData = [
  {
    question: "How do I access my purchased products?",
    answer:
      "You can access your products by clicking the 'Open App' button in the My Products section. You'll receive login credentials via email after purchase.",
  },
  {
    question: "How do I renew my subscription?",
    answer:
      "Go to the 'Renewal & Upgrade' section and click the 'Renew' button next to your product. You can choose to extend for the same duration or upgrade your package.",
  },
  {
    question: "Can I upgrade my package anytime?",
    answer:
      "Yes, you can upgrade your package at any time. The price difference will be prorated based on your remaining subscription period.",
  },
  {
    question: "How do I download my invoices?",
    answer:
      "In the 'Billing & Invoices' section, click the download icon next to each invoice to download the PDF version.",
  },
  {
    question: "What happens if my payment fails?",
    answer:
      "If a payment fails, you'll receive an email notification. You have 7 days to update your payment method before the service is suspended.",
  },
];

type ActiveSection =
  | "dashboard"
  | "products"
  | "billing"
  | "renewal"
  | "profile"
  | "support";

export default function MyAccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // form state (diisi dari user real)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  const [subscriptions, setSubscriptions] = useState(mockSubscriptions);
  const [invoices, setInvoices] = useState(mockInvoices);
  const [activeSection, setActiveSection] =
    useState<ActiveSection>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    whatsapp: true,
    renewal: true,
    updates: false,
  });

  // fetch user
  useEffect(() => {
    const load = async () => {
      try {
        const me = await getCustomerMe();
        setUser(me);
        setFullName(me.full_name || "");
        setEmail(me.email || "");
        setPhone(me.phone || "");
        setCompany(me.company || "");
      } catch (e) {
        // kemungkinan 401 → balik ke login
        router.push("/login");
      } finally {
        setLoadingUser(false);
      }
    };
    load();
  }, [router]);

  const formatPrice = (price: number) => {
    return `IDR ${price.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case "expired":
        return <Badge className="bg-red-500 text-white">Expired</Badge>;
      case "trial":
        return <Badge className="bg-blue-500 text-white">Trial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500 text-white">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500 text-white">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "products", label: "My Products", icon: Package },
    { id: "billing", label: "Billing & Invoices", icon: CreditCard },
    { id: "renewal", label: "Renewal & Upgrade", icon: RefreshCw },
    { id: "profile", label: "Profile & Account Settings", icon: User },
    { id: "support", label: "Support & Help Center", icon: HelpCircle },
  ];

  const activeProducts = subscriptions.filter((s) => s.status === "active");
  const nextRenewal =
    activeProducts.length > 0
      ? Math.min(...activeProducts.map((s) => getDaysUntilExpiry(s.endDate)))
      : 0;
  const outstandingInvoices = invoices.filter(
    (i) => i.status === "pending"
  ).length;

  // actions (save user, logout, dll)
  const onSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);

    try {
      const res = await updateCustomerProfile({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company: company.trim() || null,
      });
      // sinkronkan state dari backend (pastikan selalu pakai data terbaru)
      setUser(res.data);
      toast({ title: "Saved", description: "Profile updated successfully." });
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: String(e?.message ?? "Unknown error"),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const onLogout = async () => {
    try {
      await logoutCustomer();
      toast({ title: "Signed out", description: "See you again!" });
    } finally {
      router.push("/login");
    }
  };

  // ===== Loading skeleton untuk seluruh halaman =====
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Agile Store
              </h1>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">My Account</span>
            </div>
            <Button
              variant="ghost"
              className="text-slate-600 cursor-pointer"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          <Skeleton className="h-64 rounded-xl bg-muted" />
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-24 rounded-xl bg-muted" />
            <Skeleton className="h-64 rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Welcome back{user?.full_name ? `, ${user.full_name}` : ""}!
              </h2>
              <p className="text-slate-600">
                Here's an overview of your account and subscriptions.
              </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {activeProducts.length}
                      </p>
                      <p className="text-sm text-slate-600">Active Products</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {nextRenewal}
                      </p>
                      <p className="text-sm text-slate-600">
                        Days Until Renewal
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {outstandingInvoices}
                      </p>
                      <p className="text-sm text-slate-600">
                        Outstanding Invoice
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Products Mini List */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Active Products</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {product.productName}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {product.package} Plan
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(product.status)}
                      <p className="text-sm text-slate-600 mt-1">
                        Expires: {formatDate(product.endDate)}
                      </p>
                    </div>
                  </div>
                ))}
                {activeProducts.length === 0 && (
                  <p className="text-slate-600 text-center py-4">
                    No active products
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "products":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                My Products
              </h2>
              <p className="text-slate-600">
                Manage and access your purchased products.
              </p>
            </div>

            <div className="space-y-4">
              {subscriptions.map((product) => (
                <Card key={product.id} className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">
                          {product.productName}
                        </h3>
                        <p className="text-slate-600">{product.package} Plan</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(product.status)}
                        <p className="text-lg font-bold text-slate-900 mt-1">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-slate-600">Start Date</p>
                        <p className="font-medium">
                          {formatDate(product.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">End Date</p>
                        <p className="font-medium">
                          {formatDate(product.endDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Duration</p>
                        <p className="font-medium">{product.duration} months</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      {product.status === "active" && (
                        <>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="h-4 w-4" />
                            {getDaysUntilExpiry(product.endDate)} days remaining
                          </div>
                          <div className="flex gap-2">
                            <Button
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() =>
                                window.open(product.appUrl, "_blank")
                              }
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Open App
                            </Button>
                            <Button variant="outline">
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Renew
                            </Button>
                            <Button variant="outline">
                              <ArrowUpCircle className="h-4 w-4 mr-2" />
                              Upgrade
                            </Button>
                          </div>
                        </>
                      )}

                      {product.status === "expired" && (
                        <>
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            Subscription expired
                          </div>
                          <div className="flex gap-2">
                            <Button className="bg-blue-600 hover:bg-blue-700">
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Renew
                            </Button>
                            <Button variant="outline">
                              <ArrowUpCircle className="h-4 w-4 mr-2" />
                              Upgrade
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Billing & Invoices
              </h2>
              <p className="text-slate-600">
                View and download your invoices and payment history.
              </p>
            </div>

            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg">
                          <FileText className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {invoice.id}
                          </p>
                          <p className="text-sm text-slate-600">
                            {invoice.product} - {invoice.package}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatDate(invoice.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">
                          {formatPrice(invoice.amount)}
                        </p>
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
          </div>
        );

      case "renewal":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Renewal & Upgrade
              </h2>
              <p className="text-slate-600">
                Renew your subscriptions or upgrade to higher plans.
              </p>
            </div>

            <div className="space-y-4">
              {subscriptions.map((product) => (
                <Card key={product.id} className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {product.productName}
                        </h3>
                        <p className="text-slate-600">{product.package} Plan</p>
                        <p className="text-sm text-slate-500 mt-1">
                          {product.status === "active"
                            ? `Expires: ${formatDate(product.endDate)}`
                            : `Expired: ${formatDate(product.endDate)}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Renew
                        </Button>
                        <Button variant="outline">
                          <ArrowUpCircle className="h-4 w-4 mr-2" />
                          Upgrade Package
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Profile & Account Settings
              </h2>
              <p className="text-slate-600">
                Manage your personal information and account preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone/WhatsApp</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Enter your company name.. (optional)"
                    />
                  </div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                    disabled={savingProfile}
                    onClick={onSaveProfile}
                  >
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>

              {/* Security & Notifications */}
              <div className="space-y-6">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>Security</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full bg-transparent">
                      <Shield className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-slate-600">
                          Receive updates via email
                        </p>
                      </div>
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({
                            ...prev,
                            email: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">WhatsApp Notifications</p>
                        <p className="text-sm text-slate-600">
                          Receive updates via WhatsApp
                        </p>
                      </div>
                      <Switch
                        checked={notifications.whatsapp}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({
                            ...prev,
                            whatsapp: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Renewal Reminders</p>
                        <p className="text-sm text-slate-600">
                          Get notified before expiry
                        </p>
                      </div>
                      <Switch
                        checked={notifications.renewal}
                        onCheckedChange={(checked) =>
                          setNotifications((prev) => ({
                            ...prev,
                            renewal: checked,
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case "support":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Support & Help Center
              </h2>
              <p className="text-slate-600">
                Get help and find answers to common questions.
              </p>
            </div>

            {/* Contact Support */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent"
                  >
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                    <span className="font-medium">Live Chat</span>
                    <span className="text-sm text-slate-600">
                      Available 24/7
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent"
                  >
                    <Mail className="h-6 w-6 text-green-600" />
                    <span className="font-medium">Email Support</span>
                    <span className="text-sm text-slate-600">
                      support@agilestore.com
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent"
                  >
                    <Phone className="h-6 w-6 text-purple-600" />
                    <span className="font-medium">Phone Support</span>
                    <span className="text-sm text-slate-600">
                      +62 812 3456 7890
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqData.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-600">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* User Guide */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    User Guide & Documentation
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Video Tutorials
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Community Forum
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Agile Store
            </h1>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">My Account</span>
          </div>
          <Button
            variant="ghost"
            className="text-slate-600 cursor-pointer"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-md sticky top-8">
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() =>
                          setActiveSection(item.id as ActiveSection)
                        }
                        className={`w-full cursor-pointer flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          activeSection === item.id
                            ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">{renderContent()}</div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2">
        <div className="flex justify-around">
          {sidebarItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as ActiveSection)}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">
                  {item.label.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
