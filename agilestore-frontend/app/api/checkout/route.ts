import { type NextRequest, NextResponse } from "next/server"

interface CheckoutRequest {
  contact: {
    fullName: string
    email: string
    phone: string
    company?: string
  }
  plan: {
    product: string
    package: string
    duration: number
    currency: string
    taxMode: "inclusive" | "exclusive"
  }
  payment: {
    method: "card" | "bank_transfer" | "ewallet"
    cardDetails?: {
      number: string
      expiry: string
      cvv: string
    }
  }
  voucher?: {
    code: string
    discount: number
  }
  amount: number
}

// Mock payment processing - replace with actual payment gateway integration
const processPayment = async (paymentData: CheckoutRequest) => {
  // Simulate payment processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Mock payment success/failure (90% success rate)
  const isSuccess = Math.random() > 0.1

  if (isSuccess) {
    return {
      success: true,
      transactionId: `TXN-${Date.now()}`,
      paymentMethod: paymentData.payment.method,
      amount: paymentData.amount,
      currency: paymentData.plan.currency,
    }
  } else {
    throw new Error("Payment processing failed. Please try again.")
  }
}

// Mock order creation
const createOrder = async (orderData: CheckoutRequest & { transactionId: string }) => {
  const orderId = `ORD-${Date.now()}`

  // In a real app, save to database
  const order = {
    id: orderId,
    customerId: `CUST-${Date.now()}`,
    contact: orderData.contact,
    plan: orderData.plan,
    payment: {
      method: orderData.payment.method,
      transactionId: orderData.transactionId,
      amount: orderData.amount,
      currency: orderData.plan.currency,
      status: "completed",
    },
    voucher: orderData.voucher,
    status: "active",
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + orderData.plan.duration * 30 * 24 * 60 * 60 * 1000).toISOString(),
  }

  return order
}

// Mock notification sending
const sendNotifications = async (order: any) => {
  // In a real app, send email and WhatsApp notifications
  console.log(`Sending notifications for order ${order.id} to ${order.contact.email}`)

  return {
    email: { sent: true, messageId: `EMAIL-${Date.now()}` },
    whatsapp: { sent: true, messageId: `WA-${Date.now()}` },
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json()

    // Validate required fields
    if (!body.contact?.fullName || !body.contact?.email || !body.contact?.phone) {
      return NextResponse.json({ success: false, error: "Contact information is required" }, { status: 400 })
    }

    if (!body.plan?.product || !body.plan?.package || !body.plan?.duration) {
      return NextResponse.json({ success: false, error: "Plan information is required" }, { status: 400 })
    }

    if (!body.payment?.method) {
      return NextResponse.json({ success: false, error: "Payment method is required" }, { status: 400 })
    }

    // Process payment
    const paymentResult = await processPayment(body)

    // Create order
    const order = await createOrder({
      ...body,
      transactionId: paymentResult.transactionId,
    })

    // Send notifications
    const notifications = await sendNotifications(order)

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        transactionId: paymentResult.transactionId,
        status: "completed",
        redirectUrl: `/order-success?orderId=${order.id}`,
        notifications,
      },
    })
  } catch (error) {
    console.error("Checkout error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Payment processing failed",
        redirectUrl: `/order-failed?error=${encodeURIComponent(error instanceof Error ? error.message : "Unknown error")}`,
      },
      { status: 400 },
    )
  }
}
