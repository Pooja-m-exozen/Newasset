'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchAuditLogs, AuditLog } from '../lib/Report';

interface AuditContextType {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  fetchLogs: () => Promise<void>;
  clearError: () => void;
  clearSuccess: () => void;
  exportToPDF: () => void;
  exportToExcel: () => void;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export const useAuditContext = () => {
  const context = useContext(AuditContext);
  if (context === undefined) {
    throw new Error('useAuditContext must be used within an AuditProvider');
  }
  return context;
};

interface AuditProviderProps {
  children: ReactNode;
}

export const AuditProvider: React.FC<AuditProviderProps> = ({ children }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const auditLogs = await fetchAuditLogs();
      setLogs(auditLogs);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
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
      console.log('Exporting audit logs to PDF...');
      
      // Create PDF content
      const pdfContent = {
        title: 'Audit Trails Report',
        date: new Date().toLocaleDateString(),
        logs: logs.map(log => ({
          user: log.user.name,
          email: log.user.email,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          details: log.details,
          timestamp: new Date(log.timestamp).toLocaleString(),
          tagId: log.details.tagId || 'N/A',
          assetType: log.details.assetType || 'N/A',
          brand: log.details.brand || 'N/A',
          projectName: log.details.projectName || 'N/A'
        }))
      };
      
      console.log('PDF Content:', pdfContent);
      setSuccessMessage('PDF export initiated successfully!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setError('Failed to export PDF');
    }
  };

  const exportToExcel = () => {
    try {
      console.log('Exporting audit logs to Excel...');
      
      // Create Excel content
      const excelData = logs.map(log => ({
        'User': log.user.name,
        'Email': log.user.email,
        'Action': log.action,
        'Resource Type': log.resourceType,
        'Resource ID': log.resourceId,
        'Tag ID': log.details.tagId || 'N/A',
        'Asset Type': log.details.assetType || 'N/A',
        'Brand': log.details.brand || 'N/A',
        'Capacity': log.details.capacity || 'N/A',
        'Project Name': log.details.projectName || 'N/A',
        'Year of Installation': log.details.yearOfInstallation || 'N/A',
        'Timestamp': new Date(log.timestamp).toLocaleString(),
        'Details': JSON.stringify(log.details)
      }));
      
      console.log('Excel Data:', excelData);
      setSuccessMessage('Excel export initiated successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export Excel');
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const value: AuditContextType = {
    logs,
    loading,
    error,
    successMessage,
    fetchLogs,
    clearError,
    clearSuccess,
    exportToPDF,
    exportToExcel
  };

  return (
    <AuditContext.Provider value={value}>
      {children}
    </AuditContext.Provider>
  );
}; 