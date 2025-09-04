"use client";

import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { User as UserIcon, UserCircle, LogOut, Settings } from "lucide-react";
import { getCustomerMe, logoutCustomer } from "@/lib/api";

export default function AuthButtons() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await getCustomerMe();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutCustomer();
      document.cookie = "customer_auth=; Path=/; Max-Age=0; SameSite=Lax";
      setUser(null);
      toast({ title: "Signed out", description: "See you again!" });
    } finally {
      router.push("/");
    }
  };

  if (loading) {
    return <Skeleton className="h-10 w-10 rounded-full bg-muted" />;
  }

  if (!user) {
    return (
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" className="cursor-pointer">
          <Link href="/login">Login</Link>
        </Button>

        <Button
          size="sm"
          className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 cursor-pointer"
        >
          <Link href="/register">Register</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-10 h-10 rounded-full overflow-hidden border border-border bg-muted
                     flex items-center justify-center ring-0 transition hover:scale-[1.02] cursor-pointer"
          aria-label="Open profile menu"
        >
          {user.profile_photo_url ? (
            <Image
              src={user.profile_photo_url}
              alt="Profile"
              width={40}
              height={40}
              className="object-cover w-10 h-10"
            />
          ) : (
            <UserIcon className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-[220px] rounded-xl border border-border/70 shadow-lg
                   backdrop-blur bg-popover/95 p-2"
      >
        {/* Header */}
        <DropdownMenuLabel className="px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium leading-none">
                {user.full_name}
              </p>
              {user.email && (
                <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                  {user.email}
                </p>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Items */}
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-black"
          onClick={() => router.push("/my-account")}
        >
          <Settings className="h-4 w-4 hover:text-white" />
          My Account
        </DropdownMenuItem>

        {/* Logout – merah */}
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 font-semibold"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 text-red-600 text" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
