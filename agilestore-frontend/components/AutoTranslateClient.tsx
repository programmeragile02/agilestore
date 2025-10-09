// "use client";

// import { useEffect } from "react";
// import { translateBatch } from "@/lib/auto-translate";

// type Lang = "id" | "en";

// function getLocale(): "id" | "en" {
//   if (typeof document === "undefined") return "id";
//   const m = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
//   const fromCookie = m ? decodeURIComponent(m[1]) : "";
//   if (fromCookie === "en" || fromCookie === "id") return fromCookie as any;

//   // fallback: bahasa browser
//   const nav = (navigator.language || "id").slice(0, 2);
//   return nav === "en" || nav === "ms" ? (nav as any) : "id";
// }

// function shouldSkip(node: Node): boolean {
//   if (node.nodeType !== Node.TEXT_NODE) return true;
//   const text = node.nodeValue ?? "";
//   const trimmed = text.trim();
//   if (!trimmed) return true;
//   if (trimmed.length <= 1) return true;
//   if (/^[0-9\s.,:;/%()+\-]+$/.test(trimmed)) return true;
//   const el = node.parentElement;
//   if (!el) return true;
//   const tag = el.tagName.toLowerCase();
//   if (
//     [
//       "script",
//       "style",
//       "code",
//       "pre",
//       "kbd",
//       "noscript",
//       "textarea",
//       "input",
//     ].includes(tag)
//   )
//     return true;
//   if (el.hasAttribute("data-i18n-skip")) return true;
//   return false;
// }

// function collectTextNodes(root: Element): Text[] {
//   const out: Text[] = [];
//   const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
//     acceptNode: (n) =>
//       shouldSkip(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
//   });
//   let cur: Node | null;
//   while ((cur = walker.nextNode())) out.push(cur as Text);
//   return out;
// }

// export default function AutoTranslateClient() {
//   useEffect(() => {
//     const lang = getLocale();
//     if (lang === "id") return; // anggap sumber bahasa ID, lewati

//     let busy = false;

//     const run = async (root: Element) => {
//       if (busy) return;
//       busy = true;
//       try {
//         const nodes = collectTextNodes(root);
//         const originals = Array.from(
//           new Set(nodes.map((n) => n.nodeValue!.trim()).filter(Boolean))
//         );
//         if (originals.length === 0) return;

//         const map = await translateBatch(originals, lang);
//         for (const n of nodes) {
//           const src = n.nodeValue?.trim();
//           if (!src) continue;
//           const t = map.get(src);
//           if (!t) continue;
//           const leading = (n.nodeValue ?? "").match(/^\s*/)?.[0] ?? "";
//           const trailing = (n.nodeValue ?? "").match(/\s*$/)?.[0] ?? "";
//           n.nodeValue = leading + t + trailing;
//         }
//       } finally {
//         busy = false;
//       }
//     };

//     // awal
//     run(document.body);

//     // pantau perubahan DOM (komponen yang muncul belakangan)
//     const mo = new MutationObserver((muts) => {
//       const targets: Element[] = [];
//       muts.forEach((m) => {
//         if (m.type === "childList") {
//           m.addedNodes.forEach((n) => {
//             if (n.nodeType === Node.ELEMENT_NODE) targets.push(n as Element);
//           });
//         } else if (m.type === "characterData") {
//           const el = (m.target as CharacterData).parentElement;
//           if (el) targets.push(el);
//         }
//       });
//       Array.from(new Set(targets)).forEach((el) => run(el));
//     });
//     mo.observe(document.body, {
//       subtree: true,
//       childList: true,
//       characterData: true,
//     });

//     return () => mo.disconnect();
//   }, []);

//   return null;
// }
// components/AutoTranslateClient.tsx
"use client";

import { useEffect, useRef } from "react";

type Lang = "id" | "en";
const BATCH_SIZE = 50;
const SKIP_SELECTOR =
  "script,style,code,pre,textarea,input,svg,canvas,iframe,[data-no-i18n]";

function getLocale(): Lang {
  const m = document.cookie.match(/(?:^|;\s*)locale=(id|en)(?:;|$)/);
  return (m?.[1] as Lang) || "id";
}

function setHtmlLang(locale: Lang) {
  if (document.documentElement.lang !== locale) {
    document.documentElement.lang = locale;
  }
}

function collectTextNodes(root: Node, out: Text[]) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = (node.parentElement || undefined) as
        | HTMLElement
        | undefined;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
      const s = node.nodeValue?.trim();
      if (!s) return NodeFilter.FILTER_REJECT;
      // Hindari teks “kosmetik”
      if (/^[\s\-–—•·|:/,.()]+$/.test(s)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) out.push(n as Text);
}

async function translateBatch(texts: string[], target: Lang, source?: Lang) {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts, target, source, format: "text" }),
  });
  if (!res.ok) throw new Error("translate failed");
  const json = await res.json();
  return (json?.data as string[]) || texts;
}

export default function AutoTranslateClient() {
  const cacheRef = useRef<Map<string, string>>(new Map());
  const inFlightRef = useRef<Set<string>>(new Set());
  const localeRef = useRef<Lang>("id");
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    const locale = getLocale();
    localeRef.current = locale;
    setHtmlLang(locale);

    const cache = cacheRef.current;

    const translateNodes = async (nodes: Text[]) => {
      // siapkan batch: ambil teks unik yang belum ada di cache & belum in-flight
      const uniq = Array.from(
        new Set(nodes.map((t) => t.nodeValue?.trim() || "").filter(Boolean))
      );
      const todo = uniq.filter(
        (s) => !cache.has(s) && !inFlightRef.current.has(s)
      );
      if (!todo.length) return;

      // batasi per batch biar aman
      for (let i = 0; i < todo.length; i += BATCH_SIZE) {
        const slice = todo.slice(i, i + BATCH_SIZE);
        slice.forEach((s) => inFlightRef.current.add(s));
        try {
          const translated = await translateBatch(slice, localeRef.current);
          translated.forEach((tr, idx) => {
            cache.set(slice[idx], tr);
          });
        } catch {
          // kalau gagal, buang dari inflight tanpa cache
        } finally {
          slice.forEach((s) => inFlightRef.current.delete(s));
        }
      }

      // apply hasil ke nodes yang relevan
      nodes.forEach((n) => {
        const src = n.nodeValue?.trim() || "";
        if (!src) return;
        const tr = cache.get(src);
        if (!tr) return;
        // hanya ganti bila berbeda dan parent masih valid
        if (
          n.nodeValue !== tr &&
          n.parentElement &&
          !n.parentElement.closest(SKIP_SELECTOR)
        ) {
          n.nodeValue = tr;
        }
      });
    };

    const initialNodes: Text[] = [];
    collectTextNodes(document.body, initialNodes);
    translateNodes(initialNodes);

    // observe DOM untuk elemen baru / perubahan teks
    const ob = new MutationObserver((mutations) => {
      const changed: Text[] = [];
      for (const m of mutations) {
        if (m.type === "childList") {
          m.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              const t = node as Text;
              if ((t.nodeValue || "").trim()) changed.push(t);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              collectTextNodes(node, changed);
            }
          });
        } else if (
          m.type === "characterData" &&
          m.target.nodeType === Node.TEXT_NODE
        ) {
          const t = m.target as Text;
          if ((t.nodeValue || "").trim()) changed.push(t);
        }
      }
      if (changed.length) translateNodes(changed);
    });

    ob.observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true,
    });
    observerRef.current = ob;

    return () => {
      ob.disconnect();
    };
  }, []);

  // Dengarkan perubahan cookie locale (sederhana: polling ringan)
  useEffect(() => {
    let last = getLocale();
    const id = window.setInterval(() => {
      const cur = getLocale();
      if (cur !== last) {
        last = cur;
        localeRef.current = cur;
        setHtmlLang(cur);
        // reset cache supaya re-translate pakai bahasa baru
        cacheRef.current.clear();
        const nodes: Text[] = [];
        collectTextNodes(document.body, nodes);
        // paksa retranslate
        (async () => {
          const uniq = Array.from(
            new Set(nodes.map((t) => t.nodeValue?.trim() || "").filter(Boolean))
          );
          // buang yang tampaknya sudah terjemahan (opsional)
          uniq.forEach((s) => cacheRef.current.delete(s));
          // trigger ulang
          const evt = new MutationObserver(() => {});
          evt.observe(document.body, { childList: true });
          evt.disconnect();
        })();
      }
    }, 800);
    return () => clearInterval(id);
  }, []);

  return null;
}
