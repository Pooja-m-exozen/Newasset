"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { adminDashboardService, DashboardData, PredictionsResponse, AIInsightsData, AIInsightCard, PerformanceData } from '@/lib/AdminDashboard'

interface AdminDashboardContextType {
  dashboardData: DashboardData | null
  predictionsData: PredictionsResponse | null
  aiInsightsData: AIInsightsData | null
  aiInsightCards: AIInsightCard[]
  performanceData: PerformanceData | null
  isLoading: boolean
  isPredictionsLoading: boolean
  isAIInsightsLoading: boolean
  isPerformanceLoading: boolean
  error: string | null
  predictionsError: string | null
  aiInsightsError: string | null
  performanceError: string | null
  refreshDashboard: () => Promise<void>
  refreshPredictions: () => Promise<void>
  refreshAIInsights: (insightType?: string, timeRange?: string) => Promise<void>
  refreshPerformance: (timeRange?: string, metric?: string) => Promise<void>
}

const AdminDashboardContext = createContext<AdminDashboardContextType | undefined>(undefined)

export function AdminDashboardProvider({ children }: { children: ReactNode }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [predictionsData, setPredictionsData] = useState<PredictionsResponse | null>(null)
  const [aiInsightsData, setAiInsightsData] = useState<AIInsightsData | null>(null)
  const [aiInsightCards, setAiInsightCards] = useState<AIInsightCard[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPredictionsLoading, setIsPredictionsLoading] = useState(true)
  const [isAIInsightsLoading, setIsAIInsightsLoading] = useState(true)
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [predictionsError, setPredictionsError] = useState<string | null>(null)
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null)
  const [performanceError, setPerformanceError] = useState<string | null>(null)

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

  const fetchAIInsightsData = async (insightType: string = 'performance', timeRange: string = '90_days') => {
    try {
      setIsAIInsightsLoading(true)
      setAiInsightsError(null)
      
      const data = await adminDashboardService.getAIInsights(insightType, timeRange)
      setAiInsightsData(data)
      
      // Convert AI insights to dashboard cards
      const cards = adminDashboardService.convertAIInsightsToCards(data)
      setAiInsightCards(cards)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch AI insights data'
      setAiInsightsError(errorMessage)
      console.error('AI insights data fetch error:', err)
    } finally {
      setIsAIInsightsLoading(false)
    }
  }

  const fetchPerformanceData = async (timeRange: string = '30_days', metric: string = 'all') => {
    try {
      setIsPerformanceLoading(true)
      setPerformanceError(null)
      const data = await adminDashboardService.getPerformanceData(timeRange, metric)
      setPerformanceData(data)
    } catch (err) {
      setPerformanceError(err instanceof Error ? err.message : 'Failed to fetch performance data')
      console.error('Performance data fetch error:', err)
    } finally {
      setIsPerformanceLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    fetchPredictionsData()
    fetchAIInsightsData()
    fetchPerformanceData()
  }, [])

  const refreshDashboard = async () => {
    await fetchDashboardData()
  }

  const refreshPredictions = async () => {
    await fetchPredictionsData()
  }

  const refreshAIInsights = async (insightType?: string, timeRange?: string) => {
    await fetchAIInsightsData(insightType, timeRange)
  }

  const refreshPerformance = async (timeRange?: string, metric?: string) => {
    try {
      setIsPerformanceLoading(true)
      setPerformanceError(null)
      const data = await adminDashboardService.getPerformanceData(timeRange, metric)
      setPerformanceData(data)
    } catch (err) {
      setPerformanceError(err instanceof Error ? err.message : 'Failed to fetch performance data')
      console.error('Performance data fetch error:', err)
    } finally {
      setIsPerformanceLoading(false)
    }
  }

  const value: AdminDashboardContextType = {
    dashboardData,
    predictionsData,
    aiInsightsData,
    aiInsightCards,
    performanceData,
    isLoading,
    isPredictionsLoading,
    isAIInsightsLoading,
    isPerformanceLoading,
    error,
    predictionsError,
    aiInsightsError,
    performanceError,
    refreshDashboard,
    refreshPredictions,
    refreshAIInsights,
    refreshPerformance
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
