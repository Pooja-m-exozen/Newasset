"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, ArrowRight, History, Calendar, Lock, Mail, Shield, Zap, Building2, Users, Settings, TrendingUp, AlertCircle, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { useToast, ToastContainer } from "@/components/ui/toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import Image from "next/image"
import { getAssetPath } from "@/lib/asset-utils"

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
      title: "Comprehensive Asset Registry",
      description: "Complete inventory management for MEP systems, fire safety equipment, HVAC, electrical, and soft services with QR code tracking and digital asset profiles."
    },
    {
      icon: History,
      title: "Digital Checklist Management",
      description: "Automated inspection checklists for safety compliance, preventive maintenance, and quality assurance with mobile-ready forms and instant reporting."
    },
    {
      icon: Calendar,
      title: "Maintenance Scheduling",
      description: "Smart scheduling for technical services, fire system inspections, security checks, and compliance audits with automated reminders and work orders."
    },
    {
      icon: TrendingUp,
      title: "Service Provider Analytics",
      description: "Real-time dashboards for service delivery metrics, asset performance, compliance status, and operational efficiency tracking."
    }
  ]

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 overflow-hidden">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 py-4 px-4 flex-shrink-0 shadow-lg">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
              <Image 
                src={getAssetPath("/exozen_logo.png")} 
                alt="Exozen Logo" 
                width={24} 
                height={24}
                className="object-contain"
                unoptimized
                priority
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Exozen Pvt Ltd</h1>
              <p className="text-blue-100 text-xs">Enterprise Solutions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Left Panel */}
      <div className="hidden lg:flex lg:w-[50%] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="flex flex-col justify-center px-8 py-8 h-full relative z-10">
          {/* Logo and Brand */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Image 
                  src={getAssetPath("/exozen_logo.png")} 
                  alt="Exozen Logo" 
                  width={32} 
                  height={32}
                  className="object-contain"
                  unoptimized
                  priority
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Exozen Pvt Ltd</h1>
                <p className="text-blue-100">Enterprise Solutions</p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
              Complete Facility Management Solutions
            </h2>
            <p className="text-blue-100 text-base leading-relaxed max-w-md">
              Comprehensive asset tracking, maintenance scheduling, and compliance management for facility service providers. Streamline operations with intelligent checklists and real-time monitoring.
            </p>
          </div>
          
          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 group hover:translate-x-1 transition-transform duration-300">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors duration-300">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1 group-hover:text-blue-100 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-blue-100 text-xs leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 lg:w-[50%] flex items-center justify-center p-4 lg:p-8 relative z-10">
        <div className="w-full max-w-sm">
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardHeader className="text-center pb-6 pt-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Image 
                   src={getAssetPath("/exozen_logo.png")} 
                  alt="Exozen Logo" 
                  width={32} 
                  height={32}
                  className="object-contain"
                  unoptimized
                  priority
                />
              </div>
              <CardTitle className="text-2xl font-bold text-card-foreground mb-2">
                Welcome back
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Access your facility service management platform
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {errors.general && (
                <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-3 h-3 text-destructive" />
                  <p className="text-xs text-destructive">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors duration-200" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10 h-10 bg-white/50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors duration-200" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="pl-10 pr-10 h-10 bg-white/50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password}
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
                      className="border border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label htmlFor="remember" className="text-xs font-medium text-foreground cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Sign In Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg group"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Sign in</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  )}
                </Button>

                {/* Register Link */}
                <div className="text-center pt-1">
                  <p className="text-xs text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                      Create account
                    </Link>
                  </p>
                </div>
              </form>
              
              {/* Footer */}
              <div className="mt-4 text-center border-t border-gray-200 dark:border-slate-700 pt-3">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-500" />
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