'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Brain, 
  Plus, 
  Edit, 
  Target, 
  BarChart3, 
  Zap, 
  Settings, 
  Play, 
  Pause, 
  Trash2, 
  AlertTriangle, 
  TrendingUp, 
  Lightbulb, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Star, 
  BookOpen, 
  GraduationCap,
  RefreshCw,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Clock,
  DollarSign,
  Shield,
  Wifi,
  Battery,
  Thermometer,
  Gauge
} from 'lucide-react'
import { useAutomation } from '@/contexts/AutomationContext'
import { DecisionRequest, DecisionLearningRequest } from '@/lib/automation'

// Define types for Decision Rule and Analytics Data
interface DecisionRule {
  id: string
  name: string
  description: string
  type: string
  conditions: any[]
  actions: any[]
  isActive: boolean
  accuracy: number
  lastExecuted: string
  executionCount: number
}

interface RecentDecision {
  id: string
  rule: string
  outcome: string
  timestamp: string
  confidence: number
}

export function AutomationDecisions() {
  const { 
    isAuthenticated,
    decisionResult,
    decisionLoading,
    decisionError,
    makeDecision,
    clearDecisionResult,
    decisionAnalytics,
    analyticsLoading,
    analyticsError,
    fetchDecisionAnalytics,
    learningResult,
    learningLoading,
    learningError,
    learnFromDecision,
    clearLearningResult
  } = useAutomation()

  // Decision rules state - empty array for real API data
  const [decisionRules, setDecisionRules] = useState<DecisionRule[]>([])

  // Recent decisions state
  const [recentDecisions, setRecentDecisions] = useState<RecentDecision[]>([])

  // Modal states
  const [createRuleModalOpen, setCreateRuleModalOpen] = useState(false)
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false)
  const [decisionModalOpen, setDecisionModalOpen] = useState(false)
  const [learningModalOpen, setLearningModalOpen] = useState(false)
  const [ruleName, setRuleName] = useState('')
  const [ruleDescription, setRuleDescription] = useState('')
  const [ruleType, setRuleType] = useState<'asset_failure' | 'resource_allocation' | 'predictive_maintenance' | 'custom'>('asset_failure')
  const [ruleConditions, setRuleConditions] = useState('')
  const [ruleActions, setRuleActions] = useState('')

  // Decision modal states
  const [decisionType, setDecisionType] = useState<'maintenance_priority' | 'resource_allocation' | 'predictive_maintenance' | 'custom'>('maintenance_priority')
  const [assetId, setAssetId] = useState('')
  const [currentStatus, setCurrentStatus] = useState('')
  const [lastMaintenance, setLastMaintenance] = useState('')
  const [efficiency, setEfficiency] = useState('')
  const [uptime, setUptime] = useState('')
  const [temperature, setTemperature] = useState('')
  const [budget, setBudget] = useState('')
  const [availableTechnicians, setAvailableTechnicians] = useState('')
  const [priorityFactors, setPriorityFactors] = useState('')
  const [criticalEfficiency, setCriticalEfficiency] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [minUptime, setMinUptime] = useState('')

  // Learning modal states
  const [learningDecisionId, setLearningDecisionId] = useState('')
  const [learningOutcome, setLearningOutcome] = useState<'success' | 'partial' | 'failed'>('success')
  const [learningAccuracy, setLearningAccuracy] = useState('')
  const [learningEfficiency, setLearningEfficiency] = useState('')
  const [learningCostSavings, setLearningCostSavings] = useState('')
  const [learningUserSatisfaction, setLearningUserSatisfaction] = useState('')
  const [learningNotes, setLearningNotes] = useState('')

  // Fetch analytics on component mount with debounce
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        fetchDecisionAnalytics()
      }, 100) // Small delay to prevent rapid calls
      
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated])

  // Show loading state during initial load
  if (analyticsLoading && !decisionAnalytics) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 overflow-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading decision analytics...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getAccuracyBadge = (accuracy: number) => {
    let color = 'bg-red-100 text-red-800 border-red-200'
    if (accuracy >= 90) color = 'bg-green-100 text-green-800 border-green-200'
    else if (accuracy >= 80) color = 'bg-yellow-100 text-yellow-800 border-yellow-200'
    
    return (
      <Badge variant="outline" className={`text-xs font-medium px-2 py-1 ${color}`}>
        {(accuracy * 100).toFixed(1)}% Accuracy
      </Badge>
    )
  }

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

  const getOutcomeBadge = (outcome: string) => {
    const colors = {
      success: 'bg-green-100 text-green-800 border-green-200',
      partial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200'
    }
    
    return (
      <Badge variant="outline" className={`text-xs font-medium px-2 py-1 ${colors[outcome as keyof typeof colors]}`}>
        {outcome.toUpperCase()}
      </Badge>
    )
  }

  const handleCreateRule = () => {
    if (!ruleName || !ruleDescription) return

    const newRule: DecisionRule = {
      id: `rule-${Date.now()}`,
      name: ruleName,
      description: ruleDescription,
      type: ruleType,
      conditions: ruleConditions ? JSON.parse(ruleConditions) : [],
      actions: ruleActions ? JSON.parse(ruleActions) : [],
      isActive: true,
      accuracy: 0,
      lastExecuted: '',
      executionCount: 0
    }

    setDecisionRules(prev => [...prev, newRule])
    setRuleName('')
    setRuleDescription('')
    setRuleType('asset_failure')
    setRuleConditions('')
    setRuleActions('')
    setCreateRuleModalOpen(false)
  }

  const handleMakeDecision = async () => {
    if (!assetId || !currentStatus || !lastMaintenance || !efficiency || !uptime || !temperature || !budget || !availableTechnicians) return

    const decisionRequest: DecisionRequest = {
      decisionType,
      context: {
        assetId,
        currentStatus,
        lastMaintenance,
        performanceMetrics: {
          efficiency: parseInt(efficiency),
          uptime: parseInt(uptime),
          temperature: parseInt(temperature)
        },
        budget: parseInt(budget),
        availableTechnicians: parseInt(availableTechnicians)
      },
      criteria: {
        priorityFactors: priorityFactors.split(',').map(factor => factor.trim()).filter(factor => factor),
        thresholds: {
          criticalEfficiency: parseInt(criticalEfficiency),
          maxBudget: parseInt(maxBudget),
          minUptime: parseInt(minUptime)
        }
      }
    }

    await makeDecision(decisionRequest)
    setDecisionModalOpen(false)
  }

  const handleLearnFromDecision = async () => {
    if (!learningDecisionId || !learningAccuracy || !learningEfficiency || !learningCostSavings || !learningUserSatisfaction) return

    const learningRequest: DecisionLearningRequest = {
      decisionId: learningDecisionId,
      outcome: learningOutcome,
      feedback: {
        accuracy: parseFloat(learningAccuracy),
        efficiency: parseFloat(learningEfficiency),
        costSavings: parseInt(learningCostSavings),
        userSatisfaction: parseFloat(learningUserSatisfaction),
        notes: learningNotes
      }
    }

    await learnFromDecision(learningRequest)
    setLearningModalOpen(false)
  }

  const handleToggleRule = (ruleId: string) => {
    setDecisionRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    )
  }

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this decision rule?')) {
      setDecisionRules(prev => prev.filter(rule => rule.id !== ruleId))
    }
  }

  const formatConditions = (conditions: any[]) => {
    return conditions.map(condition => 
      `${condition.field} ${condition.operator} ${condition.value}`
    ).join(', ')
  }

  const formatActions = (actions: any[]) => {
    return actions.map(action => 
      `${action.type}: ${action.action || action.message}`
    ).join(', ')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Intelligent Decision Making</h1>
              <p className="text-gray-600">AI-powered decision rules and intelligent automation for your facilities</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchDecisionAnalytics()}
                disabled={analyticsLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${analyticsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button
                onClick={() => setDecisionModalOpen(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Brain className="h-4 w-4 mr-2" />
                Make Decision
              </Button>
              <Button
                onClick={() => setCreateRuleModalOpen(true)}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </div>
          </div>
        </header>

                {/* Main Content */}
        <main className="p-6 space-y-6">
          {/* Decision Results */}
          {decisionResult && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-3">
                  <Brain className="h-6 w-6" />
                  AI Decision Result
                </h2>
                <Button
                  variant="outline"
                  onClick={clearDecisionResult}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  Clear
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-3 text-blue-600 mb-3">
                    <Target className="h-5 w-5" />
                    <span className="font-medium">Decision</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-900 capitalize mb-2">
                    {decisionResult.decision.decision.replace('_', ' ')}
                  </div>
                  <p className="text-sm text-blue-600">AI recommendation</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-3 text-blue-600 mb-3">
                    <BarChart3 className="h-5 w-5" />
                    <span className="font-medium">Confidence</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-900 mb-2">
                    {(decisionResult.confidence * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-blue-600">AI confidence level</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-3 text-blue-600 mb-3">
                    <Lightbulb className="h-5 w-5" />
                    <span className="font-medium">Reasoning</span>
                  </div>
                  <div className="text-sm text-blue-900 leading-relaxed">
                    {decisionResult.reasoning}
                  </div>
                </div>
              </div>
            </div>
          )}

                {/* Learning Results */}
          {learningResult && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-green-900 flex items-center gap-3">
                  <GraduationCap className="h-6 w-6" />
                  Learning Result
                </h2>
                <Button
                  variant="outline"
                  onClick={clearLearningResult}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  Clear
                </Button>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-green-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Star className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-900">
                      {(learningResult.learningResult.accuracy * 100).toFixed(1)}% Accuracy
                    </div>
                    <p className="text-green-600">Updated model accuracy after learning</p>
                  </div>
                </div>
              </div>
            </div>
          )}

                {/* Analytics Overview */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Performance Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-blue-900">
                        {decisionAnalytics ? (decisionAnalytics.accuracy * 100).toFixed(1) : '0'}%
                      </div>
                      <div className="text-sm text-blue-600">Decision Accuracy</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Activity className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-900">
                        {decisionAnalytics?.totalDecisions || 0}
                      </div>
                      <div className="text-sm text-green-600">Total Decisions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Zap className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-purple-900">
                        {decisionAnalytics ? (decisionAnalytics.averageConfidence * 100).toFixed(1) : '0'}%
                      </div>
                      <div className="text-sm text-purple-600">Avg Confidence</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-orange-900">
                        {decisionRules.length}
                      </div>
                      <div className="text-sm text-orange-600">Active Rules</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

                {/* Decision Rules */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Brain className="h-6 w-6 text-blue-600" />
                Decision Rules
              </h2>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setLearningModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Learn
                </Button>
                <Button
                  onClick={() => setAnalyticsModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {decisionRules.length} rules
                </Badge>
              </div>
            </div>
            
            {decisionRules.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Decision Rules</h3>
                  <p className="text-gray-500 mb-6">Create your first decision rule to get started with AI-powered automation.</p>
                  <Button
                    onClick={() => setCreateRuleModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Rule
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {decisionRules.map((rule) => (
                  <Card key={rule.id} className="group hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate mb-2">
                            {rule.name}
                          </h3>
                          <div className="flex items-center space-x-2 mb-3">
                            <Badge variant="outline" className="text-xs">
                              {rule.type.replace('_', ' ')}
                            </Badge>
                            {getStatusBadge(rule.isActive)}
                            {getAccuracyBadge(rule.accuracy)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                            onClick={() => handleToggleRule(rule.id)}
                          >
                            {rule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{rule.description}</p>
                      
                      <div className="space-y-3 mb-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <Target className="h-3 w-3" />
                            <span>Conditions</span>
                          </div>
                          <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                            {formatConditions(rule.conditions)}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                            <Zap className="h-3 w-3" />
                            <span>Actions</span>
                          </div>
                          <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                            {formatActions(rule.actions)}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Executions: {rule.executionCount}</span>
                          <span>Last: {rule.lastExecuted ? new Date(rule.lastExecuted).toLocaleDateString() : 'Never'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

                {/* Recent Decisions */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Activity className="h-6 w-6 text-blue-600" />
              Recent Decisions
            </h2>
            
            {recentDecisions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No recent decisions. Make your first decision to see results here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {recentDecisions.map((decision) => (
                  <Card key={decision.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-blue-100 rounded-xl">
                            <Brain className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{decision.rule}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(decision.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {getOutcomeBadge(decision.outcome)}
                          <div className="text-sm text-gray-600">
                            {decision.confidence}% confidence
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

      {/* Make Decision Modal */}
      <Dialog open={decisionModalOpen} onOpenChange={setDecisionModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Make AI Decision
            </DialogTitle>
            <DialogDescription>
              Provide context and criteria for AI-powered decision making
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="decisionType" className="text-sm font-medium">Decision Type</Label>
                <Select value={decisionType} onValueChange={(value: any) => setDecisionType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance_priority">Maintenance Priority</SelectItem>
                    <SelectItem value="resource_allocation">Resource Allocation</SelectItem>
                    <SelectItem value="predictive_maintenance">Predictive Maintenance</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assetId" className="text-sm font-medium">Asset ID</Label>
                <Input 
                  id="assetId" 
                  placeholder="asset_id_here" 
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentStatus" className="text-sm font-medium">Current Status</Label>
                <Input 
                  id="currentStatus" 
                  placeholder="active" 
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastMaintenance" className="text-sm font-medium">Last Maintenance</Label>
                <Input 
                  id="lastMaintenance" 
                  type="datetime-local" 
                  value={lastMaintenance}
                  onChange={(e) => setLastMaintenance(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium">Performance Metrics</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Efficiency (%)</Label>
                  <Input 
                    type="number" 
                    placeholder="85" 
                    value={efficiency}
                    onChange={(e) => setEfficiency(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Uptime (%)</Label>
                  <Input 
                    type="number" 
                    placeholder="92" 
                    value={uptime}
                    onChange={(e) => setUptime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Temperature (°C)</Label>
                  <Input 
                    type="number" 
                    placeholder="75" 
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-sm font-medium">Budget ($)</Label>
                <Input 
                  id="budget" 
                  type="number" 
                  placeholder="10000" 
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableTechnicians" className="text-sm font-medium">Available Technicians</Label>
                <Input 
                  id="availableTechnicians" 
                  type="number" 
                  placeholder="3" 
                  value={availableTechnicians}
                  onChange={(e) => setAvailableTechnicians(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium">Decision Criteria</Label>
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">Priority Factors (comma-separated)</Label>
                <Input 
                  placeholder="safety, cost, efficiency" 
                  value={priorityFactors}
                  onChange={(e) => setPriorityFactors(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Critical Efficiency (%)</Label>
                  <Input 
                    type="number" 
                    placeholder="70" 
                    value={criticalEfficiency}
                    onChange={(e) => setCriticalEfficiency(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Max Budget ($)</Label>
                  <Input 
                    type="number" 
                    placeholder="15000" 
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Min Uptime (%)</Label>
                  <Input 
                    type="number" 
                    placeholder="90" 
                    value={minUptime}
                    onChange={(e) => setMinUptime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleMakeDecision}
              disabled={decisionLoading || !assetId || !currentStatus || !lastMaintenance || !efficiency || !uptime || !temperature || !budget || !availableTechnicians}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Brain className="h-4 w-4 mr-2" />
              {decisionLoading ? 'Making Decision...' : 'Make Decision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Learning Modal */}
      <Dialog open={learningModalOpen} onOpenChange={setLearningModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Learn from Decision
            </DialogTitle>
            <DialogDescription>
              Provide feedback to help the AI learn and improve from decisions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="learningDecisionId" className="text-sm font-medium">Decision ID</Label>
                <Input 
                  id="learningDecisionId" 
                  placeholder="decision_id_here" 
                  value={learningDecisionId}
                  onChange={(e) => setLearningDecisionId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="learningOutcome" className="text-sm font-medium">Outcome</Label>
                <Select value={learningOutcome} onValueChange={(value: any) => setLearningOutcome(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium">Feedback Metrics</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Accuracy (0-1)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0.95" 
                    value={learningAccuracy}
                    onChange={(e) => setLearningAccuracy(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Efficiency (0-1)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0.88" 
                    value={learningEfficiency}
                    onChange={(e) => setLearningEfficiency(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Cost Savings ($)</Label>
                  <Input 
                    type="number" 
                    placeholder="2500" 
                    value={learningCostSavings}
                    onChange={(e) => setLearningCostSavings(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">User Satisfaction (0-1)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0.92" 
                    value={learningUserSatisfaction}
                    onChange={(e) => setLearningUserSatisfaction(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="learningNotes" className="text-sm font-medium">Notes</Label>
              <Textarea 
                id="learningNotes" 
                placeholder="Decision was accurate and led to significant cost savings..." 
                value={learningNotes}
                onChange={(e) => setLearningNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLearningModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLearnFromDecision}
              disabled={learningLoading || !learningDecisionId || !learningAccuracy || !learningEfficiency || !learningCostSavings || !learningUserSatisfaction}
              className="bg-green-600 hover:bg-green-700"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              {learningLoading ? 'Learning...' : 'Submit Learning'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Rule Modal */}
      <Dialog open={createRuleModalOpen} onOpenChange={setCreateRuleModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Create Decision Rule
            </DialogTitle>
            <DialogDescription>
              Define intelligent decision rules for automated processes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ruleName" className="text-sm font-medium">Rule Name</Label>
                <Input 
                  id="ruleName" 
                  placeholder="Enter rule name" 
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ruleType" className="text-sm font-medium">Rule Type</Label>
                <Select value={ruleType} onValueChange={(value: any) => setRuleType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset_failure">Asset Failure</SelectItem>
                    <SelectItem value="resource_allocation">Resource Allocation</SelectItem>
                    <SelectItem value="predictive_maintenance">Predictive Maintenance</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ruleDescription" className="text-sm font-medium">Description</Label>
              <Textarea 
                id="ruleDescription" 
                placeholder="Describe what this rule does..." 
                value={ruleDescription}
                onChange={(e) => setRuleDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium">Conditions (JSON format)</Label>
              <Textarea 
                placeholder='[{"field": "priority", "operator": "equals", "value": "critical"}]' 
                value={ruleConditions}
                onChange={(e) => setRuleConditions(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium">Actions (JSON format)</Label>
              <Textarea 
                placeholder='[{"type": "notify", "target": "maintenance_team", "message": "Critical issue detected"}]' 
                value={ruleActions}
                onChange={(e) => setRuleActions(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRuleModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateRule}
              disabled={!ruleName || !ruleDescription}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Modal */}
      <Dialog open={analyticsModalOpen} onOpenChange={setAnalyticsModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              AI Decision Analytics
            </DialogTitle>
            <DialogDescription>
              Detailed analytics and performance metrics for intelligent decision making
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-900">{decisionAnalytics ? (decisionAnalytics.accuracy * 100).toFixed(1) : '0'}%</div>
                  <div className="text-sm text-blue-600">Decision Accuracy</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-900">{decisionAnalytics?.totalDecisions || 0}</div>
                  <div className="text-sm text-green-600">Total Decisions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-900">{decisionAnalytics ? (decisionAnalytics.averageConfidence * 100).toFixed(1) : '0'}%</div>
                  <div className="text-sm text-purple-600">Avg Confidence</div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Loading State */}
            {analyticsLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading analytics...</p>
              </div>
            )}

            {/* Analytics Data */}
            {!analyticsLoading && decisionAnalytics && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Decision Performance Overview</h4>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Decision Accuracy</h5>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {(decisionAnalytics.accuracy * 100).toFixed(0)}%
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Overall accuracy of AI decisions</p>
                          <p className="text-xs text-gray-500">Based on {decisionAnalytics.totalDecisions} decisions</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-3">Average Confidence</h5>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {(decisionAnalytics.averageConfidence * 100).toFixed(0)}%
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Average confidence level</p>
                          <p className="text-xs text-gray-500">AI confidence in decisions</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAnalyticsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </main>
      </div>
    </div>
  )
} 