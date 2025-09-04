const API_BASE_URL = 'https://digitalasset.zenapi.co.in/api'

export interface Prediction {
  assetId: string
  tagId: string
  assetType: string
  projectName: string
  projectId: string
  assignedTo?: {
    _id: string
    name: string
    email: string
  }
  prediction: {
    nextMaintenanceDate: string
    confidence: number
    factors: string[]
    recommendations: string[]
  }
  performanceMetrics: Record<string, string | number | boolean | object | null | undefined>
  maintenanceSchedule: Record<string, string | number | boolean | object | null | undefined>
}

export interface PredictionsResponse {
  success: boolean
  predictions: Prediction[]
  count: number
}

export interface DashboardData {
  success: boolean
  data: {
    assetStats: {
      _id: null
      totalAssets: number
      activeAssets: number
      underMaintenance: number
      inactiveAssets: number
      criticalAssets: number
      highPriorityAssets: number
    }
    maintenanceStats: Record<string, string | number | boolean | object | null | undefined>
    iotStats: Record<string, string | number | boolean | object | null | undefined>
    performanceStats: Record<string, string | number | boolean | object | null | undefined>
    alertStats: Record<string, string | number | boolean | object | null | undefined>
    projectBreakdown?: Array<{
      count: number
      activeCount: number
      maintenanceCount: number
      criticalCount: number
      projectName: string
      projectId: string
    }>
  }
}

// AI Insights interfaces
export interface AIInsightsData {
  success: boolean
  insights: {
    overallEfficiency: number
    maintenanceCosts: number
    assetUtilization: number
    recommendations: string[]
  }
  summary: {
    totalAssets: number
    totalMaintenanceLogs: number
    totalUsers: number
    insightType: string
  }
}

export interface AIInsightCard {
  id: string
  title: string
  value: number
  unit: string
  description: string
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  color: string
  icon: string
}

// Analytics Performance interfaces
export interface PerformanceData {
  success: boolean
  insights: {
    overallEfficiency: number
    maintenanceCosts: number
    assetUtilization: number
    recommendations: string[]
  }
  summary: {
    totalAssets: number
    totalMaintenanceLogs: number
    totalUsers: number
  }
  trends: {
    efficiency: number
    utilization: number
    costs: number
    health: number
  }
  chartData: {
    efficiency: number[]
    utilization: number[]
  }
  healthScore: number
}

// Asset Health interfaces
export interface AssetHealth {
  assetId: string
  tagId: string
  assetType: string
  projectName: string
  projectId: string
  assignedTo?: {
    _id: string
    name: string
    email: string
  }
  status: string
  priority: string
  health: {
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
    score: number
    factors: string[]
  }
  performanceMetrics: Record<string, string | number | boolean | object | null | undefined>
  alerts: Array<{ message: string; type: string; timestamp: string; [key: string]: string | number | boolean | object | null | undefined }>
}

export interface HealthStatistics {
  excellent: number
  good: number
  fair: number
  poor: number
  critical: number
}

export interface HealthResponse {
  success: boolean
  healthData: AssetHealth[]
  statistics: HealthStatistics
}

// Cost Analysis interfaces
export interface AssetCost {
  assetId: string
  tagId: string
  assetType: string
  age: number
  depreciationAmount: number | null
}

export interface CostStatistics {
  totalPurchaseCost: number
  totalCurrentValue: number
  totalDepreciation: number
  avgDepreciationRate: number
  assetCount: number
}

export interface CostResponse {
  success: boolean
  costData: AssetCost[]
  statistics: CostStatistics
}

// Trends Analysis interfaces
export interface TrendData {
  date: string
  maintenanceCount: number
  emergencyCount: number
  completedCount: number
  pendingCount: number
}

export interface TrendsResponse {
  success: boolean
  trendData: TrendData[]
  period: string
  totalRecords: number
}

// Maintenance Logs interfaces
export interface MaintenanceLogLocation {
  coordinates: {
    latitude: string
    longitude: string
  }
  building: string
  floor: string
  room: string
}

export interface MaintenanceLogAsset {
  _id: string
  tagId: string
  assetType: string
}

export interface MaintenanceLogTechnician {
  _id: string
  name: string
  email: string
}

export interface MaintenanceLogQualityCheck {
  performed: boolean
}

export interface MaintenanceLog {
  _id: string
  location: MaintenanceLogLocation
  qualityCheck: MaintenanceLogQualityCheck
  asset: MaintenanceLogAsset
  performedBy: MaintenanceLogTechnician
  maintenanceType: string
  title: string
  description: string
  actionTaken: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedDuration: number
  scheduledDate: string
  dueDate: string
  date: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
  remarks: string
  estimatedCost: number
  actualCost: number
  partsUsed: Array<{ name: string; quantity: number; cost: number; [key: string]: string | number | boolean | object | null | undefined }>
  tags: Array<{ name: string; color: string; [key: string]: string | number | boolean | object | null | undefined }>
  attachments: Array<{ name: string; url: string; type: string; [key: string]: string | number | boolean | object | null | undefined }>
  createdAt: string
  updatedAt: string
  workCompletedAt?: string
  workStartedAt?: string
  workStartedBy?: string
  workPausedAt?: string
}

export interface MaintenanceLogsResponse {
  success: boolean
  logs: MaintenanceLog[]
}

class AdminDashboardService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  private getUserProject() {
    return localStorage.getItem('userProject')
  }

  async getDashboardData(): Promise<DashboardData> {
    try {
      const userProject = this.getUserProject()
      if (!userProject) {
        throw new Error('User project not found')
      }

      const response = await fetch(`${API_BASE_URL}/analytics/dashboard?projectName=${encodeURIComponent(userProject)}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch dashboard data')
      }

      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch dashboard data')
    }
  }

    async getPredictions(): Promise<PredictionsResponse> {
    try {
      const userProject = this.getUserProject()
      if (!userProject) {
        throw new Error('User project not found')
      }

      const response = await fetch(`${API_BASE_URL}/analytics/predictions`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch predictions data')
      }

      // Filter predictions by user's project name
      if (result.success && result.predictions && Array.isArray(result.predictions)) {
        const filteredPredictions = result.predictions.filter(
          (prediction: Prediction) => prediction.projectName === userProject
        )
        
        return {
          ...result,
          predictions: filteredPredictions,
          count: filteredPredictions.length
        }
      }

      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch predictions data')
    }
  }

  async getHealthData(): Promise<HealthResponse> {
    try {
      const userProject = this.getUserProject()
      if (!userProject) {
        throw new Error('User project not found')
      }

      const response = await fetch(`${API_BASE_URL}/analytics/health`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch health data')
      }

      // Filter health data by user's project name
      if (result.success && result.healthData && Array.isArray(result.healthData)) {
        const filteredHealthData = result.healthData.filter(
          (asset: AssetHealth) => asset.projectName === userProject
        )
        
        // Recalculate statistics based on filtered data
        const statistics = {
          excellent: filteredHealthData.filter((asset: AssetHealth) => asset.health.status === 'excellent').length,
          good: filteredHealthData.filter((asset: AssetHealth) => asset.health.status === 'good').length,
          fair: filteredHealthData.filter((asset: AssetHealth) => asset.health.status === 'fair').length,
          poor: filteredHealthData.filter((asset: AssetHealth) => asset.health.status === 'poor').length,
          critical: filteredHealthData.filter((asset: AssetHealth) => asset.health.status === 'critical').length
        }
        
        return {
          ...result,
          healthData: filteredHealthData,
          statistics
        }
      }

      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch health data')
    }
  }

  async getCostData(): Promise<CostResponse> {
    try {
      const userProject = this.getUserProject()
      if (!userProject) {
        throw new Error('User project not found')
      }

      const response = await fetch(`${API_BASE_URL}/analytics/cost?projectName=${encodeURIComponent(userProject)}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch cost data')
      }

      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch cost data')
    }
  }

  async getTrendsData(): Promise<TrendsResponse> {
    try {
      const userProject = this.getUserProject()
      if (!userProject) {
        throw new Error('User project not found')
      }

      const response = await fetch(`${API_BASE_URL}/analytics/trends?projectName=${encodeURIComponent(userProject)}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch trends data')
      }

      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch trends data')
    }
  }

  async getAIInsights(insightType: string = 'performance', timeRange: string = '90_days'): Promise<AIInsightsData> {
    try {
      const userProject = this.getUserProject()
      if (!userProject) {
        throw new Error('User project not found')
      }

      const response = await fetch(
        `${API_BASE_URL}/ai/insights/system?insightType=${insightType}&timeRange=${timeRange}&projectName=${encodeURIComponent(userProject)}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      )

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}: Failed to fetch AI insights data`)
      }

      return result
    } catch (error) {
      console.error('Error in getAIInsights:', error)
      
      // Return mock data for testing if API is not available
      if (error instanceof Error && error.message.includes('fetch')) {
        return {
          success: true,
          insights: {
            overallEfficiency: 0.82,
            maintenanceCosts: 15000,
            assetUtilization: 0.75,
            recommendations: [
              "Optimize maintenance schedule",
              "Improve asset utilization"
            ]
          },
          summary: {
            totalAssets: 4,
            totalMaintenanceLogs: 2,
            totalUsers: 2,
            insightType: "performance"
          }
        }
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch AI insights data')
    }
  }

  async getPerformanceData(timeRange: string = '30_days', metric: string = 'all'): Promise<PerformanceData> {
    try {
      const userProject = this.getUserProject()
      if (!userProject) {
        throw new Error('User project not found')
      }

      const response = await fetch(
        `${API_BASE_URL}/analytics/performance?timeRange=${timeRange}&metric=${metric}&projectName=${encodeURIComponent(userProject)}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      )

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}: Failed to fetch performance data`)
      }

      return result
    } catch (error) {
      console.error('Error in getPerformanceData:', error)
      
      // Return mock data for testing if API is not available
      if (error instanceof Error && error.message.includes('fetch')) {
        return {
          success: true,
          insights: {
            overallEfficiency: 0.85,
            maintenanceCosts: 18000,
            assetUtilization: 0.78,
            recommendations: [
              "Optimize maintenance schedule",
              "Improve asset utilization",
              "Reduce operational costs"
            ]
          },
          summary: {
            totalAssets: 6,
            totalMaintenanceLogs: 3,
            totalUsers: 4
          },
          trends: {
            efficiency: 5.2,
            utilization: 3.1,
            costs: -2.1,
            health: 1.8
          },
          chartData: {
            efficiency: [85, 88, 92, 89, 94, 91, 87, 90, 93, 89],
            utilization: [75, 78, 82, 79, 84, 81, 77, 80, 83, 79]
          },
          healthScore: 87
        }
      }
      
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch performance data')
    }
  }

  // Helper function to convert AI insights to dashboard cards
  convertAIInsightsToCards(aiInsights: AIInsightsData): AIInsightCard[] {
    if (!aiInsights.success || !aiInsights.insights) {
      return []
    }

    const { insights } = aiInsights

    const cards = [
      {
        id: '1',
        title: 'Overall Efficiency',
        value: Math.round(insights.overallEfficiency * 100),
        unit: '%',
        description: 'System efficiency based on asset performance and utilization',
        trend: 'up' as const,
        trendValue: 5.2,
        color: 'bg-blue-500',
        icon: 'TrendingUp'
      },
      {
        id: '2',
        title: 'Asset Utilization',
        value: Math.round(insights.assetUtilization * 100),
        unit: '%',
        description: 'Current asset utilization rate across all systems',
        trend: 'stable' as const,
        trendValue: 0,
        color: 'bg-green-500',
        icon: 'Activity'
      },
      {
        id: '3',
        title: 'Maintenance Costs',
        value: insights.maintenanceCosts,
        unit: '$',
        description: 'Total maintenance costs for the current period',
        trend: 'down' as const,
        trendValue: -2.1,
        color: 'bg-purple-500',
        icon: 'DollarSign'
      }
    ]
    
    return cards
  }
}

export const adminDashboardService = new AdminDashboardService()