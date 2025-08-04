'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Badge } from './badge'
import { Separator } from './separator'
import { useDigitalAssets } from '@/contexts/DigitalAssetsContext'
import { cn } from '@/lib/utils'
import { Search, Building, MapPin, User, Calendar, Hash, AlertCircle, CheckCircle, Clock, Package, Eye, EyeOff } from 'lucide-react'

interface AssetsViewerProps {
  className?: string;
}

export function AssetsViewer({ className }: AssetsViewerProps) {
  const { 
    assets, 
    selectedAsset, 
    loading, 
    error, 
    fetchAssets, 
    fetchAssetByTagId, 
    searchAssets, 
    clearSelectedAsset,
    clearError 
  } = useDigitalAssets()

  const [searchTagId, setSearchTagId] = useState('')
  const [showAssetDetails, setShowAssetDetails] = useState(false)

  // Load assets on component mount
  useEffect(() => {
    fetchAssets()
  }, []) // Remove fetchAssets from dependencies to prevent infinite loop

  const handleSearchByTagId = async () => {
    if (!searchTagId.trim()) {
      await fetchAssets()
      return
    }

    try {
      // First try to get the specific asset
      await fetchAssetByTagId(searchTagId.trim())
      setShowAssetDetails(true)
    } catch (err) {
      // If specific asset not found, search for similar assets
      await searchAssets(searchTagId.trim())
      setShowAssetDetails(false)
    }
  }

  const handleClearSearch = () => {
    setSearchTagId('')
    clearSelectedAsset()
    setShowAssetDetails(false)
    fetchAssets()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'maintenance':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            Search Assets
          </CardTitle>
          <CardDescription>
            Search assets by tag ID or view all assets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="searchTagId">Tag ID</Label>
              <Input
                id="searchTagId"
                placeholder="Enter Tag ID (e.g., ASSET555)"
                value={searchTagId}
                onChange={(e) => setSearchTagId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchByTagId()}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button 
                onClick={handleSearchByTagId}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
              <Button 
                onClick={handleClearSearch}
                variant="outline"
                disabled={loading}
              >
                Clear
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <Button 
                onClick={clearError}
                variant="ghost"
                size="sm"
                className="mt-2"
              >
                Dismiss
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Asset Details */}
      {selectedAsset && showAssetDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Asset Details
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{selectedAsset.tagId}</Badge>
                <Button
                  onClick={() => setShowAssetDetails(false)}
                  variant="ghost"
                  size="sm"
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Detailed information for asset {selectedAsset.tagId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <Hash className="h-4 w-4" />
                  Basic Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Type:</span>
                    <Badge variant="outline">{selectedAsset.assetType}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Subcategory:</span>
                    <span>{selectedAsset.subcategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Brand:</span>
                    <span>{selectedAsset.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Model:</span>
                    <span>{selectedAsset.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Serial Number:</span>
                    <span>{selectedAsset.serialNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Capacity:</span>
                    <span>{selectedAsset.capacity}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  Status & Priority
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge variant={getStatusBadgeVariant(selectedAsset.status)}>
                      {selectedAsset.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Priority:</span>
                    <Badge variant={getPriorityBadgeVariant(selectedAsset.priority)}>
                      {selectedAsset.priority}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Digital Tag Type:</span>
                    <Badge variant="outline">{selectedAsset.digitalTagType}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Project:</span>
                    <span>{selectedAsset.projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Year of Installation:</span>
                    <span>{selectedAsset.yearOfInstallation}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location Information */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                Location Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Building:</span>
                  <span>{selectedAsset.location.building}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Floor:</span>
                  <span>{selectedAsset.location.floor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Room:</span>
                  <span>{selectedAsset.location.room}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Coordinates:</span>
                  <span className="text-xs">
                    {selectedAsset.location.latitude}, {selectedAsset.location.longitude}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  Created By
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{selectedAsset.createdBy.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span className="text-xs">{selectedAsset.createdBy.email}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  Timestamps
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Created:</span>
                    <span>{formatDate(selectedAsset.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Updated:</span>
                    <span>{formatDate(selectedAsset.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedAsset.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedAsset.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assets List */}
      {!showAssetDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Assets List
              <Badge variant="secondary">{assets.length} assets</Badge>
            </CardTitle>
            <CardDescription>
              {searchTagId ? `Search results for "${searchTagId}"` : 'All available assets'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  <span className="text-sm text-muted-foreground">Loading assets...</span>
                </div>
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No assets found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assets.map((asset) => (
                  <div
                    key={asset._id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedAsset(asset)
                      setShowAssetDetails(true)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{asset.tagId}</Badge>
                          <Badge variant={getStatusBadgeVariant(asset.status)}>
                            {asset.status}
                          </Badge>
                          <Badge variant={getPriorityBadgeVariant(asset.priority)}>
                            {asset.priority}
                          </Badge>
                        </div>
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Building className="h-3 w-3" />
                        <span>{asset.location.building}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Hash className="h-3 w-3" />
                        <span>{asset.assetType}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{asset.createdBy.name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 