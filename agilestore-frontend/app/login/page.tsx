"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowLeft,
  Shield,
  CheckCircle,
} from "lucide-react";

import { loginCustomer, loginWithGoogle } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/LanguageProvider";

/** ─────── GSI globals ─────── */
declare global {
  interface Window {
    google?: any;
  }
}

/** Komponen tombol Google yang selalu ikut bahasa `lang` */
function GoogleContinueButton({
  lang,
  onCredential,
}: {
  lang: "id" | "en";
  onCredential: (credential: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!CLIENT_ID) {
      // Kalau belum set env, tampilkan warning halus
      console.warn("NEXT_PUBLIC_GOOGLE_CLIENT_ID belum diset");
      return;
    }

    // Bersihkan script lama + button lama
    const SCRIPT_ID = "gsi-client";
    const existed = document.getElementById(SCRIPT_ID);
    if (existed) existed.remove();
    if (containerRef.current) containerRef.current.innerHTML = "";
    // kadang perlu "reset" instance lama
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).google = undefined;

    // Muat ulang script dengan hl=<lang>
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
          context: "signin",
        });

        // Render tombol sesuai gaya yang kamu pakai
        if (containerRef.current) {
          window.google?.accounts.id.renderButton(containerRef.current, {
            theme: "outline",
            size: "large",
            type: "standard",
            text: "continue_with",
            shape: "pill",
          });
        }
      } catch (e) {
        console.error("GSI init error:", e);
      }
    };
    document.head.appendChild(s);

    return () => {
      // Jangan hapus script saat unmount halaman; biarkan sampai lang berubah lagi
    };
  }, [CLIENT_ID, lang, onCredential]);

  return <div ref={containerRef} className="flex justify-center" />;
}

/** ─────── Halaman Login ─────── */
export default function LoginPage() {
  const router = useRouter();
  const { lang } = useLanguage(); // "id" | "en"

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // cookie flag ringan agar middleware /checkout bisa baca “sudah login”
  const setAuthCookie = (persistent: boolean) => {
    const parts = ["customer_auth=1", "Path=/", "SameSite=Lax"];
    if (persistent) parts.push("Max-Age=2592000"); // 30 hari
    document.cookie = parts.join("; ");
  };

  const T = useMemo(
    () =>
      ({
        back: { en: "Back to Agile Store", id: "Kembali ke Agile Store" },
        title: { en: "Welcome Back", id: "Selamat Datang Kembali" },
        subtitle: {
          en: "Sign in to your Agile Store account",
          id: "Masuk ke akun Agile Store Anda",
        },
        emailLabel: { en: "Email Address", id: "Alamat Email" },
        emailPh: { en: "Enter your email", id: "Masukkan email Anda" },
        passLabel: { en: "Password", id: "Kata Sandi" },
        passPh: { en: "Enter your password", id: "Masukkan kata sandi" },
        remember: { en: "Remember me", id: "Ingat saya" },
        forgot: { en: "Forgot password?", id: "Lupa kata sandi?" },
        signIn: { en: "Sign In", id: "Masuk" },
        orWith: { en: "OR CONTINUE WITH", id: "ATAU LANJUTKAN DENGAN" },
        noAcc: { en: "Don't have an account?", id: "Belum punya akun?" },
        createAcc: { en: "Create account", id: "Buat akun" },
        toastOk: { en: "Login Success", id: "Berhasil masuk" },
        toastBadTitle: { en: "Login failed", id: "Gagal masuk" },
        toastBadDesc: {
          en: "Please check your credentials.",
          id: "Periksa kredensial Anda.",
        },
        gOk: { en: "Signed in with Google", id: "Masuk dengan Google" },
        gBad: { en: "Google sign-in failed", id: "Gagal masuk Google" },
        secure: { en: "Secure Login", id: "Login Aman" },
        ssl: { en: "SSL Protected", id: "Dilindungi SSL" },
      } as const),
    []
  );

  const t = (key: keyof typeof T) => T[key][lang];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await loginCustomer({ email: email.trim(), password });
      setAuthCookie(remember);
      router.push("/");
      toast({ title: t("toastOk") });
    } catch {
      setErrorMsg(t("toastBadDesc"));
      toast({
        variant: "destructive",
        title: t("toastBadTitle"),
        description: t("toastBadDesc"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    try {
      await loginWithGoogle(credential);
      setAuthCookie(remember);
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
        {/* Back to home */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("back")}
          </Link>
        </div>

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
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  {t("emailLabel")}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPh")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  {t("passLabel")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("passPh")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-input border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground">
                    {t("remember")}
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  {t("forgot")}
                </Link>
              </div>

              {/* Error */}
              {errorMsg && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
                  {errorMsg}
                </p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r cursor-pointer from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-primary-foreground font-medium shadow-lg transition-all duration-200"
              >
                {isLoading
                  ? lang === "en"
                    ? "Signing in..."
                    : "Memproses..."
                  : t("signIn")}
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

            {/* Google Button – SELALU ikut bahasa provider */}
            <GoogleContinueButton
              lang={lang}
              onCredential={handleGoogleCredential}
            />
          </CardContent>

          <CardFooter className="pt-6">
            <div className="text-center text-sm text-muted-foreground w-full">
              {t("noAcc")}{" "}
              <Link
                href="/register"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {t("createAcc")}
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Trust badges */}
        <div className="mt-8 flex items-center justify-center space-x-6 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>{t("secure")}</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>{t("ssl")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
