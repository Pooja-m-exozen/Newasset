
"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { assetApi, AssetData } from '@/lib/adminasset'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'
import { Progress } from './progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog'
import { Input } from './input'
import { Label } from './label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Textarea } from './textarea'
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts'
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
  Clock as ClockIcon,
  Target,
  Wrench,
  BarChart3,
  PieChart as PieChartIcon,
  Maximize2,
  Eye,
  ChevronDown,
  ChevronRight
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
}: EnhancedDashboardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false)
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null)
  const [isAlertsLoading, setIsAlertsLoading] = useState(false)
  const [alertsError, setAlertsError] = useState<string | null>(null)
  
  // Assets data state
  const [assetsData, setAssetsData] = useState<AssetData[]>([])
  const [isAssetsLoading, setIsAssetsLoading] = useState(false)
  const [assetsError, setAssetsError] = useState<string | null>(null)
  
  // Chart type states for each graph
  const [assetClassificationChartType, setAssetClassificationChartType] = useState<'pie' | 'bar'>('bar')
  const [assetTypeChartType, setAssetTypeChartType] = useState<'pie' | 'bar'>('pie')
  const [maintenanceChartType, setMaintenanceChartType] = useState<'pie' | 'bar'>('bar')
  
  // View modal states for detailed views
  const [isAssetClassificationViewOpen, setIsAssetClassificationViewOpen] = useState(false)
  const [isAssetTypeViewOpen, setIsAssetTypeViewOpen] = useState(false)
  const [isMaintenanceViewOpen, setIsMaintenanceViewOpen] = useState(false)
  
  // Expanded assets state for accordion
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set())
 
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

  // Fetch assets data with subassets
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setIsAssetsLoading(true)
        setAssetsError(null)
        const response = await assetApi.getAssetsWithSubAssets(true, 1, 10000)
        if (response.success && response.assets) {
          setAssetsData(response.assets as AssetData[])
        }
      } catch (error) {
        console.error('Error fetching assets:', error)
        setAssetsError(error instanceof Error ? error.message : 'Failed to fetch assets')
      } finally {
        setIsAssetsLoading(false)
      }
    }
    fetchAssets()
  }, [])

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

  // Process assets data for Asset and Subasset Classification graph
  const assetClassificationChartData = useMemo(() => {
    if (!assetsData || assetsData.length === 0) return []
    
    let totalAssets = 0
    let movableSubassets = 0
    let immovableSubassets = 0
    
    assetsData.forEach(asset => {
      totalAssets++
      if (asset.subAssets) {
        movableSubassets += asset.subAssets.movable?.length || 0
        immovableSubassets += asset.subAssets.immovable?.length || 0
      }
    })
    
    return [
      { name: 'Total Assets', value: totalAssets, color: '#3B82F6' },
      { name: 'Movable Subassets', value: movableSubassets, color: '#10B981' },
      { name: 'Immovable Subassets', value: immovableSubassets, color: '#F59E0B' }
    ]
  }, [assetsData])

  const assetTypeChartData = useMemo(() => {
    if (!transformedPredictionsData?.predictions) return []
    
    const typeCounts: Record<string, number> = {}
    transformedPredictionsData.predictions.forEach(p => {
      const type = p.assetType || 'Unknown'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })
    
    return Object.entries(typeCounts).map(([name, value], index) => ({
      name,
      value,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'][index % 8]
    }))
  }, [transformedPredictionsData])

  const maintenanceChartData = useMemo(() => {
    if (!transformedPredictionsData?.predictions) return []
    
    const maintenanceData = transformedPredictionsData.predictions.reduce((acc: Record<string, number>, p) => {
      const date = new Date(p.prediction.nextMaintenanceDate)
      const daysUntil = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntil < 0) {
        acc['Overdue'] = (acc['Overdue'] || 0) + 1
      } else if (daysUntil <= 7) {
        acc['This Week'] = (acc['This Week'] || 0) + 1
      } else if (daysUntil <= 14) {
        acc['Next Week'] = (acc['Next Week'] || 0) + 1
      } else if (daysUntil <= 30) {
        acc['This Month'] = (acc['This Month'] || 0) + 1
      } else {
        acc['Later'] = (acc['Later'] || 0) + 1
      }
      return acc
    }, {})
    
    const order = ['Overdue', 'This Week', 'Next Week', 'This Month', 'Later']
    return order.map((name, index) => ({
      name,
      value: maintenanceData[name] || 0,
      color: ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#6B7280'][index]
    }))
  }, [transformedPredictionsData])


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

  const toggleAssetExpansion = (assetId: string) => {
    setExpandedAssets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(assetId)) {
        newSet.delete(assetId)
      } else {
        newSet.add(assetId)
      }
      return newSet
    })
  }


    return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-muted/20 transition-colors duration-200">
        <div className="flex-1 overflow-auto">

        {/* Main Content */}
        <main className="px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pt-3 sm:pt-4 pb-4 sm:pb-6 space-y-4 sm:space-y-6 md:space-y-8">
         
          {/* Advanced Stats Grid - Clean Minimalist Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {advancedStats.map((stat, index) => (
              <Card 
                key={stat.title} 
                className="bg-white dark:bg-card border border-border/50 shadow-sm hover:shadow transition-shadow"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-muted/50">
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-foreground/70" />
                    </div>
                    <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
                      <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600 dark:text-green-400" />
                      <span className="text-[10px] sm:text-xs font-semibold text-green-700 dark:text-green-300">
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-medium text-foreground">{stat.title}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground leading-none">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">{stat.subValue}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 hidden sm:block">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Asset Health Monitoring and Cost Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Asset Health Monitoring - Simplified */}
            <Card className="bg-white dark:bg-card border border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base font-semibold">Asset Health Monitoring</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">Real-time asset health status distribution</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isHealthLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : healthError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{healthError}</p>
                  </div>
                ) : healthData?.success ? (
                  <div className="space-y-3">
                    {assetHealthData.map((asset, index) => {
                      const colorMap: Record<string, string> = {
                        'bg-green-500': '#10B981',
                        'bg-blue-500': '#3B82F6',
                        'bg-yellow-500': '#F59E0B',
                        'bg-orange-500': '#F97316',
                        'bg-red-500': '#EF4444'
                      }
                      const hexColor = colorMap[asset.color] || '#6B7280'
                      return (
                        <div key={index} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: hexColor }}></div>
                              <span className="text-sm font-medium text-foreground">{asset.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground">{asset.percentage}%</span>
                              <span className="text-sm font-semibold text-foreground">{asset.count}</span>
                            </div>
                          </div>
                          <div className="w-full h-3 bg-muted/50 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${asset.percentage}%`,
                                backgroundColor: hexColor
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Total: <span className="font-semibold text-foreground">{assetHealthData.reduce((sum, asset) => sum + asset.count, 0)}</span></span>
                      <Badge variant="outline" className="text-xs">Real-time</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { name: "Excellent", count: 0, percentage: 0, color: "#10B981" },
                      { name: "Good", count: 0, percentage: 0, color: "#3B82F6" },
                      { name: "Fair", count: 0, percentage: 0, color: "#F59E0B" },
                      { name: "Poor", count: 0, percentage: 0, color: "#F97316" },
                      { name: "Critical", count: 0, percentage: 0, color: "#EF4444" }
                    ].map((asset, index) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }}></div>
                            <span className="text-sm font-medium text-foreground">{asset.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">{asset.percentage}%</span>
                            <span className="text-sm font-semibold text-foreground">{asset.count}</span>
                          </div>
                        </div>
                        <div className="w-full h-3 bg-muted/50 rounded-full"></div>
                      </div>
                    ))}
                    <div className="mt-4 pt-3 border-t border-border/50 text-center">
                      <p className="text-xs text-muted-foreground">No Data Available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cost Analysis - Simplified */}
            <Card className="bg-white dark:bg-card border border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm sm:text-base font-semibold">Cost Analysis</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">Asset cost analysis and depreciation tracking</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isCostLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : costError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{costError}</p>
                  </div>
                ) : costData?.success ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Purchase Cost</p>
                        <p className="text-lg font-bold text-foreground">
                          ${costAnalysisData.totalPurchaseCost.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Current Value</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          ${costAnalysisData.totalCurrentValue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-muted-foreground">Total Depreciation</p>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">
                          ${costAnalysisData.totalDepreciation.toLocaleString()}
                        </p>
                      </div>
                      <Progress
                        value={costAnalysisData.totalPurchaseCost > 0 ? (costAnalysisData.totalDepreciation / costAnalysisData.totalPurchaseCost) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Total Assets: <span className="font-semibold text-foreground">{costAnalysisData.assetCount}</span></span>
                      <Badge variant="outline" className="text-xs">Real-time</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Purchase Cost</p>
                        <p className="text-lg font-bold text-foreground">$0</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Current Value</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">$0</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-muted-foreground">Total Depreciation</p>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">$0</p>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                    <div className="mt-4 pt-3 border-t border-border/50 text-center">
                      <p className="text-xs text-muted-foreground">No Data Available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Graph Cards - Row 1: 2 Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Maintenance Timeline Graph */}
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm sm:text-base font-semibold">Maintenance Timeline</CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">Scheduled maintenance overview</CardDescription>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 sm:px-3 text-[10px] sm:text-xs bg-primary/5 hover:bg-primary/10 hover:text-primary border-primary/20 hover:border-primary/40 transition-all duration-200 shadow-sm hover:shadow-md flex-1 sm:flex-initial"
                      onClick={() => setIsMaintenanceViewOpen(true)}
                    >
                      <Eye className="w-3 h-3 mr-1 sm:mr-1.5" />
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">View</span>
                    </Button>
                    <Select value={maintenanceChartType} onValueChange={(value: string) => setMaintenanceChartType(value as 'pie' | 'bar')}>
                      <SelectTrigger className="w-20 sm:w-24 h-7 text-[10px] sm:text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pie">Pie</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {isPredictionsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : predictionsError ? (
                  <div className="text-center py-16">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">{predictionsError}</p>
                  </div>
                ) : maintenanceChartData.length > 0 && maintenanceChartData.some(d => d.value > 0) ? (
                  <div className="h-[200px] sm:h-[240px] md:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {maintenanceChartType === 'pie' ? (
                        <PieChart>
                          <Pie
                            data={maintenanceChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {maintenanceChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                          />
                        </PieChart>
                      ) : (
                        <BarChart data={maintenanceChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="name" 
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                            {maintenanceChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Wrench className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comparative Analysis Graph - With Pie/Bar Toggle */}
            <Card className="bg-white dark:bg-card border border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm sm:text-base font-semibold">Comparative Analysis</CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">Data visualization</CardDescription>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 sm:px-3 text-[10px] sm:text-xs bg-primary/5 hover:bg-primary/10 hover:text-primary border-primary/20 hover:border-primary/40 transition-all duration-200 shadow-sm hover:shadow-md flex-1 sm:flex-initial"
                      onClick={() => setIsAssetTypeViewOpen(true)}
                    >
                      <Eye className="w-3 h-3 mr-1 sm:mr-1.5" />
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">View</span>
                    </Button>
                    <Select value={assetTypeChartType} onValueChange={(value: string) => setAssetTypeChartType(value as 'pie' | 'bar')}>
                      <SelectTrigger className="w-20 sm:w-28 h-7 text-[10px] sm:text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pie">Pie Chart</SelectItem>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {isPredictionsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : predictionsError ? (
                  <div className="text-center py-16">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">{predictionsError}</p>
                  </div>
                ) : assetTypeChartData.length > 0 && assetTypeChartData.some(d => d.value > 0) ? (
                  <div className="h-[200px] sm:h-[240px] md:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {assetTypeChartType === 'pie' ? (
                        <PieChart>
                          <Pie
                            data={assetTypeChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {assetTypeChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                          />
                        </PieChart>
                      ) : (
                        <BarChart 
                          data={assetTypeChartData} 
                          margin={{ top: 15, right: 15, left: 5, bottom: 35 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="name" 
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fontSize: 10 }}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px',
                              fontSize: '12px',
                              padding: '6px'
                            }}
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {assetTypeChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Asset Classification + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Asset and Subasset Classification Graph */}
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm sm:text-base font-semibold">Asset Classification</CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">Assets and subassets classification</CardDescription>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 sm:px-3 text-[10px] sm:text-xs bg-primary/5 hover:bg-primary/10 hover:text-primary border-primary/20 hover:border-primary/40 transition-all duration-200 shadow-sm hover:shadow-md flex-1 sm:flex-initial"
                      onClick={() => setIsAssetClassificationViewOpen(true)}
                    >
                      <Eye className="w-3 h-3 mr-1 sm:mr-1.5" />
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">View</span>
                    </Button>
                    <Select value={assetClassificationChartType} onValueChange={(value: string) => setAssetClassificationChartType(value as 'pie' | 'bar')}>
                      <SelectTrigger className="w-20 sm:w-24 h-7 text-[10px] sm:text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pie">Pie</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {isAssetsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : assetsError ? (
                  <div className="text-center py-16">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">{assetsError}</p>
                  </div>
                ) : assetClassificationChartData.length > 0 && assetClassificationChartData.some(d => d.value > 0) ? (
                  <div className="h-[300px] sm:h-[340px] md:h-[380px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {assetClassificationChartType === 'pie' ? (
                        <PieChart>
                          <Pie
                            data={assetClassificationChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={false}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {assetClassificationChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                          />
                        </PieChart>
                      ) : (
                        <BarChart data={assetClassificationChartData} margin={{ top: 10, right: 10, left: 10, bottom: 80 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis 
                            dataKey="name" 
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            dy={10}
                            dx={-5}
                          />
                          <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--background))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                            {assetClassificationChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Section */}
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div>
                  <CardTitle className="text-sm sm:text-base font-semibold">Quick Actions</CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">Common tasks and shortcuts</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col gap-2 sm:gap-2 items-center">
                <Button
                  variant="outline"
                  className="w-full max-w-[150px] sm:max-w-[180px] h-10 sm:h-12 flex-row hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200 justify-center items-center gap-2 px-3 py-2 border-2 border-border/50 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md rounded-lg"
                  onClick={handleAddUserClick}
                  aria-label="Add a new user"
                >
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-[10px] sm:text-xs font-medium text-foreground">Add User</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full max-w-[150px] sm:max-w-[180px] h-10 sm:h-12 flex-row hover:bg-green-50 dark:hover:bg-green-950/20 transition-all duration-200 justify-center items-center gap-2 px-3 py-2 border-2 border-border/50 hover:border-green-500 dark:hover:border-green-400 hover:shadow-md rounded-lg"
                  onClick={handleAddAssetClick}
                  aria-label="Add a new asset"
                >
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                  <span className="text-[10px] sm:text-xs font-medium text-foreground">Add Asset</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full max-w-[150px] sm:max-w-[180px] h-10 sm:h-12 flex-row hover:bg-yellow-50 dark:hover:bg-yellow-950/20 transition-all duration-200 justify-center items-center gap-2 px-3 py-2 border-2 border-border/50 hover:border-yellow-500 dark:hover:border-yellow-400 hover:shadow-md rounded-lg"
                  onClick={handleAddLocationClick}
                  aria-label="Add a new location"
                >
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-[10px] sm:text-xs font-medium text-foreground">Add Location</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full max-w-[150px] sm:max-w-[180px] h-10 sm:h-12 flex-row hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all duration-200 justify-center items-center gap-2 px-3 py-2 border-2 border-border/50 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md rounded-lg"
                  onClick={handleGenerateReportClick}
                  aria-label="Generate report"
                >
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[10px] sm:text-xs font-medium text-foreground">Generate Report</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full max-w-[150px] sm:max-w-[180px] h-10 sm:h-12 flex-row hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 justify-center items-center gap-2 px-3 py-2 border-2 border-border/50 hover:border-red-500 dark:hover:border-red-400 hover:shadow-md rounded-lg"
                  onClick={handleViewAlertsClick}
                  aria-label="View system alerts"
                >
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 dark:text-red-400" />
                  <span className="text-[10px] sm:text-xs font-medium text-foreground">View Alerts</span>
                </Button>
              </div>
            </CardContent>
          </Card>
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

      {/* Asset Classification Detailed View Modal - In Depth */}
      <Dialog open={isAssetClassificationViewOpen} onOpenChange={setIsAssetClassificationViewOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader className="pb-2 sm:pb-3 border-b border-border/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground" />
                  Asset Classification - Detailed View
                </DialogTitle>
                <DialogDescription className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">Complete breakdown of all assets with their Movable and Immovable classifications</DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full hover:bg-muted"
                onClick={() => setIsAssetClassificationViewOpen(false)}
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="mt-2 sm:mt-3 space-y-3">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {assetClassificationChartData.map((item: { name: string; value: number; color: string }, index: number) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center justify-center p-3 sm:p-4 bg-card border border-border rounded-lg"
                >
                  <div className="w-1.5 h-1.5 rounded-full mb-2" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1 text-center">{item.name}</span>
                  <span className="text-xl sm:text-2xl font-bold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Assets List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-foreground/70" />
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">All Assets</h3>
                </div>
                <Badge variant="outline" className="text-xs px-2 py-0.5">
                  {assetsData.length} {assetsData.length === 1 ? 'Asset' : 'Assets'}
                </Badge>
              </div>

              {isAssetsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : assetsError ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">{assetsError}</p>
                </div>
              ) : assetsData.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No assets available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assetsData.map((asset) => {
                    const assetId = asset._id || asset.tagId
                    const isExpanded = expandedAssets.has(assetId)
                    const movableCount = asset.subAssets?.movable?.length || 0
                    const immovableCount = asset.subAssets?.immovable?.length || 0
                    const hasSubassets = movableCount > 0 || immovableCount > 0

                    return (
                      <div 
                        key={assetId}
                        className="border border-border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Parent Asset Header */}
                        <div
                          className={`flex items-start justify-between p-3 sm:p-4 transition-all ${
                            hasSubassets 
                              ? 'cursor-pointer hover:bg-muted/50' 
                              : 'cursor-default'
                          }`}
                          onClick={() => hasSubassets && toggleAssetExpansion(assetId)}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {hasSubassets && (
                              <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center transition-transform">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-primary" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-primary" />
                                )}
                              </div>
                            )}
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <div className="flex-shrink-0 mt-0.5">
                                <Building2 className="w-4 h-4 text-foreground/60" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <h4 className="text-sm sm:text-base font-semibold text-foreground">
                                    {asset.assetType || 'Asset'}
                                  </h4>
                                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-mono">
                                    {asset.tagId}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  {asset.brand && (
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">Brand:</span>
                                      <span className="text-foreground/80">{asset.brand}</span>
                                    </div>
                                  )}
                                  {asset.model && (
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">Model:</span>
                                      <span className="text-foreground/80">{asset.model}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                            {movableCount > 0 && (
                              <Badge variant="outline" className="text-xs px-2 py-1 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                                <Activity className="w-3 h-3 mr-1 inline" />
                                {movableCount}
                              </Badge>
                            )}
                            {immovableCount > 0 && (
                              <Badge variant="outline" className="text-xs px-2 py-1 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                                <Target className="w-3 h-3 mr-1 inline" />
                                {immovableCount}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && hasSubassets && (
                          <div className="border-t border-border bg-gradient-to-br from-muted/30 to-muted/10 dark:from-muted/20 dark:to-muted/5 p-4 sm:p-5 space-y-5">
                            {/* Movable Section */}
                            {movableCount > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2.5 pb-2.5 border-b border-green-200/50 dark:border-green-800/50">
                                  <div className="w-6 h-6 rounded-lg bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                                    <Activity className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                  </div>
                                  <h5 className="text-sm font-semibold text-foreground flex-1">Movable Subassets</h5>
                                  <Badge variant="outline" className="text-xs px-2 py-0.5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                                    {movableCount} {movableCount === 1 ? 'item' : 'items'}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {asset.subAssets?.movable?.map((subAsset, idx) => (
                                    <div
                                      key={idx}
                                      className="group relative p-3.5 bg-card border border-green-200/50 dark:border-green-800/30 rounded-lg hover:border-green-400 dark:hover:border-green-600 hover:shadow-md transition-all duration-200"
                                    >
                                      {/* Left border accent */}
                                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                      
                                      <div className="flex items-start justify-between mb-2.5">
                                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                          <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-md bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                                            <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h6 className="text-sm font-semibold text-foreground mb-0.5">{subAsset.assetName}</h6>
                                            {subAsset.tagId && (
                                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono mt-0.5">
                                                {subAsset.tagId}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-2 text-xs ml-9">
                                        {subAsset.brand && (
                                          <div className="flex items-start gap-2">
                                            <span className="font-medium text-muted-foreground min-w-[65px] flex-shrink-0">Brand:</span>
                                            <span className="text-foreground/90">{subAsset.brand}</span>
                                          </div>
                                        )}
                                        {subAsset.model && (
                                          <div className="flex items-start gap-2">
                                            <span className="font-medium text-muted-foreground min-w-[65px] flex-shrink-0">Model:</span>
                                            <span className="text-foreground/90">{subAsset.model}</span>
                                          </div>
                                        )}
                                        {subAsset.capacity && (
                                          <div className="flex items-start gap-2">
                                            <span className="font-medium text-muted-foreground min-w-[65px] flex-shrink-0">Capacity:</span>
                                            <span className="text-foreground/90">{subAsset.capacity}</span>
                                          </div>
                                        )}
                                        {subAsset.location && (
                                          <div className="flex items-start gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                            <span className="font-medium text-muted-foreground min-w-[65px] flex-shrink-0">Location:</span>
                                            <span className="text-foreground/90">{subAsset.location}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Immovable Section */}
                            {immovableCount > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2.5 pb-2.5 border-b border-orange-200/50 dark:border-orange-800/50">
                                  <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                                    <Target className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                                  </div>
                                  <h5 className="text-sm font-semibold text-foreground flex-1">Immovable Subassets</h5>
                                  <Badge variant="outline" className="text-xs px-2 py-0.5 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                                    {immovableCount} {immovableCount === 1 ? 'item' : 'items'}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {asset.subAssets?.immovable?.map((subAsset, idx) => (
                                    <div
                                      key={idx}
                                      className="group relative p-3.5 bg-card border border-orange-200/50 dark:border-orange-800/30 rounded-lg hover:border-orange-400 dark:hover:border-orange-600 hover:shadow-md transition-all duration-200"
                                    >
                                      {/* Left border accent */}
                                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                      
                                      <div className="flex items-start justify-between mb-2.5">
                                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                          <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-md bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                                            <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h6 className="text-sm font-semibold text-foreground mb-0.5">{subAsset.assetName}</h6>
                                            {subAsset.tagId && (
                                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono mt-0.5">
                                                {subAsset.tagId}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-2 text-xs ml-9">
                                        {subAsset.brand && (
                                          <div className="flex items-start gap-2">
                                            <span className="font-medium text-muted-foreground min-w-[65px] flex-shrink-0">Brand:</span>
                                            <span className="text-foreground/90">{subAsset.brand}</span>
                                          </div>
                                        )}
                                        {subAsset.model && (
                                          <div className="flex items-start gap-2">
                                            <span className="font-medium text-muted-foreground min-w-[65px] flex-shrink-0">Model:</span>
                                            <span className="text-foreground/90">{subAsset.model}</span>
                                          </div>
                                        )}
                                        {subAsset.capacity && (
                                          <div className="flex items-start gap-2">
                                            <span className="font-medium text-muted-foreground min-w-[65px] flex-shrink-0">Capacity:</span>
                                            <span className="text-foreground/90">{subAsset.capacity}</span>
                                          </div>
                                        )}
                                        {subAsset.location && (
                                          <div className="flex items-start gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                                            <span className="font-medium text-muted-foreground min-w-[65px] flex-shrink-0">Location:</span>
                                            <span className="text-foreground/90">{subAsset.location}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Asset Type Distribution Detailed View Modal - Categories Only */}
      <Dialog open={isAssetTypeViewOpen} onOpenChange={setIsAssetTypeViewOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-5xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader className="pb-3 sm:pb-4 border-b border-border/50">
            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Comparative Analysis
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm mt-1 sm:mt-2">Asset type categories breakdown</DialogDescription>
          </DialogHeader>
          <div className="mt-4 sm:mt-6">
            {/* Category Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {assetTypeChartData.map((item, index) => (
                <div 
                  key={index} 
                  className="group flex flex-col items-center p-4 sm:p-5 bg-gradient-to-br from-white to-muted/30 dark:from-card dark:to-muted/20 border-2 border-border/50 rounded-xl shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 hover:scale-105"
                >
                  <div 
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full mb-3 sm:mb-4 shadow-md ring-2 ring-white dark:ring-card" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-xs sm:text-sm font-semibold text-foreground mb-2 text-center leading-tight">{item.name}</span>
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">{item.value}</span>
                  <div className="mt-2 w-full h-1 rounded-full bg-muted/50 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        backgroundColor: item.color,
                        width: `${Math.max(10, (item.value / Math.max(...assetTypeChartData.map(d => d.value), 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Maintenance Timeline Detailed View Modal - Categories Only */}
      <Dialog open={isMaintenanceViewOpen} onOpenChange={setIsMaintenanceViewOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto">
          <DialogHeader className="pb-3 sm:pb-4 border-b border-border/50">
            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Maintenance Timeline
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm mt-1 sm:mt-2">Scheduled maintenance categories breakdown</DialogDescription>
          </DialogHeader>
          <div className="mt-4 sm:mt-6">
            {/* Category Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              {maintenanceChartData.map((item, index) => (
                <div 
                  key={index} 
                  className="group flex flex-col items-center p-4 sm:p-5 bg-gradient-to-br from-white to-muted/30 dark:from-card dark:to-muted/20 border-2 border-border/50 rounded-xl shadow-sm hover:shadow-lg hover:border-primary/50 transition-all duration-300 hover:scale-105"
                >
                  <div 
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full mb-3 sm:mb-4 shadow-md ring-2 ring-white dark:ring-card" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-xs sm:text-sm font-semibold text-foreground mb-2 text-center leading-tight">{item.name}</span>
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">{item.value}</span>
                  <div className="mt-2 w-full h-1 rounded-full bg-muted/50 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        backgroundColor: item.color,
                        width: `${Math.max(10, (item.value / Math.max(...maintenanceChartData.map(d => d.value), 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
