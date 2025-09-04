// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Semua path yang wajib login
const PROTECTED = ["/checkout"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Hanya intercept path yang diawali salah satu PROTECTED
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Flag login dari cookie ringan (bukan token)
  const isAuthed = req.cookies.get("customer_auth")?.value === "1";
  if (isAuthed) return NextResponse.next();

  // Belum login -> redirect ke /member/login?next=<url-sekarang>
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname + (search || ""));
  return NextResponse.redirect(url);
}

// Penting: pastikan matcher sudah mencakup semua turunan /checkout
export const config = {
  matcher: ["/checkout/:path*"],
};
