import React from 'react';
import { AuditLog } from '../../lib/Report';

// Note: You'll need to install jsPDF: npm install jspdf
// import jsPDF from 'jspdf';

interface PDFDownloadProps {
  logs: AuditLog[];
  filename?: string;
  onDownload?: () => void;
}

export const PDFDownload: React.FC<PDFDownloadProps> = ({
  logs,
  filename = 'audit-trails-report.pdf',
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
      doc.text('Audit Trails Report', 20, 20);
      
      // Add date
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      
      // Add table headers
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const headers = ['User', 'Action', 'Resource', 'Details', 'Timestamp'];
      const startY = 50;
      const colWidths = [40, 25, 30, 50, 40];
      let currentX = 20;
      
      headers.forEach((header, index) => {
        doc.text(header, currentX, startY);
        currentX += colWidths[index];
      });
      
      // Add data rows
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      let currentY = startY + 10;
      
      logs.forEach((log,) => {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        
        const rowData = [
          log.user.name,
          log.action,
          log.resourceType,
          log.details.tagId || 'N/A',
          new Date(log.timestamp).toLocaleString()
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
      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
    >
      📄 Download PDF
    </button>
  );
};

// Excel download utility
export const ExcelDownload: React.FC<{
  logs: AuditLog[];
  filename?: string;
  onDownload?: () => void;
}> = ({ logs, filename = 'audit-trails-report.xlsx', onDownload }) => {
  const downloadExcel = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const XLSX = await import('xlsx');
      
      // Prepare data for Excel
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
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Trails');
      
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
      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
    >
      📊 Download Excel
    </button>
  );
}; 