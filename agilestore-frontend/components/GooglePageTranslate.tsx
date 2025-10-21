"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

export default function GooglePageTranslate() {
  useEffect(() => {
    // Pastikan container ada
    if (!document.getElementById("google_translate_element")) {
      const div = document.createElement("div");
      div.id = "google_translate_element";
      div.style.position = "fixed";
      div.style.bottom = "0";
      div.style.right = "0";
      div.style.zIndex = "0";
      document.body.appendChild(div);
    }

    // CSS sembunyikan banner
    const style = document.createElement("style");
    style.innerHTML = `
      .goog-te-banner-frame.skiptranslate { display:none !important; }
      body { top: 0px !important; }
      #google_translate_element, .goog-te-gadget { height:0; overflow:hidden; }
      .goog-logo-link, .goog-te-gadget span { display:none !important; }
    `;
    document.head.appendChild(style);

    // Function init Google Translate
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "id",
          includedLanguages: "id,en",
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        "google_translate_element"
      );
    };

    // Load script Google Translate (dengan retry)
    const loadScript = () => {
      if (document.getElementById("google-translate-script")) return;
      const s = document.createElement("script");
      s.id = "google-translate-script";
      s.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      s.async = true;
      document.head.appendChild(s);
    };

    loadScript();

    // Retry init bila gagal (kadang DOM-nya delay di React)
    const interval = setInterval(() => {
      const combo = document.querySelector(".goog-te-combo");
      if (!combo && window.google?.translate?.TranslateElement) {
        window.googleTranslateElementInit?.();
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return null;
}

// =============================
// Fungsi programatik pilih bahasa
// =============================
export function selectGoogleLanguage(lang: "id" | "en") {
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (combo && combo.value !== lang) {
    combo.value = lang;
    combo.dispatchEvent(new Event("change"));
  }
}
