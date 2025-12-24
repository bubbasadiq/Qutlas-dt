import type React from "react"
import type { Metadata, Viewport } from "next"
import { Rubik, Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "sonner"
import "./globals.css"

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Qutlas: Build Yours, Become",
  description:
    "Transform your designs into manufactured parts. Upload CAD, validate manufacturability instantly, and route to certified production hubs.",
  keywords: ["CAD", "manufacturing", "CNC", "3D printing", "design", "production"],
  authors: [{ name: "Qutlas" }],
  openGraph: {
    title: "Qutlas: Build Yours, Become",
    description: "Transform your designs into manufactured parts.",
    type: "website",
  },

}

export const viewport: Viewport = {
  themeColor: "#2a2a72",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${rubik.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
