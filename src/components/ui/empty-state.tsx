import React from 'react';
import { Button } from './button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon,
  actionText,
  onAction,
  className = '',
  variant = 'default'
}) => {
  const defaultIcon = (
    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );

  if (variant === 'compact') {
    return (
      <div className={`text-center py-8 ${className}`}>
        {icon || defaultIcon}
        <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        {actionText && onAction && (
          <Button onClick={onAction} className="mt-4">
            {actionText}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-16 text-center ${className}`}>
      <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        {icon || defaultIcon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">{description}</p>
      {actionText && onAction && (
        <Button size="lg" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}; 