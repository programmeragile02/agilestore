"use client";

import type React from "react";
import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Shield,
  CheckCircle,
  Star,
} from "lucide-react";

import { loginWithGoogle, registerCustomer } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/LanguageProvider";

/** GSI global */
declare global {
  interface Window {
    google?: any;
  }
}

/** Tombol Google yang selalu ikut bahasa aktif (hl=<lang>) */
function GoogleSignupButton({
  lang,
  onCredential,
  text = "signup_with", // "continue_with" | "signup_with"
}: {
  lang: "id" | "en";
  onCredential: (credential: string) => void;
  text?: "continue_with" | "signup_with";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!CLIENT_ID) {
      console.warn("NEXT_PUBLIC_GOOGLE_CLIENT_ID belum diset");
      return;
    }

    const SCRIPT_ID = "gsi-client";
    // buang script lama + reset container
    document.getElementById(SCRIPT_ID)?.remove();
    if (ref.current) ref.current.innerHTML = "";
    (window as any).google = undefined;

    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = `https://accounts.google.com/gsi/client?hl=${lang}`;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      try {
        window.google?.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (resp: any) => {
            const cred = resp?.credential;
            if (cred) onCredential(cred);
          },
          ux_mode: "popup",
          auto_select: false,
          itp_support: true,
          context: "signup",
        });

        if (ref.current) {
          window.google?.accounts.id.renderButton(ref.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            text, // "signup_with"
            shape: "pill",
          });
        }
      } catch (e) {
        console.error("GSI init error:", e);
      }
    };
    document.head.appendChild(s);
  }, [CLIENT_ID, lang, text, onCredential]);

  return <div ref={ref} className="flex justify-center" />;
}

export default function RegisterPage() {
  const router = useRouter();
  const { lang } = useLanguage(); // "en" | "id"

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    subscribeNewsletter: true,
  });

  const T = useMemo(
    () =>
      ({
        back: { en: "Back to Agile Store", id: "Kembali ke Agile Store" },
        title: { en: "Create Account", id: "Buat Akun" },
        subtitle: {
          en: "Join thousands of businesses using Agile Store",
          id: "Bergabung dengan ribuan bisnis yang memakai Agile Store",
        },
        benefitTrial: {
          en: "14-day free trial",
          id: "Uji coba 14 hari gratis",
        },
        benefitNoCard: {
          en: "No credit card required",
          id: "Tanpa kartu kredit",
        },
        benefitCancel: { en: "Cancel anytime", id: "Bisa batalkan kapan saja" },
        fullName: { en: "Full Name", id: "Nama Lengkap" },
        fullNamePh: { en: "John Doe", id: "Budi Santoso" },
        email: { en: "Email Address", id: "Alamat Email" },
        emailPh: { en: "john@company.com", id: "nama@perusahaan.com" },
        phone: { en: "Phone Number", id: "Nomor Telepon" },
        phonePh: { en: "+62812345678", id: "+62812345678" },
        pass: { en: "Password", id: "Kata Sandi" },
        passPh: { en: "Create a strong password", id: "Buat kata sandi kuat" },
        confirm: { en: "Confirm Password", id: "Konfirmasi Kata Sandi" },
        confirmPh: {
          en: "Confirm your password",
          id: "Ulangi kata sandi Anda",
        },
        terms: {
          en: "I agree to the",
          id: "Saya setuju dengan",
        },
        tos: { en: "Terms of Service", id: "Ketentuan Layanan" },
        privacy: { en: "Privacy Policy", id: "Privasi" },
        news: {
          en: "Send me product updates and marketing emails",
          id: "Kirimkan saya update produk & email pemasaran",
        },
        create: { en: "Create Account", id: "Buat Akun" },
        creating: { en: "Creating Account...", id: "Membuat Akun..." },
        orWith: { en: "OR SIGN UP WITH", id: "ATAU DAFTAR DENGAN" },
        haveAcc: { en: "Already have an account?", id: "Sudah punya akun?" },
        signIn: { en: "Sign in", id: "Masuk" },
        errAgree: {
          en: "Please agree to the Terms & Privacy Policy.",
          id: "Silakan setujui Ketentuan & Kebijakan Privasi.",
        },
        errMismatch: {
          en: "Password and confirmation do not match.",
          id: "Kata sandi dan konfirmasi tidak sama.",
        },
        okCreated: {
          en: "Account created successfully. Redirecting to Sign in…",
          id: "Akun berhasil dibuat. Mengalihkan ke halaman Masuk…",
        },
        errReg: {
          en: "Registration failed. Please try again.",
          id: "Gagal mendaftar. Coba lagi.",
        },
        gOk: { en: "Signed in with Google", id: "Masuk dengan Google" },
        gBad: { en: "Google sign-in failed", id: "Gagal masuk Google" },
        secure: { en: "256-bit SSL", id: "SSL 256-bit" },
        gdpr: { en: "GDPR Compliant", id: "Patuh GDPR" },
        soc2: { en: "SOC 2 Certified", id: "Tersertifikasi SOC 2" },
      } as const),
    []
  );

  const t = <K extends keyof typeof T>(k: K) => T[k][lang];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.agreeToTerms) {
      setErrorMsg(t("errAgree"));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg(t("errMismatch"));
      return;
    }

    setIsLoading(true);
    try {
      await registerCustomer({
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: null,
        password: formData.password,
      });

      setSuccessMsg(t("okCreated"));
      setTimeout(() => router.push("/login"), 900);
    } catch (err: any) {
      setErrorMsg(err?.message || t("errReg"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (cred: string) => {
    try {
      await loginWithGoogle(cred);
      router.push("/");
      toast({ title: t("gOk") });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: t("gBad"),
        description: e?.message || "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("back")}
          </Link>
        </div>

        {/* Card */}
        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-8">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-primary to-blue-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">AS</span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <CardTitle className="text-2xl font-serif font-bold text-foreground">
                {t("title")}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t("subtitle")}
              </CardDescription>
            </div>

            {/* Benefits */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span>{t("benefitTrial")}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{t("benefitNoCard")}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>{t("benefitCancel")}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className="text-sm font-medium text-foreground"
                >
                  {t("fullName")}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={t("fullNamePh")}
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    className="pl-10 h-12 bg-input border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  {t("email")}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPh")}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 h-12 bg-input border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-sm font-medium text-foreground"
                >
                  {t("phone")}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t("phonePh")}
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="pl-10 h-12 bg-input border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  {t("pass")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("passPh")}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="pl-10 pr-10 h-12 bg-input border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-4 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-foreground"
                >
                  {t("confirm")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("confirmPh")}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className="pl-10 pr-10 h-12 bg-input border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-4 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) =>
                      handleInputChange("agreeToTerms", !!checked)
                    }
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground leading-relaxed"
                  >
                    {t("terms")}{" "}
                    <Link
                      href="/terms"
                      className="text-primary hover:text-primary/80 underline"
                    >
                      {t("tos")}
                    </Link>{" "}
                    {lang === "en" ? "and" : "dan"}{" "}
                    <Link
                      href="/privacy"
                      className="text-primary hover:text-primary/80 underline"
                    >
                      {t("privacy")}
                    </Link>
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="newsletter"
                    checked={formData.subscribeNewsletter}
                    onCheckedChange={(checked) =>
                      handleInputChange("subscribeNewsletter", !!checked)
                    }
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="newsletter"
                    className="text-sm text-muted-foreground"
                  >
                    {t("news")}
                  </Label>
                </div>
              </div>

              {/* Errors / Success */}
              {errorMsg && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
                  {errorMsg}
                </p>
              )}
              {successMsg && (
                <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded px-3 py-2">
                  {successMsg}
                </p>
              )}

              {/* Register Button */}
              <Button
                type="submit"
                disabled={isLoading || !formData.agreeToTerms}
                className="w-full h-12 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-primary-foreground font-medium shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? t("creating") : t("create")}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t("orWith")}
                </span>
              </div>
            </div>

            {/* Google Sign Up – sinkron bahasa */}
            <GoogleSignupButton
              lang={lang}
              text="signup_with"
              onCredential={handleGoogleCredential}
            />
          </CardContent>

          <CardFooter className="pt-6">
            <div className="text-center text-sm text-muted-foreground w-full">
              {t("haveAcc")}{" "}
              <Link
                href="/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {t("signIn")}
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Trust indicators */}
        <div className="mt-8 flex items-center justify-center space-x-6 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>{t("secure")}</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>{t("gdpr")}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3" />
            <span>{t("soc2")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
