"use client"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

interface ProductFAQStandaloneProps {
  productSlug: string
}

export default function ProductFAQStandalone({ productSlug }: ProductFAQStandaloneProps) {
  const faqs = [
    {
      question: "How does Rent Vix Pro help manage my rental business?",
      answer:
        "Rent Vix Pro streamlines your entire rental operation with automated booking management, inventory tracking, customer communication, and financial reporting. You can manage multiple properties, track maintenance schedules, and process payments all from one dashboard.",
    },
    {
      question: "Can I customize the booking forms and customer portal?",
      answer:
        "Yes! Rent Vix Pro offers extensive customization options including branded booking forms, custom fields, automated email templates, and a white-label customer portal that matches your business branding.",
    },
    {
      question: "What payment methods are supported?",
      answer:
        "We support all major payment methods including credit cards, bank transfers, digital wallets, and local payment options. Automatic payment processing and recurring billing are included in all plans.",
    },
    {
      question: "Is there a mobile app for managing rentals on the go?",
      answer:
        "Yes, Rent Vix Pro includes native mobile apps for iOS and Android, allowing you to manage bookings, communicate with customers, and track inventory from anywhere.",
    },
    {
      question: "How secure is my data?",
      answer:
        "We use enterprise-grade security with 256-bit SSL encryption, regular security audits, and comply with GDPR and other data protection regulations. Your data is backed up daily and stored in secure data centers.",
    },
    {
      question: "Can I integrate with my existing tools?",
      answer:
        "Rent Vix Pro integrates with popular tools like QuickBooks, Mailchimp, Google Calendar, and many others through our API and Zapier connections.",
    },
    {
      question: "What kind of support do you provide?",
      answer:
        "We offer 24/7 customer support via chat, email, and phone. Plus, you get access to our knowledge base, video tutorials, and dedicated onboarding specialist to help you get started.",
    },
    {
      question: "Can I try it before purchasing?",
      answer:
        "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start your trial.",
    },
  ]

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get answers to common questions about Rent Vix Pro and how it can transform your rental business.
          </p>
        </div>

        <div className="mb-12">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-gray-200 rounded-lg px-6 py-2 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-indigo-600 py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4 leading-relaxed">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Still have questions CTA */}
        <div className="text-center bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-600 mb-6">Our support team is here to help you get started with Rent Vix Pro.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 bg-transparent">
              Contact Support
            </Button>
            <Button
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
              onClick={() =>
                (window.location.href = `/checkout?product=${productSlug}&package=professional&duration=monthly`)
              }
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export { ProductFAQStandalone }
