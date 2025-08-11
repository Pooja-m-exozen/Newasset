'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Input } from './input'
import { Label } from './label'
import { 
  Brain, 
  TrendingUp, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  Minus,
  Target,
  Filter,
  RefreshCw,
  Zap,
  Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  type SystemInsight, 
  type AIInsightsResponse, 
  type Recommendation,
  type RecommendationRequest,
  timeRanges, 
  insightTypes,
  recommendationTypes
} from '@/lib/ai-analytics'

interface AIAnalyticsDashboardProps {
  aiInsights: AIInsightsResponse | null
  insights: SystemInsight[]
  recommendations: Recommendation[]
  loading: boolean
  error: string | null
  selectedTimeRange: string
  selectedInsightType: string
  onRefresh: () => void
  onClearError: () => void
  onTimeRangeChange: (timeRange: string) => void
  onInsightTypeChange: (insightType: string) => void
  onFetchRecommendations: (request: RecommendationRequest) => void
}

export function AIAnalyticsDashboard({
  aiInsights,
  insights,
  recommendations,
  loading,
  error,
  selectedTimeRange,
  selectedInsightType,
  onRefresh,
  onClearError,
  onTimeRangeChange,
  onInsightTypeChange,
  onFetchRecommendations
}: AIAnalyticsDashboardProps) {
  const [recommendationType, setRecommendationType] = useState('cost_optimization')
  const [budgetLimit, setBudgetLimit] = useState('100000')
  const [timeHorizon, setTimeHorizon] = useState('6_months')

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <Activity className="h-5 w-5" />
      case 'usage':
        return <Brain className="h-5 w-5" />
      case 'anomaly':
        return <AlertTriangle className="h-5 w-5" />
      case 'prediction':
        return <Brain className="h-5 w-5" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  const getInsightColor = (type: string, severity?: string) => {
    if (severity === 'critical') return 'from-red-500 to-red-600'
    if (severity === 'high') return 'from-orange-500 to-orange-600'
    if (severity === 'medium') return 'from-yellow-500 to-yellow-600'
    if (severity === 'low') return 'from-green-500 to-green-600'
    
    switch (type) {
      case 'performance':
        return 'from-blue-500 to-blue-600'
      case 'usage':
        return 'from-purple-500 to-purple-600'
      case 'anomaly':
        return 'from-red-500 to-red-600'
      case 'prediction':
        return 'from-indigo-500 to-indigo-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getSeverityBadge = (severity?: string) => {
    if (!severity) return null
    
    const variants = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const

    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'secondary'}>
        {severity.toUpperCase()}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const

    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'secondary'}>
        {priority.toUpperCase()}
      </Badge>
    )
  }

  const formatInsightValue = (value: number, unit: string) => {
    return `${value.toFixed(2)} ${unit}`
  }

  const formatInsightDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleGetRecommendations = () => {
    const request: RecommendationRequest = {
      recommendationType,
      criteria: {
        budgetLimit: parseInt(budgetLimit),
        timeHorizon,
        priorityAreas: ['maintenance', 'efficiency', 'safety']
      }
    }
    onFetchRecommendations(request)
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
              <Button variant="ghost" size="sm" onClick={onClearError}>
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Summary */}
      {aiInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              System Summary
            </CardTitle>
            <CardDescription>
              Real-time overview of your asset management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Assets</p>
                  <p className="text-lg font-semibold text-green-900">{aiInsights.summary.totalAssets}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <p className="text-sm font-medium text-blue-700">Maintenance Logs</p>
                  <p className="text-lg font-semibold text-blue-900">{aiInsights.summary.totalMaintenanceLogs}</p>
                </div>
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div>
                  <p className="text-sm font-medium text-purple-700">Total Users</p>
                  <p className="text-lg font-semibold text-purple-900">{aiInsights.summary.totalUsers}</p>
                </div>
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div>
                  <p className="text-sm font-medium text-orange-700">Insight Type</p>
                  <p className="text-lg font-semibold text-orange-900 capitalize">{aiInsights.summary.insightType}</p>
                </div>
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact Analytics Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              
              <Select value={selectedTimeRange} onValueChange={onTimeRangeChange}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedInsightType} onValueChange={onInsightTypeChange}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {insightTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={onRefresh} 
              disabled={loading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compact AI Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              <CardTitle>AI Recommendations</CardTitle>
            </div>
            <Button 
              onClick={handleGetRecommendations}
              disabled={loading}
              size="sm"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            >
              <Zap className="h-4 w-4 mr-2" />
              Get Recommendations
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Compact Form */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <Label className="text-xs text-gray-600">Type</Label>
              <Select value={recommendationType} onValueChange={setRecommendationType}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {recommendationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label className="text-xs text-gray-600">Budget ($)</Label>
              <Input
                type="number"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                className="h-8"
                placeholder="100000"
              />
            </div>
            
            <div className="flex-1">
              <Label className="text-xs text-gray-600">Time Horizon</Label>
              <Select value={timeHorizon} onValueChange={setTimeHorizon}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3_months">3 Months</SelectItem>
                  <SelectItem value="6_months">6 Months</SelectItem>
                  <SelectItem value="1_year">1 Year</SelectItem>
                  <SelectItem value="2_years">2 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Compact Recommendations Display */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Generated Recommendations</h3>
                <Badge variant="secondary" className="text-xs">{recommendations.length} items</Badge>
              </div>
              
              <div className="space-y-2">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="p-1 rounded bg-gradient-to-r from-yellow-500 to-orange-600">
                        <Lightbulb className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">{recommendation.type.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-600">{recommendation.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getPriorityBadge(recommendation.priority)}
                      <span className="text-xs text-gray-500">Effort: {recommendation.effort}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold">AI Insights</h2>
              <Badge variant="secondary">{Array.isArray(insights) ? insights.length : 0} insights</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !Array.isArray(insights) || insights.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <Brain className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">No Insights Available</h3>
                  <p className="text-gray-600">AI insights will appear here as they are generated</p>
                </div>
                <Button variant="outline" onClick={onRefresh}>
                  Refresh Insights
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(insights) && insights.map((insight) => (
                <Card key={insight.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "p-2 rounded-lg bg-gradient-to-r",
                          getInsightColor(insight.type, insight.severity)
                        )}>
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{insight.title}</CardTitle>
                          <CardDescription className="text-sm">
                            {insight.category}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getSeverityBadge(insight.severity)}
                        <Badge variant="outline" className="text-xs">
                          {insight.type}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {insight.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-gray-500" />
                        <span className="text-lg font-semibold">
                          {formatInsightValue(insight.value, insight.unit)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(insight.trend)}
                        <span className={cn(
                          "text-sm font-medium",
                          insight.trend === 'up' ? "text-green-600" : 
                          insight.trend === 'down' ? "text-red-600" : "text-gray-600"
                        )}>
                          {insight.trendValue > 0 ? '+' : ''}{insight.trendValue.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatInsightDate(insight.timestamp)}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {insight.type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}