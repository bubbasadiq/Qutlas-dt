import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display, Rubik } from "next/font/google"
import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
})

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "QUTLAS - Build Yours. Become.",
  description: "Distributed fabrication network. Design, validate, and manufacture locally.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${rubik.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
