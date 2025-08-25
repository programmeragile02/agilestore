import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, ShoppingCart } from "lucide-react"

const products = [
  {
    id: 1,
    title: "Agile Project Manager Pro",
    description: "Complete project management solution with advanced analytics and team collaboration tools.",
    price: "$299",
    originalPrice: "$399",
    rating: 4.9,
    reviews: 127,
    image: "/placeholder.svg?height=200&width=300",
    badge: "Best Seller",
  },
  {
    id: 2,
    title: "Team Collaboration Suite",
    description: "Streamline communication and boost productivity with integrated chat, video, and file sharing.",
    price: "$199",
    originalPrice: "$249",
    rating: 4.8,
    reviews: 89,
    image: "/placeholder.svg?height=200&width=300",
    badge: "Popular",
  },
  {
    id: 3,
    title: "Analytics Dashboard Elite",
    description: "Advanced data visualization and reporting tools for data-driven decision making.",
    price: "$399",
    originalPrice: "$499",
    rating: 4.9,
    reviews: 156,
    image: "/placeholder.svg?height=200&width=300",
    badge: "New",
  },
  {
    id: 4,
    title: "Workflow Automation Kit",
    description: "Automate repetitive tasks and create custom workflows to maximize team efficiency.",
    price: "$149",
    originalPrice: "$199",
    rating: 4.7,
    reviews: 73,
    image: "/placeholder.svg?height=200&width=300",
    badge: "Sale",
  },
]

export function ProductShowcase() {
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif font-bold text-3xl sm:text-4xl text-foreground mb-4">Featured Products</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our most popular solutions designed to transform your agile workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 border-border">
              <div className="relative overflow-hidden rounded-t-lg">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-3 left-3 bg-gradient-to-r from-primary to-secondary text-white">
                  {product.badge}
                </Badge>
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="font-serif font-semibold text-lg text-foreground line-clamp-2">
                  {product.title}
                </CardTitle>
                <div className="flex items-center space-x-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.rating} ({product.reviews})
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <CardDescription className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {product.description}
                </CardDescription>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg text-foreground">{product.price}</span>
                    <span className="text-sm text-muted-foreground line-through">{product.originalPrice}</span>
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
