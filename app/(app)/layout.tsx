import { WorkspaceProvider } from "@/hooks/use-workspace"
import { AuthGuard } from "@/components/auth-guard"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <WorkspaceProvider>
        {children}
      </WorkspaceProvider>
    </AuthGuard>
  )
}
