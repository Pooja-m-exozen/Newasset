"use client"

import ProtectedRoute from "@/components/ProtectedRoute"
import { EnhancedDashboard } from "@/components/ui/enhanced-dashboard"
import { useAdminDashboard } from "@/contexts/AdminDashboard"
import { useMemo } from "react"

export default function AdminDashboardPage() {
  const { 
    dashboardData, 
    error,
    refreshDashboard,
    predictionsData,
    predictionsError,
    refreshPredictions,
    healthData,
    healthError,
    refreshHealth,
    costData,
    costError,
    refreshCost
  } = useAdminDashboard()

  // Transform predictionsData to match the expected format for EnhancedDashboard
  const transformedPredictionsData = useMemo(() => {
    if (!predictionsData) return null
    
    return {
      success: predictionsData.success,
      count: predictionsData.count,
      predictions: predictionsData.predictions.map(prediction => ({
        assetId: prediction.assetId,
        assetType: prediction.assetType,
        projectName: prediction.projectName,
        projectId: prediction.projectId,
        tagId: prediction.tagId,
        assignedTo: prediction.assignedTo,
        prediction: {
          confidence: prediction.prediction.confidence,
          nextMaintenanceDate: prediction.prediction.nextMaintenanceDate,
          predictedIssues: prediction.prediction.factors || [], // Map factors to predictedIssues
          recommendations: prediction.prediction.recommendations || []
        }
      }))
    }
  }, [predictionsData])

  return (
    <ProtectedRoute>
      <EnhancedDashboard
        dashboardData={dashboardData}
        isLoading={false}
        error={error}
        onRefresh={refreshDashboard}
        predictionsData={transformedPredictionsData}
        isPredictionsLoading={false}
        predictionsError={predictionsError}
        onRefreshPredictions={refreshPredictions}
        healthData={healthData}
        isHealthLoading={false}
        healthError={healthError}
        onRefreshHealth={refreshHealth}
        costData={costData}
        isCostLoading={false}
        costError={costError}
        onRefreshCost={refreshCost}
      />
    </ProtectedRoute>
  )
} 