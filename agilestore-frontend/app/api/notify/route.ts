import { type NextRequest, NextResponse } from "next/server"

interface NotificationRequest {
  type: "email" | "whatsapp" | "both"
  recipient: {
    email?: string
    phone?: string
    name: string
  }
  template: "order_confirmation" | "payment_success" | "account_activation"
  data: {
    orderId?: string
    productName?: string
    amount?: number
    loginUrl?: string
    [key: string]: any
  }
}

// Mock email sending
const sendEmail = async (recipient: string, subject: string, content: string) => {
  // In a real app, integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`Sending email to ${recipient}`)
  console.log(`Subject: ${subject}`)
  console.log(`Content: ${content}`)

  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    success: true,
    messageId: `EMAIL-${Date.now()}`,
    provider: "mock-email-service",
  }
}

// Mock WhatsApp sending
const sendWhatsApp = async (phone: string, message: string) => {
  // In a real app, integrate with WhatsApp Business API
  console.log(`Sending WhatsApp to ${phone}`)
  console.log(`Message: ${message}`)

  // Simulate WhatsApp sending delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  return {
    success: true,
    messageId: `WA-${Date.now()}`,
    provider: "mock-whatsapp-service",
  }
}

// Template generators
const generateEmailContent = (template: string, data: any) => {
  switch (template) {
    case "order_confirmation":
      return {
        subject: `Order Confirmation - ${data.orderId}`,
        content: `
Dear ${data.recipient.name},

Thank you for your purchase! Your order has been confirmed.

Order Details:
- Order ID: ${data.orderId}
- Product: ${data.productName}
- Amount: IDR ${data.amount?.toLocaleString()}

Your account will be activated within 15 minutes.

Best regards,
Agile Store Team
        `,
      }
    case "payment_success":
      return {
        subject: "Payment Successful",
        content: `
Dear ${data.recipient.name},

Your payment has been processed successfully.

Transaction Details:
- Order ID: ${data.orderId}
- Amount: IDR ${data.amount?.toLocaleString()}

Thank you for choosing Agile Store!

Best regards,
Agile Store Team
        `,
      }
    case "account_activation":
      return {
        subject: "Account Activated - Welcome to Agile Store",
        content: `
Dear ${data.recipient.name},

Welcome to Agile Store! Your account has been activated.

You can now access your dashboard at: ${data.loginUrl}

If you have any questions, please don't hesitate to contact our support team.

Best regards,
Agile Store Team
        `,
      }
    default:
      return {
        subject: "Notification from Agile Store",
        content: "Thank you for using Agile Store!",
      }
  }
}

const generateWhatsAppMessage = (template: string, data: any) => {
  switch (template) {
    case "order_confirmation":
      return `🎉 Order Confirmed!

Hi ${data.recipient.name},

Your order ${data.orderId} for ${data.productName} has been confirmed.

Amount: IDR ${data.amount?.toLocaleString()}

Your account will be activated within 15 minutes.

Thank you for choosing Agile Store! 🚀`

    case "payment_success":
      return `✅ Payment Successful!

Hi ${data.recipient.name},

Your payment for order ${data.orderId} has been processed successfully.

Amount: IDR ${data.amount?.toLocaleString()}

Thank you! 🙏`

    case "account_activation":
      return `🎊 Welcome to Agile Store!

Hi ${data.recipient.name},

Your account has been activated! You can now access your dashboard.

Login: ${data.loginUrl}

Need help? Just reply to this message! 💬`

    default:
      return `Hi ${data.recipient.name}, thank you for using Agile Store! 🚀`
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: NotificationRequest = await request.json()

    // Validate required fields
    if (!body.recipient?.name) {
      return NextResponse.json({ success: false, error: "Recipient name is required" }, { status: 400 })
    }

    if (!body.template) {
      return NextResponse.json({ success: false, error: "Template is required" }, { status: 400 })
    }

    const results: any = {}

    // Send email if requested and email is provided
    if ((body.type === "email" || body.type === "both") && body.recipient.email) {
      const emailContent = generateEmailContent(body.template, { ...body.data, recipient: body.recipient })
      results.email = await sendEmail(body.recipient.email, emailContent.subject, emailContent.content)
    }

    // Send WhatsApp if requested and phone is provided
    if ((body.type === "whatsapp" || body.type === "both") && body.recipient.phone) {
      const whatsappMessage = generateWhatsAppMessage(body.template, { ...body.data, recipient: body.recipient })
      results.whatsapp = await sendWhatsApp(body.recipient.phone, whatsappMessage)
    }

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error("Notification error:", error)

    return NextResponse.json({ success: false, error: "Failed to send notifications" }, { status: 500 })
  }
}
