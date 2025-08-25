import { Button } from "@/components/ui/button"

export default function ProductsHero() {
  return (
    <section className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">All-in-One SaaS Marketplace</h1>
        <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
          Discover powerful solutions designed to streamline your business operations and boost productivity
        </p>
        <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-50 font-semibold px-8 py-3">
          Explore Products
        </Button>
      </div>
    </section>
  )
}
