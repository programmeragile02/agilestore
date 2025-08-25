import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Zap,
  Users,
  BarChart3,
  Shield,
  MapPin,
  Camera,
  Heart,
  Calendar,
  Scan,
  Clock,
  ShoppingCart,
  TrendingUp,
  Fuel,
  LandPlotIcon as Analytics,
} from "lucide-react"

const iconMap = {
  Zap,
  Users,
  BarChart3,
  Shield,
  MapPin,
  Camera,
  Heart,
  Calendar,
  Scan,
  Clock,
  ShoppingCart,
  TrendingUp,
  Fuel,
  Analytics,
}

interface Feature {
  icon: string
  title: string
  description: string
}

interface FeatureHighlightsProps {
  features: Feature[]
}

export function FeatureHighlights({ features }: FeatureHighlightsProps) {
  return (
    <section className="py-16 sm:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif font-bold text-3xl sm:text-4xl text-gray-900 mb-4">Key Features</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful capabilities designed to transform your workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon as keyof typeof iconMap] || Zap
            return (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-all duration-300 border-gray-200 bg-white"
              >
                <CardHeader className="pb-4">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="font-serif font-semibold text-xl text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
