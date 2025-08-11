'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Bell, Plus, Edit, AlertCircle } from 'lucide-react'

interface Alert {
  id: number
  name: string
  type: string
  condition: string
  channels: string[]
  status: string
}

interface AutomationAlertsProps {
  alerts?: Alert[]
  onAlertCreate?: (alert: Omit<Alert, 'id'>) => void
  onAlertEdit?: (alert: Alert) => void
}

export function AutomationAlerts({ 
  alerts = [], 
  onAlertCreate, 
  onAlertEdit 
}: AutomationAlertsProps) {
  const [alertName, setAlertName] = useState('')
  const [alertType, setAlertType] = useState('')
  const [alertStatus, setAlertStatus] = useState('')
  const [alertCondition, setAlertCondition] = useState('')
  const [channels, setChannels] = useState({
    email: false,
    sms: false,
    dashboard: false,
    webhook: false
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      critical: 'destructive',
      warning: 'default',
      scheduled: 'outline'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const handleCreateAlert = () => {
    if (!alertName || !alertType || !alertStatus || !alertCondition) return

    const newAlert = {
      name: alertName,
      type: alertType,
      status: alertStatus,
      condition: alertCondition,
      channels: Object.entries(channels)
        .filter(([ enabled]) => enabled)
        .map(([key]) => key)
    }

    onAlertCreate?.(newAlert)
    
    // Reset form
    setAlertName('')
    setAlertType('')
    setAlertStatus('')
    setAlertCondition('')
    setChannels({ email: false, sms: false, dashboard: false, webhook: false })
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xl font-bold">Automated Alerts</div>
            <CardDescription className="text-orange-100">
              Configure automated alerting for critical events and conditions
            </CardDescription>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Create New Alert */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Create New Alert
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="alertName" className="text-sm font-medium text-gray-700">Alert Name</Label>
              <Input 
                id="alertName" 
                placeholder="Enter alert name" 
                className="h-10"
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alertType" className="text-sm font-medium text-gray-700">Alert Type</Label>
              <Select value={alertType} onValueChange={setAlertType}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="alertStatus" className="text-sm font-medium text-gray-700">Status</Label>
              <Select value={alertStatus} onValueChange={setAlertStatus}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alertCondition" className="text-sm font-medium text-gray-700">Condition</Label>
            <Input 
              id="alertCondition" 
              placeholder="e.g., asset_status = 'critical'" 
              className="h-10"
              value={alertCondition}
              onChange={(e) => setAlertCondition(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-700">Notification Channels</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Switch 
                  id="emailAlert" 
                  checked={channels.email}
                  onChange={(e) => setChannels(prev => ({ ...prev, email: e.target.checked }))}
                />
                <Label htmlFor="emailAlert" className="text-sm">Email</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Switch 
                  id="smsAlert" 
                  checked={channels.sms}
                  onChange={(e) => setChannels(prev => ({ ...prev, sms: e.target.checked }))}
                />
                <Label htmlFor="smsAlert" className="text-sm">SMS</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Switch 
                  id="dashboardAlert" 
                  checked={channels.dashboard}
                  onChange={(e) => setChannels(prev => ({ ...prev, dashboard: e.target.checked }))}
                />
                <Label htmlFor="dashboardAlert" className="text-sm">Dashboard</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Switch 
                  id="webhookAlert" 
                  checked={channels.webhook}
                  onChange={(e) => setChannels(prev => ({ ...prev, webhook: e.target.checked }))}
                />
                <Label htmlFor="webhookAlert" className="text-sm">Webhook</Label>
              </div>
            </div>
          </div>

          <Button 
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={handleCreateAlert}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </div>

        {/* Existing Alerts */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Existing Alerts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {alerts.map((alert) => (
              <Card key={alert.id} className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-orange-600 transition-colors">
                        {alert.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        {getStatusBadge(alert.type)}
                        {getStatusBadge(alert.status)}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onAlertEdit?.(alert)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div><strong>Condition:</strong> {alert.condition}</div>
                    <div><strong>Channels:</strong> {alert.channels.join(', ')}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 