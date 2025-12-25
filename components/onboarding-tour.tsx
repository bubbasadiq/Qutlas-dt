"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { X, ChevronRight, ChevronLeft, Rocket, Layout, Box, Settings } from "lucide-react"

const steps = [
  {
    title: "Welcome to Qutlas!",
    description: "We're excited to have you here. Let's take a quick tour of your new manufacturing workspace.",
    icon: <Rocket className="w-12 h-12 text-[var(--primary-600)]" />,
  },
  {
    title: "Your Dashboard",
    description: "Keep track of all your active projects, jobs, and manufacturing statistics in one place.",
    icon: <Layout className="w-12 h-12 text-[var(--primary-600)]" />,
  },
  {
    title: "The Studio",
    description: "Use our AI-powered studio to design, validate, and prepare your parts for manufacturing.",
    icon: <Box className="w-12 h-12 text-[var(--primary-600)]" />,
  },
  {
    title: "Settings & Preferences",
    description: "Customize your profile, preferred currency, and manufacturing requirements in your settings.",
    icon: <Settings className="w-12 h-12 text-[var(--primary-600)]" />,
  },
]

export function OnboardingTour() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (searchParams.get("onboarding") === "true") {
      setIsOpen(true)
    }
  }, [searchParams])

  const handleClose = () => {
    setIsOpen(false)
    // Remove the onboarding param from URL
    const params = new URLSearchParams(searchParams.toString())
    params.delete("onboarding")
    const newPath = window.location.pathname + (params.toString() ? `?${params.toString()}` : "")
    router.replace(newPath)
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-transparent">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden relative">
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-[var(--primary-50)] flex items-center justify-center">
                {steps[currentStep].icon}
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {steps[currentStep].description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div 
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === currentStep ? "w-6 bg-[var(--primary-600)]" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handlePrev}
                    className="text-gray-500"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                <Button 
                  size="sm"
                  onClick={handleNext}
                  className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white"
                >
                  {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                  {currentStep !== steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="h-1.5 bg-gray-100 w-full">
            <div 
              className="h-full bg-[var(--primary-600)] transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
