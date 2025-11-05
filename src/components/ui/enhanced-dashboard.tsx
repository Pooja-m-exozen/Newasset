
"use client"

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'
import { Progress } from './progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog'
import { Input } from './input'
import { Label } from './label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Textarea } from './textarea'
import { AIPredictionsChart } from './ai-predictions-chart'
import {
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Zap,
  RefreshCw,
  Brain,
  Settings,
  Thermometer,
  AlertTriangle,
  FileText,
  Building2,
  Users,
  MapPin,
  Plus,
  X,
  Calendar,
  Clock as ClockIcon
} from 'lucide-react'

interface AlertsData {
  success: boolean
  statistics?: {
    totalAlerts: number
    criticalAlerts: number
    averageResponseTime: string
  }
}

interface EnhancedDashboardProps {
  dashboardData: {
    data?: {
      assetStats?: {
        totalAssets?: number
        activeAssets?: number
        criticalAssets?: number
        highPriorityAssets?: number
        underMaintenance?: number
      }
      performanceData?: {
        insights?: {
          overallEfficiency?: number
        }
        healthScore?: number
      }
      projectBreakdown?: Array<{
        projectId: string
        projectName: string
        count: number
        activeCount: number
        maintenanceCount: number
        criticalCount: number
      }>
    }
  } | null
  isLoading: boolean
  error: string | null
  onRefresh: () => void
  predictionsData?: {
    success: boolean
    count: number
    predictions: Array<{
      assetId: string
      assetType: string
      projectName: string
      projectId: string
      tagId: string
      assignedTo?: {
        _id: string
        name: string
        email: string
      }
      prediction: {
        confidence: number
        nextMaintenanceDate: string
        predictedIssues: string[]
        recommendations: string[]
      }
    }>
  } | null
  isPredictionsLoading?: boolean
  predictionsError?: string | null
  onRefreshPredictions?: () => void
  healthData?: {
    success?: boolean
    statistics?: {
      excellent?: number
      good?: number
      fair?: number
      poor?: number
      critical?: number
    }
  } | null
  isHealthLoading?: boolean
  healthError?: string | null
  onRefreshHealth?: () => void
  costData?: {
    success?: boolean
    statistics?: {
      totalPurchaseCost: number
      totalCurrentValue: number
      totalDepreciation: number
      avgDepreciationRate: number
      assetCount: number
    }
  } | null
  isCostLoading?: boolean
  costError?: string | null
  onRefreshCost?: () => void
  trendsData?: {
    success?: boolean
    period?: string
    totalRecords?: number
    trendData?: Array<{
      maintenanceCount: number
      pendingCount: number
      completedCount: number
      emergencyCount: number
    }>
  } | null
  isTrendsLoading?: boolean
  trendsError?: string | null
  onRefreshTrends?: () => void
}

export function EnhancedDashboard({
  dashboardData,
  isLoading,
  error,
  onRefresh,
  predictionsData,
  isPredictionsLoading = false,
  predictionsError = null,
  onRefreshPredictions,
  healthData,
  isHealthLoading = false,
  healthError = null,
  costData,
  isCostLoading = false,
  costError = null,
  trendsData,
  isTrendsLoading = false,
  trendsError = null,
}: EnhancedDashboardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false)
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null)
  const [isAlertsLoading, setIsAlertsLoading] = useState(false)
  const [alertsError, setAlertsError] = useState<string | null>(null)
 
  // Alert Rules Modal State
  const [isAlertRulesModalOpen, setIsAlertRulesModalOpen] = useState(false)
  const [isCreatingRule, setIsCreatingRule] = useState(false)
  const [ruleCreationError, setRuleCreationError] = useState<string | null>(null)
  const [ruleCreationSuccess, setRuleCreationSuccess] = useState(false)
 
  // Form State
  const [ruleForm, setRuleForm] = useState({
    name: '',
    type: 'performance_threshold',
    conditions: [{ field: '', operator: '', value: '' }],
    actions: [{ type: '', recipients: '', template: '', message: '', severity: '' }],
    isActive: true,
    cooldown: 3600
  })

  // Transform predictionsData to match the expected format
  const transformedPredictionsData = useMemo(() => {
    if (!predictionsData) return null
   
    return {
      success: predictionsData.success,
      count: predictionsData.count,
      predictions: predictionsData.predictions.map(prediction => ({
        assetId: prediction.assetId,
        assetType: prediction.assetType,
        projectName: prediction.projectName,
        projectId: prediction.projectId,
        tagId: prediction.tagId,
        assignedTo: prediction.assignedTo,
        prediction: {
          confidence: prediction.prediction.confidence,
          nextMaintenanceDate: prediction.prediction.nextMaintenanceDate,
          predictedIssues: (prediction.prediction as { factors?: string[] }).factors || [], // Map factors to predictedIssues
          recommendations: (prediction.prediction as { recommendations?: string[] }).recommendations || []
        }
      }))
    }
  }, [predictionsData])

  // Memoized computed datasets for performance and smoother UI
  const advancedStats = useMemo(() => [
    {
      title: "Total Assets",
      value: dashboardData?.data?.assetStats?.totalAssets?.toString() || "0",
      change: "+12%",
      icon: Building2,
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      trend: "up",
      description: "Total registered assets in the system",
      subValue: `${dashboardData?.data?.assetStats?.activeAssets || 0} Active`,
      health: 85,
      priority: "normal"
    },
    {
      title: "Active Assets",
      value: dashboardData?.data?.assetStats?.activeAssets?.toString() || "0",
      change: "+8%",
      icon: CheckCircle,
      color: "bg-gradient-to-r from-green-500 to-green-600",
      trend: "up",
      description: "Currently operational assets",
      subValue: `${dashboardData?.data?.assetStats?.underMaintenance || 0} Under Maintenance`,
      health: 92,
      priority: "normal"
    },
    {
      title: "Critical Assets",
      value: dashboardData?.data?.assetStats?.criticalAssets?.toString() || "0",
      change: "+15%",
      icon: AlertCircle,
      color: "bg-gradient-to-r from-red-500 to-red-600",
      trend: "up",
      description: "Assets requiring immediate attention",
      subValue: `${dashboardData?.data?.assetStats?.highPriorityAssets || 0} High Priority`,
      health: 45,
      priority: "high"
    },
    {
      title: "AI Predictions",
      value: transformedPredictionsData?.count?.toString() || "0",
      change: "+25%",
      icon: Brain,
      color: "bg-gradient-to-r from-indigo-500 to-indigo-600",
      trend: "up",
      description: "AI-powered maintenance predictions",
      subValue: `${transformedPredictionsData?.predictions?.filter((p) => p.prediction.confidence > 0.7).length || 0} High Confidence`,
      health: transformedPredictionsData?.predictions?.length ? Math.round((transformedPredictionsData.predictions.filter((p) => p.prediction.confidence > 0.7).length / transformedPredictionsData.predictions.length) * 100) : 0,
      priority: "normal"
    }
  ], [dashboardData, transformedPredictionsData])

  const assetHealthData = useMemo(() => (
    healthData?.success && healthData?.statistics ? [
      {
        name: "Excellent",
        status: "excellent",
        count: healthData.statistics.excellent ?? 0,
        percentage: (healthData.statistics.excellent ?? 0) > 0 ? Math.round(((healthData.statistics.excellent ?? 0) / ((healthData.statistics.excellent ?? 0) + (healthData.statistics.good ?? 0) + (healthData.statistics.fair ?? 0) + (healthData.statistics.poor ?? 0) + (healthData.statistics.critical ?? 0))) * 100) : 0,
        color: "bg-green-500",
        icon: CheckCircle
      },
      {
        name: "Good",
        status: "good",
        count: healthData.statistics.good ?? 0,
        percentage: (healthData.statistics.good ?? 0) > 0 ? Math.round(((healthData.statistics.good ?? 0) / ((healthData.statistics.excellent ?? 0) + (healthData.statistics.good ?? 0) + (healthData.statistics.fair ?? 0) + (healthData.statistics.poor ?? 0) + (healthData.statistics.critical ?? 0))) * 100) : 0,
        color: "bg-blue-500",
        icon: Activity
      },
      {
        name: "Fair",
        status: "fair",
        count: healthData.statistics.fair ?? 0,
        percentage: (healthData.statistics.fair ?? 0) > 0 ? Math.round(((healthData.statistics.fair ?? 0) / ((healthData.statistics.excellent ?? 0) + (healthData.statistics.good ?? 0) + (healthData.statistics.fair ?? 0) + (healthData.statistics.poor ?? 0) + (healthData.statistics.critical ?? 0))) * 100) : 0,
        color: "bg-yellow-500",
        icon: AlertTriangle
      },
      {
        name: "Poor",
        status: "poor",
        count: healthData.statistics.poor ?? 0,
        percentage: (healthData.statistics.poor ?? 0) > 0 ? Math.round(((healthData.statistics.poor ?? 0) / ((healthData.statistics.excellent ?? 0) + (healthData.statistics.good ?? 0) + (healthData.statistics.fair ?? 0) + (healthData.statistics.poor ?? 0) + (healthData.statistics.critical ?? 0))) * 100) : 0,
        color: "bg-orange-500",
        icon: AlertTriangle
      },
      {
        name: "Critical",
        status: "critical",
        count: healthData.statistics.critical ?? 0,
        percentage: (healthData.statistics.critical ?? 0) > 0 ? Math.round(((healthData.statistics.critical ?? 0) / ((healthData.statistics.excellent ?? 0) + (healthData.statistics.good ?? 0) + (healthData.statistics.fair ?? 0) + (healthData.statistics.poor ?? 0) + (healthData.statistics.critical ?? 0))) * 100) : 0,
        color: "bg-red-500",
        icon: AlertCircle
      }
    ] : [
      { name: "Excellent", status: "excellent", count: 0, percentage: 0, color: "bg-green-500", icon: CheckCircle },
      { name: "Good", status: "good", count: 0, percentage: 0, color: "bg-blue-500", icon: Activity },
      { name: "Fair", status: "fair", count: 0, percentage: 0, color: "bg-yellow-500", icon: AlertTriangle },
      { name: "Poor", status: "poor", count: 0, percentage: 0, color: "bg-orange-500", icon: AlertTriangle },
      { name: "Critical", status: "critical", count: 0, percentage: 0, color: "bg-red-500", icon: AlertCircle }
    ]
  ), [healthData])

  const costAnalysisData = useMemo(() => (
    costData?.success && costData?.statistics ? {
      totalPurchaseCost: costData.statistics.totalPurchaseCost || 0,
      totalCurrentValue: costData.statistics.totalCurrentValue || 0,
      totalDepreciation: costData.statistics.totalDepreciation || 0,
      avgDepreciationRate: costData.statistics.avgDepreciationRate || 0,
      assetCount: costData.statistics.assetCount || 0,
      breakdown: [
        { category: "Purchase Cost", amount: costData.statistics.totalPurchaseCost || 0, percentage: (costData.statistics.totalPurchaseCost || 0) > 0 ? 100 : 0 },
        { category: "Current Value", amount: costData.statistics.totalCurrentValue || 0, percentage: (costData.statistics.totalCurrentValue || 0) > 0 ? 100 : 0 },
        { category: "Depreciation", amount: costData.statistics.totalDepreciation || 0, percentage: (costData.statistics.totalDepreciation || 0) > 0 ? 100 : 0 }
      ]
    } : {
      totalPurchaseCost: 0,
      totalCurrentValue: 0,
      totalDepreciation: 0,
      avgDepreciationRate: 0,
      assetCount: 0,
      breakdown: [] as { category: string; amount: number; percentage: number }[]
    }
  ), [costData])

  const trendAnalysis = useMemo(() => (
    trendsData?.success ? {
      scheduled: trendsData.trendData?.reduce((sum: number, item) => sum + item.maintenanceCount, 0) || 0,
      inProgress: trendsData.trendData?.reduce((sum: number, item) => sum + item.pendingCount, 0) || 0,
      completed: trendsData.trendData?.reduce((sum: number, item) => sum + item.completedCount, 0) || 0,
      overdue: trendsData.trendData?.reduce((sum: number, item) => sum + item.emergencyCount, 0) || 0,
      total: trendsData.totalRecords || 0,
      efficiency: trendsData.trendData && trendsData.trendData.length > 0 ? Math.round((trendsData.trendData.reduce((sum: number, item) => sum + item.completedCount, 0) / (trendsData.totalRecords || 1)) * 100) : 0,
      avgCompletionTime: "2.3 days",
      costSavings: "$12,500"
    } : {
      scheduled: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      total: 0,
      efficiency: 0,
      avgCompletionTime: "0 days",
      costSavings: "$0"
    }
  ), [trendsData])


  const handleAddUserClick = () => {
    router.push('/admin/manageusers')
  }

  const handleAddAssetClick = () => {
    router.push('/admin/manageassets')
  }

  const handleAddLocationClick = () => {
    router.push('/admin/managelocation')
  }

  const handleGenerateReportClick = () => {
    router.push('/admin/viewalllogs/assets-logs')
  }

  const handleViewAlertsClick = async () => {
    setIsAlertsModalOpen(true)
    setIsAlertsLoading(true)
    setAlertsError(null)
   
    try {
      const currentDate = new Date()
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
     
      const dateFrom = firstDayOfMonth.toISOString().split('T')[0]
      const dateTo = lastDayOfMonth.toISOString().split('T')[0]
     
      // Get token from localStorage
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication token not found')
      }
     
      const response = await fetch(`https://digitalasset.zenapi.co.in/api/automation/alerts/statistics?dateFrom=${dateFrom}&dateTo=${dateTo}&alertType=performance_threshold`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
     
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.')
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to view alerts.')
        } else {
          throw new Error(`Failed to fetch alerts data: ${response.status}`)
        }
      }
     
      const responseData = await response.json()
      setAlertsData(responseData)
    } catch (error) {
      setAlertsError(error instanceof Error ? error.message : 'An error occurred while fetching alerts data')
    } finally {
      setIsAlertsLoading(false)
    }
  }

  const handleCreateAlertRule = async () => {
    setIsCreatingRule(true)
    setRuleCreationError(null)
    setRuleCreationSuccess(false)
   
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Authentication token not found')
      }
     
      // Prepare the rule data
      const ruleData = {
        name: ruleForm.name,
        type: ruleForm.type,
        conditions: ruleForm.conditions.filter(condition => condition.field && condition.operator && condition.value),
        actions: ruleForm.actions.filter(action => action.type).map(action => {
          const baseAction = { type: action.type }
         
          if (action.type === 'email') {
            return {
              ...baseAction,
              recipients: action.recipients.split(',').map(r => r.trim()),
              template: action.template
            }
          } else if (action.type === 'sms') {
            return {
              ...baseAction,
              recipients: action.recipients.split(',').map(r => r.trim()),
              message: action.message
            }
          } else if (action.type === 'dashboard_notification') {
            return {
              ...baseAction,
              severity: action.severity
            }
          }
         
          return baseAction
        }),
        isActive: ruleForm.isActive,
        cooldown: ruleForm.cooldown
      }
     
      const response = await fetch('https://digitalasset.zenapi.co.in/api/automation/alerts/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ruleData)
      })
     
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.')
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to create alert rules.')
        } else {
          throw new Error(`Failed to create alert rule: ${response.status}`)
        }
      }
     
      await response.json()
      setRuleCreationSuccess(true)
     
             // Reset form after successful creation
       setTimeout(() => {
         setIsAlertRulesModalOpen(false)
         setRuleForm({
           name: '',
           type: 'performance_threshold',
           conditions: [{ field: '', operator: '', value: '' }],
           actions: [{ type: '', recipients: '', template: '', message: '', severity: '' }],
           isActive: true,
           cooldown: 3600
         })
         setRuleCreationSuccess(false)
       }, 2000)
     
    } catch (error) {
      setRuleCreationError(error instanceof Error ? error.message : 'An error occurred while creating the alert rule')
    } finally {
      setIsCreatingRule(false)
    }
  }

  const handleAddCondition = () => {
    setRuleForm(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: '', operator: '', value: '' }]
    }))
  }

  const handleRemoveCondition = (index: number) => {
    setRuleForm(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }))
  }

  const handleAddAction = () => {
    setRuleForm(prev => ({
      ...prev,
      actions: [...prev.actions, { type: '', recipients: '', template: '', message: '', severity: '' }]
    }))
  }

  const handleRemoveAction = (index: number) => {
    setRuleForm(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }))
  }

  const handleConditionChange = (index: number, field: string, value: string) => {
    setRuleForm(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      )
    }))
  }

  const handleActionChange = (index: number, field: string, value: string) => {
    setRuleForm(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) =>
        i === index ? { ...action, [field]: value } : action
      )
    }))
  }


    return (
    <div className="flex h-screen bg-background transition-colors duration-200">
        <div className="flex-1 overflow-auto">

        {/* Main Content */}
        <main className="px-2 pt-0 pb-1 sm:px-4 md:px-6 sm:pt-1 sm:pb-2 space-y-2 sm:space-y-3">
         
          {/* Dashboard Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              {user?.projectName ? (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                      <strong>Current Project:</strong> {user.projectName}
                    </p>
                </div>
              ) : null}
              </div>
            <div className="flex items-center space-x-2">
              {isLoading && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">No data available</span>
                </div>
              )}
              {error && (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <Button onClick={onRefresh} disabled={isLoading} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
              </Button>
            </div>
              )}
          </div>
        </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {advancedStats.map((stat) => (
              <Card key={stat.title} className="border-border">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-lg flex items-center justify-center">
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{stat.subValue}</p>
                    <p className="text-xs text-muted-foreground hidden sm:block">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Asset Health Monitoring and Cost Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {/* Asset Health Monitoring */}
            <Card className="border-border">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center text-sm sm:text-base">
                  <div className="flex items-center">
                    <Thermometer className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="truncate">Asset Health Monitoring</span>
                  </div>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Real-time asset health status distribution</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Project Filter Indicator */}
                {user?.projectName && (
                  <div className="mb-2 sm:mb-3 p-2 bg-muted border border-border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Thermometer className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-foreground truncate">
                        Showing health data for: <strong className="truncate">{user.projectName}</strong>
                      </span>
                    </div>
                  </div>
                )}
               
                {isHealthLoading ? (
                  <div className="flex items-center justify-center py-4 sm:py-6">
                    <div className="text-center">
                      <p className="text-muted-foreground text-xs sm:text-sm">No data available</p>
                    </div>
                  </div>
                ) : healthError ? (
                  <div className="text-center py-4 sm:py-6">
                    <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 mx-auto mb-2 sm:mb-3" />
                    <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-2">Failed to load health data</h3>
                    <p className="text-muted-foreground mb-2 sm:mb-3 text-xs sm:text-sm">{healthError}</p>
                  </div>
                ) : healthData?.success ? (
                  <div className="space-y-2 sm:space-y-3">
                    {assetHealthData.map((asset, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <asset.icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs font-medium text-foreground truncate">{asset.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full ${asset.color}`}></div>
                            <span className="text-xs text-muted-foreground">{asset.count}</span>
                          </div>
                        </div>
                        <Progress value={asset.percentage} className="h-1.5" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Percentage</span>
                          <span>{asset.percentage}%</span>
                        </div>
                      </div>
                    ))}
                   
                    {/* Health Summary */}
                    <div className="mt-2 sm:mt-3 p-2 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <Thermometer className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs font-medium text-foreground truncate">
                            Total: {assetHealthData.reduce((sum, asset) => sum + asset.count, 0)}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-muted-foreground border-border text-xs flex-shrink-0">
                          Real-time
                        </Badge>
                      </div>
                      {user?.projectName && (
                        <div className="mt-1 sm:mt-2 text-xs text-muted-foreground truncate">
                          <span className="font-medium">Project:</span> <span className="truncate">{user.projectName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { name: "Excellent", count: 0, percentage: 0, color: "bg-green-500", icon: CheckCircle },
                      { name: "Good", count: 0, percentage: 0, color: "bg-blue-500", icon: Activity },
                      { name: "Fair", count: 0, percentage: 0, color: "bg-yellow-500", icon: AlertTriangle },
                      { name: "Poor", count: 0, percentage: 0, color: "bg-orange-500", icon: AlertTriangle },
                      { name: "Critical", count: 0, percentage: 0, color: "bg-red-500", icon: AlertCircle }
                    ].map((asset, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <asset.icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs font-medium text-foreground truncate">{asset.name}</span>
                          </div>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full ${asset.color}`}></div>
                            <span className="text-xs text-muted-foreground">{asset.count}</span>
                          </div>
                        </div>
                        <Progress value={asset.percentage} className="h-1.5" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Percentage</span>
                          <span>{asset.percentage}%</span>
                        </div>
                      </div>
                    ))}
                   
                    {/* Health Summary */}
                    <div className="mt-2 sm:mt-3 p-2 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <Thermometer className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs font-medium text-foreground truncate">
                            Total: 0
                          </span>
                        </div>
                        <Badge variant="outline" className="text-muted-foreground border-border text-xs flex-shrink-0">
                          No Data
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cost Analysis */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                    Cost Analysis
                  </div>
                </CardTitle>
                <CardDescription className="text-sm">Asset cost analysis and depreciation tracking</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isCostLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="text-center">
                      <p className="text-muted-foreground text-sm">No data available</p>
                    </div>
                  </div>
                ) : costError ? (
                  <div className="text-center py-6">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-foreground mb-2">Failed to load cost data</h3>
                    <p className="text-muted-foreground mb-3 text-sm">{costError}</p>
                  </div>
                ) : costData?.success ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Total Purchase Cost</span>
                      <span className="text-sm font-bold text-foreground">
                        ${costAnalysisData.totalPurchaseCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Current Value</span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        ${costAnalysisData.totalCurrentValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Total Depreciation</span>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">
                        ${costAnalysisData.totalDepreciation.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Avg. Depreciation Rate</span>
                      <span className="text-xs font-medium text-foreground">
                        {costAnalysisData.avgDepreciationRate.toFixed(2)}%
                      </span>
                    </div>
                    <Progress
                      value={costAnalysisData.totalCurrentValue > 0 ? (costAnalysisData.totalCurrentValue / costAnalysisData.totalPurchaseCost) * 100 : 0}
                      className="h-2"
                    />
                    <div className="space-y-1">
                      {costAnalysisData.breakdown.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{item.category}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-foreground">
                              ${item.amount.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                   
                    {/* Cost Summary */}
                    <div className="mt-3 p-2 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">
                            Total Assets: {costAnalysisData.assetCount}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-muted-foreground border-border text-xs">
                          Real-time
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Total Purchase Cost</span>
                      <span className="text-sm font-bold text-foreground">$0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Current Value</span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">$0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Total Depreciation</span>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">$0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Avg. Depreciation Rate</span>
                      <span className="text-xs font-medium text-foreground">0.00%</span>
                    </div>
                    <Progress value={0} className="h-2" />
                   
                    {/* Cost Summary */}
                    <div className="mt-3 p-2 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">
                            Total Assets: 0
                          </span>
                        </div>
                        <Badge variant="outline" className="text-muted-foreground border-border text-xs">
                          No Data
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trend Analysis */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
                    Trend Analysis
                  </div>
                </CardTitle>
                <CardDescription className="text-sm">Performance trends and analytics</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isTrendsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="text-center">
                      <p className="text-muted-foreground text-sm">No data available</p>
                    </div>
                  </div>
                ) : trendsError ? (
                  <div className="text-center py-6">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-foreground mb-2">Failed to load trends data</h3>
                    <p className="text-muted-foreground mb-3 text-sm">{trendsError}</p>
                  </div>
                ) : trendsData?.success ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{trendAnalysis.scheduled}</p>
                        <p className="text-xs text-muted-foreground">Scheduled</p>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{trendAnalysis.inProgress}</p>
                        <p className="text-xs text-muted-foreground">In Progress</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{trendAnalysis.completed}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{trendAnalysis.overdue}</p>
                        <p className="text-xs text-muted-foreground">Overdue</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Efficiency</span>
                        <span className="text-xs font-medium text-foreground">{trendAnalysis.efficiency}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Avg. Completion</span>
                        <span className="text-xs font-medium text-foreground">{trendAnalysis.avgCompletionTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Cost Savings</span>
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">{trendAnalysis.costSavings}</span>
                      </div>
                    </div>
                   
                    {/* Trends Summary */}
                    <div className="mt-3 p-2 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">
                            Period: {trendsData.period} | Total Records: {trendsData.totalRecords}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-muted-foreground border-border text-xs">
                          Real-time
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">0</p>
                        <p className="text-xs text-muted-foreground">Scheduled</p>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                        <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">0</p>
                        <p className="text-xs text-muted-foreground">In Progress</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">0</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <div className="text-center p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">0</p>
                        <p className="text-xs text-muted-foreground">Overdue</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Efficiency</span>
                        <span className="text-xs font-medium text-foreground">0%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Avg. Completion</span>
                        <span className="text-xs font-medium text-foreground">0 days</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Cost Savings</span>
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">$0</span>
                      </div>
                    </div>
                   
                    {/* Trends Summary */}
                    <div className="mt-3 p-2 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium text-foreground">
                            No Data Available
                          </span>
                        </div>
                        <Badge variant="outline" className="text-muted-foreground border-border text-xs">
                          No Data
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Predictions Chart Section and Quick Actions - Side by Side */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-2 sm:gap-3 md:gap-6">
            {/* AI Predictions Chart Section - Reduced Width */}
            <div className="xl:col-span-2">
              <AIPredictionsChart
                predictionsData={transformedPredictionsData || null}
                isLoading={isPredictionsLoading}
                error={predictionsError}
                onRefreshAction={onRefreshPredictions || (() => {})}
              />
            </div>

            {/* Quick Actions - Side Panel */}
            <div className="xl:col-span-1">
              <Card className="shadow-lg border-border h-full">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="flex items-center text-sm sm:text-base">
                    <Zap className="w-4 h-4 mr-2 text-orange-600" />
                    <span className="truncate">Quick Actions</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      className="h-12 sm:h-14 md:h-16 flex-col hover:bg-muted transition-colors justify-start p-2"
                      onClick={handleAddUserClick}
                      aria-label="Add a new user"
                    >
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-muted-foreground" />
                      <span className="text-xs sm:text-sm font-medium">Add User</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 sm:h-14 md:h-16 flex-col hover:bg-muted transition-colors justify-start p-2"
                      onClick={handleAddAssetClick}
                      aria-label="Add a new asset"
                    >
                      <Building2 className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-muted-foreground" />
                      <span className="text-xs sm:text-sm font-medium">Add Asset</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 sm:h-14 md:h-16 flex-col hover:bg-muted transition-colors justify-start p-2"
                      onClick={handleAddLocationClick}
                      aria-label="Add a new location"
                    >
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-muted-foreground" />
                      <span className="text-xs sm:text-sm font-medium">Add Location</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 sm:h-14 md:h-16 flex-col hover:bg-muted transition-colors justify-start p-2"
                      onClick={handleGenerateReportClick}
                      aria-label="Generate report"
                    >
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-muted-foreground" />
                      <span className="text-xs sm:text-sm font-medium">Generate Report</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 sm:h-14 md:h-16 flex-col hover:bg-muted transition-colors justify-start p-2 col-span-2 sm:col-span-1"
                      onClick={handleViewAlertsClick}
                      aria-label="View system alerts"
                    >
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mb-1 text-muted-foreground" />
                      <span className="text-xs sm:text-sm font-medium">View Alerts</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

       {/* Alerts Modal */}
       <Dialog open={isAlertsModalOpen} onOpenChange={setIsAlertsModalOpen}>
         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <AlertCircle className="w-5 h-5 text-red-600" />
               System Alerts Overview
             </DialogTitle>
             <DialogDescription>
               Performance threshold alerts and system statistics for the current month
             </DialogDescription>
             <div className="absolute right-4 top-4">
               <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setIsAlertsModalOpen(false)}>
                 <X className="w-4 h-4" />
               </Button>
             </div>
           </DialogHeader>
           
           <div className="space-y-6">
             {isAlertsLoading ? (
               <div className="flex items-center justify-center py-8">
                 <div className="text-center">
                   <p className="text-gray-600">No data available</p>
                 </div>
               </div>
             ) : alertsError ? (
               <div className="text-center py-8">
                 <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                 <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load alerts</h3>
                 <p className="text-gray-600 mb-4">{alertsError}</p>
                 <Button onClick={handleViewAlertsClick} disabled={isAlertsLoading}>
                   <RefreshCw className={`w-4 h-4 mr-2 ${isAlertsLoading ? 'animate-spin' : ''}`} />
                   Try Again
                 </Button>
               </div>
             ) : alertsData ? (
               <div className="space-y-6">
                 {/* Statistics Cards */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                   <div className="bg-blue-50 rounded-lg p-4">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-blue-600">Total Alerts</p>
                         <p className="text-2xl font-bold text-blue-900">
                           {alertsData.statistics?.totalAlerts || 0}
                         </p>
                       </div>
                       <AlertCircle className="w-8 h-8 text-blue-600" />
                     </div>
                   </div>
                   
                   <div className="bg-red-50 rounded-lg p-4">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-red-600">Critical Alerts</p>
                         <p className="text-2xl font-bold text-red-900">
                           {alertsData.statistics?.criticalAlerts || 0}
                         </p>
                       </div>
                       <AlertTriangle className="w-8 h-8 text-red-600" />
                     </div>
                   </div>
                   
                   <div className="bg-green-50 rounded-lg p-4">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="text-sm font-medium text-green-600">Avg Response Time</p>
                         <p className="text-2xl font-bold text-green-900">
                           {alertsData.statistics?.averageResponseTime || 'N/A'}
                         </p>
                       </div>
                       <ClockIcon className="w-8 h-8 text-green-600" />
                     </div>
                   </div>
                 </div>

                 {/* Date Range Info */}
                 <div className="bg-gray-50 rounded-lg p-4">
                   <div className="flex items-center gap-2 text-sm text-gray-600">
                     <Calendar className="w-4 h-4" />
                     <span>
                       Data for current month ({new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
                     </span>
                   </div>
                 </div>

                 {/* Success Status */}
                 {alertsData.success && (
                   <div className="flex items-center gap-2 text-sm text-green-600">
                     <CheckCircle className="w-4 h-4" />
                     <span>Data loaded successfully</span>
                   </div>
                 )}

                 {/* Create Alert Rule Section */}
                 <div className="border-t border-gray-200 pt-6">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-semibold text-gray-900">Create Alert Rule</h3>
                     <Button
                       size="sm"
                       onClick={() => setIsAlertRulesModalOpen(true)}
                       className="bg-orange-600 hover:bg-orange-700"
                     >
                       <Plus className="w-4 h-4 mr-2" />
                       New Rule
                     </Button>
                   </div>
                   <p className="text-sm text-gray-600 mb-4">
                     Create automated alert rules to monitor asset performance and trigger notifications
                   </p>
                 </div>
               </div>
             ) : null}
           </div>
         </DialogContent>
       </Dialog>

       {/* Alert Rules Modal */}
       <Dialog open={isAlertRulesModalOpen} onOpenChange={setIsAlertRulesModalOpen}>
         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Settings className="w-5 h-5 text-orange-600" />
               Create Alert Rule
             </DialogTitle>
             <DialogDescription>
               Define conditions and actions for automated alerts
             </DialogDescription>
             <div className="absolute right-4 top-4">
               <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setIsAlertRulesModalOpen(false)}>
                 <X className="w-4 h-4" />
               </Button>
             </div>
           </DialogHeader>
           
           <div className="space-y-6">
             {ruleCreationSuccess && (
               <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                 <div className="flex items-center gap-2 text-green-800">
                   <CheckCircle className="w-5 h-5" />
                   <span className="font-medium">Alert rule created successfully!</span>
                 </div>
               </div>
             )}
             
             {ruleCreationError && (
               <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                 <div className="flex items-center gap-2 text-red-800">
                   <AlertCircle className="w-5 h-5" />
                   <span className="font-medium">{ruleCreationError}</span>
                 </div>
               </div>
             )}
             
             {/* Rule Name */}
             <div className="space-y-2">
               <Label htmlFor="ruleName">Rule Name</Label>
               <Input
                 id="ruleName"
                 placeholder="Enter rule name (e.g., Critical Asset Alert)"
                 value={ruleForm.name}
                 onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
               />
             </div>
             
             {/* Conditions */}
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <Label className="text-base font-semibold">Conditions</Label>
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   onClick={handleAddCondition}
                 >
                   <Plus className="w-4 h-4 mr-2" />
                   Add Condition
                 </Button>
               </div>
               
               {ruleForm.conditions.map((condition, index) => (
                 <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-medium text-gray-700">Condition {index + 1}</span>
                     {ruleForm.conditions.length > 1 && (
                       <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={() => handleRemoveCondition(index)}
                         className="text-red-600 hover:text-red-700"
                       >
                         <X className="w-4 h-4" />
                       </Button>
                     )}
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                     <div className="space-y-2">
                       <Label>Field</Label>
                       <Select
                         value={condition.field}
                         onValueChange={(value) => handleConditionChange(index, 'field', value)}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Select field" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="efficiency">Efficiency</SelectItem>
                           <SelectItem value="temperature">Temperature</SelectItem>
                           <SelectItem value="pressure">Pressure</SelectItem>
                           <SelectItem value="vibration">Vibration</SelectItem>
                           <SelectItem value="power">Power Consumption</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <div className="space-y-2">
                       <Label>Operator</Label>
                       <Select
                         value={condition.operator}
                         onValueChange={(value) => handleConditionChange(index, 'operator', value)}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Select operator" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="greater_than">Greater Than</SelectItem>
                           <SelectItem value="less_than">Less Than</SelectItem>
                           <SelectItem value="equals">Equals</SelectItem>
                           <SelectItem value="not_equals">Not Equals</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <div className="space-y-2">
                       <Label>Value</Label>
                       <Input
                         placeholder="Enter value"
                         value={condition.value}
                         onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                       />
                     </div>
                   </div>
                 </div>
               ))}
             </div>
             
             {/* Actions */}
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <Label className="text-base font-semibold">Actions</Label>
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   onClick={handleAddAction}
                 >
                   <Plus className="w-4 h-4 mr-2" />
                   Add Action
                 </Button>
               </div>
               
               {ruleForm.actions.map((action, index) => (
                 <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-medium text-gray-700">Action {index + 1}</span>
                     {ruleForm.actions.length > 1 && (
                       <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={() => handleRemoveAction(index)}
                         className="text-red-600 hover:text-red-700"
                       >
                         <X className="w-4 h-4" />
                       </Button>
                     )}
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                     <div className="space-y-2">
                       <Label>Action Type</Label>
                       <Select
                         value={action.type}
                         onValueChange={(value) => handleActionChange(index, 'type', value)}
                       >
                         <SelectTrigger>
                           <SelectValue placeholder="Select action type" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="email">Email</SelectItem>
                           <SelectItem value="sms">SMS</SelectItem>
                           <SelectItem value="dashboard_notification">Dashboard Notification</SelectItem>
                           <SelectItem value="webhook">Webhook</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     
                     {action.type === 'email' && (
                       <div className="space-y-2">
                         <Label>Recipients (comma-separated)</Label>
                         <Input
                           placeholder="admin@company.com, tech@company.com"
                           value={action.recipients}
                           onChange={(e) => handleActionChange(index, 'recipients', e.target.value)}
                         />
                       </div>
                     )}
                     
                     {action.type === 'sms' && (
                       <div className="space-y-2">
                         <Label>Phone Numbers (comma-separated)</Label>
                         <Input
                           placeholder="+1234567890, +0987654321"
                           value={action.recipients}
                           onChange={(e) => handleActionChange(index, 'recipients', e.target.value)}
                         />
                       </div>
                     )}
                     
                     {action.type === 'dashboard_notification' && (
                       <div className="space-y-2">
                         <Label>Severity</Label>
                         <Select
                           value={action.severity}
                           onValueChange={(value) => handleActionChange(index, 'severity', value)}
                         >
                           <SelectTrigger>
                             <SelectValue placeholder="Select severity" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="low">Low</SelectItem>
                             <SelectItem value="medium">Medium</SelectItem>
                             <SelectItem value="high">High</SelectItem>
                             <SelectItem value="critical">Critical</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                     )}
                     
                     {action.type === 'sms' && (
                       <div className="space-y-2">
                         <Label>Message Template</Label>
                         <Textarea
                           placeholder="Critical asset alert: {{assetName}} requires immediate attention"
                           value={action.message}
                           onChange={(e) => handleActionChange(index, 'message', e.target.value)}
                         />
                       </div>
                     )}
                     
                     {action.type === 'email' && (
                       <div className="space-y-2">
                         <Label>Email Template</Label>
                         <Select
                           value={action.template}
                           onValueChange={(value) => handleActionChange(index, 'template', value)}
                         >
                           <SelectTrigger>
                             <SelectValue placeholder="Select template" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="critical_alert">Critical Alert</SelectItem>
                             <SelectItem value="warning_alert">Warning Alert</SelectItem>
                             <SelectItem value="maintenance_alert">Maintenance Alert</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                     )}
                   </div>
                 </div>
               ))}
             </div>
             
             {/* Action Buttons */}
             <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
               <Button
                 variant="outline"
                 onClick={() => setIsAlertRulesModalOpen(false)}
                 disabled={isCreatingRule}
                 className="w-full sm:w-auto"
               >
                 Cancel
               </Button>
               <Button
                 onClick={handleCreateAlertRule}
                 disabled={isCreatingRule || !ruleForm.name}
                 className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
               >
                 {isCreatingRule ? (
                   'Creating...'
                 ) : (
                   'Create Rule'
                 )}
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   )
} 
