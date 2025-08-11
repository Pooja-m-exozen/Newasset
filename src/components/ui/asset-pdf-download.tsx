import React from 'react';
import { Asset } from '../../lib/Report';

// Note: You'll need to install jsPDF: npm install jspdf
// Note: You'll need to install xlsx: npm install xlsx

interface AssetPDFDownloadProps {
  assets: Asset[];
  filename?: string;
  onDownload?: () => void;
}

export const AssetPDFDownload: React.FC<AssetPDFDownloadProps> = ({
  assets,
  filename = 'assets-report.pdf',
  onDownload
}) => {
  const downloadPDF = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;
      
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Assets Report', 20, 20);
      
      // Add date
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      
      // Add table headers
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const headers = ['Tag ID', 'Asset Type', 'Brand', 'Status', 'Assigned To', 'Location', 'Created'];
      const startY = 50;
      const colWidths = [25, 30, 25, 20, 35, 30, 25];
      let currentX = 20;
      
      headers.forEach((header, index) => {
        doc.text(header, currentX, startY);
        currentX += colWidths[index];
      });
      
      // Add data rows
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      let currentY = startY + 10;
      
      assets.forEach((asset) => {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        
        const rowData = [
          asset.tagId,
          asset.assetType,
          asset.brand,
          asset.status || 'N/A',
          asset.assignedTo?.name || 'Unassigned',
          asset.location.building || 'N/A',
          new Date(asset.createdAt).toLocaleDateString()
        ];
        
        currentX = 20;
        rowData.forEach((cell, cellIndex) => {
          const text = doc.splitTextToSize(cell, colWidths[cellIndex] - 2);
          doc.text(text, currentX, currentY);
          currentX += colWidths[cellIndex];
        });
        
        currentY += 10;
      });
      
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
      
      // Prepare data for Excel
      const excelData = assets.map(asset => ({
        'Tag ID': asset.tagId,
        'Asset Type': asset.assetType,
        'Subcategory': asset.subcategory || '',
        'Brand': asset.brand,
        'Model': asset.model || '',
        'Serial Number': asset.serialNumber || '',
        'Capacity': asset.capacity || '',
        'Status': asset.status || '',
        'Priority': asset.priority || '',
        'Assigned To': asset.assignedTo?.name || 'Unassigned',
        'Email': asset.assignedTo?.email || '',
        'Building': asset.location.building || '',
        'Floor': asset.location.floor || '',
        'Room': asset.location.room || '',
        'Project Name': asset.projectName || '',
        'Year of Installation': asset.yearOfInstallation || '',
        'Created Date': new Date(asset.createdAt).toLocaleDateString(),
        'Last Updated': new Date(asset.updatedAt).toLocaleDateString(),
        'Digital Tag Type': asset.digitalTagType || '',
        'Notes': asset.notes || ''
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