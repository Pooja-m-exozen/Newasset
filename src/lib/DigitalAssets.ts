const API_BASE_URL = 'http://192.168.0.5:5021/api'

// Simple asset ID resolver - handles both tagId and _id inputs
const getAssetId = async (input: string): Promise<string> => {
  // If input looks like an ObjectId (24 hex characters), use it directly
  if (/^[a-fA-F0-9]{24}$/.test(input)) {
    console.log(`✅ Using direct _id: ${input}`);
    return input;
  }

  // Otherwise, treat as tagId and resolve to _id
  try {
    validateAuthToken();
    const token = getAuthToken()!;

    console.log(`🔍 Resolving tagId "${input}" to _id...`);
    
    const response = await fetch(`${API_BASE_URL}/assets/${input}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || 'Unknown error';
      } catch {
        errorMessage = await response.text() || 'Unknown error';
      }
      
      switch (response.status) {
        case 401:
          throw new Error('Authentication failed. Please check your token and try again.');
        case 403:
          throw new Error('Access denied. You do not have permission to view this asset.');
        case 404:
          throw new Error(`Asset with tag ID "${input}" not found. Please verify the tag ID is correct.`);
        case 400:
          throw new Error(`Invalid request: ${errorMessage}`);
        case 429:
          throw new Error('Too many requests. Please wait a moment and try again.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(`API Error (${response.status}): ${errorMessage}`);
      }
    }

    const data: AssetResponse = await response.json();
    const assetId = data.asset._id;
    
    console.log(`✅ Resolved tagId "${input}" to _id "${assetId}"`);
    return assetId;
  } catch (error) {
    console.error(`💥 Error resolving asset ID for "${input}":`, error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while resolving the asset ID');
    }
  }
};

// Types for QR Code generation
export interface QRCodeRequest {
  size?: number;
  includeUrl?: boolean;
}

export interface Location {
  latitude: string;
  longitude: string;
  floor: string;
  room: string;
  building: string;
}

export interface QRCodeData {
  tagId: string;
  assetType: string;
  subcategory: string;
  brand: string;
  model: string;
  status: string;
  priority: string;
  location: Location;
  assignedTo: string;
  projectName: string;
  url: string;
  timestamp: string;
  checksum: string;
}

export interface QRCodeResponse {
  url: string;
  shortUrl: string;
  data: QRCodeData;
}

export interface QRCodeGenerationResponse {
  success: boolean;
  message: string;
  qrCode: QRCodeResponse;
}

// Types for Barcode generation
export interface BarcodeRequest {
  format?: string;
  height?: number;
  scale?: number;
}

export interface BarcodeData {
  data: string;
  format: string;
}

export interface BarcodeResponse {
  url: string;
  shortUrl: string;
  data: string;
  format: string;
}

export interface BarcodeGenerationResponse {
  success: boolean;
  message: string;
  barcode: BarcodeResponse;
}

// Types for NFC data generation
export interface NFCDataRequest {
  // NFC generation doesn't require specific parameters like QR/barcode
  // but we'll keep the interface for consistency
}

export interface NFCLocation {
  latitude: string;
  longitude: string;
  floor: string;
  room: string;
  building: string;
}

export interface NFCData {
  type: string;
  id: string;
  assetType: string;
  subcategory: string;
  brand: string;
  model: string;
  status: string;
  priority: string;
  location: NFCLocation;
  assignedTo: string;
  projectName: string;
  maintenanceSchedule: Record<string, any>;
  performanceMetrics: Record<string, any>;
  timestamp: string;
  checksum: string;
  signature: string;
}

export interface NFCResponse {
  url: string;
  shortUrl: string;
  data: NFCData;
}

export interface NFCGenerationResponse {
  success: boolean;
  message: string;
  nfcData: NFCResponse;
}

// Types for Bulk Digital Assets generation
export interface BulkDigitalAssetsRequest {
  qrSize?: number;
  barcodeFormat?: string;
}

export interface BulkDigitalAssetsResponse {
  qrCode: QRCodeResponse;
  barcode: BarcodeResponse;
  nfcData: NFCResponse;
}

export interface BulkDigitalAssetsGenerationResponse {
  success: boolean;
  message: string;
  digitalAssets: BulkDigitalAssetsResponse;
}

// Types for Assets API
export interface AssetLocation {
  latitude: string;
  longitude: string;
  floor: string;
  room: string;
  building: string;
}

export interface AssetCompliance {
  certifications: string[];
  expiryDates: string[];
  regulatoryRequirements: string[];
}

export interface AssetCreatedBy {
  _id: string;
  name: string;
  email: string;
}

export interface Asset {
  _id: string;
  tagId: string;
  assetType: string;
  subcategory: string;
  brand: string;
  model: string;
  serialNumber: string;
  capacity: string;
  yearOfInstallation: string;
  projectName: string;
  status: string;
  priority: string;
  digitalTagType: string;
  alerts: any[];
  documents: any[];
  tags: string[];
  notes: string;
  createdBy: AssetCreatedBy;
  location: AssetLocation;
  compliance: AssetCompliance;
  photos: any[];
  scanHistory: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface AssetsResponse {
  success: boolean;
  assets: Asset[];
}

export interface AssetResponse {
  success: boolean;
  asset: Asset;
}

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// Validate auth token
const validateAuthToken = (): void => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication token not found. Please set your authentication token first.');
  }
  if (token.trim() === '') {
    throw new Error('Authentication token is empty. Please provide a valid token.');
  }
};

// Validate asset ID
const validateAssetId = (assetId: string): void => {
  if (!assetId || assetId.trim() === '') {
    throw new Error('Asset ID is required');
  }
  if (assetId.length < 3) {
    throw new Error('Asset ID must be at least 3 characters long');
  }
  // Allow alphanumeric characters, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(assetId)) {
    throw new Error('Asset ID can only contain letters, numbers, hyphens, and underscores');
  }
};

// Validate QR code options
const validateQROptions = (options: QRCodeRequest): void => {
  if (options.size !== undefined) {
    if (options.size < 100 || options.size > 1000) {
      throw new Error('QR code size must be between 100 and 1000 pixels');
    }
  }
};

// Validate barcode options
const validateBarcodeOptions = (options: BarcodeRequest): void => {
  if (options.height !== undefined) {
    if (options.height < 1 || options.height > 100) {
      throw new Error('Barcode height must be between 1 and 100');
    }
  }
  if (options.scale !== undefined) {
    if (options.scale < 1 || options.scale > 10) {
      throw new Error('Barcode scale must be between 1 and 10');
    }
  }
  if (options.format && !['code128', 'code39', 'ean13', 'ean8', 'upca', 'upce'].includes(options.format)) {
    throw new Error('Invalid barcode format. Supported formats: code128, code39, ean13, ean8, upca, upce');
  }
};

// Generate QR Code for an asset
export const generateQRCode = async (
  assetId: string, 
  options: QRCodeRequest = { size: 300, includeUrl: true }
): Promise<QRCodeGenerationResponse> => {
  try {
    // Validate inputs
    validateAuthToken();
    validateAssetId(assetId);
    validateQROptions(options);
    
    const token = getAuthToken()!;

    // Resolve tagId to _id using centralized function with caching
    const resolvedAssetId = await getAssetId(assetId);

    // Prepare request body exactly as per API specification
    const requestBody = {
      size: options.size || 300,
      includeUrl: options.includeUrl !== undefined ? options.includeUrl : true
    };

    console.log('🚀 Generating QR code for asset:', { assetId: resolvedAssetId });
    console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));
    console.log('🔗 API URL:', `${API_BASE_URL}/digital-assets/qr/${resolvedAssetId}`);

    const startTime = Date.now();

    const response = await fetch(`${API_BASE_URL}/digital-assets/qr/${resolvedAssetId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'User-Agent': 'FacilioTrack-QR-Generator/1.0',
      },
      body: JSON.stringify(requestBody),
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log('⏱️ Response time:', responseTime + 'ms');
    console.log('📊 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || 'Unknown error';
      } catch {
        errorMessage = await response.text() || 'Unknown error';
      }
      
      console.error('❌ API Error Response:', errorMessage);
      
      switch (response.status) {
        case 401:
          throw new Error('Authentication failed. Please check your token and try again.');
        case 403:
          throw new Error('Access denied. You do not have permission to generate QR codes for this asset.');
        case 404:
          throw new Error(`Asset with ID "${resolvedAssetId}" not found. Please verify the asset ID.`);
        case 400:
          throw new Error(`Invalid request: ${errorMessage}`);
        case 429:
          throw new Error('Too many requests. Please wait a moment and try again.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(`API Error (${response.status}): ${errorMessage}`);
      }
    }

    const data: QRCodeGenerationResponse = await response.json();
    console.log('✅ QR Code generation response:', JSON.stringify(data, null, 2));

    if (!data.success) {
      throw new Error(data.message || 'QR code generation failed');
    }

    // Validate response structure
    if (!data.qrCode || !data.qrCode.data || !data.qrCode.url) {
      throw new Error('Invalid response format from server');
    }

    console.log('🎉 QR code generated successfully!');
    return data;
  } catch (error) {
    console.error('💥 Error generating QR code:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while generating the QR code');
    }
  }
};

// Generate Barcode for an asset
export const generateBarcode = async (
  assetId: string, 
  options: BarcodeRequest = { format: 'code128', height: 10, scale: 3 }
): Promise<BarcodeGenerationResponse> => {
  try {
    // Validate inputs
    validateAuthToken();
    validateAssetId(assetId);
    validateBarcodeOptions(options);
    
    const token = getAuthToken()!;

    // Resolve tagId to _id using centralized function with caching
    const resolvedAssetId = await getAssetId(assetId);

    // Prepare request body exactly as per API specification
    const requestBody = {
      format: options.format || 'code128',
      height: options.height || 10,
      scale: options.scale || 3
    };

    console.log('🚀 Generating barcode for asset:', { assetId: resolvedAssetId });
    console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));
    console.log('🔗 API URL:', `${API_BASE_URL}/digital-assets/barcode/${resolvedAssetId}`);

    const startTime = Date.now();

    const response = await fetch(`${API_BASE_URL}/digital-assets/barcode/${resolvedAssetId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'User-Agent': 'FacilioTrack-Barcode-Generator/1.0',
      },
      body: JSON.stringify(requestBody),
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log('⏱️ Response time:', responseTime + 'ms');
    console.log('📊 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || 'Unknown error';
      } catch {
        errorMessage = await response.text() || 'Unknown error';
      }
      
      console.error('❌ API Error Response:', errorMessage);
      
      switch (response.status) {
        case 401:
          throw new Error('Authentication failed. Please check your token and try again.');
        case 403:
          throw new Error('Access denied. You do not have permission to generate barcodes for this asset.');
        case 404:
          throw new Error(`Asset with ID "${resolvedAssetId}" not found. Please verify the asset ID.`);
        case 400:
          throw new Error(`Invalid request: ${errorMessage}`);
        case 429:
          throw new Error('Too many requests. Please wait a moment and try again.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(`API Error (${response.status}): ${errorMessage}`);
      }
    }

    const data: BarcodeGenerationResponse = await response.json();
    console.log('✅ Barcode generation response:', JSON.stringify(data, null, 2));

    if (!data.success) {
      throw new Error(data.message || 'Barcode generation failed');
    }

    // Validate response structure
    if (!data.barcode || !data.barcode.data || !data.barcode.url) {
      throw new Error('Invalid response format from server');
    }

    console.log('🎉 Barcode generated successfully!');
    return data;
  } catch (error) {
    console.error('💥 Error generating barcode:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while generating the barcode');
    }
  }
};

// Generate NFC data for an asset
export const generateNFCData = async (
  assetId: string, 
  options: NFCDataRequest = {}
): Promise<NFCGenerationResponse> => {
  try {
    // Validate inputs
    validateAuthToken();
    validateAssetId(assetId);
    
    const token = getAuthToken()!;

    // Resolve tagId to _id using centralized function with caching
    const resolvedAssetId = await getAssetId(assetId);

    console.log('🚀 Generating NFC data for asset:', { assetId: resolvedAssetId });
    console.log('🔗 API URL:', `${API_BASE_URL}/digital-assets/nfc/${resolvedAssetId}`);

    const startTime = Date.now();

    const response = await fetch(`${API_BASE_URL}/digital-assets/nfc/${resolvedAssetId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'User-Agent': 'FacilioTrack-NFC-Generator/1.0',
      },
      body: JSON.stringify({}), // Empty body as per API specification
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log('⏱️ Response time:', responseTime + 'ms');
    console.log('📊 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || 'Unknown error';
      } catch {
        errorMessage = await response.text() || 'Unknown error';
      }
      
      console.error('❌ API Error Response:', errorMessage);
      
      switch (response.status) {
        case 401:
          throw new Error('Authentication failed. Please check your token and try again.');
        case 403:
          throw new Error('Access denied. You do not have permission to generate NFC data for this asset.');
        case 404:
          throw new Error(`Asset with ID "${resolvedAssetId}" not found. Please verify the asset ID.`);
        case 400:
          throw new Error(`Invalid request: ${errorMessage}`);
        case 429:
          throw new Error('Too many requests. Please wait a moment and try again.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(`API Error (${response.status}): ${errorMessage}`);
      }
    }

    const data: NFCGenerationResponse = await response.json();
    console.log('✅ NFC data generation response:', JSON.stringify(data, null, 2));

    if (!data.success) {
      throw new Error(data.message || 'NFC data generation failed');
    }

    // Validate response structure
    if (!data.nfcData || !data.nfcData.data || !data.nfcData.url) {
      throw new Error('Invalid response format from server');
    }

    console.log('🎉 NFC data generated successfully!');
    return data;
  } catch (error) {
    console.error('💥 Error generating NFC data:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while generating the NFC data');
    }
  }
};

// Generate all digital assets for an asset (QR, Barcode, NFC)
export const generateAllDigitalAssets = async (
  assetId: string, 
  options: BulkDigitalAssetsRequest = { qrSize: 300, barcodeFormat: 'code128' }
): Promise<BulkDigitalAssetsGenerationResponse> => {
  try {
    // Validate inputs
    validateAuthToken();
    validateAssetId(assetId);
    
    const token = getAuthToken()!;

    // Resolve tagId to _id using centralized function with caching
    const resolvedAssetId = await getAssetId(assetId);

    // Prepare request body
    const requestBody = {
      qrSize: options.qrSize || 300,
      barcodeFormat: options.barcodeFormat || 'code128'
    };

    console.log('🚀 Generating all digital assets for asset:', { assetId: resolvedAssetId });
    console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));
    console.log('🔗 API URL:', `${API_BASE_URL}/digital-assets/all/${resolvedAssetId}`);

    const startTime = Date.now();

    const response = await fetch(`${API_BASE_URL}/digital-assets/all/${resolvedAssetId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'User-Agent': 'FacilioTrack-Bulk-Generator/1.0',
      },
      body: JSON.stringify(requestBody),
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log('⏱️ Response time:', responseTime + 'ms');
    console.log('📊 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || 'Unknown error';
      } catch {
        errorMessage = await response.text() || 'Unknown error';
      }
      
      console.error('❌ API Error Response:', errorMessage);
      
      switch (response.status) {
        case 401:
          throw new Error('Authentication failed. Please check your token and try again.');
        case 403:
          throw new Error('Access denied. You do not have permission to generate digital assets for this asset.');
        case 404:
          throw new Error(`Asset with ID "${resolvedAssetId}" not found. Please verify the asset ID.`);
        case 400:
          throw new Error(`Invalid request: ${errorMessage}`);
        case 429:
          throw new Error('Too many requests. Please wait a moment and try again.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(`API Error (${response.status}): ${errorMessage}`);
      }
    }

    const data: BulkDigitalAssetsGenerationResponse = await response.json();
    console.log('✅ Bulk digital assets generation response:', JSON.stringify(data, null, 2));

    if (!data.success) {
      throw new Error(data.message || 'Bulk digital assets generation failed');
    }

    // Validate response structure
    if (!data.digitalAssets || !data.digitalAssets.qrCode || !data.digitalAssets.barcode || !data.digitalAssets.nfcData) {
      throw new Error('Invalid response format from server');
    }

    console.log('🎉 All digital assets generated successfully!');
    return data;
  } catch (error) {
    console.error('💥 Error generating bulk digital assets:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while generating the digital assets');
    }
  }
};

// Download QR Code image
export const downloadQRCode = async (qrCodeUrl: string, filename: string): Promise<void> => {
  try {
    // Validate authentication
    validateAuthToken();
    const token = getAuthToken()!;

    // Validate URL
    if (!qrCodeUrl || qrCodeUrl.trim() === '') {
      throw new Error('QR code URL is required');
    }

    console.log('📥 Downloading QR code from:', qrCodeUrl);

    const response = await fetch(`${API_BASE_URL}${qrCodeUrl}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || 'Unknown error';
      } catch {
        errorMessage = await response.text() || 'Unknown error';
      }
      
      console.error('❌ Download Error Response:', errorMessage);
      
      switch (response.status) {
        case 401:
          throw new Error('Authentication failed. Please check your token and try again.');
        case 404:
          throw new Error('QR code image not found. The file may have been deleted or moved.');
        case 403:
          throw new Error('Access denied. You do not have permission to download this file.');
        default:
          throw new Error(`Download failed (${response.status}): ${errorMessage}`);
      }
    }

    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error('Downloaded file is empty');
    }

    console.log('📁 File size:', blob.size, 'bytes');
    console.log('📄 File type:', blob.type);

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(url);
    
    console.log('✅ QR code downloaded successfully:', filename);
  } catch (error) {
    console.error('💥 Error downloading QR code:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while downloading the QR code');
    }
  }
};

// Download Barcode image
export const downloadBarcode = async (barcodeUrl: string, filename: string): Promise<void> => {
  try {
    // Validate authentication
    validateAuthToken();
    const token = getAuthToken()!;

    // Validate URL
    if (!barcodeUrl || barcodeUrl.trim() === '') {
      throw new Error('Barcode URL is required');
    }

    console.log('📥 Downloading barcode from:', barcodeUrl);

    const response = await fetch(`${API_BASE_URL}${barcodeUrl}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || 'Unknown error';
      } catch {
        errorMessage = await response.text() || 'Unknown error';
      }
      
      console.error('❌ Download Error Response:', errorMessage);
      
      switch (response.status) {
        case 401:
          throw new Error('Authentication failed. Please check your token and try again.');
        case 404:
          throw new Error('Barcode image not found. The file may have been deleted or moved.');
        case 403:
          throw new Error('Access denied. You do not have permission to download this file.');
        default:
          throw new Error(`Download failed (${response.status}): ${errorMessage}`);
      }
    }

    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error('Downloaded file is empty');
    }

    console.log('📁 File size:', blob.size, 'bytes');
    console.log('📄 File type:', blob.type);

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Barcode downloaded successfully:', filename);
  } catch (error) {
    console.error('💥 Error downloading barcode:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while downloading the barcode');
    }
  }
};

// Download NFC data file
export const downloadNFCData = async (nfcUrl: string, filename: string): Promise<void> => {
  try {
    // Validate authentication
    validateAuthToken();
    const token = getAuthToken()!;

    // Validate URL
    if (!nfcUrl || nfcUrl.trim() === '') {
      throw new Error('NFC data URL is required');
    }

    console.log('📥 Downloading NFC data from:', nfcUrl);

    const response = await fetch(`${API_BASE_URL}${nfcUrl}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || 'Unknown error';
      } catch {
        errorMessage = await response.text() || 'Unknown error';
      }
      
      console.error('❌ Download Error Response:', errorMessage);
      
      switch (response.status) {
        case 401:
          throw new Error('Authentication failed. Please check your token and try again.');
        case 404:
          throw new Error('NFC data file not found. The file may have been deleted or moved.');
        case 403:
          throw new Error('Access denied. You do not have permission to download this file.');
        default:
          throw new Error(`Download failed (${response.status}): ${errorMessage}`);
      }
    }

    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error('Downloaded file is empty');
    }

    console.log('📁 File size:', blob.size, 'bytes');
    console.log('📄 File type:', blob.type);

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(url);
    
    console.log('✅ NFC data downloaded successfully:', filename);
  } catch (error) {
    console.error('💥 Error downloading NFC data:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while downloading the NFC data');
    }
  }
};

// Download all digital assets as a ZIP file
export const downloadAllDigitalAssets = async (
  digitalAssets: BulkDigitalAssetsResponse,
  assetId: string
): Promise<void> => {
  try {
    // Validate authentication
    validateAuthToken();
    const token = getAuthToken()!;

    console.log('📥 Downloading all digital assets for asset:', assetId);

    // Try to import JSZip, with fallback if not available
    let JSZip: any;
    try {
      const jszipModule = await import('jszip');
      JSZip = jszipModule.default;
    } catch (error) {
      console.warn('JSZip not available, falling back to individual downloads');
      // Fallback: download files individually
      await downloadAllAssetsIndividually(digitalAssets, assetId, token);
      return;
    }

    const zip = new JSZip();

    // Download QR code
    const qrResponse = await fetch(`${API_BASE_URL}${digitalAssets.qrCode.url}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'image/*',
      },
    });
    if (qrResponse.ok) {
      const qrBlob = await qrResponse.blob();
      zip.file(`qr_${assetId}.png`, qrBlob);
    }

    // Download barcode
    const barcodeResponse = await fetch(`${API_BASE_URL}${digitalAssets.barcode.url}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'image/*',
      },
    });
    if (barcodeResponse.ok) {
      const barcodeBlob = await barcodeResponse.blob();
      zip.file(`barcode_${assetId}.png`, barcodeBlob);
    }

    // Download NFC data
    const nfcResponse = await fetch(`${API_BASE_URL}${digitalAssets.nfcData.url}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    if (nfcResponse.ok) {
      const nfcBlob = await nfcResponse.blob();
      zip.file(`nfc_${assetId}.json`, nfcBlob);
    }

    // Generate and download ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = window.URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `digital-assets_${assetId}_${Date.now()}.zip`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
    console.log('✅ All digital assets downloaded successfully as ZIP');
  } catch (error) {
    console.error('💥 Error downloading bulk digital assets:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while downloading the digital assets');
    }
  }
};

// Fallback function to download assets individually
const downloadAllAssetsIndividually = async (
  digitalAssets: BulkDigitalAssetsResponse,
  assetId: string,
  token: string
): Promise<void> => {
  console.log('📥 Downloading assets individually...');

  // Download QR code
  try {
    const qrResponse = await fetch(`${API_BASE_URL}${digitalAssets.qrCode.url}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'image/*',
      },
    });
    if (qrResponse.ok) {
      const qrBlob = await qrResponse.blob();
      const url = window.URL.createObjectURL(qrBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr_${assetId}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Failed to download QR code:', error);
  }

  // Download barcode
  try {
    const barcodeResponse = await fetch(`${API_BASE_URL}${digitalAssets.barcode.url}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'image/*',
      },
    });
    if (barcodeResponse.ok) {
      const barcodeBlob = await barcodeResponse.blob();
      const url = window.URL.createObjectURL(barcodeBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `barcode_${assetId}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Failed to download barcode:', error);
  }

  // Download NFC data
  try {
    const nfcResponse = await fetch(`${API_BASE_URL}${digitalAssets.nfcData.url}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    if (nfcResponse.ok) {
      const nfcBlob = await nfcResponse.blob();
      const url = window.URL.createObjectURL(nfcBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nfc_${assetId}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Failed to download NFC data:', error);
  }

  console.log('✅ All digital assets downloaded individually');
};

// Download all digital assets individually (alternative to ZIP)
export const downloadAllDigitalAssetsIndividually = async (
  digitalAssets: BulkDigitalAssetsResponse,
  assetId: string
): Promise<void> => {
  try {
    // Validate authentication
    validateAuthToken();
    const token = getAuthToken()!;

    console.log('📥 Downloading all digital assets individually for asset:', assetId);

    await downloadAllAssetsIndividually(digitalAssets, assetId, token);
    
    console.log('✅ All digital assets downloaded individually');
  } catch (error) {
    console.error('💥 Error downloading digital assets individually:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while downloading the digital assets');
    }
  }
};

// Get all assets
export const getAssets = async (search?: string): Promise<AssetsResponse> => {
  try {
    // Validate authentication
    validateAuthToken();
    const token = getAuthToken()!;

    // Build query parameters
    const params = new URLSearchParams();
    if (search) {
      params.append('search', search);
    }

    console.log('🔍 Fetching assets...');
    console.log('🔗 API URL:', `${API_BASE_URL}/assets?${params.toString()}`);

    const startTime = Date.now();

    const response = await fetch(`${API_BASE_URL}/assets?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'User-Agent': 'FacilioTrack-Assets/1.0',
      },
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log('⏱️ Response time:', responseTime + 'ms');
    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || 'Unknown error';
      } catch {
        errorMessage = await response.text() || 'Unknown error';
      }
      
      console.error('❌ API Error Response:', errorMessage);
      
      switch (response.status) {
        case 401:
          throw new Error('Authentication failed. Please check your token and try again.');
        case 403:
          throw new Error('Access denied. You do not have permission to view assets.');
        case 404:
          throw new Error('Assets not found.');
        case 400:
          throw new Error(`Invalid request: ${errorMessage}`);
        case 429:
          throw new Error('Too many requests. Please wait a moment and try again.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(`API Error (${response.status}): ${errorMessage}`);
      }
    }

    const data: AssetsResponse = await response.json();
    console.log('✅ Assets fetched successfully:', data.assets.length, 'assets');

    return data;
  } catch (error) {
    console.error('💥 Error fetching assets:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while fetching assets');
    }
  }
};

// Get asset by tag ID or _id
export const getAssetById = async (input: string): Promise<AssetResponse> => {
  try {
    // Validate authentication
    validateAuthToken();
    validateAssetId(input);
    
    const token = getAuthToken()!;

    console.log('🔍 Fetching asset by ID:', input);
    console.log('🔗 API URL:', `${API_BASE_URL}/assets/${input}`);

    const response = await fetch(`${API_BASE_URL}/assets/${input}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || 'Unknown error';
      } catch {
        errorMessage = await response.text() || 'Unknown error';
      }
      
      switch (response.status) {
        case 401:
          throw new Error('Authentication failed. Please check your token and try again.');
        case 403:
          throw new Error('Access denied. You do not have permission to view this asset.');
        case 404:
          throw new Error(`Asset with ID "${input}" not found.`);
        case 400:
          throw new Error(`Invalid request: ${errorMessage}`);
        case 429:
          throw new Error('Too many requests. Please wait a moment and try again.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(`API Error (${response.status}): ${errorMessage}`);
      }
    }

    const data: AssetResponse = await response.json();
    console.log('✅ Asset fetched successfully:', data.asset.tagId);

    return data;
  } catch (error) {
    console.error('💥 Error fetching asset:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while fetching the asset');
    }
  }
};

// Alias for backward compatibility
export const getAssetByTagId = getAssetById;

// Search assets by any identifier
export const searchAssets = async (searchTerm: string): Promise<AssetsResponse> => {
  try {
    // Validate authentication
    validateAuthToken();
    const token = getAuthToken()!;

    console.log('🔍 Searching assets:', searchTerm);
    console.log('🔗 API URL:', `${API_BASE_URL}/assets?search=${encodeURIComponent(searchTerm)}`);

    const response = await fetch(`${API_BASE_URL}/assets?search=${encodeURIComponent(searchTerm)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || 'Unknown error';
      } catch {
        errorMessage = await response.text() || 'Unknown error';
      }
      
      switch (response.status) {
        case 401:
          throw new Error('Authentication failed. Please check your token and try again.');
        case 403:
          throw new Error('Access denied. You do not have permission to search assets.');
        case 400:
          throw new Error(`Invalid request: ${errorMessage}`);
        case 429:
          throw new Error('Too many requests. Please wait a moment and try again.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(`API Error (${response.status}): ${errorMessage}`);
      }
    }

    const data: AssetsResponse = await response.json();
    console.log('✅ Assets search completed:', data.assets.length, 'assets found');

    return data;
  } catch (error) {
    console.error('💥 Error searching assets:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while searching assets');
    }
  }
};

// Alias for backward compatibility
export const searchAssetsByTagId = searchAssets;

// Test API connection
export const testAPIConnection = async (): Promise<boolean> => {
  try {
    validateAuthToken();
    const token = getAuthToken()!;

    console.log('🔍 Testing API connection...');

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const isConnected = response.ok;
    console.log('🔗 API connection test result:', isConnected ? '✅ Connected' : '❌ Disconnected');
    
    return isConnected;
  } catch (error) {
    console.error('💥 API connection test failed:', error);
    return false;
  }
};

// Get API status with detailed information
export const getAPIStatus = async (): Promise<{
  connected: boolean;
  responseTime: number;
  status: string;
  details?: string;
}> => {
  try {
    validateAuthToken();
    const token = getAuthToken()!;

    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (response.ok) {
      return {
        connected: true,
        responseTime,
        status: 'Connected',
        details: `Response time: ${responseTime}ms`
      };
    } else {
      return {
        connected: false,
        responseTime,
        status: 'Error',
        details: `HTTP ${response.status}`
      };
    }
  } catch (error) {
    return {
      connected: false,
      responseTime: 0,
      status: 'Failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Simple utility to get asset ID (works with both tagId and _id)
export const getAssetIdFromInput = async (input: string): Promise<string> => {
  return await getAssetId(input);
};

// Example usage function to demonstrate the simplified approach
export const generateDigitalAssetsForAsset = async (
  assetInput: string, // Can be tagId like "ASSET555" or _id like "688e03dd13c587827b05f2c8"
  options: {
    qrSize?: number;
    barcodeFormat?: string;
  } = {}
): Promise<BulkDigitalAssetsGenerationResponse> => {
  try {
    console.log('🚀 Generating digital assets for asset input:', assetInput);
    
    // The system automatically handles both tagId and _id inputs
    const result = await generateAllDigitalAssets(assetInput, {
      qrSize: options.qrSize || 300,
      barcodeFormat: options.barcodeFormat || 'code128'
    });
    
    console.log('✅ Digital assets generated successfully for:', assetInput);
    return result;
  } catch (error) {
    console.error('💥 Error generating digital assets:', error);
    throw error;
  }
};

// Utility function to check if input is an ObjectId
export const isObjectId = (input: string): boolean => {
  return /^[a-fA-F0-9]{24}$/.test(input);
};

// Utility function to get asset details by any identifier
export const getAssetDetails = async (input: string): Promise<Asset> => {
  try {
    const response = await getAssetById(input);
    return response.asset;
  } catch (error) {
    console.error('💥 Error getting asset details:', error);
    throw error;
  }
};

// Example usage documentation
/**
 * SIMPLIFIED USAGE EXAMPLES:
 * 
 * The system now automatically handles both tagId and _id inputs:
 * 
 * // Using tagId
 * await generateQRCode("ASSET555");
 * await generateBarcode("ASSET555");
 * await generateNFCData("ASSET555");
 * await generateAllDigitalAssets("ASSET555");
 * 
 * // Using _id directly
 * await generateQRCode("688e03dd13c587827b05f2c8");
 * await generateBarcode("688e03dd13c587827b05f2c8");
 * await generateNFCData("688e03dd13c587827b05f2c8");
 * await generateAllDigitalAssets("688e03dd13c587827b05f2c8");
 * 
 * // Get asset details by any identifier
 * const asset = await getAssetDetails("ASSET555");
 * const asset = await getAssetDetails("688e03dd13c587827b05f2c8");
 * 
 * // Search assets
 * const results = await searchAssets("ASSET");
 * 
 * The system automatically detects if the input is an ObjectId (24 hex characters)
 * and uses it directly, otherwise it treats it as a tagId and resolves it to _id.
 */