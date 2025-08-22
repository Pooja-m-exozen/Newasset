"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
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
  Zap,
  ChevronDown,
  ChevronUp,
  FileDigit,
  // Bot,
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
        href: "/admin/viewalllogs",
        description: "Reports and audit trails",
        submenu: [
          {
            id: "assets-logs",
            label: "Assets Logs",
            href: "/admin/viewalllogs/assets-logs",
            description: "Asset activity and changes"
          },
          {
            id: "maintenance-logs",
            label: "Maintenance Logs",
            href: "/admin/viewalllogs/maintenance-logs",
            description: "Maintenance activities and schedules"
          }
        ]
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
        icon: MapPin,
        href: "/viewer/checklist",
        description: "View checklist information"
      },
      // {
      //   id: "viewer-reports",
      //   label: "View Reports",
      //   icon: FileText,
      //   href: "/viewer/reports",
      //   description: "View asset reports and logs"
      // }
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
    const currentItem = navigationItems.find(item => item.href === pathname)
    if (currentItem) {
      setActiveItem(currentItem.id)
    }
  }, [pathname, navigationItems])

  const handleItemClick = useCallback((itemId: string) => {
    setActiveItem(itemId)
    
    // Find the navigation item to get the href
    const navigationItem = navigationItems.find(item => item.id === itemId)
    if (navigationItem && navigationItem.href) {
      router.push(navigationItem.href)
    }
  }, [navigationItems, router])

  const handleSubmenuToggle = useCallback((itemId: string) => {
    setExpandedSubmenu(expandedSubmenu === itemId ? null : itemId)
  }, [expandedSubmenu])

  const handleSubmenuItemClick = useCallback((parentId: string, submenuItem: SubmenuItem) => {
    setActiveItem(submenuItem.id)
    router.push(submenuItem.href)
  }, [router])

  return (
    <div className={cn(
      "flex flex-col h-screen bg-sidebar border-r border-sidebar-border shadow-sm transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-teal-500 rounded-lg flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-sidebar-foreground">FacilioTrack</h2>
              <p className="text-xs text-sidebar-accent-foreground">Enterprise</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-sidebar-accent rounded-lg"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 text-sidebar-accent-foreground" /> : <ChevronLeft className="w-4 h-4 text-sidebar-accent-foreground" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <div key={item.id}>
            <Button
              variant={activeItem === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-auto py-2.5 px-3 rounded-lg transition-all duration-200 group",
                activeItem === item.id 
                  ? "bg-blue-700 text-white shadow-sm hover:bg-blue-800 dark:bg-sidebar-primary dark:text-sidebar-primary-foreground dark:hover:bg-sidebar-primary/90" 
                  : "hover:bg-blue-100 text-blue-900 dark:hover:bg-sidebar-accent dark:text-sidebar-foreground",
                isCollapsed && "justify-center px-2 py-2.5",
                "transform hover:scale-[1.01]"
              )}
              onClick={() => {
                if (item.submenu) {
                  handleSubmenuToggle(item.id)
                } else {
                  handleItemClick(item.id)
                }
              }}
            >
              <item.icon className={cn(
                "flex-shrink-0 transition-colors duration-200",
                isCollapsed ? "w-5 h-5" : "w-4 h-4 mr-3",
                activeItem === item.id ? "text-sidebar-primary-foreground" : "text-sidebar-accent-foreground group-hover:text-sidebar-foreground"
              )} />
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{item.label}</div>
                  {item.description && (
                    <div className={cn(
                      "text-xs mt-0.5 transition-colors duration-200",
                      activeItem === item.id ? "text-sidebar-primary-foreground/70" : "text-sidebar-accent-foreground group-hover:text-sidebar-foreground/70"
                    )}>
                      {item.description}
                    </div>
                  )}
                </div>
              )}
              {!isCollapsed && item.submenu && (
                <div className="ml-auto">
                  {expandedSubmenu === item.id ? (
                    <ChevronUp className="w-4 h-4 text-sidebar-accent-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-sidebar-accent-foreground" />
                  )}
                </div>
              )}
            </Button>

            {/* Submenu */}
            {!isCollapsed && item.submenu && expandedSubmenu === item.id && (
              <div className="ml-4 mt-1 space-y-1">
                {item.submenu.map((submenuItem: SubmenuItem) => (
                  <Button
                    key={submenuItem.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-auto py-2 px-3 rounded-lg transition-all duration-200 group text-sm bg-transparent",
                      activeItem === submenuItem.id 
                        ? "bg-blue-700 text-white shadow-sm hover:bg-blue-800 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700" 
                        : "text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-900 dark:hover:text-blue-300",
                      "transform hover:scale-[1.01]"
                    )}
                    onClick={() => handleSubmenuItemClick(item.id, submenuItem)}
                  >
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{submenuItem.label}</div>
                      {submenuItem.description && (
                        <div className={cn(
                          "text-xs mt-0.5 transition-colors duration-200",
                          activeItem === submenuItem.id 
                            ? "text-white/70 dark:text-white/70" 
                            : "text-gray-500 dark:text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-300"
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
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className={cn(
            "w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 rounded-lg transition-all duration-200 py-2.5",
            isCollapsed && "w-10 h-10 p-0 justify-center mx-auto"
          )}
        >
          <LogOut className={cn("w-4 h-4", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
        </Button>
      </div>
    </div>
  )
}