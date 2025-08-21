'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { LoadingSpinner } from '../../../../components/ui/loading-spinner';
import { ErrorDisplay } from '../../../../components/ui/error-display';

import { Label } from '../../../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';

import { 
  Search, 
  Filter, 
  Calendar,
  Building2,
  User,
  Clock,
  Wrench,
  CheckCircle,
  FileSpreadsheet,
  PauseCircle,
  RefreshCw,
  Activity,
  MapPin,
  TrendingUp,
  BarChart3,
  FilterX,
  FileDown,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus
} from 'lucide-react';

// Import reverseGeocode function
import { reverseGeocode } from '../../../../lib/location';

interface MaintenanceLog {
  _id: string;
  asset: string; // Asset tag from create form
  assetId: string;
  assetName: string;
  maintenanceType: string;
  description: string;
  technicianId: string;
  technicianName: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  workStartedAt?: string;
  workStartedBy?: string;
  workPausedAt?: string;
  workCompletedAt?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue' | 'cancelled' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: string | { 
    building?: string; 
    floor?: string; 
    room?: string;
    coordinates?: {
      latitude?: string;
      longitude?: string;
    };
  };
  cost?: number;
  partsUsed: unknown[];
  attachments: unknown[];
  __v: number;
}

const API_BASE_URL = 'http://192.168.0.5:5021/api';

export default function MaintenanceLogsPage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showViewLogModal, setShowViewLogModal] = useState(false);
  const [viewingLog, setViewingLog] = useState<MaintenanceLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [geocodedAddresses, setGeocodedAddresses] = useState<Record<string, string>>({});
  const [geocodingLoading, setGeocodingLoading] = useState<Record<string, boolean>>({});
  const [locationLoading, setLocationLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    asset: '',
    maintenanceType: '',
    title: '',
    description: '',
    actionTaken: '',
    status: 'scheduled' as const,
    remarks: '',
    priority: 'medium' as const,
    estimatedDuration: 0,
    scheduledDate: '',
    dueDate: '',
    estimatedCost: 0,
    location: {
      building: '',
      floor: '',
      room: '',
      coordinates: {
        latitude: '',
        longitude: ''
      },
      address: '' // Added address field
    }
  });

  const handleAuthError = (errorMessage: string) => {
    setError(errorMessage);
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    setTimeout(() => {
      window.location.href = '/login';
    }, 3000);
  };

  // Function to reverse geocode coordinates to address
  const handleReverseGeocode = useCallback(async (logId: string, location: MaintenanceLog['location']) => {
    if (!location || typeof location !== 'object') return;
    
    // Check if we have coordinates
    const hasCoordinates = location.coordinates && 
                          location.coordinates.latitude && 
                          location.coordinates.longitude &&
                          location.coordinates.latitude !== '0' && 
                          location.coordinates.longitude !== '0';
    
    if (!hasCoordinates) return;
    
    // Check if we already have the geocoded address
    if (geocodedAddresses[logId]) return;
    
    setGeocodingLoading(prev => ({ ...prev, [logId]: true }));
    
    try {
      const latitude = parseFloat(location.coordinates!.latitude!);
      const longitude = parseFloat(location.coordinates!.longitude!);
      
      if (isNaN(latitude) || isNaN(longitude)) return;
      
      const address = await reverseGeocode(latitude, longitude);
      setGeocodedAddresses(prev => ({ ...prev, [logId]: address }));
    } catch (error) {
      console.error('Error reverse geocoding location:', error);
      setGeocodedAddresses(prev => ({ ...prev, [logId]: 'Address not available' }));
    } finally {
      setGeocodingLoading(prev => ({ ...prev, [logId]: false }));
    }
  }, [geocodedAddresses]);

  const fetchMaintenanceLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        handleAuthError('Authentication token not found. Please login again.');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/maintenance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError('Authentication failed. Please login again.');
          return;
        } else if (response.status === 403) {
          setError('Access denied. You do not have permission to view maintenance logs.');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      const maintenanceLogs = data.data || data.maintenanceLogs || data.logs || data || [];
      
      if (Array.isArray(maintenanceLogs)) {
        setLogs(maintenanceLogs);
      } else {
        console.error('Unexpected API response structure:', data);
        setError('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching maintenance logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch maintenance logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMaintenanceLogs();
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
      setError('Authentication required. Please login to view maintenance logs.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
    
    fetchMaintenanceLogs();
  }, [fetchMaintenanceLogs]);

  // Trigger reverse geocoding for all logs when they change
  useEffect(() => {
    if (logs.length > 0) {
      logs.forEach(log => {
        if (log.location) {
          handleReverseGeocode(log._id, log.location);
        }
      });
    }
  }, [logs, handleReverseGeocode]);

  // Clear geocoded addresses when view modal is closed
  useEffect(() => {
    if (!showViewLogModal && viewingLog) {
      setViewingLog(null);
    }
  }, [showViewLogModal, viewingLog]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = (log.asset?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.assetName?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.assetId?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.technicianName?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (log.description?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || log.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  }).sort((a, b) => {
    let aValue: unknown = a[sortBy as keyof typeof a];
    let bValue: unknown = b[sortBy as keyof typeof b];
    
    // Handle asset field specifically
    if (sortBy === 'asset') {
      aValue = a.asset || a.assetName || a.assetId || '';
      bValue = b.asset || b.assetName || b.assetId || '';
    }
    
    if (sortBy === 'date' || sortBy === 'createdAt' || sortBy === 'updatedAt' || 
        sortBy === 'workStartedAt' || sortBy === 'workCompletedAt') {
      aValue = new Date(aValue as string || '0').getTime();
      bValue = new Date(bValue as string || '0').getTime();
    }
    
    if (sortOrder === 'asc') {
      return (aValue as number) > (bValue as number) ? 1 : -1;
    } else {
      return (aValue as number) < (bValue as number) ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'Scheduled' },
      'in-progress': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Completed' },
      overdue: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Overdue' },
      cancelled: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', label: 'Cancelled' },
      paused: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400', label: 'Paused' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    
    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium border`}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', label: 'Low' },
      medium: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', label: 'Medium' },
      high: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', label: 'High' },
      critical: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Critical' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    
    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium border`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "1 day ago";
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const downloadExcel = () => {
    try {
      const headers = [
        'Asset Name', 'Asset ID', 'Maintenance Type', 'Technician', 'Status', 
        'Priority', 'Scheduled Date', 'Work Started', 'Work Completed', 'Cost', 'Location'
      ];
      
      const csvContent = [
        headers.join(','),
        ...filteredLogs.map(log => [
          `"${log.asset || log.assetName || 'N/A'}"`,
          `"${log.assetId || 'N/A'}"`,
          `"${log.maintenanceType || 'N/A'}"`,
          `"${log.technicianName || 'N/A'}"`,
          `"${log.status || 'N/A'}"`,
          `"${log.priority || 'N/A'}"`,
          `"${formatDateTime(log.date)}"`,
          `"${log.workStartedAt ? formatDateTime(log.workStartedAt) : 'Not started'}"`,
          `"${log.workCompletedAt ? formatDateTime(log.workCompletedAt) : 'Not completed'}"`,
          `"${log.cost ? '$' + log.cost : 'N/A'}"`,
          `"${formatLocationForExport(log.location, log._id)}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `maintenance-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  const downloadPDF = () => {
    try {
      // Create a simple HTML table for PDF generation
      const tableHTML = `
        <html>
          <head>
            <title>Maintenance Logs Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .status-scheduled { background-color: #dbeafe; color: #1e40af; }
              .status-in-progress { background-color: #fef3c7; color: #d97706; }
              .status-completed { background-color: #d1fae5; color: #059669; }
              .status-overdue { background-color: #fee2e2; color: #dc2626; }
              .status-cancelled { background-color: #f3f4f6; color: #374151; }
              .status-paused { background-color: #f3e8ff; color: #7c3aed; }
              .priority-low { background-color: #f3f4f6; color: #374151; }
              .priority-medium { background-color: #dbeafe; color: #1e40af; }
              .priority-high { background-color: #fed7aa; color: #ea580c; }
              .priority-critical { background-color: #fee2e2; color: #dc2626; }
            </style>
          </head>
          <body>
            <h1>Maintenance Logs Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Total Records: ${filteredLogs.length}</p>
            <table>
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Asset ID</th>
                  <th>Maintenance Type</th>
                  <th>Technician</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Scheduled Date</th>
                  <th>Cost</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                ${filteredLogs.map(log => `
                  <tr>
                    <td>${log.asset || log.assetName || 'N/A'}</td>
                    <td>${log.assetId || 'N/A'}</td>
                    <td>${log.maintenanceType || 'N/A'}</td>
                    <td>${log.technicianName || 'N/A'}</td>
                    <td><span class="status-${log.status}">${log.status}</span></td>
                    <td><span class="priority-${log.priority}">${log.priority}</span></td>
                    <td>${formatDateTime(log.date)}</td>
                    <td>${log.cost ? '$' + log.cost : 'N/A'}</td>
                    <td>${formatLocationForExport(log.location, log._id)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([tableHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `maintenance-logs-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF file. Please try again.');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterPriority('all');
    setSortBy('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const openViewLogModal = (log: MaintenanceLog) => {
    setViewingLog(log);
    setShowViewLogModal(true);
  };

  const createMaintenanceLog = async () => {
    try {
      setCreating(true);
      setError(null);
      
      // Validate required fields
      if (!createForm.asset?.trim()) {
        setError('Asset tag is required');
        return;
      }
      
      if (!createForm.maintenanceType?.trim()) {
        setError('Maintenance type is required');
        return;
      }
      
      if (!createForm.title?.trim()) {
        setError('Title is required');
        return;
      }
      
      if (!createForm.scheduledDate) {
        setError('Scheduled date is required');
        return;
      }
      
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        handleAuthError('Authentication token not found. Please login again.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError('Authentication failed. Please login again.');
          return;
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (data.success) {
        // Reset form and close modal
        setCreateForm({
          asset: '',
          maintenanceType: '',
          title: '',
          description: '',
          actionTaken: '',
          status: 'scheduled',
          remarks: '',
          priority: 'medium',
          estimatedDuration: 0,
          scheduledDate: '',
          dueDate: '',
          estimatedCost: 0,
          location: {
            building: '',
            floor: '',
            room: '',
            coordinates: {
              latitude: '',
              longitude: ''
            },
            address: ''
          }
        });
        setShowCreateModal(false);
        
        // Refresh the logs
        await fetchMaintenanceLogs();
        
        // Show success message
        alert('Maintenance log created successfully!');
      } else {
        throw new Error(data.message || 'Failed to create maintenance log');
      }
    } catch (err) {
      console.error('Error creating maintenance log:', err);
      setError(err instanceof Error ? err.message : 'Failed to create maintenance log');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateFormChange = (field: string, value: string | number) => {
    if (field === 'location.building') {
      setCreateForm(prev => ({
        ...prev,
        location: { ...prev.location, building: value as string }
      }));
    } else if (field === 'location.floor') {
      setCreateForm(prev => ({
        ...prev,
        location: { ...prev.location, floor: value as string }
      }));
    } else if (field === 'location.room') {
      setCreateForm(prev => ({
        ...prev,
        location: { ...prev.location, room: value as string }
      }));
    } else if (field === 'location.coordinates.latitude') {
      setCreateForm(prev => ({
        ...prev,
        location: { 
          ...prev.location, 
          coordinates: { ...prev.location.coordinates, latitude: value as string }
        }
      }));
    } else if (field === 'location.coordinates.longitude') {
      setCreateForm(prev => ({
        ...prev,
        location: { 
          ...prev.location, 
          coordinates: { ...prev.location.coordinates, longitude: value as string }
        }
      }));
    } else if (field === 'location.address') {
      setCreateForm(prev => ({
        ...prev,
        location: { ...prev.location, address: value as string }
      }));
    } else {
      setCreateForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const getCurrentLocation = async () => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
        });

        const { latitude, longitude } = position.coords;
        const latStr = latitude.toFixed(6);
        const lngStr = longitude.toFixed(6);
        
        // Update coordinates
        setCreateForm(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: { latitude: latStr, longitude: lngStr }
          }
        }));
        
        // Get address from coordinates using reverse geocoding
        try {
          const address = await reverseGeocode(latitude, longitude);
          setCreateForm(prev => ({
            ...prev,
            location: {
              ...prev.location,
              address: address
            }
          }));
        } catch (error) {
          console.error('Error getting address from coordinates:', error);
          // Keep coordinates even if address lookup fails
        }
        
      } catch (error) {
        console.error('Error getting current location:', error);
        alert('Failed to get current location. Please ensure location services are enabled.');
      } finally {
        setLocationLoading(false);
      }
    } else {
      alert('Geolocation is not supported by your browser.');
      setLocationLoading(false);
    }
  };


  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const formatLocation = (location: string | { building?: string; floor?: string; room?: string; coordinates?: { latitude?: string; longitude?: string } } | undefined, logId?: string) => {
    if (!location) return 'N/A';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      const parts = [
        location.building,
        location.floor,
        location.room
      ].filter(Boolean);
      
      // If we have coordinates and a geocoded address, show it
      if (logId && location.coordinates && geocodedAddresses[logId]) {
        const address = geocodedAddresses[logId];
        if (geocodingLoading[logId]) {
          return (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading address...</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{address}</span>
          </div>
        );
      }
      
      // Fallback to basic location info
      return parts.length > 0 ? parts.join(' ') : 'N/A';
    }
    return 'N/A';
  };

  // Simple formatLocation function for exports (CSV/PDF) that returns only text
  const formatLocationForExport = (location: string | { building?: string; floor?: string; room?: string; coordinates?: { latitude?: string; longitude?: string } } | undefined, logId?: string) => {
    if (!location) return 'N/A';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      const parts = [
        location.building,
        location.floor,
        location.room
      ].filter(Boolean);
      
      // If we have coordinates and a geocoded address, show it
      if (logId && location.coordinates && geocodedAddresses[logId]) {
        return geocodedAddresses[logId];
      }
      
      // Fallback to basic location info
      return parts.length > 0 ? parts.join(' ') : 'N/A';
    }
    return 'N/A';
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-background to-muted">
        <div className="flex-1 overflow-auto">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-muted-foreground">Loading maintenance logs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-muted">
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 sm:px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Maintenance Logs</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Comprehensive maintenance tracking and management system</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4" />
                <span>Create Log</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Error Display */}
          <ErrorDisplay 
            error={error} 
            onClearError={() => setError(null)} 
          />

          {/* Search and Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="w-full max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search logs by asset, technician, or description..."
                      className="pl-10 h-11 text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                                 <Button
                   variant="outline"
                   onClick={() => setShowFilters(!showFilters)}
                   className="flex items-center gap-2 lg:hidden"
                 >
                   <Filter className="w-4 h-4" />
                   {showFilters ? 'Hide Filters' : 'Show Filters'}
                 </Button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-border mt-6">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Scheduled Date</SelectItem>
                      <SelectItem value="assetName">Asset Name</SelectItem>
                      <SelectItem value="technicianName">Technician</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    variant="outline" 
                    onClick={handleClearFilters}
                    className="flex items-center space-x-2"
                  >
                    <FilterX className="w-4 h-4" />
                    <span>Clear Filters</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats and Export Section */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 p-4 sm:p-6 bg-card/60 backdrop-blur-sm rounded-xl border border-border">
                         <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
               <Button 
                 onClick={downloadPDF}
                 className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
               >
                 <FileDown className="w-4 h-4" />
                 <span>Download PDF</span>
               </Button>
               <Button 
                 onClick={downloadExcel}
                 className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
               >
                 <FileSpreadsheet className="w-4 h-4" />
                 <span>Download Excel</span>
               </Button>
             </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                {filteredLogs.length} of {logs.length} logs
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {Math.round((filteredLogs.length / logs.length) * 100)}% filtered
              </div>
            </div>
          </div>

          {/* Table Section */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                    <Wrench className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Maintenance Logs</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Detailed view of all maintenance activities and work orders
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-muted-foreground">
                    {filteredLogs.length} logs
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-0">
                             {filteredLogs.length === 0 ? (
                 <Card className="border-0 shadow-sm">
                   <CardContent className="p-16 text-center">
                     <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                       <Wrench className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                     </div>
                     <h3 className="text-2xl font-bold text-foreground mb-3">No maintenance logs found</h3>
                     <p className="text-muted-foreground mb-6 text-lg max-w-md mx-auto">
                       No maintenance logs match your current filters. Try adjusting your search criteria or clearing the filters.
                     </p>
                     <div className="flex items-center justify-center gap-3">
                       <Button
                         onClick={handleClearFilters}
                         className="flex items-center gap-2"
                       >
                         <RefreshCw className="w-4 h-4" />
                         Clear Filters
                       </Button>

                     </div>
                   </CardContent>
                 </Card>
               ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-accent/50">
                        <TableHead 
                          className="cursor-pointer font-semibold text-foreground"
                          onClick={() => handleSort('asset')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Asset Tag</span>
                            {getSortIcon('asset')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer font-semibold text-foreground"
                          onClick={() => handleSort('maintenanceType')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Type</span>
                            {getSortIcon('maintenanceType')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer font-semibold text-foreground"
                          onClick={() => handleSort('technicianName')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Technician</span>
                            {getSortIcon('technicianName')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer font-semibold text-foreground"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Status</span>
                            {getSortIcon('status')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer font-semibold text-foreground"
                          onClick={() => handleSort('priority')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Priority</span>
                            {getSortIcon('priority')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer font-semibold text-foreground"
                          onClick={() => handleSort('date')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Scheduled</span>
                            {getSortIcon('date')}
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">Progress</TableHead>
                        <TableHead className="font-semibold text-foreground">Cost</TableHead>
                        <TableHead className="font-semibold text-foreground">Location</TableHead>
                        <TableHead className="font-semibold text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentLogs.map((log) => (
                        <TableRow key={log._id} className="hover:bg-accent/50 transition-colors">
                          <TableCell>
                            <div>
                              <div className="font-semibold text-foreground">
                                {log.asset?.toString() || log.assetName?.toString() || log.assetId?.toString() || 'N/A'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {log.assetName && log.assetName !== log.asset ? log.assetName.toString() : ''}
                                {log.assetId && log.assetId !== log.asset ? log.assetId.toString() : ''}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-border bg-card text-foreground">
                              {log.maintenanceType || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">{log.technicianName || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(log.status)}
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(log.priority)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">{formatDate(log.date)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {log.workStartedAt ? (
                                <>
                                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  <span className="text-sm text-blue-600 dark:text-blue-400">Started</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">Not started</span>
                                </>
                              )}
                              {log.workCompletedAt && (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <span className="text-sm text-green-600 dark:text-green-400">Completed</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.cost ? (
                              <span className="font-semibold text-green-600 dark:text-green-400">${log.cost}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              {geocodingLoading[log._id] ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                  <span className="text-sm text-muted-foreground">Loading address...</span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">{formatLocation(log.location, log._id)}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground"
                              onClick={() => openViewLogModal(log)}
                            >
                              <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {filteredLogs.length > 0 && (
                <div className="px-6 py-4 border-t border-border bg-card">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button 
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* View Log Modal */}
      {showViewLogModal && viewingLog && (
        <Dialog open={showViewLogModal} onOpenChange={setShowViewLogModal}>
          <DialogContent className="max-w-3xl bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Maintenance Log Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Log Header */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-2xl">
                  {getInitials(viewingLog.asset || viewingLog.assetName || 'Asset')}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-foreground">{viewingLog.asset || viewingLog.assetName || 'N/A'}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(viewingLog.status)}
                    {getPriorityBadge(viewingLog.priority)}
                  </div>
                </div>
              </div>

              {/* Log Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Asset Tag</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{viewingLog.asset || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Asset ID</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{viewingLog.assetId || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Maintenance Type</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Wrench className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{viewingLog.maintenanceType || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Technician</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{viewingLog.technicianName || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{formatLocation(viewingLog.location, viewingLog._id)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusBadge(viewingLog.status)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      {getPriorityBadge(viewingLog.priority)}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Scheduled Date</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{formatDateTime(viewingLog.date)}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Cost</Label>
                    <div className="mt-1">
                      <span className="text-foreground">
                        {viewingLog.cost ? `$${viewingLog.cost}` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Information */}
              <div className="space-y-4">
                <h5 className="font-semibold text-foreground">Progress Timeline</h5>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Created: {formatDateTime(viewingLog.createdAt)}</span>
                  </div>
                  {viewingLog.workStartedAt && (
                    <div className="flex items-center space-x-3">
                      <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-blue-600 dark:text-blue-400">Work Started: {formatDateTime(viewingLog.workStartedAt)}</span>
                    </div>
                  )}
                  {viewingLog.workPausedAt && (
                    <div className="flex items-center space-x-3">
                      <PauseCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm text-yellow-600 dark:text-yellow-400">Work Paused: {formatDateTime(viewingLog.workPausedAt)}</span>
                    </div>
                  )}
                  {viewingLog.workCompletedAt && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-600 dark:text-green-400">Work Completed: {formatDateTime(viewingLog.workCompletedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {viewingLog.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <div className="mt-1 p-3 bg-card/50 rounded-md border border-border">
                    <p className="text-foreground">{viewingLog.description}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewLogModal(false);
                    setViewingLog(null);
                  }}
                  className="h-10"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Maintenance Log Modal */}
      {showCreateModal && (
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-5xl max-h-[90vh] bg-card border-border overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-border">
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Create New Maintenance Log
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 max-h-[calc(90vh-180px)]">
              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="asset" className="text-sm font-medium text-foreground">Asset Tag</Label>
                  <Input
                    id="asset"
                    placeholder="e.g., SSL135"
                    value={createForm.asset}
                    onChange={(e) => handleCreateFormChange('asset', e.target.value)}
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maintenanceType" className="text-sm font-medium text-foreground">Maintenance Type</Label>
                  <Select value={createForm.maintenanceType} onValueChange={(value) => handleCreateFormChange('maintenanceType', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="preventive">Preventive</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-foreground">Title</Label>
                  <Input
                    id="title"
                    placeholder="Maintenance title"
                    value={createForm.title}
                    onChange={(e) => handleCreateFormChange('title', e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium text-foreground">Priority</Label>
                  <Select value={createForm.priority} onValueChange={(value) => handleCreateFormChange('priority', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-foreground">Status</Label>
                  <Select value={createForm.status} onValueChange={(value) => handleCreateFormChange('status', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDuration" className="text-sm font-medium text-foreground">Estimated Duration (minutes)</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    placeholder="240"
                    value={createForm.estimatedDuration}
                    onChange={(e) => handleCreateFormChange('estimatedDuration', parseInt(e.target.value) || 0)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledDate" className="text-sm font-medium text-foreground">Scheduled Date</Label>
                  <Input
                    id="scheduledDate"
                    type="datetime-local"
                    value={createForm.scheduledDate}
                    onChange={(e) => handleCreateFormChange('scheduledDate', e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-sm font-medium text-foreground">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={createForm.dueDate}
                    onChange={(e) => handleCreateFormChange('dueDate', e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedCost" className="text-sm font-medium text-foreground">Estimated Cost ($)</Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    placeholder="0.00"
                    value={createForm.estimatedCost}
                    onChange={(e) => handleCreateFormChange('estimatedCost', parseFloat(e.target.value) || 0)}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Description and Action */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
                  <textarea
                    id="description"
                    placeholder="Describe the maintenance work needed..."
                    value={createForm.description}
                    onChange={(e) => handleCreateFormChange('description', e.target.value)}
                    className="w-full h-24 p-3 border border-border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actionTaken" className="text-sm font-medium text-foreground">Action Taken</Label>
                  <textarea
                    id="actionTaken"
                    placeholder="Describe what actions were taken..."
                    value={createForm.actionTaken}
                    onChange={(e) => handleCreateFormChange('actionTaken', e.target.value)}
                    className="w-full h-24 p-3 border border-border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label htmlFor="remarks" className="text-sm font-medium text-foreground">Remarks</Label>
                <textarea
                  id="remarks"
                  placeholder="Additional notes or remarks..."
                  value={createForm.remarks}
                  onChange={(e) => handleCreateFormChange('remarks', e.target.value)}
                  className="w-full h-20 p-3 border border-border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h5 className="font-semibold text-foreground">Location Details</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="building" className="text-sm font-medium text-foreground">Building</Label>
                    <Input
                      id="building"
                      placeholder="e.g., Main Building"
                      value={createForm.location.building}
                      onChange={(e) => handleCreateFormChange('location.building', e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="floor" className="text-sm font-medium text-foreground">Floor</Label>
                    <Input
                      id="floor"
                      placeholder="e.g., 1st Floor"
                      value={createForm.location.floor}
                      onChange={(e) => handleCreateFormChange('location.floor', e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room" className="text-sm font-medium text-foreground">Room</Label>
                    <Input
                      id="room"
                      placeholder="e.g., General"
                      value={createForm.location.room}
                      onChange={(e) => handleCreateFormChange('location.room', e.target.value)}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Address</Label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getCurrentLocation}
                          disabled={locationLoading}
                          className="h-10 flex-1"
                        >
                          {locationLoading ? (
                            <LoadingSpinner size="sm" className="mr-2" />
                          ) : (
                            <MapPin className="w-4 h-4 mr-2" />
                          )}
                          {locationLoading ? 'Getting Location...' : 'Get Current Location'}
                        </Button>
                      </div>
                      
                      {/* Address Display */}
                      {createForm.location.coordinates.latitude && createForm.location.coordinates.longitude && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                                Location Detected
                              </div>
                              {createForm.location.address ? (
                                <div className="text-sm text-green-700 dark:text-green-300">
                                  <span className="font-medium">Address:</span> {createForm.location.address}
                                </div>
                              ) : (
                                <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-2">
                                  <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                  Getting address...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Manual Address Input */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Or enter address manually:</Label>
                        <Input
                          placeholder="Enter full address (e.g., 123 Main St, City, State)"
                          value={createForm.location.address || ''}
                          onChange={(e) => handleCreateFormChange('location.address', e.target.value)}
                          className="h-10 text-sm"
                        />
                      </div>
                      
                      {/* Status Indicator */}
                      {!createForm.location.coordinates.latitude && !createForm.location.address && (
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-md">
                          <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                            No location set. Use &quot;Get Current Location&quot; or enter address manually.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="px-6 py-4 border-t border-border bg-card flex flex-col sm:flex-row justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  // Reset form when closing
                  setCreateForm({
                    asset: '',
                    maintenanceType: '',
                    title: '',
                    description: '',
                    actionTaken: '',
                    status: 'scheduled',
                    remarks: '',
                    priority: 'medium',
                    estimatedDuration: 0,
                    scheduledDate: '',
                    dueDate: '',
                    estimatedCost: 0,
                    location: {
                      building: '',
                      floor: '',
                      room: '',
                      coordinates: {
                        latitude: '',
                        longitude: ''
                      },
                      address: ''
                    }
                  });
                }}
                className="h-10 w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={createMaintenanceLog}
                disabled={creating}
                className="h-10 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
              >
                {creating ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Create Log</span>
                  </div>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}


     </div>
   );
 } 