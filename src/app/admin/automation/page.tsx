'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AutomationWorkflows } from '@/components/ui/automation-workflows'
import { AutomationScheduling } from '@/components/ui/automation-scheduling'
import { AutomationDecisions } from '@/components/ui/automation-decisions'
import { AutomationProvider, useAutomation } from '@/contexts/AutomationContext'
import { 
  Bot, 
  Clock, 
  Brain, 
  Sparkles,
  Zap,
  Settings,
  BarChart3,
  Target
} from 'lucide-react'

export default function AutomationPage() {
  return (
    <AutomationProvider>
      <AutomationPageContent />
    </AutomationProvider>
  )
}

function AutomationPageContent() {
  const { isAuthenticated, loading } = useAutomation()
  const [activeTab, setActiveTab] = useState('workflows')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                    <Bot className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Automation Hub
                    </h1>
                    <p className="text-gray-600 mt-2 text-lg">
                      Streamline operations with intelligent workflows and smart automation
                    </p>
                  </div>
                </div>
                
                {/* Status Indicators */}
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600">
                      {isAuthenticated ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>
                  {loading && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600">Loading...</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline"
                  className="border-gray-200 hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Quick Start
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Redesigned Tabs - Only 3 tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-100">
              <TabsList className="grid w-full grid-cols-3 h-20 bg-gray-50/50 p-3">
                <TabsTrigger 
                  value="workflows" 
                  className="flex items-center gap-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-gray-200 rounded-xl transition-all duration-200 hover:bg-gray-50"
                >
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">Workflows</div>
                    <div className="text-sm text-gray-500">Automated processes</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="scheduling" 
                  className="flex items-center gap-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-gray-200 rounded-xl transition-all duration-200 hover:bg-gray-50"
                >
                  <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-md">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">Smart Timing</div>
                    <div className="text-sm text-gray-500">Intelligent scheduling</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="decisions" 
                  className="flex items-center gap-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-gray-200 rounded-xl transition-all duration-200 hover:bg-gray-50"
                >
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-md">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-lg">AI Decisions</div>
                    <div className="text-sm text-gray-500">Powered logic</div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-8">
              {/* Workflow Automation */}
              <TabsContent value="workflows" className="space-y-6 mt-0">
                <AutomationWorkflows />
              </TabsContent>

              {/* Smart Scheduling */}
              <TabsContent value="scheduling" className="space-y-6 mt-0">
                <AutomationScheduling />
              </TabsContent>

              {/* Intelligent Decision Making */}
              <TabsContent value="decisions" className="space-y-6 mt-0">
                <AutomationDecisions />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
