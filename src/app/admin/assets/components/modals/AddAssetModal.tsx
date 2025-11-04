"use client"

import React from 'react'
import { X, Package, Building, Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AssetData, InventoryItem } from '@/lib/adminasset'
import { Location } from '@/lib/location'
import { generateAssetId, generateSubAssetTagId } from '../../utils/tag-id-generator'

interface AddAssetModalProps {
  isOpen: boolean
  onClose: () => void
  currentStep: 'main' | 'subassets' | 'inventory'
  setCurrentStep: (step: 'main' | 'subassets' | 'inventory') => void
  newAsset: Partial<AssetData>
  setNewAsset: React.Dispatch<React.SetStateAction<Partial<AssetData>>>
  locationType: string
  setLocationType: (value: string) => void
  assetTypeCode: string
  setAssetTypeCode: (value: string) => void
  mainAssetInventory: {
    consumables: InventoryItem[]
    spareParts: InventoryItem[]
    tools: InventoryItem[]
    operationalSupply: InventoryItem[]
  }
  locations: Location[]
  loadingLocations: boolean
  selectedLocationId: string
  selectedLocationName: string
  user: { projectName?: string; name?: string; projectId?: string } | null
  assets: AssetData[]
  handleInputChange: (field: string, value: string) => void
  handleLocationSelect: (locationId: string) => void
  handleAddSubAsset: (category: 'Movable' | 'Immovable') => void
  handleSubAssetChange: (category: 'Movable' | 'Immovable', index: number, field: string, value: string) => void
  handleRemoveSubAsset: (category: 'Movable' | 'Immovable', index: number) => void
  handleAddMainAssetInventoryItem: (inventoryType: 'consumables' | 'spareParts' | 'tools' | 'operationalSupply') => void
  handleMainAssetInventoryItemChange: (inventoryType: 'consumables' | 'spareParts' | 'tools' | 'operationalSupply', itemIndex: number, field: string, value: string | number) => void
  handleRemoveMainAssetInventoryItem: (inventoryType: 'consumables' | 'spareParts' | 'tools' | 'operationalSupply', itemIndex: number) => void
  handleAddInventoryItem: (category: 'Movable' | 'Immovable', subAssetIndex: number, inventoryType: 'consumables' | 'spareParts' | 'tools' | 'operationalSupply') => void
  handleInventoryItemChange: (category: 'Movable' | 'Immovable', subAssetIndex: number, inventoryType: 'consumables' | 'spareParts' | 'tools' | 'operationalSupply', itemIndex: number, field: string, value: string | number) => void
  handleRemoveInventoryItem: (category: 'Movable' | 'Immovable', subAssetIndex: number, inventoryType: 'consumables' | 'spareParts' | 'tools' | 'operationalSupply', itemIndex: number) => void
  handleMainAssetSave: () => void
  handleFinalSave: () => void
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  currentStep,
  setCurrentStep,
  newAsset,
  setNewAsset,
  locationType,
  setLocationType,
  assetTypeCode,
  setAssetTypeCode,
  mainAssetInventory,
  locations,
  loadingLocations,
  selectedLocationId,
  selectedLocationName,
  user,
  assets,
  handleInputChange,
  handleLocationSelect,
  handleAddSubAsset,
  handleSubAssetChange,
  handleRemoveSubAsset,
  handleAddMainAssetInventoryItem,
  handleMainAssetInventoryItemChange,
  handleRemoveMainAssetInventoryItem,
  handleAddInventoryItem,
  handleInventoryItemChange,
  handleRemoveInventoryItem,
  handleMainAssetSave,
  handleFinalSave
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {currentStep === 'main' && 'Add New Asset'}
              {currentStep === 'subassets' && 'Add Sub-Assets'}
              {currentStep === 'inventory' && 'Add Inventory Items'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {currentStep === 'main' && 'Step 1: Fill in the main asset details'}
              {currentStep === 'subassets' && 'Step 2: Add movable and immovable components'}
              {currentStep === 'inventory' && 'Step 3: Add inventory items for each component'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-4">
          <button
            onClick={() => setCurrentStep('main')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              currentStep === 'main'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Main Asset
          </button>
          <button
            onClick={() => setCurrentStep('subassets')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              currentStep === 'subassets'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Sub-Assets
          </button>
          <button
            onClick={() => {
              if (!newAsset.tagId && locationType && assetTypeCode) {
                const generatedId = generateAssetId(user, locationType, assetTypeCode)
                if (generatedId && !assets.some(asset => asset.tagId === generatedId)) {
                  setNewAsset(prev => ({ ...prev, tagId: generatedId }))
                }
              }
              setCurrentStep('inventory')
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              currentStep === 'inventory'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Inventory
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          {currentStep === 'main' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="tagId" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Asset ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tagId"
                    value={newAsset.tagId || generateAssetId(user, locationType, assetTypeCode)}
                    onChange={(e) => handleInputChange('tagId', e.target.value)}
                    placeholder="Auto-generated based on project info"
                    className="mt-1"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-generated: {generateAssetId(user, locationType, assetTypeCode) || 'Select location and asset type'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="project" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Project
                  </Label>
                  <Input
                    id="project"
                    value={newAsset.project?.projectName || ''}
                    className="mt-1 bg-gray-50 dark:bg-gray-700"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Project assigned from your login
                  </p>
                </div>

                <div>
                  <Label htmlFor="locationType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Location Type <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-1 mt-1">
                    <Select value={locationType} onValueChange={(value) => {
                      setLocationType(value)
                      const generatedId = generateAssetId(user, value, assetTypeCode)
                      handleInputChange('tagId', generatedId)
                    }}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select or enter location type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Common Area">Common Area</SelectItem>
                        <SelectItem value="Office">Office</SelectItem>
                        <SelectItem value="Workshop">Workshop</SelectItem>
                        <SelectItem value="Storage">Storage</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Utility">Utility</SelectItem>
                        <SelectItem value="Security">Security</SelectItem>
                        <SelectItem value="Parking">Parking</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Or enter custom location"
                      value={locationType}
                      onChange={(e) => {
                        setLocationType(e.target.value)
                        const generatedId = generateAssetId(user, e.target.value, assetTypeCode)
                        handleInputChange('tagId', generatedId)
                      }}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="assetTypeCode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Asset Type <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-1 mt-1">
                    <Select value={assetTypeCode} onValueChange={(value) => {
                      setAssetTypeCode(value)
                      const generatedId = generateAssetId(user, locationType, value)
                      handleInputChange('tagId', generatedId)
                      handleInputChange('assetType', value)
                    }}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select or enter asset type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Borewell Pump">Borewell Pump (BP)</SelectItem>
                        <SelectItem value="Water Treatment Plant">Water Treatment Plant (WTP)</SelectItem>
                        <SelectItem value="Computer">Computer (CP)</SelectItem>
                        <SelectItem value="Printer">Printer (PR)</SelectItem>
                        <SelectItem value="Generator">Generator (GN)</SelectItem>
                        <SelectItem value="Air Conditioner">Air Conditioner (AC)</SelectItem>
                        <SelectItem value="Elevator">Elevator (EL)</SelectItem>
                        <SelectItem value="Security Camera">Security Camera (SC)</SelectItem>
                        <SelectItem value="Fire Extinguisher">Fire Extinguisher (FE)</SelectItem>
                        <SelectItem value="Water Tank">Water Tank (WT)</SelectItem>
                        <SelectItem value="Pump">Pump (PM)</SelectItem>
                        <SelectItem value="Motor">Motor (MT)</SelectItem>
                        <SelectItem value="Transformer">Transformer (TR)</SelectItem>
                        <SelectItem value="Switchboard">Switchboard (SB)</SelectItem>
                        <SelectItem value="Lighting">Lighting (LT)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Or enter custom asset type"
                      value={assetTypeCode}
                      onChange={(e) => {
                        setAssetTypeCode(e.target.value)
                        const generatedId = generateAssetId(user, locationType, e.target.value)
                        handleInputChange('tagId', generatedId)
                        handleInputChange('assetType', e.target.value)
                      }}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subcategory
                  </Label>
                  <Input
                    id="subcategory"
                    value={newAsset.subcategory || ''}
                    onChange={(e) => handleInputChange('subcategory', e.target.value)}
                    placeholder="e.g., Water Treatment Plant, Desktop Computer"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="mobilityCategory" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mobility Category
                  </Label>
                  <Select value={newAsset.mobilityCategory || 'Movable'} onValueChange={(value) => handleInputChange('mobilityCategory', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Movable">Movable</SelectItem>
                      <SelectItem value="Immovable">Immovable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="brand" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Brand <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="brand"
                    value={newAsset.brand || ''}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="e.g., AquaTech, Dell"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="model" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Model
                  </Label>
                  <Input
                    id="model"
                    value={newAsset.model || ''}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="e.g., WTP-5000, OptiPlex 7090"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="serialNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Serial Number
                  </Label>
                  <Input
                    id="serialNumber"
                    value={newAsset.serialNumber || ''}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    placeholder="e.g., AT123456"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="capacity" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Capacity
                  </Label>
                  <Input
                    id="capacity"
                    value={newAsset.capacity || ''}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    placeholder="e.g., 5000 LPH, 16GB RAM"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="yearOfInstallation" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Year of Installation
                  </Label>
                  <Input
                    id="yearOfInstallation"
                    value={newAsset.yearOfInstallation || ''}
                    onChange={(e) => handleInputChange('yearOfInstallation', e.target.value)}
                    placeholder="e.g., 2022"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </Label>
                  <Select value={newAsset.status || 'Active'} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Priority
                  </Label>
                  <Select value={newAsset.priority || 'Medium'} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Fields */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Location Details</h4>
                 
                  <div>
                    <Label htmlFor="location" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select Location
                    </Label>
                    <Select 
                      value={selectedLocationId} 
                      onValueChange={handleLocationSelect}
                    >
                      <SelectTrigger className={`mt-1 ${loadingLocations ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {selectedLocationName ? (
                          <span className="block truncate">{selectedLocationName}</span>
                        ) : (
                          <SelectValue placeholder={loadingLocations ? "Loading locations..." : "Select a location"} />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {loadingLocations ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            Loading locations...
                          </div>
                        ) : locations.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No locations available
                          </div>
                        ) : (
                          locations.map((location) => (
                            <SelectItem key={location._id} value={location._id}>
                              {location.name} {location.type ? `(${location.type})` : ''}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="building" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Building
                    </Label>
                    <Input
                      id="building"
                      value={newAsset.location?.building || ''}
                      onChange={(e) => handleInputChange('location.building', e.target.value)}
                      placeholder="e.g., Main Building"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="floor" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Floor
                    </Label>
                    <Input
                      id="floor"
                      value={newAsset.location?.floor || ''}
                      onChange={(e) => handleInputChange('location.floor', e.target.value)}
                      placeholder="e.g., Ground, 2nd Floor"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="room" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Room
                    </Label>
                    <Input
                      id="room"
                      value={newAsset.location?.room || ''}
                      onChange={(e) => handleInputChange('location.room', e.target.value)}
                      placeholder="e.g., Utility Room, IT Office"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'subassets' && (
            <div className="space-y-6">
              {/* Movable Assets Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Movable Assets</h3>
                  </div>
                  <Button
                    onClick={() => handleAddSubAsset('Movable')}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="w-4 h-4" />
                    Add Movable Asset
                  </Button>
                </div>

                <div className="space-y-4">
                  {newAsset.subAssets?.movable.map((subAsset, index) => (
                    <div key={subAsset.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">Movable Asset #{index + 1}</h4>
                        <Button
                          onClick={() => handleRemoveSubAsset('Movable', index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                     
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Asset Name</Label>
                          <Input
                            value={subAsset.assetName}
                            onChange={(e) => handleSubAssetChange('Movable', index, 'assetName', e.target.value)}
                            placeholder="e.g., Water Pumps"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tag ID</Label>
                          <Input
                            value={subAsset.tagId || generateSubAssetTagId(newAsset.tagId || generateAssetId(user, locationType, assetTypeCode), subAsset.assetName, 'Movable', index)}
                            onChange={(e) => handleSubAssetChange('Movable', index, 'tagId', e.target.value)}
                            placeholder="Auto-generated based on asset name"
                            className="mt-1"
                            readOnly
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Auto-generated: {generateSubAssetTagId(newAsset.tagId || generateAssetId(user, locationType, assetTypeCode), subAsset.assetName, 'Movable', index) || 'Enter asset name'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand</Label>
                          <Input
                            value={subAsset.brand}
                            onChange={(e) => handleSubAssetChange('Movable', index, 'brand', e.target.value)}
                            placeholder="e.g., AquaTech"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Model</Label>
                          <Input
                            value={subAsset.model}
                            onChange={(e) => handleSubAssetChange('Movable', index, 'model', e.target.value)}
                            placeholder="e.g., AP-5000"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Capacity</Label>
                          <Input
                            value={subAsset.capacity}
                            onChange={(e) => handleSubAssetChange('Movable', index, 'capacity', e.target.value)}
                            placeholder="e.g., 5000 LPH"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</Label>
                          <Input
                            value={subAsset.location}
                            onChange={(e) => handleSubAssetChange('Movable', index, 'location', e.target.value)}
                            placeholder="e.g., Inside WTP"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</Label>
                          <Input
                            value={subAsset.description}
                            onChange={(e) => handleSubAssetChange('Movable', index, 'description', e.target.value)}
                            placeholder="Brief description"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Digital Tag Type</Label>
                          <Select 
                            value={subAsset.digitalTagType || 'qr'} 
                            onValueChange={(value) => handleSubAssetChange('Movable', index, 'digitalTagType', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="qr">QR Code</SelectItem>
                              <SelectItem value="barcode">Barcode</SelectItem>
                              <SelectItem value="nfc">NFC</SelectItem>
                              <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immovable Assets Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Immovable Assets</h3>
                  </div>
                  <Button
                    onClick={() => handleAddSubAsset('Immovable')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4" />
                    Add Immovable Asset
                  </Button>
                </div>

                <div className="space-y-4">
                  {newAsset.subAssets?.immovable.map((subAsset, index) => (
                    <div key={subAsset.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">Immovable Asset #{index + 1}</h4>
                        <Button
                          onClick={() => handleRemoveSubAsset('Immovable', index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                     
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Asset Name</Label>
                          <Input
                            value={subAsset.assetName}
                            onChange={(e) => handleSubAssetChange('Immovable', index, 'assetName', e.target.value)}
                            placeholder="e.g., WTP Structure"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tag ID</Label>
                          <Input
                            value={subAsset.tagId || generateSubAssetTagId(newAsset.tagId || generateAssetId(user, locationType, assetTypeCode), subAsset.assetName, 'Immovable', index)}
                            onChange={(e) => handleSubAssetChange('Immovable', index, 'tagId', e.target.value)}
                            placeholder="Auto-generated based on asset name"
                            className="mt-1"
                            readOnly
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Auto-generated: {generateSubAssetTagId(newAsset.tagId || generateAssetId(user, locationType, assetTypeCode), subAsset.assetName, 'Immovable', index) || 'Enter asset name'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand</Label>
                          <Input
                            value={subAsset.brand}
                            onChange={(e) => handleSubAssetChange('Immovable', index, 'brand', e.target.value)}
                            placeholder="e.g., AquaTech"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Model</Label>
                          <Input
                            value={subAsset.model}
                            onChange={(e) => handleSubAssetChange('Immovable', index, 'model', e.target.value)}
                            placeholder="e.g., WTP-5000"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Capacity</Label>
                          <Input
                            value={subAsset.capacity}
                            onChange={(e) => handleSubAssetChange('Immovable', index, 'capacity', e.target.value)}
                            placeholder="e.g., 5000 LPH"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</Label>
                          <Input
                            value={subAsset.location}
                            onChange={(e) => handleSubAssetChange('Immovable', index, 'location', e.target.value)}
                            placeholder="e.g., Main Building"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</Label>
                          <Input
                            value={subAsset.description}
                            onChange={(e) => handleSubAssetChange('Immovable', index, 'description', e.target.value)}
                            placeholder="Brief description"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Digital Tag Type</Label>
                          <Select 
                            value={subAsset.digitalTagType || 'qr'} 
                            onValueChange={(value) => handleSubAssetChange('Immovable', index, 'digitalTagType', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="qr">QR Code</SelectItem>
                              <SelectItem value="barcode">Barcode</SelectItem>
                              <SelectItem value="nfc">NFC</SelectItem>
                              <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 'inventory' && (
            <div className="space-y-6">
              {/* Tag ID Display for Inventory */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Asset Tag ID
                    </Label>
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {newAsset.tagId || generateAssetId(user, locationType, assetTypeCode) || 'Generate by filling Location Type and Asset Type'}
                    </p>
                  </div>
                  {!newAsset.tagId && locationType && assetTypeCode && (
                    <Button
                      onClick={() => {
                        const generatedId = generateAssetId(user, locationType, assetTypeCode)
                        if (generatedId && !assets.some(asset => asset.tagId === generatedId)) {
                          setNewAsset(prev => ({ ...prev, tagId: generatedId }))
                        } else if (generatedId) {
                          alert('This Asset ID already exists. Please use a different combination.')
                        }
                      }}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Generate Tag ID
                    </Button>
                  )}
                </div>
              </div>

              {/* Main Asset Inventory */}
              <div className="border border-blue-300 dark:border-blue-700 rounded-lg p-4 bg-blue-50/30 dark:bg-blue-900/10 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Main Asset Inventory
                </h3>

                {/* Consumables */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      Consumables
                    </h4>
                    <Button
                      onClick={() => handleAddMainAssetInventoryItem('consumables')}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {mainAssetInventory.consumables.map((item, itemIndex) => (
                      <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <Input
                          value={item.tagId || ''}
                          onChange={(e) => handleMainAssetInventoryItemChange('consumables', itemIndex, 'tagId', e.target.value)}
                          placeholder="Tag ID"
                          className="text-sm font-mono"
                        />
                        <Input
                          value={item.itemName}
                          onChange={(e) => handleMainAssetInventoryItemChange('consumables', itemIndex, 'itemName', e.target.value)}
                          placeholder="Item Name"
                        />
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleMainAssetInventoryItemChange('consumables', itemIndex, 'quantity', parseInt(e.target.value) || 0)}
                          placeholder="Quantity"
                        />
                        <Select value={item.status} onValueChange={(value) => handleMainAssetInventoryItemChange('consumables', itemIndex, 'status', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Available">Available</SelectItem>
                            <SelectItem value="Low Stock">Low Stock</SelectItem>
                            <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={item.lastUpdated}
                          onChange={(e) => handleMainAssetInventoryItemChange('consumables', itemIndex, 'lastUpdated', e.target.value)}
                        />
                        <Button
                          onClick={() => handleRemoveMainAssetInventoryItem('consumables', itemIndex)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spare Parts */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      Spare Parts
                    </h4>
                    <Button
                      onClick={() => handleAddMainAssetInventoryItem('spareParts')}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {mainAssetInventory.spareParts.map((item, itemIndex) => (
                      <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <Input
                          value={item.tagId || ''}
                          onChange={(e) => handleMainAssetInventoryItemChange('spareParts', itemIndex, 'tagId', e.target.value)}
                          placeholder="Tag ID"
                          className="text-sm font-mono"
                        />
                        <Input
                          value={item.itemName}
                          onChange={(e) => handleMainAssetInventoryItemChange('spareParts', itemIndex, 'itemName', e.target.value)}
                          placeholder="Item Name"
                        />
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleMainAssetInventoryItemChange('spareParts', itemIndex, 'quantity', parseInt(e.target.value) || 0)}
                          placeholder="Quantity"
                        />
                        <Select value={item.status} onValueChange={(value) => handleMainAssetInventoryItemChange('spareParts', itemIndex, 'status', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Available">Available</SelectItem>
                            <SelectItem value="Low Stock">Low Stock</SelectItem>
                            <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={item.lastUpdated}
                          onChange={(e) => handleMainAssetInventoryItemChange('spareParts', itemIndex, 'lastUpdated', e.target.value)}
                        />
                        <Button
                          onClick={() => handleRemoveMainAssetInventoryItem('spareParts', itemIndex)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tools */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      Tools
                    </h4>
                    <Button
                      onClick={() => handleAddMainAssetInventoryItem('tools')}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {mainAssetInventory.tools.map((item, itemIndex) => (
                      <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <Input
                          value={item.tagId || ''}
                          onChange={(e) => handleMainAssetInventoryItemChange('tools', itemIndex, 'tagId', e.target.value)}
                          placeholder="Tag ID"
                          className="text-sm font-mono"
                        />
                        <Input
                          value={item.itemName}
                          onChange={(e) => handleMainAssetInventoryItemChange('tools', itemIndex, 'itemName', e.target.value)}
                          placeholder="Item Name"
                        />
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleMainAssetInventoryItemChange('tools', itemIndex, 'quantity', parseInt(e.target.value) || 0)}
                          placeholder="Quantity"
                        />
                        <Select value={item.status} onValueChange={(value) => handleMainAssetInventoryItemChange('tools', itemIndex, 'status', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Available">Available</SelectItem>
                            <SelectItem value="Low Stock">Low Stock</SelectItem>
                            <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={item.lastUpdated}
                          onChange={(e) => handleMainAssetInventoryItemChange('tools', itemIndex, 'lastUpdated', e.target.value)}
                        />
                        <Button
                          onClick={() => handleRemoveMainAssetInventoryItem('tools', itemIndex)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Movable Assets Inventory */}
              {newAsset.subAssets?.movable && newAsset.subAssets.movable.length > 0 && (
                newAsset.subAssets.movable.map((subAsset, subAssetIndex) => (
                  <div key={subAsset.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Package className="w-5 h-5 text-green-600" />
                      {subAsset.assetName || `Movable Asset #${subAssetIndex + 1}`}
                    </h3>

                    {/* Consumables */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          Consumables
                        </h4>
                        <Button
                          onClick={() => handleAddInventoryItem('Movable', subAssetIndex, 'consumables')}
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {subAsset.inventory.consumables.map((item, itemIndex) => (
                          <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <Input
                              value={item.tagId || ''}
                              onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'consumables', itemIndex, 'tagId', e.target.value)}
                              placeholder="Tag ID"
                              className="text-sm font-mono"
                            />
                            <Input
                              value={item.itemName}
                              onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'consumables', itemIndex, 'itemName', e.target.value)}
                              placeholder="Item Name"
                            />
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'consumables', itemIndex, 'quantity', parseInt(e.target.value) || 0)}
                              placeholder="Quantity"
                            />
                            <Select value={item.status} onValueChange={(value) => handleInventoryItemChange('Movable', subAssetIndex, 'consumables', itemIndex, 'status', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Available">Available</SelectItem>
                                <SelectItem value="Low Stock">Low Stock</SelectItem>
                                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="date"
                              value={item.lastUpdated}
                              onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'consumables', itemIndex, 'lastUpdated', e.target.value)}
                            />
                            <Button
                              onClick={() => handleRemoveInventoryItem('Movable', subAssetIndex, 'consumables', itemIndex)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Spare Parts */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          Spare Parts
                        </h4>
                        <Button
                          onClick={() => handleAddInventoryItem('Movable', subAssetIndex, 'spareParts')}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {subAsset.inventory.spareParts.map((item, itemIndex) => (
                          <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <Input
                              value={item.tagId || ''}
                              onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'spareParts', itemIndex, 'tagId', e.target.value)}
                              placeholder="Tag ID"
                              className="text-sm font-mono"
                            />
                            <Input
                              value={item.itemName}
                              onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'spareParts', itemIndex, 'itemName', e.target.value)}
                              placeholder="Item Name"
                            />
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'spareParts', itemIndex, 'quantity', parseInt(e.target.value) || 0)}
                              placeholder="Quantity"
                            />
                            <Select value={item.status} onValueChange={(value) => handleInventoryItemChange('Movable', subAssetIndex, 'spareParts', itemIndex, 'status', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Available">Available</SelectItem>
                                <SelectItem value="Low Stock">Low Stock</SelectItem>
                                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="date"
                              value={item.lastUpdated}
                              onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'spareParts', itemIndex, 'lastUpdated', e.target.value)}
                            />
                            <Button
                              onClick={() => handleRemoveInventoryItem('Movable', subAssetIndex, 'spareParts', itemIndex)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tools */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          Tools
                        </h4>
                        <Button
                          onClick={() => handleAddInventoryItem('Movable', subAssetIndex, 'tools')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {subAsset.inventory.tools.map((item, itemIndex) => (
                          <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <Input
                              value={item.tagId || ''}
                              onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'tools', itemIndex, 'tagId', e.target.value)}
                              placeholder="Tag ID"
                              className="text-sm font-mono"
                            />
                            <Input
                              value={item.itemName}
                              onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'tools', itemIndex, 'itemName', e.target.value)}
                              placeholder="Item Name"
                            />
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'tools', itemIndex, 'quantity', parseInt(e.target.value) || 0)}
                              placeholder="Quantity"
                            />
                            <Select value={item.status} onValueChange={(value) => handleInventoryItemChange('Movable', subAssetIndex, 'tools', itemIndex, 'status', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Available">Available</SelectItem>
                                <SelectItem value="Low Stock">Low Stock</SelectItem>
                                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="date"
                              value={item.lastUpdated}
                              onChange={(e) => handleInventoryItemChange('Movable', subAssetIndex, 'tools', itemIndex, 'lastUpdated', e.target.value)}
                            />
                            <Button
                              onClick={() => handleRemoveInventoryItem('Movable', subAssetIndex, 'tools', itemIndex)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Immovable Assets Inventory */}
              {newAsset.subAssets?.immovable && newAsset.subAssets.immovable.length > 0 && (
                newAsset.subAssets.immovable.map((subAsset, subAssetIndex) => (
                  <div key={subAsset.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Building className="w-5 h-5 text-blue-600" />
                      {subAsset.assetName || `Immovable Asset #${subAssetIndex + 1}`}
                    </h3>

                    {/* Consumables */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          Consumables
                        </h4>
                        <Button
                          onClick={() => handleAddInventoryItem('Immovable', subAssetIndex, 'consumables')}
                          variant="outline"
                          size="sm"
                          className="bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {subAsset.inventory.consumables.map((item, itemIndex) => (
                          <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <Input
                              value={item.tagId || ''}
                              onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'consumables', itemIndex, 'tagId', e.target.value)}
                              placeholder="Tag ID"
                              className="text-sm font-mono"
                            />
                            <Input
                              value={item.itemName}
                              onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'consumables', itemIndex, 'itemName', e.target.value)}
                              placeholder="Item Name"
                            />
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'consumables', itemIndex, 'quantity', parseInt(e.target.value))}
                              placeholder="Quantity"
                            />
                            <Select
                              value={item.status}
                              onValueChange={(value) => handleInventoryItemChange('Immovable', subAssetIndex, 'consumables', itemIndex, 'status', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Available">Available</SelectItem>
                                <SelectItem value="Low Stock">Low Stock</SelectItem>
                                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="date"
                              value={item.lastUpdated}
                              onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'consumables', itemIndex, 'lastUpdated', e.target.value)}
                            />
                            <Button
                              onClick={() => handleRemoveInventoryItem('Immovable', subAssetIndex, 'consumables', itemIndex)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Spare Parts */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          Spare Parts
                        </h4>
                        <Button
                          onClick={() => handleAddInventoryItem('Immovable', subAssetIndex, 'spareParts')}
                          variant="outline"
                          size="sm"
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {subAsset.inventory.spareParts.map((item, itemIndex) => (
                          <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <Input
                              value={item.tagId || ''}
                              onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'spareParts', itemIndex, 'tagId', e.target.value)}
                              placeholder="Tag ID"
                              className="text-sm font-mono"
                            />
                            <Input
                              value={item.itemName}
                              onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'spareParts', itemIndex, 'itemName', e.target.value)}
                              placeholder="Item Name"
                            />
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'spareParts', itemIndex, 'quantity', parseInt(e.target.value))}
                              placeholder="Quantity"
                            />
                            <Select
                              value={item.status}
                              onValueChange={(value) => handleInventoryItemChange('Immovable', subAssetIndex, 'spareParts', itemIndex, 'status', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Available">Available</SelectItem>
                                <SelectItem value="Low Stock">Low Stock</SelectItem>
                                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="date"
                              value={item.lastUpdated}
                              onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'spareParts', itemIndex, 'lastUpdated', e.target.value)}
                            />
                            <Button
                              onClick={() => handleRemoveInventoryItem('Immovable', subAssetIndex, 'spareParts', itemIndex)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tools */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          Tools
                        </h4>
                        <Button
                          onClick={() => handleAddInventoryItem('Immovable', subAssetIndex, 'tools')}
                          variant="outline"
                          size="sm"
                          className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {subAsset.inventory.tools.map((item, itemIndex) => (
                          <div key={itemIndex} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                            <Input
                              value={item.tagId || ''}
                              onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'tools', itemIndex, 'tagId', e.target.value)}
                              placeholder="Tag ID"
                              className="text-sm font-mono"
                            />
                            <Input
                              value={item.itemName}
                              onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'tools', itemIndex, 'itemName', e.target.value)}
                              placeholder="Item Name"
                            />
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'tools', itemIndex, 'quantity', parseInt(e.target.value))}
                              placeholder="Quantity"
                            />
                            <Select
                              value={item.status}
                              onValueChange={(value) => handleInventoryItemChange('Immovable', subAssetIndex, 'tools', itemIndex, 'status', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Available">Available</SelectItem>
                                <SelectItem value="Low Stock">Low Stock</SelectItem>
                                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="date"
                              value={item.lastUpdated}
                              onChange={(e) => handleInventoryItemChange('Immovable', subAssetIndex, 'tools', itemIndex, 'lastUpdated', e.target.value)}
                            />
                            <Button
                              onClick={() => handleRemoveInventoryItem('Immovable', subAssetIndex, 'tools', itemIndex)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            {currentStep !== 'main' && (
              <Button
                onClick={() => setCurrentStep(currentStep === 'subassets' ? 'main' : 'subassets')}
                variant="outline"
                className="px-4 py-2"
              >
                Previous
              </Button>
            )}
          </div>
         
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="px-4 py-2"
            >
              Cancel
            </Button>
           
            {currentStep === 'main' ? (
              <Button
                onClick={handleMainAssetSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next: Add Sub-Assets
              </Button>
            ) : null}
           
            {currentStep === 'subassets' && (
              <Button
                onClick={() => setCurrentStep('inventory')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next: Add Inventory
              </Button>
            )}
           
            {currentStep === 'inventory' && (
              <Button
                onClick={handleFinalSave}
                data-testid="save-button"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
              >
                Save Complete Asset
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

