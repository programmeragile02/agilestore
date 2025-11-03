// scripts/extract-glossary.ts
import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const START_URL = process.argv[2] || "https://agile-dev.top";
const MAX_PAGES = Number(process.argv[3] || 30);
const SAME_ORIGIN_ONLY = true;

const SKIP =
  "script,style,code,pre,textarea,input,svg,canvas,iframe,[data-no-i18n],[contenteditable='true']";

function normalize(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const origin = new URL(START_URL).origin;
  const queue: string[] = [START_URL];
  const visited = new Set<string>();
  const texts = new Map<string, number>();

  while (queue.length && visited.size < MAX_PAGES) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });

      // Kumpulkan link untuk crawl berikutnya
      const links = await page.$$eval("a[href]", (as) =>
        as.map((a) => (a as HTMLAnchorElement).href)
      );

      for (const href of links) {
        try {
          const u = new URL(href);
          if (SAME_ORIGIN_ONLY && u.origin !== origin) continue;
          // dedup & hindari fragment-only
          if (!visited.has(u.href) && !queue.includes(u.href))
            queue.push(u.href);
        } catch {}
      }

      // Ambil teks “pendek” (UI strings)
      const found = await page.evaluate((SKIP) => {
        function collect(root: Node) {
          const out: string[] = [];
          const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
              const el = node.parentElement as HTMLElement | null;
              if (!el || el.closest(SKIP)) return NodeFilter.FILTER_REJECT;
              const raw = node.nodeValue ?? "";
              const t = raw.replace(/\s+/g, " ").trim();
              if (!t) return NodeFilter.FILTER_REJECT;

              // buang teks panjang (paragraf), URL, angka murni, dsb
              if (t.length < 1 || t.length > 60)
                return NodeFilter.FILTER_REJECT;
              if (/^https?:\/\//i.test(t)) return NodeFilter.FILTER_REJECT;
              if (/^[\d\s.,:%\-–—/()]+$/.test(t))
                return NodeFilter.FILTER_REJECT;
              if (/^[\s\-–—•·|:/,;.!?()]+$/.test(t))
                return NodeFilter.FILTER_REJECT;

              return NodeFilter.FILTER_ACCEPT;
            },
          });
          let n: Node | null;
          while ((n = w.nextNode())) out.push((n as Text).nodeValue || "");
          return out;
        }
        return collect(document.body);
      }, SKIP);

      for (const t of found) {
        const s = normalize(t);
        texts.set(s, (texts.get(s) || 0) + 1);
      }

      console.log(`✓ ${url}  (+${found.length} strings)`);
    } catch (e) {
      console.warn(`! gagal buka: ${url}`);
    }
  }

  // Sort by frequency desc, then alpha
  const entries = Array.from(texts.entries()).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );

  const outDir = path.resolve(process.cwd(), "glossary_out");
  fs.mkdirSync(outDir, { recursive: true });

  // JSON
  fs.writeFileSync(
    path.join(outDir, "kandidat.json"),
    JSON.stringify(
      entries.map(([text, freq]) => ({ text, freq })),
      null,
      2
    ),
    "utf8"
  );

  // CSV (text,freq,to_en,to_id)
  const csv = ["text,freq,to_en,to_id"]
    .concat(entries.map(([t, f]) => `"${t.replace(/"/g, '""')}",${f},,`))
    .join("\n");
  fs.writeFileSync(path.join(outDir, "kandidat.csv"), csv, "utf8");

  console.log(
    `\nSelesai. Cek folder: ${outDir}\n- kandidat.json (semua string & frekuensi)\n- kandidat.csv (siap diisi kolom to_en/to_id)`
  );

  await browser.close();
})();
