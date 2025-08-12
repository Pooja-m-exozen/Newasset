import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Badge } from './badge';
import { StatusBadge } from './status-badge';
import { PriorityBadge } from './priority-badge';
import { Calendar, MapPin, Tag, Package, X, QrCode, Download, Copy, Hash, Clock, Info, Building, Database, Activity, Scan, Loader2, Camera, CameraOff, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { Asset } from '../../lib/adminasset';
import { Button } from './button';
import Image from 'next/image';
import { ScrollArea } from './scroll-area';

interface AssetViewModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onAssetUpdated?: (updatedAsset: Asset) => void;
}

// Utility functions
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid Date';
  }
};

const formatTimestamp = (timestamp: number) => {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return 'Invalid Timestamp';
  }
};

// Compact Info Card Component
const InfoCard = ({ icon: Icon, title, value, bgColor = "from-slate-500 to-slate-600" }: {
  icon: React.ElementType;
  title: string;
  value: string;
  bgColor?: string;
}) => (
  <div className="flex items-center gap-2.5 p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/60 dark:border-slate-600/60 shadow-sm">
    <div className={`p-2 rounded-lg bg-gradient-to-br ${bgColor}`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{value}</p>
    </div>
  </div>
);

// Compact Detail Row Component
const DetailRow = ({ label, value, bgColor = "from-slate-50 to-blue-50" }: {
  label: string;
  value: string;
  bgColor?: string;
}) => (
  <div className={`flex justify-between py-2.5 px-3 bg-gradient-to-r ${bgColor} dark:from-slate-700 dark:to-blue-900/20 rounded-lg border border-slate-200/60 dark:border-slate-600/60`}>
    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</span>
    <span className="text-xs text-slate-900 dark:text-white font-medium truncate max-w-[120px]">{value}</span>
  </div>
);

export const AssetViewModal: React.FC<AssetViewModalProps> = ({
  asset,
  isOpen,
  onClose,
  onAssetUpdated
}) => {
  const [showScanner, setShowScanner] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrGenerationError, setQrGenerationError] = useState<string | null>(null);
  const [qrGenerationSuccess, setQrGenerationSuccess] = useState(false);
  const [scanningQR, setScanningQR] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [savingScannedData, setSavingScannedData] = useState(false);

  // Refs for video and canvas
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const API_BASE_URL = 'http://192.168.0.5:5021';
  const hasDigitalAssets = asset?.digitalAssets?.qrCode;
  const qrCodeData = asset?.digitalAssets?.qrCode?.data;



  const handleCopyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, []);

  const handleDownloadQR = useCallback(async () => {
    if (!hasDigitalAssets || !asset?.digitalAssets?.qrCode?.url) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}${asset.digitalAssets.qrCode.url}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR_${qrCodeData?.t || asset?.tagId}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download QR Code:', err);
    }
  }, [hasDigitalAssets, asset?.digitalAssets?.qrCode?.url, qrCodeData?.t, asset?.tagId]);

  // Function to refresh asset data to ensure we have the latest information
  const refreshAssetData = useCallback(async () => {
    if (!asset?._id) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/${asset._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.asset) {
          // Update the asset in the parent component if callback exists
          if (onAssetUpdated) {
            onAssetUpdated(data.asset as Asset);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing asset data:', error);
    }
  }, [asset?._id, onAssetUpdated]);

  const handleGenerateQR = async () => {
    if (!asset?._id) return;
    
    setGeneratingQR(true);
    setQrGenerationError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/digital-assets/qr/${asset._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.qrCode) {
          // Map backend qrCode to our typed interface shape
          const mappedQrCode = {
            url: data.qrCode.url as string,
            data: {
              t: data.qrCode.data.t,
              a: data.qrCode.data.a,
              s: data.qrCode.data.s,
              b: data.qrCode.data.b,
              m: data.qrCode.data.m,
              st: data.qrCode.data.st,
              p: data.qrCode.data.p,
              l: data.qrCode.data.l,
              u: data.qrCode.data.u,
              pr: data.qrCode.data.pr,
              lm: data.qrCode.data.lm ?? null,
              nm: data.qrCode.data.nm ?? null,
              url: data.qrCode.data.url,
              ts: data.qrCode.data.ts,
              c: data.qrCode.data.c,
            },
            generatedAt: new Date().toISOString(),
          } as const;

          const updatedAsset: Asset = {
            ...asset,
            digitalAssets: {
              ...asset.digitalAssets,
              qrCode: mappedQrCode,
            },
          };

          // Immediately update the local asset state to show the QR code
          // This ensures the view modal shows the QR code immediately without needing to refresh
          if (onAssetUpdated) {
            onAssetUpdated(updatedAsset);
          }
          
          // Also update the local asset state for immediate display
          // This is a workaround to ensure the modal shows the updated data immediately
          const currentAsset = asset;
          Object.assign(currentAsset, updatedAsset);
          
          // Force a re-render by updating a state variable
          setGeneratingQR(false);
          setQrGenerationSuccess(true);
          
          // Show success message briefly
          setTimeout(() => {
            setQrGenerationSuccess(false);
          }, 1000);
          
        } else {
          setQrGenerationError(data.message || 'Failed to generate QR code');
        }
      } else {
        setQrGenerationError('Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      setQrGenerationError('Network error while generating QR code');
    } finally {
      setGeneratingQR(false);
    }
  };

  // QR Scanner Functions
  const startCamera = async () => {
    try {
      setScannerError(null);
      setScanningQR(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Start scanning for QR codes
        startQRScanning();
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      setScannerError('Failed to access camera. Please check permissions.');
      setScanningQR(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanningQR(false);
  };

  const startQRScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;
    
    const scanFrame = () => {
      if (!scanningQR) return;
      
      try {
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
          requestAnimationFrame(scanFrame);
          return;
        }
        
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          requestAnimationFrame(scanFrame);
          return;
        }
        
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get image data for QR detection
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Simple QR code detection (you can integrate a proper QR library here)
        // For now, we'll simulate detection for testing purposes
        detectQRCode(imageData);
        
        // Continue scanning
        requestAnimationFrame(scanFrame);
      } catch (error) {
        console.error('Error scanning frame:', error);
        requestAnimationFrame(scanFrame);
      }
    };
    
    scanFrame();
  };

  // Disable simulated detection; real scanning integration can be added later
  const detectQRCode = (_imageData: ImageData) => {
    // Intentionally left blank to avoid mock scans
  };

  const simulateQRScan = () => {
    // Disabled mock scanning
  };

  const saveScannedData = async () => {
    if (!scannedData || !asset?._id) return;
    
    setSavingScannedData(true);
    
    try {
      // Create the QR code data structure to save
      const qrCodeData = {
        url: `/uploads/digital-assets/qr_${asset.tagId}_${Date.now()}.png`,
        data: scannedData,
        generatedAt: new Date().toISOString(),
      };
      
      // Update the asset with the scanned QR data via backend
      const response = await fetch(`${API_BASE_URL}/api/assets/${asset._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          digitalAssets: {
            qrCode: qrCodeData
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.asset) {
          if (onAssetUpdated) onAssetUpdated(data.asset as Asset);
          closeScanner();
        } else {
          setScannerError('Failed to save QR code data');
        }
      } else {
        setScannerError('Failed to save QR code data');
      }
    } catch (error) {
      console.error('Error saving QR code data:', error);
      setScannerError('Network error while saving QR code data');
    } finally {
      setSavingScannedData(false);
    }
  };

  const closeScanner = () => {
    stopCamera();
    setShowScanner(false);
    setScannedData(null);
    setScannerError(null);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Auto-refresh asset data when modal opens to show latest information
  useEffect(() => {
    if (isOpen && asset?._id) {
      // Reset any previous states
      setQrGenerationSuccess(false);
      setQrGenerationError(null);
      setGeneratingQR(false);
      
      // Check if asset has a QR code and show success state briefly
      if (asset?.digitalAssets?.qrCode) {
        setQrGenerationSuccess(true);
        // Hide success message after 2 seconds
        setTimeout(() => {
          setQrGenerationSuccess(false);
        }, 2000);
      }
      
      // Refresh asset data to ensure we have the latest information
      // This is especially important when opening the modal after asset creation
      refreshAssetData();
    }
  }, [isOpen, asset?._id, asset?.digitalAssets?.qrCode, refreshAssetData]);

  if (!asset) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 bg-white dark:bg-slate-900 border-0 shadow-2xl overflow-hidden">
        {/* Compact Header */}
        <DialogHeader className="px-6 py-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-blue-900/20 dark:to-indigo-900/20 border-b border-slate-200/60 dark:border-slate-700/60">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-slate-900"></div>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                  Asset Details
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-800/60 px-2 py-1 rounded-full border border-slate-200/60 dark:border-slate-600/60">
                    {asset?.tagId || 'Unknown Asset'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={asset?.status || 'active'} />
                    <PriorityBadge priority={asset?.priority || 'medium'} />
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-white/80 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Main Content */}
        <ScrollArea className="flex-1 h-[calc(85vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Compact Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-slate-800 dark:via-slate-900 dark:to-blue-900/20 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full -translate-y-12 translate-x-12"></div>
              <div className="relative z-10">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <InfoCard icon={Tag} title="Asset Type" value={asset?.assetType || 'N/A'} bgColor="from-blue-500 to-blue-600" />
                  {asset?.brand && (
                    <InfoCard icon={Package} title="Brand" value={asset.brand} bgColor="from-green-500 to-emerald-600" />
                  )}
                  <InfoCard icon={Building} title="Location" value={asset?.location?.building || asset?.location?.floor || asset?.location?.room || 'N/A'} bgColor="from-indigo-500 to-purple-600" />
                  <InfoCard icon={Calendar} title="Created" value={asset?.createdAt ? formatDate(asset.createdAt) : 'N/A'} bgColor="from-orange-500 to-red-600" />
                </div>
                
                {asset?.notes && (
                  <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-600/60">
                    <div className="flex items-start gap-2.5 p-3 bg-amber-50/80 dark:bg-amber-900/30 backdrop-blur-sm rounded-xl border border-amber-200/60 dark:border-amber-700/60">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 mt-0.5">
                        <Info className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-1">Notes</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 italic line-clamp-2">"{asset.notes}"</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Compact Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Asset Information */}
              <div className="space-y-4">
                {/* Asset Information Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-4 shadow-lg">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600">
                      <Database className="w-4 h-4 text-white" />
                    </div>
                    Asset Information
                  </h4>
                  <div className="space-y-2">
                    <DetailRow label="Asset ID" value={asset?._id || 'N/A'} />
                    {asset?.serialNumber && (
                      <DetailRow label="Serial Number" value={asset.serialNumber} bgColor="from-slate-50 to-green-50" />
                    )}
                    {asset?.model && (
                      <DetailRow label="Model" value={asset.model} bgColor="from-slate-50 to-purple-50" />
                    )}
                  </div>
                </div>

                {/* Tags Card */}
                {asset?.tags && asset.tags.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-4 shadow-lg">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {asset.tags.map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-700/60 px-2 py-1 rounded-lg font-medium"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - QR Code */}
              <div className="space-y-4">
                {/* QR Code Section */}
                {hasDigitalAssets && qrCodeData ? (
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-4 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                          <QrCode className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">QR Code</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Scan to access asset information</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowScanner(true)}
                        className="h-8 px-3 border-blue-300/60 dark:border-blue-600/60 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 hover:scale-105 text-xs"
                      >
                        <Scan className="w-3.5 h-3.5 mr-1.5" />
                        Scanner
                      </Button>
                    </div>

                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <div className="w-48 h-48 rounded-2xl border-3 border-dashed border-blue-300/60 dark:border-blue-600/60 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center shadow-lg">
                          {asset?.digitalAssets?.qrCode?.url && (
                            <Image
                              src={`${API_BASE_URL}${asset.digitalAssets.qrCode.url}`}
                              alt={`QR Code for ${asset?.tagId || 'Asset'}`}
                              width={192}
                              height={192}
                              className="object-contain rounded-xl"
                              priority={true}
                            />
                          )}
                        </div>
                        {/* Decorative corner elements */}
                        <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg"></div>
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg"></div>
                        <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg"></div>
                        <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg"></div>
                      </div>
                    </div>

                    <div className="flex justify-center gap-2 mb-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleDownloadQR} 
                        className="h-8 px-3 border-slate-200/60 dark:border-slate-600/60 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 hover:scale-105 text-xs"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyToClipboard(qrCodeData.t || asset?.tagId || '')}
                        className="h-8 px-3 border-slate-200/60 dark:border-slate-600/60 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 hover:scale-105 text-xs"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy Tag ID
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyToClipboard(qrCodeData.url || qrCodeData.u || '')}
                        className="h-8 px-3 border-slate-200/60 dark:border-slate-600/60 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 hover:scale-105 text-xs"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy URL
                      </Button>
                    </div>

                    {/* Compact QR Code Details Grid */}
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-3 border border-blue-200/60 dark:border-blue-700/60 shadow-sm">
                        <h5 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5" /> Asset Details
                        </h5>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between"><span className="text-blue-600 dark:text-blue-400">Type</span><span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{qrCodeData.a || asset?.assetType || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-blue-600 dark:text-blue-400">Brand</span><span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{qrCodeData.b || asset?.brand || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-blue-600 dark:text-blue-400">Model</span><span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{qrCodeData.m || asset?.model || 'N/A'}</span></div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-3 border border-green-200/60 dark:border-green-700/60 shadow-sm">
                        <h5 className="text-xs font-bold text-green-700 dark:text-green-300 mb-2 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" /> Location
                        </h5>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between"><span className="text-green-600 dark:text-green-400">Building</span><span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{qrCodeData.l?.building || asset?.location?.building || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-green-600 dark:text-green-400">Floor</span><span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{qrCodeData.l?.floor || asset?.location?.floor || 'N/A'}</span></div>
                          <div className="flex justify-between"><span className="text-green-600 dark:text-green-400">Project</span><span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{qrCodeData.pr || asset?.projectName || 'N/A'}</span></div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-3 border border-purple-200/60 dark:border-purple-700/60 shadow-sm">
                        <h5 className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> Technical
                        </h5>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-center"><span className="text-purple-600 dark:text-purple-400">Generated</span><span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{qrCodeData.ts ? formatTimestamp(qrCodeData.ts) : 'N/A'}</span></div>
                          <div className="flex justify-between items-center"><span className="text-purple-600 dark:text-purple-400">Checksum</span><span className="font-mono font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">{qrCodeData.c || 'N/A'}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/60 dark:border-amber-700/60 rounded-xl p-6 text-center shadow-lg">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-xl border-2 border-dashed border-amber-300/60 dark:border-amber-600/60 flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                      {generatingQR ? (
                        <Loader2 className="w-8 h-8 text-amber-500 dark:text-amber-400 animate-spin" />
                      ) : qrGenerationSuccess ? (
                        <CheckCircle className="w-8 h-8 text-green-500 dark:text-green-400" />
                      ) : (
                        <QrCode className="w-8 h-8 text-amber-500 dark:text-amber-400" />
                      )}
                    </div>
                    <h4 className="text-base font-bold text-amber-800 dark:text-amber-200 mb-1.5">
                      {generatingQR ? 'Generating QR Code...' : 
                       qrGenerationSuccess ? 'QR Code Generated!' : 'No QR Code Available'}
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mb-4 max-w-xs mx-auto">
                      {generatingQR 
                        ? 'Please wait while we generate your QR code. This may take a few seconds.'
                        : qrGenerationSuccess
                        ? 'Your QR code has been generated successfully and is now available above.'
                        : 'Generate a QR code to enable quick access and digital asset management.'
                      }
                    </p>
                    
                    {qrGenerationError && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                        <p className="text-xs text-red-700 dark:text-red-300">{qrGenerationError}</p>
                      </div>
                    )}
                    
                    {qrGenerationSuccess && (
                      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                            QR Code generated successfully! Check above to view and download.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 px-4 border-amber-300/60 dark:border-amber-600/60 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all duration-200 hover:scale-105 text-xs" 
                      onClick={handleGenerateQR}
                      disabled={generatingQR}
                    >
                      {generatingQR ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                      <QrCode className="w-3.5 h-3.5 mr-1.5" />
                      Generate QR Code
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Compact Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-blue-900/20 dark:to-indigo-900/20 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <Database className="w-3.5 h-3.5" />
              Asset ID: {asset?._id || 'N/A'}
            </div>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
            <div className="text-xs text-slate-500 dark:text-slate-500">
              Last updated: {asset?.updatedAt ? formatDate(asset.updatedAt) : 'Unknown'}
            </div>
          </div>
          <Button 
            onClick={onClose} 
            className="bg-gradient-to-r from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 hover:from-slate-700 hover:to-slate-800 dark:hover:from-slate-600 dark:hover:to-slate-700 text-white px-6 h-9 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 text-sm"
          >
            Close
          </Button>
        </div>
      </DialogContent>

      {/* QR Scanner Modal */}
      {showScanner && (
        <Dialog open={showScanner} onOpenChange={closeScanner}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Scan className="w-5 h-5 text-blue-600" />
                QR Code Scanner
              </DialogTitle>
            </DialogHeader>
            <div className="p-4">
              {!scanningQR && !scannedData && (
                <div className="text-center mb-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Click Start Camera to begin scanning for QR codes
                  </p>
                  <Button
                    onClick={startCamera}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </Button>
                </div>
              )}

              {scanningQR && (
                <div className="space-y-4">
                  <div className="relative w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    
                    {/* Scanner overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 w-48 h-48 border-2 border-blue-500 rounded-lg -translate-x-1/2 -translate-y-1/2">
                        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-blue-500"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-blue-500"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-blue-500"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-blue-500"></div>
                      </div>
                    </div>
                    
                    {/* Scanning indicator */}
                    <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Scanning...
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={stopCamera}
                      className="border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Stop Camera
                    </Button>
                  </div>
                </div>
              )}

              {scannedData && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          QR Code Scanned Successfully!
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          Found QR code for asset: {scannedData.t}
                        </p>
                      </div>
                    </div>
                    
                    {/* Scanned Data Preview */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                      <h5 className="text-xs font-bold text-green-700 dark:text-green-300 mb-2">Scanned Data:</h5>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-green-600 dark:text-green-400">Tag ID:</span>
                          <span className="font-mono">{scannedData.t}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600 dark:text-green-400">Type:</span>
                          <span>{scannedData.a}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600 dark:text-green-400">Brand:</span>
                          <span>{scannedData.b}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600 dark:text-green-400">Model:</span>
                          <span>{scannedData.m}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={saveScannedData}
                      disabled={savingScannedData}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {savingScannedData ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save QR Code Data
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setScannedData(null);
                        setScannerError(null);
                      }}
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      Scan Again
                    </Button>
                  </div>
                </div>
              )}

              {scannerError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-700 dark:text-red-300">{scannerError}</p>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  onClick={closeScanner}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  Close Scanner
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};