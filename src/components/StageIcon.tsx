import React from 'react';
import { CircleDashed, Circle, CircleDot, CheckCircle2, XCircle } from 'lucide-react';
import { Stage } from '../types/crm';

interface StageIconProps {
  stage: Stage;
  className?: string;
}

const stageColorMap: Record<Stage, string> = {
  qualification: 'text-muted-foreground',
  discovery: 'text-blue-500',
  proposal: 'text-amber-500',
  negotiation: 'text-violet-500',
  won: 'text-emerald-600',
  lost: 'text-muted-foreground',
};

export const StageIcon: React.FC<StageIconProps> = ({ stage, className = '' }) => {
  const colorClass = stageColorMap[stage] || 'text-muted-foreground';
  const combinedClass = `size-3.5 shrink-0 ${colorClass} ${className}`.trim();

  switch (stage) {
    case 'qualification':
      return <CircleDashed className={combinedClass} aria-hidden="true" />;
    case 'discovery':
      return <Circle className={combinedClass} aria-hidden="true" />;
    case 'proposal':
    case 'negotiation':
      return <CircleDot className={combinedClass} aria-hidden="true" />;
    case 'won':
      return <CheckCircle2 className={combinedClass} aria-hidden="true" />;
    case 'lost':
      return <XCircle className={combinedClass} aria-hidden="true" />;
    default:
      return <CircleDashed className={combinedClass} aria-hidden="true" />;
  }
};
