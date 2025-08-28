"use client"

import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Header from "@/components/header"

export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role !== 'viewer') {
      // Redirect non-viewer users to appropriate dashboard
      if (user?.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [isAuthenticated, isLoading, user, router])

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
