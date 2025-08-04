import React from 'react';
import { Button } from './button';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gradient';
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description,
  icon,
  actionText,
  onAction,
  actionIcon,
  className = '',
  variant = 'default'
}) => {
  const defaultIcon = (
    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const getHeaderClasses = () => {
    if (variant === 'gradient') {
      return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white';
    }
    return 'bg-white text-gray-900';
  };

  const getIconClasses = () => {
    if (variant === 'gradient') {
      return 'bg-blue-500 text-white';
    }
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className={`rounded-xl border shadow-sm p-6 ${getHeaderClasses()} ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${getIconClasses()}`}>
              {icon || defaultIcon}
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">{title}</h1>
              {description && (
                <p className="text-sm opacity-80">{description}</p>
              )}
            </div>
          </div>
        </div>
        {actionText && onAction && (
          <Button 
            size="lg" 
            onClick={onAction}
            className={variant === 'gradient' 
              ? 'bg-white text-blue-600 hover:bg-gray-50 shadow-lg transition-all duration-200 transform hover:scale-105 px-6 py-2 text-sm font-semibold'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all duration-200 transform hover:scale-105 px-6 py-2 text-sm font-semibold'
            }
          >
            {actionIcon && <span className="mr-2">{actionIcon}</span>}
            {actionText}
          </Button>
        )}
      </div>
    </div>
  );
}; 