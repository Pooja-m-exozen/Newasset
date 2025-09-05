"use client"

import { useAuth } from "@/contexts/AuthContext"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import {
  Building2,
  Home,
  Users,
  MapPin,
  FileDigit,
  CheckSquare,
  FileText,
  User,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Determine user role and show appropriate navigation
  const isAdmin = user?.role === 'admin'

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      href: isAdmin ? "/admin/dashboard" : "/viewer/dashboard"
    },
    {
      id: "users",
      label: "Manage Users",
      icon: Users,
      href: "/admin/manageusers",
      adminOnly: true
    },
    {
      id: "manage-assets",
      label: "Manage Assets",
      icon: Building2,
      href: "/admin/manageassets",
      adminOnly: true
    },
    {
      id: "manage-locations",
      label: "Manage Location",
      icon: MapPin,
      href: "/admin/managelocation",
      adminOnly: true
    },
    {
      id: "digital-assets",
      label: "Digital Assets",
      icon: FileDigit,
      href: "/admin/digital-assets/generate",
      adminOnly: true
    },
    {
      id: "checklist",
      label: "Checklist",
      icon: CheckSquare,
      href: isAdmin ? "/admin/checklist" : "/viewer/checklist"
    },
    {
      id: "view-assets",
      label: "View Assets",
      icon: Building2,
      href: isAdmin ? "/admin/assets" : "/viewer/assets"
    },
    {
      id: "view-reports",
      label: "Reports",
      icon: FileText,
      href: "/admin/viewalllogs/assets-logs",
      adminOnly: true
    }
  ]

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <header className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-100 dark:border-gray-800">
      {/* Main Header */}
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo & Brand */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Image 
                src="v1/asset/exozen_logo.png" 
                alt="Exozen Logo" 
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
                priority
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Exozen Pvt Ltd
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Asset Management System
              </p>
            </div>
          </div>

          {/* Right Side - User Info & Actions */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">Welcome back</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{user?.role || 'User'}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={logout}
                className="group relative px-3 py-2 text-sm font-medium text-red-600 hover:text-white bg-white hover:bg-red-600 border border-red-200 hover:border-red-600 dark:text-red-400 dark:bg-gray-800 dark:border-red-600 dark:hover:bg-red-600 dark:hover:text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <LogOut className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="px-6 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {navigationItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "group relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 border-2 shadow-sm hover:shadow-md",
                    pathname === item.href
                      ? "text-blue-600 border-blue-600 shadow-lg transform scale-105 bg-transparent"
                      : "text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-white hover:text-blue-600 hover:border-blue-400 dark:hover:bg-gray-700 dark:hover:text-blue-400 dark:hover:border-blue-500 hover:transform hover:scale-105"
                  )}
                >
                  <item.icon className={cn(
                    "w-4 h-4 mr-2 transition-transform duration-300",
                    pathname === item.href ? "animate-pulse" : "group-hover:scale-110"
                  )} />
                  {item.label}
                  {pathname === item.href && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}
