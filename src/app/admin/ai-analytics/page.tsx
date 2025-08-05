'use client'

import React, { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { AIAnalyticsDashboard } from '@/components/ui/ai-analytics-dashboard'
import { Brain } from 'lucide-react'
import { 
  getSystemInsights, 
  getPerformanceMetrics, 
  getPredictiveInsights,
  convertApiResponseToInsights,
  type SystemInsight,
  type SystemPerformance,
  type AIInsightsResponse,
  type Recommendation,
  type RecommendationRequest
} from '@/lib/ai-analytics'

export default function AIAnalyticsPage() {
  const [insights, setInsights] = useState<SystemInsight[]>([])
  const [performance, setPerformance] = useState<SystemPerformance | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [aiInsights, setAiInsights] = useState<AIInsightsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30_days')
  const [selectedInsightType, setSelectedInsightType] = useState('performance')
  const [bearerToken, setBearerToken] = useState('')

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

  const fetchInsights = async (insightType: string = selectedInsightType, timeRange: string = selectedTimeRange) => {
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
  }

  const fetchRecommendations = async (request: RecommendationRequest) => {
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
  }

  const handleRefresh = () => {
    fetchInsights()
  }

  const handleTimeRangeChange = (timeRange: string) => {
    setSelectedTimeRange(timeRange)
    fetchInsights(selectedInsightType, timeRange)
  }

  const handleInsightTypeChange = (insightType: string) => {
    setSelectedInsightType(insightType)
    fetchInsights(insightType, selectedTimeRange)
  }

  const clearError = () => {
    setError(null)
  }

  // Load initial data
  useEffect(() => {
    if (bearerToken) {
      fetchInsights()
    }
  }, [bearerToken])

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
          />
        </div>
      </div>
    </div>
  )
}
