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
}

export const adminDashboardService = new AdminDashboardService()