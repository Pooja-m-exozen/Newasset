"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, ArrowRight, Shield, Zap, Building2, Users, Settings, TrendingUp, Lock, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiService } from "@/lib/api"
import Link from "next/link"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState("")
  const [isValidToken, setIsValidToken] = useState(true)

  useEffect(() => {
    if (!token) {
      setIsValidToken(false)
      setErrors({ general: "Invalid or missing reset token. Please request a new password reset link." })
    }
  }, [token])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token || !isValidToken) {
      return
    }
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})
    setSuccessMessage("")

    try {
      await apiService.resetPassword({
        token,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      })

      setSuccessMessage("Password reset successful! You can now log in with your new password.")
      
      // Clear form
      setFormData({
        password: "",
        confirmPassword: ""
      })

      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = "/login"
      }, 3000)

    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : "Password reset failed. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const features = [
    {
      icon: Building2,
      title: "Smart Asset Management",
      description: "Intelligent tracking of all MEP, fire, and soft service assets with real-time monitoring."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Seamless collaboration between facility managers, technicians, and stakeholders."
    },
    {
      icon: TrendingUp,
      title: "Performance Analytics",
      description: "Advanced insights into resource consumption and operational efficiency."
    },
    {
      icon: Settings,
      title: "Customizable Workflows",
      description: "Tailor processes to match your organization's specific requirements."
    }
  ]

  if (!isValidToken) {
    return (
      <div className="h-screen w-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="shadow-2xl bg-white/95 rounded-2xl overflow-hidden px-2 py-2 max-w-md">
            <CardHeader className="text-center pb-6 pt-10">
              <div className="w-16 h-16 bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-xl">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Invalid Reset Link
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm leading-relaxed">
                The password reset link is invalid or has expired
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
              
              <div className="space-y-4">
                <Link href="/forgot-password">
                  <Button className="w-full h-11 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-xl transition-all duration-500">
                    Request New Reset Link
                  </Button>
                </Link>
                
                <div className="text-center">
                  <Link 
                    href="/login" 
                    className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-red-600 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to login</span>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Left Panel - Hero Section */}
      <div className="hidden lg:flex lg:w-[60%] relative transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800" />
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-40 h-40 bg-white rounded-full animate-bounce"></div>
          <div className="absolute bottom-32 right-32 w-32 h-32 bg-white rounded-full animate-bounce delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white rounded-full animate-bounce delay-500"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-14 py-10 h-full">
          {/* Logo and Brand */}
          <div className="mb-8">
            <div className="inline-flex items-center space-x-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">FacilioTrack</h2>
                <p className="text-purple-200 text-xs">Enterprise Solutions</p>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-purple-100 to-purple-200 bg-clip-text text-transparent leading-tight">
              Set New
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Password
              </span>
            </h1>
            <p className="text-base text-purple-100 mb-8 leading-relaxed">
              Create a strong new password to secure your account and continue managing your facilities.
            </p>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-3 flex-1">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-500 transform hover:scale-105"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/30 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/40 transition-all duration-300 shadow-lg">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm mb-1 group-hover:text-purple-100 transition-colors truncate">
                      {feature.title}
                    </h3>
                    <p className="text-purple-100 text-xs leading-relaxed opacity-90 line-clamp-2">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <p className="text-purple-200 text-xs mb-3">Secure password reset process</p>
            <div className="flex items-center space-x-4 opacity-60">
              <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
                <Building2 className="w-3 h-3 text-white" />
              </div>
              <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
                <Users className="w-3 h-3 text-white" />
              </div>
              <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
                <Settings className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
        </div>
        {/* Vertical border */}
        <div className="absolute top-0 right-0 h-full w-0.5 bg-gradient-to-b from-purple-200/30 via-purple-400/40 to-indigo-400/30 opacity-70 shadow-lg" />
      </div>

      {/* Right Panel - Reset Password Form */}
      <div className="flex-1 lg:w-[40%] flex items-center justify-center p-8 relative bg-white/90 backdrop-blur-xl">
        <div className="w-full max-w-sm">
          <Card className="shadow-2xl bg-white/95 rounded-2xl overflow-hidden px-2 py-2">
            <CardHeader className="text-center pb-6 pt-10">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-xl">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Reset Password
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm leading-relaxed">
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              )}

              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    New Password
                  </Label>
                  <div className={cn(
                    "relative group transition-all duration-300",
                    focusedField === "password" && "ring-2 ring-purple-500/20",
                    errors.password && "ring-2 ring-red-500/20"
                  )}>
                    <Lock className={cn(
                      "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300",
                      focusedField === "password" ? "text-purple-500" : errors.password ? "text-red-500" : "text-gray-400"
                    )} />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "pl-10 pr-10 h-12 border-2 focus:ring-purple-500/20 rounded-xl text-sm transition-all duration-300 bg-white/50 backdrop-blur-sm",
                        errors.password ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-purple-500"
                      )}
                      placeholder="Enter your new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300 p-1 rounded-lg hover:bg-gray-100"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                    Confirm New Password
                  </Label>
                  <div className={cn(
                    "relative group transition-all duration-300",
                    focusedField === "confirmPassword" && "ring-2 ring-purple-500/20",
                    errors.confirmPassword && "ring-2 ring-red-500/20"
                  )}>
                    <Lock className={cn(
                      "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300",
                      focusedField === "confirmPassword" ? "text-purple-500" : errors.confirmPassword ? "text-red-500" : "text-gray-400"
                    )} />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "pl-10 pr-10 h-12 border-2 focus:ring-purple-500/20 rounded-xl text-sm transition-all duration-300 bg-white/50 backdrop-blur-sm",
                        errors.confirmPassword ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-purple-500"
                      )}
                      placeholder="Confirm your new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300 p-1 rounded-lg hover:bg-gray-100"
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

                {/* Password Requirements */}
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-xs text-purple-800 font-medium mb-2">Password Requirements:</p>
                  <ul className="text-xs text-purple-700 space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Contains uppercase and lowercase letters</li>
                    <li>• Contains at least one number</li>
                  </ul>
                </div>

                {/* Reset Password Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-700 hover:via-purple-800 hover:to-indigo-800 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-xl transition-all duration-500 transform hover:scale-[1.01] disabled:transform-none disabled:opacity-70"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Resetting password...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Reset Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>

                {/* Back to Login */}
                <div className="text-center">
                  <Link 
                    href="/login" 
                    className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-purple-600 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to login</span>
                  </Link>
                </div>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">
                  © 2025 FacilioTrack. All rights reserved.
                </p>
                <div className="flex items-center justify-center space-x-4 mt-3">
                  <Link href="/privacy" className="text-xs text-gray-400 hover:text-purple-700 transition-colors">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="text-xs text-gray-400 hover:text-purple-700 transition-colors">
                    Terms
                  </Link>
                  <Link href="/support" className="text-xs text-gray-400 hover:text-purple-700 transition-colors">
                    Support
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 