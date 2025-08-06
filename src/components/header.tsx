"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  Moon,
  Settings,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Search
} from "lucide-react"

export default function Header() {
  const { user, logout } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }
    return date.toLocaleDateString('en-US', options)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase()
  }

  return (
    <header className="bg-background border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-6 py-3 gap-4 flex-wrap">
        {/* Left - Date Time */}
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900 h-8 px-3 text-xs"
          >
            <Moon className="w-3 h-3 mr-2" />
            {formatDate(currentTime)}
          </Button>
        </div>

     

        {/* Right - Icons & Profile */}
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-accent rounded-lg">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 hover:bg-accent rounded-lg relative"
            >
              <Bell className="w-4 h-4 text-blue-600" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs bg-red-500 text-white border-0 rounded-full">
                3
              </Badge>
            </Button>
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center space-x-2 h-auto p-1.5 hover:bg-accent rounded-lg"
            >
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                  {user ? getInitials(user.name) : <User className="w-4 h-4" />}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-foreground leading-tight">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground leading-tight">
                  {user?.role || "User"}
                </p>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </Button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-popover rounded-lg shadow-lg border border-border py-2 z-50">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-sm font-medium text-popover-foreground">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email || "user@example.com"}</p>
                </div>
                <div className="py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="w-full justify-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
