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
  Target,
  AlertTriangle,
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

  const renderPieChart = (data: Record<string, number>) => {
    const total = Object.values(data).reduce((sum: number, value: number) => sum + value, 0)
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    
    if (total === 0) {
      return (
        <div className="text-center py-8">
          <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium text-sm">No data available for pie chart</p>
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
                  Object.entries(data).slice(0, index).reduce((sum: number, [, val]: [string, number]) => 
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
                <div className="text-3xl font-bold text-foreground">{total}</div>
                <div className="text-sm text-muted-foreground font-medium">Total</div>
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
                  <span className="text-xs font-semibold capitalize text-foreground">{key}</span>
                  <span className="text-xs text-muted-foreground">({value})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderBarChart = (data: Record<string, number>) => {
    const maxValue = Math.max(...Object.values(data))
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    
    if (maxValue === 0) {
      return (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium text-sm">No data available for bar chart</p>
        </div>
      )
    }
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h4 className="text-lg font-bold text-foreground mb-1">Comparative Analysis</h4>
          <p className="text-xs text-muted-foreground">Data visualization</p>
        </div>
        
        <div className="flex items-start space-x-6">
          {/* Chart Container - Vertical Scrollable */}
          <div className="flex-1 min-w-0">
            <div className="bg-gradient-to-br from-background to-muted rounded-xl border border-border p-6 shadow-lg">
              <div className="h-64 relative">
                {/* Y-axis with refined styling */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground font-medium">
                  {[maxValue, Math.round(maxValue * 0.75), Math.round(maxValue * 0.5), Math.round(maxValue * 0.25), 0].map((value,) => (
                    <div key={value} className="flex items-center">
                      <span className="w-8 text-right font-semibold">{value}</span>
                      <div className="w-2 h-px bg-border ml-2"></div>
                    </div>
                  ))}
                </div>
                
                {/* Enhanced Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between ml-10">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                  ))}
                </div>
                
                {/* Vertical Scrollable Chart Area */}
                <div className="ml-10 h-full overflow-y-auto">
                  <div className="flex items-end space-x-8 min-w-max px-6 pb-4">
                    {Object.entries(data).map(([key, value]: [string, number], index: number) => (
                      <div key={key} className="flex flex-col items-center">
                        {/* Value Label Above Bar */}
                        <div className="mb-2 text-center">
                          <span className="text-xs font-bold text-foreground">{value}</span>
                        </div>
                        
                        {/* Refined Bar Design */}
                        <div 
                          className="w-12 rounded-t-lg transition-all duration-700 shadow-md min-h-[6px] relative overflow-hidden"
                          style={{ 
                            height: `${(value / maxValue) * 200}px`,
                            background: `linear-gradient(135deg, ${colors[index % colors.length]} 0%, ${colors[index % colors.length]}dd 50%, ${colors[index % colors.length]} 100%)`
                          }}
                        >
                          {/* Bar Shine Effect */}
                          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white to-transparent opacity-30"></div>
                          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white to-transparent opacity-20"></div>
                          
                          {/* Bar Border */}
                          <div className="absolute inset-0 rounded-t-lg border border-white/20"></div>
                        </div>
                        
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Legend with Better Visibility */}
          <div className="flex-shrink-0">
            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <h5 className="text-sm font-semibold text-foreground mb-4 border-b border-border pb-2">Categories</h5>
              <div className="space-y-4">
                {Object.entries(data).map(([key, value]: [string, number], index: number) => (
                  <div key={key} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors">
                    <div 
                      className="w-4 h-4 rounded-sm shadow-sm"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold capitalize text-foreground">{key}</span>
                        <span className="text-sm font-bold text-muted-foreground">{value}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(value / maxValue) * 100}%`,
                            backgroundColor: colors[index % colors.length]
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderChart = () => {
    if (!chartData) return null

    const data = chartData[selectedMetric as keyof ChartData]

    switch (selectedChartType) {
      case 'pie':
        return renderPieChart(data)
      case 'bar':
        return renderBarChart(data)
      default:
        return renderPieChart(data)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-foreground">
                <Brain className="w-6 h-6 mr-3 text-primary" />
                AI Predictions Analytics
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Graphical representation of AI predictions
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled className="border-border text-muted-foreground">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Loading...
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground font-medium">Loading AI predictions...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-destructive/10 to-destructive/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-destructive">
                <Brain className="w-6 h-6 mr-3 text-destructive" />
                AI Predictions Analytics
              </CardTitle>
              <CardDescription className="text-destructive/70">
                Graphical representation of AI predictions
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} className="border-destructive/20 text-destructive hover:bg-destructive/10">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-destructive mb-3">Failed to load predictions</h3>
            <p className="text-destructive/70 mb-6 max-w-md mx-auto">{error}</p>
            <Button onClick={onRefresh} className="bg-destructive hover:bg-destructive/90">
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
      <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-foreground">
                <Brain className="w-6 h-6 mr-3 text-muted-foreground" />
                AI Predictions Analytics
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Graphical representation of AI predictions
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} className="border-border text-muted-foreground hover:bg-accent">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-foreground mb-3">No predictions available</h3>
            <p className="text-muted-foreground mb-6">AI predictions will appear here once data is available</p>
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
    <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-foreground text-lg">
              <Brain className="w-5 h-5 mr-2 text-primary" />
              AI Predictions Analytics
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm">
              Advanced graphical representation of AI predictions
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDetails(!showDetails)}
              className="border-border text-muted-foreground hover:bg-accent"
            >
              <Eye className="w-4 h-4 mr-1" />
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="border-border text-muted-foreground hover:bg-accent"
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
          <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">Chart:</span>
                  <Select value={selectedChartType} onValueChange={(value: string) => setSelectedChartType(value as 'pie' | 'bar')}>
                    <SelectTrigger className="w-24 h-8 bg-background border-border text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pie">Pie</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">Metric:</span>
                  <Select value={selectedMetric} onValueChange={(value: string) => setSelectedMetric(value as 'confidence' | 'maintenance' | 'assetType')}>
                    <SelectTrigger className="w-32 h-8 bg-background border-border text-xs">
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
              
              <Badge variant="outline" className="border-border text-muted-foreground font-semibold text-xs">
                Real-time
              </Badge>
            </div>
          </div>

          {/* Chart Display - More Compact */}
          <div className="bg-card rounded-lg p-3 shadow-sm border border-border flex-1">
            {renderChart()}
          </div>

          {/* Detailed Information Panel - More Compact */}
          {showDetails && (
            <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Prediction Details</h4>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <h5 className="font-medium text-muted-foreground mb-1 text-sm">Confidence Distribution</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>High (&gt;80%):</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {predictionsData.predictions.filter((p: Prediction) => p.prediction.confidence > 0.8).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Medium (60-80%):</span>
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                        {predictionsData.predictions.filter((p: Prediction) => p.prediction.confidence > 0.6 && p.prediction.confidence <= 0.8).length}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Low (&lt;60%):</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {predictionsData.predictions.filter((p: Prediction) => p.prediction.confidence <= 0.6).length}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-muted-foreground mb-1 text-sm">Asset Types</h5>
                  <div className="space-y-1">
                    {Object.entries(
                      predictionsData.predictions.reduce((acc: Record<string, number>, p: Prediction) => {
                        acc[p.assetType] = (acc[p.assetType] || 0) + 1
                        return acc
                      }, {})
                    ).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-xs">
                        <span className="capitalize">{type}:</span>
                        <span className="font-semibold text-primary">{count}</span>
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