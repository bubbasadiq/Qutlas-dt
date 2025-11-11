import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function LearnPage() {
  return (
    <main className="w-full bg-white">
      <Navbar />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-serif font-light text-indigo-950 mb-4">Learn</h1>
          <p className="text-lg text-gray-600 font-sans font-light mb-12">
            Educational resources and guides for digital fabrication
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-all">
              <h2 className="text-2xl font-serif font-light text-indigo-950 mb-4">Getting Started</h2>
              <p className="text-gray-600 font-sans font-light mb-6">
                Learn the fundamentals of digital fabrication and how to use the QUTLAS platform.
              </p>
              <button className="button-primary">Read Guide →</button>
            </div>

            <div className="glass p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-all">
              <h2 className="text-2xl font-serif font-light text-indigo-950 mb-4">Materials & Processes</h2>
              <p className="text-gray-600 font-sans font-light mb-6">
                Explore different materials, tools, and manufacturing processes available.
              </p>
              <button className="button-primary">Read Guide →</button>
            </div>

            <div className="glass p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-all">
              <h2 className="text-2xl font-serif font-light text-indigo-950 mb-4">Design Best Practices</h2>
              <p className="text-gray-600 font-sans font-light mb-6">
                Optimize your designs for precision, manufacturability, and efficiency.
              </p>
              <button className="button-primary">Read Guide →</button>
            </div>

            <div className="glass p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-all">
              <h2 className="text-2xl font-serif font-light text-indigo-950 mb-4">Advanced Techniques</h2>
              <p className="text-gray-600 font-sans font-light mb-6">
                Master advanced workflows and techniques for complex manufacturing projects.
              </p>
              <button className="button-primary">Read Guide →</button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
