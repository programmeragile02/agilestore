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
  fetchMyProducts,
  type MyProductsItem,
  type MyProductsResponse,
  fetchCustomerInvoices,
  type InvoiceItem,
  createRenewOrder,
  createUpgradeOrder,
  fetchSubscriptions,
  SubscriptionsItem,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { ensureSnap, openSnap } from "@/lib/midtrans";
import RenewModal from "@/components/billing/RenewModal";
import UpgradeModal from "@/components/billing/UpgradeModal";
import AddonModal from "@/components/billing/AddonModal";
import { createAddonOrder } from "@/lib/api";
import {
  changeCustomerPassword,
  forgotCustomerPassword,
  resetCustomerPassword,
} from "@/lib/api";
import ChangePasswordDialog from "@/components/account/ChangePasswordDialog";
import ResetPasswordDialog from "@/components/account/ResetPasswordDialog";

// context saat buka modal
type ModalCtx = {
  productCode: string;
  packageCode: string;
  durationCode?: string;
  baseOrderId: string; // <— ini yang wajib dikirim ke BE
};

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

  // subscription / order yang dibayar / product active
  const [subsLoading, setSubsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<SubscriptionsItem[]>([]);
  // pagination product
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [meta, setMeta] = useState<{
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  } | null>(null);

  // Invoices
  const [invLoading, setInvLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [invPage, setInvPage] = useState(1);
  const [invPerPage, setInvPerPage] = useState(5);
  const [invMeta, setInvMeta] = useState<{
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  } | null>(null);

  const [activeSection, setActiveSection] =
    useState<ActiveSection>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    whatsapp: true,
    renewal: true,
    updates: false,
  });

  // renew dan upgrade modal
  const [renewOpen, setRenewOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<SubscriptionsItem | null>(
    null
  );
  const [ctx, setCtx] = useState<ModalCtx | null>(null);
  const [processing, setProcessing] = useState(false);

  // Add On Modal
  const [addonOpen, setAddonOpen] = useState(false);
  const [addonCtx, setAddonCtx] = useState<{
    productCode: string;
    packageCode: string;
    subscriptionInstanceId?: string | null;
  } | null>(null);

  // forgot & reset password
  const [pwdOpen, setPwdOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [securityBusy, setSecurityBusy] = useState(false);
  const [debugToken, setDebugToken] = useState<string | null>(null); // hanya untuk dev (BE kirim debug_plain_token)

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

  // Fetch subscription (setelah login OK)
  useEffect(() => {
    if (!user) return;
    const loadSubs = async () => {
      try {
        setSubsLoading(true);
        const res = await fetchSubscriptions({ page, per_page: perPage }); // atau {active:1} bila hanya aktif
        setSubscriptions(res.items);
        setMeta(res.meta);
      } catch (e) {
        console.error(e);
        setSubscriptions([]);
        setMeta({ current_page: 1, per_page: perPage, total: 0, last_page: 1 });
      } finally {
        setSubsLoading(false);
      }
    };
    loadSubs();
  }, [user, page, perPage]);

  useEffect(() => {
    if (!user) return;
    const loadInvoices = async () => {
      try {
        setInvLoading(true);
        const res = await fetchCustomerInvoices({
          page: invPage,
          per_page: invPerPage,
        }); // optional: status: 'paid'
        setInvoices(res.items);
        setInvMeta(res.meta);
      } catch (e) {
        console.error(e);
        setInvoices([]);
        setInvMeta({
          current_page: 1,
          per_page: invPerPage,
          total: 0,
          last_page: 1,
        });
      } finally {
        setInvLoading(false);
      }
    };
    loadInvoices();
  }, [user, invPage, invPerPage]);

  // reset perpage ketika user berubah atau logout
  useEffect(() => {
    if (!user) {
      setPage(1);
      setInvPage(1);
    }
  }, [user]);

  // komponen pagination
  function Pagination({
    meta,
    onPageChange,
  }: {
    meta: { current_page: number; last_page: number } | null;
    onPageChange: (p: number) => void;
  }) {
    if (!meta || meta.last_page <= 1) return null;
    const { current_page, last_page } = meta;

    const pages: number[] = [];
    const start = Math.max(1, current_page - 2);
    const end = Math.min(last_page, current_page + 2);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="flex items-center justify-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          disabled={current_page <= 1}
          onClick={() => onPageChange(current_page - 1)}
        >
          Prev
        </Button>

        {start > 1 && (
          <>
            <Button variant="outline" size="sm" onClick={() => onPageChange(1)}>
              1
            </Button>
            {start > 2 && <span className="px-1 text-slate-500">…</span>}
          </>
        )}

        {pages.map((p) => (
          <Button
            key={p}
            variant={p === current_page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}

        {end < last_page && (
          <>
            {end < last_page - 1 && (
              <span className="px-1 text-slate-500">…</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(last_page)}
            >
              {last_page}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="sm"
          disabled={current_page >= last_page}
          onClick={() => onPageChange(current_page + 1)}
        >
          Next
        </Button>
      </div>
    );
  }

  // summary card skeleton
  function SummaryCardSkeleton() {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-lg bg-slate-200" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-10 bg-slate-200" />
              <Skeleton className="h-4 w-24 bg-slate-200" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // skeleton mini product (dashboard)
  function MiniProductSkeleton() {
    return (
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-slate-200" />
          <Skeleton className="h-3 w-20 bg-slate-200" />
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-5 w-16 bg-slate-200" />
          <Skeleton className="h-3 w-24 bg-slate-200" />
        </div>
      </div>
    );
  }

  // skeleton loading my product
  function ProductCardSkeleton() {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 bg-slate-200" />
              <Skeleton className="h-4 w-24 bg-slate-200" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="h-6 w-16 bg-slate-200" />
              <Skeleton className="h-5 w-24 bg-slate-200" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-10 bg-slate-200" />
            <Skeleton className="h-10 bg-slate-200" />
            <Skeleton className="h-10 bg-slate-200" />
          </div>
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <Skeleton className="h-5 w-40 bg-slate-200" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28 bg-slate-200" />
              <Skeleton className="h-9 w-24 bg-slate-200" />
              <Skeleton className="h-9 w-24 bg-slate-200" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // skeleton invoice
  function InvoiceItemSkeleton() {
    return (
      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-200" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40 bg-slate-200" />
            <Skeleton className="h-3 w-56 bg-slate-200" />
            <Skeleton className="h-3 w-28 bg-slate-200" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-5 w-24 bg-slate-200 ml-auto" />
          <div className="flex items-center gap-2 justify-end">
            <Skeleton className="h-6 w-14 bg-slate-200" />
            <Skeleton className="h-8 w-8 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  // helpers format
  const formatPrice = (price: number) =>
    `IDR ${Number(price || 0).toLocaleString("id-ID")}`;
  const formatDate = (dateString?: string | null) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "-";

  const getDaysUntilExpiry = (endDate?: string | null) => {
    if (!endDate) return 0;
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Status badge untuk produk: gunakan is_currently_active
  const getStatusBadge = (isActiveNow: boolean) =>
    isActiveNow ? (
      <Badge className="bg-green-500 text-white">Active</Badge>
    ) : (
      <Badge className="bg-red-500 text-white">Expired</Badge>
    );

  // Data untuk summary
  const activeProducts = subscriptions.filter((s) => s.is_currently_active);
  const nextRenewal =
    activeProducts.length > 0
      ? Math.min(
          ...activeProducts
            .map((s) => getDaysUntilExpiry(s.end_date))
            .filter((n) => Number.isFinite(n))
        )
      : 0;
  const outstandingInvoices = invoices.filter(
    (i) => i.status === "pending"
  ).length;

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500 text-white">PAID</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 text-white">PENDING</Badge>;
      case "failed":
        return <Badge className="bg-red-500 text-white">FAILED</Badge>;
      case "expired":
        return <Badge className="bg-slate-500 text-white">EXPIRED</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // format intent
  function formatIntent(intent?: string): string {
    if (!intent) return "";

    const map: Record<string, string> = {
      renew: "Renewal",
      upgrade: "Upgrade Package",
      purchase: "Purchase",
    };

    return (
      map[intent.toLowerCase()] ??
      intent.charAt(0).toUpperCase() + intent.slice(1)
    );
  }

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "products", label: "My Products", icon: Package },
    { id: "billing", label: "Billing & Invoices", icon: CreditCard },
    { id: "renewal", label: "Renewal & Upgrade", icon: RefreshCw },
    { id: "profile", label: "Profile & Account Settings", icon: User },
    { id: "support", label: "Support & Help Center", icon: HelpCircle },
  ];

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

  // HANDLER MODAL
  const openRenewFor = (sub: SubscriptionsItem) => {
    setSelectedSub(sub);
    setCtx({
      productCode: sub.product.code,
      packageCode: sub.package.code, // renew: paket terkunci
      durationCode: sub.duration.code, // preselect durasi lama kalau ada
      baseOrderId: sub.meta?.last_paid_order_id || "", // <— PENTING
    });
    setUpgradeOpen(false);
    setRenewOpen(true);
  };

  const openUpgradeFor = (sub: SubscriptionsItem) => {
    setSelectedSub(sub);
    setCtx({
      productCode: sub.product.code,
      packageCode: sub.package.code, // upgrade: bisa diganti di modal
      durationCode: sub.duration.code,
      baseOrderId: sub.meta?.last_paid_order_id || "", // <— PENTING
    });
    setRenewOpen(false);
    setUpgradeOpen(true);
  };

  const openAddonFor = (sub: SubscriptionsItem) => {
    setSelectedSub(sub);
    setAddonCtx({
      productCode: sub.product.code,
      packageCode: sub.package.code,
      subscriptionInstanceId: sub.meta?.subscription_instance_id || undefined, // kalau BE isi meta ini
    });
    setAddonOpen(true);
    setRenewOpen(false);
    setUpgradeOpen(false);
  };

  const handleConfirmRenew = async ({
    duration_code,
  }: {
    duration_code: string;
  }) => {
    if (!selectedSub) return;
    if (!ctx) return;

    // Guard biar pasti string semua
    const { productCode, packageCode, baseOrderId } = ctx;
    if (!productCode || !packageCode || !baseOrderId || !duration_code) {
      toast({
        variant: "destructive",
        title: "Data belum lengkap",
        description: "Produk/paket/durasi/base order belum terisi.",
      });
      return;
    }

    setProcessing(true);
    try {
      // Panggil backend bikin order renew
      const res = await createRenewOrder({
        product_code: productCode,
        package_code: packageCode,
        duration_code,
        base_order_id: baseOrderId,
      });
      await ensureSnap();
      openSnap(res.snap_token, res.order_id);
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Gagal membuat order renew",
        description: String(e?.message ?? "Unknown error"),
      });
    } finally {
      setProcessing(false);
      setRenewOpen(false);
    }
  };

  const handleConfirmUpgrade = async ({
    package_code,
    duration_code,
  }: {
    package_code: string;
    duration_code: string;
  }) => {
    if (!selectedSub) return;
    if (!ctx) return;

    const { productCode, baseOrderId } = ctx;
    if (!productCode || !package_code || !duration_code || !baseOrderId) {
      toast({
        variant: "destructive",
        title: "Data belum lengkap",
        description: "Produk/paket/durasi/base order belum terisi.",
      });
      return;
    }

    setProcessing(true);
    try {
      // Panggil backend bikin order upgrade (in_place)
      const res = await createUpgradeOrder({
        product_code: productCode,
        package_code,
        duration_code,
        base_order_id: baseOrderId,
      });
      await ensureSnap();
      openSnap(res.snap_token, res.order_id);
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Gagal membuat order upgrade",
        description: String(e?.message ?? "Unknown error"),
      });
    } finally {
      setProcessing(false);
      setUpgradeOpen(false);
    }
  };

  // handle reset & forgot password
  const onChangePassword = async (p: {
    current_password: string;
    new_password: string;
  }) => {
    setSecurityBusy(true);
    try {
      await changeCustomerPassword(p);
      toast({ title: "Password updated" });
      setPwdOpen(false);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Change password failed",
        description: String(e?.message ?? "Unknown error"),
      });
    } finally {
      setSecurityBusy(false);
    }
  };

  const onAskResetLink = async () => {
    if (!email) return;
    setSecurityBusy(true);
    try {
      const res: any = await forgotCustomerPassword(email);
      // Backend kamu saat ini mengembalikan debug_plain_token untuk dev.
      setDebugToken(res?.debug_plain_token ?? null);
      toast({
        title: "Reset email sent",
        description: "Check your inbox for the token.",
      });
      setResetOpen(true);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed to send reset email",
        description: String(e?.message ?? "Unknown error"),
      });
    } finally {
      setSecurityBusy(false);
    }
  };

  const onSubmitReset = async ({
    token,
    new_password,
  }: {
    token: string;
    new_password: string;
  }) => {
    if (!email) return;
    setSecurityBusy(true);
    try {
      await resetCustomerPassword({ email, token, new_password });
      toast({ title: "Password reset successful" });
      setResetOpen(false);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: String(e?.message ?? "Invalid token or other error"),
      });
    } finally {
      setSecurityBusy(false);
    }
  };

  // ===== Loading skeleton untuk seluruh halaman =====
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header skeleton */}
        <div className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-7 w-32 rounded bg-slate-200" />
              <span className="text-slate-300">|</span>
              <div className="h-5 w-24 rounded bg-slate-200" />
            </div>
            <div className="h-9 w-24 rounded-md bg-slate-200" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar: hanya “nama” menu sebagai skeleton */}
          <div className="lg:col-span-1">
            <div className="border-0 shadow-md rounded-xl bg-white p-3 space-y-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg"
                >
                  <div className="h-5 w-5 rounded bg-slate-200" />
                  <div className="h-4 w-40 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>

          {/* Main: judul + 3 summary cards + mini list */}
          <div className="lg:col-span-3 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <div className="h-7 w-72 rounded bg-slate-200" />
              <div className="h-4 w-64 rounded bg-slate-200" />
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="border-0 shadow-md rounded-xl bg-white p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-200" />
                    <div className="space-y-2">
                      <div className="h-6 w-10 rounded bg-slate-200" />
                      <div className="h-4 w-28 rounded bg-slate-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Products mini list */}
            <div className="border-0 shadow-md rounded-xl bg-white">
              <div className="p-6 space-y-4">
                <div className="h-5 w-36 rounded bg-slate-200" />
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  >
                    <div className="space-y-2">
                      <div className="h-4 w-40 rounded bg-slate-200" />
                      <div className="h-3 w-28 rounded bg-slate-200" />
                    </div>
                    <div className="text-right space-y-2">
                      <div className="h-5 w-16 rounded bg-slate-200" />
                      <div className="h-3 w-32 rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
              {subsLoading ? (
                <>
                  <SummaryCardSkeleton />
                  <SummaryCardSkeleton />
                  <SummaryCardSkeleton />
                </>
              ) : (
                <>
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
                          <p className="text-sm text-slate-600">
                            Active Products
                          </p>
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
                </>
              )}
            </div>

            {/* Active Products Mini List */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Active Products</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subsLoading && (
                  <>
                    <MiniProductSkeleton />
                  </>
                )}
                {!subsLoading && activeProducts.length === 0 && (
                  <p className="text-slate-600 text-center py-4">
                    No active products
                  </p>
                )}
                {!subsLoading &&
                  activeProducts.map((p) => (
                    <div
                      key={p.subscription_id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          {p.product.name || p.product.code}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {p.package.name || p.package.code} Plan
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(true)}
                        <p className="text-sm text-slate-600 mt-1">
                          Expires: {formatDate(p.end_date)}
                        </p>
                      </div>
                    </div>
                  ))}
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
              {subsLoading && (
                <>
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                </>
              )}

              {!subsLoading && subscriptions.length === 0 && (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-6 text-center text-slate-600">
                    You have no paid products yet.
                  </CardContent>
                </Card>
              )}

              {!subsLoading &&
                subscriptions.map((p) => {
                  const isActiveNow = p.is_currently_active;
                  const remaining = getDaysUntilExpiry(p.end_date);
                  const durationLabel = p.duration.name || p.duration.code; // ex: "12 Bulan"
                  const packageLabel = p.package.name || p.package.code;
                  const productLabel = p.product.name || p.product.code;

                  return (
                    <Card
                      key={p.subscription_id}
                      className="border-0 shadow-md"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-slate-900">
                              {productLabel}
                            </h3>
                            <p className="text-slate-600">
                              {packageLabel} Plan
                            </p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(isActiveNow)}
                            {/* <p className="text-lg font-bold text-slate-900 mt-1">
                              {formatPrice(p.total)}
                            </p> */}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-slate-600">Start Date</p>
                            <p className="font-medium">
                              {formatDate(p.start_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">End Date</p>
                            <p className="font-medium">
                              {formatDate(p.end_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Duration</p>
                            <p className="font-medium">{durationLabel}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                          {isActiveNow ? (
                            <>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Clock className="h-4 w-4" />
                                {remaining >= 0
                                  ? `${remaining} days remaining`
                                  : `${remaining} days remaining`}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={() => {
                                    // TODO: open actual app URL jika ada di product metadata
                                    // sementara: buka dashboard umum
                                    window.open("/my-account", "_blank");
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open App
                                </Button>
                                {/* <Button
                                  variant="outline"
                                  onClick={() => openRenewFor(p)}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Renew
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => openUpgradeFor(p)}
                                >
                                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                                  Upgrade
                                </Button> */}
                              </div>
                            </>
                          ) : (
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
                  );
                })}

              {/* Pagination */}
              <Pagination
                meta={meta}
                onPageChange={(p) => {
                  if (!meta) return;
                  if (p >= 1 && p <= meta.last_page) setPage(p);
                }}
              />
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
                  {invLoading && (
                    <>
                      <InvoiceItemSkeleton />
                      <InvoiceItemSkeleton />
                      <InvoiceItemSkeleton />
                    </>
                  )}

                  {!invLoading && invoices.length === 0 && (
                    <div className="text-center text-slate-600 py-6">
                      No invoices found.
                    </div>
                  )}

                  {!invLoading &&
                    invoices.map((invoice) => (
                      <div
                        key={invoice.order_id}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg">
                            <FileText className="h-5 w-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {invoice.midtrans_order_id}
                            </p>
                            <p className="text-sm text-slate-600">
                              {invoice.product_name}
                              {invoice.intent === "renew" ? (
                                <span className="text-sm text-slate-600">
                                  {" "}
                                  - {invoice.package_name} - Extended until{" "}
                                  {formatDate(invoice.end_date)}
                                </span>
                              ) : invoice.intent === "upgrade" ? (
                                <span className="text-sm text-slate-600">
                                  {" "}
                                  - Upgraded to {invoice.package_name}
                                </span>
                              ) : (
                                <span> - {invoice.package_name}</span>
                              )}
                            </p>
                            <p className="text-sm text-slate-500">
                              {formatDate(invoice.date)}
                            </p>
                            <Badge className="bg-indigo-500">
                              {formatIntent(invoice.intent)}
                            </Badge>
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
                  {/* Pagination */}
                  <Pagination
                    meta={invMeta}
                    onPageChange={(p) => {
                      if (!invMeta) return;
                      if (p >= 1 && p <= invMeta.last_page) setInvPage(p);
                    }}
                  />
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
              {!subsLoading &&
                subscriptions.map((p) => {
                  const isActiveNow = p.is_currently_active;
                  const remaining = getDaysUntilExpiry(p.end_date);
                  const durationLabel = p.duration.name || p.duration.code; // ex: "12 Bulan"
                  const packageLabel = p.package.name || p.package.code;
                  const productLabel = p.product.name || p.product.code;

                  return (
                    <Card
                      key={p.subscription_id}
                      className="border-0 shadow-md"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                              {productLabel}
                            </h3>
                            <p className="text-slate-600">
                              {packageLabel} Plan
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                              {isActiveNow
                                ? `Expires: ${formatDate(p.end_date)}`
                                : `Expired: ${formatDate(p.end_date)}`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => openAddonFor(p)}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Add-ons
                            </Button>
                            <Button
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => openRenewFor(p)}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Renew
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => openUpgradeFor(p)}
                            >
                              <ArrowUpCircle className="h-4 w-4 mr-2" />
                              Upgrade Package
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => setPwdOpen(true)}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">Forgot your password?</p>
                        <p className="text-sm text-slate-600">
                          Send a reset token to your email and set a new one.
                        </p>
                      </div>
                      <Button
                        onClick={onAskResetLink}
                        disabled={securityBusy}
                        className="cursor-pointer"
                      >
                        Send Reset Email
                      </Button>
                    </div>
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

      {/* ====== MODAL AREA (Renew/Upgrade/Add-on tergantung selectedSub) ====== */}
      {selectedSub && (
        <>
          {ctx && (
            <RenewModal
              open={renewOpen}
              onOpenChange={(v) => {
                // pastikan hanya satu modal aktif
                setRenewOpen(v);
                if (v) setUpgradeOpen(false);
                if (!v) setSelectedSub((cur) => (upgradeOpen ? cur : cur)); // biarkan selectedSub tetap, atau bisa di-null-kan jika mau
              }}
              productCode={ctx?.productCode || ""}
              packageCode={ctx?.packageCode || ""}
              currentDurationCode={ctx?.durationCode}
              onConfirm={handleConfirmRenew}
              loading={processing}
            />
          )}

          {ctx && (
            <UpgradeModal
              open={upgradeOpen}
              onOpenChange={(v) => {
                setUpgradeOpen(v);
                if (v) setRenewOpen(false);
              }}
              productCode={ctx?.productCode || ""}
              currentPackageCode={ctx?.packageCode || ""}
              currentDurationCode={ctx?.durationCode}
              onConfirm={handleConfirmUpgrade}
              loading={processing}
            />
          )}

          {selectedSub && addonCtx && (
            <AddonModal
              open={addonOpen}
              onOpenChange={(v) => setAddonOpen(v)}
              productCode={addonCtx.productCode}
              packageCode={addonCtx.packageCode}
              subscriptionInstanceId={addonCtx.subscriptionInstanceId}
            />
          )}
        </>
      )}

      {/* ====== SECURITY DIALOGS: harus SELALU dirender ====== */}
      <ChangePasswordDialog
        open={pwdOpen}
        onOpenChange={setPwdOpen}
        onSubmit={onChangePassword}
        loading={securityBusy}
      />

      <ResetPasswordDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        onSubmit={onSubmitReset}
        loading={securityBusy}
        email={email}
        debugHint={debugToken} // opsional dev
        onResend={async () => {
          // aktifkan tombol Resend
          await forgotCustomerPassword(email);
        }}
      />x
    </div>
  );
}
