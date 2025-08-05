'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Clock, Plus, Edit, Timer, Calendar, Users, Target, Settings, Play, Pause, Trash2, Zap, TrendingUp, DollarSign, AlertTriangle, MapPin } from 'lucide-react'
import { useAutomation } from '@/contexts/AutomationContext'
import { ScheduleRequest, ScheduleOptimizationRequest, AutoRescheduleRequest } from '@/lib/automation'

export function AutomationScheduling() {
  const { 
    schedules, 
    schedulesLoading, 
    schedulesError,
    optimizationResult,
    optimizationLoading,
    optimizationError,
    rescheduleResult,
    rescheduleLoading,
    rescheduleError,
    createNewSchedule,
    updateExistingSchedule,
    deleteExistingSchedule,
    toggleScheduleActiveStatus,
    optimizeSchedules,
    clearOptimizationResult,
    autoRescheduleSchedules,
    clearRescheduleResult
  } = useAutomation()

  // Create schedule modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [scheduleName, setScheduleName] = useState('')
  const [scheduleType, setScheduleType] = useState<'maintenance' | 'inspection' | 'cleaning' | 'custom'>('maintenance')
  const [scheduleAssets, setScheduleAssets] = useState('')
  const [schedulePriority, setSchedulePriority] = useState('')
  const [scheduleStatus, setScheduleStatus] = useState('')
  const [maintenanceOperator, setMaintenanceOperator] = useState<'older_than' | 'newer_than'>('older_than')
  const [maintenanceDays, setMaintenanceDays] = useState('')
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly')
  const [dayOfMonth, setDayOfMonth] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [scheduleTimezone, setScheduleTimezone] = useState('UTC')
  const [scheduleDuration, setScheduleDuration] = useState('')
  const [scheduleTechnicians, setScheduleTechnicians] = useState('')

  // Optimization modal state
  const [optimizeModalOpen, setOptimizeModalOpen] = useState(false)
  const [optimizeAssets, setOptimizeAssets] = useState('')
  const [maxWorkHours, setMaxWorkHours] = useState('8')
  const [technicianSkills, setTechnicianSkills] = useState('')
  const [optimizationPriority, setOptimizationPriority] = useState<'efficiency' | 'cost' | 'quality' | 'speed'>('efficiency')
  const [budget, setBudget] = useState('5000')
  const [timeWindowStart, setTimeWindowStart] = useState('')
  const [timeWindowEnd, setTimeWindowEnd] = useState('')

  // Auto-reschedule modal state
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [eventType, setEventType] = useState<'asset_failure' | 'technician_unavailable' | 'weather_delay' | 'emergency'>('asset_failure')
  const [assetId, setAssetId] = useState('')
  const [failureType, setFailureType] = useState<'critical' | 'minor' | 'moderate'>('critical')
  const [estimatedRepairTime, setEstimatedRepairTime] = useState('')
  const [eventPriority, setEventPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('urgent')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [affectedSchedule, setAffectedSchedule] = useState('')

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
    setScheduleName('')
    setScheduleType('maintenance')
    setScheduleAssets('')
    setSchedulePriority('')
    setScheduleStatus('')
    setMaintenanceOperator('older_than')
    setMaintenanceDays('')
    setScheduleFrequency('monthly')
    setDayOfMonth('')
    setDayOfWeek('')
    setScheduleTime('')
    setScheduleTimezone('UTC')
    setScheduleDuration('')
    setScheduleTechnicians('')
  }

  const resetOptimizeForm = () => {
    setOptimizeAssets('')
    setMaxWorkHours('8')
    setTechnicianSkills('')
    setOptimizationPriority('efficiency')
    setBudget('5000')
    setTimeWindowStart('')
    setTimeWindowEnd('')
  }

  const resetRescheduleForm = () => {
    setEventType('asset_failure')
    setAssetId('')
    setFailureType('critical')
    setEstimatedRepairTime('')
    setEventPriority('urgent')
    setLatitude('')
    setLongitude('')
    setAffectedSchedule('')
  }

  const handleCreateSchedule = async () => {
    if (!scheduleName || !scheduleAssets || !scheduleTime || !scheduleDuration) return

    const scheduleRequest: ScheduleRequest = {
      name: scheduleName,
      type: scheduleType,
      assets: scheduleAssets.split(',').map(id => id.trim()).filter(id => id),
      criteria: {
        priority: schedulePriority || undefined,
        status: scheduleStatus || undefined,
        lastMaintenance: maintenanceDays ? {
          operator: maintenanceOperator,
          days: parseInt(maintenanceDays)
        } : undefined
      },
      schedule: {
        frequency: scheduleFrequency,
        dayOfMonth: dayOfMonth ? parseInt(dayOfMonth) : undefined,
        dayOfWeek: dayOfWeek ? parseInt(dayOfWeek) : undefined,
        time: scheduleTime,
        timezone: scheduleTimezone,
        duration: parseInt(scheduleDuration),
        technicians: scheduleTechnicians.split(',').map(id => id.trim()).filter(id => id)
      }
    }

    await createNewSchedule(scheduleRequest)
    resetCreateForm()
    setCreateModalOpen(false)
  }

  const handleOptimizeSchedules = async () => {
    if (!optimizeAssets || !timeWindowStart || !timeWindowEnd) return

    const optimizationRequest: ScheduleOptimizationRequest = {
      constraints: {
        maxWorkHours: parseInt(maxWorkHours),
        technicianSkills: technicianSkills.split(',').map(skill => skill.trim()).filter(skill => skill),
        priority: optimizationPriority,
        budget: parseInt(budget)
      },
      assets: optimizeAssets.split(',').map(id => id.trim()).filter(id => id),
      timeWindow: {
        start: timeWindowStart,
        end: timeWindowEnd
      }
    }

    await optimizeSchedules(optimizationRequest)
    setOptimizeModalOpen(false)
  }

  const handleAutoReschedule = async () => {
    if (!assetId || !estimatedRepairTime || !latitude || !longitude || !affectedSchedule) return

    const rescheduleRequest: AutoRescheduleRequest = {
      eventType,
      eventData: {
        assetId,
        failureType,
        estimatedRepairTime: parseInt(estimatedRepairTime),
        priority: eventPriority,
        location: {
          latitude,
          longitude
        },
        affectedSchedule
      }
    }

    await autoRescheduleSchedules(rescheduleRequest)
    setRescheduleModalOpen(false)
  }

  const handleToggleSchedule = async (scheduleId: string, currentStatus: boolean) => {
    await toggleScheduleActiveStatus(scheduleId, !currentStatus)
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      await deleteExistingSchedule(scheduleId)
    }
  }

  const formatSchedule = (schedule: any) => {
    const { schedule: scheduleConfig } = schedule
    return `${scheduleConfig.frequency} at ${scheduleConfig.time} (${scheduleConfig.timezone})`
  }

  const formatCriteria = (criteria: any) => {
    const parts = []
    if (criteria.priority) parts.push(`Priority: ${criteria.priority}`)
    if (criteria.status) parts.push(`Status: ${criteria.status}`)
    if (criteria.lastMaintenance) {
      parts.push(`Last maintenance: ${criteria.lastMaintenance.operator} ${criteria.lastMaintenance.days} days`)
    }
    return parts.join(', ')
  }

  return (
    <>
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xl font-bold">Smart Scheduling</div>
                <CardDescription className="text-green-100">
                  Configure intelligent scheduling for automated tasks and maintenance
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setRescheduleModalOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Auto-Reschedule
              </Button>
              <Button
                onClick={() => setOptimizeModalOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Zap className="h-4 w-4 mr-2" />
                Optimize
              </Button>
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Schedule
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* Auto-Reschedule Results */}
          {rescheduleResult && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Auto-Reschedule Results
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearRescheduleResult}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  Clear
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 text-sm text-orange-600 mb-2">
                    <Calendar className="h-4 w-4" />
                    <span>Rescheduled Tasks</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900">
                    {rescheduleResult.rescheduleResult.rescheduledTasks}
                  </div>
                  <p className="text-xs text-orange-600 mt-1">Tasks automatically rescheduled</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 text-sm text-orange-600 mb-2">
                    <Target className="h-4 w-4" />
                    <span>Priority Level</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900 capitalize">
                    {rescheduleResult.rescheduleResult.priority}
                  </div>
                  <p className="text-xs text-orange-600 mt-1">New priority assigned</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-orange-100 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800">
                  <strong>Message:</strong> {rescheduleResult.message}
                </p>
              </div>
            </div>
          )}

          {/* Optimization Results */}
          {optimizationResult && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Optimization Results
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearOptimizationResult}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  Clear
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <DollarSign className="h-4 w-4" />
                    <span>Total Cost</span>
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    ${optimizationResult.optimizationMetrics.totalCost.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Clock className="h-4 w-4" />
                    <span>Total Duration</span>
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {optimizationResult.optimizationMetrics.totalDuration}h
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>Efficiency Score</span>
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {optimizationResult.optimizationMetrics.efficiencyScore}%
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Users className="h-4 w-4" />
                    <span>Resource Utilization</span>
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {optimizationResult.optimizationMetrics.resourceUtilization}%
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-blue-900">Optimized Schedules</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {optimizationResult.optimizedSchedules.map((schedule, index) => (
                    <Card key={index} className="border border-blue-200 bg-white">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-sm">{schedule.name}</CardTitle>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {schedule.type}
                              </Badge>
                              <Badge className="text-xs bg-green-100 text-green-800">
                                Score: {schedule.optimizationScore}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Estimated Cost:</span>
                          <span className="font-medium">${schedule.estimatedCost}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium">{schedule.estimatedDuration}h</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Technicians:</span>
                          <span className="font-medium">{schedule.technicianAssignments.length}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Existing Schedules */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Timer className="h-5 w-5 text-green-600" />
                Existing Schedules
              </h3>
              {schedules.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {schedules.length} schedule{schedules.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            {schedulesLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-gray-600 mt-3 font-medium">Loading schedules...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Timer className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No schedules found</p>
                <p className="text-gray-500 text-sm mt-1">Create your first schedule to get started</p>
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Schedule
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {schedules.map((schedule) => (
                  <Card key={schedule.id} className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 group overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg group-hover:text-green-600 transition-colors truncate">
                            {schedule.name}
                          </CardTitle>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {schedule.type}
                            </Badge>
                            {getStatusBadge(schedule.isActive)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                              onClick={() => handleToggleSchedule(schedule.id, schedule.isActive)}
                            >
                              {schedule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteSchedule(schedule.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      {/* Schedule Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                          <Calendar className="h-3 w-3" />
                          <span>Schedule</span>
                        </div>
                        <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                          {formatSchedule(schedule)}
                        </div>
                      </div>

                      {/* Assets */}
                      {schedule.assets.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                            <Target className="h-3 w-3" />
                            <span>Assets ({schedule.assets.length})</span>
                          </div>
                          <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                            {schedule.assets.slice(0, 3).join(', ')}
                            {schedule.assets.length > 3 && ` +${schedule.assets.length - 3} more`}
                          </div>
                        </div>
                      )}

                      {/* Criteria */}
                      {schedule.criteria && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                            <Settings className="h-3 w-3" />
                            <span>Criteria</span>
                          </div>
                          <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                            {formatCriteria(schedule.criteria)}
                          </div>
                        </div>
                      )}

                      {/* Technicians */}
                      {schedule.schedule.technicians.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                            <Users className="h-3 w-3" />
                            <span>Technicians ({schedule.schedule.technicians.length})</span>
                          </div>
                          <div className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                            {schedule.schedule.technicians.slice(0, 2).join(', ')}
                            {schedule.schedule.technicians.length > 2 && ` +${schedule.schedule.technicians.length - 2} more`}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Created: {new Date(schedule.createdAt).toLocaleDateString()}</span>
                          <span>ID: {schedule.id.slice(0, 8)}...</span>
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

      {/* Create Schedule Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Create New Schedule
            </DialogTitle>
            <DialogDescription>
              Configure a smart schedule for automated maintenance and tasks
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduleName" className="text-sm font-medium">Schedule Name</Label>
                <Input 
                  id="scheduleName" 
                  placeholder="Enter schedule name" 
                  value={scheduleName}
                  onChange={(e) => setScheduleName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduleType" className="text-sm font-medium">Type</Label>
                <Select value={scheduleType} onValueChange={(value: any) => setScheduleType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assets */}
            <div className="space-y-2">
              <Label htmlFor="scheduleAssets" className="text-sm font-medium">Asset IDs (comma-separated)</Label>
              <Input 
                id="scheduleAssets" 
                placeholder="asset_id_1, asset_id_2, asset_id_3" 
                value={scheduleAssets}
                onChange={(e) => setScheduleAssets(e.target.value)}
              />
            </div>

            {/* Criteria */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Criteria</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Priority</Label>
                  <Select value={schedulePriority} onValueChange={setSchedulePriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Status</Label>
                  <Select value={scheduleStatus} onValueChange={setScheduleStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Last Maintenance</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={maintenanceOperator} onValueChange={(value: any) => setMaintenanceOperator(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="older_than">Older Than</SelectItem>
                        <SelectItem value="newer_than">Newer Than</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input 
                      placeholder="Days" 
                      value={maintenanceDays}
                      onChange={(e) => setMaintenanceDays(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Configuration */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Schedule Configuration</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Frequency</Label>
                  <Select value={scheduleFrequency} onValueChange={(value: any) => setScheduleFrequency(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {scheduleFrequency === 'monthly' && (
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Day of Month</Label>
                    <Input 
                      placeholder="15" 
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(e.target.value)}
                    />
                  </div>
                )}
                
                {scheduleFrequency === 'weekly' && (
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Day of Week</Label>
                    <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="2">Tuesday</SelectItem>
                        <SelectItem value="3">Wednesday</SelectItem>
                        <SelectItem value="4">Thursday</SelectItem>
                        <SelectItem value="5">Friday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                        <SelectItem value="0">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Time</Label>
                  <Input 
                    type="time" 
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Timezone</Label>
                  <Select value={scheduleTimezone} onValueChange={setScheduleTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">EST</SelectItem>
                      <SelectItem value="PST">PST</SelectItem>
                      <SelectItem value="GMT">GMT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Duration (minutes)</Label>
                  <Input 
                    placeholder="120" 
                    value={scheduleDuration}
                    onChange={(e) => setScheduleDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Technicians (comma-separated)</Label>
                  <Input 
                    placeholder="tech_id_1, tech_id_2" 
                    value={scheduleTechnicians}
                    onChange={(e) => setScheduleTechnicians(e.target.value)}
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
              onClick={handleCreateSchedule}
              disabled={schedulesLoading || !scheduleName || !scheduleAssets || !scheduleTime || !scheduleDuration}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {schedulesLoading ? 'Creating...' : 'Create Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Optimize Schedules Modal */}
      <Dialog open={optimizeModalOpen} onOpenChange={setOptimizeModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Optimize Schedules
            </DialogTitle>
            <DialogDescription>
              Configure optimization parameters for intelligent schedule optimization
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Assets */}
            <div className="space-y-2">
              <Label htmlFor="optimizeAssets" className="text-sm font-medium">Asset IDs (comma-separated)</Label>
              <Input 
                id="optimizeAssets" 
                placeholder="asset_id_1, asset_id_2, asset_id_3" 
                value={optimizeAssets}
                onChange={(e) => setOptimizeAssets(e.target.value)}
              />
            </div>

            {/* Time Window */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Time Window</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Start Date & Time</Label>
                  <Input 
                    type="datetime-local" 
                    value={timeWindowStart}
                    onChange={(e) => setTimeWindowStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">End Date & Time</Label>
                  <Input 
                    type="datetime-local" 
                    value={timeWindowEnd}
                    onChange={(e) => setTimeWindowEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Constraints */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Optimization Constraints</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Max Work Hours</Label>
                  <Input 
                    type="number" 
                    placeholder="8" 
                    value={maxWorkHours}
                    onChange={(e) => setMaxWorkHours(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Budget ($)</Label>
                  <Input 
                    type="number" 
                    placeholder="5000" 
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Technician Skills (comma-separated)</Label>
                  <Input 
                    placeholder="electrical, mechanical, plumbing" 
                    value={technicianSkills}
                    onChange={(e) => setTechnicianSkills(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Optimization Priority</Label>
                  <Select value={optimizationPriority} onValueChange={(value: any) => setOptimizationPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efficiency">Efficiency</SelectItem>
                      <SelectItem value="cost">Cost</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                      <SelectItem value="speed">Speed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOptimizeModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleOptimizeSchedules}
              disabled={optimizationLoading || !optimizeAssets || !timeWindowStart || !timeWindowEnd}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              {optimizationLoading ? 'Optimizing...' : 'Optimize Schedules'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auto-Reschedule Modal */}
      <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Auto-Reschedule Event
            </DialogTitle>
            <DialogDescription>
              Configure event parameters for automatic schedule rescheduling
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Event Type */}
            <div className="space-y-2">
              <Label htmlFor="eventType" className="text-sm font-medium">Event Type</Label>
              <Select value={eventType} onValueChange={(value: any) => setEventType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset_failure">Asset Failure</SelectItem>
                  <SelectItem value="technician_unavailable">Technician Unavailable</SelectItem>
                  <SelectItem value="weather_delay">Weather Delay</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Asset Information */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Asset Information</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Asset ID</Label>
                  <Input 
                    placeholder="asset_id_here" 
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Failure Type</Label>
                  <Select value={failureType} onValueChange={(value: any) => setFailureType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="minor">Minor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Estimated Repair Time (minutes)</Label>
                  <Input 
                    type="number" 
                    placeholder="240" 
                    value={estimatedRepairTime}
                    onChange={(e) => setEstimatedRepairTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Priority</Label>
                  <Select value={eventPriority} onValueChange={(value: any) => setEventPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Location</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Latitude</Label>
                  <Input 
                    placeholder="40.7128" 
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Longitude</Label>
                  <Input 
                    placeholder="-74.0060" 
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Affected Schedule */}
            <div className="space-y-2">
              <Label htmlFor="affectedSchedule" className="text-sm font-medium">Affected Schedule ID</Label>
              <Input 
                id="affectedSchedule" 
                placeholder="schedule_id_here" 
                value={affectedSchedule}
                onChange={(e) => setAffectedSchedule(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAutoReschedule}
              disabled={rescheduleLoading || !assetId || !estimatedRepairTime || !latitude || !longitude || !affectedSchedule}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {rescheduleLoading ? 'Rescheduling...' : 'Auto-Reschedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 