"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, ArrowRight, Building2, TrendingUp, User, Mail, Lock, CheckCircle, AlertCircle, Briefcase, X, History, Calendar, Sparkles } from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast, ToastContainer } from "@/components/ui/toast"
import Link from "next/link"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import Image from "next/image"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    projectName: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState("")
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
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
        message: "Please check your email to verify your account. Redirecting to login...",
        duration: 3000
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

      // Redirect to login page after successful registration
      setTimeout(() => {
        router.push("/login")
      }, 2000)

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
                src="/exozen_logo.png" 
                alt="Exozen Logo" 
                width={24} 
                height={24}
                className="object-contain"
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
                  src="/exozen_logo.png" 
                  alt="Exozen Logo" 
                  width={32} 
                  height={32}
                  className="object-contain"
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

      {/* Right Panel - Registration Form */}
      <div className="flex-1 lg:w-[50%] flex items-center justify-center p-4 lg:p-8 relative z-10">
        <div className="w-full max-w-sm">
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardHeader className="text-center pb-6 pt-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Image 
                  src="/exozen_logo.png" 
                  alt="Exozen Logo" 
                  width={32} 
                  height={32}
                  className="object-contain"
                />
              </div>
              <CardTitle className="text-2xl font-bold text-card-foreground mb-2">
                Create Account
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm">
                Join our facility service management platform
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {successMessage && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <p className="text-xs text-green-800">{successMessage}</p>
                </div>
              )}

              {errors.general && (
                <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-3 h-3 text-destructive" />
                  <p className="text-xs text-destructive">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground">
                    Full Name
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors duration-200" />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="pl-10 h-10 bg-white/50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

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
                      value={formData.email}
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
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="pl-10 pr-10 h-10 bg-white/50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                      placeholder="Create a strong password"
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

                {/* Role Field */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">
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
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="user" className="text-sm text-foreground cursor-pointer">
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
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="admin" className="text-sm text-foreground cursor-pointer">
                        Admin
                      </Label>
                    </div>
                  </div>
                  {errors.role && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.role}
                    </p>
                  )}
                </div>

                {/* Project Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="projectName" className="text-sm font-medium text-foreground">
                    Project Name
                  </Label>
                  <div className="relative group">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors duration-200" />
                    <Input
                      id="projectName"
                      type="text"
                      value={formData.projectName}
                      onChange={(e) => handleInputChange("projectName", e.target.value)}
                      className="pl-10 h-10 bg-white/50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-lg transition-all duration-200"
                      placeholder="Enter your project name"
                      required
                    />
                  </div>
                  {errors.projectName && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.projectName}
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
                      className="border border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label htmlFor="terms" className="text-xs text-foreground cursor-pointer leading-relaxed">
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        onClick={() => setShowPrivacyModal(true)}
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        Privacy Policy
                      </button>
                    </Label>
                  </div>
                  {errors.terms && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.terms}
                    </p>
                  )}
                </div>

                {/* Create Account Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg group"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  )}
                </Button>

                {/* Login Link */}
                <div className="text-center pt-1">
                  <p className="text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">
                      Sign in
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
      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[70vh] overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="text-base font-semibold text-gray-900">Terms of Service</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto max-h-[50vh]">
              <div className="space-y-3 text-xs text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h3>
                  <p>By accessing and using Exozen Pvt Ltd&apos;s facility management platform, you accept and agree to be bound by the terms and provision of this agreement.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">2. Use License</h3>
                  <p>Permission is granted to temporarily use Exozen Pvt Ltd&apos;s services for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">3. Disclaimer</h3>
                  <p>The materials on Exozen Pvt Ltd&apos;s platform are provided on an &apos;as is&apos; basis. Exozen Pvt Ltd makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">4. Limitations</h3>
                  <p>In no event shall Exozen Pvt Ltd or its suppliers be liable for any damages arising out of the use or inability to use the materials on the platform.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">5. Accuracy of Materials</h3>
                  <p>The materials appearing on Exozen Pvt Ltd&apos;s platform could include technical, typographical, or photographic errors. We do not warrant that any of the materials are accurate, complete, or current.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">6. Modifications</h3>
                  <p>Exozen Pvt Ltd may revise these terms of service at any time without notice. By using this platform, you are agreeing to be bound by the then current version of these terms.</p>
                </div>
              </div>
            </div>
            <div className="p-2 border-t bg-gray-50">
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[70vh] overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="text-base font-semibold text-gray-900">Privacy Policy</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto max-h-[50vh]">
              <div className="space-y-3 text-xs text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">1. Information We Collect</h3>
                  <p>We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">2. How We Use Your Information</h3>
                  <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">3. Information Sharing</h3>
                  <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">4. Data Security</h3>
                  <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">5. Cookies and Tracking</h3>
                  <p>We use cookies and similar tracking technologies to enhance your experience and analyze how you use our services.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">6. Your Rights</h3>
                  <p>You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">7. Changes to This Policy</h3>
                  <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>
                </div>
              </div>
            </div>
            <div className="p-2 border-t bg-gray-50">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
} 