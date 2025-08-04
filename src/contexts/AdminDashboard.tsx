"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { adminDashboardService, DashboardData, PredictionsResponse } from '@/lib/AdminDashboard'

interface AdminDashboardContextType {
  dashboardData: DashboardData | null
  predictionsData: PredictionsResponse | null
  isLoading: boolean
  isPredictionsLoading: boolean
  error: string | null
  predictionsError: string | null
  refreshDashboard: () => Promise<void>
  refreshPredictions: () => Promise<void>
}

const AdminDashboardContext = createContext<AdminDashboardContextType | undefined>(undefined)

export function AdminDashboardProvider({ children }: { children: ReactNode }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [predictionsData, setPredictionsData] = useState<PredictionsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPredictionsLoading, setIsPredictionsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [predictionsError, setPredictionsError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await adminDashboardService.getDashboardData()
      setDashboardData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
      console.error('Dashboard data fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPredictionsData = async () => {
    try {
      setIsPredictionsLoading(true)
      setPredictionsError(null)
      const data = await adminDashboardService.getPredictions()
      setPredictionsData(data)
    } catch (err) {
      setPredictionsError(err instanceof Error ? err.message : 'Failed to fetch predictions data')
      console.error('Predictions data fetch error:', err)
    } finally {
      setIsPredictionsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    fetchPredictionsData()
  }, [])

  const refreshDashboard = async () => {
    await fetchDashboardData()
  }

  const refreshPredictions = async () => {
    await fetchPredictionsData()
  }

  const value: AdminDashboardContextType = {
    dashboardData,
    predictionsData,
    isLoading,
    isPredictionsLoading,
    error,
    predictionsError,
    refreshDashboard,
    refreshPredictions
  }

  return (
    <AdminDashboardContext.Provider value={value}>
      {children}
    </AdminDashboardContext.Provider>
  )
}

export function useAdminDashboard() {
  const context = useContext(AdminDashboardContext)
  if (context === undefined) {
    throw new Error('useAdminDashboard must be used within an AdminDashboardProvider')
  }
  return context
}
