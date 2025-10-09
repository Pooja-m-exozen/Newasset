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
    <>
    <style jsx global>{`
      .nav-scroll-container {
        -ms-overflow-style: none;
        scrollbar-width: none;
        overflow-x: auto;
      }
      .nav-scroll-container::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
        background: transparent;
      }
      .nav-scroll-container::-webkit-scrollbar-track {
        display: none;
      }
      .nav-scroll-container::-webkit-scrollbar-thumb {
        display: none;
      }
    `}</style>
    <header className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-100 dark:border-gray-800">
      <div className="px-2 sm:px-4 md:px-6 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {/* Left Side - Logo */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <div className="relative">
              <Image 
                src={getAssetPath("/exozen_logo.png")} 
                alt="Exozen Logo" 
                width={32}
                height={32}
                className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain"
                priority
                unoptimized
              />
              <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-green-500 rounded-full border border-white dark:border-gray-900"></div>
            </div>
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
              Asset
            </h1>
          </div>

          {/* Navigation Menu - Responsive */}
          <div className="nav-scroll-container flex items-center space-x-0.5 sm:space-x-1 md:space-x-2 flex-1 mx-1 sm:mx-2 min-w-0">
            {navigationItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "relative px-1 py-1 sm:px-1.5 sm:py-1 md:px-2 md:py-1.5 text-xs sm:text-sm font-semibold transition-colors duration-200 border-b-2 whitespace-nowrap flex-shrink-0 rounded-sm",
                    pathname === item.href
                      ? "text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-950"
                      : "text-gray-800 dark:text-gray-200 border-transparent hover:text-blue-600 hover:border-blue-300 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* Right Side - Date/Time & User Profile */}
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Date/Time - Hidden on small mobile */}
            <div className="hidden sm:block bg-blue-50 dark:bg-blue-950 px-1.5 py-1 rounded-md">
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
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
              <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              
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
    </>
  )
}
