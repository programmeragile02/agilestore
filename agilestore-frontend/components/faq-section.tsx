import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "What is included in the Agile Store packages?",
    answer:
      "Each package includes access to our core project management tools, team collaboration features, and customer support. Higher tiers include additional storage, advanced analytics, and priority support.",
  },
  {
    question: "Can I upgrade or downgrade my plan at any time?",
    answer:
      "Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades will take effect at the end of your current billing cycle. We'll prorate any charges accordingly.",
  },
  {
    question: "Is there a free trial available?",
    answer:
      "We offer a 14-day free trial for all our plans. No credit card required to start your trial. You can explore all features and decide which plan works best for your team.",
  },
  {
    question: "What kind of support do you provide?",
    answer:
      "We provide email support for Basic plans, priority support for Premium plans, and 24/7 dedicated support for Ultimate plans. All plans include access to our comprehensive documentation and video tutorials.",
  },
  {
    question: "Can I integrate Agile Store with other tools?",
    answer:
      "Yes, we offer integrations with popular tools like Slack, GitHub, Jira, and many others. Premium and Ultimate plans include API access for custom integrations.",
  },
  {
    question: "Is my data secure with Agile Store?",
    answer:
      "Absolutely. We use enterprise-grade security measures including SSL encryption, regular backups, and SOC 2 compliance. Ultimate plans include additional security features like SSO and advanced access controls.",
  },
]

export function FAQSection() {
  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif font-bold text-3xl sm:text-4xl text-foreground mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about our products and services
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border rounded-lg px-6 bg-card"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
