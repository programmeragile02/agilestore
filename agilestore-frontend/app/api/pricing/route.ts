import { type NextRequest, NextResponse } from "next/server"

// Mock pricing matrix - replace with database queries later
const pricingMatrix = {
  "rent-vix-pro": {
    starter: { 1: 149000, 6: 799000, 12: 1499000 },
    professional: { 1: 249000, 6: 1299000, 12: 2399000 },
    enterprise: { 1: 399000, 6: 2199000, 12: 3999000 },
  },
  "ayo-hidupkan-rumah-ibadah": {
    starter: { 1: 99000, 6: 549000, 12: 999000 },
    professional: { 1: 199000, 6: 1099000, 12: 1999000 },
    enterprise: { 1: 299000, 6: 1649000, 12: 2999000 },
  },
  "absen-fast": {
    starter: { 1: 129000, 6: 699000, 12: 1299000 },
    professional: { 1: 229000, 6: 1249000, 12: 2299000 },
    enterprise: { 1: 349000, 6: 1899000, 12: 3499000 },
  },
  "salesman-apps": {
    starter: { 1: 179000, 6: 949000, 12: 1799000 },
    professional: { 1: 279000, 6: 1499000, 12: 2699000 },
    enterprise: { 1: 429000, 6: 2349000, 12: 4299000 },
  },
}

const packageDetails = {
  starter: {
    name: "Starter",
    description: "Perfect for small teams getting started",
    features: ["Up to 5 users", "Basic features", "Email support", "Mobile app access"],
  },
  professional: {
    name: "Professional",
    description: "Ideal for growing businesses",
    features: ["Up to 25 users", "Advanced features", "Priority support", "Custom integrations", "Advanced reporting"],
  },
  enterprise: {
    name: "Enterprise",
    description: "For large organizations",
    features: ["Unlimited users", "All features", "24/7 support", "Custom development", "Dedicated account manager"],
  },
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productSlug = searchParams.get("product")

    if (!productSlug) {
      return NextResponse.json({ success: false, error: "Product parameter is required" }, { status: 400 })
    }

    const productPricing = pricingMatrix[productSlug as keyof typeof pricingMatrix]

    if (!productPricing) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
    }

    // Format pricing data with package details
    const formattedPricing = Object.entries(productPricing).map(([packageKey, prices]) => ({
      package: packageKey,
      ...packageDetails[packageKey as keyof typeof packageDetails],
      pricing: prices,
    }))

    return NextResponse.json({
      success: true,
      data: {
        product: productSlug,
        packages: formattedPricing,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch pricing" }, { status: 500 })
  }
}
