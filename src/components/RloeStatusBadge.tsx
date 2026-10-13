import React from 'react';
import { RloeRoute } from '../types/rloe';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface RloeStatusBadgeProps {
  route: RloeRoute | string;
  className?: string;
  showIcon?: boolean;
}

export const RloeStatusBadge: React.FC<RloeStatusBadgeProps> = ({
  route,
  className = '',
  showIcon = true,
}) => {
  switch (route) {
    case 'sales_priority':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 ${className}`}
        >
          {showIcon && <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />}
          <span>Sales Priority</span>
        </span>
      );
    case 'needs_review':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 ${className}`}
        >
          {showIcon && <AlertCircle className="size-3 text-amber-600 dark:text-amber-400 shrink-0" />}
          <span>Needs Review</span>
        </span>
      );
    case 'disqualified':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 ${className}`}
        >
          {showIcon && <XCircle className="size-3 text-zinc-500 dark:text-zinc-400 shrink-0" />}
          <span>Disqualified</span>
        </span>
      );
  }
};

export default RloeStatusBadge;
