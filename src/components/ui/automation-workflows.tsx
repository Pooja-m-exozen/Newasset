'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Bot, Plus, Edit, Workflow, Trash2, Play, Pause, Clock, Bell, Settings, Zap, CheckCircle, AlertCircle } from 'lucide-react'
import { useAutomation } from '@/contexts/AutomationContext'
import { WorkflowRequest, WorkflowTrigger, WorkflowAction, WorkflowCondition, WorkflowExecutionRequest } from '@/lib/automation'

interface Workflow {
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

export function AutomationWorkflows() {
  const { 
    workflows, 
    loading, 
    error, 
    isAuthenticated,
    executingWorkflow,
    executionResult,
    createNewWorkflow, 
    updateExistingWorkflow, 
    deleteExistingWorkflow,
    toggleWorkflowActiveStatus,
    executeWorkflow,
    clearExecutionResult
  } = useAutomation()

  // Create workflow modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [selectedTriggerType, setSelectedTriggerType] = useState<'schedule' | 'condition' | 'event'>('schedule')
  const [triggerCron, setTriggerCron] = useState('')
  const [triggerField, setTriggerField] = useState('')
  const [triggerOperator, setTriggerOperator] = useState('')
  const [triggerValue, setTriggerValue] = useState('')
  const [triggerDescription, setTriggerDescription] = useState('')
  const [selectedActionType, setSelectedActionType] = useState<'notification' | 'update' | 'email' | 'sms'>('notification')
  const [actionTarget, setActionTarget] = useState('')
  const [actionTemplate, setActionTemplate] = useState('')
  const [actionField, setActionField] = useState('')
  const [actionValue, setActionValue] = useState('')
  const [conditionField, setConditionField] = useState('')
  const [conditionOperator, setConditionOperator] = useState('')
  const [conditionValue, setConditionValue] = useState('')

  // Execute workflow modal state
  const [executeModalOpen, setExecuteModalOpen] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null)
  const [executionContext, setExecutionContext] = useState({
    assetId: '',
    userId: '',
    maintenanceType: 'preventive',
    priority: 'medium'
  })

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge 
        variant={isActive ? 'default' : 'secondary'} 
        className={`text-xs font-medium px-2 py-1 ${isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
      >
        {isActive ? 'ACTIVE' : 'INACTIVE'}
      </Badge>
    )
  }

  const resetCreateForm = () => {
    setWorkflowName('')
    setWorkflowDescription('')
    setSelectedTriggerType('schedule')
    setTriggerCron('')
    setTriggerField('')
    setTriggerOperator('')
    setTriggerValue('')
    setTriggerDescription('')
    setSelectedActionType('notification')
    setActionTarget('')
    setActionTemplate('')
    setActionField('')
    setActionValue('')
    setConditionField('')
    setConditionOperator('')
    setConditionValue('')
  }

  const handleCreateWorkflow = async () => {
    if (!workflowName || !workflowDescription) return

    // Build triggers array
    const triggers: WorkflowTrigger[] = []
    
    if (selectedTriggerType === 'schedule' && triggerCron) {
      triggers.push({
        type: 'schedule',
        cron: triggerCron,
        description: triggerDescription
      })
    } else if (selectedTriggerType === 'condition' && triggerField && triggerOperator && triggerValue) {
      triggers.push({
        type: 'condition',
        field: triggerField,
        operator: triggerOperator,
        value: triggerValue,
        description: triggerDescription
      })
    }

    // Build actions array
    const actions: WorkflowAction[] = []
    
    if (selectedActionType === 'notification' && actionTarget && actionTemplate) {
      actions.push({
        type: 'notification',
        target: actionTarget,
        template: actionTemplate
      })
    } else if (selectedActionType === 'update' && actionField && actionValue) {
      actions.push({
        type: 'update',
        field: actionField,
        value: actionValue
      })
    }

    // Build conditions array
    const conditions: WorkflowCondition[] = []
    
    if (conditionField && conditionOperator && conditionValue) {
      conditions.push({
        field: conditionField,
        operator: conditionOperator as any,
        value: conditionValue
      })
    }

    const workflowRequest: WorkflowRequest = {
      name: workflowName,
      description: workflowDescription,
      triggers,
      actions,
      conditions
    }

    await createNewWorkflow(workflowRequest)
    resetCreateForm()
    setCreateModalOpen(false)
  }

  const handleToggleWorkflow = async (workflowId: string, currentStatus: boolean) => {
    await toggleWorkflowActiveStatus(workflowId, !currentStatus)
  }

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      await deleteExistingWorkflow(workflowId)
    }
  }

  const handleExecuteWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setExecutionContext({
      assetId: '',
      userId: '',
      maintenanceType: 'preventive',
      priority: 'medium'
    })
    setExecuteModalOpen(true)
  }

  const handleExecuteWorkflowSubmit = async () => {
    if (!selectedWorkflow) return

    const request: WorkflowExecutionRequest = {
      workflowId: selectedWorkflow.id,
      context: {
        assetId: executionContext.assetId || undefined,
        userId: executionContext.userId || undefined,
        timestamp: new Date().toISOString(),
        parameters: {
          maintenanceType: executionContext.maintenanceType,
          priority: executionContext.priority
        }
      }
    }

    await executeWorkflow(request)
  }

  const formatTrigger = (trigger: WorkflowTrigger) => {
    if (trigger.type === 'schedule') {
      return `Schedule: ${trigger.cron}`
    } else if (trigger.type === 'condition') {
      return `Condition: ${trigger.field} ${trigger.operator} ${trigger.value}`
    }
    return trigger.description || 'Unknown trigger'
  }

  const formatAction = (action: WorkflowAction) => {
    if (action.type === 'notification') {
      return `Notify: ${action.target} (${action.template})`
    } else if (action.type === 'update') {
      return `Update: ${action.field} = ${action.value}`
    }
    return `${action.type}: ${action.target || action.field}`
  }

  const getTriggerIcon = (trigger: WorkflowTrigger) => {
    if (trigger.type === 'schedule') return <Clock className="h-3 w-3" />
    if (trigger.type === 'condition') return <Settings className="h-3 w-3" />
    return <Bot className="h-3 w-3" />
  }

  const getActionIcon = (action: WorkflowAction) => {
    if (action.type === 'notification') return <Bell className="h-3 w-3" />
    if (action.type === 'update') return <Settings className="h-3 w-3" />
    return <Bot className="h-3 w-3" />
  }

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-bold">Workflow Automation</div>
                <CardDescription className="text-blue-100">
                  Create and manage automated workflows for asset management processes
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* Existing Workflows */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Workflow className="h-5 w-5 text-blue-600" />
                Existing Workflows
              </h3>
              {workflows.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {workflows.length} workflow{workflows.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-3 font-medium">Loading workflows...</p>
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Workflow className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No workflows found</p>
                <p className="text-gray-500 text-sm mt-1">Create your first workflow to get started</p>
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Workflow
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {workflows.map((workflow) => (
                  <Card key={workflow.id} className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 group overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg group-hover:text-blue-600 transition-colors truncate">
                            {workflow.name}
                          </CardTitle>
                          <CardDescription className="text-sm mt-2 line-clamp-2">
                            {workflow.description}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {getStatusBadge(workflow.isActive)}
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                              onClick={() => handleToggleWorkflow(workflow.id, workflow.isActive)}
                            >
                              {workflow.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteWorkflow(workflow.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      {/* Triggers */}
                      {workflow.triggers.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                            <Clock className="h-3 w-3" />
                            <span>Triggers</span>
                          </div>
                          <div className="space-y-1">
                            {workflow.triggers.map((trigger, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                                {getTriggerIcon(trigger)}
                                <span className="truncate">{formatTrigger(trigger)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {workflow.actions.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                            <Bell className="h-3 w-3" />
                            <span>Actions</span>
                          </div>
                          <div className="space-y-1">
                            {workflow.actions.map((action, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                                {getActionIcon(action)}
                                <span className="truncate">{formatAction(action)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Conditions */}
                      {workflow.conditions && workflow.conditions.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                            <Settings className="h-3 w-3" />
                            <span>Conditions</span>
                          </div>
                          <div className="space-y-1">
                            {workflow.conditions.map((condition, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                                <Settings className="h-3 w-3" />
                                <span className="truncate">{condition.field} {condition.operator} {condition.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Created: {new Date(workflow.createdAt).toLocaleDateString()}</span>
                            <span className="ml-4">ID: {workflow.id.slice(0, 8)}...</span>
                          </div>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs px-3 py-1 h-7"
                            onClick={() => handleExecuteWorkflow(workflow)}
                            disabled={executingWorkflow === workflow.id}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            {executingWorkflow === workflow.id ? 'Executing...' : 'Execute'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Workflow Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              Create New Workflow
            </DialogTitle>
            <DialogDescription>
              Configure your workflow with triggers, actions, and conditions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workflowName" className="text-sm font-medium">Workflow Name</Label>
                <Input 
                  id="workflowName" 
                  placeholder="Enter workflow name" 
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workflowDescription" className="text-sm font-medium">Description</Label>
                <Input 
                  id="workflowDescription" 
                  placeholder="Enter workflow description" 
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Triggers Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Triggers</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Trigger Type</Label>
                  <Select value={selectedTriggerType} onValueChange={(value: any) => setSelectedTriggerType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="schedule">Schedule</SelectItem>
                      <SelectItem value="condition">Condition</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedTriggerType === 'schedule' && (
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Cron Expression</Label>
                    <Input 
                      placeholder="0 9 * * 1" 
                      value={triggerCron}
                      onChange={(e) => setTriggerCron(e.target.value)}
                    />
                  </div>
                )}
                
                {selectedTriggerType === 'condition' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Field</Label>
                      <Input 
                        placeholder="status" 
                        value={triggerField}
                        onChange={(e) => setTriggerField(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Operator</Label>
                      <Select value={triggerOperator} onValueChange={setTriggerOperator}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="in">In</SelectItem>
                          <SelectItem value="greater_than">Greater Than</SelectItem>
                          <SelectItem value="less_than">Less Than</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Value</Label>
                      <Input 
                        placeholder="under_maintenance" 
                        value={triggerValue}
                        onChange={(e) => setTriggerValue(e.target.value)}
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Description</Label>
                  <Input 
                    placeholder="Weekly maintenance check" 
                    value={triggerDescription}
                    onChange={(e) => setTriggerDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Actions</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Action Type</Label>
                  <Select value={selectedActionType} onValueChange={(value: any) => setSelectedActionType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedActionType === 'notification' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Target</Label>
                      <Input 
                        placeholder="assignedTo" 
                        value={actionTarget}
                        onChange={(e) => setActionTarget(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Template</Label>
                      <Input 
                        placeholder="maintenance_reminder" 
                        value={actionTemplate}
                        onChange={(e) => setActionTemplate(e.target.value)}
                      />
                    </div>
                  </>
                )}
                
                {selectedActionType === 'update' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Field</Label>
                      <Input 
                        placeholder="lastMaintenance" 
                        value={actionField}
                        onChange={(e) => setActionField(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Value</Label>
                      <Input 
                        placeholder="{{currentDate}}" 
                        value={actionValue}
                        onChange={(e) => setActionValue(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Conditions Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Conditions (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Field</Label>
                  <Input 
                    placeholder="priority" 
                    value={conditionField}
                    onChange={(e) => setConditionField(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Operator</Label>
                  <Select value={conditionOperator} onValueChange={setConditionOperator}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="in">In</SelectItem>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Value</Label>
                  <Input 
                    placeholder="high,critical" 
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWorkflow}
              disabled={loading || !isAuthenticated || !workflowName || !workflowDescription}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Workflow'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execute Workflow Modal */}
      <Dialog open={executeModalOpen} onOpenChange={setExecuteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              Execute Workflow
            </DialogTitle>
            <DialogDescription>
              Configure the execution context for "{selectedWorkflow?.name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assetId" className="text-sm font-medium">Asset ID</Label>
                <Input
                  id="assetId"
                  placeholder="Enter asset ID"
                  value={executionContext.assetId}
                  onChange={(e) => setExecutionContext(prev => ({ ...prev, assetId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userId" className="text-sm font-medium">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Enter user ID"
                  value={executionContext.userId}
                  onChange={(e) => setExecutionContext(prev => ({ ...prev, userId: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maintenanceType" className="text-sm font-medium">Maintenance Type</Label>
                <Select 
                  value={executionContext.maintenanceType} 
                  onValueChange={(value) => setExecutionContext(prev => ({ ...prev, maintenanceType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
                <Select 
                  value={executionContext.priority} 
                  onValueChange={(value) => setExecutionContext(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Execution Result */}
          {executionResult && (
            <div className={`p-3 rounded-lg border ${
              executionResult.executionResult.status === 'completed' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {executionResult.executionResult.status === 'completed' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  executionResult.executionResult.status === 'completed' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {executionResult.message}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Status: {executionResult.executionResult.status} | Steps: {executionResult.executionResult.steps}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setExecuteModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExecuteWorkflowSubmit}
              disabled={executingWorkflow === selectedWorkflow?.id}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              {executingWorkflow === selectedWorkflow?.id ? 'Executing...' : 'Execute Workflow'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 