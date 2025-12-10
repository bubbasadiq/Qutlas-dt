export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-50)]">
      <div className="max-w-md p-8 bg-white shadow-lg rounded text-center">
        <h1 className="text-2xl font-semibold mb-4">Verify Your Email</h1>
        <p className="text-[var(--neutral-500)] mb-4">
          We sent a confirmation email to your inbox. Click the link in the email to verify your account.
        </p>
        <Link href="/auth/login" className="text-[var(--primary-700)] hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  )
}
