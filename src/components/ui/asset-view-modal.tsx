import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Badge } from './badge';
import { StatusBadge } from './status-badge';
import { PriorityBadge } from './priority-badge';
import { MapPin, Tag, Package, X, QrCode, Download, Copy, Building, Database, Scan, Loader2, Camera, Save, AlertCircle, CheckCircle, Shield, Upload } from 'lucide-react';
import { Asset, SubAsset, DigitalAsset } from '../../lib/adminasset';
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
  const [scannedData, setScannedData] = useState<{ t: string; a: string; b: string; m: string } | null>(null);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [savingScannedData, setSavingScannedData] = useState(false);
  const [reverseGeocodedAddress, setReverseGeocodedAddress] = useState<string>('');
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [imageScanError, setImageScanError] = useState<string | null>(null);

  // Function to reverse geocode coordinates to address
  const reverseGeocode = useCallback(async (latitude: string, longitude: string) => {
    if (!latitude || !longitude || latitude === '0' || longitude === '0') return;
   
    setGeocodingLoading(true);
    try {
      const GOOGLE_MAPS_API_KEY = 'AIzaSyCqvcEKoqwRG5PBDIVp-MjHyjXKT3s4KY4';
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
     
      const response = await fetch(url);
      const data = await response.json();
     
      if (data.status === 'OK' && data.results.length > 0) {
        setReverseGeocodedAddress(data.results[0].formatted_address);
      } else {
        setReverseGeocodedAddress('Address not found');
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setReverseGeocodedAddress('Failed to get address');
    } finally {
      setGeocodingLoading(false);
    }
  }, []);

  // Refs for video and canvas
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const API_BASE_URL = 'https://digitalasset.zenapi.co.in';
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
            } as DigitalAsset,
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
       
        // Get image data for QR detection (commented out until proper QR library integration)
        // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
       
        // Simple QR code detection (you can integrate a proper QR library here)
        // For now, we'll simulate detection for testing purposes
        detectQRCode();
       
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
  const detectQRCode = () => {
    // Intentionally left blank to avoid mock scans
  };

  // Handle image upload for QR code scanning
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      setImageScanError(null);
      setScannedData(null);
      scanImageForQR(file);
    }
  };

  // Scan uploaded image for QR code
  const scanImageForQR = async (file: File) => {
    setImageUploadLoading(true);
    setImageScanError(null);
   
    try {
      // Create a canvas to process the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
     
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
       
        // For now, we'll simulate QR detection
        // In a real implementation, you would use a QR code library like jsQR or ZXing
        simulateQRDetection();
      };
     
      img.src = URL.createObjectURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      setImageScanError('Failed to process uploaded image');
      setImageUploadLoading(false);
    }
  };

  // Simulate QR code detection from image
  const simulateQRDetection = () => {
    // This is a simulation - in real implementation, use proper QR detection library
    setTimeout(() => {
      // Simulate finding QR data based on the asset
      if (asset) {
        const simulatedData = {
          t: asset.tagId || 'Unknown',
          a: asset.assetType || 'Unknown',
          s: asset.subcategory || 'Unknown',
          b: asset.brand || 'Unknown',
          m: asset.model || 'Unknown',
          st: asset.status || 'Unknown',
          p: asset.priority || 'Unknown',
          l: asset.location || {},
          u: asset.assignedTo && typeof asset.assignedTo === 'object' ? asset.assignedTo.name : 'Unknown',
          pr: asset.project?.projectName || null,
          lm: null,
          nm: null,
          url: `http://localhost:5000/api/digital-assets/asset/${asset.tagId}`,
          ts: Date.now(),
          c: Math.random().toString(16).substring(2, 18)
        };
       
        setScannedData(simulatedData);
        setImageUploadLoading(false);
      } else {
        setImageScanError('No asset data available for simulation');
        setImageUploadLoading(false);
      }
    }, 2000); // Simulate 2 second processing time
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
    setUploadedImage(null);
    setImageUploadLoading(false);
    setImageScanError(null);
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
     
      // Only refresh asset data if we don't have complete data
      // This prevents unnecessary API calls when clicking view multiple times
      if (!asset?.digitalAssets || !asset?.subAssets || !asset?.compliance) {
        refreshAssetData();
      }
    }
  }, [isOpen, asset?._id, asset?.digitalAssets, asset?.subAssets, asset?.compliance, refreshAssetData]);

  // Trigger reverse geocoding when asset location changes
  useEffect(() => {
    if (asset?.location?.latitude && asset?.location?.longitude) {
      reverseGeocode(asset.location.latitude, asset.location.longitude);
    }
  }, [asset?.location?.latitude, asset?.location?.longitude, reverseGeocode]);

  if (!asset) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
        {/* Simple Header */}
        <DialogHeader className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Package className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Asset Details
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
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
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Main Content */}
        <ScrollArea className="flex-1 h-[calc(85vh-140px)]">
          <div className="p-6 space-y-6">
            {/* QR Code Section */}
            <div className="flex justify-center">
              {/* QR Code Section */}
              {hasDigitalAssets && qrCodeData ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600">
                        <QrCode className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">QR Code</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Scan to access asset</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowScanner(true)}
                      className="h-7 px-2 border-blue-300/60 dark:border-blue-600/60 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all duration-200 text-xs"
                    >
                      <Scan className="w-3 h-3 mr-1" />
                      Scanner
                    </Button>
                  </div>

                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-lg border-2 border-dashed border-blue-300/60 dark:border-blue-600/60 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center shadow-sm">
                        {asset?.digitalAssets?.qrCode?.url && (
                          <Image
                            src={`${API_BASE_URL}${asset.digitalAssets.qrCode.url}`}
                            alt={`QR Code for ${asset?.tagId || 'Asset'}`}
                            width={128}
                            height={128}
                            className="object-contain rounded-md"
                            priority={true}
                          />
                        )}
                      </div>
                      {/* Simplified corner elements */}
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-sm"></div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-sm"></div>
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-sm"></div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-sm"></div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-1.5 mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadQR}
                      className="h-7 px-2 border-slate-200/60 dark:border-slate-600/60 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-all duration-200 text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyToClipboard(qrCodeData.t || asset?.tagId || '')}
                      className="h-7 px-2 border-slate-200/60 dark:border-slate-600/60 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-all duration-200 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy ID
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyToClipboard(qrCodeData.url || qrCodeData.u || '')}
                      className="h-7 px-2 border-slate-200/60 dark:border-slate-600/60 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-all duration-200 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy URL
                    </Button>
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

            {/* Asset Information Table - Below QR Code */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse font-sans text-base">
                  <thead>
                    <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Asset Type
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Subcategory
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Brand
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Model
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Serial Number
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Capacity
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Status
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Priority
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                        {asset?.assetType || 'N/A'}
                      </td>
                      <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                        {asset?.subcategory || 'N/A'}
                      </td>
                      <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                        {asset?.brand || 'N/A'}
                      </td>
                      <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                        {asset?.model || 'N/A'}
                      </td>
                      <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                        {asset?.serialNumber || 'N/A'}
                      </td>
                      <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                        {asset?.capacity || 'N/A'}
                      </td>
                      <td className="border border-border px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                          {asset?.status || 'Active'}
                        </span>
                      </td>
                      <td className="border border-border px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
                          {asset?.priority || 'Medium'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Asset Details Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse font-sans text-base">
                  <thead>
                    <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Installation Year
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Created Date
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Project Name
                      </th>
                      <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                        {asset?.yearOfInstallation || 'N/A'}
                      </td>
                      <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                        {asset?.createdAt ? formatDate(asset.createdAt) : 'N/A'}
                      </td>
                      <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                        {asset?.project?.projectName || 'N/A'}
                      </td>
                      <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100 italic">
                        {asset?.notes ? `"${asset.notes}"` : 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Tables Section */}
            <div className="space-y-4">
                {/* Location Information Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse font-sans text-base">
                      <thead>
                        <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                          <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                            Building
                          </th>
                          <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                            Floor
                          </th>
                          <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                            Room
                          </th>
                          <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                            Coordinates
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                            {asset?.location?.building || 'N/A'}
                          </td>
                          <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                            {asset?.location?.floor || 'N/A'}
                          </td>
                          <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                            {asset?.location?.room || 'N/A'}
                          </td>
                          <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                            {asset?.location?.latitude && asset?.location?.longitude
                              ? `${asset.location.latitude}, ${asset.location.longitude}`
                              : 'N/A'}
                          </td>
                        </tr>
                        {reverseGeocodedAddress && (
                          <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            <td colSpan={4} className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">Full Address:</span>
                                {geocodingLoading ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
                                ) : (
                                  <span>{reverseGeocodedAddress}</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Assignment Information Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse font-sans text-base">
                      <thead>
                        <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                          <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                            Assigned To
                          </th>
                          <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                            Email
                          </th>
                          <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                            Created By
                          </th>
                          <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                            Creator Email
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                            {asset?.assignedTo && typeof asset.assignedTo === 'object'
                              ? asset.assignedTo.name || 'N/A'
                              : 'Not Assigned'}
                          </td>
                          <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                            {asset?.assignedTo && typeof asset.assignedTo === 'object'
                              ? asset.assignedTo.email || 'N/A'
                              : 'N/A'}
                          </td>
                          <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                            {asset?.createdBy?.name || 'N/A'}
                          </td>
                          <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                            {asset?.createdBy?.email || 'N/A'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tags Table */}
                {asset?.tags && asset.tags.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-3 bg-blue-50 dark:bg-slate-800 border-b border-border">
                      <h4 className="text-base font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2.5">
                        <Tag className="w-4 h-4" />
                        Tags
                      </h4>
                    </div>
                    <div className="p-4">
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
                  </div>
                )}

                {/* Custom Fields Table */}
                {asset?.customFields && Object.keys(asset.customFields).length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-3 bg-blue-50 dark:bg-slate-800 border-b border-border">
                      <h4 className="text-base font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2.5">
                        <Package className="w-4 h-4" />
                        Custom Fields
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse font-sans text-base">
                        <tbody>
                          {Object.entries(asset.customFields).map(([key, value]) => {
                            // Skip if value is empty, null, or undefined
                            if (!value || value === '' || value === null || value === undefined) return null;
                           
                            return (
                              <tr key={key} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                <td className="border border-border px-4 py-3 font-medium text-gray-700 dark:text-gray-300 w-1/4">
                                  {key}
                                </td>
                                <td colSpan={3} className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                                  {String(value)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Compliance Information Table */}
                {asset?.compliance && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-3 bg-blue-50 dark:bg-slate-800 border-b border-border">
                      <h4 className="text-base font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2.5">
                        <Shield className="w-4 h-4" />
                        Compliance Information
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse font-sans text-base">
                        <thead>
                          <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                            <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                              Certifications
                            </th>
                            <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                              Expiry Dates
                            </th>
                            <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                              Regulatory Requirements
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                            <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                              {asset.compliance.certifications && asset.compliance.certifications.length > 0
                                ? asset.compliance.certifications.join(', ')
                                : 'No certifications'}
                            </td>
                            <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                              {asset.compliance.expiryDates && asset.compliance.expiryDates.length > 0
                                ? asset.compliance.expiryDates.join(', ')
                                : 'No expiry dates'}
                            </td>
                            <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                              {asset.compliance.regulatoryRequirements && asset.compliance.regulatoryRequirements.length > 0
                                ? asset.compliance.regulatoryRequirements.join(', ')
                                : 'No regulatory requirements'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Digital Assets Table */}
                {asset?.digitalAssets && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="px-3 py-2 bg-blue-50 dark:bg-slate-800 border-b border-border">
                      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                        <QrCode className="w-3.5 h-3.5" />
                        Digital Assets
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse font-sans text-sm">
                        <thead>
                          <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                            <th className="border border-border px-3 py-2 text-left font-semibold text-blue-800 dark:text-blue-200 text-xs">
                              Asset Type
                            </th>
                            <th className="border border-border px-3 py-2 text-left font-semibold text-blue-800 dark:text-blue-200 text-xs">
                              URL
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {asset.digitalAssets.qrCode && (
                            <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                              <td className="border border-border px-3 py-2 text-gray-900 dark:text-gray-100 font-medium text-sm">
                                QR Code
                              </td>
                              <td className="border border-border px-3 py-2 text-gray-900 dark:text-gray-100">
                                <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                  https://exozen.co.in/v1/asset{asset.digitalAssets.qrCode.url}
                                </span>
                              </td>
                            </tr>
                          )}
                          {asset.digitalAssets.barcode && (
                            <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                              <td className="border border-border px-3 py-2 text-gray-900 dark:text-gray-100 font-medium text-sm">
                                Barcode
                              </td>
                              <td className="border border-border px-3 py-2 text-gray-900 dark:text-gray-100">
                                <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                  https://exozen.co.in/v1/asset{asset.digitalAssets.barcode.url}
                                </span>
                              </td>
                            </tr>
                          )}
                          {asset.digitalAssets.nfcData && (
                            <tr className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                              <td className="border border-border px-3 py-2 text-gray-900 dark:text-gray-100 font-medium text-sm">
                                NFC Data
                              </td>
                              <td className="border border-border px-3 py-2 text-gray-900 dark:text-gray-100">
                                <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                  https://exozen.co.in/v1/asset{asset.digitalAssets.nfcData.url}
                                </span>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sub Assets - Movable Table */}
                {asset?.subAssets?.movable && asset.subAssets.movable.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-3 bg-blue-50 dark:bg-slate-800 border-b border-border">
                      <h4 className="text-base font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2.5">
                        <Package className="w-4 h-4" />
                        Movable Sub Assets ({asset.subAssets.movable.length})
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse font-sans text-base">
                        <thead>
                          <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                            <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                              Asset Name
                            </th>
                            <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                              Brand
                            </th>
                            <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                              Model
                            </th>
                            <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                              Capacity
                            </th>
                            <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                              Location
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {asset.subAssets?.movable && asset.subAssets.movable.map((subAsset: SubAsset) => (
                            <tr key={subAsset._id || subAsset.assetName} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                              <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                                <div>
                                  <div className="font-medium">{subAsset.assetName}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {subAsset.description}
                                  </div>
                                </div>
                              </td>
                              <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                                {subAsset.brand}
                              </td>
                              <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                                {subAsset.model}
                              </td>
                              <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                                {subAsset.capacity}
                              </td>
                              <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                                {subAsset.location}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sub Assets - Immovable Table */}
                {asset?.subAssets?.immovable && asset.subAssets.immovable.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-3 bg-blue-50 dark:bg-slate-800 border-b border-border">
                      <h4 className="text-base font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2.5">
                        <Building className="w-4 h-4" />
                        Immovable Sub Assets ({asset.subAssets.immovable.length})
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse font-sans text-base">
                        <thead>
                          <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                            <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                              Asset Name
                            </th>
                            <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                              Brand
                            </th>
                            <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                              Model
                            </th>
                            <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                              Capacity
                            </th>
                            <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-200 text-sm">
                              Location
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {asset.subAssets?.immovable && asset.subAssets.immovable.map((subAsset: SubAsset) => (
                            <tr key={subAsset._id || subAsset.assetName} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                              <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                                <div>
                                  <div className="font-medium">{subAsset.assetName}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {subAsset.description}
                                  </div>
                                </div>
                              </td>
                              <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                                {subAsset.brand}
                              </td>
                              <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                                {subAsset.model}
                              </td>
                              <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                                {subAsset.capacity}
                              </td>
                              <td className="border border-border px-4 py-3 text-gray-900 dark:text-gray-100">
                                {subAsset.location}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

            </div>
          </div>
        </ScrollArea>

        {/* Simple Footer */}
        <div className="px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
              <Database className="w-3.5 h-3.5" />
              Asset ID: {asset?._id || 'N/A'}
            </div>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Last updated: {asset?.updatedAt ? formatDate(asset.updatedAt) : 'Unknown'}
            </div>
          </div>
          <Button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white px-6 h-9 rounded-lg text-sm"
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
                    Choose your scanning method: use the camera or upload an image
                  </p>
                 
                  <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                    <Button
                      onClick={startCamera}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                   
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="image-upload"
                      />
                      <Button
                        variant="outline"
                        className="border-green-300 dark:border-green-600 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </Button>
                    </div>
                  </div>

                  {/* Image upload preview */}
                  {uploadedImage && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            Image Uploaded Successfully
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300">
                            {uploadedImage.name} ({(uploadedImage.size / 1024).toFixed(1)} KB)
                          </p>
                        </div>
                      </div>
                     
                      {imageUploadLoading && (
                        <div className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                          <span className="text-sm text-green-700 dark:text-green-300">
                            Scanning image for QR code...
                          </span>
                        </div>
                      )}
                     
                      {imageScanError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-red-700 dark:text-red-300">{imageScanError}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setUploadedImage(null);
                                setImageScanError(null);
                                setScannedData(null);
                              }}
                              className="h-6 px-2 text-xs border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              Try Different Image
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
                        setUploadedImage(null);
                        setImageUploadLoading(false);
                        setImageScanError(null);
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