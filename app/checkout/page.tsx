"use client"

import type React from "react"

import { useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"

export default function CheckoutPage() {
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    console.log("Checkout initiated")
    setIsProcessing(false)
  }

  return (
    <main className="w-full bg-white min-h-screen flex flex-col">
      <Navbar />

      <section className="flex-1 px-6 pt-32 pb-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-serif font-light text-indigo-950 mb-2">Checkout</h1>
          <p className="text-gray-600 font-sans font-light mb-8">Complete your order</p>

          <form onSubmit={handleCheckout} className="glass p-8 rounded-2xl border border-gray-200">
            <div className="mb-8">
              <h2 className="text-xl font-serif font-light text-indigo-950 mb-6">Billing Information</h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="First Name"
                  className="px-4 py-3 border border-gray-300 rounded-lg font-sans focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="px-4 py-3 border border-gray-300 rounded-lg font-sans focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-sans focus:ring-2 focus:ring-amber-500 outline-none mb-4"
              />

              <input
                type="text"
                placeholder="Address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-sans focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div className="border-t border-gray-200 pt-8">
              <div className="flex justify-between items-center mb-4">
                <span className="font-sans text-gray-600">Subtotal</span>
                <span className="font-bold text-indigo-950">£126.49</span>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="font-sans text-gray-600">Shipping</span>
                <span className="font-bold text-indigo-950">£10.00</span>
              </div>
              <div className="flex justify-between items-center mb-8 text-lg">
                <span className="font-serif font-light text-indigo-950">Total</span>
                <span className="font-bold text-amber-500">£136.49</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full button-primary py-3 font-sans font-medium disabled:opacity-50 mb-4"
            >
              {isProcessing ? "Processing..." : "Pay with Stripe"}
            </button>

            <Link href="/catalog" className="block text-center text-sm text-gray-600 font-sans hover:text-indigo-950">
              Continue Shopping
            </Link>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  )
}
