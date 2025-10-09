// components/AutoT.tsx
"use client";

import { useEffect, useState } from "react";
import { translateBatch } from "@/lib/auto-translate";

function getTarget(): "id" | "en" {
  const m = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  const v = m ? decodeURIComponent(m[1]) : "id";
  return v === "en" ? "en" : "id";
}

export function AutoT({
  text,
  source = "en",
  className,
}: {
  text: string;
  source?: "id" | "en";
  className?: string;
}) {
  const [out, setOut] = useState(text);

  useEffect(() => {
    const target = getTarget();
    if (target === source) {
      setOut(text);
      return;
    }

    let stop = false;
    (async () => {
      try {
        const map = await translateBatch([text], target, "text", source);
        const next = map.get(text) ?? text;
        if (!stop) setOut(next);
        // Debug ringkas
        // console.log("[i18n] target:", target, "source:", source, "→", next);
      } catch {
        if (!stop) setOut(text);
      }
    })();

    return () => {
      stop = true;
    };
  }, [text, source]);

  return <span className={className}>{out}</span>;
}

export function AutoTHtml({
  html,
  source = "en",
  className,
}: {
  html: string;
  source?: "id" | "en";
  className?: string;
}) {
  const [out, setOut] = useState(html);

  useEffect(() => {
    const target = getTarget();
    if (target === source) {
      setOut(html);
      return;
    }

    let stop = false;
    (async () => {
      try {
        const map = await translateBatch([html], target, "html", source);
        const next = map.get(html) ?? html;
        if (!stop) setOut(next);
      } catch {
        if (!stop) setOut(html);
      }
    })();

    return () => {
      stop = true;
    };
  }, [html, source]);

  return (
    <span className={className} dangerouslySetInnerHTML={{ __html: out }} />
  );
}
