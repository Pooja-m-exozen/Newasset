"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, User, Mail, Lock, Shield, CheckCircle, AlertCircle, ArrowLeft, Save, Key } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiService } from "@/lib/api"
import Link from "next/link"

// Define User interface
interface User {
  name: string;
  email: string;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState("")
  const [user, setUser] = useState<User | null>(null)

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: "",
    email: ""
  })

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const response = await apiService.getProfile()
      if (response.user) {
        setUser(response.user)
        setProfileData({
          name: response.user.name || "",
          email: response.user.email || ""
        })
      }
    } catch (error) {
      console.error("Failed to load user profile:", error)
    }
  }

  const validateProfileForm = () => {
    const newErrors: Record<string, string> = {}

    if (!profileData.name.trim()) {
      newErrors.name = "Name is required"
    } else if (profileData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    if (!profileData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {}

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required"
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required"
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      newErrors.newPassword = "Password must contain uppercase, lowercase, and number"
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password"
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateProfileForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})
    setSuccessMessage("")

    try {
      await apiService.updateProfile({
        name: profileData.name,
        email: profileData.email
      })

      setSuccessMessage("Profile updated successfully!")
      
      // Reload user profile to get updated data
      await loadUserProfile()

    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : "Profile update failed. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePasswordForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})
    setSuccessMessage("")

    try {
      await apiService.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      })

      setSuccessMessage("Password updated successfully!")
      
      // Clear password form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })

    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : "Password update failed. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (form: 'profile' | 'password', field: string, value: string) => {
    if (form === 'profile') {
      setProfileData(prev => ({ ...prev, [field]: value }))
    } else {
      setPasswordData(prev => ({ ...prev, [field]: value }))
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Profile...</h2>
          <p className="text-gray-600">Please wait while we load your profile information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account information and security settings</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setActiveTab('profile')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                  activeTab === 'profile' 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center space-x-2 justify-center">
                  <User className="w-4 h-4" />
                  <span>Profile Information</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={cn(
                  "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors",
                  activeTab === 'password' 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <div className="flex items-center space-x-2 justify-center">
                  <Key className="w-4 h-4" />
                  <span>Change Password</span>
                </div>
              </button>
            </div>
          </div>

          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="name"
                          type="text"
                          value={profileData.name}
                          onChange={(e) => handleInputChange("profile", "name", e.target.value)}
                          className={cn(
                            "pl-10 h-11 border-2 focus:ring-blue-500/20 rounded-lg transition-all duration-300",
                            errors.name ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                          )}
                          placeholder="Enter your full name"
                        />
                      </div>
                      {errors.name && (
                        <p className="text-xs text-red-600 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.name}</span>
                        </p>
                      )}
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => handleInputChange("profile", "email", e.target.value)}
                          className={cn(
                            "pl-10 h-11 border-2 focus:ring-blue-500/20 rounded-lg transition-all duration-300",
                            errors.email ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                          )}
                          placeholder="Enter your email address"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-red-600 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-xl transition-all duration-500 transform hover:scale-[1.01] disabled:transform-none disabled:opacity-70"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Save className="w-4 h-4" />
                          <span>Save Changes</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>Change Password</span>
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-4">
                    {/* Current Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-sm font-semibold text-gray-700">
                        Current Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => handleInputChange("password", "currentPassword", e.target.value)}
                          className={cn(
                            "pl-10 pr-10 h-11 border-2 focus:ring-blue-500/20 rounded-lg transition-all duration-300",
                            errors.currentPassword ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                          )}
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {errors.currentPassword && (
                        <p className="text-xs text-red-600 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.currentPassword}</span>
                        </p>
                      )}
                    </div>

                    {/* New Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
                        New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => handleInputChange("password", "newPassword", e.target.value)}
                          className={cn(
                            "pl-10 pr-10 h-11 border-2 focus:ring-blue-500/20 rounded-lg transition-all duration-300",
                            errors.newPassword ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                          )}
                          placeholder="Enter your new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {errors.newPassword && (
                        <p className="text-xs text-red-600 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.newPassword}</span>
                        </p>
                      )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => handleInputChange("password", "confirmPassword", e.target.value)}
                          className={cn(
                            "pl-10 pr-10 h-11 border-2 focus:ring-blue-500/20 rounded-lg transition-all duration-300",
                            errors.confirmPassword ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                          )}
                          placeholder="Confirm your new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-600 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{errors.confirmPassword}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Password Requirements */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800 font-medium mb-2">Password Requirements:</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>&bull; At least 8 characters long</li>
                      <li>&bull; Contains uppercase and lowercase letters</li>
                      <li>&bull; Contains at least one number</li>
                    </ul>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-xl transition-all duration-500 transform hover:scale-[1.01] disabled:transform-none disabled:opacity-70"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Updating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Save className="w-4 h-4" />
                          <span>Update Password</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}