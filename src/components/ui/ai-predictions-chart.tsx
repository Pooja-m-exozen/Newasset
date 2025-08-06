"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { 
  Brain,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Building2,
  Users,
  Gauge,
  Zap,
  Info,
  Eye,
  Filter
} from 'lucide-react'

interface Prediction {
  assetId: string
  assetType: string
  prediction: {
    confidence: number
    nextMaintenanceDate: string
    predictedIssues: string[]
  }
}

interface PredictionsData {
  success: boolean
  predictions: Prediction[]
  count: number
}

interface AIPredictionsChartProps {
  predictionsData: PredictionsData | null
  isLoading: boolean
  error: string | null
  onRefresh: () => void
}

interface ChartData {
  confidence: Record<string, number>
  assetType: Record<string, number>
  maintenance: Record<string, number>
}

export function AIPredictionsChart({
  predictionsData,
  isLoading,
  error,
  onRefresh
}: AIPredictionsChartProps) {
  const [selectedChartType, setSelectedChartType] = useState<'pie' | 'bar' | 'line'>('pie')
  const [selectedMetric, setSelectedMetric] = useState<'confidence' | 'maintenance' | 'assetType'>('confidence')
  const [showDetails, setShowDetails] = useState(false)

  // Process predictions data for charts with proper typing
  const chartData = useMemo((): ChartData | null => {
    if (!predictionsData?.predictions) return null

    const predictions = predictionsData.predictions

    // Confidence distribution
    const confidenceData = {
      high: predictions.filter((p: Prediction) => p.prediction.confidence > 0.8).length,
      medium: predictions.filter((p: Prediction) => p.prediction.confidence > 0.6 && p.prediction.confidence <= 0.8).length,
      low: predictions.filter((p: Prediction) => p.prediction.confidence <= 0.6).length
    }

    // Asset type distribution
    const assetTypeData = predictions.reduce((acc: Record<string, number>, p: Prediction) => {
      acc[p.assetType] = (acc[p.assetType] || 0) + 1
      return acc
    }, {})

    // Maintenance timeline (next 30 days)
    const maintenanceData = predictions.reduce((acc: Record<string, number>, p: Prediction) => {
      const date = new Date(p.prediction.nextMaintenanceDate)
      const daysUntil = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntil >= 0 && daysUntil <= 30) {
        const week = Math.floor(daysUntil / 7)
        acc[`Week ${week + 1}`] = (acc[`Week ${week + 1}`] || 0) + 1
      }
      return acc
    }, {})

    return {
      confidence: confidenceData,
      assetType: assetTypeData,
      maintenance: maintenanceData
    }
  }, [predictionsData])

  const renderPieChart = (data: Record<string, number>, title: string) => {
    const total = Object.values(data).reduce((sum: number, value: number) => sum + value, 0)
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    
    if (total === 0) {
      return (
        <div className="text-center py-8">
          <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No data available for pie chart</p>
        </div>
      )
    }
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
          <p className="text-sm text-gray-600">Distribution analysis</p>
        </div>
        
        <div className="flex items-center justify-center">
          <div className="relative w-56 h-56">
            <svg className="w-56 h-56 transform -rotate-90" viewBox="0 0 100 100">
              {Object.entries(data).map(([key, value]: [string, number], index: number) => {
                const percentage = (value / total) * 100
                const radius = 40
                const circumference = 2 * Math.PI * radius
                const strokeDasharray = (percentage / 100) * circumference
                const strokeDashoffset = index === 0 ? 0 : 
                  Object.entries(data).slice(0, index).reduce((sum: number, [_, val]: [string, number]) => 
                    sum + ((val / total) * circumference), 0)
                
                return (
                  <circle
                    key={key}
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="none"
                    stroke={colors[index % colors.length]}
                    strokeWidth="8"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 hover:stroke-opacity-80 cursor-pointer"
                  />
                )
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(data).map(([key, value]: [string, number], index: number) => (
            <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <div>
                  <span className="text-sm font-medium capitalize text-gray-900">{key}</span>
                  <div className="text-xs text-gray-500">
                    {((value / total) * 100).toFixed(1)}% of total
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="font-semibold">{value}</Badge>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderBarChart = (data: Record<string, number>, title: string) => {
    const maxValue = Math.max(...Object.values(data))
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    
    if (maxValue === 0) {
      return (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No data available for bar chart</p>
        </div>
      )
    }
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
          <p className="text-sm text-gray-600">Comparative analysis</p>
        </div>
        
        <div className="space-y-4">
          {Object.entries(data).map(([key, value]: [string, number], index: number) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize text-gray-900">{key}</span>
                <span className="text-gray-600 font-semibold">{value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="h-4 rounded-full transition-all duration-500 hover:opacity-80 relative"
                  style={{ 
                    width: `${(value / maxValue) * 100}%`,
                    backgroundColor: colors[index % colors.length]
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-20"></div>
                </div>
              </div>
              <div className="text-xs text-gray-500 text-right">
                {((value / maxValue) * 100).toFixed(1)}% of max
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderLineChart = (data: Record<string, number>, title: string) => {
    const entries = Object.entries(data)
    const maxValue = Math.max(...Object.values(data))
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    
    if (maxValue === 0) {
      return (
        <div className="text-center py-8">
          <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No data available for line chart</p>
        </div>
      )
    }
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
          <p className="text-sm text-gray-600">Trend analysis</p>
        </div>
        
        <div className="h-64 flex items-end justify-between space-x-3">
          {entries.map(([key, value]: [string, number], index: number) => (
            <div key={key} className="flex flex-col items-center flex-1 group">
              <div 
                className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-500 relative cursor-pointer"
                style={{ height: `${(value / maxValue) * 200}px` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white opacity-20"></div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {value}
                </div>
              </div>
              <span className="text-xs text-gray-600 mt-2 text-center font-medium">{key}</span>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          {entries.map(([key, value]: [string, number]) => (
            <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="capitalize text-gray-700">{key}:</span>
              <span className="font-semibold text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderChart = () => {
    if (!chartData) return null

    const data = chartData[selectedMetric as keyof ChartData]
    const titles = {
      confidence: 'Confidence Distribution',
      assetType: 'Asset Type Distribution',
      maintenance: 'Maintenance Timeline'
    }

    switch (selectedChartType) {
      case 'pie':
        return renderPieChart(data, titles[selectedMetric as keyof typeof titles])
      case 'bar':
        return renderBarChart(data, titles[selectedMetric as keyof typeof titles])
      case 'line':
        return renderLineChart(data, titles[selectedMetric as keyof typeof titles])
      default:
        return renderPieChart(data, titles[selectedMetric as keyof typeof titles])
    }
  }

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'confidence': return Gauge
      case 'assetType': return Building2
      case 'maintenance': return Calendar
      default: return Target
    }
  }

  const getChartIcon = (chartType: string) => {
    switch (chartType) {
      case 'pie': return PieChart
      case 'bar': return BarChart3
      case 'line': return LineChart
      default: return PieChart
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-purple-900">
                <Brain className="w-6 h-6 mr-3 text-purple-600" />
                AI Predictions Analytics
              </CardTitle>
              <CardDescription className="text-purple-700">
                Graphical representation of AI predictions
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled className="border-purple-200 text-purple-600">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-purple-700 font-medium">Loading AI predictions...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-red-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-red-900">
                <Brain className="w-6 h-6 mr-3 text-red-600" />
                AI Predictions Analytics
              </CardTitle>
              <CardDescription className="text-red-700">
                Graphical representation of AI predictions
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} className="border-red-200 text-red-600 hover:bg-red-50">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-red-900 mb-3">Failed to load predictions</h3>
            <p className="text-red-700 mb-6 max-w-md mx-auto">{error}</p>
            <Button onClick={onRefresh} className="bg-red-600 hover:bg-red-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (!predictionsData?.success || !predictionsData?.predictions?.length) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-gray-50 to-gray-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-gray-900">
                <Brain className="w-6 h-6 mr-3 text-gray-600" />
                AI Predictions Analytics
              </CardTitle>
              <CardDescription className="text-gray-700">
                Graphical representation of AI predictions
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} className="border-gray-200 text-gray-600 hover:bg-gray-50">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No predictions available</h3>
            <p className="text-gray-600 mb-6">AI predictions will appear here once data is available</p>
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-purple-900">
              <Brain className="w-6 h-6 mr-3 text-purple-600" />
              AI Predictions Analytics
            </CardTitle>
            <CardDescription className="text-purple-700">
              Advanced graphical representation of AI predictions
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDetails(!showDetails)}
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <Eye className="w-4 h-4 mr-2" />
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Enhanced Chart Controls */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-purple-200">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <Filter className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">Chart Type:</span>
                                     <Select value={selectedChartType} onValueChange={(value: string) => setSelectedChartType(value as 'pie' | 'bar' | 'line')}>
                     <SelectTrigger className="w-36 bg-white border-purple-200">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="pie">Pie Chart</SelectItem>
                       <SelectItem value="bar">Bar Chart</SelectItem>
                       <SelectItem value="line">Line Chart</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">Metric:</span>
                                     <Select value={selectedMetric} onValueChange={(value: string) => setSelectedMetric(value as 'confidence' | 'maintenance' | 'assetType')}>
                     <SelectTrigger className="w-44 bg-white border-purple-200">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="confidence">Confidence</SelectItem>
                       <SelectItem value="assetType">Asset Type</SelectItem>
                       <SelectItem value="maintenance">Maintenance</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
              </div>
              
                             <div className="flex items-center space-x-2">
                 {React.createElement(getChartIcon(selectedChartType), { className: "w-5 h-5 text-purple-600" })}
                 {React.createElement(getMetricIcon(selectedMetric), { className: "w-5 h-5 text-purple-600" })}
                 <Badge variant="outline" className="border-purple-200 text-purple-600">
                   Real-time
                 </Badge>
               </div>
            </div>
          </div>

          {/* Enhanced Chart Display */}
          <div className="bg-white rounded-lg p-8 shadow-sm border border-purple-200">
            {renderChart()}
          </div>

          {/* Enhanced Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <Target className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-semibold text-gray-700">Total Predictions</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">{predictionsData.count}</div>
              <div className="text-xs text-blue-600 mt-1">AI-generated insights</div>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-sm font-semibold text-gray-700">High Confidence</span>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {predictionsData.predictions.filter((p: Prediction) => p.prediction.confidence > 0.8).length}
              </div>
              <div className="text-xs text-green-600 mt-1">Reliable predictions</div>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <span className="text-sm font-semibold text-gray-700">Needs Attention</span>
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {predictionsData.predictions.filter((p: Prediction) => p.prediction.confidence <= 0.6).length}
              </div>
              <div className="text-xs text-orange-600 mt-1">Requires review</div>
            </div>
          </div>

          {/* Detailed Information Panel */}
          {showDetails && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-purple-200">
              <div className="flex items-center space-x-2 mb-4">
                <Info className="w-5 h-5 text-purple-600" />
                <h4 className="text-lg font-semibold text-gray-900">Prediction Details</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Confidence Distribution</h5>
                  <div className="space-y-2">
                                         <div className="flex justify-between text-sm">
                       <span>High (&gt;80%):</span>
                       <span className="font-semibold text-green-600">
                         {predictionsData.predictions.filter((p: Prediction) => p.prediction.confidence > 0.8).length}
                       </span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span>Medium (60-80%):</span>
                       <span className="font-semibold text-yellow-600">
                         {predictionsData.predictions.filter((p: Prediction) => p.prediction.confidence > 0.6 && p.prediction.confidence <= 0.8).length}
                       </span>
                     </div>
                     <div className="flex justify-between text-sm">
                       <span>Low (&lt;60%):</span>
                       <span className="font-semibold text-red-600">
                         {predictionsData.predictions.filter((p: Prediction) => p.prediction.confidence <= 0.6).length}
                       </span>
                     </div>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Asset Types</h5>
                  <div className="space-y-2">
                    {Object.entries(
                      predictionsData.predictions.reduce((acc: Record<string, number>, p: Prediction) => {
                        acc[p.assetType] = (acc[p.assetType] || 0) + 1
                        return acc
                      }, {})
                    ).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="capitalize">{type}:</span>
                        <span className="font-semibold text-blue-600">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 