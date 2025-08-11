'use client'

import React, { useState } from 'react'
import ProtectedRoute from "@/components/ProtectedRoute"
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
  Settings,
  Plus,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react'

export default function AutomationPage() {
  return (
    <ProtectedRoute>
      <AutomationProvider>
        <AutomationPageContent />
      </AutomationProvider>
    </ProtectedRoute>
  )
}

function AutomationPageContent() {
  const { isAuthenticated, loading } = useAutomation()
  const [activeTab, setActiveTab] = useState('workflows')

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Automation Hub</h1>
              <p className="text-gray-600">Streamline operations with intelligent workflows and smart automation</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="hover:bg-blue-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="hover:bg-purple-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="hover:bg-green-50"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="hover:bg-yellow-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Workflow
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 space-y-6">

          {/* Connection Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  Automation System: {isAuthenticated ? 'Connected' : 'Not Connected'}
                </span>
                {loading && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-500">Loading...</span>
                  </div>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="hover:bg-blue-50"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Quick Start
              </Button>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-gray-200">
                <TabsList className="grid w-full grid-cols-3 h-16 bg-gray-50/50 p-2">
                  <TabsTrigger 
                    value="workflows" 
                    className="flex items-center gap-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 rounded-lg transition-all duration-200 hover:bg-gray-50"
                  >
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Workflows</div>
                      <div className="text-xs text-gray-500">Automated processes</div>
                    </div>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="scheduling" 
                    className="flex items-center gap-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 rounded-lg transition-all duration-200 hover:bg-gray-50"
                  >
                    <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm">Smart Timing</div>
                      <div className="text-xs text-gray-500">Intelligent scheduling</div>
                    </div>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="decisions" 
                    className="flex items-center gap-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 rounded-lg transition-all duration-200 hover:bg-gray-50"
                  >
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-sm">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm">AI Decisions</div>
                      <div className="text-xs text-gray-500">Powered logic</div>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
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
        </main>
      </div>
    </div>
  )
}
