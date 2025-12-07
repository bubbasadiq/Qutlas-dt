import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-700)] flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <span className="font-serif font-semibold text-xl text-[var(--neutral-900)]">Qutlas</span>
          </Link>

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
      <section className="min-h-screen flex items-center justify-center bg-[var(--primary-700)] pt-20">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <p className="inline-block px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-8">
            The future of manufacturing
          </p>

          <h1 className="text-5xl md:text-7xl font-serif font-semibold text-white mb-8 text-balance leading-[1.1]">
            Design.
            <br />
            <span className="text-[var(--accent-500)]">Validate.</span>
            <br />
            Produce.
          </h1>

          <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed text-pretty">
            Transform your ideas into manufactured parts. Upload your design, get instant manufacturability feedback,
            and route to certified production hubs worldwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-[var(--neutral-900)] font-semibold px-8 h-14 text-lg"
              >
                Start Building
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 bg-transparent px-8 h-14 text-lg"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

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

      {/* How It Works - Ice Blue Section */}
      <section id="how-it-works" className="py-32 bg-[var(--bg-200)]">
        <div className="max-w-6xl mx-auto px-6">
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
                title: "Upload",
                description:
                  "Drop your CAD file — STEP, IGES, or STL. Our system analyzes it instantly for manufacturability.",
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

      {/* Features - White Section with Cards */}
      <section className="py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6">
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
                title: "Instant DFM Analysis",
                description:
                  "Know if your design is manufacturable before you commit. AI-powered analysis catches issues early.",
              },
              {
                icon: "payment",
                title: "Real-time Quotes",
                description: "See exact pricing and lead times instantly. No waiting for vendor responses.",
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

      {/* CTA - Accent Color Block */}
      <section className="py-32 bg-[var(--accent-500)]">
        <div className="max-w-3xl mx-auto px-6 text-center">
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
      <footer className="py-16 bg-[var(--neutral-900)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary-700)] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Q</span>
                </div>
                <span className="font-serif font-semibold text-xl text-white">Qutlas</span>
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
