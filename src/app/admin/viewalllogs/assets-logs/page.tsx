'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { LoadingSpinner } from '../../../../components/ui/loading-spinner';
import { ReportProvider, useReportContext } from '../../../../contexts/ReportContext';
import { filterAssets, type Asset, type SubAsset } from '../../../../lib/Report';
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
  Building,
  Smartphone,
  Monitor,
  Server,
  Eye,
  Database,
  ChevronLeft,
  ChevronRight,
  Download
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

interface SubAssets {
  movable?: SubAsset[];
  immovable?: SubAsset[];
}

interface ExtendedAsset extends Asset {
  subAssets?: SubAssets;
}

function AssetsLogsContent() {
  const { user } = useAuth();
  const { loading, error } = useReportContext();
  const [projectAssets, setProjectAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy] = useState('updatedAt');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
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
      
      const doc = new jsPDF('portrait'); // Use portrait orientation
      
      // Clean Header Design
      try {
        // Add EXOZEN logo image
        const logoUrl = '/exozen_logo1.png'
        doc.addImage(logoUrl, 'PNG', 15, 8, 30, 12)
      } catch {
        // Fallback to text if image fails to load
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text('EXOZEN', 15, 18)
      }
      
      // Report Title and Project Info
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Asset Classification Report', 50, 12)
      
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Project: ${user?.projectName || 'Unknown Project'}`, 50, 18)
      
      // Date and Summary Info
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 12)
      doc.text(`Total Assets: ${filteredAssets.length}`, 150, 16)
      doc.text(`Report Type: Asset Inventory`, 150, 20)
      
      // Header separator line
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(15, 25, 195, 25)
      
      // Count unique TAG IDs - this is the true asset count
      const uniqueTagIds = [...new Set(filteredAssets.map(asset => asset.tagId))];
      
      // Remove duplicates based on tagId to ensure accurate counting
      const uniqueAssets = filteredAssets.filter((asset, index, self) => 
        index === self.findIndex(a => a.tagId === asset.tagId)
      );
      
      // Define table structure for main assets (portrait format)
      const columns = [
        { header: 'S.No', key: 'sno', width: 12 },
        { header: 'Asset Tag', key: 'tagId', width: 30 },
        { header: 'Asset Type', key: 'assetType', width: 25 },
        { header: 'Brand', key: 'brand', width: 35 },
        { header: 'Model', key: 'model', width: 25 },
        { header: 'Serial Number', key: 'serialNumber', width: 30 },
        { header: 'Status', key: 'status', width: 20 }
      ];
      
      const startX = 15;
      const startY = 35;
      const rowHeight = 10;
      const headerHeight = 8;
      const totalTableWidth = columns.reduce((sum, col) => sum + col.width, 0);
      
      // Draw table headers with blue styling
      doc.setFillColor(59, 130, 246); // Blue header background
      doc.rect(startX, startY, totalTableWidth, headerHeight, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255); // White text
      let currentX = startX;
      
      columns.forEach(column => {
        doc.text(column.header, currentX + 1, startY + 6);
        currentX += column.width;
      });
      
      // Draw header borders
      doc.setDrawColor(37, 99, 235); // Darker blue border
      doc.setLineWidth(0.5);
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
        if (currentY > 250) {
          doc.addPage('portrait');
          currentY = 20;
          
          // Redraw table headers on new page
          doc.setFillColor(59, 130, 246);
          doc.rect(startX, currentY, totalTableWidth, headerHeight, 'F');
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          currentX = startX;
          
          columns.forEach(column => {
            doc.text(column.header, currentX + 1, currentY + 6);
            currentX += column.width;
          });
          
          currentY += headerHeight;
        }
        
        // Prepare row data
        const rowData = [
          (i + 1).toString(),
          asset.tagId || 'N/A',
          asset.assetType || 'N/A',
          asset.brand || 'N/A',
          asset.model || 'N/A',
          asset.serialNumber || 'N/A',
          asset.status || 'N/A'
        ];
        
        // Draw row borders
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(startX, currentY, startX + totalTableWidth, currentY);
        doc.line(startX, currentY + rowHeight, startX + totalTableWidth, currentY + rowHeight);
        
        // Draw column borders
        currentX = startX;
        columns.forEach(column => {
          doc.line(currentX, currentY, currentX, currentY + rowHeight);
          currentX += column.width;
        });
        
        // Add row data
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        currentX = startX;
        
        rowData.forEach((text, index) => {
          const column = columns[index];
          const maxWidth = column.width - 2;
          
          // Handle text wrapping for long content
          const lines = doc.splitTextToSize(text.toString(), maxWidth);
          const lineHeight = 3;
          
          lines.forEach((line: string, lineIndex: number) => {
            if (lineIndex === 0) {
              doc.text(line, currentX + 1, currentY + 6);
            } else if (currentY + 6 + (lineIndex * lineHeight) < currentY + rowHeight) {
              doc.text(line, currentX + 1, currentY + 6 + (lineIndex * lineHeight));
            }
          });
          
          currentX += column.width;
        });
        
        currentY += rowHeight;
      }
      
      // No final bottom border needed
      
      // Add Sub-Assets section for each main asset
      currentY += 15;
      
      for (let i = 0; i < uniqueAssets.length; i++) {
        const asset = uniqueAssets[i];
        
        // Check if we need a new page
        if (currentY > 200) {
          doc.addPage('portrait');
          currentY = 20;
        }
        
        // Asset header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`${asset.tagId} - ${asset.subcategory || asset.assetType}`, startX, currentY);
        
        currentY += 8;
        
        // Location info
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Location: ${formatLocation(asset.location || null)}`, startX, currentY);
        currentY += 5;
        
        // Sub-assets tables
        if ((asset as ExtendedAsset).subAssets) {
          const subAssets = (asset as ExtendedAsset).subAssets;
          
          // Movable Assets Table
          if (subAssets?.movable && subAssets.movable.length > 0) {
          const movableColumns = [
            { header: '#', key: 'sno', width: 8 },
            { header: 'Tag ID', key: 'tagId', width: 25 },
            { header: 'Component Name', key: 'name', width: 35 },
            { header: 'Brand', key: 'brand', width: 22 },
            { header: 'Model', key: 'model', width: 22 },
            { header: 'Capacity', key: 'capacity', width: 15 },
            { header: 'Location', key: 'location', width: 28 }
          ];
            
            const movableTableWidth = movableColumns.reduce((sum, col) => sum + col.width, 0);
            
            // Movable header
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Movable Components:', startX, currentY);
            currentY += 6;
            
            // Draw movable table headers
            doc.setFillColor(240, 248, 255); // Light blue for movable
            doc.rect(startX, currentY, movableTableWidth, headerHeight, 'F');
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            currentX = startX;
            
            movableColumns.forEach(column => {
              doc.text(column.header, currentX + 1, currentY + 6);
              currentX += column.width;
            });
            
            // Draw borders
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(startX, currentY, startX + movableTableWidth, currentY);
            doc.line(startX, currentY + headerHeight, startX + movableTableWidth, currentY + headerHeight);
            
            currentX = startX;
            movableColumns.forEach(column => {
              doc.line(currentX, currentY, currentX, currentY + headerHeight);
              currentX += column.width;
            });
            
            currentY += headerHeight;
            
            // Add movable data rows
            (asset as ExtendedAsset).subAssets?.movable?.forEach((subAsset: SubAsset, index: number) => {
              const rowData = [
                (index + 1).toString(),
                subAsset.tagId || 'N/A',
                subAsset.assetName || 'N/A',
                subAsset.brand || 'N/A',
                subAsset.model || 'N/A',
                subAsset.capacity || 'N/A',
                subAsset.location || 'N/A'
              ];
              
              // Draw row borders
              doc.setDrawColor(220, 220, 220);
              doc.line(startX, currentY, startX + movableTableWidth, currentY);
              doc.line(startX, currentY + rowHeight, startX + movableTableWidth, currentY + rowHeight);
              
              // Draw column borders
              currentX = startX;
              movableColumns.forEach(column => {
                doc.line(currentX, currentY, currentX, currentY + rowHeight);
                currentX += column.width;
              });
              
              // Add row data
              doc.setFontSize(7);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(0, 0, 0);
              currentX = startX;
              
              rowData.forEach((text, colIndex) => {
                const column = movableColumns[colIndex];
                const maxWidth = column.width - 2;
                
                const lines = doc.splitTextToSize(text.toString(), maxWidth);
                const lineHeight = 3;
                
                lines.forEach((line: string, lineIndex: number) => {
                  if (lineIndex === 0) {
                    doc.text(line, currentX + 1, currentY + 6);
                  } else if (currentY + 6 + (lineIndex * lineHeight) < currentY + rowHeight) {
                    doc.text(line, currentX + 1, currentY + 6 + (lineIndex * lineHeight));
                  }
                });
                
                currentX += column.width;
              });
              
              currentY += rowHeight;
            });
            
            currentY += 5;
          }
          
          // Immovable Assets Table
          if (subAssets?.immovable && subAssets.immovable.length > 0) {
          const immovableColumns = [
            { header: '#', key: 'sno', width: 8 },
            { header: 'Tag ID', key: 'tagId', width: 25 },
            { header: 'Component Name', key: 'name', width: 35 },
            { header: 'Brand', key: 'brand', width: 22 },
            { header: 'Model', key: 'model', width: 22 },
            { header: 'Capacity', key: 'capacity', width: 15 },
            { header: 'Location', key: 'location', width: 28 }
          ];
            
            const immovableTableWidth = immovableColumns.reduce((sum, col) => sum + col.width, 0);
            
            // Immovable header
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Immovable Components:', startX, currentY);
            currentY += 6;
            
            // Draw immovable table headers
            doc.setFillColor(248, 255, 248); // Light green for immovable
            doc.rect(startX, currentY, immovableTableWidth, headerHeight, 'F');
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            currentX = startX;
            
            immovableColumns.forEach(column => {
              doc.text(column.header, currentX + 1, currentY + 6);
              currentX += column.width;
            });
            
            // Draw borders
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(startX, currentY, startX + immovableTableWidth, currentY);
            doc.line(startX, currentY + headerHeight, startX + immovableTableWidth, currentY + headerHeight);
            
            currentX = startX;
            immovableColumns.forEach(column => {
              doc.line(currentX, currentY, currentX, currentY + headerHeight);
              currentX += column.width;
            });
            
            currentY += headerHeight;
            
            // Add immovable data rows
            (asset as ExtendedAsset).subAssets?.immovable?.forEach((subAsset: SubAsset, index: number) => {
              const rowData = [
                (index + 1).toString(),
                subAsset.tagId || 'N/A',
                subAsset.assetName || 'N/A',
                subAsset.brand || 'N/A',
                subAsset.model || 'N/A',
                subAsset.capacity || 'N/A',
                subAsset.location || 'N/A'
              ];
              
              // Draw row borders
              doc.setDrawColor(220, 220, 220);
              doc.line(startX, currentY, startX + immovableTableWidth, currentY);
              doc.line(startX, currentY + rowHeight, startX + immovableTableWidth, currentY + rowHeight);
              
              // Draw column borders
              currentX = startX;
              immovableColumns.forEach(column => {
                doc.line(currentX, currentY, currentX, currentY + rowHeight);
                currentX += column.width;
              });
              
              // Add row data
              doc.setFontSize(7);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(0, 0, 0);
              currentX = startX;
              
              rowData.forEach((text, colIndex) => {
                const column = immovableColumns[colIndex];
                const maxWidth = column.width - 2;
                
                const lines = doc.splitTextToSize(text.toString(), maxWidth);
                const lineHeight = 3;
                
                lines.forEach((line: string, lineIndex: number) => {
                  if (lineIndex === 0) {
                    doc.text(line, currentX + 1, currentY + 6);
                  } else if (currentY + 6 + (lineIndex * lineHeight) < currentY + rowHeight) {
                    doc.text(line, currentX + 1, currentY + 6 + (lineIndex * lineHeight));
                  }
                });
                
                currentX += column.width;
              });
              
              currentY += rowHeight;
            });
            
            currentY += 10;
          }
        }
      }
      
      // Add summary section
      if (currentY > 200) {
        doc.addPage('portrait');
        currentY = 20;
      }
      
      const summaryStartY = currentY + 10;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('ASSET SUMMARY', startX, summaryStartY);
      
      let summaryContentY = summaryStartY + 15;
      const summaryContentX = startX;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Assets: ${uniqueTagIds.length}`, summaryContentX, summaryContentY);
      
      summaryContentY += 8;
      doc.setFont('helvetica', 'normal');
      doc.text(`Project: ${user?.projectName || 'Unknown Project'}`, summaryContentX, summaryContentY);
      
      summaryContentY += 6;
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, summaryContentX, summaryContentY);
      
      // Add footer
      const pageHeight = doc.internal.pageSize.height;
      const footerY = pageHeight - 10;
      
      // Footer separator line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(15, footerY - 5, 195, footerY - 5);
      
      // Footer text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Generated by EXOZEN Digital Asset Management System', 15, footerY);
      doc.text(`Page 1 of 1`, 195, footerY, { align: 'right' });
      
      // Save the PDF
      const filename = `assets-report-${user?.projectName || 'project'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
    } catch {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleIndividualDownload = async (asset: Asset) => {
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      
      const doc = new jsPDF('portrait');
      
      // Clean Header Design
      try {
        // Add EXOZEN logo image
        const logoUrl = '/exozen_logo1.png'
        doc.addImage(logoUrl, 'PNG', 15, 8, 30, 12)
      } catch {
        // Fallback to text if image fails to load
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text('EXOZEN', 15, 18)
      }
      
      // Report Title and Asset Info
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Individual Asset Report', 50, 12)
      
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Asset: ${asset.tagId || 'Unknown'}`, 50, 18)
      doc.text(`Project: ${user?.projectName || 'Unknown Project'}`, 50, 22)
      
      // Date and Summary Info
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 12)
      doc.text(`Asset Type: ${asset.assetType || 'Unknown'}`, 150, 16)
      doc.text(`Status: ${asset.status || 'Unknown'}`, 150, 20)
      
      // Header separator line
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(15, 25, 195, 25)
      
      // Asset Details Section
      let currentY = 35;
      
      // Asset Header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`Asset Details: ${asset.tagId || 'Unknown Asset'}`, 15, currentY);
      currentY += 8;
      
      // Comprehensive Asset Information Table
      const assetDetails = [
        ['Asset Tag', asset.tagId || 'N/A'],
        ['Asset Type', asset.assetType || 'N/A'],
        ['Subcategory', asset.subcategory || 'N/A'],
        ['Brand', asset.brand || 'N/A'],
        ['Model', asset.model || 'N/A'],
        ['Serial Number', asset.serialNumber || 'N/A'],
        ['Capacity', asset.capacity || 'N/A'],
        ['Year of Installation', asset.yearOfInstallation || 'N/A'],
        ['Mobility Category', asset.mobilityCategory || 'N/A'],
        ['Digital Tag Type', asset.digitalTagType || 'N/A'],
        ['Status', asset.status || 'N/A'],
        ['Priority', asset.priority || 'N/A'],
        ['Project', asset.project?.projectName || 'N/A'],
        ['Location', formatLocation(asset.location || null)]
      ];
      
      // Draw asset details table
      const tableWidth = 180;
      const rowHeight = 8;
      const headerHeight = 6;
      let currentX = 15;
      
      // Table header
      doc.setFillColor(59, 130, 246);
      doc.rect(15, currentY, tableWidth, headerHeight, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('Property', 17, currentY + 4);
      doc.text('Value', 100, currentY + 4);
      
      // Draw header borders
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.5);
      doc.line(15, currentY, 15 + tableWidth, currentY);
      doc.line(15, currentY + headerHeight, 15 + tableWidth, currentY + headerHeight);
      doc.line(15, currentY, 15, currentY + headerHeight);
      doc.line(100, currentY, 100, currentY + headerHeight);
      doc.line(15 + tableWidth, currentY, 15 + tableWidth, currentY + headerHeight);
      
      currentY += headerHeight;
      
      // Add asset details rows
      assetDetails.forEach(([property, value]) => {
        // Check if we need a new page
        if (currentY > 250) {
          doc.addPage('portrait');
          currentY = 20;
        }
        
        // Draw row borders
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(15, currentY, 15 + tableWidth, currentY);
        doc.line(15, currentY + rowHeight, 15 + tableWidth, currentY + rowHeight);
        doc.line(15, currentY, 15, currentY + rowHeight);
        doc.line(100, currentY, 100, currentY + rowHeight);
        doc.line(15 + tableWidth, currentY, 15 + tableWidth, currentY + rowHeight);
        
        // Add row data
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(property, 17, currentY + 5);
        
        // Handle long values with text wrapping
        const maxWidth = tableWidth - 85;
        const lines = doc.splitTextToSize(value.toString(), maxWidth);
        const lineHeight = 3;
        
        lines.forEach((line: string, lineIndex: number) => {
          if (lineIndex === 0) {
            doc.text(line, 102, currentY + 5);
          } else if (currentY + 5 + (lineIndex * lineHeight) < currentY + rowHeight) {
            doc.text(line, 102, currentY + 5 + (lineIndex * lineHeight));
          }
        });
        
        currentY += rowHeight;
      });
      
      // Add Digital Assets section if available
      if ((asset as ExtendedAsset).digitalAssets) {
        currentY += 10;
        
        if (currentY > 200) {
          doc.addPage('portrait');
          currentY = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Digital Assets:', 15, currentY);
        currentY += 8;
        
        const digitalAssetsTable = [
          ['Type', 'Generated At', 'Status']
        ];
        
        if ((asset as ExtendedAsset).digitalAssets?.qrCode) {
          digitalAssetsTable.push([
            'QR Code',
            (asset as ExtendedAsset).digitalAssets?.qrCode?.generatedAt ? formatDate((asset as ExtendedAsset).digitalAssets?.qrCode?.generatedAt || '') : 'N/A',
            'Generated'
          ]);
        }
        
        if ((asset as ExtendedAsset).digitalAssets?.barcode) {
          digitalAssetsTable.push([
            'Barcode',
            (asset as ExtendedAsset).digitalAssets?.barcode?.generatedAt ? formatDate((asset as ExtendedAsset).digitalAssets?.barcode?.generatedAt || '') : 'N/A',
            'Generated'
          ]);
        }
        
        if ((asset as ExtendedAsset).digitalAssets?.nfcData) {
          digitalAssetsTable.push([
            'NFC Data',
            (asset as ExtendedAsset).digitalAssets?.nfcData?.generatedAt ? formatDate((asset as ExtendedAsset).digitalAssets?.nfcData?.generatedAt || '') : 'N/A',
            'Generated'
          ]);
        }
        
        if (digitalAssetsTable.length > 1) {
          const digitalTableWidth = 180;
          const digitalRowHeight = 8;
          const digitalHeaderHeight = 6;
          
          // Table header
          doc.setFillColor(59, 130, 246);
          doc.rect(15, currentY, digitalTableWidth, digitalHeaderHeight, 'F');
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text('Type', 17, currentY + 4);
          doc.text('Generated At', 70, currentY + 4);
          doc.text('Status', 140, currentY + 4);
          
          // Draw header borders
          doc.setDrawColor(37, 99, 235);
          doc.setLineWidth(0.5);
          doc.line(15, currentY, 15 + digitalTableWidth, currentY);
          doc.line(15, currentY + digitalHeaderHeight, 15 + digitalTableWidth, currentY + digitalHeaderHeight);
          doc.line(15, currentY, 15, currentY + digitalHeaderHeight);
          doc.line(70, currentY, 70, currentY + digitalHeaderHeight);
          doc.line(140, currentY, 140, currentY + digitalHeaderHeight);
          doc.line(15 + digitalTableWidth, currentY, 15 + digitalTableWidth, currentY + digitalHeaderHeight);
          
          currentY += digitalHeaderHeight;
          
          // Add digital assets rows
          digitalAssetsTable.slice(1).forEach(([type, generatedAt, status]) => {
            if (currentY > 250) {
              doc.addPage('portrait');
              currentY = 20;
            }
            
            // Draw row borders
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.3);
            doc.line(15, currentY, 15 + digitalTableWidth, currentY);
            doc.line(15, currentY + digitalRowHeight, 15 + digitalTableWidth, currentY + digitalRowHeight);
            doc.line(15, currentY, 15, currentY + digitalRowHeight);
            doc.line(70, currentY, 70, currentY + digitalRowHeight);
            doc.line(140, currentY, 140, currentY + digitalRowHeight);
            doc.line(15 + digitalTableWidth, currentY, 15 + digitalTableWidth, currentY + digitalRowHeight);
            
            // Add row data
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(type, 17, currentY + 5);
            doc.text(generatedAt, 72, currentY + 5);
            doc.text(status, 142, currentY + 5);
            
            currentY += digitalRowHeight;
          });
        }
      }
      
      // Add Sub-Assets section if available
      if ((asset as ExtendedAsset).subAssets) {
        currentY += 10;
        
        // Movable Assets
        if ((asset as ExtendedAsset).subAssets?.movable && ((asset as ExtendedAsset).subAssets?.movable as SubAsset[]).length > 0) {
          if (currentY > 200) {
            doc.addPage('portrait');
            currentY = 20;
          }
          
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text(`Movable Components (${((asset as ExtendedAsset).subAssets?.movable as SubAsset[]).length}):`, 15, currentY);
          currentY += 8;
          
          const movableColumns = [
            { header: '#', key: 'sno', width: 8 },
            { header: 'Tag ID', key: 'tagId', width: 25 },
            { header: 'Component Name', key: 'name', width: 40 },
            { header: 'Brand', key: 'brand', width: 22 },
            { header: 'Model', key: 'model', width: 22 },
            { header: 'Capacity', key: 'capacity', width: 15 },
            { header: 'Location', key: 'location', width: 28 }
          ];
          
          const movableTableWidth = movableColumns.reduce((sum, col) => sum + col.width, 0);
          
          // Draw movable table headers
          doc.setFillColor(240, 248, 255); // Light blue for movable
          doc.rect(15, currentY, movableTableWidth, headerHeight, 'F');
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          let currentX = 15;
          
          movableColumns.forEach(column => {
            doc.text(column.header, currentX + 1, currentY + 4);
            currentX += column.width;
          });
          
          // Draw borders
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.3);
          doc.line(15, currentY, 15 + movableTableWidth, currentY);
          doc.line(15, currentY + headerHeight, 15 + movableTableWidth, currentY + headerHeight);
          
          currentX = 15;
          movableColumns.forEach(column => {
            doc.line(currentX, currentY, currentX, currentY + headerHeight);
            currentX += column.width;
          });
          
          currentY += headerHeight;
          
          // Add movable data rows
          ((asset as ExtendedAsset).subAssets?.movable as SubAsset[]).forEach((subAsset: SubAsset, index: number) => {
            if (currentY > 250) {
              doc.addPage('portrait');
              currentY = 20;
            }
            
            const rowData = [
              (index + 1).toString(),
              subAsset.tagId || 'N/A',
              subAsset.assetName || 'N/A',
              subAsset.brand || 'N/A',
              subAsset.model || 'N/A',
              subAsset.capacity || 'N/A',
              subAsset.location || 'N/A'
            ];
            
            // Draw row borders
            doc.setDrawColor(220, 220, 220);
            doc.line(15, currentY, 15 + movableTableWidth, currentY);
            doc.line(15, currentY + rowHeight, 15 + movableTableWidth, currentY + rowHeight);
            
            // Draw column borders
            currentX = 15;
            movableColumns.forEach(column => {
              doc.line(currentX, currentY, currentX, currentY + rowHeight);
              currentX += column.width;
            });
            
            // Add row data
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            currentX = 15;
            
            rowData.forEach((text, colIndex) => {
              const column = movableColumns[colIndex];
              const maxWidth = column.width - 2;
              
              const lines = doc.splitTextToSize(text.toString(), maxWidth);
              const lineHeight = 3;
              
              lines.forEach((line: string, lineIndex: number) => {
                if (lineIndex === 0) {
                  doc.text(line, currentX + 1, currentY + 5);
                } else if (currentY + 5 + (lineIndex * lineHeight) < currentY + rowHeight) {
                  doc.text(line, currentX + 1, currentY + 5 + (lineIndex * lineHeight));
                }
              });
              
              currentX += column.width;
            });
            
            currentY += rowHeight;
          });
          
          currentY += 5;
        }
        
        // Immovable Assets
        if ((asset as ExtendedAsset).subAssets?.immovable && ((asset as ExtendedAsset).subAssets?.immovable as SubAsset[]).length > 0) {
          if (currentY > 200) {
            doc.addPage('portrait');
            currentY = 20;
          }
          
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text(`Immovable Components (${((asset as ExtendedAsset).subAssets?.immovable as SubAsset[]).length}):`, 15, currentY);
          currentY += 8;
          
          const immovableColumns = [
            { header: '#', key: 'sno', width: 8 },
            { header: 'Tag ID', key: 'tagId', width: 25 },
            { header: 'Component Name', key: 'name', width: 40 },
            { header: 'Brand', key: 'brand', width: 22 },
            { header: 'Model', key: 'model', width: 22 },
            { header: 'Capacity', key: 'capacity', width: 15 },
            { header: 'Location', key: 'location', width: 28 }
          ];
          
          const immovableTableWidth = immovableColumns.reduce((sum, col) => sum + col.width, 0);
          
          // Draw immovable table headers
          doc.setFillColor(248, 255, 248); // Light green for immovable
          doc.rect(15, currentY, immovableTableWidth, headerHeight, 'F');
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          currentX = 15;
          
          immovableColumns.forEach(column => {
            doc.text(column.header, currentX + 1, currentY + 4);
            currentX += column.width;
          });
          
          // Draw borders
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.3);
          doc.line(15, currentY, 15 + immovableTableWidth, currentY);
          doc.line(15, currentY + headerHeight, 15 + immovableTableWidth, currentY + headerHeight);
          
          currentX = 15;
          immovableColumns.forEach(column => {
            doc.line(currentX, currentY, currentX, currentY + headerHeight);
            currentX += column.width;
          });
          
          currentY += headerHeight;
          
          // Add immovable data rows
          ((asset as ExtendedAsset).subAssets?.immovable as SubAsset[]).forEach((subAsset: SubAsset, index: number) => {
            if (currentY > 250) {
              doc.addPage('portrait');
              currentY = 20;
            }
            
            const rowData = [
              (index + 1).toString(),
              subAsset.tagId || 'N/A',
              subAsset.assetName || 'N/A',
              subAsset.brand || 'N/A',
              subAsset.model || 'N/A',
              subAsset.capacity || 'N/A',
              subAsset.location || 'N/A'
            ];
            
            // Draw row borders
            doc.setDrawColor(220, 220, 220);
            doc.line(15, currentY, 15 + immovableTableWidth, currentY);
            doc.line(15, currentY + rowHeight, 15 + immovableTableWidth, currentY + rowHeight);
            
            // Draw column borders
            currentX = 15;
            immovableColumns.forEach(column => {
              doc.line(currentX, currentY, currentX, currentY + rowHeight);
              currentX += column.width;
            });
            
            // Add row data
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            currentX = 15;
            
            rowData.forEach((text, colIndex) => {
              const column = immovableColumns[colIndex];
              const maxWidth = column.width - 2;
              
              const lines = doc.splitTextToSize(text.toString(), maxWidth);
              const lineHeight = 3;
              
              lines.forEach((line: string, lineIndex: number) => {
                if (lineIndex === 0) {
                  doc.text(line, currentX + 1, currentY + 5);
                } else if (currentY + 5 + (lineIndex * lineHeight) < currentY + rowHeight) {
                  doc.text(line, currentX + 1, currentY + 5 + (lineIndex * lineHeight));
                }
              });
              
              currentX += column.width;
            });
            
            currentY += rowHeight;
          });
          
          currentY += 10;
        }
      }
      
      // Add notes if available
      if (asset.notes) {
        if (currentY > 200) {
          doc.addPage('portrait');
          currentY = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Notes:', 15, currentY);
        currentY += 8;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const noteLines = doc.splitTextToSize(asset.notes, 180);
        noteLines.forEach((line: string) => {
          if (currentY > 250) {
            doc.addPage('portrait');
            currentY = 20;
          }
          doc.text(line, 15, currentY);
          currentY += 5;
        });
      }
      
      // Add footer
      const pageHeight = doc.internal.pageSize.height;
      const footerY = pageHeight - 10;
      
      // Footer separator line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(15, footerY - 5, 195, footerY - 5);
      
      // Footer text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Generated by EXOZEN Digital Asset Management System', 15, footerY);
      doc.text(`Asset: ${asset.tagId || 'Unknown'}`, 195, footerY, { align: 'right' });
      
      // Save the PDF
      const filename = `asset-${asset.tagId || 'unknown'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
    } catch {
      console.error('Error generating individual asset PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
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




  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-lg text-muted-foreground font-medium">Loading Assets Dashboard...</p>
            <p className="text-sm text-muted-foreground">Please wait while we fetch your project data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background transition-colors duration-200">
      <div className="flex-1 overflow-auto">
        {/* Main Content */}
        <main className="px-4 pt-1 pb-1 sm:px-6 sm:pt-2 sm:pb-2 space-y-2 sm:space-y-3">
          {/* Simple Search and Actions */}
          <div className="flex items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                className="pl-10 h-10 text-sm"
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
          <Card className="border-border">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-muted-foreground">Loading assets...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Database className="w-12 h-12 text-destructive" />
                    <div>
                      <p className="text-lg font-semibold text-foreground">Failed to load data</p>
                      <p className="text-sm text-muted-foreground">{error}</p>
                      <Button 
                        onClick={fetchProjectAssets}
                        className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto bg-background">
                  <table className="w-full border-collapse font-sans text-base">
                    <thead>
                      <tr className="bg-blue-50 dark:bg-slate-800 border-b border-border">
                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm">
                          #
                        </th>
                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm">
                          ASSET DETAILS
                        </th>
                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm">
                          TAG & SERIAL
                        </th>
                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm">
                          Brand
                        </th>
                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm">
                          CATEGORY
                        </th>
                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm">
                          LOCATION
                        </th>
                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm">
                          STATUS
                        </th>
                        <th className="border border-border px-4 py-3 text-left font-semibold text-blue-800 dark:text-slate-200 bg-blue-50 dark:bg-slate-800 text-sm">
                          ACTIONS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAssets.map((asset, index) => (
                        <tr key={asset._id} className="hover:bg-muted transition-colors">
                          <td className="border border-border px-4 py-3 text-sm font-medium text-blue-800">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full text-sm font-semibold text-blue-800">
                              {startIndex + index + 1}
                            </div>
                          </td>
                          <td className="border border-border px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-muted rounded-lg">
                                {React.createElement(getAssetTypeIcon(asset.assetType || 'unknown'), {
                                  className: "w-5 h-5 text-muted-foreground"
                                })}
                              </div>
                              <div>
                                <span className="text-sm font-medium text-primary cursor-pointer hover:underline">
                                  {asset.brand} {asset.model || ''}
                                </span>
                                <div className="text-sm text-muted-foreground">
                                  {asset.assetType}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="border border-border px-4 py-3">
                            <div>
                              <span className="text-sm font-medium text-primary cursor-pointer hover:underline">
                                {asset.tagId || 'N/A'}
                              </span>
                              <div className="text-sm text-muted-foreground">
                                SN: {asset.serialNumber || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="border border-border px-4 py-3 text-sm text-muted-foreground">
                            {(() => {
                              const vendorName = asset.customFields?.['Vendor Name'];
                              return (typeof vendorName === 'string' ? vendorName : null) || asset.brand || 'N/A';
                            })()}
                          </td>
                          <td className="border border-border px-4 py-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
                              {asset.assetType || 'Unknown'}
                            </span>
                          </td>
                          <td className="border border-border px-4 py-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className="truncate max-w-[120px]">
                                {formatLocation(asset.location || null)}
                              </span>
                            </div>
                          </td>
                          <td className="border border-border px-4 py-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                              {asset.status || 'active'}
                            </span>
                          </td>
                          <td className="border border-border px-4 py-3">
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleIndividualDownload(asset)}
                                className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
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
                <Database className="w-12 h-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-semibold text-foreground">No assets found</p>
                  <p className="text-sm text-muted-foreground">
                    {projectAssets.length === 0 
                      ? `No assets found for project: ${user?.projectName || 'your project'}`
                      : 'No assets match your current search criteria'
                    }
                  </p>
                </div>
                {searchTerm && (
                  <Button 
                    onClick={() => setSearchTerm('')}
                    className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-muted border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Showing</span>
                <span className="font-semibold text-foreground">
                  {startIndex + 1}-{Math.min(endIndex, filteredAssets.length)}
                </span>
                <span>of</span>
                <span className="font-semibold text-foreground">
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
            <DialogContent className="max-w-4xl max-h-[90vh] bg-card border-border overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  Asset Details
                </DialogTitle>
              </DialogHeader>
              
              {selectedAsset && (
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="space-y-6">
                  {/* Asset Header */}
                  <div className="flex items-center gap-4 p-6 bg-muted rounded-xl border border-border">
                    <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl">
                      {React.createElement(getAssetTypeIcon(selectedAsset.assetType || 'unknown'), {
                        className: "w-8 h-8 text-white"
                      })}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground">
                        {selectedAsset.tagId || 'Unknown Asset'}
                      </h3>
                      <p className="text-muted-foreground">
                        {selectedAsset.assetType || 'Unknown Type'} • {selectedAsset.brand || 'Unknown Brand'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedAsset.status || 'active')}
                      {getPriorityBadge(selectedAsset.priority || 'medium')}
                    </div>
                  </div>

                  {/* Comprehensive Asset Information Table */}
                  <div className="space-y-6">
                    {/* Basic Asset Information */}
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        Asset Information
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-border rounded-lg">
                          <thead>
                            <tr className="bg-muted">
                              <th className="border border-border px-4 py-2 text-left font-semibold text-sm">Property</th>
                              <th className="border border-border px-4 py-2 text-left font-semibold text-sm">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Asset Tag</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">{selectedAsset.tagId || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Asset Type</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">{selectedAsset.assetType || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Subcategory</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">{selectedAsset.subcategory || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Brand</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">{selectedAsset.brand || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Model</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">{selectedAsset.model || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Serial Number</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">{selectedAsset.serialNumber || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Capacity</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">{selectedAsset.capacity || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Year of Installation</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">{selectedAsset.yearOfInstallation || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Mobility Category</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">{selectedAsset.mobilityCategory || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Digital Tag Type</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">{selectedAsset.digitalTagType || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Status</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">{selectedAsset.status || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Priority</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">{selectedAsset.priority || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Assigned To</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">
                                {typeof selectedAsset.assignedTo === 'object' && selectedAsset.assignedTo?.name 
                                  ? `${selectedAsset.assignedTo.name} (${selectedAsset.assignedTo.email})`
                                  : typeof selectedAsset.assignedTo === 'string' 
                                  ? selectedAsset.assignedTo 
                                  : 'Unassigned'}
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Created By</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">
                                {selectedAsset.createdBy?.name ? `${selectedAsset.createdBy.name} (${selectedAsset.createdBy.email})` : 'N/A'}
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Project</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">
                                {selectedAsset.project?.projectName || 'N/A'}
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Location</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">
                                {selectedAsset.location ? formatLocation(selectedAsset.location) : 'N/A'}
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Created Date</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">
                                {selectedAsset.createdAt ? formatDate(selectedAsset.createdAt) : 'N/A'}
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Last Updated</td>
                              <td className="border border-border px-4 py-2 text-sm text-foreground">
                                {selectedAsset.updatedAt ? formatDate(selectedAsset.updatedAt) : 'N/A'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Digital Assets Section */}
                    {(selectedAsset as ExtendedAsset).digitalAssets && (
                      <div className="space-y-3">
                        <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Digital Assets
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-border rounded-lg">
                            <thead>
                              <tr className="bg-muted">
                                <th className="border border-border px-4 py-2 text-left font-semibold text-sm">Type</th>
                                <th className="border border-border px-4 py-2 text-left font-semibold text-sm">Generated At</th>
                                <th className="border border-border px-4 py-2 text-left font-semibold text-sm">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(selectedAsset as ExtendedAsset).digitalAssets?.qrCode && (
                                <tr>
                                  <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">QR Code</td>
                                  <td className="border border-border px-4 py-2 text-sm text-foreground">
                                    {(selectedAsset as ExtendedAsset).digitalAssets?.qrCode?.generatedAt ? formatDate((selectedAsset as ExtendedAsset).digitalAssets?.qrCode?.generatedAt || '') : 'N/A'}
                                  </td>
                                  <td className="border border-border px-4 py-2 text-sm text-foreground">
                                    <Badge variant="outline" className="bg-green-100 text-green-800">Generated</Badge>
                                  </td>
                                </tr>
                              )}
                              {(selectedAsset as ExtendedAsset).digitalAssets?.barcode && (
                                <tr>
                                  <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">Barcode</td>
                                  <td className="border border-border px-4 py-2 text-sm text-foreground">
                                    {(selectedAsset as ExtendedAsset).digitalAssets?.barcode?.generatedAt ? formatDate((selectedAsset as ExtendedAsset).digitalAssets?.barcode?.generatedAt || '') : 'N/A'}
                                  </td>
                                  <td className="border border-border px-4 py-2 text-sm text-foreground">
                                    <Badge variant="outline" className="bg-green-100 text-green-800">Generated</Badge>
                                  </td>
                                </tr>
                              )}
                              {(selectedAsset as ExtendedAsset).digitalAssets?.nfcData && (
                                <tr>
                                  <td className="border border-border px-4 py-2 text-sm font-medium text-muted-foreground">NFC Data</td>
                                  <td className="border border-border px-4 py-2 text-sm text-foreground">
                                    {(selectedAsset as ExtendedAsset).digitalAssets?.nfcData?.generatedAt ? formatDate((selectedAsset as ExtendedAsset).digitalAssets?.nfcData?.generatedAt || '') : 'N/A'}
                                  </td>
                                  <td className="border border-border px-4 py-2 text-sm text-foreground">
                                    <Badge variant="outline" className="bg-green-100 text-green-800">Generated</Badge>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Sub-Assets Section */}
                    {(selectedAsset as ExtendedAsset).subAssets && (
                      <div className="space-y-6">
                        {/* Movable Assets */}
                        {(() => {
                          const subAssets = (selectedAsset as ExtendedAsset).subAssets;
                          return subAssets?.movable && subAssets.movable.length > 0;
                        })() && (
                          <div className="space-y-3">
                            <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                              <Building className="w-5 h-5" />
                              Movable Components ({(selectedAsset as ExtendedAsset).subAssets?.movable?.length || 0})
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse border border-border rounded-lg">
                                <thead>
                                  <tr className="bg-muted">
                                    <th className="border border-border px-3 py-2 text-left font-semibold text-sm">#</th>
                                    <th className="border border-border px-3 py-2 text-left font-semibold text-sm">Component Name</th>
                                    <th className="border border-border px-3 py-2 text-left font-semibold text-sm">Brand</th>
                                    <th className="border border-border px-3 py-2 text-left font-semibold text-sm">Model</th>
                                    <th className="border border-border px-3 py-2 text-left font-semibold text-sm">Capacity</th>
                                    <th className="border border-border px-3 py-2 text-left font-semibold text-sm">Location</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {((selectedAsset as ExtendedAsset).subAssets?.movable as SubAsset[]).map((subAsset: SubAsset, index: number) => (
                                    <tr key={subAsset._id}>
                                      <td className="border border-border px-3 py-2 text-sm text-foreground">{index + 1}</td>
                                      <td className="border border-border px-3 py-2 text-sm text-foreground">{subAsset.assetName || 'N/A'}</td>
                                      <td className="border border-border px-3 py-2 text-sm text-foreground">{subAsset.brand || 'N/A'}</td>
                                      <td className="border border-border px-3 py-2 text-sm text-foreground">{subAsset.model || 'N/A'}</td>
                                      <td className="border border-border px-3 py-2 text-sm text-foreground">{subAsset.capacity || 'N/A'}</td>
                                      <td className="border border-border px-3 py-2 text-sm text-foreground">{subAsset.location || 'N/A'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Immovable Assets */}
                        {(() => {
                          const subAssets = (selectedAsset as ExtendedAsset).subAssets;
                          return subAssets?.immovable && subAssets.immovable.length > 0;
                        })() && (
                          <div className="space-y-3">
                            <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                              <Building className="w-5 h-5" />
                              Immovable Components ({(selectedAsset as ExtendedAsset).subAssets?.immovable?.length || 0})
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse border border-border rounded-lg">
                                <thead>
                                  <tr className="bg-muted">
                                    <th className="border border-border px-3 py-2 text-left font-semibold text-sm">#</th>
                                    <th className="border border-border px-3 py-2 text-left font-semibold text-sm">Component Name</th>
                                    <th className="border border-border px-3 py-2 text-left font-semibold text-sm">Brand</th>
                                    <th className="border border-border px-3 py-2 text-left font-semibold text-sm">Model</th>
                                    <th className="border border-border px-3 py-2 text-left font-semibold text-sm">Capacity</th>
                                    <th className="border border-border px-3 py-2 text-left font-semibold text-sm">Location</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {((selectedAsset as ExtendedAsset).subAssets?.immovable as SubAsset[]).map((subAsset: SubAsset, index: number) => (
                                    <tr key={subAsset._id}>
                                      <td className="border border-border px-3 py-2 text-sm text-foreground">{index + 1}</td>
                                      <td className="border border-border px-3 py-2 text-sm text-foreground">{subAsset.assetName || 'N/A'}</td>
                                      <td className="border border-border px-3 py-2 text-sm text-foreground">{subAsset.brand || 'N/A'}</td>
                                      <td className="border border-border px-3 py-2 text-sm text-foreground">{subAsset.model || 'N/A'}</td>
                                      <td className="border border-border px-3 py-2 text-sm text-foreground">{subAsset.capacity || 'N/A'}</td>
                                      <td className="border border-border px-3 py-2 text-sm text-foreground">{subAsset.location || 'N/A'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Additional Details */}
                  {selectedAsset.notes && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FileText className="w-4 h-4" />
                        Notes
                      </div>
                      <div className="p-4 bg-muted rounded-lg border border-border">
                        <p className="text-sm text-foreground">
                          {selectedAsset.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  </div>
                </div>
              )}
                
                {/* Action Buttons - Fixed at bottom */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border bg-card">
                  <Button
                    variant="outline"
                    onClick={closeViewModal}
                    className="border-border text-foreground hover:bg-muted"
                  >
                    Close
                  </Button>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Asset
                  </Button>
                </div>
              )
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