"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Cookies from "js-cookie";
import { translateObjectStrings } from "@/lib/translate-object";
import type { TranslateBatchOptions } from "@/lib/translate-batch";

type Lang = "en" | "id";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  translateObject: <T>(
    obj: T,
    opts?: Omit<TranslateBatchOptions, "from" | "to">
  ) => Promise<T>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

// gunakan satu sumber kebenaran
const COOKIE_KEY = "agile_lang"; // <— konsisten untuk server & client
const LS_KEY = "agile.lang"; // localStorage biarkan sama

function pickClientPreferredLang(current: Lang): Lang {
  try {
    const fromCookie =
      Cookies.get(COOKIE_KEY) ||
      Cookies.get("lang") || // legacy
      Cookies.get("agile.lang"); // legacy (punya titik)
    if (fromCookie === "id" || fromCookie === "en") return fromCookie as Lang;
  } catch {}
  try {
    const ls = localStorage.getItem(LS_KEY);
    if (ls === "id" || ls === "en") return ls as Lang;
  } catch {}
  const nav = (
    typeof navigator !== "undefined" ? navigator.language : ""
  )?.toLowerCase();
  if (nav?.startsWith("id")) return "id";
  return current;
}

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    const preferred = pickClientPreferredLang(initialLang);
    if (preferred !== lang) setLangState(preferred);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, lang);
    } catch {}
    // tulis cookie utama + legacy untuk kompatibilitas
    Cookies.set(COOKIE_KEY, lang, { path: "/", sameSite: "Lax" });
    Cookies.set("lang", lang, { path: "/", sameSite: "Lax" }); // legacy
    Cookies.set("agile.lang", lang, { path: "/", sameSite: "Lax" }); // legacy

    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", lang);
      (document.documentElement as HTMLElement).dataset.lang = lang;
    }
    window.dispatchEvent(
      new CustomEvent("agile:lang-changed", { detail: { lang } })
    );
  }, [lang]);

  const api = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang: (l: Lang) => setLangState(l),
      translateObject: async <T,>(
        obj: T,
        opts?: Omit<TranslateBatchOptions, "from" | "to">
      ) => {
        const from = lang;
        const to = lang;
        if (from === to) return structuredClone(obj);
        return translateObjectStrings(obj as any, { from, to, ...opts });
      },
    }),
    [lang]
  );

  return (
    <LanguageContext.Provider value={api}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error("useLanguage must be used within <LanguageProvider>");
  return ctx;
}
