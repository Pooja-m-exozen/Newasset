"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { getAssetPath } from "@/lib/asset-utils"
import {
  Building2,
  Home,
  Users,
  MapPin,
  FileDigit,
  CheckSquare,
  FileText,
  User,
  LogOut,
  QrCode
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false)
      }
    }

    if (isProfileDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isProfileDropdownOpen])

  return (
    <header className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-100 dark:border-gray-800">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo & Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo & App Name */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Image 
                  src={getAssetPath("/exozen_logo.png")} 
                  alt="Exozen Logo" 
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                  priority
                  unoptimized
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
                Asset
              </h1>
            </div>

            {/* Navigation Menu */}
            <div className="flex items-center space-x-4">
              {navigationItems.map((item) => {
                if (item.adminOnly && !isAdmin) return null
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.href)}
                    className={cn(
                      "relative px-3 py-2 text-sm font-semibold transition-colors duration-200 border-b-2 whitespace-nowrap",
                      pathname === item.href
                        ? "text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-950"
                        : "text-gray-800 dark:text-gray-200 border-transparent hover:text-blue-600 hover:border-blue-300 dark:hover:text-blue-400"
                    )}
                  >
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right Side - Date/Time & User Profile */}
          <div className="flex items-center space-x-4">
            {/* Date/Time */}
            <div className="bg-blue-50 dark:bg-blue-950 px-2 py-1.5 rounded-md">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })}
              </span>
            </div>

            {/* User Profile */}
            <div className="relative profile-dropdown">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              >
                <User className="w-5 h-5 text-white" />
              </button>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              
              {/* Logout Dropdown */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[120px] z-50">
                  <button
                    onClick={() => {
                      logout()
                      setIsProfileDropdownOpen(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
