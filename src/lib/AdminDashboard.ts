const API_BASE_URL = 'http://192.168.0.5:5021/api'

export interface Prediction {
  assetId: string
  tagId: string
  assetType: string
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
  performanceMetrics: any
  maintenanceSchedule: any
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
    maintenanceStats: any
    iotStats: any
    performanceStats: any
    alertStats: any
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
  partsUsed: any[]
  tags: any[]
  attachments: any[]
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

  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
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
      const response = await fetch(`${API_BASE_URL}/analytics/predictions`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch predictions data')
      }

      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch predictions data')
    }
  }

  async getAIInsights(insightType: string = 'performance', timeRange: string = '90_days'): Promise<AIInsightsData> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/ai/insights/system?insightType=${insightType}&timeRange=${timeRange}`,
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
      const response = await fetch(
        `${API_BASE_URL}/analytics/performance?timeRange=${timeRange}&metric=${metric}`,
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