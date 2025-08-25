import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Basic",
    price: "$29",
    period: "/month",
    description: "Perfect for small teams getting started with agile workflows",
    features: [
      "Up to 5 team members",
      "Basic project management",
      "Email support",
      "10GB storage",
      "Standard templates",
    ],
    popular: false,
  },
  {
    name: "Premium",
    price: "$79",
    period: "/month",
    description: "Ideal for growing teams that need advanced collaboration features",
    features: [
      "Up to 25 team members",
      "Advanced project management",
      "Priority support",
      "100GB storage",
      "Custom templates",
      "Analytics dashboard",
      "API access",
    ],
    popular: true,
  },
  {
    name: "Ultimate",
    price: "$149",
    period: "/month",
    description: "Enterprise-grade solution for large organizations",
    features: [
      "Unlimited team members",
      "Enterprise project management",
      "24/7 dedicated support",
      "Unlimited storage",
      "Custom integrations",
      "Advanced analytics",
      "White-label options",
      "SSO & security features",
    ],
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif font-bold text-3xl sm:text-4xl text-foreground mb-4">Choose Your Plan</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your team's needs. All plans include our core features with 30-day money-back
            guarantee.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.popular ? "border-primary shadow-lg scale-105" : "border-border"
              } transition-all duration-300 hover:shadow-lg`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-white">
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-6">
                <CardTitle className="font-serif font-bold text-2xl text-foreground">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription className="mt-2 text-muted-foreground">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-accent mr-3 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                      : "bg-background border border-border text-foreground hover:bg-muted"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
