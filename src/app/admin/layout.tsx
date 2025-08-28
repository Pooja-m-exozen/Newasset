"use client"

import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"
import { AdminDashboardProvider } from "@/contexts/AdminDashboard"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/header"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check for system preference or stored theme preference
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role !== 'admin') {
      // Redirect non-admin users to appropriate dashboard
      if (user?.role === 'viewer') {
        router.push('/viewer/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [isAuthenticated, isLoading, user, router])

  return (
    <ProtectedRoute>
      <AdminDashboardProvider>
        <div className="flex flex-col h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-gray-900 transition-colors duration-200">
            {children}
          </main>
        </div>
      </AdminDashboardProvider>
    </ProtectedRoute>
  )
} 