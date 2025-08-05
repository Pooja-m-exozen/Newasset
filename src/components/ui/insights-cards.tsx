"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { LoadingSpinner } from './loading-spinner'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Activity,
  DollarSign,
  Brain,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { AIInsightCard } from '@/lib/AdminDashboard'

interface InsightsCardsProps {
  insights: AIInsightCard[]
  isLoading: boolean
  error: string | null
  onRefresh: () => void
  title?: string
  description?: string
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'TrendingUp':
      return TrendingUp
    case 'Activity':
      return Activity
    case 'DollarSign':
      return DollarSign
    case 'Brain':
      return Brain
    default:
      return TrendingUp
  }
}

const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-4 h-4 text-green-600" />
    case 'down':
      return <TrendingDown className="w-4 h-4 text-red-600" />
    case 'stable':
      return <Minus className="w-4 h-4 text-gray-600" />
    default:
      return <Minus className="w-4 h-4 text-gray-600" />
  }
}

const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return 'text-green-600'
    case 'down':
      return 'text-red-600'
    case 'stable':
      return 'text-gray-600'
    default:
      return 'text-gray-600'
  }
}

export function InsightsCards({ 
  insights, 
  isLoading, 
  error, 
  onRefresh,
  title = "AI Insights",
  description = "AI-powered performance insights and recommendations"
}: InsightsCardsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load insights</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={onRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No insights available</h3>
              <p className="text-gray-600 mb-4">
                {error ? `Error: ${error}` : 'No AI insights data found for the current period.'}
              </p>
              {error && (
                <Button onClick={onRefresh} className="mt-2">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Brain className="w-5 h-5 mr-2 text-blue-600" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {insights.map((insight) => {
            const IconComponent = getIconComponent(insight.icon)
            
            return (
              <div key={insight.id} className="relative group">
                <div className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${insight.color} rounded-lg flex items-center justify-center shadow-lg`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      AI Powered
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {insight.value.toLocaleString()}
                      </span>
                      <span className="text-lg text-gray-600">{insight.unit}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(insight.trend)}
                      <span className={`text-sm font-medium ${getTrendColor(insight.trend)}`}>
                        {insight.trendValue > 0 ? '+' : ''}{insight.trendValue}%
                      </span>
                      <span className="text-xs text-gray-500">vs last period</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-3">
                      {insight.description}
                    </p>
                  </div>
                  
                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-blue-50 bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-300 pointer-events-none" />
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Recommendations section if available */}
        {insights.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">AI Recommendations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Brain className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Optimize maintenance schedule</p>
                  <p className="text-xs text-gray-600">Based on asset performance patterns</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Activity className="w-3 h-3 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Improve asset utilization</p>
                  <p className="text-xs text-gray-600">Increase efficiency by 15%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 