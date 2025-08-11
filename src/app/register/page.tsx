"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, ArrowRight, Zap, Building2, Users, Settings, TrendingUp, User, Mail, Lock, CheckCircle, AlertCircle, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiService } from "@/lib/api"
import { useToast, ToastContainer } from "@/components/ui/toast"
import Link from "next/link"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    projectName: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (!formData.projectName.trim()) {
      newErrors.projectName = "Project name is required"
    }

    if (!agreeToTerms) {
      newErrors.terms = "You must agree to the terms and conditions"
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
      await apiService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        projectName: formData.projectName
      })

      // Show success toast
      addToast({
        type: "success",
        title: "Registration Successful!",
        message: "Please check your email to verify your account.",
        duration: 5000
      })

      setSuccessMessage("Registration successful! Please check your email to verify your account.")
      
      // Clear form
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "user",
        projectName: ""
      })
      setAgreeToTerms(false)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = "/login"
      }, 3000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed. Please try again."
      
      // Show error toast
      addToast({
        type: "error",
        title: "Registration Failed",
        message: errorMessage,
        duration: 5000
      })

      setErrors({
        general: errorMessage
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

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Left Panel - Hero Section */}
      <div className="lg:w-[60%] relative transition-all duration-500 min-h-[300px] lg:min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-40 h-40 bg-white rounded-full animate-bounce"></div>
          <div className="absolute bottom-32 right-32 w-32 h-32 bg-white rounded-full animate-bounce delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-white rounded-full animate-bounce delay-500"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-6 lg:px-14 py-8 lg:py-10 h-full">
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
            
            <h1 className="text-2xl lg:text-4xl font-bold mb-3 lg:mb-4 bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent leading-tight">
              Join the Future of
              <br />
              <span className="bg-gradient-to-r from-orange-400 to-teal-400 bg-clip-text text-transparent">
                Facility Management
              </span>
            </h1>
            <p className="text-sm lg:text-base text-blue-100 mb-6 lg:mb-8 leading-relaxed">
              Start your journey with our comprehensive facility management platform. Transform your operations today.
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
            <p className="text-blue-200 text-xs mb-3">Join thousands of satisfied users</p>
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
        <div className="absolute top-0 right-0 h-full w-0.5 bg-gradient-to-b from-blue-200/30 via-blue-400/40 to-blue-400/30 opacity-70 shadow-lg hidden lg:block" />
      </div>

      {/* Right Panel - Registration Form */}
      <div className="lg:w-[40%] flex items-center justify-center p-4 lg:p-8 relative bg-white/90 backdrop-blur-xl min-h-screen lg:min-h-0">
        <div className="w-full max-w-sm">
          <Card className="shadow-2xl bg-white/95 rounded-2xl overflow-hidden">
            <CardHeader className="text-center pb-4 lg:pb-6 pt-6 lg:pt-10 px-4 lg:px-6">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl flex items-center justify-center mx-auto mb-4 lg:mb-5 shadow-xl">
                <User className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <CardTitle className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                Create Account
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm leading-relaxed">
                Join FacilioTrack and start managing your facilities efficiently
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 lg:px-6 pb-6">
              {successMessage && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-blue-800">{successMessage}</p>
                </div>
              )}

              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                    Full Name
                  </Label>
                  <div className={cn(
                    "relative group transition-all duration-300",
                    focusedField === "name" && "ring-2 ring-blue-500/20",
                    errors.name && "ring-2 ring-red-500/20"
                  )}>
                    <User className={cn(
                      "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300",
                      focusedField === "name" ? "text-blue-500" : errors.name ? "text-red-500" : "text-gray-400"
                    )} />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      onFocus={() => setFocusedField("name")}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "pl-10 h-11 lg:h-12 border-2 focus:ring-blue-500/20 rounded-xl text-sm transition-all duration-300 bg-white/50 backdrop-blur-sm",
                        errors.name ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                      )}
                      placeholder="Enter your full name"
                      required
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
                  <div className={cn(
                    "relative group transition-all duration-300",
                    focusedField === "email" && "ring-2 ring-blue-500/20",
                    errors.email && "ring-2 ring-red-500/20"
                  )}>
                    <Mail className={cn(
                      "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300",
                      focusedField === "email" ? "text-blue-500" : errors.email ? "text-red-500" : "text-gray-400"
                    )} />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "pl-10 h-11 lg:h-12 border-2 focus:ring-blue-500/20 rounded-xl text-sm transition-all duration-300 bg-white/50 backdrop-blur-sm",
                        errors.email ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
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

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password
                  </Label>
                  <div className={cn(
                    "relative group transition-all duration-300",
                    focusedField === "password" && "ring-2 ring-blue-500/20",
                    errors.password && "ring-2 ring-red-500/20"
                  )}>
                    <Lock className={cn(
                      "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300",
                      focusedField === "password" ? "text-blue-500" : errors.password ? "text-red-500" : "text-gray-400"
                    )} />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "pl-10 pr-10 h-11 lg:h-12 border-2 focus:ring-blue-500/20 rounded-xl text-sm transition-all duration-300 bg-white/50 backdrop-blur-sm",
                        errors.password ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                      )}
                      placeholder="Create a strong password"
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

                {/* Role Field */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    Role
                  </Label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="user"
                        name="role"
                        value="user"
                        checked={formData.role === "user"}
                        onChange={(e) => handleInputChange("role", e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500/20 border-gray-300 rounded"
                      />
                      <Label htmlFor="user" className="text-sm text-gray-700 cursor-pointer">
                        User
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="admin"
                        name="role"
                        value="admin"
                        checked={formData.role === "admin"}
                        onChange={(e) => handleInputChange("role", e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500/20 border-gray-300 rounded"
                      />
                      <Label htmlFor="admin" className="text-sm text-gray-700 cursor-pointer">
                        Admin
                      </Label>
                    </div>
                  </div>
                  {errors.role && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.role}</span>
                    </p>
                  )}
                </div>

                {/* Project Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="projectName" className="text-sm font-semibold text-gray-700">
                    Project Name
                  </Label>
                  <div className={cn(
                    "relative group transition-all duration-300",
                    focusedField === "projectName" && "ring-2 ring-blue-500/20",
                    errors.projectName && "ring-2 ring-red-500/20"
                  )}>
                    <Briefcase className={cn(
                      "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300",
                      focusedField === "projectName" ? "text-blue-500" : errors.projectName ? "text-red-500" : "text-gray-400"
                    )} />
                    <Input
                      id="projectName"
                      type="text"
                      value={formData.projectName}
                      onChange={(e) => handleInputChange("projectName", e.target.value)}
                      onFocus={() => setFocusedField("projectName")}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "pl-10 h-11 lg:h-12 border-2 focus:ring-blue-500/20 rounded-xl text-sm transition-all duration-300 bg-white/50 backdrop-blur-sm",
                        errors.projectName ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                      )}
                      placeholder="Enter your project name"
                      required
                    />
                  </div>
                  {errors.projectName && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.projectName}</span>
                    </p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 rounded-md mt-1"
                    />
                    <Label htmlFor="terms" className="text-xs text-gray-700 font-medium cursor-pointer leading-relaxed">
                      I agree to the{" "}
                      <Link href="/terms" className="text-blue-600 hover:text-blue-800 underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                  {errors.terms && (
                    <p className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.terms}</span>
                    </p>
                  )}
                </div>

                {/* Create Account Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 lg:h-12 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-700 hover:from-blue-700 hover:via-blue-800 hover:to-blue-800 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-xl transition-all duration-500 transform hover:scale-[1.01] disabled:transform-none disabled:opacity-70"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>

                {/* Login Link */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">
                  © 2025 FacilioTrack. All rights reserved.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
} 