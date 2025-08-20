'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Badge } from './badge'

import { generateNFCData, type NFCGenerationResponse } from '@/lib/DigitalAssets'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { SuccessToast } from './success-toast'
import { Wifi, Info, Hash, MapPin, Building, User, Shield, CheckCircle, Search } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'



interface NFCGeneratorProps {
  className?: string;
}

export function NFCGenerator({ className }: NFCGeneratorProps) {
  const { user } = useAuth()
  const [assets, setAssets] = useState<any[]>([])
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [nfcData, setNfcData] = useState<NFCGenerationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedAssetId, setSelectedAssetId] = useState<string>('')
  const [mappedAssetId, setMappedAssetId] = useState<string>('')
  const [selectedAssetFromDropdown, setSelectedAssetFromDropdown] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch assets from API and filter by user's project
  const fetchAssets = useCallback(async () => {
    try {
      setAssetsLoading(true)
      
      if (!user?.projectName) {
        console.warn('User project not found')
        return
      }

      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
      if (!token) {
        console.warn('Authentication token not found')
        return
      }

      const response = await fetch('http://192.168.0.5:5021/api/assets', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.status}`)
      }

      const data = await response.json()
      
      let allAssets: any[] = []
      
      // Extract assets from response
      if (data.success && data.assets) {
        allAssets = data.assets
      } else if (data.assets) {
        allAssets = data.assets
      } else if (Array.isArray(data)) {
        allAssets = data
      } else {
        const possibleAssets = data.data || data.items || data.results || []
        if (Array.isArray(possibleAssets)) {
          allAssets = possibleAssets
        }
      }

      // Filter assets by user's project name
      const userAssets = allAssets.filter((asset: any) => {
        // Check both the old projectName property and the new nested project structure
        const assetProjectName = asset.project?.projectName || asset.projectName
        return assetProjectName === user.projectName
      })

      console.log(`Found ${userAssets.length} assets for project: ${user.projectName}`)
      setAssets(userAssets)
    } catch (err) {
      console.error('Error fetching assets:', err)
    } finally {
      setAssetsLoading(false)
    }
  }, [user?.projectName])

  // Load assets on component mount
  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  // Handle asset selection from dropdown
  const handleAssetSelect = async (assetTagId: string) => {
    setSelectedAssetFromDropdown(assetTagId)
    setSelectedAssetId(assetTagId)
    setError(null) // Clear any previous errors
    
    try {
      // Find the selected asset to get its _id
      const selectedAsset = assets.find(asset => asset.tagId === assetTagId)
      if (!selectedAsset) {
        throw new Error('Selected asset not found')
      }
      
      // Use the _id for NFC data generation
      const assetId = selectedAsset._id
      setMappedAssetId(assetId)
      
      // Don't auto-generate NFC data - user must click generate button
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process selected asset')
      console.error('Error processing selected asset:', err)
    }
  }



  const handleGenerateNFCData = async (assetIdToUse?: string) => {
    const assetId = assetIdToUse || mappedAssetId
    
    if (!assetId) {
      setError('Please select an asset from the dropdown')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateNFCData(assetId)
      setNfcData(result)
      setSuccessMessage('NFC data generated successfully!')
      setShowSuccessToast(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate NFC data')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerate = async () => {
    await handleGenerateNFCData()
  }

  // Filter assets based on search term
  const filteredAssets = assets.filter(asset => 
    asset.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.assetType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.model.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className={cn("space-y-6", className)}>
      {showSuccessToast && (
        <SuccessToast
          message={successMessage}
          onClose={() => setShowSuccessToast(false)}
        />
      )}
      
      {/* Project Info Banner */}
      {user?.projectName && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Currently working with project: <span className="font-bold">{user.projectName}</span>
            </span>
          </div>
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-500">
              <Wifi className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">
                NFC Data Generator
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-1">
                Select an asset from your project and generate NFC data for contactless asset identification
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Asset Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <Label className="text-sm font-semibold">Step 1: Select Asset</Label>
            </div>
            
            {assetsLoading && (
              <div className="flex items-center space-x-3 p-4 bg-muted/50 border border-border rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <span className="text-sm font-medium">Loading assets from API...</span>
              </div>
            )}
            
            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder="🔍 Search assets by tag ID, type, brand, or model..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 text-sm"
                  disabled={assetsLoading}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Select value={selectedAssetFromDropdown} onValueChange={handleAssetSelect}>
                <SelectTrigger className="h-11 text-sm">
                  <SelectValue placeholder={assetsLoading ? "⏳ Loading assets..." : "📋 Choose an asset from the list"} />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {assetsLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm">Loading assets...</p>
                    </div>
                  ) : filteredAssets.length > 0 ? (
                    filteredAssets.map((asset) => (
                      <SelectItem key={asset._id} value={asset.tagId} className="py-2">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{asset.tagId}</span>
                          <Badge 
                            variant={asset.status === 'active' ? 'default' : 'secondary'} 
                            className="text-xs px-2 py-0.5"
                          >
                            {asset.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      <p className="text-sm">
                        {searchTerm ? '🔍 No assets found matching your search.' : '📭 No assets available.'}
                      </p>
                    </div>
                  )}
                </SelectContent>
              </Select>
              
              <div className="text-center text-xs text-muted-foreground">
                {assetsLoading ? 'Loading...' : (
                  assets.length === 0 ? (
                    <span className="text-red-500">⚠️ No assets found for project: {user?.projectName}</span>
                  ) : (
                    <span>{filteredAssets.length} assets available</span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-muted/50 border border-border rounded-md">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">NFC Data Generation</p>
                <p className="text-muted-foreground">
                  NFC data includes comprehensive asset information including location, 
                  maintenance schedule, performance metrics, and digital signatures for security.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Asset Selection Feedback */}
          {selectedAssetId && !nfcData && (
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">
                    Asset Selected: <strong>{selectedAssetId}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ready to generate NFC data. Click the button below to proceed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <Label className="text-sm font-semibold">Step 2: Generate NFC Data</Label>
            </div>
            
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !selectedAssetId}
              className="w-full h-11 text-base font-semibold"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating NFC Data...</span>
                </div>
              ) : selectedAssetId ? (
                <div className="flex items-center space-x-2">
                  <Wifi className="h-5 w-5" />
                  <span>Generate NFC Data for {selectedAssetId}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Wifi className="h-5 w-5" />
                  <span>Generate NFC Data</span>
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {nfcData && (
        <Card className="shadow-sm">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-500">
                  <Wifi className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">
                    Generated NFC Data
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    NFC data generated successfully for asset {nfcData.nfcData.data.id}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {nfcData.nfcData.data.id}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* NFC Data Preview */}
            <div className="flex justify-center">
              <div className="relative border-2 border-dashed border-border rounded-lg p-8 bg-muted/30">
                <div className="relative w-80 h-48 bg-white rounded-lg shadow-sm overflow-hidden border border-border">
                  <div className="flex items-center justify-center w-full h-full p-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wifi className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">NFC Data Ready</h3>
                      <p className="text-sm text-muted-foreground mb-4">Tap to read asset information</p>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <p><span className="font-medium">Asset ID:</span> {nfcData.nfcData.data.id}</p>
                        <p><span className="font-medium">Type:</span> {nfcData.nfcData.data.type}</p>
                        <p><span className="font-medium">Format:</span> NFC-A</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Asset Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Asset Information Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-md bg-blue-100">
                      <Hash className="h-4 w-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg font-semibold">Asset Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</Label>
                      <p className="text-sm font-medium">{nfcData.nfcData.data.assetType}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand</Label>
                      <p className="text-sm font-medium">{nfcData.nfcData.data.brand}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</Label>
                      <p className="text-sm font-medium">{nfcData.nfcData.data.model}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</Label>
                      <Badge 
                        variant={nfcData.nfcData.data.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs px-2 py-1"
                      >
                        {nfcData.nfcData.data.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</Label>
                      <Badge 
                        variant={nfcData.nfcData.data.priority === 'high' ? 'destructive' : 'secondary'}
                        className="text-xs px-2 py-1"
                      >
                        {nfcData.nfcData.data.priority}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigned To</Label>
                      <p className="text-sm font-medium">{nfcData.nfcData.data.assignedTo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Information Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-md bg-green-100">
                      <MapPin className="h-4 w-4 text-green-600" />
                    </div>
                    <CardTitle className="text-lg font-semibold">Location Details</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Building</Label>
                      <p className="text-sm font-medium">{nfcData.nfcData.data.location.building}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Floor</Label>
                      <p className="text-sm font-medium">{nfcData.nfcData.data.location.floor}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Room</Label>
                      <p className="text-sm font-medium">{nfcData.nfcData.data.location.room}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project</Label>
                      <p className="text-sm font-medium">{nfcData.nfcData.data.projectName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Technical Details Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Security Information Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-md bg-purple-100">
                      <Shield className="h-4 w-4 text-purple-600" />
                    </div>
                    <CardTitle className="text-lg font-semibold">Security & Validation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Checksum</Label>
                      <p className="text-sm font-medium font-mono">
                        {nfcData.nfcData.data.checksum.substring(0, 8)}...
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Signature</Label>
                      <p className="text-sm font-medium font-mono">
                        {nfcData.nfcData.data.signature.substring(0, 16)}...
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data Type</Label>
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        {nfcData.nfcData.data.type}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Asset ID</Label>
                      <p className="text-sm font-medium font-mono">{nfcData.nfcData.data.id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assignment and Timestamp Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-md bg-blue-100">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-lg font-semibold">Assignment & Timing</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assigned To</Label>
                      <p className="text-sm font-medium">{nfcData.nfcData.data.assignedTo}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project</Label>
                      <p className="text-sm font-medium">{nfcData.nfcData.data.projectName}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Generated</Label>
                      <p className="text-sm font-medium">
                        {formatTimestamp(nfcData.nfcData.data.timestamp)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Success Message */}
            <div className="p-4 bg-muted/50 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">
                    NFC Data Generated Successfully!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    The NFC data is ready for use. You can tap it to access asset information.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 