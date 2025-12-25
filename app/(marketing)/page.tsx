"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { Logo } from "@/components/logo"
import { IntentChat } from "@/components/intent-chat"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { usePlatformStats, useUserStats, useRecentProjects, useFeaturedProjects, useTestimonials } from "@/hooks/use-stats"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LandingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  // Fetch dynamic data
  const platformStats = usePlatformStats()
  const userStats = useUserStats()
  const recentProjects = useRecentProjects()
  const featuredProjects = useFeaturedProjects()
  const testimonials = useTestimonials()

  const handleCreateProject = () => {
    if (user) {
      router.push("/studio")
    } else {
      router.push("/auth/signup")
    }
  }

  const handleViewCatalog = () => {
    router.push("/catalog")
  }

  const handleTryStudio = () => {
    if (user) {
      router.push("/studio")
    } else {
      router.push("/auth/signup")
    }
  }

  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % (testimonials.data.length || 1))
  }

  const prevTestimonial = () => {
    setActiveTestimonial((prev) => (prev - 1 + (testimonials.data.length || 1)) % (testimonials.data.length || 1))
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-white/80 backdrop-blur-md">
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
            {user ? (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-[var(--neutral-700)]">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-[var(--neutral-700)]">
                  Sign In
                </Button>
              </Link>
            )}
            <Link href={user ? "/studio" : "/auth/signup"}>
              <Button size="sm" className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white">
                {user ? "New Project" : "Get Started"}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Dynamic based on auth state */}
      <section className="min-h-screen flex items-center justify-center pt-20 relative overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-[var(--primary-700)]/40" />

        {/* Content container */}
        <div className="relative z-10 text-center max-w-3xl mx-auto px-6">
          {user ? (
            <>
              <h1 className="text-5xl md:text-7xl font-serif font-semibold text-white mb-8 text-balance leading-[1.1]">
                Welcome back,
                <br />
                <span className="text-[var(--accent-500)]">{user.name || user.email}</span>
              </h1>

              <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed text-pretty">
                Continue building amazing things with Qutlas
              </p>
            </>
          ) : (
            <>
              <h1 className="text-5xl md:text-7xl font-serif font-semibold text-white mb-8 text-balance leading-[1.1]">
                Build yours,
                <br />
                <span className="text-[var(--accent-500)]">Become</span>
              </h1>

              <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed text-pretty">
                Describe what you want to create. Transform your ideas into manufacturable parts.
              </p>
            </>
          )}

          <IntentChat variant="hero" placeholder="Describe what you want to create..." className="mb-8" />

          <p className="text-sm text-white/50">
            Or {" "}
            <button onClick={handleCreateProject} className="text-[var(--accent-500)] hover:underline">
              {user ? "create a new project" : "sign up"}
            </button>{" "}
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

      {/* Statistics Section - Dynamic data */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm font-medium text-[var(--neutral-400)] uppercase tracking-wider mb-8">
            Qutlas Platform Statistics
          </p>
          
          {platformStats.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-700)]"></div>
            </div>
          ) : platformStats.error ? (
            <div className="text-center py-12 text-red-500">
              <p>Failed to load statistics: {platformStats.error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl md:text-5xl font-bold text-[var(--primary-700)] mb-2">{platformStats.totalUsers.toLocaleString()}</p>
                <p className="text-[var(--neutral-500)]">Users worldwide</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-bold text-[var(--primary-700)] mb-2">{platformStats.totalProjects.toLocaleString()}</p>
                <p className="text-[var(--neutral-500)]">Projects created</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-bold text-[var(--primary-700)] mb-2">{platformStats.totalParts.toLocaleString()}</p>
                <p className="text-[var(--neutral-500)]">Parts in catalog</p>
              </div>
              <div>
                <p className="text-4xl md:text-5xl font-bold text-[var(--primary-700)] mb-2">{platformStats.totalHubs.toLocaleString()}</p>
                <p className="text-[var(--neutral-500)]">Manufacturing hubs</p>
              </div>
            </div>
          )}
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

      {/* Recent Projects Section - Dynamic based on auth state */}
      <section className="py-20 bg-[var(--bg-200)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-[var(--accent-600)] uppercase tracking-wider mb-4">
              {user ? "Your Recent Projects" : "Featured Projects"}
            </p>
            <h2 className="text-4xl md:text-5xl font-serif text-[var(--neutral-900)] text-balance">
              {user ? "Continue where you left off" : "Inspiration from our community"}
            </h2>
          </div>

          {user ? (
            <>
              {recentProjects.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-700)]"></div>
                </div>
              ) : recentProjects.error ? (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-4">Failed to load projects: {recentProjects.error}</p>
                  <Button onClick={handleCreateProject} className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white">
                    Create Your First Project
                  </Button>
                </div>
              ) : recentProjects.data.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--bg-200)] flex items-center justify-center mx-auto mb-4">
                    <Icon name="upload" size={32} className="text-[var(--neutral-400)]" />
                  </div>
                  <h3 className="text-lg font-medium text-[var(--neutral-900)] mb-2">No projects yet</h3>
                  <p className="text-[var(--neutral-500)] mb-6 max-w-sm mx-auto">
                    Create your first project to start designing and manufacturing.
                  </p>
                  <Button onClick={handleCreateProject} className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white">
                    Create Your First Project
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recentProjects.data.map((project: any) => (
                    <div key={project.id} className="bg-white rounded-xl border border-[var(--neutral-200)] overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/studio?project=${project.id}`)}>
                      <div className="aspect-video bg-[var(--bg-100)]">
                        <img src={project.thumbnail || "/placeholder.svg?height=200&width=300"} alt={project.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-medium text-[var(--neutral-900)] mb-2">{project.name}</h3>
                        <p className="text-sm text-[var(--neutral-500)] mb-3">{project.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent-100)] text-[var(--accent-700)]">
                            {project.status}
                          </span>
                          <span className="text-xs text-[var(--neutral-400)]">
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {featuredProjects.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-700)]"></div>
                </div>
              ) : featuredProjects.error ? (
                <div className="text-center py-12 text-red-500">
                  <p>Failed to load featured projects: {featuredProjects.error}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredProjects.data.map((project: any) => (
                    <div key={project.id} className="bg-white rounded-xl border border-[var(--neutral-200)] overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-video bg-[var(--bg-100)]">
                        <img src={project.thumbnail || "/placeholder.svg?height=200&width=300"} alt={project.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium text-[var(--neutral-900)]">{project.name}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent-100)] text-[var(--accent-700)]">
                            {project.likes} likes
                          </span>
                        </div>
                        <p className="text-sm text-[var(--neutral-500)] mb-3">{project.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[var(--neutral-400)]">
                            By {project.user_name}
                          </span>
                          <Button variant="outline" size="sm" className="bg-transparent" onClick={() => router.push("/auth/signup")}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <div className="relative h-20 bg-white overflow-hidden">
        <Image
          src="/images/brand-shape-orange.png"
          alt=""
          width={400}
          height={200}
          className="absolute left-15% -top-6 w-[200px] md:w-[300px] h-auto opacity-10 -rotate-6"
          aria-hidden="true"
        />
      </div>

      {/* How It Works - Dynamic content */}
      <section id="how-it-works" className="py-32 bg-white relative overflow-hidden">
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

      <div className="relative h-16 bg-[var(--bg-200)] overflow-hidden">
        <Image
          src="/images/brand-shape-blue.png"
          alt=""
          width={500}
          height={250}
          className="absolute -right-32 top-40 w-[350px] md:w-[500px] h-auto opacity-5 -rotate-12"
          aria-hidden="true"
        />
      </div>

      {/* Features - Dynamic content */}
      <section className="py-32 bg-[var(--bg-200)] relative overflow-hidden">
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

      {/* Testimonials Section - Dynamic data */}
      <section className="py-20 bg-[var(--accent-500)]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">What Our Users Say</p>
            <h2 className="text-3xl md:text-4xl font-serif text-white text-balance">
              Trusted by engineers and designers worldwide
            </h2>
          </div>

          {testimonials.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : testimonials.error ? (
            <div className="text-center py-12 text-red-200">
              <p>Failed to load testimonials: {testimonials.error}</p>
            </div>
          ) : testimonials.data.length > 0 ? (
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center relative">
                <p className="text-lg md:text-xl text-white mb-6 italic">
                  "{testimonials.data[activeTestimonial].quote}"
                </p>
                <div className="flex items-center justify-center gap-4">
                  <img
                    src={testimonials.data[activeTestimonial].avatar || `/avatars/default.jpg`}
                    alt={testimonials.data[activeTestimonial].author}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="text-left">
                    <p className="font-semibold text-white">{testimonials.data[activeTestimonial].author}</p>
                    <p className="text-sm text-white/70">{testimonials.data[activeTestimonial].title}, {testimonials.data[activeTestimonial].company}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={prevTestimonial}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <Icon name="chevron-left" size={20} className="text-white" />
                </button>
                <button
                  onClick={nextTestimonial}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <Icon name="chevron-right" size={20} className="text-white" />
                </button>
              </div>

              <div className="flex justify-center gap-2 mt-4">
                {testimonials.data.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === activeTestimonial ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="relative h-20 bg-white overflow-hidden">
        <Image
          src="/images/brand-shape-blue.png"
          alt=""
          width={400}
          height={200}
          className="absolute left-1/2 -translate-x-1/2 -top-10 w-[300px] md:w-[400px] h-auto opacity-10"
          aria-hidden="true"
        />
      </div>

      {/* CTA - Dynamic based on auth state */}
      <section className="py-32 bg-white relative overflow-hidden">
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleTryStudio}
              size="lg"
              className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white font-semibold px-10 h-14 text-lg"
            >
              {user ? "Go to Studio" : "Get Started Free"}
            </Button>
            <Button
              onClick={handleViewCatalog}
              size="lg"
              variant="outline"
              className="font-semibold px-10 h-14 text-lg border-[var(--neutral-300)]"
            >
              View Catalog
            </Button>
          </div>
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
            <p className="text-center text-[var(--neutral-500)] text-sm">© {new Date().getFullYear()} Qutlas. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}