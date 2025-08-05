'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, Plus, Edit, Play } from 'lucide-react'

interface Task {
  id: number
  name: string
  schedule: string
  time: string
  status: string
  priority: string
}

interface AutomationTasksProps {
  tasks?: Task[]
  onTaskCreate?: (task: Omit<Task, 'id'>) => void
  onTaskEdit?: (task: Task) => void
  onTaskRun?: (task: Task) => void
}

export function AutomationTasks({ 
  tasks = [], 
  onTaskCreate, 
  onTaskEdit,
  onTaskRun
}: AutomationTasksProps) {
  const [taskName, setTaskName] = useState('')
  const [taskSchedule, setTaskSchedule] = useState('')
  const [taskTime, setTaskTime] = useState('')
  const [taskPriority, setTaskPriority] = useState('')
  const [taskDescription, setTaskDescription] = useState('')

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      critical: 'destructive',
      warning: 'default',
      scheduled: 'outline',
      paused: 'secondary'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const

    return (
      <Badge variant={variants[priority as keyof typeof variants] || 'secondary'}>
        {priority.toUpperCase()}
      </Badge>
    )
  }

  const handleCreateTask = () => {
    if (!taskName || !taskSchedule || !taskTime || !taskPriority) return

    const newTask = {
      name: taskName,
      schedule: taskSchedule,
      time: taskTime,
      status: 'scheduled',
      priority: taskPriority
    }

    onTaskCreate?.(newTask)
    
    // Reset form
    setTaskName('')
    setTaskSchedule('')
    setTaskTime('')
    setTaskPriority('')
    setTaskDescription('')
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xl font-bold">Schedule Tasks</div>
            <CardDescription className="text-blue-100">
              Create and manage scheduled tasks for automated operations
            </CardDescription>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Create New Task */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Create New Task
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="taskName" className="text-sm font-medium text-gray-700">Task Name</Label>
              <Input 
                id="taskName" 
                placeholder="Enter task name" 
                className="h-10"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskSchedule" className="text-sm font-medium text-gray-700">Schedule</Label>
              <Select value={taskSchedule} onValueChange={setTaskSchedule}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskTime" className="text-sm font-medium text-gray-700">Time</Label>
              <Input 
                id="taskTime" 
                type="time" 
                className="h-10"
                value={taskTime}
                onChange={(e) => setTaskTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskPriority" className="text-sm font-medium text-gray-700">Priority</Label>
              <Select value={taskPriority} onValueChange={setTaskPriority}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taskDescription" className="text-sm font-medium text-gray-700">Task Description</Label>
            <Textarea 
              id="taskDescription" 
              placeholder="Describe the task and its requirements"
              rows={3}
              className="resize-none"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
            />
          </div>

          <Button 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={handleCreateTask}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>

        {/* Existing Tasks */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Scheduled Tasks
          </h3>
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {task.name}
                      </CardTitle>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {task.schedule}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {task.time}
                        </span>
                        {getPriorityBadge(task.priority)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(task.status)}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onTaskEdit?.(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onTaskRun?.(task)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 