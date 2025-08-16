import React from 'react';
import { Asset } from '../../lib/Report';

// Note: You'll need to install jsPDF: npm install jspdf
// Note: You'll need to install xlsx: npm install xlsx

interface AssetPDFDownloadProps {
  assets: Asset[];
  filename?: string;
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
  onDownload
}) => {
  const downloadPDF = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      
      const doc = new jsPDF(); // Use portrait orientation
      
      // Add title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Assets Report', 20, 20);
      
      // Add date
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      
                             // Define table structure with only the requested columns
         const columns = [
           { header: 'Tag ID', key: 'tagId', width: 20 },
           { header: 'Asset Type', key: 'assetType', width: 20 },
           { header: 'Brand', key: 'brand', width: 20 },
           { header: 'Model', key: 'model', width: 20 },
           { header: 'Status', key: 'status', width: 15 },
           { header: 'Priority', key: 'priority', width: 15 },
           { header: 'Assigned To', key: 'assignedTo', width: 22 },
           { header: 'Project', key: 'projectName', width: 22 },
           { header: 'Location', key: 'location', width: 50 }
         ];
      
                     const startX = 15;
        const startY = 50;
        const rowHeight = 15; // Increased to accommodate multi-line location text
        const headerHeight = 12;
       const totalTableWidth = columns.reduce((sum, col) => sum + col.width, 0);
      
      // Draw table headers
      doc.setFillColor(240, 240, 240);
      doc.rect(startX, startY, totalTableWidth, headerHeight, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      let currentX = startX;
      
               columns.forEach(column => {
           doc.text(column.header, currentX + 1, startY + 8);
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
          if (currentY > 240) { // Adjusted for increased row height
            doc.addPage();
            pageNumber++;
            currentY = 20;
          
          // Add page header
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(`Assets Report - Page ${pageNumber}`, 20, currentY);
          currentY += 15;
          
          // Redraw table headers on new page
          doc.setFillColor(240, 240, 240);
          doc.rect(startX, currentY, totalTableWidth, headerHeight, 'F');
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          currentX = startX;
          
                     columns.forEach(column => {
             doc.text(column.header, currentX + 1, currentY + 8);
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
        
                                   // Get reverse geocoded address for location
           let locationText = 'N/A';
           if (asset.location) {
             try {
               const address = await getReverseGeocodedAddress(asset.location.latitude, asset.location.longitude);
               const building = asset.location.building || '';
               const floor = asset.location.floor || '';
               const room = asset.location.room || '';
               const coordinates = `${asset.location.latitude}, ${asset.location.longitude}`;
               
               // Combine all location information in a structured way
               const locationParts = [];
               if (address && address !== 'Address not available') {
                 locationParts.push(`Address: ${address}`);
               }
               if (building) {
                 locationParts.push(`Building: ${building}`);
               }
               if (floor) {
                 locationParts.push(`Floor: ${floor}`);
               }
               if (room) {
                 locationParts.push(`Room: ${room}`);
               }
               if (coordinates) {
                 locationParts.push(`Coords: ${coordinates}`);
               }
               
               locationText = locationParts.length > 0 ? locationParts.join('\n') : 'Coordinates available';
             } catch {
               const building = asset.location.building || '';
               const floor = asset.location.floor || '';
               const room = asset.location.room || '';
               const coordinates = `${asset.location.latitude}, ${asset.location.longitude}`;
               
               const locationParts = [];
               if (building) {
                 locationParts.push(`Building: ${building}`);
               }
               if (floor) {
                 locationParts.push(`Floor: ${floor}`);
               }
               if (room) {
                 locationParts.push(`Room: ${room}`);
               }
               if (coordinates) {
                 locationParts.push(`Coords: ${coordinates}`);
               }
               
               locationText = locationParts.length > 0 ? locationParts.join('\n') : 'Coordinates available';
             }
           }
        
                 // Prepare row data with only the requested columns
         const rowData = [
           asset.tagId || 'N/A',
           asset.assetType || 'N/A',
           asset.brand || 'N/A',
           asset.model || 'N/A',
           asset.status || 'N/A',
           asset.priority || 'N/A',
           asset.assignedTo?.name || 'Unassigned',
           asset.projectName || 'N/A',
           locationText
         ];
         
         // Debug log for location
         console.log(`Asset ${asset.tagId} location:`, locationText);
        
        // Draw row background (alternating colors)
        if (i % 2 === 0) {
          doc.setFillColor(250, 250, 250);
        } else {
          doc.setFillColor(255, 255, 255);
        }
        doc.rect(startX, currentY, totalTableWidth, rowHeight, 'F');
        
                 // Add row data
         doc.setFontSize(8);
         doc.setFont('helvetica', 'normal');
         currentX = startX;
         
         rowData.forEach((text, index) => {
           const maxWidth = columns[index].width - 2;
           
           if (index === 8 && text !== 'N/A') { // Location column with multi-line text
             // Handle multi-line location text
             const lines = text.split('\n');
             let lineY = currentY + 7;
             
             lines.forEach((line, lineIndex) => {
               if (lineIndex < 3) { // Show max 3 lines
                 const truncatedLine = doc.splitTextToSize(line, maxWidth);
                 if (truncatedLine.length > 0) {
                   doc.text(truncatedLine[0], currentX + 1, lineY);
                   lineY += 3;
                 }
               }
             });
           } else {
             // Handle regular single-line text
             const truncatedText = doc.splitTextToSize(text, maxWidth);
             if (truncatedText.length > 0) {
               doc.text(truncatedText[0], currentX + 1, currentY + 7);
             }
           }
           
           currentX += columns[index].width;
         });
        
        // Draw row borders
        doc.setDrawColor(220, 220, 220);
        doc.line(startX, currentY, startX + totalTableWidth, currentY);
        doc.line(startX, currentY + rowHeight, startX + totalTableWidth, currentY + rowHeight);
        
        currentX = startX;
        columns.forEach(column => {
          doc.line(currentX, currentY, currentX, currentY + rowHeight);
          currentX += column.width;
        });
        
        currentY += rowHeight;
      }
      
      // Save the PDF
      doc.save(filename);
      
      onDownload?.();
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to alert if jsPDF is not available
      alert('PDF generation failed. Please install jsPDF: npm install jspdf');
    }
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
           'Project Name': asset.projectName || '',
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
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Add worksheet to workbook
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
