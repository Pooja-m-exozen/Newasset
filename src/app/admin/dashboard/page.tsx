"use client"

import ProtectedRoute from "@/components/ProtectedRoute"
import { EnhancedDashboard } from "@/components/ui/enhanced-dashboard"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAdminDashboard } from "@/contexts/AdminDashboard"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function AdminDashboardPage() {
  const { 
    dashboardData, 
    isLoading, 
    error,
    refreshDashboard,
    predictionsData,
    isPredictionsLoading,
    predictionsError,
    refreshPredictions,
    healthData,
    isHealthLoading,
    healthError,
    refreshHealth,
    costData,
    isCostLoading,
    costError,
    refreshCost,
    trendsData,
    isTrendsLoading,
    trendsError,
    refreshTrends
  } = useAdminDashboard()

  // Transform predictionsData to match the expected format
  const transformedPredictionsData = predictionsData ? {
    success: predictionsData.success,
    count: predictionsData.count,
    predictions: predictionsData.predictions.map(prediction => ({
      assetId: prediction.assetId,
      assetType: prediction.assetType,
      prediction: {
        confidence: prediction.prediction.confidence,
        nextMaintenanceDate: prediction.prediction.nextMaintenanceDate,
        predictedIssues: prediction.prediction.factors // Map factors to predictedIssues
      }
    }))
  } : null

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gradient-to-br from-background to-muted">
          <div className="flex-1 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gradient-to-br from-background to-muted">
          <div className="flex-1 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="mb-4">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load dashboard data</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                </div>
                <Button onClick={refreshDashboard} disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <EnhancedDashboard
        dashboardData={dashboardData}
        isLoading={isLoading}
        error={error}
        onRefresh={refreshDashboard}
        predictionsData={transformedPredictionsData}
        isPredictionsLoading={isPredictionsLoading}
        predictionsError={predictionsError}
        onRefreshPredictions={refreshPredictions}
        healthData={healthData}
        isHealthLoading={isHealthLoading}
        healthError={healthError}
        onRefreshHealth={refreshHealth}
        costData={costData}
        isCostLoading={isCostLoading}
        costError={costError}
        onRefreshCost={refreshCost}
        trendsData={trendsData}
        isTrendsLoading={isTrendsLoading}
        trendsError={trendsError}
        onRefreshTrends={refreshTrends}
      />
    </ProtectedRoute>
  )
} 