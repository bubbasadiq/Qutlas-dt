import { AppAuthProvider } from "@/components/app-auth-provider"
import { ErrorBoundary } from "@/components/error-boundary"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppAuthProvider>
      <ErrorBoundary>{children}</ErrorBoundary>
    </AppAuthProvider>
  )
}
