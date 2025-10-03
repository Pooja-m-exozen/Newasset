"use client"

import { useState } from "react"
import Image from "next/image"
import { getAssetPath } from "@/lib/asset-utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { 
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className }: SidebarProps) {
  const { logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

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
                src={getAssetPath("/exozen_logo.png")} 
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

      {/* Content Area - Empty for now */}
      <div className="flex-1 px-3 py-3 bg-white dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
          {!isCollapsed && (
            <p>Navigation moved to header</p>
          )}
        </div>
      </div>

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