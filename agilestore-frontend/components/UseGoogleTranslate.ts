"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

type Lang = "id" | "en";
type Status = "idle" | "loading" | "ready" | "blocked";

const COOKIE = "NEXT_LOCALE";
const SCRIPT_ID = "google-translate-script";
const HOLDER_ID = "google_translate_element";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]+)(?:;|$)`, "i")
  );
  return m ? decodeURIComponent(m[1]) : null;
}
function writeCookie(name: string, val: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${val}; path=/; max-age=${60 * 60 * 24 * 365}`;
}
function getDefaultLang(): Lang {
  if (typeof navigator === "undefined") return "id";
  return (navigator.language || "id").slice(0, 2) === "en" ? "en" : "id";
}
function selectGoogleLanguage(lang: Lang) {
  if (typeof document === "undefined") return false;
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!combo) return false;
  if (combo.value !== lang) combo.value = lang;
  combo.dispatchEvent(new Event("change"));
  return true;
}

function ensureHolder() {
  if (typeof document === "undefined") return;
  if (!document.getElementById(HOLDER_ID)) {
    const div = document.createElement("div");
    div.id = HOLDER_ID;
    div.style.position = "fixed";
    div.style.bottom = "0";
    div.style.right = "0";
    div.style.zIndex = "0";
    document.body.appendChild(div);
  }
}

function injectHiderCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("gt-hide-css")) return;
  const style = document.createElement("style");
  style.id = "gt-hide-css";
  style.innerHTML = `
    .goog-te-banner-frame.skiptranslate{display:none!important;}
    body{top:0!important;}
    #google_translate_element,.goog-te-gadget{height:0;overflow:hidden;}
    .goog-logo-link,.goog-te-gadget span{display:none!important;}
  `;
  document.head.appendChild(style);
}

function removeExistingScript() {
  if (typeof document === "undefined") return;
  const s = document.getElementById(SCRIPT_ID);
  if (s) s.remove();
}

function loadScriptOnce(onLoad: () => void, onError: (why: string) => void) {
  if (typeof document === "undefined") return;
  if (document.getElementById(SCRIPT_ID)) {
    onLoad();
    return;
  }
  const s = document.createElement("script");
  s.id = SCRIPT_ID;
  s.async = true;
  s.src =
    "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  s.onload = onLoad;
  s.onerror = () => onError("script-onerror");
  document.head.appendChild(s);
}

/** cek cepat apakah domain google translate diblok (adblock/CSP/network) */
function canReachTranslate(timeoutMs = 2500): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof Image === "undefined") return resolve(false);
    const img = new Image();
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      resolve(ok);
    };
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.src = "https://translate.googleapis.com/favicon.ico?_=" + Date.now();
    setTimeout(() => finish(false), timeoutMs);
  });
}

export function useGoogleTranslate() {
  const [status, setStatus] = useState<Status>("idle");
  const [reason, setReason] = useState<string>(""); // kenapa blocked
  const [current, setCurrent] = useState<Lang>("id");
  const queueRef = useRef<Lang[]>([]);
  const timeoutRef = useRef<number | null>(null);

  const initWidget = useCallback(async (initialLang: Lang) => {
    if (typeof window === "undefined") return;

    setStatus("loading");
    setReason("");

    // 1) test konektivitas → jika gagal, langsung blocked (tampilkan alasan)
    const reachable = await canReachTranslate();
    if (!reachable) {
      setStatus("blocked");
      setReason(
        "Tidak bisa mengakses translate.googleapis.com — kemungkinan diblokir oleh ad-block/CSP/firewall."
      );
      return;
    }

    // 2) definisikan init
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      // eslint-disable-next-line no-new
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "id",
          includedLanguages: "id,en",
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        HOLDER_ID
      );
    };

    // 3) load script
    loadScriptOnce(
      () => {
        // poll sampai combo muncul
        const poll = window.setInterval(() => {
          const combo = document.querySelector(".goog-te-combo");
          if (combo) {
            window.clearInterval(poll);
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
            setStatus("ready");
            while (queueRef.current.length) {
              const l = queueRef.current.shift()!;
              selectGoogleLanguage(l);
            }
            selectGoogleLanguage(initialLang);
          } else if (window.google?.translate?.TranslateElement) {
            window.googleTranslateElementInit?.();
          }
        }, 300);

        // hard timeout 8s → blocked
        timeoutRef.current = window.setTimeout(() => {
          window.clearInterval(poll);
          setStatus("blocked");
          setReason(
            "Widget tidak muncul (kemungkinan diblokir oleh CSP/frame)."
          );
        }, 8000) as unknown as number;
      },
      (why) => {
        setStatus("blocked");
        setReason(
          why === "script-onerror"
            ? "Script translate.google.com gagal dimuat (diblock/CSP)."
            : "Script gagal dimuat."
        );
      }
    );
  }, []);

  const resetAndRetry = useCallback(() => {
    if (typeof window === "undefined") return;
    removeExistingScript();
    const holder = document.getElementById(HOLDER_ID);
    if (holder) holder.innerHTML = "";
    initWidget(current);
  }, [current, initWidget]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

    ensureHolder();
    injectHiderCSS();

    const fromCookie = readCookie(COOKIE);
    const initial =
      fromCookie === "id" || fromCookie === "en"
        ? (fromCookie as Lang)
        : getDefaultLang();
    setCurrent(initial);

    initWidget(initial);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [initWidget]);

  const setLang = useCallback((lang: Lang) => {
    writeCookie(COOKIE, lang);
    setCurrent(lang);
    if (!selectGoogleLanguage(lang)) {
      queueRef.current.push(lang);
    }
  }, []);

  return {
    ready: status === "ready",
    loading: status === "loading",
    blocked: status === "blocked",
    blockedReason: reason,
    current,
    setLang,
    retry: resetAndRetry,
  };
}
