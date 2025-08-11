import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Button } from './button'
// import { Progress } from './progress'
import { Prediction } from '@/lib/AdminDashboard'
import { 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  User,
  BarChart3,
  Eye,
  Download
} from 'lucide-react'

interface PredictionsCardProps {
  predictions: Prediction[]
  isLoading?: boolean
  onViewDetails?: (prediction: Prediction) => void
  onExport?: () => void
}

export const PredictionsCard: React.FC<PredictionsCardProps> = ({
  predictions,
  isLoading = false,
  onViewDetails,
  onExport
}) => {
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
      month: 'short',
      day: 'numeric'
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Predictive Analytics</span>
          </CardTitle>
          <CardDescription>AI-powered maintenance predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle>Predictive Analytics</CardTitle>
              <CardDescription>AI-powered maintenance predictions</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{predictions.length}</div>
              <div className="text-sm text-blue-600">Total Predictions</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {predictions.filter(p => p.prediction.confidence >= 0.8).length}
              </div>
              <div className="text-sm text-green-600">High Confidence</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {predictions.filter(p => getDaysUntilMaintenance(p.prediction.nextMaintenanceDate) <= 30).length}
              </div>
              <div className="text-sm text-orange-600">Due Soon</div>
            </div>
          </div>

          {/* Predictions List */}
          <div className="space-y-3">
            {predictions.map((prediction,) => {
              const daysUntil = getDaysUntilMaintenance(prediction.prediction.nextMaintenanceDate)
              const UrgencyIcon = getUrgencyIcon(daysUntil)
              
              return (
                <div key={prediction.assetId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {prediction.tagId}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {prediction.assetType}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">Next Maintenance</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <UrgencyIcon className={`w-4 h-4 ${getUrgencyColor(daysUntil)}`} />
                            <span className={`text-sm font-medium ${getUrgencyColor(daysUntil)}`}>
                              {formatDate(prediction.prediction.nextMaintenanceDate)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Confidence</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getConfidenceColor(prediction.prediction.confidence)}`}
                                style={{ width: `${prediction.prediction.confidence * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {Math.round(prediction.prediction.confidence * 100)}%
                            </span>
                          </div>
                        </div>

                        {prediction.assignedTo && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">Assigned To</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {prediction.assignedTo.name}
                            </span>
                          </div>
                        )}

                        {daysUntil > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Days Until Maintenance</span>
                            <span className={`text-sm font-medium ${getUrgencyColor(daysUntil)}`}>
                              {daysUntil} days
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Badge 
                        className={`${
                          getConfidenceColor(prediction.prediction.confidence).replace('bg-', 'text-')
                        } bg-opacity-10`}
                      >
                        {getConfidenceText(prediction.prediction.confidence)}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewDetails?.(prediction)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {predictions.length === 0 && (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Predictions Available</h3>
              <p className="text-gray-600">No maintenance predictions are currently available.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 