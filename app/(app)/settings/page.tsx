"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icon } from "@/components/ui/icon"
import { Logo } from "@/components/logo"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export const dynamic = "force-dynamic"

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    company: user?.company || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // In a real implementation, this would call an API to update user profile
      // For now, we'll just show a success message
      toast.success("Profile updated successfully!")
      
      // Update the auth context with new user data
      // This would be done through a proper API call in a real app
      setTimeout(() => {
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      toast.error("Failed to update profile")
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (formData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)
    
    try {
      // In a real implementation, this would call an API to change password
      toast.success("Password changed successfully!")
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }))
      
      setIsLoading(false)
    } catch (error) {
      toast.error("Failed to change password")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-50)]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-[var(--neutral-200)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo variant="blue" size="md" href="/" />

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[var(--neutral-500)] hover:text-[var(--neutral-900)]"
            >
              Dashboard
            </Link>
            <Link
              href="/studio"
              className="text-sm font-medium text-[var(--neutral-500)] hover:text-[var(--neutral-900)]"
            >
              Workspace
            </Link>
            <Link
              href="/catalog"
              className="text-sm font-medium text-[var(--neutral-500)] hover:text-[var(--neutral-900)]"
            >
              Catalog
            </Link>
            <Link
              href="/settings"
              className="text-sm font-medium text-[var(--primary-700)] border-b-2 border-[var(--primary-700)] pb-1"
            >
              Settings
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-[var(--neutral-900)]">{user?.name}</p>
              <p className="text-xs text-[var(--neutral-500)]">{user?.company}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-serif text-[var(--neutral-900)] mb-2">Account Settings</h1>
        <p className="text-[var(--neutral-500)] mb-8">Manage your profile and preferences</p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Profile Settings */}
          <Card className="bg-white border-[var(--neutral-200)]">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-[var(--neutral-900)]">Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-[var(--neutral-700)] mb-2 block">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="h-10 bg-white border-[var(--neutral-200)]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-[var(--neutral-700)] mb-2 block">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="h-10 bg-white border-[var(--neutral-200)]"
                      disabled
                    />
                    <p className="text-xs text-[var(--neutral-400)] mt-1">
                      Contact support to change your email address
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="company" className="text-sm font-medium text-[var(--neutral-700)] mb-2 block">
                      Company
                    </Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleChange("company", e.target.value)}
                      className="h-10 bg-white border-[var(--neutral-200)]"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white"
                >
                  {isLoading ? "Saving..." : "Save Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Settings */}
          <Card className="bg-white border-[var(--neutral-200)]">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-[var(--neutral-900)]">Password & Security</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword" className="text-sm font-medium text-[var(--neutral-700)] mb-2 block">
                      Current Password
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => handleChange("currentPassword", e.target.value)}
                      className="h-10 bg-white border-[var(--neutral-200)]"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword" className="text-sm font-medium text-[var(--neutral-700)] mb-2 block">
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => handleChange("newPassword", e.target.value)}
                      className="h-10 bg-white border-[var(--neutral-200)]"
                      required
                    />
                    <p className="text-xs text-[var(--neutral-400)] mt-1">
                      Must be at least 8 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-[var(--neutral-700)] mb-2 block">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      className="h-10 bg-white border-[var(--neutral-200)]"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white"
                >
                  {isLoading ? "Changing..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preferences Section */}
        <div className="mt-8">
          <Card className="bg-white border-[var(--neutral-200)]">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-[var(--neutral-900)]">Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-[var(--neutral-700)] mb-3">Theme</h3>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="theme" value="light" className="text-[var(--primary-700)]" defaultChecked />
                      <span className="text-sm text-[var(--neutral-600)]">Light</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="theme" value="dark" className="text-[var(--primary-700)]" />
                      <span className="text-sm text-[var(--neutral-600)]">Dark</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="theme" value="system" className="text-[var(--primary-700)]" />
                      <span className="text-sm text-[var(--neutral-600)]">System</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[var(--neutral-700)] mb-3">Unit System</h3>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="units" value="metric" className="text-[var(--primary-700)]" defaultChecked />
                      <span className="text-sm text-[var(--neutral-600)]">Metric (mm)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="units" value="imperial" className="text-[var(--primary-700)]" />
                      <span className="text-sm text-[var(--neutral-600)]">Imperial (in)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[var(--neutral-700)] mb-3">Default Currency</h3>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="currency" value="ngn" className="text-[var(--primary-700)]" defaultChecked />
                      <span className="text-sm text-[var(--neutral-600)]">NGN (₦)</span>
                    </label>
                  </div>
                </div>

                <Button
                  onClick={() => toast.success("Preferences saved!")}
                  className="bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white"
                >
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <div className="mt-8">
          <Card className="bg-white border-red-200">
            <CardHeader>
              <CardTitle className="text-lg font-serif text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-[var(--neutral-900)]">Delete Account</h3>
                    <p className="text-sm text-[var(--neutral-500)]">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive" className="bg-red-500 hover:bg-red-600 text-white">
                    Delete Account
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-[var(--neutral-900)]">Sign Out All Devices</h3>
                    <p className="text-sm text-[var(--neutral-500)]">Terminate all active sessions</p>
                  </div>
                  <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                    Sign Out All Devices
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}