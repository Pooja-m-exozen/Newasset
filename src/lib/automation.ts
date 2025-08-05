const API_BASE_URL = 'http://192.168.0.5:5021/api'

// Types for Workflow API
export interface WorkflowTrigger {
  type: 'schedule' | 'condition' | 'event'
  cron?: string
  field?: string
  operator?: string
  value?: string | string[]
  description?: string
}

export interface WorkflowAction {
  type: 'notification' | 'update' | 'email' | 'sms'
  target?: string
  template?: string
  field?: string
  value?: string
}

export interface WorkflowCondition {
  field: string
  operator: 'equals' | 'in' | 'greater_than' | 'less_than' | 'contains'
  value: string | string[] | number
}

export interface WorkflowRequest {
  name: string
  description: string
  triggers: WorkflowTrigger[]
  actions: WorkflowAction[]
  conditions?: WorkflowCondition[]
}

export interface WorkflowResponse {
  success: boolean
  message: string
  workflow: {
    id: string
    name: string
    description: string
    triggers: WorkflowTrigger[]
    actions: WorkflowAction[]
    conditions: WorkflowCondition[]
    isActive: boolean
    createdBy: string
    createdAt: string
  }
}

export interface WorkflowsListResponse {
  success: boolean
  workflows: WorkflowResponse['workflow'][]
  total: number
}

// Types for Schedule API
export interface ScheduleCriteria {
  priority?: string
  status?: string
  lastMaintenance?: {
    operator: 'older_than' | 'newer_than'
    days: number
  }
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  dayOfMonth?: number
  dayOfWeek?: number
  time: string
  timezone: string
  duration: number
  technicians: string[]
}

export interface ScheduleRequest {
  name: string
  type: 'maintenance' | 'inspection' | 'cleaning' | 'custom'
  assets: string[]
  criteria: ScheduleCriteria
  schedule: ScheduleConfig
}

export interface ScheduleResponse {
  success: boolean
  message: string
  schedule: {
    id: string
    name: string
    type: string
    assets: string[]
    criteria: ScheduleCriteria
    schedule: ScheduleConfig
    isActive: boolean
    createdBy: string
    createdAt: string
  }
}

export interface SchedulesListResponse {
  success: boolean
  schedules: ScheduleResponse['schedule'][]
  total: number
}

// Types for Schedule Optimization API
export interface OptimizationConstraints {
  maxWorkHours: number
  technicianSkills: string[]
  priority: 'efficiency' | 'cost' | 'quality' | 'speed'
  budget: number
}

export interface OptimizationTimeWindow {
  start: string
  end: string
}

export interface ScheduleOptimizationRequest {
  constraints: OptimizationConstraints
  assets: string[]
  timeWindow: OptimizationTimeWindow
}

export interface OptimizedSchedule {
  id: string
  name: string
  type: string
  assets: string[]
  schedule: ScheduleConfig
  optimizationScore: number
  estimatedCost: number
  estimatedDuration: number
  technicianAssignments: {
    technicianId: string
    skills: string[]
    workload: number
  }[]
}

export interface ScheduleOptimizationResponse {
  success: boolean
  message: string
  optimizedSchedules: OptimizedSchedule[]
  optimizationMetrics: {
    totalCost: number
    totalDuration: number
    efficiencyScore: number
    resourceUtilization: number
  }
}

// Types for Auto-Reschedule API
export interface EventLocation {
  latitude: string
  longitude: string
}

export interface AutoRescheduleEventData {
  assetId: string
  failureType: 'critical' | 'minor' | 'moderate'
  estimatedRepairTime: number
  priority: 'urgent' | 'high' | 'medium' | 'low'
  location: EventLocation
  affectedSchedule: string
}

export interface AutoRescheduleRequest {
  eventType: 'asset_failure' | 'technician_unavailable' | 'weather_delay' | 'emergency'
  eventData: AutoRescheduleEventData
}

export interface AutoRescheduleResponse {
  success: boolean
  message: string
  rescheduleResult: {
    rescheduledTasks: number
    priority: string
  }
}

// Types for Decision API
export interface PerformanceMetrics {
  efficiency: number
  uptime: number
  temperature: number
}

export interface DecisionContext {
  assetId: string
  currentStatus: string
  lastMaintenance: string
  performanceMetrics: PerformanceMetrics
  budget: number
  availableTechnicians: number
}

export interface DecisionCriteria {
  priorityFactors: string[]
  thresholds: {
    criticalEfficiency: number
    maxBudget: number
    minUptime: number
  }
}

export interface DecisionRequest {
  decisionType: 'maintenance_priority' | 'resource_allocation' | 'predictive_maintenance' | 'custom'
  context: DecisionContext
  criteria: DecisionCriteria
}

export interface DecisionResult {
  decision: string
  confidence: number
  reasoning: string
}

export interface DecisionResponse {
  success: boolean
  decision: DecisionResult
  confidence: number
  reasoning: string
}

// Types for Decision Analytics API
export interface DecisionAnalytics {
  totalDecisions: number
  accuracy: number
  averageConfidence: number
}

export interface DecisionAnalyticsResponse {
  success: boolean
  message?: string
  analytics: DecisionAnalytics
}

// Types for Decision Learning API
export interface DecisionFeedback {
  accuracy: number
  efficiency: number
  costSavings: number
  userSatisfaction: number
  notes: string
}

export interface DecisionLearningRequest {
  decisionId: string
  outcome: 'success' | 'partial' | 'failed'
  feedback: DecisionFeedback
}

export interface DecisionLearningResponse {
  success: boolean
  message: string
  learningResult: {
    accuracy: number
  }
}

// Execute Workflow Types
export interface WorkflowExecutionContext {
  assetId?: string
  userId?: string
  timestamp?: string
  parameters?: {
    maintenanceType?: string
    priority?: string
    [key: string]: any
  }
}

export interface WorkflowExecutionRequest {
  workflowId: string
  context: WorkflowExecutionContext
}

export interface WorkflowExecutionResponse {
  success: boolean
  message: string
  executionResult: {
    status: 'completed' | 'failed' | 'running'
    steps: number
  }
}

// API Functions
export async function createWorkflow(
  workflow: WorkflowRequest
): Promise<WorkflowResponse> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const response = await fetch(`${API_BASE_URL}/automation/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(workflow)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating workflow:', error)
    throw error
  }
}

export async function getWorkflows(): Promise<WorkflowsListResponse> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const response = await fetch(`${API_BASE_URL}/automation/workflows`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching workflows:', error)
    throw error
  }
}

export async function updateWorkflow(
  workflowId: string,
  workflow: Partial<WorkflowRequest>
): Promise<WorkflowResponse> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const response = await fetch(`${API_BASE_URL}/automation/workflows/${workflowId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(workflow)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error updating workflow:', error)
    throw error
  }
}

export async function deleteWorkflow(
  workflowId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const response = await fetch(`${API_BASE_URL}/automation/workflows/${workflowId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error deleting workflow:', error)
    throw error
  }
}

export async function toggleWorkflowStatus(
  workflowId: string,
  isActive: boolean
): Promise<WorkflowResponse> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const response = await fetch(`${API_BASE_URL}/automation/workflows/${workflowId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isActive })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error toggling workflow status:', error)
    throw error
  }
}

export async function executeWorkflow(
  request: WorkflowExecutionRequest
): Promise<WorkflowExecutionResponse> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const response = await fetch(`${API_BASE_URL}/automation/workflows/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error executing workflow:', error)
    throw error
  }
}

// Schedule API Functions
export async function createSchedule(
  schedule: ScheduleRequest
): Promise<ScheduleResponse> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const response = await fetch(`${API_BASE_URL}/automation/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(schedule)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating schedule:', error)
    throw error
  }
}

export async function getSchedules(): Promise<SchedulesListResponse> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const response = await fetch(`${API_BASE_URL}/automation/schedules`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching schedules:', error)
    throw error
  }
}

export async function updateSchedule(
  scheduleId: string,
  schedule: Partial<ScheduleRequest>
): Promise<ScheduleResponse> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const response = await fetch(`${API_BASE_URL}/automation/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(schedule)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error updating schedule:', error)
    throw error
  }
}

export async function deleteSchedule(
  scheduleId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const response = await fetch(`${API_BASE_URL}/automation/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error deleting schedule:', error)
    throw error
  }
}

export async function toggleScheduleStatus(
  scheduleId: string,
  isActive: boolean
): Promise<ScheduleResponse> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const response = await fetch(`${API_BASE_URL}/automation/schedules/${scheduleId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isActive })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error toggling schedule status:', error)
    throw error
  }
}

// Schedule Optimization API Function
export async function optimizeSchedules(
  request: ScheduleOptimizationRequest
): Promise<ScheduleOptimizationResponse> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const response = await fetch(`${API_BASE_URL}/automation/schedules/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error optimizing schedules:', error)
    throw error
  }
}

// Auto-Reschedule API Function
export async function autoRescheduleSchedules(
  request: AutoRescheduleRequest
): Promise<AutoRescheduleResponse> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const response = await fetch(`${API_BASE_URL}/automation/schedules/auto-reschedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error auto-rescheduling schedules:', error)
    throw error
  }
}

// Decision API Function
export async function makeDecision(
  request: DecisionRequest
): Promise<DecisionResponse> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const response = await fetch(`${API_BASE_URL}/automation/decisions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error making decision:', error)
    throw error
  }
}

// Decision Analytics API Function
export async function getDecisionAnalytics(): Promise<DecisionAnalyticsResponse> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const response = await fetch(`${API_BASE_URL}/automation/decisions/analytics`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching decision analytics:', error)
    throw error
  }
}

// Decision Learning API Function
export async function learnFromDecision(
  request: DecisionLearningRequest
): Promise<DecisionLearningResponse> {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('Authentication token not found')
    }

    const response = await fetch(`${API_BASE_URL}/automation/decisions/learn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error learning from decision:', error)
    throw error
  }
}