"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mail, Shield, Zap, Building2, Users, Settings, TrendingUp, CheckCircle, AlertCircle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiService } from "@/lib/api"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState("")

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})
    setSuccessMessage("")

    try {
      const response = await apiService.forgotPassword({ email })

      if (response.success) {
        setSuccessMessage("Password reset email sent. Please check your inbox and follow the instructions to reset your password.")
        // Clear form
        setEmail("")
      } else {
        setErrors({
          general: response.message || "Failed to send reset link. Please try again."
        })
      }

    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : "Failed to send reset link. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setEmail(value)
    // Clear error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: "" }))
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
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600 via-orange-700 to-red-800" />
        
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
              <div className="w-14 h-14 bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">FacilioTrack</h2>
                <p className="text-orange-200 text-xs">Enterprise Solutions</p>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-orange-100 to-orange-200 bg-clip-text text-transparent leading-tight">
              Reset Your
              <br />
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Password
              </span>
            </h1>
            <p className="text-base text-orange-100 mb-8 leading-relaxed">
              Don&apos;t worry! Enter your email address and we&apos;ll send you a link to reset your password.
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
                    <h3 className="font-bold text-white text-sm mb-1 group-hover:text-orange-100 transition-colors truncate">
                      {feature.title}
                    </h3>
                    <p className="text-orange-100 text-xs leading-relaxed opacity-90 line-clamp-2">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <p className="text-orange-200 text-xs mb-3">Secure and reliable password recovery</p>
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
        <div className="absolute top-0 right-0 h-full w-0.5 bg-gradient-to-b from-orange-200/30 via-orange-400/40 to-red-400/30 opacity-70 shadow-lg" />
      </div>

      {/* Right Panel - Forgot Password Form */}
      <div className="flex-1 lg:w-[40%] flex items-center justify-center p-8 relative bg-white/90 backdrop-blur-xl">
        <div className="w-full max-w-sm">
          <Card className="shadow-2xl bg-white/95 rounded-2xl overflow-hidden px-2 py-2">
            <CardHeader className="text-center pb-6 pt-10">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 via-orange-700 to-red-700 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Forgot Password?
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm leading-relaxed">
                Enter your email address and we will send you a link to reset your password
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

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <div className={cn(
                    "relative group transition-all duration-300",
                    focusedField === "email" && "ring-2 ring-orange-500/20",
                    errors.email && "ring-2 ring-red-500/20"
                  )}>
                    <Mail className={cn(
                      "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300",
                      focusedField === "email" ? "text-orange-500" : errors.email ? "text-red-500" : "text-gray-400"
                    )} />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "pl-10 h-12 border-2 focus:ring-orange-500/20 rounded-xl text-sm transition-all duration-300 bg-white/50 backdrop-blur-sm",
                        errors.email ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-orange-500"
                      )}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                {/* Send Reset Link Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-orange-600 via-orange-700 to-red-700 hover:from-orange-700 hover:via-orange-800 hover:to-red-800 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-xl transition-all duration-500 transform hover:scale-[1.01] disabled:transform-none disabled:opacity-70"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending reset link...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>

                {/* Back to Login */}
                <div className="text-center">
                  <Link 
                    href="/login" 
                    className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-orange-600 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to login</span>
                  </Link>
                </div>

                {/* Additional Help */}
                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <p className="text-xs text-orange-800 font-medium mb-1">Need help?</p>
                  <p className="text-xs text-orange-700">
                    If you don&apos;t receive the email within a few minutes, check your spam folder or contact our support team.
                  </p>
                </div>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">
                  © 2025 FacilioTrack. All rights reserved.
                </p>
                <div className="flex items-center justify-center space-x-4 mt-3">
                  <Link href="/privacy" className="text-xs text-gray-400 hover:text-orange-700 transition-colors">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="text-xs text-gray-400 hover:text-orange-700 transition-colors">
                    Terms
                  </Link>
                  <Link href="/support" className="text-xs text-gray-400 hover:text-orange-700 transition-colors">
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