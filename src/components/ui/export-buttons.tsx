import React from 'react';
import { Button } from './button';
import { FileText, FileSpreadsheet } from 'lucide-react';

interface ExportButtonsProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  onExportPDF,
  onExportExcel
}) => {
  return (
    <div className="flex gap-3">
      <Button 
        onClick={onExportPDF}
        variant="outline"
        className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600"
      >
        <FileText className="w-4 h-4" />
        Download PDF
      </Button>
      <Button 
        onClick={onExportExcel}
        variant="outline"
        className="flex items-center gap-2 hover:bg-green-50 hover:text-green-600"
      >
        <FileSpreadsheet className="w-4 h-4" />
        Download Excel
      </Button>
    </div>
  );
}; 