import { type NextRequest, NextResponse } from "next/server"

// Mock order data - replace with database queries later
const mockOrders = {
  "ORD-1234567890": {
    id: "ORD-1234567890",
    customerId: "CUST-1234567890",
    contact: {
      fullName: "John Doe",
      email: "john.doe@example.com",
      phone: "+62 812 3456 7890",
      company: "PT. Example Company",
    },
    plan: {
      product: "rent-vix-pro",
      productName: "Rent Vix Pro",
      package: "professional",
      duration: 12,
      currency: "IDR",
      taxMode: "inclusive",
    },
    payment: {
      method: "card",
      transactionId: "TXN-1234567890",
      amount: 2399000,
      currency: "IDR",
      status: "completed",
    },
    voucher: {
      code: "WELCOME10",
      discount: 50000,
    },
    status: "active",
    createdAt: "2024-01-15T10:30:00Z",
    expiresAt: "2025-01-15T10:30:00Z",
    invoiceUrl: "/api/invoice/INV-1234567890",
  },
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id

    // In a real app, query from database
    const order = mockOrders[orderId as keyof typeof mockOrders]

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: order,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch order" }, { status: 500 })
  }
}
