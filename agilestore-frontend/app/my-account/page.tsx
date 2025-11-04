"use client";

import { useEffect, useState, useMemo } from "react";
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
  User as UserIcon,
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
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCustomerMe,
  logoutCustomer,
  updateCustomerProfile,
  type CustomerUser,
  fetchCustomerInvoices,
  type InvoiceItem,
  fetchSubscriptions,
  type SubscriptionsItem,
  downloadInvoice,
  createRenewOrder,
  createUpgradeOrder,
  AgileStoreAPI,
} from "@/lib/api";
import { createAddonOrder } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { ensureSnap, openSnap } from "@/lib/midtrans";
import RenewModal from "@/components/billing/RenewModal";
import UpgradeModal from "@/components/billing/UpgradeModal";
import AddonModal from "@/components/billing/AddonModal";
import {
  changeCustomerPassword,
  forgotCustomerPassword,
  resetCustomerPassword,
} from "@/lib/api";
import ChangePasswordDialog from "@/components/account/ChangePasswordDialog";
import ResetPasswordDialog from "@/components/account/ResetPasswordDialog";
import { useLanguage } from "@/components/LanguageProvider";

/* =========================================================================
   I18N LOCAL DICTIONARY (EN & ID)
   -------------------------------------------------------------------------
   - Semua teks UI dipetakan ke kunci.
   - Tidak ambil dari backend; aman untuk SSR/CSR karena LanguageProvider
     sudah meng-handle persist (cookie/localStorage + event).
=========================================================================== */

type Lang = "en" | "id";

type Keys =
  | "brand"
  | "pageTitle"
  | "logout"
  | "sidebar.dashboard"
  | "sidebar.products"
  | "sidebar.billing"
  | "sidebar.renewal"
  | "sidebar.profile"
  | "sidebar.support"
  | "welcome"
  | "overview"
  | "summary.activeProducts"
  | "summary.daysUntilRenewal"
  | "summary.outstandingInvoice"
  | "activeProducts.title"
  | "activeProducts.empty"
  | "status.active"
  | "status.expired"
  | "expires"
  | "startDate"
  | "endDate"
  | "duration"
  | "daysRemaining"
  | "openApp"
  | "renew"
  | "upgrade"
  | "products.title"
  | "products.subtitle"
  | "products.empty"
  | "billing.title"
  | "billing.subtitle"
  | "billing.empty"
  | "downloadInvoice"
  | "intent.renew"
  | "intent.upgrade"
  | "intent.purchase"
  | "renewal.title"
  | "renewal.subtitle"
  | "profile.title"
  | "profile.subtitle"
  | "profile.personalInformation"
  | "profile.fullName"
  | "profile.email"
  | "profile.phone"
  | "profile.company"
  | "profile.companyPlaceholder"
  | "profile.save"
  | "profile.saving"
  | "security.title"
  | "security.changePassword"
  | "security.forgotTitle"
  | "security.forgotDesc"
  | "security.sendReset"
  | "security.sending"
  | "support.title"
  | "support.subtitle"
  | "support.contact"
  | "support.livechat"
  | "support.livechatAvail"
  | "support.email"
  | "support.phone"
  | "support.faq"
  | "support.resources"
  | "resources.userGuide"
  | "resources.videos"
  | "resources.forum"
  | "pagination.prev"
  | "pagination.next"
  | "label.plan"
  | "label.expires"
  | "label.expired"
  | "payment.paid"
  | "payment.pending"
  | "payment.failed"
  | "payment.expired"
  | "toast.saved"
  | "toast.savedDesc"
  | "toast.saveFail"
  | "toast.signout"
  | "toast.signoutDesc"
  | "toast.tokenSent"
  | "toast.tokenSentDesc"
  | "toast.resetSuccess"
  | "toast.resetFail"
  | "toast.invoiceCant"
  | "toast.invoiceNoOrder"
  | "toast.invoiceFail"
  | "modal.dataMissing"
  | "modal.dataMissingDesc";

export const I18N: Record<Lang, Record<Keys, string>> = {
  en: {
    brand: "Agile Store",
    pageTitle: "My Account",
    logout: "Logout",
    "sidebar.dashboard": "Dashboard",
    "sidebar.products": "My Products",
    "sidebar.billing": "Billing & Invoices",
    "sidebar.renewal": "Renewal & Upgrade",
    "sidebar.profile": "Profile & Account Settings",
    "sidebar.support": "Support & Help Center",
    welcome: "Welcome back",
    overview: "Here's an overview of your account and subscriptions.",
    "summary.activeProducts": "Active Products",
    "summary.daysUntilRenewal": "Days Until Renewal",
    "summary.outstandingInvoice": "Outstanding Invoice",
    "activeProducts.title": "Active Products",
    "activeProducts.empty": "No active products",
    "status.active": "Active",
    "status.expired": "Expired",
    expires: "Expires",
    startDate: "Start Date",
    endDate: "End Date",
    duration: "Duration",
    daysRemaining: "days remaining",
    openApp: "Open App",
    renew: "Renew",
    upgrade: "Upgrade",
    "products.title": "My Products",
    "products.subtitle": "Manage and access your purchased products.",
    "products.empty": "You have no paid products yet.",
    "billing.title": "Billing & Invoices",
    "billing.subtitle": "View and download your invoices and payment history.",
    "billing.empty": "No invoices found.",
    downloadInvoice: "Download Invoice (PDF)",
    "intent.renew": "Renewal",
    "intent.upgrade": "Upgrade Package",
    "intent.purchase": "Purchase",
    "renewal.title": "Renewal & Upgrade",
    "renewal.subtitle": "Renew your subscriptions or upgrade to higher plans.",
    "profile.title": "Profile & Account Settings",
    "profile.subtitle":
      "Manage your personal information and account preferences.",
    "profile.personalInformation": "Personal Information",
    "profile.fullName": "Full Name",
    "profile.email": "Email Address",
    "profile.phone": "Phone/WhatsApp",
    "profile.company": "Company",
    "profile.companyPlaceholder": "Enter your company name.. (optional)",
    "profile.save": "Save Changes",
    "profile.saving": "Saving...",
    "security.title": "Security",
    "security.changePassword": "Change Password",
    "security.forgotTitle": "Forgot your password?",
    "security.forgotDesc":
      "Send a reset token to your email and set a new one.",
    "security.sendReset": "Send Reset Email",
    "security.sending": "Sending...",
    "support.title": "Support & Help Center",
    "support.subtitle": "Get help and find answers to common questions.",
    "support.contact": "Contact Support",
    "support.livechat": "Live Chat",
    "support.livechatAvail": "Available 24/7",
    "support.email": "Email Support",
    "support.phone": "Phone Support",
    "support.faq": "Frequently Asked Questions",
    "support.resources": "Resources",
    "resources.userGuide": "User Guide & Documentation",
    "resources.videos": "Video Tutorials",
    "resources.forum": "Community Forum",
    "pagination.prev": "Prev",
    "pagination.next": "Next",
    "label.plan": "Plan",
    "label.expires": "Expires",
    "label.expired": "Expired",
    "payment.paid": "PAID",
    "payment.pending": "PENDING",
    "payment.failed": "FAILED",
    "payment.expired": "EXPIRED",
    "toast.saved": "Saved",
    "toast.savedDesc": "Profile updated successfully.",
    "toast.saveFail": "Failed to save",
    "toast.signout": "Signed out",
    "toast.signoutDesc": "See you again!",
    "toast.tokenSent": "Reset email sent",
    "toast.tokenSentDesc": "Check your inbox for the code.",
    "toast.resetSuccess": "Password reset successful",
    "toast.resetFail": "Reset failed",
    "toast.invoiceCant": "Cannot download",
    "toast.invoiceNoOrder": "Order ID not found for this invoice.",
    "toast.invoiceFail": "Failed to download invoice",
    "modal.dataMissing": "Incomplete data",
    "modal.dataMissingDesc": "Product/Package/Duration/Base order is missing.",
  },

  id: {
    brand: "Agile Store",
    pageTitle: "Akun Saya",
    logout: "Keluar",
    "sidebar.dashboard": "Dasbor",
    "sidebar.products": "Produk Saya",
    "sidebar.billing": "Tagihan & Invoice",
    "sidebar.renewal": "Perpanjang & Upgrade",
    "sidebar.profile": "Profil & Pengaturan Akun",
    "sidebar.support": "Bantuan & Pusat Dukungan",
    welcome: "Selamat datang kembali",
    overview: "Ringkasan akun dan langganan Anda.",
    "summary.activeProducts": "Produk Aktif",
    "summary.daysUntilRenewal": "Hari Menuju Perpanjangan",
    "summary.outstandingInvoice": "Invoice Tertunda",
    "activeProducts.title": "Produk Aktif",
    "activeProducts.empty": "Belum ada produk aktif",
    "status.active": "Aktif",
    "status.expired": "Kedaluwarsa",
    expires: "Berakhir",
    startDate: "Tanggal Mulai",
    endDate: "Tanggal Berakhir",
    duration: "Durasi",
    daysRemaining: "hari tersisa",
    openApp: "Buka Aplikasi",
    renew: "Perpanjang",
    upgrade: "Upgrade",
    "products.title": "Produk Saya",
    "products.subtitle": "Kelola dan akses produk yang telah Anda beli.",
    "products.empty": "Anda belum memiliki produk berbayar.",
    "billing.title": "Tagihan & Invoice",
    "billing.subtitle": "Lihat dan unduh invoice serta riwayat pembayaran.",
    "billing.empty": "Tidak ada invoice.",
    downloadInvoice: "Unduh Invoice (PDF)",
    "intent.renew": "Perpanjangan",
    "intent.upgrade": "Upgrade Paket",
    "intent.purchase": "Pembelian",
    "renewal.title": "Perpanjang & Upgrade",
    "renewal.subtitle":
      "Perpanjang langganan atau upgrade ke paket lebih tinggi.",
    "profile.title": "Profil & Pengaturan Akun",
    "profile.subtitle": "Kelola data pribadi dan preferensi akun Anda.",
    "profile.personalInformation": "Informasi Pribadi",
    "profile.fullName": "Nama Lengkap",
    "profile.email": "Alamat Email",
    "profile.phone": "Telepon/WhatsApp",
    "profile.company": "Perusahaan",
    "profile.companyPlaceholder": "Masukkan nama perusahaan.. (opsional)",
    "profile.save": "Simpan Perubahan",
    "profile.saving": "Menyimpan...",
    "security.title": "Keamanan",
    "security.changePassword": "Ubah Password",
    "security.forgotTitle": "Lupa password?",
    "security.forgotDesc": "Kirim token reset ke email, lalu setel ulang.",
    "security.sendReset": "Kirim Email Reset",
    "security.sending": "Mengirim...",
    "support.title": "Bantuan & Pusat Dukungan",
    "support.subtitle": "Dapatkan bantuan dan jawaban atas pertanyaan umum.",
    "support.contact": "Kontak Dukungan",
    "support.livechat": "Live Chat",
    "support.livechatAvail": "Tersedia 24/7",
    "support.email": "Email Dukungan",
    "support.phone": "Telepon Dukungan",
    "support.faq": "Pertanyaan yang Sering Diajukan",
    "support.resources": "Sumber Daya",
    "resources.userGuide": "Panduan & Dokumentasi",
    "resources.videos": "Video Tutorial",
    "resources.forum": "Forum Komunitas",
    "pagination.prev": "Sebelumnya",
    "pagination.next": "Berikutnya",
    "label.plan": "Paket",
    "label.expires": "Berakhir",
    "label.expired": "Kedaluwarsa",
    "payment.paid": "LUNAS",
    "payment.pending": "MENUNGGU",
    "payment.failed": "GAGAL",
    "payment.expired": "KEDALUWARSA",
    "toast.saved": "Tersimpan",
    "toast.savedDesc": "Profil berhasil diperbarui.",
    "toast.saveFail": "Gagal menyimpan",
    "toast.signout": "Keluar",
    "toast.signoutDesc": "Sampai jumpa lagi!",
    "toast.tokenSent": "Email reset terkirim",
    "toast.tokenSentDesc": "Cek kotak masuk untuk kodenya.",
    "toast.resetSuccess": "Reset password berhasil",
    "toast.resetFail": "Gagal reset",
    "toast.invoiceCant": "Tidak bisa unduh",
    "toast.invoiceNoOrder": "Order ID tidak ditemukan pada invoice ini.",
    "toast.invoiceFail": "Gagal mengunduh invoice",
    "modal.dataMissing": "Data belum lengkap",
    "modal.dataMissingDesc": "Produk/Paket/Durasi/Base order belum terisi.",
  },
};

// helper hook t()
function useT() {
  const { lang } = useLanguage();
  const L = (lang ?? "id") as Lang;
  const t = (k: Keys) => I18N[L][k];
  return { t, lang: L };
}

/* ============================== TYPES =============================== */

type ModalCtx = {
  productCode: string;
  packageCode: string;
  durationCode?: string;
  baseOrderId: string;
};

type ActiveSection =
  | "dashboard"
  | "products"
  | "billing"
  | "renewal"
  | "profile"
  | "support";

/* ============================== PAGE ================================ */

export default function MyAccountPage() {
  const router = useRouter();
  const { t, lang } = useT();

  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  const [subsLoading, setSubsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<SubscriptionsItem[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [meta, setMeta] = useState<{
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  } | null>(null);

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

  const [renewOpen, setRenewOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<SubscriptionsItem | null>(
    null
  );
  const [ctx, setCtx] = useState<ModalCtx | null>(null);
  const [processing, setProcessing] = useState(false);

  const [addonOpen, setAddonOpen] = useState(false);
  const [addonCtx, setAddonCtx] = useState<{
    productCode: string;
    packageCode: string;
    subscriptionInstanceId: string;
  } | null>(null);

  const [pwdOpen, setPwdOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [securityBusy, setSecurityBusy] = useState(false);
  const [debugToken, setDebugToken] = useState<string | null>(null);

  const [downloadingInvId, setDownloadingInvId] = useState<string | null>(null);

  const [contact, setContact] = useState<{
    email?: string | null;
    phone?: string | null;
  }>({
    email: null,
    phone: null,
  });

  // formatters bergantung bahasa
  const dateLocale = lang === "en" ? "en-US" : "id-ID";
  const formatDate = (dateString?: string | null) =>
    dateString
      ? new Date(dateString).toLocaleDateString(dateLocale, {
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
    // NB: kita biarkan negatif jika sudah lewat, sesuai logika awal
  };

  // Badge status
  const getStatusBadge = (isActiveNow: boolean) =>
    isActiveNow ? (
      <Badge className="bg-green-500 text-white">{t("status.active")}</Badge>
    ) : (
      <Badge className="bg-red-500 text-white">{t("status.expired")}</Badge>
    );

  // Intent label
  function formatIntent(intent?: string): string {
    if (!intent) return "";
    const key =
      intent.toLowerCase() === "renew"
        ? "intent.renew"
        : intent.toLowerCase() === "upgrade"
        ? "intent.upgrade"
        : "intent.purchase";
    return t(key as Keys);
  }

  // Payment status badge
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-500 text-white">{t("payment.paid")}</Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500 text-white">
            {t("payment.pending")}
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500 text-white">{t("payment.failed")}</Badge>
        );
      case "expired":
        return (
          <Badge className="bg-slate-500 text-white">
            {t("payment.expired")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // FAQ bilingual (lokal)
  const faqData = useMemo(() => {
    if (lang === "en") {
      return [
        // {
        //   question: "How do I access my purchased products?",
        //   answer:
        //     "You can access your products by clicking the 'Open App' button in the My Products section. You'll receive login credentials via email after purchase.",
        // },
        {
          question: "How do I renew my subscription?",
          answer:
            "Go to the 'Renewal & Upgrade' section and click the 'Renew' button next to your product. You can choose to extend for the same duration or upgrade your package.",
        },
        {
          question: "Can I upgrade my package anytime?",
          answer:
            "Yes, You can upgrade your package in the Renewal & Upgrade menu.",
        },
        {
          question: "How do I download my invoices?",
          answer:
            "In the 'Billing & Invoices' section, click the download icon next to each invoice to download the PDF version.",
        },
      ];
    }
    return [
      // {
      //   question: "Bagaimana cara mengakses produk yang sudah dibeli?",
      //   answer:
      //     "Buka menu 'Produk Saya' lalu klik tombol 'Buka Aplikasi'. Kredensial login akan dikirim lewat email setelah pembelian.",
      // },
      {
        question: "Bagaimana cara memperpanjang langganan?",
        answer:
          "Buka menu 'Perpanjang & Upgrade' lalu klik tombol 'Perpanjang' pada produk Anda. Anda bisa perpanjang durasi yang sama atau upgrade paket.",
      },
      {
        question: "Apakah saya bisa upgrade paket kapan saja?",
        answer:
          "Bisa. Anda dapat meningkatkan paket anda di menu Perpanjangan & Upgrade.",
      },
      {
        question: "Bagaimana cara mengunduh invoice?",
        answer:
          "Di menu 'Tagihan & Invoice', klik ikon unduh pada baris invoice untuk menyimpan versi PDF.",
      },
    ];
  }, [lang]);

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
      } catch {
        router.push("/login");
      } finally {
        setLoadingUser(false);
      }
    };
    load();
  }, [router]);

  // Fetch subscriptions
  useEffect(() => {
    if (!user) return;
    const loadSubs = async () => {
      try {
        setSubsLoading(true);
        const res = await fetchSubscriptions({ page, per_page: perPage });
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

  // Fetch invoices
  useEffect(() => {
    if (!user) return;
    const loadInvoices = async () => {
      try {
        setInvLoading(true);
        const res = await fetchCustomerInvoices({
          page: invPage,
          per_page: invPerPage,
        });
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

  useEffect(() => {
    const loadContact = async () => {
      try {
        const raw = await AgileStoreAPI.getSection("contact");
        const content =
          raw?.content ?? raw?.data?.content ?? raw?.payload?.content ?? raw;

        setContact({
          email: content?.email ?? null,
          phone: content?.phone ?? null,
        });
      } catch (e) {
        console.warn("Contact section not found, fallback used");
        setContact({
          email: "admin@agilestore.com",
          phone: "085702212773",
        });
      }
    };
    loadContact();
  }, []);

  // reset page pagination when user changes
  useEffect(() => {
    if (!user) {
      setPage(1);
      setInvPage(1);
    }
  }, [user]);

  // derived data
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

  // handlers
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
      setUser(res.data);
      toast({ title: t("toast.saved"), description: t("toast.savedDesc") });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("toast.saveFail"),
        description: String(e?.message ?? "Unknown error"),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const onLogout = async () => {
    try {
      await logoutCustomer();
      toast({ title: t("toast.signout"), description: t("toast.signoutDesc") });
    } finally {
      router.push("/login");
    }
  };

  // pagination component (i18n)
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
          {t("pagination.prev")}
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
          {t("pagination.next")}
        </Button>
      </div>
    );
  }

  // skeletons (tidak perlu diterjemahkan)
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

  // MODAL openers
  const openRenewFor = (sub: SubscriptionsItem) => {
    setSelectedSub(sub);
    setCtx({
      productCode: sub.product.code,
      packageCode: sub.package.code,
      durationCode: sub.duration.code,
      baseOrderId: sub.meta?.last_paid_order_id || "",
    });
    setUpgradeOpen(false);
    setRenewOpen(true);
  };
  const openUpgradeFor = (sub: SubscriptionsItem) => {
    setSelectedSub(sub);
    setCtx({
      productCode: sub.product.code,
      packageCode: sub.package.code,
      durationCode: sub.duration.code,
      baseOrderId: sub.meta?.last_paid_order_id || "",
    });
    setRenewOpen(false);
    setUpgradeOpen(true);
  };
  const openAddonFor = (sub: SubscriptionsItem) => {
    setSelectedSub(sub);
    setAddonCtx({
      productCode: sub.product.code,
      packageCode: sub.package.code,
      subscriptionInstanceId: sub.subscription_id,
    });
    setAddonOpen(true);
    setRenewOpen(false);
    setUpgradeOpen(false);
  };

  // confirm handlers
  const handleConfirmRenew = async ({
    duration_code,
  }: {
    duration_code: string;
  }) => {
    if (!selectedSub || !ctx) return;
    const { productCode, packageCode, baseOrderId } = ctx;
    if (!productCode || !packageCode || !baseOrderId || !duration_code) {
      toast({
        variant: "destructive",
        title: t("modal.dataMissing"),
        description: t("modal.dataMissingDesc"),
      });
      return;
    }
    setProcessing(true);
    try {
      const res = await createRenewOrder({
        product_code: productCode,
        package_code: packageCode,
        duration_code,
        base_order_id: baseOrderId,
      });
      await ensureSnap();
      openSnap(res.snap_token, res.order_id);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("renew"),
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
    if (!selectedSub || !ctx) return;
    const { productCode, baseOrderId } = ctx;
    if (!productCode || !package_code || !duration_code || !baseOrderId) {
      toast({
        variant: "destructive",
        title: t("modal.dataMissing"),
        description: t("modal.dataMissingDesc"),
      });
      return;
    }
    setProcessing(true);
    try {
      const res = await createUpgradeOrder({
        product_code: productCode,
        package_code,
        duration_code,
        base_order_id: baseOrderId,
      });
      await ensureSnap();
      openSnap(res.snap_token, res.order_id);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("upgrade"),
        description: String(e?.message ?? "Unknown error"),
      });
    } finally {
      setProcessing(false);
      setUpgradeOpen(false);
    }
  };

  // security handlers
  const onChangePassword = async (p: {
    current_password: string;
    new_password: string;
  }) => {
    setSecurityBusy(true);
    try {
      await changeCustomerPassword(p);
      toast({ title: t("security.changePassword") });
      setPwdOpen(false);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("security.changePassword"),
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
      setDebugToken(res?.debug_plain_token ?? null);
      toast({
        title: t("toast.tokenSent"),
        description: t("toast.tokenSentDesc"),
      });
      setResetOpen(true);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("security.sendReset"),
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
      toast({ title: t("toast.resetSuccess") });
      setResetOpen(false);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("toast.resetFail"),
        description: String(e?.message ?? "Invalid token or other error"),
      });
    } finally {
      setSecurityBusy(false);
    }
  };

  // invoice download
  async function handleInvoiceDownload(
    orderId?: string,
    midtransOrderId?: string
  ) {
    try {
      if (!orderId) {
        toast({
          variant: "destructive",
          title: t("toast.invoiceCant"),
          description: t("toast.invoiceNoOrder"),
        });
        return;
      }
      setDownloadingInvId(orderId);
      const blob = await downloadInvoice(orderId);
      const filename = `invoice-${(midtransOrderId || orderId)
        .toString()
        .replace(/\s+/g, "")}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("toast.invoiceFail"),
        description: String(e?.message ?? "Unknown error"),
      });
    } finally {
      setDownloadingInvId(null);
    }
  }

  // ============ LOADING LAYOUT ============
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-50">
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

          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-2">
              <div className="h-7 w-72 rounded bg-slate-200" />
              <div className="h-4 w-64 rounded bg-slate-200" />
            </div>

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

  // sidebar items (i18n)
  const sidebarItems = [
    { id: "dashboard", label: t("sidebar.dashboard"), icon: Home },
    { id: "products", label: t("sidebar.products"), icon: Package },
    { id: "billing", label: t("sidebar.billing"), icon: CreditCard },
    { id: "renewal", label: t("sidebar.renewal"), icon: RefreshCw },
    { id: "profile", label: t("sidebar.profile"), icon: UserIcon },
    { id: "support", label: t("sidebar.support"), icon: HelpCircle },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {t("welcome")}
                {user?.full_name ? `, ${user.full_name}!` : "!"}
              </h2>
              <p className="text-slate-600">{t("overview")}</p>
            </div>

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
                            {t("summary.activeProducts")}
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
                            {t("summary.daysUntilRenewal")}
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
                            {t("summary.outstandingInvoice")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("activeProducts.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {subsLoading && <MiniProductSkeleton />}
                {!subsLoading && activeProducts.length === 0 && (
                  <p className="text-slate-600 text-center py-4">
                    {t("activeProducts.empty")}
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
                          {p.package.name || p.package.code}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(true)}
                        <p className="text-sm text-slate-600 mt-1">
                          {t("label.expires")}: {formatDate(p.end_date)}
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
                {t("products.title")}
              </h2>
              <p className="text-slate-600">{t("products.subtitle")}</p>
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
                    {t("products.empty")}
                  </CardContent>
                </Card>
              )}

              {!subsLoading &&
                subscriptions.map((p) => {
                  const isActiveNow = p.is_currently_active;
                  const remaining = getDaysUntilExpiry(p.end_date);
                  const durationLabel = p.duration.name || p.duration.code;
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
                            <p className="text-slate-600">{packageLabel}</p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(isActiveNow)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-slate-600">
                              {t("startDate")}
                            </p>
                            <p className="font-medium">
                              {formatDate(p.start_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">
                              {t("endDate")}
                            </p>
                            <p className="font-medium">
                              {formatDate(p.end_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">
                              {t("duration")}
                            </p>
                            <p className="font-medium">{durationLabel}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                          {isActiveNow ? (
                            <>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Clock className="h-4 w-4" />
                                {remaining >= 0
                                  ? `${remaining} ${t("daysRemaining")}`
                                  : `${remaining} ${t("daysRemaining")}`}
                              </div>
                              <div className="flex gap-2">
                                {/* <Button
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={() =>
                                    window.open("/my-account", "_blank")
                                  }
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  {t("openApp")}
                                </Button> */}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                {t("label.expired")}: {formatDate(p.end_date)}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={() => openRenewFor(p)}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  {t("renew")}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => openUpgradeFor(p)}
                                >
                                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                                  {t("upgrade")}
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

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
                {t("billing.title")}
              </h2>
              <p className="text-slate-600">{t("billing.subtitle")}</p>
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
                      {t("billing.empty")}
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
                                  {" - "}
                                  {t("intent.renew")} - {invoice.package_name} —{" "}
                                  {t("label.expires")}:{" "}
                                  {formatDate(invoice.end_date)}
                                </span>
                              ) : invoice.intent === "upgrade" ? (
                                <span className="text-sm text-slate-600">
                                  {" - "}
                                  {t("intent.upgrade")} — {invoice.package_name}
                                </span>
                              ) : (
                                <span>
                                  {" - "}
                                  {invoice.package_name}
                                </span>
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
                            {/* amount tetap angka; mata uang dibiarkan dari backend */}
                            {new Intl.NumberFormat(dateLocale, {
                              style: "currency",
                              currency: "IDR",
                            }).format(invoice.amount || 0)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {getPaymentStatusBadge(invoice.status)}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleInvoiceDownload(
                                  invoice.order_id,
                                  invoice.midtrans_order_id
                                )
                              }
                              disabled={
                                downloadingInvId === invoice.order_id ||
                                invoice.status !== "paid"
                              }
                              aria-busy={downloadingInvId === invoice.order_id}
                              aria-label={`${t("downloadInvoice")} ${
                                invoice.midtrans_order_id || invoice.order_id
                              }`}
                              title={t("downloadInvoice")}
                            >
                              {downloadingInvId === invoice.order_id ? (
                                <span className="inline-flex items-center">
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                </span>
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

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
                {t("renewal.title")}
              </h2>
              <p className="text-slate-600">{t("renewal.subtitle")}</p>
            </div>

            <div className="space-y-4">
              {subscriptions.map((p) => {
                const isActiveNow = p.is_currently_active;
                const durationLabel = p.duration.name || p.duration.code;
                const packageLabel = p.package.name || p.package.code;
                const productLabel = p.product.name || p.product.code;

                return (
                  <Card key={p.subscription_id} className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-2xl">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {productLabel}
                          </h3>
                          <p className="text-slate-600">{packageLabel}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            {isActiveNow
                              ? `${t("label.expires")}: ${formatDate(
                                  p.end_date
                                )}`
                              : `${t("label.expired")}: ${formatDate(
                                  p.end_date
                                )}`}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
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
                            {t("renew")}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => openUpgradeFor(p)}
                          >
                            <ArrowUpCircle className="h-4 w-4 mr-2" />
                            {t("upgrade")}
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
                {t("profile.title")}
              </h2>
              <p className="text-slate-600">{t("profile.subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle>{t("profile.personalInformation")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("profile.fullName")}</Label>
                    <Input
                      id="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("profile.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("profile.phone")}</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">{t("profile.company")}</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder={t("profile.companyPlaceholder")}
                    />
                  </div>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                    disabled={savingProfile}
                    onClick={onSaveProfile}
                  >
                    {savingProfile ? t("profile.saving") : t("profile.save")}
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle>{t("security.title")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => setPwdOpen(true)}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {t("security.changePassword")}
                    </Button>

                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">
                          {t("security.forgotTitle")}
                        </p>
                        <p className="text-sm text-slate-600">
                          {t("security.forgotDesc")}
                        </p>
                      </div>
                      <Button
                        onClick={onAskResetLink}
                        disabled={securityBusy}
                        className="cursor-pointer"
                        aria-busy={securityBusy}
                      >
                        {securityBusy ? (
                          <span className="inline-flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t("security.sending")}
                          </span>
                        ) : (
                          t("security.sendReset")
                        )}
                      </Button>
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
                {t("support.title")}
              </h2>
              <p className="text-slate-600">{t("support.subtitle")}</p>
            </div>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>{t("support.contact")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent"
                  >
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                    <span className="font-medium">{t("support.livechat")}</span>
                    <span className="text-sm text-slate-600">
                      {t("support.livechatAvail")}
                    </span>
                  </Button>
                  {/* Email */}
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent"
                    asChild={!!contact.email}
                    disabled={!contact.email}
                  >
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`}>
                        <Mail className="h-6 w-6 text-green-600" />
                        <span className="font-medium">
                          {t("support.email")}
                        </span>
                        <span className="text-sm text-slate-600">
                          {contact.email}
                        </span>
                      </a>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Mail className="h-6 w-6 text-slate-400" />
                        <span className="font-medium">
                          {t("support.email")}
                        </span>
                        <span className="text-sm text-slate-500">—</span>
                      </div>
                    )}
                  </Button>
                  {/* Phone / WA */}
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent"
                    asChild={!!contact.phone}
                    disabled={!contact.phone}
                  >
                    {contact.phone ? (
                      <a
                        href={`https://wa.me/${String(contact.phone).replace(
                          /[^\d]/g,
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Phone className="h-6 w-6 text-purple-600" />
                        <span className="font-medium">
                          {t("support.phone")}
                        </span>
                        <span className="text-sm text-slate-600">
                          {contact.phone}
                        </span>
                      </a>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Phone className="h-6 w-6 text-slate-400" />
                        <span className="font-medium">
                          {t("support.phone")}
                        </span>
                        <span className="text-sm text-slate-500">—</span>
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>{t("support.faq")}</CardTitle>
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

            {/* <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>{t("support.resources")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    {t("resources.userGuide")}
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t("resources.videos")}
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {t("resources.forum")}
                  </Button>
                </div>
              </CardContent>
            </Card> */}
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
              {t("brand")}
            </h1>
            <span className="text-slate-400">|</span>
            <span className="text-slate-600">{t("pageTitle")}</span>
          </div>
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
            <Button
              variant="ghost"
              className="text-red-600 cursor-pointer mt-2 hover:bg-red-500"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t("logout")}
            </Button>
          </div>

          {/* Main */}
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

      {/* MODALS */}
      {selectedSub && (
        <>
          {ctx && (
            <RenewModal
              open={renewOpen}
              onOpenChange={(v) => {
                setRenewOpen(v);
                if (v) setUpgradeOpen(false);
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

      {/* SECURITY DIALOGS */}
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
        onResend={onAskResetLink}
        loading={securityBusy}
        email={email}
        debugHint={debugToken}
      />
    </div>
  );
}
