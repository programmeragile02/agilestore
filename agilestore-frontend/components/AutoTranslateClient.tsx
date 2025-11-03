"use client";

/**
 * Minimal client that updates <html lang> (done by LanguageProvider) and
 * provides an optional progressive enhancement: if elements have
 * data-autotranslate, we will translate their innerText using your batch API
 * when the language changes.
 *
 * Opt-in per element to avoid double translating React-controlled text.
 */
import { useEffect } from "react";
import { useLanguage } from "./LanguageProvider";
import { translateBatch } from "@/lib/translate-batch";

export default function AutoTranslateClient() {
  const { lang } = useLanguage();

  useEffect(() => {
    // Translate only opt-in nodes
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-autotranslate]")
    );
    if (nodes.length === 0) return;

    // collect original text (cached via dataset)
    const originals = nodes.map((el) => {
      const existing = el.dataset.i18nOriginal;
      const text = existing ?? el.innerText;
      if (!existing) el.dataset.i18nOriginal = text;
      return text;
    });

    const from = lang === "en" ? "id" : "en";
    const to = lang;

    // Skip calling API if from==to (e.g., initial render)
    if (from === to) return;

    let aborted = false;
    const controller = new AbortController();

    translateBatch(originals, { from, to, signal: controller.signal })
      .then((translated) => {
        if (aborted) return;
        nodes.forEach((el, i) => {
          el.innerText = translated[i] ?? "";
        });
      })
      .catch(() => {
        /* silent fail to avoid breaking UI */
      });

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [lang]);

  return null;
}
