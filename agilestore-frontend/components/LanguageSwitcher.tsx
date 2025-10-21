"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { selectGoogleLanguage } from "./GooglePageTranslate";

const LANGS = [
  { code: "id" as const, label: "Indonesia", flag: "🇮🇩" },
  { code: "en" as const, label: "English", flag: "🇬🇧" },
];

const COOKIE_NAME = "NEXT_LOCALE";

function readCookie(name: string): string | null {
  const m = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]+)(?:;|$)`, "i")
  );
  return m ? decodeURIComponent(m[1]) : null;
}

export default function LanguageSwitcher({
  className = "",
}: {
  className?: string;
}) {
  const [current, setCurrent] = useState<"id" | "en">("id");
  const active = LANGS.find((l) => l.code === current)!;

  useEffect(() => {
    const fromCookie = readCookie(COOKIE_NAME);
    const nav = (navigator.language || "id").slice(0, 2);
    const detected =
      fromCookie === "en" || fromCookie === "id"
        ? (fromCookie as "id" | "en")
        : nav === "en"
        ? "en"
        : "id";
    setCurrent(detected);

    // sinkronkan terjemahan Google di awal
    selectGoogleLanguage(detected);
  }, []);

  const setLang = (code: "id" | "en") => {
    // simpan preferensi (opsional)
    document.cookie = `${COOKIE_NAME}=${code}; path=/; max-age=${
      60 * 60 * 24 * 365
    }`;
    setCurrent(code);
    // trigger Google translate
    selectGoogleLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`h-9 gap-2 rounded-xl px-3 ${className}`}
        >
          <span className="text-base">{active.flag}</span>
          <span className="hidden sm:inline">{active.label}</span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LANGS.filter((l) => l.code !== active.code).map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)}>
            <span className="mr-2">{l.flag}</span>
            <span className="font-medium">{l.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
