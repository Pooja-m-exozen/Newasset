import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog'
import { Badge } from './badge'
import { Button } from './button'
import { Prediction } from '@/lib/AdminDashboard'
import { 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  User,
  BarChart3,
  X,
  Download,
  FileText,
  Settings,
  Wrench
} from 'lucide-react'

interface PredictionDetailsModalProps {
  prediction: Prediction | null
  isOpen: boolean
  onClose: () => void
  onExport?: (prediction: Prediction) => void
}

export const PredictionDetailsModal: React.FC<PredictionDetailsModalProps> = ({
  prediction,
  isOpen,
  onClose,
  onExport
}) => {
  if (!prediction) return null

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500'
    if (confidence >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium'
    return 'Low'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysUntilMaintenance = (dateString: string) => {
    const maintenanceDate = new Date(dateString)
    const today = new Date()
    const diffTime = maintenanceDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getUrgencyColor = (days: number) => {
    if (days <= 7) return 'text-red-600'
    if (days <= 30) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getUrgencyIcon = (days: number) => {
    if (days <= 7) return AlertCircle
    if (days <= 30) return Clock
    return CheckCircle
  }

  const daysUntil = getDaysUntilMaintenance(prediction.prediction.nextMaintenanceDate)
  const UrgencyIcon = getUrgencyIcon(daysUntil)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <div>
                <DialogTitle>Prediction Details</DialogTitle>
                <DialogDescription>
                  Detailed analysis for {prediction.tagId}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Asset Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Asset Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    Asset ID
                  </Badge>
                  <span className="text-sm font-medium">{prediction.tagId}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    Type
                  </Badge>
                  <span className="text-sm font-medium">{prediction.assetType}</span>
                </div>
              </div>
              {prediction.assignedTo && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">Assigned To</span>
                  </div>
                  <div className="pl-6">
                    <p className="text-sm text-gray-900">{prediction.assignedTo.name}</p>
                    <p className="text-xs text-gray-500">{prediction.assignedTo.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Prediction Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Prediction Analysis</h3>
            
            {/* Maintenance Date */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Next Maintenance Date</span>
                </div>
                <div className="flex items-center space-x-2">
                  <UrgencyIcon className={`w-4 h-4 ${getUrgencyColor(daysUntil)}`} />
                  <span className={`text-sm font-medium ${getUrgencyColor(daysUntil)}`}>
                    {formatDate(prediction.prediction.nextMaintenanceDate)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Days Until Maintenance</span>
                <span className={`text-sm font-medium ${getUrgencyColor(daysUntil)}`}>
                  {daysUntil} days
                </span>
              </div>
            </div>

            {/* Confidence Level */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Confidence Level</span>
                </div>
                <Badge 
                  className={`${
                    getConfidenceColor(prediction.prediction.confidence).replace('bg-', 'text-')
                  } bg-opacity-10`}
                >
                  {getConfidenceText(prediction.prediction.confidence)}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Confidence Score</span>
                  <span className="text-sm font-medium">
                    {Math.round(prediction.prediction.confidence * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getConfidenceColor(prediction.prediction.confidence)}`}
                    style={{ width: `${prediction.prediction.confidence * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Factors */}
            {prediction.prediction.factors && prediction.prediction.factors.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Contributing Factors</span>
                </div>
                <div className="space-y-1">
                  {prediction.prediction.factors.map((factor, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-700">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {prediction.prediction.recommendations && prediction.prediction.recommendations.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                                  <div className="flex items-center space-x-2 mb-2">
                    <Wrench className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-900">Recommendations</span>
                  </div>
                <div className="space-y-1">
                  {prediction.prediction.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                      <span className="text-sm text-blue-800">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          {prediction.performanceMetrics && Object.keys(prediction.performanceMetrics).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-xs text-gray-700 overflow-auto">
                  {JSON.stringify(prediction.performanceMetrics, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Maintenance Schedule */}
          {prediction.maintenanceSchedule && Object.keys(prediction.maintenanceSchedule).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Maintenance Schedule</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-xs text-gray-700 overflow-auto">
                  {JSON.stringify(prediction.maintenanceSchedule, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={() => onExport?.(prediction)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 