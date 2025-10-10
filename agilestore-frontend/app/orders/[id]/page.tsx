import Header from "@/components/header";
import Footer from "@/components/footer";
import OrderDetailContent from "@/components/orders/OrderDetailContent";

export default async function OrderDetailPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <OrderDetailContent />
      </main>
      <Footer />
    </div>
  );
}
