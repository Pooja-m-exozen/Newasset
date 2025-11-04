"use client"

import React from 'react'
import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuth } from '@/contexts/AuthContext'

// Import hooks
import { useAssetData } from './hooks/useAssetData'
import { useAssetState } from './hooks/useAssetState'
import { useAssetEffects } from './hooks/useAssetEffects'
import { useAssetHandlers } from './hooks/useAssetHandlers'

// Import utilities
import { getFilteredAssets } from './utils/asset-helpers'

// Import components
import { AssetTables } from './components/AssetTables'
import { SearchFilters } from './components/SearchFilters'
import { SuccessNotification } from './components/SuccessNotification'
import { FlowchartModal, QRCodeModal, ManagementModals, SubAssetDetailsModal, AddAssetModal } from './components/modals'

export default function AdminAssetsPage() {
  const { user } = useAuth()
  
  // Use asset state hook
  const state = useAssetState(user)
  const {
    searchTerm,
    setSearchTerm,
    selectedMobility,
    setSelectedMobility,
    loading,
    expandedRow,
    setExpandedRow,
    expandedClassificationType,
    setExpandedClassificationType,
    selectedInventoryType,
    setSelectedInventoryType,
    showSuccess,
    setShowSuccess,
    successMessage,
    showFlowchartModal,
    setShowFlowchartModal,
    selectedAssetForFlowchart,
    setSelectedAssetForFlowchart,
    showAddAssetModal,
    setShowAddAssetModal,
    showPOModal,
    setShowPOModal,
    showReplacementModal,
    setShowReplacementModal,
    showLifecycleModal,
    setShowLifecycleModal,
    showSubAssetDetailsModal,
    setShowSubAssetDetailsModal,
    selectedSubAssetForDetails,
    setSelectedSubAssetForDetails,
    showFinancialModal,
    setShowFinancialModal,
    selectedAssetForManagement,
    setSelectedAssetForManagement,
    selectedSubAssetForManagement,
    setSelectedSubAssetForManagement,
    showQRModal,
    setShowQRModal,
    selectedQRData,
    setSelectedQRData,
    locations,
    setLocations,
    loadingLocations,
    setLoadingLocations,
    selectedLocationId,
    setSelectedLocationId,
    selectedLocationName,
    setSelectedLocationName,
    newAsset,
    setNewAsset,
    mainAssetInventory,
    setMainAssetInventory,
    currentStep,
    setCurrentStep,
    locationType,
    setLocationType,
    assetTypeCode,
    setAssetTypeCode,
    poData,
    setPOData,
    replacementData,
    setReplacementData,
    lifecycleData,
    setLifecycleData,
    financialData,
    setFinancialData
  } = state

  // Use asset data hook with current search and mobility filters
  const { assets, loading: assetsLoading, error, fetchAssets } = useAssetData(user, searchTerm, selectedMobility)

  // Use asset effects hook
  useAssetEffects({
    user,
    showAddAssetModal,
    setLocations,
    setLoadingLocations,
    setSelectedLocationId,
    setSelectedLocationName,
    searchTerm,
    selectedMobility,
    fetchAssets
  })

  // Use asset handlers hook
  const handlers = useAssetHandlers({
    user,
    assets,
    newAsset,
    setNewAsset,
    locationType,
    setLocationType,
    assetTypeCode,
    setAssetTypeCode,
    mainAssetInventory,
    setMainAssetInventory,
    expandedRow,
    setExpandedRow,
    expandedClassificationType,
    setExpandedClassificationType,
    selectedInventoryType,
    setSelectedInventoryType,
    selectedMobility,
    setSelectedMobility,
    setCurrentStep,
    setShowAddAssetModal,
    setShowFlowchartModal,
    setSelectedAssetForFlowchart,
    setShowSubAssetDetailsModal,
    setSelectedSubAssetForDetails,
    setShowPOModal,
    setShowReplacementModal,
    setShowLifecycleModal,
    setShowFinancialModal,
    setShowQRModal,
    setSelectedAssetForManagement,
    setSelectedSubAssetForManagement,
    setSelectedQRData,
    setShowSuccess,
    setSuccessMessage: state.setSuccessMessage,
    setLoading: state.setLoading,
    fetchAssets,
    locations,
    loadingLocations,
    setSelectedLocationId,
    setSelectedLocationName,
    setPOData,
    setReplacementData,
    setLifecycleData,
    setFinancialData,
    selectedAssetForManagement,
    selectedSubAssetForManagement,
    poData,
    replacementData,
    lifecycleData,
    financialData
  })

  const {
    handleMovableClick,
    handleImmovableClick,
    handleInventoryClick,
    handleRadioChange,
    handleViewFlowchart,
    handleViewSubAssetDetails,
    handleCloseFlowchartModal,
    handleAddAsset,
    handleCloseAddAssetModal,
    handleMainAssetSave,
    handleAddSubAsset,
    handleSubAssetChange,
    handleRemoveSubAsset,
    handleAddMainAssetInventoryItem,
    handleMainAssetInventoryItemChange,
    handleRemoveMainAssetInventoryItem,
    handleAddInventoryItem,
    handleInventoryItemChange,
    handleRemoveInventoryItem,
    handleFinalSave,
    handleInputChange,
    handleLocationSelect,
    handleOpenPOModal,
    handleOpenReplacementModal,
    handleOpenLifecycleModal,
    handleQRCodeClick,
    handleSavePO,
    handleSaveReplacement,
    handleSaveLifecycle,
    handleSaveFinancial
  } = handlers

  const filteredAssets = getFilteredAssets(assets, selectedMobility)

  return (
    <ProtectedRoute>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0px); }
        }
      `}</style>
      <div className="min-h-screen bg-background transition-colors duration-200">
        <div className="p-0">
          <div className="w-full">
            {/* Search and Filters */}
            <SearchFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedMobility={selectedMobility}
              onMobilityChange={handleRadioChange}
              onAddAsset={handleAddAsset}
            />

            {/* Success Notification */}
            <SuccessNotification
              show={showSuccess}
              message={successMessage}
              onClose={() => setShowSuccess(false)}
            />

            {/* Loading State */}
            {(loading || assetsLoading) && (
              <div className="bg-background rounded-lg shadow-sm border border-border p-8">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-muted-foreground">Loading assets...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-background rounded-lg shadow-sm border border-border p-8">
                <div className="text-center">
                  <div className="text-red-600 mb-2">⚠️ Error loading assets</div>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <button onClick={fetchAssets} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Asset Tables */}
            <AssetTables
              selectedMobility={selectedMobility}
              filteredAssets={filteredAssets}
              searchTerm={searchTerm}
              expandedRow={expandedRow}
              expandedClassificationType={expandedClassificationType}
              selectedInventoryType={selectedInventoryType}
              onViewSubAssetDetails={handleViewSubAssetDetails}
              onQRCodeClick={handleQRCodeClick}
              onMovableClick={handleMovableClick}
              onImmovableClick={handleImmovableClick}
              onViewFlowchart={handleViewFlowchart}
              onInventoryClick={handleInventoryClick}
              onOpenPOModal={handleOpenPOModal}
              onOpenReplacementModal={handleOpenReplacementModal}
              onOpenLifecycleModal={handleOpenLifecycleModal}
            />

            {/* Flowchart Modal */}
            <FlowchartModal
              isOpen={showFlowchartModal}
              onClose={handleCloseFlowchartModal}
              asset={selectedAssetForFlowchart}
            />

            {/* Sub Asset Details Modal */}
            <SubAssetDetailsModal
              isOpen={showSubAssetDetailsModal}
              onClose={() => setShowSubAssetDetailsModal(false)}
              subAsset={selectedSubAssetForDetails}
              onOpenPOModal={handleOpenPOModal}
              onOpenReplacementModal={handleOpenReplacementModal}
              onOpenLifecycleModal={handleOpenLifecycleModal}
              onQRCodeClick={handleQRCodeClick}
              onInventoryClick={handleInventoryClick}
            />

            {/* Add Asset Modal */}
            <AddAssetModal
              isOpen={showAddAssetModal}
              onClose={handleCloseAddAssetModal}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              newAsset={newAsset}
              setNewAsset={setNewAsset}
              locationType={locationType}
              setLocationType={setLocationType}
              assetTypeCode={assetTypeCode}
              setAssetTypeCode={setAssetTypeCode}
              mainAssetInventory={mainAssetInventory}
              locations={locations}
              loadingLocations={loadingLocations}
              selectedLocationId={selectedLocationId}
              selectedLocationName={selectedLocationName}
              user={user}
              assets={assets}
              handleInputChange={handleInputChange}
              handleLocationSelect={handleLocationSelect}
              handleAddSubAsset={handleAddSubAsset}
              handleSubAssetChange={handleSubAssetChange}
              handleRemoveSubAsset={handleRemoveSubAsset}
              handleAddMainAssetInventoryItem={handleAddMainAssetInventoryItem}
              handleMainAssetInventoryItemChange={handleMainAssetInventoryItemChange}
              handleRemoveMainAssetInventoryItem={handleRemoveMainAssetInventoryItem}
              handleAddInventoryItem={handleAddInventoryItem}
              handleInventoryItemChange={handleInventoryItemChange}
              handleRemoveInventoryItem={handleRemoveInventoryItem}
              handleMainAssetSave={handleMainAssetSave}
              handleFinalSave={handleFinalSave}
            />

            {/* Enhanced Asset Management Modals */}
            <ManagementModals
              showPOModal={showPOModal}
              poData={poData}
              onPODataChange={setPOData}
              onClosePO={() => setShowPOModal(false)}
              onSavePO={handleSavePO}
              loading={loading}
              showReplacementModal={showReplacementModal}
              replacementData={replacementData}
              onReplacementDataChange={setReplacementData}
              onCloseReplacement={() => setShowReplacementModal(false)}
              onSaveReplacement={handleSaveReplacement}
              showLifecycleModal={showLifecycleModal}
              lifecycleData={lifecycleData}
              onLifecycleDataChange={setLifecycleData}
              onCloseLifecycle={() => setShowLifecycleModal(false)}
              onSaveLifecycle={handleSaveLifecycle}
              showFinancialModal={showFinancialModal}
              financialData={financialData}
              onFinancialDataChange={setFinancialData}
              onCloseFinancial={() => setShowFinancialModal(false)}
              onSaveFinancial={handleSaveFinancial}
              selectedAsset={selectedAssetForManagement}
              selectedSubAsset={selectedSubAssetForManagement}
            />

            {/* QR Code Modal */}
            <QRCodeModal
              isOpen={showQRModal}
              onClose={() => setShowQRModal(false)}
              qrData={selectedQRData}
            />

          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
