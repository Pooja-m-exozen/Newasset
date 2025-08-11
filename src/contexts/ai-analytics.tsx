'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { 
  getSystemInsights, 
  getPerformanceMetrics, 
  getPredictiveInsights,
  getRecommendations,
  convertApiResponseToInsights,
  type AIInsightsResponse,
  type SystemPerformance,
  type SystemInsight,
  type Recommendation,
  type RecommendationsResponse,
  type RecommendationRequest,
  timeRanges,
  insightTypes,
  recommendationTypes
} from '@/lib/ai-analytics'

interface AIAnalyticsContextType {
  // State
  insights: SystemInsight[]
  performance: SystemPerformance | null
  recommendations: Recommendation[]
  aiInsights: AIInsightsResponse | null
  recommendationsResponse: RecommendationsResponse | null
  loading: boolean
  error: string | null
  selectedTimeRange: string
  selectedInsightType: string
  selectedRecommendationType: string
  
  // Actions
  fetchInsights: (insightType?: string, timeRange?: string) => Promise<void>
  fetchPerformance: (timeRange?: string) => Promise<void>
  fetchPredictions: () => Promise<void>
  fetchRecommendations: (request: RecommendationRequest) => Promise<void>
  setTimeRange: (timeRange: string) => void
  setInsightType: (insightType: string) => void
  setRecommendationType: (recommendationType: string) => void
  clearError: () => void
  
  // Constants
  timeRanges: typeof timeRanges
  insightTypes: typeof insightTypes
  recommendationTypes: typeof recommendationTypes
}

const AIAnalyticsContext = createContext<AIAnalyticsContextType | undefined>(undefined)

interface AIAnalyticsProviderProps {
  children: ReactNode
}

export function AIAnalyticsProvider({ children }: AIAnalyticsProviderProps) {
  const [insights, setInsights] = useState<SystemInsight[]>([])
  const [performance, setPerformance] = useState<SystemPerformance | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [aiInsights, setAiInsights] = useState<AIInsightsResponse | null>(null)
  const [recommendationsResponse, setRecommendationsResponse] = useState<RecommendationsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30_days')
  const [selectedInsightType, setSelectedInsightType] = useState('performance')
  const [selectedRecommendationType, setSelectedRecommendationType] = useState('cost_optimization')

  const fetchInsights = useCallback(async (insightType: string = selectedInsightType, timeRange: string = selectedTimeRange) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await getSystemInsights(insightType, timeRange, 'your-bearer-token')
      
      if (data && data.success) {
        setAiInsights(data)
        const insightCards = convertApiResponseToInsights(data)
        setInsights(insightCards)
      } else {
        setInsights([])
        setAiInsights(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights')
      setInsights([])
      setAiInsights(null)
    } finally {
      setLoading(false)
    }
  }, [selectedInsightType, selectedTimeRange])

  const fetchPerformance = async (timeRange: string = selectedTimeRange) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await getPerformanceMetrics(timeRange, 'your-bearer-token')
      setPerformance(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance data')
    } finally {
      setLoading(false)
    }
  }

  const fetchPredictions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const predictions = await getPredictiveInsights('your-bearer-token')
      setInsights(prev => [...prev, ...predictions])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch predictions')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecommendations = async (request: RecommendationRequest) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await getRecommendations(request, 'your-bearer-token')
      setRecommendations(data.recommendations)
      setRecommendationsResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations')
      setRecommendations([])
      setRecommendationsResponse(null)
    } finally {
      setLoading(false)
    }
  }

  const setTimeRange = (timeRange: string) => {
    setSelectedTimeRange(timeRange)
    fetchInsights(selectedInsightType, timeRange)
  }

  const setInsightType = (insightType: string) => {
    setSelectedInsightType(insightType)
    fetchInsights(insightType, selectedTimeRange)
  }

  const setRecommendationType = (recommendationType: string) => {
    setSelectedRecommendationType(recommendationType)
  }

  const clearError = () => {
    setError(null)
  }

  // Load initial data
  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  const value: AIAnalyticsContextType = {
    insights,
    performance,
    recommendations,
    aiInsights,
    recommendationsResponse,
    loading,
    error,
    selectedTimeRange,
    selectedInsightType,
    selectedRecommendationType,
    fetchInsights,
    fetchPerformance,
    fetchPredictions,
    fetchRecommendations,
    setTimeRange,
    setInsightType,
    setRecommendationType,
    clearError,
    timeRanges,
    insightTypes,
    recommendationTypes
  }

  return (
    <AIAnalyticsContext.Provider value={value}>
      {children}
    </AIAnalyticsContext.Provider>
  )
}

export function useAIAnalytics() {
  const context = useContext(AIAnalyticsContext)
  if (context === undefined) {
    throw new Error('useAIAnalytics must be used within an AIAnalyticsProvider')
  }
  return context
}
