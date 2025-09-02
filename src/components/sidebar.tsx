"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { 
  Users, 
  Building2, 
  MapPin, 
  FileText, 
  Home,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileDigit,
  CheckSquare
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SubmenuItem {
  id: string
  label: string
  href: string
  description: string
}

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  description: string
  submenu?: SubmenuItem[]
}

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeItem, setActiveItem] = useState("dashboard")
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null)
  const [hoveredSubmenu, setHoveredSubmenu] = useState<string | null>(null)

  // Determine user role and show appropriate navigation
  const isViewer = user?.role === 'viewer'
  const isAdmin = user?.role === 'admin'

  const navigationItems: NavigationItem[] = useMemo(() => {
    // Admin navigation items
    const adminItems: NavigationItem[] = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: Home,
        href: "/admin/dashboard",
        description: "Main dashboard and overview"
      },
      {
        id: "users",
        label: "Manage Users",
        icon: Users,
        href: "/admin/manageusers",
        description: "User management and permissions"
      },
      {
        id: "manage-assets",
        label: "Manage Assets",
        icon: Building2,
        href: "/admin/manageassets",
        description: "Asset tracking and maintenance"
      },
      {
        id: "manage-locations",
        label: "Manage Location",
        icon: MapPin,
        href: "/admin/managelocation",
        description: "Location and site management"
      },
      {
        id: "digital-assets",
        label: "Digital Assets",
        icon: FileDigit,
        href: "/admin/digital-assets/generate",
        description: "Create and generate digital assets"
      },
      {
        id: "checklist",
        label: "Checklist",
        icon: CheckSquare,
        href: "/admin/checklist",
        description: "Task checklists and inspections"
      },
      {
        id: "view-assets",
        label: "View Assets",
        icon: Building2,
        href: "/admin/assets",
        description: "Browse and search assets"
      },
      {
        id: "view-reports",
        label: "View All Logs/Reports",
        icon: FileText,
        href: "/admin/viewalllogs/assets-logs",
        description: "Reports and audit trails"
      }
    ]


    // Viewer navigation items
    const viewerItems: NavigationItem[] = [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: Home,
        href: "/viewer/dashboard",
        description: "View asset overview and status"
      },
      {
        id: "viewer-assets",
        label: "View Assets",
        icon: Building2,
        href: "/viewer/assets",
        description: "Browse and search assets"
      },
      {
        id: "viewer-checklist",
        label: "View checklist",
        icon: CheckSquare,
        href: "/viewer/checklist",
        description: "View checklist information"
      }
    ]

    // Return appropriate navigation based on user role
    if (isViewer) {
      return viewerItems
    } else if (isAdmin) {
      return adminItems
    } else {
      // Default to admin items if role is not determined
      return adminItems
    }
  }, [isViewer, isAdmin])

  // Update active item based on current pathname
  useEffect(() => {
    console.log("Current pathname:", pathname)
    
    // First check if current pathname matches any submenu item
    let submenuFound = false
    navigationItems.forEach(item => {
      if (item.submenu) {
        const submenuMatch = item.submenu.find(subItem => subItem.href === pathname)
        if (submenuMatch) {
          console.log("Found submenu match:", submenuMatch.label)
          setActiveItem(submenuMatch.id)
          setExpandedSubmenu(item.id)
          submenuFound = true
        }
      }
    })
    
    // Only check main items if no submenu match was found
    if (!submenuFound) {
      const currentItem = navigationItems.find(item => item.href && item.href !== "" && item.href === pathname)
      if (currentItem) {
        console.log("Found main item match:", currentItem.label)
        setActiveItem(currentItem.id)
      }
    }
  }, [pathname, navigationItems])

  const handleItemClick = useCallback((itemId: string) => {
    console.log("=== handleItemClick DEBUG ===")
    console.log("handleItemClick called with itemId:", itemId)
    setActiveItem(itemId)
    
    // Find the navigation item to get the href
    const navigationItem = navigationItems.find(item => item.id === itemId)
    console.log("Found navigation item:", navigationItem)
    
    if (navigationItem && navigationItem.href && navigationItem.href !== "") {
      console.log("About to navigate to:", navigationItem.href)
      console.log("Using router.push with:", navigationItem.href)
      
      // Use setTimeout to ensure the click event is fully processed
      setTimeout(() => {
        router.push(navigationItem.href)
        console.log("Router.push called successfully")
      }, 100)
    } else {
      console.log("No navigation - empty href or no href")
    }
  }, [navigationItems, router])

  const handleSubmenuToggle = useCallback((itemId: string) => {
    setExpandedSubmenu(expandedSubmenu === itemId ? null : itemId)
  }, [expandedSubmenu])

  const handleSubmenuItemClick = useCallback((parentId: string, submenuItem: SubmenuItem) => {
    console.log("Submenu item clicked:", submenuItem.label, "href:", submenuItem.href)
    setActiveItem(submenuItem.id)
    router.push(submenuItem.href)
  }, [router])

  const handleMouseEnter = useCallback((itemId: string) => {
    if (!isCollapsed) {
      setHoveredSubmenu(itemId)
    }
  }, [isCollapsed])

  const handleMouseLeave = useCallback(() => {
    setHoveredSubmenu(null)
  }, [])

  // Determine if submenu should be visible (either expanded or hovered)
  const isSubmenuVisible = (itemId: string) => {
    return expandedSubmenu === itemId || hoveredSubmenu === itemId
  }

  return (
    <div className={cn(
      "flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* ERP Style Header */}
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 flex items-center justify-center">
              <Image 
                src="/exozen_logo.png" 
                alt="Exozen Logo" 
                width={28}
                height={28}
                className="w-7 h-7 object-contain"
              />
            </div>
            <div>
              <h2 className="text-base font-bold">Exozen Pvt Ltd</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">Asset Management System</p>
            </div>
          </div>
        )}
        <div className="mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300"
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto bg-white dark:bg-gray-900">
        {navigationItems.map((item) => (
          <div 
            key={item.id}
            onMouseEnter={() => handleMouseEnter(item.id)}
            onMouseLeave={handleMouseLeave}
            className="relative"
          >
            <button
              type="button"
              className={cn(
                "w-full justify-start h-auto py-2 px-3 rounded-lg transition-all duration-200 group border",
                activeItem === item.id 
                  ? "text-blue-600 border-blue-600 shadow-sm bg-transparent" 
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600",
                isCollapsed && "justify-center px-2 py-2",
                "transform hover:scale-[1.01]"
              )}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                
                console.log("=== CLICK DEBUG ===")
                console.log("Item ID:", item.id)
                console.log("Item label:", item.label)
                console.log("Item href:", item.href)
                console.log("Has submenu:", !!item.submenu)
                console.log("Submenu:", item.submenu)
                
                if (item.submenu) {
                  console.log("Toggling submenu for:", item.id)
                  handleSubmenuToggle(item.id)
                } else if (item.href && item.href !== "") {
                  console.log("No submenu, navigating to:", item.href)
                  handleItemClick(item.id)
                } else {
                  console.log("No submenu and no valid href")
                }
              }}
            >
              <item.icon className={cn(
                "flex-shrink-0 transition-colors duration-200",
                isCollapsed ? "w-4 h-4" : "w-4 h-4 mr-3",
                activeItem === item.id ? "text-white" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200"
              )} />
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{item.label}</div>
                  {item.description && (
                    <div className={cn(
                      "text-xs mt-0.5 transition-colors duration-200",
                      activeItem === item.id ? "text-blue-100" : "text-gray-500 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400"
                    )}>
                      {item.description}
                    </div>
                  )}
                </div>
              )}
              {!isCollapsed && item.submenu && (
                <div className="ml-auto">
                  {isSubmenuVisible(item.id) ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
              )}
            </button>

            {/* Submenu */}
            {!isCollapsed && item.submenu && isSubmenuVisible(item.id) && (
              <div className="ml-4 mt-1 space-y-1">
                {item.submenu.map((submenuItem: SubmenuItem) => (
                  <Button
                    key={submenuItem.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-auto py-1.5 px-3 rounded-lg transition-all duration-200 group text-sm bg-transparent border border-gray-200 dark:border-gray-600",
                      activeItem === submenuItem.id 
                        ? "text-blue-600 border-blue-600 shadow-sm bg-transparent" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-200 dark:hover:border-blue-600",
                      "transform hover:scale-[1.01]"
                    )}
                    onClick={() => {
                      console.log("Submenu button clicked for:", submenuItem.label)
                      handleSubmenuItemClick(item.id, submenuItem)
                    }}
                  >
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{submenuItem.label}</div>
                      {submenuItem.description && (
                        <div className={cn(
                          "text-xs mt-0.5 transition-colors duration-200",
                          activeItem === submenuItem.id 
                            ? "text-blue-100" 
                            : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                        )}>
                          {submenuItem.description}
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer - Logout Button */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className={cn(
            "w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 dark:hover:text-red-300 rounded-lg border border-red-200 dark:border-red-700 transition-all duration-200 py-2",
            isCollapsed && "w-8 h-8 p-0 justify-center mx-auto"
          )}
        >
          <LogOut className={cn("w-4 h-4", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
        </Button>
      </div>
    </div>
  )
}