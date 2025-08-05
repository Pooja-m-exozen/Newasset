const API_BASE_URL = 'http://192.168.0.5:5021/api'

export interface SystemInsight {
  id: string
  type: 'performance' | 'usage' | 'anomaly' | 'prediction'
  title: string
  description: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  timestamp: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  category: string
}

export interface AIInsightsResponse {
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

export interface RecommendationCriteria {
  budgetLimit: number
  timeHorizon: string
  priorityAreas: string[]
}

export interface RecommendationRequest {
  recommendationType: string
  criteria: RecommendationCriteria
}

export interface Recommendation {
  type: string
  priority: 'low' | 'medium' | 'high'
  description: string
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
}

export interface RecommendationsResponse {
  success: boolean
  recommendations: Recommendation[]
  summary: {
    totalRecommendations: number
    recommendationType: string
    priorityBreakdown: {
      high: number
      medium: number
      low: number
    }
  }
}

export interface PerformanceData {
  timestamp: string
  value: number
  label: string
}

export interface SystemPerformance {
  timeRange: string
  data: PerformanceData[]
  summary: {
    average: number
    peak: number
    low: number
    trend: 'up' | 'down' | 'stable'
  }
}

export const timeRanges = [
  { value: '7_days', label: 'Last 7 Days' },
  { value: '30_days', label: 'Last 30 Days' },
  { value: '90_days', label: 'Last 90 Days' },
  { value: '1_year', label: 'Last Year' }
]

export const insightTypes = [
  { value: 'performance', label: 'Performance' },
  { value: 'usage', label: 'Usage Patterns' },
  { value: 'anomaly', label: 'Anomaly Detection' },
  { value: 'prediction', label: 'Predictions' }
]

export const recommendationTypes = [
  { value: 'cost_optimization', label: 'Cost Optimization' },
  { value: 'performance_improvement', label: 'Performance Improvement' },
  { value: 'maintenance_optimization', label: 'Maintenance Optimization' },
  { value: 'safety_enhancement', label: 'Safety Enhancement' }
]

export async function getSystemInsights(
  insightType: string = 'performance',
  timeRange: string = '30_days',
  bearerToken: string
): Promise<AIInsightsResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/ai/insights/system?insightType=${insightType}&timeRange=${timeRange}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching system insights:', error)
    throw error
  }
}

export async function getRecommendations(
  request: RecommendationRequest,
  bearerToken: string
): Promise<RecommendationsResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/ai/insights/recommendations`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`
        },
        body: JSON.stringify(request)
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    throw error
  }
}

export async function getPerformanceMetrics(
  timeRange: string = '30_days',
  bearerToken: string
): Promise<SystemPerformance> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/ai/performance?timeRange=${timeRange}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    throw error
  }
}

export async function getPredictiveInsights(bearerToken: string): Promise<SystemInsight[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/ai/predictions`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.insights || []
  } catch (error) {
    console.error('Error fetching predictive insights:', error)
    throw error
  }
}

// Helper function to convert API response to insight cards
export function convertApiResponseToInsights(apiResponse: AIInsightsResponse): SystemInsight[] {
  if (!apiResponse.success || !apiResponse.insights) {
    return []
  }

  const { insights } = apiResponse

  return [
    {
      id: '1',
      type: 'performance',
      title: 'Overall Efficiency',
      description: 'System efficiency based on asset performance and utilization',
      value: insights.overallEfficiency * 100,
      unit: '%',
      trend: 'up',
      trendValue: 5.2,
      timestamp: new Date().toISOString(),
      category: 'Performance',
      severity: insights.overallEfficiency > 0.8 ? 'low' : insights.overallEfficiency > 0.6 ? 'medium' : 'high'
    },
    {
      id: '2',
      type: 'usage',
      title: 'Asset Utilization',
      description: 'Current asset utilization rate across all systems',
      value: insights.assetUtilization * 100,
      unit: '%',
      trend: 'stable',
      trendValue: 0,
      timestamp: new Date().toISOString(),
      category: 'Utilization',
      severity: insights.assetUtilization > 0.8 ? 'low' : insights.assetUtilization > 0.6 ? 'medium' : 'high'
    },
    {
      id: '3',
      type: 'anomaly',
      title: 'Maintenance Costs',
      description: 'Total maintenance costs for the current period',
      value: insights.maintenanceCosts,
      unit: '$',
      trend: 'down',
      trendValue: -2.1,
      timestamp: new Date().toISOString(),
      category: 'Costs',
      severity: insights.maintenanceCosts < 10000 ? 'low' : insights.maintenanceCosts < 15000 ? 'medium' : 'high'
    }
  ]
} 