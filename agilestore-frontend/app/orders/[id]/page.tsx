// app/orders/[id]/page.tsx
import Header from "@/components/header";
import Footer from "@/components/footer";
import OrderDetailContent from "@/components/orders/OrderDetailContent";
import { cookies } from "next/headers";

// ⬅️ Import langsung LanguageProvider (client)
import { LanguageProvider } from "@/components/LanguageProvider";

export default async function OrderDetailPage() {
  // Ambil bahasa yang dipilih user
  const lang = cookies().get("agile_lang")?.value === "en" ? "en" : "id";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        {/* ⬅️ Bungkus OrderDetailContent dengan LanguageProvider */}
        <LanguageProvider initialLang={lang}>
          <OrderDetailContent />
        </LanguageProvider>
      </main>
      <Footer />
    </div>
  );
}
