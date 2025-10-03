'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { LoadingSpinner } from '../../../../components/ui/loading-spinner';
import { ReportProvider, useReportContext } from '../../../../contexts/ReportContext';
import { filterAssets, type Asset } from '../../../../lib/Report';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { useAuth } from '../../../../contexts/AuthContext';
import { 
  MapPin,
  Search,
  FileText,
  Edit,
  Calendar,
  Clock,
  User,
  Building,
  Smartphone,
  Monitor,
  Server,
  Eye,
  Database,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// API Base URL constant
const API_BASE_URL = 'https://digitalasset.zenapi.co.in/api';

interface AssetsResponse {
  success?: boolean;
  assets?: Asset[];
  data?: Asset[];
  items?: Asset[];
  results?: Asset[];
}

function AssetsLogsContent() {
  const { user } = useAuth();
  const { loading, error } = useReportContext();
  const [projectAssets, setProjectAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch asset types from API
  const fetchAssetTypes = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_BASE_URL}/asset-types`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch asset types: ${response.status}`);
      }

    } catch (err) {
      console.error('Error fetching asset types:', err);
    }
  }, []);

  // Fetch assets from API and filter by user's project
  const fetchProjectAssets = useCallback(async () => {
    try {
      if (!user?.projectName) {
        throw new Error('User project not found. Please login again.');
      }

      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Try to fetch all assets with a high limit first
      let allAssets: Asset[] = [];
      let page = 1;
      const limit = 1000; // High limit to get all records
      let hasMoreData = true;

      while (hasMoreData) {
        const response = await fetch(`${API_BASE_URL}/assets?limit=${limit}&page=${page}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please login again.');
          }
          throw new Error(`Failed to fetch assets: ${response.status}`);
        }

        const data: AssetsResponse = await response.json();
        
        let pageAssets: Asset[] = [];
        
        // Extract assets from response
        if (data.success && data.assets) {
          pageAssets = data.assets;
        } else if (data.assets) {
          pageAssets = data.assets;
        } else if (Array.isArray(data)) {
          pageAssets = data;
        } else {
          const possibleAssets = data.data || data.items || data.results || [];
          if (Array.isArray(possibleAssets)) {
            pageAssets = possibleAssets as Asset[];
          }
        }

        // If we got fewer assets than the limit, we've reached the end
        if (pageAssets.length < limit) {
          hasMoreData = false;
        }

        allAssets = [...allAssets, ...pageAssets];
        page++;

        // Safety check to prevent infinite loops
        if (page > 100) {
          console.warn('Reached maximum page limit (100), stopping pagination');
          break;
        }
      }

      // Filter assets by user's project name
      const userAssets = allAssets.filter(asset => {
        // Check both the old projectName property and the new nested project structure
        const assetProjectName = asset.project?.projectName || asset.projectName;
        return assetProjectName === user.projectName;
      });

      if (userAssets.length === 0) {
        console.warn(`No assets found for project: ${user.projectName}`);
      }
      
      setProjectAssets(userAssets);
    } catch (err) {
      console.error('Error fetching project assets:', err);
      // Don't set error here as we still want to show the page
    }
  }, [user?.projectName]);

  // Load project assets and asset types when user changes
  useEffect(() => {
    if (user?.projectName) {
      fetchProjectAssets();
      fetchAssetTypes();
    }
  }, [user?.projectName, fetchProjectAssets, fetchAssetTypes]);

  const filteredAssets = useMemo(() => {
    // Transform assets to match Report library's Asset interface
    const transformedAssets = projectAssets.map(asset => ({
      ...asset,
      createdBy: asset.createdBy ? {
        _id: asset.createdBy,
        name: asset.createdBy, // Use the string as both ID and name
        email: '' // Default empty email
      } : undefined
    }));
    
    // Count unique TAG IDs - this is the true asset count
    const uniqueTagIds = [...new Set(transformedAssets.map(asset => asset.tagId))];
    console.log('Assets Logs - Unique TAG IDs count:', uniqueTagIds.length);
    console.log('Assets Logs - First few TAG IDs:', uniqueTagIds.slice(0, 5));
    
    // Remove duplicates based on tagId first
    const uniqueAssets = transformedAssets.filter((asset, index, self) => 
      index === self.findIndex(a => a.tagId === asset.tagId)
    );
    
    console.log('Assets Logs - Original assets:', projectAssets.length);
    console.log('Assets Logs - Unique assets after deduplication:', uniqueAssets.length);
    
    const filtered = filterAssets(uniqueAssets as Asset[], searchTerm, 'all', 'all', 'all');
    
    // Sort assets
    filtered.sort((a, b) => {
      let aValue: unknown = a[sortBy as keyof typeof a];
      let bValue: unknown = b[sortBy as keyof typeof b];
      
      if (sortBy === 'updatedAt' || sortBy === 'createdAt') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      
      if (sortOrder === 'asc') {
        return (aValue as number) > (bValue as number) ? 1 : -1;
      } else {
        return (aValue as number) < (bValue as number) ? 1 : -1;
      }
    });
    
    return filtered;
  }, [projectAssets, searchTerm, sortBy, sortOrder]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, sortOrder]);


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleViewDetails = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedAsset(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAssetTypeIcon = (assetType: string) => {
    switch (assetType?.toLowerCase()) {
      case 'computer':
      case 'dell':
        return Monitor;
      case 'smartphone':
      case 'mobile':
        return Smartphone;
      case 'server':
        return Server;
      default:
        return Building;
    }
  };


  const handlePDFDownload = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      
      const doc = new jsPDF('landscape'); // Use landscape orientation
      
      // Add EXOZEN logo
      try {
        // Load and add the actual logo image
        const logoImg = new Image();
        logoImg.src = process.env.NODE_ENV === 'production' ? '/v1/asset/exozen_logo1.png' : '/exozen_logo1.png';
        
        // Wait for image to load
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
        });
        
        // Add logo to PDF (reduced height for better layout)
        doc.addImage(logoImg, 'PNG', 15, 15, 35, 12);
      } catch {
        console.log('Logo not available, using text fallback');
        // Fallback to text if image fails
        doc.setFillColor(255, 165, 0); // Orange color for ZEN logo
        doc.rect(15, 15, 30, 12, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('ZEN', 22, 21);
      }
      
      // Add project name below logo
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(user?.projectName || 'Unknown Project', 15, 35);
      
      // Add title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('ASSET DETAILS', 150, 28, { align: 'center' });
      
      // Add date
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 45);
       
      // Count unique TAG IDs - this is the true asset count
      const uniqueTagIds = [...new Set(filteredAssets.map(asset => asset.tagId))];
      
      // Remove duplicates based on tagId to ensure accurate counting
      const uniqueAssets = filteredAssets.filter((asset, index, self) => 
        index === self.findIndex(a => a.tagId === asset.tagId)
      );
      
      // Define table structure
      const columns = [
        { header: 'S.No', key: 'sno', width: 20 },
        { header: 'Serial Number', key: 'serialNumber', width: 60 },
        { header: 'Asset Tag Number', key: 'tagId', width: 50 },
        { header: 'Vendor Name', key: 'vendorName', width: 40 },
        { header: 'Asset Category', key: 'assetType', width: 35 },
        { header: 'Mobility Category', key: 'mobilityCategory', width: 35 },
        { header: 'Location', key: 'location', width: 60 }
      ];
      
      const startX = 15;
      const startY = 55;
      const rowHeight = 12;
      const headerHeight = 10;
      const totalTableWidth = columns.reduce((sum, col) => sum + col.width, 0);
      
      // Draw table headers
      doc.setFillColor(240, 240, 240);
      doc.rect(startX, startY, totalTableWidth, headerHeight, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      let currentX = startX;
      
      columns.forEach(column => {
        doc.text(column.header, currentX + 1, startY + 7);
        currentX += column.width;
      });
      
      // Draw header borders
      doc.setDrawColor(200, 200, 200);
      doc.line(startX, startY, startX + totalTableWidth, startY);
      doc.line(startX, startY + headerHeight, startX + totalTableWidth, startY + headerHeight);
      
      currentX = startX;
      columns.forEach(column => {
        doc.line(currentX, startY, currentX, startY + headerHeight);
        currentX += column.width;
      });
      
      // Process unique assets and create table rows
      let currentY = startY + headerHeight;
      
      for (let i = 0; i < uniqueAssets.length; i++) {
        const asset = uniqueAssets[i];
        
        // Check if we need a new page
        if (currentY > 190) {
          doc.addPage('landscape');
          currentY = 20;
          
          // Redraw table headers on new page
          doc.setFillColor(240, 240, 240);
          doc.rect(startX, currentY, totalTableWidth, headerHeight, 'F');
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          currentX = startX;
          
          columns.forEach(column => {
            doc.text(column.header, currentX + 1, currentY + 7);
            currentX += column.width;
          });
          
          currentY += headerHeight;
        }
        
        // Prepare row data
        const rowData = [
          (i + 1).toString(),
          asset.serialNumber || 'N/A',
          asset.tagId || 'N/A',
          asset.customFields?.['Vendor Name'] || asset.brand || 'N/A',
          asset.assetType || 'N/A',
          asset.mobilityCategory ? asset.mobilityCategory.charAt(0).toUpperCase() + asset.mobilityCategory.slice(1) : 'Not Set',
          formatLocation(asset.location)
        ];
        
        // Draw row borders
        doc.setDrawColor(200, 200, 200);
        doc.line(startX, currentY, startX + totalTableWidth, currentY);
        doc.line(startX, currentY + rowHeight, startX + totalTableWidth, currentY + rowHeight);
        
        // Draw column borders
        currentX = startX;
        columns.forEach(column => {
          doc.line(currentX, currentY, currentX, currentY + rowHeight);
          currentX += column.width;
        });
        
        // Add row data
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        currentX = startX;
        
        rowData.forEach((text, index) => {
          const column = columns[index];
          const maxWidth = column.width - 2;
          
          // Handle text wrapping for long content
          const lines = doc.splitTextToSize(text.toString(), maxWidth);
          const lineHeight = 4;
          
          lines.forEach((line: string, lineIndex: number) => {
            if (lineIndex === 0) {
              doc.text(line, currentX + 1, currentY + 7);
            } else if (currentY + 7 + (lineIndex * lineHeight) < currentY + rowHeight) {
              doc.text(line, currentX + 1, currentY + 7 + (lineIndex * lineHeight));
            }
          });
          
          currentX += column.width;
        });
        
        currentY += rowHeight;
      }
      
      // Draw final bottom border
      doc.setDrawColor(200, 200, 200);
      doc.line(startX, currentY, startX + totalTableWidth, currentY);
      
      // Add summary
      if (currentY > 150) {
        doc.addPage('landscape');
        currentY = 20;
      }
      
      const summaryStartY = currentY + 20;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('ASSET SUMMARY', startX + 5, summaryStartY);
      
      let summaryContentY = summaryStartY + 15;
      const summaryContentX = startX + 5;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Assets: ${uniqueTagIds.length}`, summaryContentX, summaryContentY);
      
      summaryContentY += 8;
      doc.setFont('helvetica', 'normal');
      doc.text(`Project: ${user?.projectName || 'Unknown Project'}`, summaryContentX, summaryContentY);
      
      summaryContentY += 6;
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, summaryContentX, summaryContentY);
      
      // Save the PDF
      const filename = `assets-report-${user?.projectName || 'project'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleExcelDownload = () => {
    console.log('Excel download initiated');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700', icon: '✓' },
      inactive: { color: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-700', icon: '✗' },
      maintenance: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-700', icon: '⚠' },
      intialization: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-700', icon: '⏱' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border`}>
        <span className="text-sm">{config.icon}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700' },
      medium: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-700' },
      high: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-700' },
      critical: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-700' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low;
    
    return (
      <Badge className={`${config.color} px-3 py-1.5 rounded-full text-xs font-semibold border`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const formatLocation = (location: Asset['location']) => {
    if (!location) return 'No location specified';
    
    if (typeof location === 'string') {
      return location;
    }
    
    if (typeof location === 'object') {
      const parts = [];
      if (location.building) parts.push(location.building);
      if (location.floor) parts.push(`${location.floor} floor`);
      if (location.room) parts.push(location.room);
      
      return parts.length > 0 ? parts.join(' - ') : 'Location specified';
    }
    
    return 'No location specified';
  };



  // Custom table component for the specific columns
  const ProjectAssetsTable = ({ assets }: { assets: Asset[] }) => {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 px-4 py-3 border-b border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Asset Inventory</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {assets.length} assets
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-3 p-4">
            {assets.map((asset) => (
              <div key={asset._id} className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200">
                {/* Asset Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                      {React.createElement(getAssetTypeIcon(asset.assetType || 'unknown'), {
                        className: "w-5 h-5 text-white"
                      })}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                        {asset.brand} {asset.model || ''}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {asset.assetType} • {asset.tagId || 'No Tag'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(asset.status || 'active')}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(asset)}
                      className="h-9 w-9 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Asset Details Grid */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Tag ID</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {asset.tagId || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Vendor</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {(() => {
                        const vendorName = asset.customFields?.['Vendor Name'];
                        return (typeof vendorName === 'string' ? vendorName : null) || asset.brand || 'N/A';
                      })()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Location</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-sm text-right max-w-[60%] truncate">
                      {formatLocation(asset.location)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Serial Number</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                      {asset.serialNumber || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 px-6 py-4 border-b border-slate-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Asset Inventory</h3>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {assets.length} assets
                </span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-600">
                  <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300 w-16">#</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300 min-w-[200px]">Asset Details</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300 min-w-[150px]">Tag & Serial</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300 min-w-[120px]">Vendor</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300 w-32">Category</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300 min-w-[180px]">Location</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300 w-28">Status</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate-700 dark:text-slate-300 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, index) => (
                  <tr key={asset._id} className="group border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-200">
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-medium">
                      <div className="flex items-center justify-center w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-semibold">
                        {index + 1}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                          {React.createElement(getAssetTypeIcon(asset.assetType || 'unknown'), {
                            className: "w-5 h-5 text-white"
                          })}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                            {asset.brand} {asset.model || ''}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {asset.assetType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {asset.tagId || 'N/A'}
                        </div>
                        {asset.serialNumber && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            SN: {asset.serialNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                        {(() => {
                          const vendorName = asset.customFields?.['Vendor Name'];
                          return (typeof vendorName === 'string' ? vendorName : null) || asset.brand || 'N/A';
                        })()}
                      </div>
                      {asset.customFields?.['HSN'] && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          HSN: {String(asset.customFields['HSN'])}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs font-medium border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        {asset.assetType || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="text-sm text-slate-900 dark:text-slate-100 truncate">
                          {formatLocation(asset.location)}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(asset.status || 'active')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(asset)}
                          className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Pagination Component
  const PaginationComponent = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-600">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <span>Showing</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {startIndex + 1}-{Math.min(endIndex, filteredAssets.length)}
          </span>
          <span>of</span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {filteredAssets.length}
          </span>
          <span>assets</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0 border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-2 py-1 text-slate-500 dark:text-slate-400">...</span>
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page as number)}
                    className={`h-8 w-8 p-0 text-sm ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0 border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">Loading Assets Dashboard...</p>
            <p className="text-sm text-slate-500 dark:text-slate-500">Please wait while we fetch your project data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="flex-1 overflow-auto">
        {/* Main Content */}
        <main className="px-4 pt-1 pb-1 sm:px-6 sm:pt-2 sm:pb-2 space-y-2 sm:space-y-3">
          {/* Simple Search and Actions */}
          <div className="flex items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search assets..."
                className="pl-10 h-10 text-sm bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button 
                onClick={handlePDFDownload}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Download PDF</span>
              </Button>
            </div>
          </div>



          {/* Assets Table */}
          <Card className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600 dark:text-gray-400">Loading assets...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Database className="w-12 h-12 text-red-500" />
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">Failed to load data</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
                      <Button 
                        onClick={fetchProjectAssets}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white">
                  <table className="w-full border-collapse font-sans text-base">
                    <thead>
                      <tr className="bg-white border-b border-blue-200">
                        <th className="border border-blue-200 px-4 py-3 text-left font-semibold text-blue-900 bg-blue-50 text-sm">
                          #
                        </th>
                        <th className="border border-blue-200 px-4 py-3 text-left font-semibold text-blue-900 bg-blue-50 text-sm">
                          ASSET DETAILS
                        </th>
                        <th className="border border-blue-200 px-4 py-3 text-left font-semibold text-blue-900 bg-blue-50 text-sm">
                          TAG & SERIAL
                        </th>
                        <th className="border border-blue-200 px-4 py-3 text-left font-semibold text-blue-900 bg-blue-50 text-sm">
                          VENDOR
                        </th>
                        <th className="border border-blue-200 px-4 py-3 text-left font-semibold text-blue-900 bg-blue-50 text-sm">
                          CATEGORY
                        </th>
                        <th className="border border-blue-200 px-4 py-3 text-left font-semibold text-blue-900 bg-blue-50 text-sm">
                          LOCATION
                        </th>
                        <th className="border border-blue-200 px-4 py-3 text-left font-semibold text-blue-900 bg-blue-50 text-sm">
                          STATUS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAssets.map((asset, index) => (
                        <tr key={asset._id} className="hover:bg-gray-50 transition-colors">
                          <td className="border border-blue-200 px-4 py-3 text-sm font-medium text-gray-700">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-sm font-semibold text-blue-700">
                              {startIndex + index + 1}
                            </div>
                          </td>
                          <td className="border border-blue-200 px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                {React.createElement(getAssetTypeIcon(asset.assetType || 'unknown'), {
                                  className: "w-5 h-5 text-blue-600"
                                })}
                              </div>
                              <div>
                                <span className="text-sm font-medium text-blue-600 cursor-pointer hover:underline">
                                  {asset.brand} {asset.model || ''}
                                </span>
                                <div className="text-sm text-gray-500">
                                  {asset.assetType}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="border border-blue-200 px-4 py-3">
                            <div>
                              <span className="text-sm font-medium text-blue-600 cursor-pointer hover:underline">
                                {asset.tagId || 'N/A'}
                              </span>
                              <div className="text-sm text-gray-500">
                                SN: {asset.serialNumber || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="border border-blue-200 px-4 py-3 text-sm text-gray-700">
                            {(() => {
                              const vendorName = asset.customFields?.['Vendor Name'];
                              return (typeof vendorName === 'string' ? vendorName : null) || asset.brand || 'N/A';
                            })()}
                          </td>
                          <td className="border border-blue-200 px-4 py-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                              {asset.assetType || 'Unknown'}
                            </span>
                          </td>
                          <td className="border border-blue-200 px-4 py-3 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-blue-500" />
                              <span className="truncate max-w-[120px]">
                                {formatLocation(asset.location)}
                              </span>
                            </div>
                          </td>
                          <td className="border border-blue-200 px-4 py-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              {asset.status || 'active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Empty State */}
          {!loading && !error && filteredAssets.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3 text-center">
                <Database className="w-12 h-12 text-gray-400" />
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">No assets found</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {projectAssets.length === 0 
                      ? `No assets found for project: ${user?.projectName || 'your project'}`
                      : 'No assets match your current search criteria'
                    }
                  </p>
                </div>
                {searchTerm && (
                  <Button 
                    onClick={() => setSearchTerm('')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Showing</span>
                <span className="font-semibold text-gray-900">
                  {startIndex + 1}-{Math.min(endIndex, filteredAssets.length)}
                </span>
                <span>of</span>
                <span className="font-semibold text-gray-900">
                  {filteredAssets.length}
                </span>
                <span>assets</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="h-8 w-8 p-0 text-sm"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Asset View Modal */}
          <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
            <DialogContent className="max-w-3xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  Asset Details
                </DialogTitle>
              </DialogHeader>
              
              {selectedAsset && (
                <div className="space-y-6">
                  {/* Asset Header */}
                  <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-slate-200 dark:border-slate-600">
                    <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl">
                      {React.createElement(getAssetTypeIcon(selectedAsset.assetType || 'unknown'), {
                        className: "w-8 h-8 text-white"
                      })}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {selectedAsset.tagId || 'Unknown Asset'}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        {selectedAsset.assetType || 'Unknown Type'} • {selectedAsset.brand || 'Unknown Brand'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedAsset.status || 'active')}
                      {getPriorityBadge(selectedAsset.priority || 'medium')}
                    </div>
                  </div>

                  {/* Asset Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Assigned To */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <User className="w-4 h-4" />
                        Assigned To
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                        <p className="text-sm text-slate-900 dark:text-white font-medium">
                          {typeof selectedAsset.assignedTo === 'object' && selectedAsset.assignedTo?.name 
                            ? selectedAsset.assignedTo.name 
                            : typeof selectedAsset.assignedTo === 'string' 
                            ? selectedAsset.assignedTo 
                            : 'Unassigned'}
                        </p>
                        {typeof selectedAsset.assignedTo === 'object' && selectedAsset.assignedTo?.email && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {selectedAsset.assignedTo.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <MapPin className="w-4 h-4" />
                        Location
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                        <p className="text-sm text-slate-900 dark:text-white font-medium">
                          {selectedAsset.location ? formatLocation(selectedAsset.location) : 'Location not specified'}
                        </p>
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <Calendar className="w-4 h-4" />
                        Created
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                        <p className="text-sm text-slate-900 dark:text-white font-medium">
                          {selectedAsset.createdAt ? formatDate(selectedAsset.createdAt) : 'Date not available'}
                        </p>
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <Clock className="w-4 h-4" />
                        Last Updated
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                        <p className="text-sm text-slate-900 dark:text-white font-medium">
                          {selectedAsset.updatedAt ? formatDate(selectedAsset.updatedAt) : 'Date not available'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  {selectedAsset.notes && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <FileText className="w-4 h-4" />
                        Notes
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                        <p className="text-sm text-slate-900 dark:text-white">
                          {selectedAsset.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-600">
                    <Button
                      variant="outline"
                      onClick={closeViewModal}
                      className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Close
                    </Button>
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Asset
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}

export default function AssetsLogsPage() {
  return (
    <ReportProvider>
      <AssetsLogsContent />
    </ReportProvider>
  );
} 