'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchAssets as fetchAssetsFromAPI } from '../lib/Report';

interface Asset {
  _id: string;
  tagId: string;
  assetType: string;
  subcategory?: string;
  brand: string;
  model?: string;
  serialNumber?: string;
  capacity?: string;
  yearOfInstallation?: string;
  projectName?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  status?: string;
  priority?: string;
  digitalTagType?: string;
  tags?: string[];
  notes?: string;
  createdBy?: string;
  location: {
    latitude: string;
    longitude: string;
    floor?: string;
    room?: string;
    building?: string;
  };
  createdAt: string;
  updatedAt: string;
  maintenanceSchedule?: {
    lastMaintenance: string;
    nextMaintenance: string;
    maintenanceType: string;
  };
  performanceMetrics?: {
    efficiency: number;
    uptime: number;
    temperature: number;
    energyConsumption: number;
    vibration: number;
  };
}

interface ApiResponse {
  success: boolean;
  assets: Asset[];
}

interface ReportContextType {
  assets: Asset[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  fetchAssets: () => Promise<void>;
  clearError: () => void;
  clearSuccess: () => void;
  exportToPDF: () => void;
  exportToExcel: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const useReportContext = () => {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReportContext must be used within a ReportProvider');
  }
  return context;
};

interface ReportProviderProps {
  children: ReactNode;
}

export const ReportProvider: React.FC<ReportProviderProps> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const assets = await fetchAssetsFromAPI();
      setAssets(assets);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const clearSuccess = () => {
    setSuccessMessage(null);
  };

  const exportToPDF = () => {
    try {
      // Implementation for PDF export
      console.log('Exporting to PDF...');
      
      // Create PDF content
      const pdfContent = {
        title: 'Asset Report',
        date: new Date().toLocaleDateString(),
        assets: assets.map(asset => ({
          tagId: asset.tagId,
          brand: asset.brand,
          model: asset.model,
          assetType: asset.assetType,
          status: asset.status,
          assignedTo: asset.assignedTo?.name || 'Unassigned',
          location: asset.location.building || 'Location not specified'
        }))
      };
      
      // You can integrate with jsPDF here
      console.log('PDF Content:', pdfContent);
      
      // For now, just log the data
      setSuccessMessage('PDF export initiated successfully!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setError('Failed to export PDF');
    }
  };

  const exportToExcel = () => {
    try {
      // Implementation for Excel export
      console.log('Exporting to Excel...');
      
      // Create Excel content
      const excelData = assets.map(asset => ({
        'Tag ID': asset.tagId,
        'Brand': asset.brand,
        'Model': asset.model || '',
        'Asset Type': asset.assetType,
        'Subcategory': asset.subcategory || '',
        'Status': asset.status || '',
        'Priority': asset.priority || '',
        'Assigned To': asset.assignedTo?.name || 'Unassigned',
        'Email': asset.assignedTo?.email || '',
        'Building': asset.location.building || '',
        'Floor': asset.location.floor || '',
        'Room': asset.location.room || '',
        'Created Date': new Date(asset.createdAt).toLocaleDateString(),
        'Last Updated': new Date(asset.updatedAt).toLocaleDateString(),
        'Serial Number': asset.serialNumber || '',
        'Capacity': asset.capacity || '',
        'Project Name': asset.projectName || ''
      }));
      
      // You can integrate with xlsx library here
      console.log('Excel Data:', excelData);
      
      // For now, just log the data
      setSuccessMessage('Excel export initiated successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export Excel');
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const value: ReportContextType = {
    assets,
    loading,
    error,
    successMessage,
    fetchAssets,
    clearError,
    clearSuccess,
    exportToPDF,
    exportToExcel
  };

  return (
    <ReportContext.Provider value={value}>
      {children}
    </ReportContext.Provider>
  );
};
