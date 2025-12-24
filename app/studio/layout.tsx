import { WorkspaceProvider } from "@/hooks/use-workspace"

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <WorkspaceProvider>{children}</WorkspaceProvider>
}
