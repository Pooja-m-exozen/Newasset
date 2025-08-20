import React from 'react';
import { Asset } from '../../lib/Report';

// Note: You'll need to install jsPDF: npm install jspdf
// Note: You'll need to install xlsx: npm install xlsx

interface AssetPDFDownloadProps {
  assets: Asset[];
  filename?: string;
  selectedAssetType?: string;
  onDownload?: () => void;
}

// Function to get reverse geocoded address
const getReverseGeocodedAddress = async (latitude: string, longitude: string): Promise<string> => {
  try {
    const GOOGLE_MAPS_API_KEY = 'AIzaSyCqvcEKoqwRG5PBDIVp-MjHyjXKT3s4KY4';
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    
    return 'Address not available';
  } catch (error) {
    console.error('Error getting reverse geocoded address:', error);
    return 'Address not available';
  }
};

export const AssetPDFDownload: React.FC<AssetPDFDownloadProps> = ({
  assets,
  filename = 'assets-report.pdf',
  selectedAssetType = 'all',
  onDownload
}) => {
  const downloadPDF = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      
      const doc = new jsPDF('landscape'); // Use landscape orientation
      
      // Add EXOZEN logo
      try {
        // Load and add the actual logo image
        const logoImg = new Image();
        logoImg.src = '/exozen_logo1.png';
        
        // Wait for image to load
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
        });
        
        // Add logo to PDF (reduced height for better layout)
        doc.addImage(logoImg, 'PNG', 15, 15, 35, 12);
      } catch (error) {
        console.log('Logo not available, using text fallback');
        // Fallback to text if image fails
        doc.setFillColor(255, 165, 0); // Orange color for ZEN logo
        doc.rect(15, 15, 30, 12, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('ZEN', 22, 21);
      }
      
      // Add dynamic title based on selected asset type
      const titleText = selectedAssetType !== 'all' 
        ? `${selectedAssetType.toUpperCase()} ASSET DETAILS`
        : 'ALL ASSET DETAILS';
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(titleText, 150, 28, { align: 'center' });
      
             // Add date
       doc.setFontSize(11);
       doc.setFont('helvetica', 'normal');
       doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 38);
       
       // Calculate asset counts by category for later use
       const assetCounts: { [key: string]: number } = {};
       assets.forEach(asset => {
         const category = asset.assetType || 'Unknown';
         assetCounts[category] = (assetCounts[category] || 0) + 1;
       });
       
       // Define table structure with the exact columns you requested
       const columns = [
         { header: 'S.No', key: 'sno', width: 20 },
         { header: 'Asset Name', key: 'assetName', width: 65 },
         { header: 'Asset Tag Number', key: 'tagId', width: 55 },
         { header: 'Vendor Name', key: 'vendorName', width: 45 },
         { header: 'Asset Category', key: 'assetType', width: 40 },
         { header: 'Location', key: 'location', width: 65 }
       ];
       
       const startX = 15;
       const startY = 50; // Moved back up since no summary above table
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
      
      // Process assets and create table rows
      let currentY = startY + headerHeight;
      let pageNumber = 1;
      
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        
        // Check if we need a new page
        if (currentY > 190) {
          doc.addPage('landscape');
          pageNumber++;
          currentY = 20;
          
          // Add page header
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          const pageHeaderText = selectedAssetType !== 'all' 
            ? `${selectedAssetType.toUpperCase()} ASSET DETAILS - Page ${pageNumber}`
            : `ALL ASSET DETAILS - Page ${pageNumber}`;
          doc.text(pageHeaderText, 150, currentY, { align: 'center' });
          currentY += 20;
          
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
          
          // Draw header borders
          doc.setDrawColor(200, 200, 200);
          doc.line(startX, currentY, startX + totalTableWidth, currentY);
          doc.line(startX, currentY + headerHeight, startX + totalTableWidth, currentY + headerHeight);
          
          currentX = startX;
          columns.forEach(column => {
            doc.line(currentX, currentY, currentX, currentY + headerHeight);
            currentX += column.width;
          });
          
          currentY += headerHeight;
        }
        
        // Prepare row data with the exact format you requested
        const rowData = [
          (i + 1).toString(), // S.No
          `${asset.brand || ''} ${asset.model || ''}`.trim() || asset.assetType || 'N/A', // Asset Name
          asset.tagId || 'N/A', // Asset Tag Number
          asset.customFields?.['Vendor Name'] || asset.brand || 'N/A', // Vendor Name
          asset.assetType || 'N/A', // Asset Category
          formatLocationForPDF(asset.location) // Location
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
       
       // Add comprehensive summary section below the table
       const summaryStartY = currentY + 15;
       const summaryBoxHeight = 40;
       
       // Summary box background
       doc.setFillColor(248, 250, 252); // Light blue-gray background
       doc.rect(startX, summaryStartY, totalTableWidth, summaryBoxHeight, 'F');
       
       // Summary box border
       doc.setDrawColor(59, 130, 246); // Blue border
       doc.setLineWidth(0.5);
       doc.rect(startX, summaryStartY, totalTableWidth, summaryBoxHeight);
       
       // Summary title
       doc.setFontSize(14);
       doc.setFont('helvetica', 'bold');
       doc.setTextColor(59, 130, 246); // Blue text
       doc.text('ASSET SUMMARY REPORT', startX + 5, summaryStartY + 8);
       
       // Summary content
       doc.setFontSize(10);
       doc.setFont('helvetica', 'normal');
       doc.setTextColor(0, 0, 0);
       
       let summaryContentY = summaryStartY + 18;
       let summaryContentX = startX + 5;
       
       // Total assets with highlight
       doc.setFont('helvetica', 'bold');
       doc.setFillColor(59, 130, 246); // Blue highlight
       doc.rect(summaryContentX, summaryContentY - 3, 25, 6, 'F');
       doc.setTextColor(255, 255, 255); // White text
       doc.text(`Total: ${assets.length}`, summaryContentX + 2, summaryContentY + 1);
       
       // Reset text color for categories
       doc.setTextColor(0, 0, 0);
       summaryContentX += 35;
       
               // Category breakdown with better formatting
        Object.entries(assetCounts).forEach(([category, count]) => {
          // Category box with better spacing
          doc.setFillColor(239, 246, 255); // Light blue background
          doc.rect(summaryContentX, summaryContentY - 3, 40, 6, 'F');
          doc.setDrawColor(59, 130, 246);
          doc.rect(summaryContentX, summaryContentY - 3, 40, 6);
          
          // Category text (capitalized first letter)
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
          doc.text(formattedCategory, summaryContentX + 2, summaryContentY + 1);
          
          // Count text with colon format
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(count.toString(), summaryContentX + 2, summaryContentY + 5);
          
          summaryContentX += 45; // Increased spacing for better readability
          
          // Move to next row if running out of space
          if (summaryContentX > startX + totalTableWidth - 50) {
            summaryContentX = startX + 40;
            summaryContentY += 12;
          }
        });
       
       // Add percentage calculations
       summaryContentY += 8;
       summaryContentX = startX + 5;
       
       doc.setFontSize(9);
       doc.setFont('helvetica', 'bold');
       doc.setTextColor(107, 114, 128); // Gray text
       doc.text('Distribution:', summaryContentX, summaryContentY);
       
       summaryContentX += 25;
               Object.entries(assetCounts).forEach(([category, count]) => {
          const percentage = ((count / assets.length) * 100).toFixed(1);
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
          doc.text(`${formattedCategory}: ${percentage}%`, summaryContentX, summaryContentY);
          
          summaryContentX += 45; // Increased spacing for better readability
          if (summaryContentX > startX + totalTableWidth - 50) {
            summaryContentX = startX + 30;
            summaryContentY += 6;
          }
        });
       
       // Add generation timestamp
       doc.setFontSize(8);
       doc.setFont('helvetica', 'italic');
       doc.setTextColor(156, 163, 175); // Light gray
       doc.text(`Report generated on: ${new Date().toLocaleString()}`, startX + 5, summaryStartY + summaryBoxHeight - 3);
       
       // Save the PDF
       doc.save(filename);
      
      if (onDownload) {
        onDownload();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Helper function to format location for PDF
  const formatLocationForPDF = (location: Asset['location']): string => {
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

  return (
    <button
      onClick={downloadPDF}
      className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
    >
      📄 Download PDF
    </button>
  );
};

// Excel download utility for assets
export const AssetExcelDownload: React.FC<{
  assets: Asset[];
  filename?: string;
  onDownload?: () => void;
}> = ({ assets, filename = 'assets-report.xlsx', onDownload }) => {
  const downloadExcel = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const XLSX = await import('xlsx');
      
      // Prepare data for Excel with all asset information
      const excelData = await Promise.all(assets.map(async (asset) => {
        // Get reverse geocoded address
        let fullAddress = 'Address not available';
        if (asset.location) {
          try {
            fullAddress = await getReverseGeocodedAddress(asset.location.latitude, asset.location.longitude);
          } catch {
            console.error('Error getting address for asset:', asset.tagId);
          }
        }
        
                 return {
           'Tag ID': asset.tagId,
           'Asset Type': asset.assetType,
           'Subcategory': asset.subcategory || '',
           'Brand': asset.brand,
           'Model': asset.model || '',
           'Serial Number': asset.serialNumber || '',
           'Capacity': asset.capacity || '',
           'Year of Installation': asset.yearOfInstallation || '',
           'Project Name': asset.project?.projectName || asset.projectName || '',
           'Status': asset.status || '',
           'Priority': asset.priority || '',
           'Digital Tag Type': asset.digitalTagType || '',
           'Assigned To Name': asset.assignedTo?.name || 'Unassigned',
           'Assigned To Email': asset.assignedTo?.email || '',
           'Complete Location': fullAddress,
           'Building': asset.location?.building || '',
           'Floor': asset.location?.floor || '',
           'Room': asset.location?.room || '',
           'Coordinates': `${asset.location?.latitude || ''}, ${asset.location?.longitude || ''}`,
          'QR Code URL': asset.digitalAssets?.qrCode?.url || '',
          'QR Code Generated': asset.digitalAssets?.qrCode?.generatedAt ? new Date(asset.digitalAssets.qrCode.generatedAt).toLocaleDateString() : '',
          'Barcode URL': asset.digitalAssets?.barcode?.url || '',
          'Barcode Generated': asset.digitalAssets?.barcode?.generatedAt ? new Date(asset.digitalAssets.barcode.generatedAt).toLocaleDateString() : '',
          'NFC Data URL': asset.digitalAssets?.nfcData?.url || '',
          'NFC Generated': asset.digitalAssets?.nfcData?.generatedAt ? new Date(asset.digitalAssets.nfcData.generatedAt).toLocaleDateString() : '',
          'Certifications': asset.compliance?.certifications?.join(', ') || '',
          'Expiry Dates': asset.compliance?.expiryDates?.join(', ') || '',
          'Regulatory Requirements': asset.compliance?.regulatoryRequirements?.join(', ') || '',
          'Tags': asset.tags?.join(', ') || '',
          'Notes': asset.notes || '',
          'Created By Name': asset.createdBy?.name || '',
          'Created By Email': asset.createdBy?.email || '',
          'Created Date': new Date(asset.createdAt).toLocaleDateString(),
          'Last Updated': new Date(asset.updatedAt).toLocaleDateString()
        };
      }));
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // Create summary data
      const assetCounts: { [key: string]: number } = {};
      assets.forEach(asset => {
        const category = asset.assetType || 'Unknown';
        assetCounts[category] = (assetCounts[category] || 0) + 1;
      });
      
      const summaryData = [
        { 'Summary': 'Total Assets', 'Count': assets.length },
        { 'Summary': '', 'Count': '' }, // Empty row for spacing
        ...Object.entries(assetCounts).map(([category, count]) => ({
          'Summary': `${category}`,
          'Count': count
        }))
      ];
      
      // Create summary worksheet
      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
      
      // Create main assets worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');
      
      // Save the file
      XLSX.writeFile(workbook, filename);
      
      onDownload?.();
    } catch (error) {
      console.error('Error generating Excel:', error);
      // Fallback to alert if xlsx is not available
      alert('Excel generation failed. Please install xlsx: npm install xlsx');
    }
  };

  return (
    <button
      onClick={downloadExcel}
      className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
    >
      📊 Download Excel
    </button>
  );
};
