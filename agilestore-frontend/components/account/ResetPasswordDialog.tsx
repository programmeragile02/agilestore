"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, RotateCcw } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (p: {
    token: string;
    new_password: string;
  }) => Promise<void> | void;
  onResend: () => Promise<void> | void; // <<-- NEW
  loading?: boolean;
  email: string;
  debugHint?: string | null; // dev only (optional)
};

export default function ResetPasswordDialog({
  open,
  onOpenChange,
  onSubmit,
  onResend,
  loading,
  email,
  debugHint,
}: Props) {
  // OTP
  const [boxes, setBoxes] = useState(["", "", "", "", "", ""]);
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  // Password fields
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  // Resend cooldown
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (open) {
      setBoxes(["", "", "", "", "", ""]);
      setPwd("");
      setPwd2("");
      setCooldown(0);
      setTimeout(() => refs[0].current?.focus(), 120);
    }
  }, [open]); // eslint-disable-line

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

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

  // Validation
  const passwordValid =
    pwd.length >= 8 && /[A-Za-z]/.test(pwd) && /\d/.test(pwd);
  const passwordsMatch = pwd && pwd === pwd2;
  const canSubmit =
    token.length === 6 && passwordValid && passwordsMatch && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    await onSubmit({ token, new_password: pwd });
  };

  const resend = async () => {
    if (cooldown || loading) return;
    await onResend();
    setCooldown(30);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="text-sm text-slate-600">
            We’ve sent a 6-digit code to{" "}
            <span className="font-medium">{email}</span>.
          </div>

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
                className="pr-10"
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
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd2((v) => !v)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-700"
                aria-label={
                  showPwd2 ? "Hide confirm password" : "Show confirm password"
                }
              >
                {showPwd2 ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {!passwordsMatch && pwd2.length > 0 && (
              <p className="text-xs text-red-600">Passwords do not match.</p>
            )}
          </div>

          {/* Resend */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Didn’t get the code?</span>
            <Button
              variant="outline"
              size="sm"
              onClick={resend}
              disabled={cooldown > 0 || !!loading}
              className="gap-2"
            >
              {loading ? (
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

          {debugHint && (
            <p className="text-xs text-slate-500">
              Dev hint: latest code is{" "}
              <span className="font-mono">{debugHint}</span>
            </p>
          )}

          <Button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full cursor-pointer"
          >
            {loading ? "Processing..." : "Reset Password"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
