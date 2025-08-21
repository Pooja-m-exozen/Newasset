"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, ArrowRight, History, Calendar, Lock, Mail, Shield, Zap, Building2, Users, Settings, TrendingUp, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { useToast, ToastContainer } from "@/components/ui/toast"
import Link from "next/link"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { login } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!password) {
      newErrors.password = "Password is required"
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

    try {
      const loginResult: { id: string; name: string; email: string; role: string } | undefined = await login(email, password)

      addToast({
        type: "success",
        title: "Login Successful",
        message: "Redirecting to dashboard...",
        duration: 2000
      })
      
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('rememberMe')
      }

      // Redirect to appropriate dashboard based on user role
      // Use the user data returned from login function
      setTimeout(() => {
        if (loginResult?.role === 'viewer') {
          window.location.href = "/viewer/dashboard"
        } else {
          window.location.href = "/admin/dashboard"
        }
      }, 2000)

    } catch (error) {
      addToast({
        type: "error",
        title: "Login Failed",
        message: error instanceof Error ? error.message : "Please check your credentials and try again.",
        duration: 5000
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field === "email") setEmail(value)
    if (field === "password") setPassword(value)
    
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
      icon: History,
      title: "Complete Lifecycle Tracking",
      description: "End-to-end visibility of service history, warranties, and maintenance records."
    },
    {
      icon: Calendar,
      title: "Proactive Maintenance",
      description: "AI-powered scheduling for technical, fire, and security maintenance tasks."
    },
    {
      icon: TrendingUp,
      title: "Performance Analytics",
      description: "Advanced insights into resource consumption and operational efficiency."
    }
  ]

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Mobile Hero Section */}
      <div className="lg:hidden relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-3 px-3 flex-shrink-0">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 mb-1">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-400 via-orange-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white">FacilioTrack</h2>
              <p className="text-blue-200 text-xs">Enterprise Solutions</p>
            </div>
          </div>
          <h1 className="text-sm font-bold mb-1 bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
            Transform Your Facility Management
          </h1>
          <p className="text-xs text-blue-100 leading-relaxed">
            Streamline operations and enhance asset visibility.
          </p>
        </div>
      </div>

      {/* Desktop Left Panel - Hero Section */}
      <div className="hidden lg:flex lg:w-[60%] xl:w-[55%] 2xl:w-[50%] relative transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-40 h-40 bg-white rounded-full animate-bounce"></div>
          <div className="absolute bottom-32 right-32 w-32 h-32 bg-white rounded-full animate-bounce delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white rounded-full animate-bounce delay-500"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-8 lg:px-14 py-8 lg:py-10 h-full">
          {/* Logo and Brand */}
          <div className="mb-6 lg:mb-8">
            <div className="inline-flex items-center space-x-3 mb-4 lg:mb-6">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-orange-400 via-orange-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <Zap className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-white">FacilioTrack</h2>
                <p className="text-blue-200 text-xs">Enterprise Solutions</p>
              </div>
            </div>
            
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent leading-tight">
              Transform Your
              <br />
              <span className="bg-gradient-to-r from-orange-400 to-teal-400 bg-clip-text text-transparent">
                Facility Management
              </span>
            </h1>
            <p className="text-sm lg:text-base text-blue-100 mb-6 lg:mb-8 leading-relaxed">
              Streamline operations, enhance asset visibility, and optimize resource utilization with our comprehensive facility management platform.
            </p>
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-2 lg:gap-3 flex-1">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group bg-white/10 backdrop-blur-sm rounded-xl p-2 lg:p-3 border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-500 transform hover:scale-105"
              >
                <div className="flex items-start space-x-2 lg:space-x-3">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-white/20 to-white/30 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/40 transition-all duration-300 shadow-lg">
                    <feature.icon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-xs lg:text-sm mb-1 group-hover:text-blue-100 transition-colors truncate">
                      {feature.title}
                    </h3>
                    <p className="text-blue-100 text-xs leading-relaxed opacity-90 line-clamp-2">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-4 lg:mt-6 pt-4 border-t border-white/20">
            <p className="text-blue-200 text-xs mb-2 lg:mb-3">Trusted by leading enterprises</p>
            <div className="flex items-center space-x-3 lg:space-x-4 opacity-60">
              <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white/20 rounded-md flex items-center justify-center">
                <Building2 className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white" />
              </div>
              <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white/20 rounded-md flex items-center justify-center">
                <Users className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white" />
              </div>
              <div className="w-5 h-5 lg:w-6 lg:h-6 bg-white/20 rounded-md flex items-center justify-center">
                <Settings className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-white" />
              </div>
            </div>
          </div>
        </div>
        {/* Vertical border */}
        <div className="absolute top-0 right-0 h-full w-0.5 bg-gradient-to-b from-blue-200/30 via-blue-400/40 to-indigo-400/30 opacity-70 shadow-lg" />
      </div>

      {/* Right Panel - Login Form (responsive) */}
      <div className="flex-1 lg:w-[40%] xl:w-[45%] 2xl:w-[50%] flex items-center justify-center p-3 sm:p-4 lg:p-8 relative bg-white/90 backdrop-blur-xl overflow-y-auto">
        <div className="w-full max-w-sm lg:max-w-md">
          <Card className="shadow-2xl bg-white/95 rounded-2xl overflow-hidden px-2 py-2">
            <CardHeader className="text-center pb-3 lg:pb-6 pt-6 lg:pt-10">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl flex items-center justify-center mx-auto mb-3 lg:mb-5 shadow-xl">
                <Shield className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <CardTitle className="text-lg lg:text-2xl font-bold text-gray-900 mb-2">
                Welcome back
              </CardTitle>
              <CardDescription className="text-gray-600 text-xs lg:text-sm leading-relaxed">
                Sign in to access your facility management dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-4 lg:pb-6">
              {errors.general && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-3 h-3 text-red-600" />
                  <p className="text-xs text-red-800">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 lg:space-y-5">
                {/* Email Field */}
                <div className="space-y-1 lg:space-y-2">
                  <Label htmlFor="email" className="text-xs lg:text-sm font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <div className={cn(
                    "relative group transition-all duration-300",
                    focusedField === "email" && "ring-2 ring-blue-500/20",
                    errors.email && "ring-2 ring-red-500/20"
                  )}>
                    <Mail className={cn(
                      "absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 lg:w-4 lg:h-4 transition-colors duration-300",
                      focusedField === "email" ? "text-blue-500" : errors.email ? "text-red-500" : "text-gray-400"
                    )} />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "pl-8 lg:pl-10 h-10 lg:h-12 border-2 focus:ring-blue-500/20 rounded-lg lg:rounded-xl text-xs lg:text-sm transition-all duration-300 bg-white/50 backdrop-blur-sm",
                        errors.email ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                      )}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1 lg:space-y-2">
                  <Label htmlFor="password" className="text-xs lg:text-sm font-semibold text-gray-700">
                    Password
                  </Label>
                  <div className={cn(
                    "relative group transition-all duration-300",
                    focusedField === "password" && "ring-2 ring-blue-500/20",
                    errors.password && "ring-2 ring-red-500/20"
                  )}>
                    <Lock className={cn(
                      "absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 lg:w-4 lg:h-4 transition-colors duration-300",
                      focusedField === "password" ? "text-blue-500" : errors.password ? "text-red-500" : "text-gray-400"
                    )} />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "pl-8 lg:pl-10 pr-8 lg:pr-10 h-10 lg:h-12 border-2 focus:ring-blue-500/20 rounded-lg lg:rounded-xl text-xs lg:text-sm transition-all duration-300 bg-white/50 backdrop-blur-sm",
                        errors.password ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                      )}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 lg:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300 p-1 rounded-lg hover:bg-gray-100"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3 h-3 lg:w-4 lg:h-4" />
                      ) : (
                        <Eye className="w-3 h-3 lg:w-4 lg:h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md w-3 h-3 lg:w-4 lg:h-4"
                    />
                    <Label htmlFor="remember" className="text-xs text-gray-700 font-medium cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-300 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-9 lg:h-11 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-semibold text-xs lg:text-sm rounded-lg shadow-md hover:shadow-xl transition-all duration-500 transform hover:scale-[1.01] disabled:transform-none disabled:opacity-70"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 lg:w-4 lg:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Sign in to dashboard</span>
                      <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4" />
                    </div>
                  )}
                </Button>



                {/* Register Link */}
                <div className="text-center">
                  <p className="text-xs lg:text-sm text-gray-600">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                      Create account
                    </Link>
                  </p>
                </div>
              </form>
              {/* Footer */}
              <div className="mt-3 lg:mt-6 text-center">
                <p className="text-xs text-gray-400">
                  © 2025 FacilioTrack. All rights reserved.
                </p>
                <div className="flex items-center justify-center space-x-2 lg:space-x-4 mt-1 lg:mt-3">
                  <button className="text-xs text-gray-400 hover:text-blue-700 transition-colors">
                    Privacy Policy
                  </button>
                  <button className="text-xs text-gray-400 hover:text-blue-700 transition-colors">
                    Terms
                  </button>
                  <button className="text-xs text-gray-400 hover:text-blue-700 transition-colors">
                    Support
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
