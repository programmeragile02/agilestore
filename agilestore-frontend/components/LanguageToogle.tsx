"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function LanguageToggle({
  className = "",
}: {
  className?: string;
}) {
  const [lang, setLang] = useState<"id" | "en">("id");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\\s*)NEXT_LOCALE=(id|en)(?:;|$)/);
    const current = (m?.[1] as "id" | "en") || "id";
    setLang(current);
  }, []);

  const switchLang = async () => {
    const next = lang === "id" ? "en" : "id";
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${
      60 * 60 * 24 * 365
    }`;
    setLang(next);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    location.reload(); // reload untuk retrigger translate
  };

  return (
    <Button
      variant="outline"
      onClick={switchLang}
      className={`gap-2 rounded-xl ${className}`}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Translating…
        </>
      ) : lang === "id" ? (
        <>🇬🇧 English</>
      ) : (
        <>🇮🇩 Indonesia</>
      )}
    </Button>
  );
}
