import React from 'react';
import { Badge } from './badge';

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const getPriorityVariant = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <Badge variant={getPriorityVariant(priority) as any} className={`font-medium text-xs ${className}`}>
      {priority}
    </Badge>
  );
}; 