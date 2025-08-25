import Link from "next/link"
import { Button } from "@/components/ui/button"

export function ProductTopBar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500"></div>
            <span className="font-bold text-gray-900">Rent Vix Pro</span>
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="#contact">Contact</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/member">Sign In</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
