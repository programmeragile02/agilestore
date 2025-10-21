"use client";

import { useEffect, useRef } from "react";
import { translateBatch } from "@/lib/easy-translate";

type Lang = "id" | "en";
const SKIP = "script,style,code,pre,textarea,[data-no-i18n]";

function getLocale(): Lang {
  if (typeof document === "undefined") return "id";
  const m = document.cookie.match(/(?:^|;\\s*)NEXT_LOCALE=(id|en)(?:;|$)/);
  return (m?.[1] as Lang) || "id";
}

export default function AutoTranslateClient() {
  const currentLang = useRef<Lang>("id");

  useEffect(() => {
    currentLang.current = getLocale();

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );
    const nodes: Text[] = [];
    let n: Node | null;
    while ((n = walker.nextNode())) {
      const el = (n.parentElement || undefined) as HTMLElement | undefined;
      if (!el || el.closest(SKIP)) continue;
      const value = n.nodeValue?.trim();
      if (value && /[A-Za-z]/.test(value)) nodes.push(n as Text);
    }

    const texts = Array.from(
      new Set(nodes.map((n) => n.nodeValue?.trim() || ""))
    ).filter(Boolean);
    if (!texts.length) return;

    translateBatch(texts, currentLang.current).then((map) => {
      for (const node of nodes) {
        const original = node.nodeValue?.trim();
        if (!original) continue;
        const tr = map[original];
        if (tr && tr !== original) node.nodeValue = tr;
      }
    });
  }, []);

  return null;
}
