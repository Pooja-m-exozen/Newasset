import React, { useRef, useEffect, useState } from 'react';
import { Button } from './button';
import { FileText, Share2, Archive, Settings } from 'lucide-react';

interface MoreDropdownProps {
  children?: React.ReactNode;
  onExport?: () => void;
  onShare?: () => void;
  onArchive?: () => void;
  onSettings?: () => void;
}

export const MoreDropdown: React.FC<MoreDropdownProps> = ({
  children,
  onExport,
  onShare,
  onArchive,
  onSettings
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {children || (
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 p-0 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </Button>
      )}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {onExport && (
              <button 
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                onClick={() => {
                  onExport();
                  setIsOpen(false);
                }}
              >
                <FileText className="w-4 h-4" />
                <span>Export Data</span>
              </button>
            )}
            {onShare && (
              <button 
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                onClick={() => {
                  onShare();
                  setIsOpen(false);
                }}
              >
                <Share2 className="w-4 h-4" />
                <span>Share Locations</span>
              </button>
            )}
            {onArchive && (
              <button 
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                onClick={() => {
                  onArchive();
                  setIsOpen(false);
                }}
              >
                <Archive className="w-4 h-4" />
                <span>Archive</span>
              </button>
            )}
            {(onExport || onShare || onArchive) && onSettings && (
              <div className="border-t border-gray-100 my-1"></div>
            )}
            {onSettings && (
              <button 
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                onClick={() => {
                  onSettings();
                  setIsOpen(false);
                }}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 