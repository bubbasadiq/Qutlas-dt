"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { useCurrency } from "@/hooks/use-currency"
import { PriceDisplay } from "@/components/price-display"
import { CurrencySelector } from "@/components/currency-selector"

const plans = [
  {
    name: "Starter",
    description: "For individuals and small teams getting started",
    price: 0,
    period: "",
    features: [
      "5 projects per month",
      "Basic manufacturability checks",
      "Community support",
      "Standard lead times",
      "Export to STL/STEP",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Pro",
    description: "For growing teams with production needs",
    price: 49,
    period: "/month",
    features: [
      "Unlimited projects",
      "Advanced DFM analysis",
      "Priority support",
      "Expedited lead times",
      "API access",
      "Team collaboration",
      "Custom materials",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    description: "For organizations with custom requirements",
    price: 0,
    period: "",
    features: [
      "Everything in Pro",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantees",
      "On-premise deployment",
      "SSO / SAML",
      "Audit logs",
    ],
    cta: "Contact Sales",
    highlight: false,
  },
]

export default function PricingPage() {
  const { currency, formatPrice } = useCurrency()
  
  return (
    <div className="min-h-screen bg-[var(--bg-50)]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--neutral-200)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo variant="blue" size="md" href="/" />
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-[var(--primary-700)] text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-20 px-6 bg-white">
       <div className="max-w-4xl mx-auto text-center">
         <p className="text-sm font-semibold text-[var(--accent-600)] uppercase tracking-wider mb-4">Pricing</p>
         <h1 className="text-5xl font-serif text-[var(--neutral-900)] mb-6 text-balance">
           Simple, transparent pricing
         </h1>
         <p className="text-xl text-[var(--neutral-600)] max-w-2xl mx-auto">
           Choose the plan that fits your needs. All plans include access to our global hub network and instant
           manufacturability feedback.
         </p>
         <div className="mt-6 flex justify-center">
           <CurrencySelector />
         </div>
       </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-8 ${
                  plan.highlight
                    ? "bg-[var(--primary-700)] text-white ring-4 ring-[var(--primary-300)] scale-105"
                    : "bg-white border border-[var(--neutral-200)]"
                }`}
              >
                <h3
                  className={`text-xl font-semibold mb-2 ${plan.highlight ? "text-white" : "text-[var(--neutral-900)]"}`}
                >
                  {plan.name}
                </h3>
                <p className={`text-sm mb-6 ${plan.highlight ? "text-white/70" : "text-[var(--neutral-500)]"}`}>
                  {plan.description}
                </p>

                <div className="mb-8">
                  {plan.price === 0 ? (
                    <span className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-[var(--neutral-900)]"}`}>
                      Free
                    </span>
                  ) : (
                    <PriceDisplay
                      amount={plan.price}
                      period={plan.period}
                      variant="large"
                      className={plan.highlight ? "text-white" : "text-[var(--neutral-900)]"}
                    />
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          plan.highlight ? "bg-white/20" : "bg-[var(--accent-100)]"
                        }`}
                      >
                        <svg
                          className={`w-3 h-3 ${plan.highlight ? "text-white" : "text-[var(--accent-700)]"}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className={`text-sm ${plan.highlight ? "text-white/90" : "text-[var(--neutral-600)]"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.name === "Enterprise" ? "/contact" : "/auth/signup"}>
                  <Button
                    className={`w-full h-12 font-medium ${
                      plan.highlight
                        ? "bg-white text-[var(--primary-700)] hover:bg-white/90"
                        : "bg-[var(--primary-700)] text-white hover:bg-[var(--primary-800)]"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-serif text-[var(--neutral-900)] text-center mb-12">
            Frequently asked questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "How does the pricing work for manufacturing?",
                a: "Platform pricing covers access to our design and validation tools. Manufacturing costs are quoted separately based on your design, materials, and production requirements.",
              },
              {
                q: "Can I switch plans anytime?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.",
              },
              {
                q: "What payment methods do we accept?",
                a: "We accept all major credit cards, wire transfers for enterprise accounts, and can arrange custom billing for large organizations.",
              },
              {
                q: "Is there a free trial for Pro?",
                a: "Yes, Pro comes with a 14-day free trial. No credit card required to start.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="border-b border-[var(--neutral-200)] pb-6">
                <h3 className="text-lg font-medium text-[var(--neutral-900)] mb-2">{faq.q}</h3>
                <p className="text-[var(--neutral-600)]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-6 bg-[var(--primary-700)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-serif text-white mb-4">Ready to get started?</h2>
          <p className="text-white/70 mb-8">Start for free, upgrade when you need more.</p>
          <Link href="/auth/signup">
            <Button className="bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-[var(--neutral-900)] font-medium px-8 h-12">
              Start Building Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
