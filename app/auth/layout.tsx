import { AppAuthProvider } from "@/components/app-auth-provider"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppAuthProvider>{children}</AppAuthProvider>
}
