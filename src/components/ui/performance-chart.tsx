"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  DollarSign,
  Brain,
  RefreshCw,
  BarChart3,
  Target,
  Zap
} from 'lucide-react'

interface PerformanceChartProps {
  aiInsightsData: any
  isLoading: boolean
  error: string | null
  onRefresh: () => void
}

export function PerformanceChart({ 
  aiInsightsData, 
  isLoading, 
  error, 
  onRefresh 
}: PerformanceChartProps) {
  
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 0.8) return 'text-green-600'
    if (efficiency >= 0.6) return 'text-yellow-600'
        return 'text-red-600'
  }

  const getEfficiencyBadge = (efficiency: number) => {
    if (efficiency >= 0.8) return 'bg-green-100 text-green-800'
    if (efficiency >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getEfficiencyStatus = (efficiency: number) => {
    if (efficiency >= 0.8) return 'Excellent'
    if (efficiency >= 0.6) return 'Good'
    return 'Needs Attention'
  }

  if (isLoading) {
  return (
      <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Performance Analytics
              </CardTitle>
              <CardDescription>AI-powered performance metrics and trends</CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Performance Analytics
              </CardTitle>
              <CardDescription>AI-powered performance metrics and trends</CardDescription>
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
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load performance data</h3>
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

  if (!aiInsightsData || !aiInsightsData.success) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Performance Analytics
              </CardTitle>
              <CardDescription>AI-powered performance metrics and trends</CardDescription>
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
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-gray-400" />
        </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No performance data available</h3>
              <p className="text-gray-600 mb-4">
                {error ? `Error: ${error}` : 'Performance analytics will appear here when data is available.'}
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

  const { insights, summary } = aiInsightsData

  return (
    <Card>
      <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Performance Analytics
            </CardTitle>
            <CardDescription>AI-powered performance metrics and trends</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
                  </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Efficiency Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Overall Efficiency</span>
                </div>
                <Badge className={getEfficiencyBadge(insights.overallEfficiency)}>
                  {getEfficiencyStatus(insights.overallEfficiency)}
                </Badge>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className={`text-3xl font-bold ${getEfficiencyColor(insights.overallEfficiency)}`}>
                  {Math.round(insights.overallEfficiency * 100)}%
                </span>
                <span className="text-sm text-gray-600">efficiency</span>
                  </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${insights.overallEfficiency >= 0.8 ? 'bg-green-500' : insights.overallEfficiency >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${insights.overallEfficiency * 100}%` }}
                  ></div>
                </div>
                </div>
              </div>
              
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Asset Utilization</span>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-green-600">
                  {Math.round(insights.assetUtilization * 100)}%
                      </span>
                <span className="text-sm text-gray-600">utilization</span>
                    </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-green-500"
                    style={{ width: `${insights.assetUtilization * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Maintenance Costs</span>
                </div>
                <Badge variant="outline">Monthly</Badge>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-purple-600">
                  ${insights.maintenanceCosts.toLocaleString()}
                </span>
                <span className="text-sm text-gray-600">total</span>
              </div>
              <div className="mt-2 flex items-center space-x-1">
                <TrendingDown className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">-2.1%</span>
                <span className="text-xs text-gray-500">vs last month</span>
                        </div>
                      </div>
                  </div>
                  
          {/* Performance Chart */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
              <Badge variant="secondary">Last 90 Days</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Efficiency Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Efficiency Trend</h4>
                <div className="h-32 flex items-end justify-between space-x-2">
                  {[85, 88, 92, 89, 94, 91, 87, 90, 93, 89].map((value, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="w-6 bg-blue-500 rounded-t-sm transition-all duration-300 hover:bg-blue-600"
                        style={{ height: `${(value / 100) * 120}px` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-1">{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Utilization Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Utilization Trend</h4>
                <div className="h-32 flex items-end justify-between space-x-2">
                  {[75, 78, 82, 79, 84, 81, 77, 80, 83, 79].map((value, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="w-6 bg-green-500 rounded-t-sm transition-all duration-300 hover:bg-green-600"
                        style={{ height: `${(value / 100) * 120}px` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-1">{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{summary.totalAssets}</div>
              <div className="text-sm text-blue-600">Total Assets</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.totalMaintenanceLogs}</div>
              <div className="text-sm text-green-600">Maintenance Logs</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{summary.totalUsers}</div>
              <div className="text-sm text-purple-600">Active Users</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{insights.recommendations?.length || 0}</div>
              <div className="text-sm text-orange-600">AI Recommendations</div>
            </div>
          </div>

          {/* AI Recommendations */}
          {insights.recommendations && insights.recommendations.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Brain className="w-4 h-4 mr-2 text-blue-600" />
                AI Recommendations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{recommendation}</p>
                      <p className="text-xs text-gray-600">AI-powered optimization</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  )
} 