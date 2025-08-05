'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { 
  WorkflowRequest, 
  WorkflowResponse, 
  WorkflowsListResponse,
  WorkflowExecutionRequest,
  WorkflowExecutionResponse,
  ScheduleRequest,
  ScheduleResponse,
  SchedulesListResponse,
  ScheduleOptimizationRequest,
  ScheduleOptimizationResponse,
  AutoRescheduleRequest,
  AutoRescheduleResponse,
  DecisionRequest,
  DecisionResponse,
  DecisionAnalytics,
  DecisionAnalyticsResponse,
  DecisionLearningRequest,
  DecisionLearningResponse,
  createWorkflow,
  getWorkflows,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflowStatus,
  executeWorkflow,
  createSchedule,
  getSchedules,
  updateSchedule,
  deleteSchedule,
  toggleScheduleStatus,
  optimizeSchedules,
  autoRescheduleSchedules,
  makeDecision,
  getDecisionAnalytics,
  learnFromDecision
} from '@/lib/automation'

interface AutomationContextType {
  // Workflow State
  workflows: WorkflowResponse['workflow'][]
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  executingWorkflow: string | null
  executionResult: WorkflowExecutionResponse | null

  // Schedule State
  schedules: ScheduleResponse['schedule'][]
  schedulesLoading: boolean
  schedulesError: string | null

  // Schedule Optimization State
  optimizationResult: ScheduleOptimizationResponse | null
  optimizationLoading: boolean
  optimizationError: string | null

  // Auto-Reschedule State
  rescheduleResult: AutoRescheduleResponse | null
  rescheduleLoading: boolean
  rescheduleError: string | null

  // Decision State
  decisionResult: DecisionResponse | null
  decisionLoading: boolean
  decisionError: string | null

  // Decision Analytics State
  decisionAnalytics: DecisionAnalytics | null
  analyticsLoading: boolean
  analyticsError: string | null

  // Decision Learning State
  learningResult: DecisionLearningResponse | null
  learningLoading: boolean
  learningError: string | null

  // Workflow Actions
  fetchWorkflows: () => Promise<void>
  createNewWorkflow: (workflow: WorkflowRequest) => Promise<void>
  updateExistingWorkflow: (workflowId: string, workflow: Partial<WorkflowRequest>) => Promise<void>
  deleteExistingWorkflow: (workflowId: string) => Promise<void>
  toggleWorkflowActiveStatus: (workflowId: string, isActive: boolean) => Promise<void>
  executeWorkflow: (request: WorkflowExecutionRequest) => Promise<void>
  clearExecutionResult: () => void

  // Schedule Actions
  fetchSchedules: () => Promise<void>
  createNewSchedule: (schedule: ScheduleRequest) => Promise<void>
  updateExistingSchedule: (scheduleId: string, schedule: Partial<ScheduleRequest>) => Promise<void>
  deleteExistingSchedule: (scheduleId: string) => Promise<void>
  toggleScheduleActiveStatus: (scheduleId: string, isActive: boolean) => Promise<void>

  // Schedule Optimization Actions
  optimizeSchedules: (request: ScheduleOptimizationRequest) => Promise<void>
  clearOptimizationResult: () => void

  // Auto-Reschedule Actions
  autoRescheduleSchedules: (request: AutoRescheduleRequest) => Promise<void>
  clearRescheduleResult: () => void

  // Decision Actions
  makeDecision: (request: DecisionRequest) => Promise<void>
  clearDecisionResult: () => void

  // Decision Analytics Actions
  fetchDecisionAnalytics: () => Promise<void>
  clearAnalyticsResult: () => void

  // Decision Learning Actions
  learnFromDecision: (request: DecisionLearningRequest) => Promise<void>
  clearLearningResult: () => void
}

const AutomationContext = createContext<AutomationContextType | undefined>(undefined)

interface AutomationProviderProps {
  children: ReactNode
}

export function AutomationProvider({ children }: AutomationProviderProps) {
  // Workflow State
  const [workflows, setWorkflows] = useState<WorkflowResponse['workflow'][]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [executingWorkflow, setExecutingWorkflow] = useState<string | null>(null)
  const [executionResult, setExecutionResult] = useState<WorkflowExecutionResponse | null>(null)

  // Schedule State
  const [schedules, setSchedules] = useState<ScheduleResponse['schedule'][]>([])
  const [schedulesLoading, setSchedulesLoading] = useState(false)
  const [schedulesError, setSchedulesError] = useState<string | null>(null)

  // Schedule Optimization State
  const [optimizationResult, setOptimizationResult] = useState<ScheduleOptimizationResponse | null>(null)
  const [optimizationLoading, setOptimizationLoading] = useState(false)
  const [optimizationError, setOptimizationError] = useState<string | null>(null)

  // Auto-Reschedule State
  const [rescheduleResult, setRescheduleResult] = useState<AutoRescheduleResponse | null>(null)
  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)

  // Decision State
  const [decisionResult, setDecisionResult] = useState<DecisionResponse | null>(null)
  const [decisionLoading, setDecisionLoading] = useState(false)
  const [decisionError, setDecisionError] = useState<string | null>(null)

  // Decision Analytics State
  const [decisionAnalytics, setDecisionAnalytics] = useState<DecisionAnalytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  // Decision Learning State
  const [learningResult, setLearningResult] = useState<DecisionLearningResponse | null>(null)
  const [learningLoading, setLearningLoading] = useState(false)
  const [learningError, setLearningError] = useState<string | null>(null)

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    setIsAuthenticated(!!token)
  }, [])

  // Workflow Functions
  const fetchWorkflows = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setError('Authentication required. Please login first.')
      setIsAuthenticated(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await getWorkflows()
      if (data.success) {
        setWorkflows(data.workflows)
      } else {
        setError('Failed to fetch workflows')
        setWorkflows([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workflows')
      setWorkflows([])
    } finally {
      setLoading(false)
    }
  }

  const createNewWorkflow = async (workflow: WorkflowRequest) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setError('Authentication required. Please login first.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await createWorkflow(workflow)
      if (data.success) {
        // Add the new workflow to the list
        setWorkflows(prev => [...prev, data.workflow])
      } else {
        setError(data.message || 'Failed to create workflow')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow')
    } finally {
      setLoading(false)
    }
  }

  const updateExistingWorkflow = async (workflowId: string, workflow: Partial<WorkflowRequest>) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setError('Authentication required. Please login first.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await updateWorkflow(workflowId, workflow)
      if (data.success) {
        // Update the workflow in the list
        setWorkflows(prev => 
          prev.map(w => w.id === workflowId ? data.workflow : w)
        )
      } else {
        setError(data.message || 'Failed to update workflow')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workflow')
    } finally {
      setLoading(false)
    }
  }

  const deleteExistingWorkflow = async (workflowId: string) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setError('Authentication required. Please login first.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await deleteWorkflow(workflowId)
      if (data.success) {
        // Remove the workflow from the list
        setWorkflows(prev => prev.filter(w => w.id !== workflowId))
      } else {
        setError(data.message || 'Failed to delete workflow')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workflow')
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkflowActiveStatus = async (workflowId: string, isActive: boolean) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setError('Authentication required. Please login first.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await toggleWorkflowStatus(workflowId, isActive)
      if (data.success) {
        // Update the workflow status in the list
        setWorkflows(prev => 
          prev.map(w => w.id === workflowId ? { ...w, isActive } : w)
        )
      } else {
        setError(data.message || 'Failed to toggle workflow status')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle workflow status')
    } finally {
      setLoading(false)
    }
  }

  const executeWorkflowAction = async (request: WorkflowExecutionRequest) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setError('Authentication required. Please login first.')
      return
    }

    setExecutingWorkflow(request.workflowId)
    setError(null)
    setExecutionResult(null)
    
    try {
      const data = await executeWorkflow(request)
      if (data.success) {
        setExecutionResult(data)
      } else {
        setError(data.message || 'Failed to execute workflow')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute workflow')
    } finally {
      setExecutingWorkflow(null)
    }
  }

  const clearExecutionResult = () => {
    setExecutionResult(null)
    setError(null)
  }

  // Schedule Functions
  const fetchSchedules = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setSchedulesError('Authentication required. Please login first.')
      return
    }

    setSchedulesLoading(true)
    setSchedulesError(null)
    try {
      const data = await getSchedules()
      if (data.success) {
        setSchedules(data.schedules)
      } else {
        setSchedulesError('Failed to fetch schedules')
        setSchedules([])
      }
    } catch (err) {
      setSchedulesError(err instanceof Error ? err.message : 'Failed to fetch schedules')
      setSchedules([])
    } finally {
      setSchedulesLoading(false)
    }
  }

  const createNewSchedule = async (schedule: ScheduleRequest) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setSchedulesError('Authentication required. Please login first.')
      return
    }

    setSchedulesLoading(true)
    setSchedulesError(null)
    try {
      const data = await createSchedule(schedule)
      if (data.success) {
        // Add the new schedule to the list
        setSchedules(prev => [...prev, data.schedule])
      } else {
        setSchedulesError(data.message || 'Failed to create schedule')
      }
    } catch (err) {
      setSchedulesError(err instanceof Error ? err.message : 'Failed to create schedule')
    } finally {
      setSchedulesLoading(false)
    }
  }

  const updateExistingSchedule = async (scheduleId: string, schedule: Partial<ScheduleRequest>) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setSchedulesError('Authentication required. Please login first.')
      return
    }

    setSchedulesLoading(true)
    setSchedulesError(null)
    try {
      const data = await updateSchedule(scheduleId, schedule)
      if (data.success) {
        // Update the schedule in the list
        setSchedules(prev => 
          prev.map(s => s.id === scheduleId ? data.schedule : s)
        )
      } else {
        setSchedulesError(data.message || 'Failed to update schedule')
      }
    } catch (err) {
      setSchedulesError(err instanceof Error ? err.message : 'Failed to update schedule')
    } finally {
      setSchedulesLoading(false)
    }
  }

  const deleteExistingSchedule = async (scheduleId: string) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setSchedulesError('Authentication required. Please login first.')
      return
    }

    setSchedulesLoading(true)
    setSchedulesError(null)
    try {
      const data = await deleteSchedule(scheduleId)
      if (data.success) {
        // Remove the schedule from the list
        setSchedules(prev => prev.filter(s => s.id !== scheduleId))
      } else {
        setSchedulesError(data.message || 'Failed to delete schedule')
      }
    } catch (err) {
      setSchedulesError(err instanceof Error ? err.message : 'Failed to delete schedule')
    } finally {
      setSchedulesLoading(false)
    }
  }

  const toggleScheduleActiveStatus = async (scheduleId: string, isActive: boolean) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setSchedulesError('Authentication required. Please login first.')
      return
    }

    setSchedulesLoading(true)
    setSchedulesError(null)
    try {
      const data = await toggleScheduleStatus(scheduleId, isActive)
      if (data.success) {
        // Update the schedule status in the list
        setSchedules(prev => 
          prev.map(s => s.id === scheduleId ? { ...s, isActive } : s)
        )
      } else {
        setSchedulesError(data.message || 'Failed to toggle schedule status')
      }
    } catch (err) {
      setSchedulesError(err instanceof Error ? err.message : 'Failed to toggle schedule status')
    } finally {
      setSchedulesLoading(false)
    }
  }

  // Schedule Optimization Functions
  const optimizeSchedulesAction = async (request: ScheduleOptimizationRequest) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setOptimizationError('Authentication required. Please login first.')
      return
    }

    setOptimizationLoading(true)
    setOptimizationError(null)
    setOptimizationResult(null)
    
    try {
      const data = await optimizeSchedules(request)
      if (data.success) {
        setOptimizationResult(data)
      } else {
        setOptimizationError(data.message || 'Failed to optimize schedules')
      }
    } catch (err) {
      setOptimizationError(err instanceof Error ? err.message : 'Failed to optimize schedules')
    } finally {
      setOptimizationLoading(false)
    }
  }

  const clearOptimizationResult = () => {
    setOptimizationResult(null)
    setOptimizationError(null)
  }

  // Auto-Reschedule Functions
  const autoRescheduleSchedulesAction = async (request: AutoRescheduleRequest) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setRescheduleError('Authentication required. Please login first.')
      return
    }

    setRescheduleLoading(true)
    setRescheduleError(null)
    setRescheduleResult(null)
    
    try {
      const data = await autoRescheduleSchedules(request)
      if (data.success) {
        setRescheduleResult(data)
      } else {
        setRescheduleError(data.message || 'Failed to auto-reschedule schedules')
      }
    } catch (err) {
      setRescheduleError(err instanceof Error ? err.message : 'Failed to auto-reschedule schedules')
    } finally {
      setRescheduleLoading(false)
    }
  }

  const clearRescheduleResult = () => {
    setRescheduleResult(null)
    setRescheduleError(null)
  }

  // Decision Functions
  const makeDecisionAction = useCallback(async (request: DecisionRequest) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setDecisionError('Authentication required. Please login first.')
      return
    }

    setDecisionLoading(true)
    setDecisionError(null)
    setDecisionResult(null)
    
    try {
      const data = await makeDecision(request)
      if (data.success) {
        setDecisionResult(data)
      } else {
        setDecisionError('Failed to make decision')
      }
    } catch (err) {
      setDecisionError(err instanceof Error ? err.message : 'Failed to make decision')
    } finally {
      setDecisionLoading(false)
    }
  }, [])

  const clearDecisionResult = useCallback(() => {
    setDecisionResult(null)
    setDecisionError(null)
  }, [])

  // Decision Analytics Functions
  const fetchDecisionAnalyticsAction = useCallback(async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setAnalyticsError('Authentication required. Please login first.')
      return
    }

    setAnalyticsLoading(true)
    setAnalyticsError(null)
    setDecisionAnalytics(null)
    
    try {
      const data = await getDecisionAnalytics()
      if (data.success) {
        setDecisionAnalytics(data.analytics)
      } else {
        setAnalyticsError(data.message || 'Failed to fetch decision analytics')
      }
    } catch (err) {
      setAnalyticsError(err instanceof Error ? err.message : 'Failed to fetch decision analytics')
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  const clearAnalyticsResult = useCallback(() => {
    setDecisionAnalytics(null)
    setAnalyticsError(null)
  }, [])

  // Decision Learning Functions
  const learnFromDecisionAction = useCallback(async (request: DecisionLearningRequest) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      setLearningError('Authentication required. Please login first.')
      return
    }

    setLearningLoading(true)
    setLearningError(null)
    setLearningResult(null)
    
    try {
      const data = await learnFromDecision(request)
      if (data.success) {
        setLearningResult(data)
      } else {
        setLearningError(data.message || 'Failed to learn from decision')
      }
    } catch (err) {
      setLearningError(err instanceof Error ? err.message : 'Failed to learn from decision')
    } finally {
      setLearningLoading(false)
    }
  }, [])

  const clearLearningResult = useCallback(() => {
    setLearningResult(null)
    setLearningError(null)
  }, [])

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkflows()
      fetchSchedules()
      fetchDecisionAnalyticsAction() // Fetch analytics when authenticated
    }
  }, [isAuthenticated, fetchDecisionAnalyticsAction])

  const value: AutomationContextType = {
    // Workflow State
    workflows,
    loading,
    error,
    isAuthenticated,
    executingWorkflow,
    executionResult,
    
    // Schedule State
    schedules,
    schedulesLoading,
    schedulesError,

    // Schedule Optimization State
    optimizationResult,
    optimizationLoading,
    optimizationError,

    // Auto-Reschedule State
    rescheduleResult,
    rescheduleLoading,
    rescheduleError,

    // Decision State
    decisionResult,
    decisionLoading,
    decisionError,

    // Decision Analytics State
    decisionAnalytics,
    analyticsLoading,
    analyticsError,

    // Decision Learning State
    learningResult,
    learningLoading,
    learningError,

    // Workflow Actions
    fetchWorkflows,
    createNewWorkflow,
    updateExistingWorkflow,
    deleteExistingWorkflow,
    toggleWorkflowActiveStatus,
    executeWorkflow: executeWorkflowAction,
    clearExecutionResult,

    // Schedule Actions
    fetchSchedules,
    createNewSchedule,
    updateExistingSchedule,
    deleteExistingSchedule,
    toggleScheduleActiveStatus,

    // Schedule Optimization Actions
    optimizeSchedules: optimizeSchedulesAction,
    clearOptimizationResult,

    // Auto-Reschedule Actions
    autoRescheduleSchedules: autoRescheduleSchedulesAction,
    clearRescheduleResult,

    // Decision Actions
    makeDecision: makeDecisionAction,
    clearDecisionResult,

    // Decision Analytics Actions
    fetchDecisionAnalytics: fetchDecisionAnalyticsAction,
    clearAnalyticsResult,

    // Decision Learning Actions
    learnFromDecision: learnFromDecisionAction,
    clearLearningResult
  }

  return (
    <AutomationContext.Provider value={value}>
      {children}
    </AutomationContext.Provider>
  )
}

export function useAutomation() {
  const context = useContext(AutomationContext)
  if (context === undefined) {
    throw new Error('useAutomation must be used within an AutomationProvider')
  }
  return context
}
