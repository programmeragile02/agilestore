import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Mail, Phone } from "lucide-react"

const faqs = [
  {
    question: "How does the free trial work?",
    answer:
      "You get full access to all Professional plan features for 14 days. No credit card required to start. You can upgrade, downgrade, or cancel anytime during or after the trial.",
  },
  {
    question: "Can I change plans later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments.",
  },
  {
    question: "What integrations are available?",
    answer:
      "We integrate with 100+ popular tools including Slack, GitHub, Jira, Google Workspace, Microsoft Teams, Zapier, and many more. Custom integrations are available on Enterprise plans.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use bank-level encryption, are SOC 2 compliant, and follow GDPR guidelines. Your data is backed up daily and stored in secure data centers.",
  },
  {
    question: "Do you offer training and onboarding?",
    answer:
      "Yes! We provide comprehensive onboarding for all plans, with dedicated training sessions available for Enterprise customers. We also have extensive documentation and video tutorials.",
  },
  {
    question: "What happens if I need to cancel?",
    answer:
      "You can cancel anytime with no penalties. Your data remains accessible for 30 days after cancellation, and we can provide data exports upon request.",
  },
]

export function ProductFAQ() {
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="font-serif font-bold text-3xl sm:text-4xl text-foreground mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to know about Agile Project Manager Pro
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact Support Section */}
          <div className="lg:col-span-1">
            <Card className="border-border bg-background">
              <CardHeader>
                <CardTitle className="font-serif font-semibold text-xl text-foreground">Need More Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Can't find what you're looking for? Our support team is here to help.
                </p>

                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Live Chat
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                    <Mail className="mr-2 h-4 w-4" />
                    Email Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                    <Phone className="mr-2 h-4 w-4" />
                    Schedule Call
                  </Button>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Response Times:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Live Chat: Instant</li>
                    <li>• Email: Within 4 hours</li>
                    <li>• Phone: Same day</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
