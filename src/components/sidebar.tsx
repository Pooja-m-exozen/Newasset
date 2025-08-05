"use client"

import { useState, useEffect } from "react"
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
  Brain,
  BarChart3,
  Activity,
  Settings,
  Shield,
  Database,
  QrCode,
  Barcode,
  Wifi,
  Scan,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Bot
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeItem, setActiveItem] = useState("dashboard")
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>(null)

  // Update active item based on current pathname
  useEffect(() => {
    const currentItem = navigationItems.find(item => item.href === pathname)
    if (currentItem) {
      setActiveItem(currentItem.id)
    }
  }, [pathname])

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      href: "/admin/dashboard"
    },
    {
      id: "users",
      label: "Manage Users",
      icon: Users,
      href: "/admin/manageusers",
      description: "User management and permissions"
    },
    {
      id: "assets",
      label: "Manage Assets",
      icon: Building2,
      href: "/admin/manageassets",
      description: "Asset tracking and maintenance"
    },
    {
      id: "locations",
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
      id: "ai-analytics",
      label: "AI Analytics",
      icon: Brain,
      href: "/admin/ai-analytics",
      description: "AI-powered analytics and insights"
    },
    {
      id: "automation",
      label: "Automation",
      icon: Bot,
      href: "/admin/automation",
      description: "Automated workflows and processes"
    },
    {
      id: "reports",
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
        },
        {
          id: "audit-trails",
          label: "Audit Trails Logs",
          href: "/admin/viewalllogs/audit-trails",
          description: "System access and changes"
        }
      ]
    }
  ]

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId)
    
    // Find the navigation item to get the href
    const navigationItem = navigationItems.find(item => item.id === itemId)
    if (navigationItem && navigationItem.href) {
      router.push(navigationItem.href)
    }
  }

  const handleSubmenuToggle = (itemId: string) => {
    setExpandedSubmenu(expandedSubmenu === itemId ? null : itemId)
  }

  const handleSubmenuItemClick = (parentId: string, submenuItem: any) => {
    setActiveItem(submenuItem.id)
    router.push(submenuItem.href)
  }

  return (
    <div className={cn(
      "flex flex-col h-screen bg-white border-r border-gray-200 shadow-sm transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-teal-500 rounded-lg flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">FacilioTrack</h2>
              <p className="text-xs text-gray-400">Enterprise</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-500" /> : <ChevronLeft className="w-4 h-4 text-gray-500" />}
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
                  ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700" 
                  : "hover:bg-gray-50 text-gray-700",
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
                activeItem === item.id ? "text-white" : "text-gray-500 group-hover:text-gray-700"
              )} />
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{item.label}</div>
                  {item.description && (
                    <div className={cn(
                      "text-xs mt-0.5 transition-colors duration-200",
                      activeItem === item.id ? "text-blue-100" : "text-gray-400 group-hover:text-gray-500"
                    )}>
                      {item.description}
                    </div>
                  )}
                </div>
              )}
              {!isCollapsed && item.submenu && (
                <div className="ml-auto">
                  {expandedSubmenu === item.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              )}
            </Button>

            {/* Submenu */}
            {!isCollapsed && item.submenu && expandedSubmenu === item.id && (
              <div className="ml-4 mt-1 space-y-1">
                {item.submenu.map((submenuItem: any) => (
                  <Button
                    key={submenuItem.id}
                    variant={activeItem === submenuItem.id ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start h-auto py-2 px-3 rounded-lg transition-all duration-200 group text-sm",
                      activeItem === submenuItem.id 
                        ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700" 
                        : "hover:bg-gray-50 text-gray-700",
                      "transform hover:scale-[1.01]"
                    )}
                    onClick={() => handleSubmenuItemClick(item.id, submenuItem)}
                  >
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{submenuItem.label}</div>
                      {submenuItem.description && (
                        <div className={cn(
                          "text-xs mt-0.5 transition-colors duration-200",
                          activeItem === submenuItem.id ? "text-blue-100" : "text-gray-400 group-hover:text-gray-500"
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
      <div className="p-3 border-t border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className={cn(
            "w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 py-2.5",
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