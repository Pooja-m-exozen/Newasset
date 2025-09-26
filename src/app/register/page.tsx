"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, ArrowRight, Zap, Building2, Users, Settings, TrendingUp, User, Mail, Lock, CheckCircle, AlertCircle, Briefcase, X } from "lucide-react"
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
    <div className="h-screen w-full flex flex-col lg:flex-row bg-gray-50 dark:bg-gray-900 overflow-hidden">

      {/* Mobile Header */}
      <div className="lg:hidden bg-blue-600 py-2 px-4 flex-shrink-0">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
              <Zap className="w-3 h-3 text-blue-600" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Exozen Pvt Ltd</h1>
              <p className="text-blue-100 text-xs">Enterprise Solutions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Left Panel */}
      <div className="hidden lg:flex lg:w-[50%] bg-blue-600 h-screen">
        <div className="flex flex-col justify-center px-8 xl:px-12 py-8 h-full w-full">
          {/* Logo and Brand */}
          <div className="mb-4 xl:mb-6">
            <div className="flex items-center gap-3 mb-3 xl:mb-4">
              <div className="w-8 h-8 xl:w-10 xl:h-10 bg-white rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 xl:w-6 xl:h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg xl:text-xl font-bold text-white">Exozen Pvt Ltd</h1>
                <p className="text-blue-100 text-sm xl:text-base">Enterprise Solutions</p>
              </div>
            </div>
            
            <h2 className="text-2xl xl:text-3xl font-bold text-white mb-2 xl:mb-3 leading-tight">
              Join Our Platform
            </h2>
            <p className="text-blue-100 text-sm xl:text-base leading-relaxed">
              Start your journey with our comprehensive facility management platform and transform your operations.
            </p>
          </div>
          
          {/* Features */}
          <div className="space-y-2 xl:space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2 xl:gap-3">
                <div className="w-7 h-7 xl:w-8 xl:h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-3 h-3 xl:w-4 xl:h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-xs xl:text-sm mb-1">
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
      <div className="flex-1 lg:w-[50%] flex items-center justify-center p-3 sm:p-4 lg:p-6 xl:p-8 bg-white h-screen lg:h-auto overflow-y-auto">
        <div className="w-full max-w-sm sm:max-w-md">
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-3 sm:pb-4 pt-4 sm:pt-6 px-3 sm:px-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
                Create Account
              </CardTitle>
              <CardDescription className="text-gray-600 text-xs sm:text-sm">
                Join Exozen Pvt Ltd and start managing your facilities efficiently
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
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

              <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
                {/* Name Field */}
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs sm:text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="pl-8 sm:pl-10 h-8 sm:h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-8 sm:pl-10 h-8 sm:h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-8 sm:h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm"
                      placeholder="Create a strong password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 touch-manipulation"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Role Field */}
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm font-medium text-gray-700">
                    Role
                  </Label>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <input
                        type="radio"
                        id="user"
                        name="role"
                        value="user"
                        checked={formData.role === "user"}
                        onChange={(e) => handleInputChange("role", e.target.value)}
                        className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded touch-manipulation"
                      />
                      <Label htmlFor="user" className="text-xs sm:text-sm text-gray-700 cursor-pointer touch-manipulation">
                        User
                      </Label>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <input
                        type="radio"
                        id="admin"
                        name="role"
                        value="admin"
                        checked={formData.role === "admin"}
                        onChange={(e) => handleInputChange("role", e.target.value)}
                        className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded touch-manipulation"
                      />
                      <Label htmlFor="admin" className="text-xs sm:text-sm text-gray-700 cursor-pointer touch-manipulation">
                        Admin
                      </Label>
                    </div>
                  </div>
                  {errors.role && (
                    <p className="text-xs text-red-600">{errors.role}</p>
                  )}
                </div>

                {/* Project Name Field */}
                <div className="space-y-1">
                  <Label htmlFor="projectName" className="text-xs sm:text-sm font-medium text-gray-700">
                    Project Name
                  </Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <Input
                      id="projectName"
                      type="text"
                      value={formData.projectName}
                      onChange={(e) => handleInputChange("projectName", e.target.value)}
                      className="pl-8 sm:pl-10 h-8 sm:h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm"
                      placeholder="Enter your project name"
                      required
                    />
                  </div>
                  {errors.projectName && (
                    <p className="text-xs text-red-600">{errors.projectName}</p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-1">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                      className="touch-manipulation w-3 h-3 sm:w-4 sm:h-4"
                    />
                    <Label htmlFor="terms" className="text-xs text-gray-700 cursor-pointer leading-relaxed touch-manipulation">
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-blue-600 hover:text-blue-800 underline touch-manipulation"
                      >
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        onClick={() => setShowPrivacyModal(true)}
                        className="text-blue-600 hover:text-blue-800 underline touch-manipulation"
                      >
                        Privacy Policy
                      </button>
                    </Label>
                  </div>
                  {errors.terms && (
                    <p className="text-xs text-red-600">{errors.terms}</p>
                  )}
                </div>

                {/* Create Account Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-8 sm:h-9 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm touch-manipulation"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span>Create Account</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                  )}
                </Button>

                {/* Login Link */}
                <div className="text-center">
                  <p className="text-xs text-gray-600">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium touch-manipulation">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>

              {/* Footer */}
              <div className="mt-2 sm:mt-3 text-center">
                <p className="text-xs text-gray-400">
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Terms of Service</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4 text-sm text-gray-700">
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
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
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
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Privacy Policy</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4 text-sm text-gray-700">
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
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
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