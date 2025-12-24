export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg-50)]">
      <div className="w-24 h-24 rounded-2xl bg-[var(--primary-700)] flex items-center justify-center mb-6">
        <span className="text-white font-bold text-3xl">Q</span>
      </div>
      <h1 className="text-4xl font-bold mb-2 text-[var(--neutral-900)]">404</h1>
      <p className="text-[var(--neutral-500)] mb-6 text-center max-w-md">
        We couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
      </p>
      <div className="flex gap-4">
        <a
          href="/"
          className="px-4 py-2 bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white rounded-lg transition-colors"
        >
          Go Home
        </a>
        <a
          href="/dashboard"
          className="px-4 py-2 border border-[var(--neutral-200)] hover:bg-[var(--bg-100)] text-[var(--neutral-700)] rounded-lg transition-colors"
        >
          Dashboard
        </a>
      </div>
    </div>
  )
}
