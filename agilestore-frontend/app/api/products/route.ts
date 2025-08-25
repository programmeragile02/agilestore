import { NextResponse } from "next/server"

// Mock product data - replace with database queries later
const products = [
  {
    id: 1,
    name: "Rent Vix Pro",
    slug: "rent-vix-pro",
    shortDescription: "Smart rental management system with GPS, CCTV, and fuel monitoring.",
    longDescription:
      "Complete rental fleet management solution with real-time tracking, security monitoring, and comprehensive reporting.",
    heroImage: "/placeholder.svg?height=600&width=800",
    category: "Fleet Management",
    features: [
      "Real-time GPS tracking",
      "CCTV integration",
      "Fuel monitoring",
      "Maintenance scheduling",
      "Customer management",
      "Reporting & analytics",
    ],
    packages: ["starter", "professional", "enterprise"],
    durations: [1, 6, 12],
    status: "active",
  },
  {
    id: 2,
    name: "Ayo Hidupkan Rumah Ibadah",
    slug: "ayo-hidupkan-rumah-ibadah",
    shortDescription: "Donation and activity management app for places of worship.",
    longDescription:
      "Digital transformation solution for religious organizations to manage donations, events, and community engagement.",
    heroImage: "/placeholder.svg?height=600&width=800",
    category: "Religious Management",
    features: [
      "Online donation processing",
      "Event management",
      "Member directory",
      "Financial reporting",
      "Communication tools",
      "Prayer schedule",
    ],
    packages: ["starter", "professional", "enterprise"],
    durations: [1, 6, 12],
    status: "active",
  },
  {
    id: 3,
    name: "Absen Fast",
    slug: "absen-fast",
    shortDescription: "Fast and reliable employee attendance system with face recognition.",
    longDescription:
      "AI-powered attendance tracking system with facial recognition, real-time monitoring, and comprehensive reporting.",
    heroImage: "/placeholder.svg?height=600&width=800",
    category: "HR Management",
    features: [
      "Face recognition",
      "Real-time tracking",
      "Anti-fraud protection",
      "Mobile app",
      "Payroll integration",
      "Advanced reporting",
    ],
    packages: ["starter", "professional", "enterprise"],
    durations: [1, 6, 12],
    status: "active",
  },
  {
    id: 4,
    name: "Salesman Apps",
    slug: "salesman-apps",
    shortDescription: "Mobile CRM for sales teams to manage leads, visits, and orders.",
    longDescription:
      "Comprehensive mobile CRM solution designed for field sales teams with lead management, visit tracking, and order processing.",
    heroImage: "/placeholder.svg?height=600&width=800",
    category: "Sales Management",
    features: [
      "Lead management",
      "GPS visit tracking",
      "Order processing",
      "Customer database",
      "Sales analytics",
      "Offline capability",
    ],
    packages: ["starter", "professional", "enterprise"],
    durations: [1, 6, 12],
    status: "active",
  },
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: products,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 })
  }
}
