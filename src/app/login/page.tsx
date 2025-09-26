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
import { useRouter } from "next/navigation"
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
  const router = useRouter()

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
          router.push("/viewer/dashboard")
        } else {
          router.push("/admin/dashboard")
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-900">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Mobile Header */}
      <div className="lg:hidden bg-blue-600 py-4 px-4 flex-shrink-0">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Exozen Pvt Ltd</h1>
              <p className="text-blue-100 text-sm">Enterprise Solutions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Left Panel */}
      <div className="hidden lg:flex lg:w-[50%] bg-blue-600">
        <div className="flex flex-col justify-center px-12 py-16 h-full">
          {/* Logo and Brand */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <Zap className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Exozen Pvt Ltd</h1>
                <p className="text-blue-100">Enterprise Solutions</p>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-4">
              Transform Your Facility Management
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Streamline operations, enhance asset visibility, and optimize resource utilization with our comprehensive facility management platform.
            </p>
          </div>
          
          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 lg:w-[50%] flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-6 pt-8">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back
              </CardTitle>
              <CardDescription className="text-gray-600">
                Sign in to access your facility management dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {errors.general && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-3 h-3 text-red-600" />
                  <p className="text-xs text-red-800">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="pl-10 pr-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-700">
                      Remember me
                    </Label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Sign in to dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>

                {/* Register Link */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                      Create account
                    </Link>
                  </p>
                </div>
              </form>
              
              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">
                  © 2025 Exozen Pvt Ltd. All rights reserved.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
