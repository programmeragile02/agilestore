"use client";

import type React from "react";

import { useState } from "react";
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
  Building,
  ArrowLeft,
  Shield,
  CheckCircle,
  Star,
} from "lucide-react";
import { registerCustomer } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    subscribeNewsletter: true,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // validasi ringan di client
    if (!formData.agreeToTerms) {
      setErrorMsg("Please agree to the Terms & Privacy Policy.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg("Password and confirmation do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await registerCustomer({
        // map ke snake_case sesuai validator Laravel
        full_name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim() || null,
        password: formData.password,
      });

      setSuccessMsg("Account created successfully. Redirecting to Sign in…");
      setTimeout(() => router.push("/login"), 900);
    } catch (err: any) {
      setErrorMsg(err?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
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
            Back to Agile Store
          </Link>
        </div>

        {/* Main Register Card */}
        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-primary to-blue-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">AS</span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <CardTitle className="text-2xl font-serif font-bold text-foreground">
                Create Account
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Join thousands of businesses using Agile Store
              </CardDescription>
            </div>

            {/* Benefits */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-sm font-medium text-foreground"
                  >
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) =>
                        handleInputChange("fullName", e.target.value)
                      }
                      className="pl-10 h-12 bg-input border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 h-12 bg-input border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              {/* Phone Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Phone Number
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+62812345678"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="pl-10 h-12 bg-input border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Company Field */}
              {/* <div className="space-y-2">
                <Label
                  htmlFor="company"
                  className="text-sm font-medium text-foreground"
                >
                  Company Name
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="company"
                    type="text"
                    placeholder="Your Company (optional)"
                    value={formData.company}
                    onChange={(e) =>
                      handleInputChange("company", e.target.value)
                    }
                    className="pl-10 h-12 bg-input border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div> */}

              {/* Password Fields */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
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

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-foreground"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
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
                      handleInputChange("agreeToTerms", checked as boolean)
                    }
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground leading-relaxed"
                  >
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="text-primary hover:text-primary/80 underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-primary hover:text-primary/80 underline"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="newsletter"
                    checked={formData.subscribeNewsletter}
                    onCheckedChange={(checked) =>
                      handleInputChange(
                        "subscribeNewsletter",
                        checked as boolean
                      )
                    }
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor="newsletter"
                    className="text-sm text-muted-foreground"
                  >
                    Send me product updates and marketing emails
                  </Label>
                </div>
              </div>

              {/* Errors / Success */}
              {errorMsg && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{errorMsg}</p>
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
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or sign up with
                </span>
              </div>
            </div>

            {/* Social Registration */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 border-border hover:bg-muted/50 bg-transparent"
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                className="h-12 border-border hover:bg-muted/50 bg-transparent"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </Button>
            </div>
          </CardContent>

          <CardFooter className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Trust Indicators */}
        <div className="mt-8 flex items-center justify-center space-x-6 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>256-bit SSL</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>GDPR Compliant</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-3 w-3" />
            <span>SOC 2 Certified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
