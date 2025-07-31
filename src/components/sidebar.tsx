"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Users, 
  Building2, 
  MapPin, 
  FileText, 
  Activity,
  Database,
  BarChart3, 
  Calendar,
  History,
  Home,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeItem, setActiveItem] = useState("dashboard")

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      href: "/dashboard"
    },
    {
      id: "users",
      label: "Manage Users",
      icon: Users,
      href: "/users",
      description: "User management and permissions"
    },
    {
      id: "assets",
      label: "Manage Assets",
      icon: Building2,
      href: "/assets",
      description: "Asset tracking and maintenance"
    },
    {
      id: "locations",
      label: "Manage Location",
      icon: MapPin,
      href: "/locations",
      description: "Location and site management"
    },
    {
      id: "reports",
      label: "View All Logs/Reports",
      icon: FileText,
      href: "/reports",
      description: "Reports and audit trails"
    },
    {
      id: "audit",
      label: "Audit Trails",
      icon: Activity,
      href: "/audit",
      description: "System activity monitoring"
    },
    {
      id: "erp",
      label: "ERP Integration Controls",
      icon: Database,
      href: "/erp",
      description: "ERP system integration"
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      href: "/analytics",
      description: "Performance analytics"
    },
    {
      id: "maintenance",
      label: "Maintenance",
      icon: Calendar,
      href: "/maintenance",
      description: "Scheduled maintenance"
    },
    {
      id: "history",
      label: "History",
      icon: History,
      href: "/history",
      description: "Historical data"
    }
  ]

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId)
    console.log(`Navigating to: ${itemId}`)
  }

  return (
    <div className={cn(
      "flex flex-col h-screen bg-white border-r border-gray-100 shadow-sm transition-all duration-300",
      isCollapsed ? "w-16" : "w-72",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-teal-500 rounded-xl flex items-center justify-center shadow-sm">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">FacilioTrack</h2>
              <p className="text-xs text-gray-400">Enterprise</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-9 w-9 p-0 hover:bg-gray-100 rounded-full"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5 text-gray-500" /> : <ChevronLeft className="w-5 h-5 text-gray-500" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <div key={item.id}>
            <Button
              variant={activeItem === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-auto py-3 px-4 rounded-xl transition-all duration-200 group",
                activeItem === item.id 
                  ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700" 
                  : "hover:bg-gray-50 text-gray-700",
                isCollapsed && "justify-center px-2 py-3",
                "transform hover:scale-[1.01]"
              )}
              onClick={() => handleItemClick(item.id)}
            >
              <item.icon className={cn(
                "flex-shrink-0 transition-colors duration-200",
                isCollapsed ? "w-6 h-6" : "w-5 h-5 mr-3",
                activeItem === item.id ? "text-white" : "text-gray-500 group-hover:text-gray-700"
              )} />
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <div className="font-semibold text-sm">{item.label}</div>
                  {item.description && (
                    <div className={cn(
                      "text-xs mt-1 transition-colors duration-200",
                      activeItem === item.id ? "text-blue-100" : "text-gray-400 group-hover:text-gray-500"
                    )}>
                      {item.description}
                    </div>
                  )}
                </div>
              )}
            </Button>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        {/* User Profile */}
        {!isCollapsed && (
          <Card className="bg-gray-50 mb-3 rounded-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">Admin User</p>
                  <p className="text-xs text-gray-400 truncate">admin@faciliotrack.com</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logout Button */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200",
            isCollapsed && "w-12 h-12 p-0 justify-center mx-auto"
          )}
        >
          <LogOut className={cn("w-5 h-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span className="font-semibold">Logout</span>}
        </Button>
      </div>
    </div>
  )
}