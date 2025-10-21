// "use client";

// import type React from "react";

// import { useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
// import {
//   Eye,
//   EyeOff,
//   Mail,
//   Lock,
//   ArrowLeft,
//   Shield,
//   CheckCircle,
// } from "lucide-react";
// import { loginCustomer, loginWithGoogle, setCustomerToken } from "@/lib/api";
// import { toast } from "@/hooks/use-toast";
// import { GoogleLogin } from "@react-oauth/google";

// export default function LoginPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const [showPassword, setShowPassword] = useState(false);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [remember, setRemember] = useState(true); // opsional
//   const [isLoading, setIsLoading] = useState(false);
//   const [errorMsg, setErrorMsg] = useState<string | null>(null);

//   // Set flag cookie untuk dibaca middleware (tanpa token)
//   const setAuthCookie = (persistent: boolean) => {
//     const parts = [
//       "customer_auth=1",
//       "Path=/",
//       "SameSite=Lax",
//       // "Secure", // aktifkan saat sudah HTTPS/production
//     ];
//     if (persistent) {
//       parts.push("Max-Age=2592000"); // 30 hari
//     }
//     document.cookie = parts.join("; ");
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setErrorMsg(null);
//     setIsLoading(true);

//     try {
//       await loginCustomer({ email: email.trim(), password });
//       /**
//        * loginCustomer sudah menyimpan token ke localStorage.
//        * Set cookie flag untuk middleware (/checkout)
//        */
//       setAuthCookie(remember);

//       // Redirect setelah login
//       const next = searchParams.get("next");
//       router.push(next || "/");
//       toast({ title: "Login Success" });
//     } catch (err: any) {
//       setErrorMsg("Login failed. Please check your credentials.");
//       toast({
//         variant: "destructive",
//         title: "Login failed",
//         description: "Please check yout credentials.",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // login google
//   const handleGoogleSuccess = async (cred: any) => {
//     try {
//       const idToken = cred?.credential;
//       if (!idToken) throw new Error("No Google credential");
//       await loginWithGoogle(idToken);

//       // set flag cookie (biar middleware kamu bisa baca)
//       setAuthCookie(remember);

//       const next = searchParams.get("next");
//       router.push(next || "/");
//       toast({ title: "Signed in with Google" });
//     } catch (e: any) {
//       toast({
//         variant: "destructive",
//         title: "Google sign-in failed",
//         description: e?.message || "",
//       });
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
//       <div className="w-full max-w-md">
//         {/* Back to Home */}
//         <div className="mb-8">
//           <Link
//             href="/"
//             className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
//           >
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back to Agile Store
//           </Link>
//         </div>

//         {/* Main Login Card */}
//         <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
//           <CardHeader className="space-y-4 pb-8">
//             {/* Logo */}
//             <div className="flex justify-center">
//               <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-primary to-blue-500 flex items-center justify-center shadow-lg">
//                 <span className="text-white font-bold text-lg">AS</span>
//               </div>
//             </div>

//             <div className="text-center space-y-2">
//               <CardTitle className="text-2xl font-serif font-bold text-foreground">
//                 Welcome Back
//               </CardTitle>
//               <CardDescription className="text-muted-foreground">
//                 Sign in to your Agile Store account
//               </CardDescription>
//             </div>
//           </CardHeader>

//           <CardContent className="space-y-6">
//             <form onSubmit={handleSubmit} className="space-y-4">
//               {/* Email Field */}
//               <div className="space-y-2">
//                 <Label
//                   htmlFor="email"
//                   className="text-sm font-medium text-foreground"
//                 >
//                   Email Address
//                 </Label>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     id="email"
//                     type="email"
//                     placeholder="Enter your email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     className="pl-10 h-12 bg-input border-border focus:ring-2 focus:ring-ring focus:border-transparent"
//                     required
//                   />
//                 </div>
//               </div>

//               {/* Password Field */}
//               <div className="space-y-2">
//                 <Label
//                   htmlFor="password"
//                   className="text-sm font-medium text-foreground"
//                 >
//                   Password
//                 </Label>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-4 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     id="password"
//                     type={showPassword ? "text" : "password"}
//                     placeholder="Enter your password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className="pl-10 pr-10 h-12 bg-input border-border focus:ring-2 focus:ring-ring focus:border-transparent"
//                     required
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
//                   >
//                     {showPassword ? (
//                       <EyeOff className="h-4 w-4" />
//                     ) : (
//                       <Eye className="h-4 w-4" />
//                     )}
//                   </button>
//                 </div>
//               </div>

//               {/* Remember Me & Forgot Password */}
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-2">
//                   <input
//                     id="remember"
//                     type="checkbox"
//                     checked={remember}
//                     onChange={(e) => setRemember(e.target.checked)}
//                     className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
//                   />
//                   <Label
//                     htmlFor="remember"
//                     className="text-sm text-muted-foreground"
//                   >
//                     Remember me
//                   </Label>
//                 </div>
//                 <Link
//                   href="/forgot-password"
//                   className="text-sm text-primary hover:text-primary/80 transition-colors"
//                 >
//                   Forgot password?
//                 </Link>
//               </div>

//               {/* Error */}
//               {errorMsg && (
//                 <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
//                   {errorMsg}
//                 </p>
//               )}

//               {/* Login Button */}
//               <Button
//                 type="submit"
//                 disabled={isLoading}
//                 className="w-full h-12 bg-gradient-to-r cursor-pointer from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-primary-foreground font-medium shadow-lg transition-all duration-200"
//               >
//                 {isLoading ? "Signing in..." : "Sign In"}
//               </Button>
//             </form>

//             {/* Divider */}
//             <div className="relative">
//               <div className="absolute inset-0 flex items-center">
//                 <Separator className="w-full" />
//               </div>
//               <div className="relative flex justify-center text-xs uppercase">
//                 <span className="bg-card px-2 text-muted-foreground">
//                   Or continue with
//                 </span>
//               </div>
//             </div>

//             {/* Social Login */}
//             <div className="grid grid-cols-2 gap-3">
//               <div className="col-span-2 flex justify-center">
//                 <GoogleLogin
//                   onSuccess={handleGoogleSuccess}
//                   onError={() =>
//                     toast({
//                       variant: "destructive",
//                       title: "Google sign-in failed",
//                     })
//                   }
//                   useOneTap={false}
//                   // opsional tampilan:
//                   theme="outline"
//                   size="large"
//                   text="continue_with"
//                   shape="pill"
//                 />
//               </div>
//             </div>
//           </CardContent>

//           <CardFooter className="pt-6">
//             <div className="text-center text-sm text-muted-foreground">
//               Don't have an account?{" "}
//               <Link
//                 href="/register"
//                 className="text-primary hover:text-primary/80 font-medium transition-colors"
//               >
//                 Create account
//               </Link>
//             </div>
//           </CardFooter>
//         </Card>

//         {/* Trust Indicators */}
//         <div className="mt-8 flex items-center justify-center space-x-6 text-xs text-muted-foreground">
//           <div className="flex items-center space-x-1">
//             <Shield className="h-3 w-3" />
//             <span>Secure Login</span>
//           </div>
//           <div className="flex items-center space-x-1">
//             <CheckCircle className="h-3 w-3" />
//             <span>SSL Protected</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Set flag cookie untuk dibaca middleware (tanpa token)
  const setAuthCookie = (persistent: boolean) => {
    const parts = [
      "customer_auth=1",
      "Path=/",
      "SameSite=Lax",
      // "Secure", // aktifkan saat sudah HTTPS/production
    ];
    if (persistent) {
      parts.push("Max-Age=2592000"); // 30 hari
    }
    document.cookie = parts.join("; ");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await loginCustomer({ email: email.trim(), password });
      // set cookie flag untuk middleware (/checkout)
      setAuthCookie(remember);

      // Redirect setelah login — cek searchParams aman
      const next = searchParams ? searchParams.get("next") : null;
      router.push(next || "/");
      toast({ title: "Login Success" });
    } catch (err: any) {
      setErrorMsg("Login failed. Please check your credentials.");
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Please check your credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (cred: any) => {
    try {
      const idToken = cred?.credential;
      if (!idToken) throw new Error("No Google credential");
      await loginWithGoogle(idToken);

      setAuthCookie(remember);

      const next = searchParams ? searchParams.get("next") : null;
      router.push(next || "/");
      toast({ title: "Signed in with Google" });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Google sign-in failed",
        description: e?.message || "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agile Store
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
                Welcome Back
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in to your Agile Store account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-input border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
              </div>

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
                    placeholder="Enter your password"
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

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground"
                  >
                    Remember me
                  </Label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {errorMsg && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
                  {errorMsg}
                </p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r cursor-pointer from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-primary-foreground font-medium shadow-lg transition-all duration-200"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() =>
                    toast({
                      variant: "destructive",
                      title: "Google sign-in failed",
                    })
                  }
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="pill"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Create account
              </Link>
            </div>
          </CardFooter>
        </Card>

        <div className="mt-8 flex items-center justify-center space-x-6 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>Secure Login</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>SSL Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
