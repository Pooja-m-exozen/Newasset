'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { AIAnalyticsDashboard } from '@/components/ui/ai-analytics-dashboard'
import { Brain } from 'lucide-react'
import { 
  getSystemInsights, 
  convertApiResponseToInsights,
  type SystemInsight,
  type AIInsightsResponse,
  type Recommendation,
  type RecommendationRequest
} from '@/lib/ai-analytics'

export default function AIAnalyticsPage() {
  const [insights, setInsights] = useState<SystemInsight[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [aiInsights, setAiInsights] = useState<AIInsightsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30_days')
  const [selectedInsightType, setSelectedInsightType] = useState('performance')
  const [bearerToken, setBearerToken] = useState('')
  const [anomalies, setAnomalies] = useState<unknown[]>([])
  const [totalAnomalies, setTotalAnomalies] = useState(0)
  const [anomaliesLoading, setAnomaliesLoading] = useState(false)
  const [anomaliesError, setAnomaliesError] = useState<string | null>(null)

  // Get bearer token from localStorage or prompt user
  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    if (token) {
      setBearerToken(token)
    } else {
      const userToken = prompt('Please enter your Bearer Token:')
      if (userToken) {
        setBearerToken(userToken)
        localStorage.setItem('authToken', userToken)
      }
    }
  }, [])

  const fetchInsights = useCallback(async (insightType: string = selectedInsightType, timeRange: string = selectedTimeRange) => {
    if (!bearerToken) {
      setError('Bearer token is required')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const data = await getSystemInsights(insightType, timeRange, bearerToken)
      
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
  }, [bearerToken, selectedInsightType, selectedTimeRange])

  const fetchRecommendations = useCallback(async (request: RecommendationRequest) => {
    if (!bearerToken) {
      setError('Bearer token is required')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const { getRecommendations } = await import('@/lib/ai-analytics')
      const data = await getRecommendations(request, bearerToken)
      
      if (data && data.success) {
        setRecommendations(data.recommendations)
      } else {
        setRecommendations([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations')
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }, [bearerToken])

  const fetchPerformanceAnomalies = useCallback(async () => {
    if (!bearerToken) {
      setAnomaliesError('Bearer token is required')
      return
    }

    setAnomaliesLoading(true)
    setAnomaliesError(null)
    
    try {
      const response = await fetch('http://192.168.0.5:5021/api/ai/anomalies/performance', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.')
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to view anomalies.')
        } else {
          throw new Error(`Failed to fetch anomalies: ${response.status}`)
        }
      }

      const data = await response.json()
      
      if (data && data.success) {
        setAnomalies(data.anomalies || [])
        setTotalAnomalies(data.totalAnomalies || 0)
      } else {
        setAnomalies([])
        setTotalAnomalies(0)
      }
    } catch (err) {
      setAnomaliesError(err instanceof Error ? err.message : 'Failed to fetch performance anomalies')
      setAnomalies([])
      setTotalAnomalies(0)
    } finally {
      setAnomaliesLoading(false)
    }
  }, [bearerToken])

  const handleRefresh = useCallback(() => {
    fetchInsights()
    fetchPerformanceAnomalies()
  }, [fetchInsights, fetchPerformanceAnomalies])

  const handleAnomaliesRefresh = useCallback(() => {
    fetchPerformanceAnomalies()
  }, [fetchPerformanceAnomalies])

  const handleTimeRangeChange = useCallback((timeRange: string) => {
    setSelectedTimeRange(timeRange)
    fetchInsights(selectedInsightType, timeRange)
  }, [selectedInsightType, fetchInsights])

  const handleInsightTypeChange = useCallback((insightType: string) => {
    setSelectedInsightType(insightType)
    fetchInsights(insightType, selectedTimeRange)
  }, [selectedTimeRange, fetchInsights])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Load initial data
  useEffect(() => {
    if (bearerToken) {
      fetchInsights()
      fetchPerformanceAnomalies()
    }
  }, [bearerToken, fetchInsights, fetchPerformanceAnomalies])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Header */}
          <PageHeader
            title="AI Analytics Dashboard"
            description="AI-powered insights, performance monitoring, and predictive analytics for your asset management system"
            icon={<Brain className="h-6 w-6 text-primary" />}
          />

          {/* AI Analytics Dashboard with Integrated Filters */}
          <AIAnalyticsDashboard
            aiInsights={aiInsights}
            insights={insights}
            recommendations={recommendations}
            loading={loading}
            error={error}
            selectedTimeRange={selectedTimeRange}
            selectedInsightType={selectedInsightType}
            onRefresh={handleRefresh}
            onClearError={clearError}
            onTimeRangeChange={handleTimeRangeChange}
            onInsightTypeChange={handleInsightTypeChange}
            onFetchRecommendations={fetchRecommendations}
            anomalies={anomalies}
            totalAnomalies={totalAnomalies}
            anomaliesLoading={anomaliesLoading}
            anomaliesError={anomaliesError}
            onAnomaliesRefresh={handleAnomaliesRefresh}
          />
        </div>
      </div>
    </div>
  )
}
