const API_BASE_URL = 'http://192.168.0.5:5021/api'

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

    // Prepare request body exactly as per API specification
    const requestBody = {
      size: options.size || 300,
      includeUrl: options.includeUrl !== undefined ? options.includeUrl : true
    };

    console.log('🚀 Generating QR code for asset:', assetId);
    console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));
    console.log('🔗 API URL:', `${API_BASE_URL}/digital-assets/qr/${assetId}`);

    const startTime = Date.now();

    const response = await fetch(`${API_BASE_URL}/digital-assets/qr/${assetId}`, {
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
          throw new Error(`Asset with ID "${assetId}" not found. Please verify the asset ID.`);
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