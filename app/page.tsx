import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Logo } from "@/components/logo"
import { IntentChat } from "@/components/intent-chat"
import Image from "next/image"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo variant="blue" size="md" href="/" />

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-[var(--neutral-600)] hover:text-[var(--primary-700)] transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/catalog"
              className="text-sm font-medium text-[var(--neutral-600)] hover:text-[var(--primary-700)] transition-colors"
            >
              Catalog
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-[var(--neutral-600)] hover:text-[var(--primary-700)] transition-colors"
            >
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-[var(--neutral-700)]">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Primary Color Block */}
      <section className="min-h-screen flex items-center justify-center pt-20 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        />
        <div className="relative z-10 text-center"> 
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-[var(--primary-700)]/40" />

          <h1 className="text-5xl md:text-7xl font-serif font-semibold text-white mb-8 text-balance leading-[1.1]">
            Build yours,
            <br />
            <span className="text-[var(--accent-500)]">Become</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed text-pretty">
            Describe what you want to create. Transform your ideas into manufacturable parts.
          </p>

          <IntentChat variant="hero" placeholder="Describe what you want to create..." className="mb-8" />

          <p className="text-sm text-white/50">
            Or{" "}
            <Link href="/auth/signup" className="text-[var(--accent-500)] hover:underline">
              sign up
            </Link>{" "}
            to upload your CAD files directly
          </p>
        </div>
      </section>

      <div className="relative h-24 bg-white overflow-hidden">
        <Image src="/images/brand-shape-orange.png"
          alt=""
          width={400}
          height={200}
          className="absolute left-1/2 -translate-x-1/2 -top-12 w-[300px] md:w-[400px] h-auto opacity-20"
          aria-hidden="true"
        />
      </div>

      {/* Trusted By - Light Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm font-medium text-[var(--neutral-400)] uppercase tracking-wider mb-8">
            Trusted by teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-40">
            {["Acme Corp", "TechFlow", "Buildify", "Quantum", "NovaMach"].map((company) => (
              <span key={company} className="text-lg font-semibold text-[var(--neutral-400)]">
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="relative h-20 bg-[var(--bg-200)] overflow-hidden">
        <Image
          src="/images/brand-shape-blue.png"
          alt=""
          width={350}
          height={175}
          className="absolute right-[10%] -top-8 w-[250px] md:w-[350px] h-auto opacity-15"
          aria-hidden="true"
        />
      </div>

      {/* How It Works - Ice Blue Section */}
      <section id="how-it-works" className="py-32 bg-[var(--bg-200)] relative overflow-hidden">
        <Image
          src="/images/brand-shape-orange.png"
          alt=""
          width={600}
          height={300}
          className="absolute -left-40 bottom-20 w-[400px] md:w-[600px] h-auto opacity-5 rotate-12"
          aria-hidden="true"
        />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <p className="text-sm font-semibold text-[var(--accent-600)] uppercase tracking-wider mb-4">How It Works</p>
            <h2 className="text-4xl md:text-5xl font-serif text-[var(--neutral-900)] text-balance">
              Three steps to production
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: "upload",
                color: "var(--primary-700)",
                title: "Describe or Upload",
                description:
                  "Tell us what you want to create or drop your CAD file. We understand your intent instantly.",
              },
              {
                icon: "quality-check",
                color: "var(--accent-500)",
                title: "Validate",
                description:
                  "Get real-time feedback on tolerances, wall thickness, and design for manufacturing best practices.",
              },
              {
                icon: "factory",
                color: "var(--primary-700)",
                title: "Produce",
                description:
                  "Route to certified hubs matching your requirements. Track progress from design to delivery.",
              },
            ].map((step, idx) => (
              <div key={idx} className="text-center">
                <div
                  className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                  style={{ backgroundColor: step.color }}
                >
                  <Icon name={step.icon} size={40} className="text-white" />
                </div>
                <h3 className="text-2xl font-serif text-[var(--neutral-900)] mb-4">{step.title}</h3>
                <p className="text-[var(--neutral-600)] leading-relaxed max-w-sm mx-auto">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="relative h-16 bg-white overflow-hidden">
        <Image
          src="/images/brand-shape-orange.png"
          alt=""
          width={300}
          height={150}
          className="absolute left-[15%] -top-6 w-[200px] md:w-[300px] h-auto opacity-10 -rotate-6"
          aria-hidden="true"
        />
      </div>

      {/* Features - White Section with Cards */}
      <section className="py-32 bg-white relative overflow-hidden">
        <Image
          src="/images/brand-shape-blue.png"
          alt=""
          width={500}
          height={250}
          className="absolute -right-32 top-40 w-[350px] md:w-[500px] h-auto opacity-5 -rotate-12"
          aria-hidden="true"
        />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <p className="text-sm font-semibold text-[var(--accent-600)] uppercase tracking-wider mb-4">Features</p>
            <h2 className="text-4xl md:text-5xl font-serif text-[var(--neutral-900)] text-balance">
              Everything you need to ship
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "mesh",
                title: "AI-Powered Creation",
                description:
                  "Describe your part in plain language. We generate manufacturable geometry instantly.",
              },
              {
                icon: "payment",
                title: "Real-time Quotes",
                description: "See exact pricing and lead times instantly. No waiting for long responses.",
              },
              {
                icon: "toolpath",
                title: "Toolpath Preview",
                description: "Visualize exactly how your part will be machined. Optimize before production.",
              },
              {
                icon: "hub-location",
                title: "Global Hub Network",
                description: "Access certified manufacturing partners worldwide. Quality guaranteed.",
              },
              {
                icon: "team",
                title: "Team Collaboration",
                description: "Work together in real-time. Share designs, comments, and approvals.",
              },
              {
                icon: "analytics",
                title: "Full Transparency",
                description: "Track every step from upload to delivery. Complete audit trail.",
              },
            ].map((feature, idx) => (
              <div key={idx} className="glass-card p-8 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-[var(--bg-200)] flex items-center justify-center mb-6">
                  <Icon name={feature.icon} size={28} className="text-[var(--primary-700)]" />
                </div>
                <h3 className="text-xl font-serif text-[var(--neutral-900)] mb-3">{feature.title}</h3>
                <p className="text-[var(--neutral-600)] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="relative h-20 bg-[var(--accent-500)] overflow-hidden">
        <Image
          src="/images/brand-shape-blue.png"
          alt=""
          width={400}
          height={200}
          className="absolute left-1/2 -translate-x-1/2 -top-10 w-[300px] md:w-[400px] h-auto opacity-20"
          aria-hidden="true"
        />
      </div>

      {/* CTA - Accent Color Block */}
      <section className="py-32 bg-[var(--accent-500)] relative overflow-hidden">
        <Image
          src="/images/brand-shape-blue.png"
          alt=""
          width={800}
          height={400}
          className="absolute -left-60 -bottom-20 w-[500px] md:w-[800px] h-auto opacity-10 rotate-6"
          aria-hidden="true"
        />

        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-serif text-[var(--neutral-900)] mb-6 text-balance">
            Ready to transform your workflow?
          </h2>
          <p className="text-xl text-[var(--neutral-700)] mb-10 max-w-xl mx-auto">
            Join thousands of designers and engineers shipping faster with Qutlas.
          </p>
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white font-semibold px-10 h-14 text-lg"
            >
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-[var(--neutral-900)] relative overflow-hidden">
        <Image
          src="/images/brand-shape-orange.png"
          alt=""
          width={500}
          height={250}
          className="absolute -right-40 top-10 w-[350px] md:w-[500px] h-auto opacity-5 -rotate-12"
          aria-hidden="true"
        />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="mb-6">
                <Logo variant="orange" size="md" href="/" />
              </div>
              <p className="text-[var(--neutral-400)] text-sm leading-relaxed">
                Design. Validate. Produce.
                <br />
                The future of manufacturing.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3">
                {["Features", "Pricing", "Catalog", "API"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-[var(--neutral-400)] text-sm hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-[var(--neutral-400)] text-sm hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                {["Privacy", "Terms", "Security"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-[var(--neutral-400)] text-sm hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--neutral-800)]">
            <p className="text-center text-[var(--neutral-500)] text-sm">© 2025 Qutlas. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
