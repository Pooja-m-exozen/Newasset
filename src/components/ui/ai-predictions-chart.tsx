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
  const [selectedChartType, setSelectedChartType] = useState<'pie' | 'bar'>('pie')
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

    // Asset type distribution - ensure we have all asset types even if count is 0
    const assetTypeData = {
      HVAC: predictions.filter((p: Prediction) => p.assetType === 'HVAC').length,
      Pump: predictions.filter((p: Prediction) => p.assetType === 'Pump').length,
      Equipment: predictions.filter((p: Prediction) => p.assetType === 'equipment').length,
      Motor: predictions.filter((p: Prediction) => p.assetType === 'Motor').length
    }

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
          <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium text-sm">No data available for pie chart</p>
        </div>
      )
    }
    
    return (
      <div className="flex items-center justify-center space-x-8">
        {/* Chart */}
        <div className="flex-shrink-0">
          <div className="relative w-56 h-56">
            <svg className="w-56 h-56 transform -rotate-90" viewBox="0 0 100 100">
              {Object.entries(data).map(([key, value]: [string, number], index: number) => {
                const percentage = (value / total) * 100
                const radius = 45
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
                    className="transition-all duration-700 hover:stroke-opacity-80 cursor-pointer"
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}
                  />
                )
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{total}</div>
                <div className="text-sm text-gray-600 font-medium">Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-shrink-0">
          <div className="space-y-2">
            {Object.entries(data).map(([key, value]: [string, number], index: number) => (
              <div key={key} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-sm shadow-sm"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-semibold capitalize text-gray-900">{key}</span>
                  <span className="text-xs text-gray-600">({value})</span>
                </div>
              </div>
            ))}
          </div>
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
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium text-sm">No data available for bar chart</p>
        </div>
      )
    }
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h4 className="text-lg font-bold text-gray-900 mb-1">{title}</h4>
          <p className="text-xs text-gray-600">Comparative analysis</p>
        </div>
        
        <div className="flex items-center justify-center space-x-8">
          {/* Chart */}
          <div className="flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="h-64 relative">
                {/* Y-axis */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 font-medium">
                  {[maxValue, Math.round(maxValue * 0.75), Math.round(maxValue * 0.5), Math.round(maxValue * 0.25), 0].map((value) => (
                    <div key={value} className="flex items-center">
                      <span className="w-6 text-right">{value}</span>
                      <div className="w-2 h-px bg-gray-200 ml-1"></div>
                    </div>
                  ))}
                </div>
                
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between ml-8">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full h-px bg-gray-100"></div>
                  ))}
                </div>
                
                {/* Chart area - Scrollable */}
                <div className="ml-8 h-full overflow-x-auto">
                  <div className="flex items-end space-x-6 min-w-max px-4">
                    {Object.entries(data).map(([key, value]: [string, number], index: number) => (
                      <div key={key} className="flex flex-col items-center group">
                        <div 
                          className="w-12 rounded-t-lg transition-all duration-500 hover:opacity-80 relative cursor-pointer shadow-lg hover:shadow-xl min-h-[16px]"
                          style={{ 
                            height: `${(value / maxValue) * 220}px`,
                            backgroundColor: colors[index % colors.length],
                            background: `linear-gradient(to top, ${colors[index % colors.length]}, ${colors[index % colors.length]}dd)`
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white opacity-30"></div>
                          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white opacity-20"></div>
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg whitespace-nowrap">
                            <div className="font-bold">{value}</div>
                            <div className="text-xs opacity-75">{key}</div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 mt-1 text-center font-medium capitalize">{key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-shrink-0">
            <div className="space-y-2">
              {Object.entries(data).map(([key, value]: [string, number], index: number) => (
                <div key={key} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-sm shadow-sm"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-semibold capitalize text-gray-900">{key}</span>
                    <span className="text-xs text-gray-600">({value})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
    <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-purple-900 text-lg">
              <Brain className="w-5 h-5 mr-2 text-purple-600" />
              AI Predictions Analytics
            </CardTitle>
            <CardDescription className="text-purple-700 text-sm">
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
              <Eye className="w-4 h-4 mr-1" />
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Chart Type Selection - More Compact */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-gray-700">Chart:</span>
                  <Select value={selectedChartType} onValueChange={(value: string) => setSelectedChartType(value as 'pie' | 'bar')}>
                    <SelectTrigger className="w-24 h-8 bg-white border-purple-200 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pie">Pie</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-gray-700">Metric:</span>
                  <Select value={selectedMetric} onValueChange={(value: string) => setSelectedMetric(value as 'confidence' | 'maintenance' | 'assetType')}>
                    <SelectTrigger className="w-32 h-8 bg-white border-purple-200 text-xs">
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
              
              <Badge variant="outline" className="border-purple-200 text-purple-600 font-semibold text-xs">
                Real-time
              </Badge>
            </div>
          </div>

          {/* Chart Display - More Compact */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-200 flex-1">
            {renderChart()}
          </div>

          {/* Detailed Information Panel - More Compact */}
          {showDetails && (
            <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-4 h-4 text-purple-600" />
                <h4 className="text-sm font-semibold text-gray-900">Prediction Details</h4>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <h5 className="font-medium text-gray-700 mb-1 text-sm">Confidence Distribution</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>High (&gt;80%):</span>
                      <span className="font-semibold text-green-600">
                        {predictionsData.predictions.filter((p: Prediction) => p.prediction.confidence > 0.8).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Medium (60-80%):</span>
                      <span className="font-semibold text-yellow-600">
                        {predictionsData.predictions.filter((p: Prediction) => p.prediction.confidence > 0.6 && p.prediction.confidence <= 0.8).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Low (&lt;60%):</span>
                      <span className="font-semibold text-red-600">
                        {predictionsData.predictions.filter((p: Prediction) => p.prediction.confidence <= 0.6).length}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 mb-1 text-sm">Asset Types</h5>
                  <div className="space-y-1">
                    {Object.entries(
                      predictionsData.predictions.reduce((acc: Record<string, number>, p: Prediction) => {
                        acc[p.assetType] = (acc[p.assetType] || 0) + 1
                        return acc
                      }, {})
                    ).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-xs">
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