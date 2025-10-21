"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { resetCustomerPassword, forgotCustomerPassword } from "@/lib/api";
import { Eye, EyeOff, RotateCcw, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail((params.get("email") || "").trim());
  }, []);

  // OTP
  const [boxes, setBoxes] = useState(["", "", "", "", "", ""]);
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  // Password fields
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  // State
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // focus OTP box pertama
    refs[0].current?.focus();
  }, []); // eslint-disable-line

  // OTP handlers
  const handleChange = (idx: number, v: string) => {
    const val = (v || "").replace(/\D/g, "").slice(0, 1);
    const next = [...boxes];
    next[idx] = val;
    setBoxes(next);
    if (val && idx < 5) refs[idx + 1].current?.focus();
  };
  const handleKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !boxes[idx] && idx > 0)
      refs[idx - 1].current?.focus();
    if (e.key === "ArrowLeft" && idx > 0) refs[idx - 1].current?.focus();
    if (e.key === "ArrowRight" && idx < 5) refs[idx + 1].current?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = text.split("").concat(Array(6).fill("")).slice(0, 6);
    setBoxes(next);
    refs[Math.min(text.length, 5)].current?.focus();
  };

  const token = useMemo(() => boxes.join("").trim(), [boxes]);

  // Validations
  const passwordValid =
    pwd.length >= 8 && /[A-Za-z]/.test(pwd) && /\d/.test(pwd);
  const passwordsMatch = pwd && pwd === pwd2;
  const canSubmit =
    email && token.length === 6 && passwordValid && passwordsMatch && !busy;

  // Submit
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      await resetCustomerPassword({ email, token, new_password: pwd });
      toast({ title: "Password reset successful" });
      router.push("/login");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: String(e?.message ?? "Invalid code or other error"),
      });
    } finally {
      setBusy(false);
    }
  };

  // Resend
  const resend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    try {
      await forgotCustomerPassword(email);
      toast({ title: "Code resent", description: "Check your email inbox." });
      setCooldown(60); // 60 detik
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed to resend",
        description: String(e?.message ?? "Unknown error"),
      });
    } finally {
      setResending(false);
    }
  };

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>Email is missing.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/forgot-password"
              className="inline-flex items-center text-sm text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Go to Forgot Password
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to login
        </Link>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Enter the code</CardTitle>
            <CardDescription>
              We sent a 6-digit code to{" "}
              <span className="font-medium">{email}</span>. Enter it below and
              set a new password.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-6" onSubmit={submit}>
              {/* OTP boxes */}
              <div className="flex items-center justify-between gap-2">
                {boxes.map((val, i) => (
                  <Input
                    key={i}
                    ref={refs[i]}
                    value={val}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-12 h-12 text-center text-lg tracking-widest"
                  />
                ))}
              </div>

              {/* New password */}
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    placeholder="Min. 8 chars with letters & numbers"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    className="pr-10 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {!passwordValid && pwd.length > 0 && (
                  <p className="text-xs text-amber-600">
                    Use at least 8 characters including letters and numbers.
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <div className="relative">
                  <Input
                    type={showPwd2 ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={pwd2}
                    onChange={(e) => setPwd2(e.target.value)}
                    className="pr-10 h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd2((v) => !v)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700"
                    aria-label={
                      showPwd2
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showPwd2 ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {pwd2.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-red-600">
                    Passwords do not match.
                  </p>
                )}
              </div>

              {/* Resend */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Didn’t receive the code?
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resend}
                  disabled={cooldown > 0 || resending}
                  className="gap-2"
                >
                  {resending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                    </>
                  )}
                </Button>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full h-11"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Resetting…
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
