import React from 'react';
import { Member } from '../types/crm';

interface MemberAvatarProps {
  member?: { id?: string; name: string; email?: string } | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const MemberAvatar: React.FC<MemberAvatarProps> = ({ member, size = 'sm', className = '' }) => {
  if (!member) {
    return (
      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground">
        ?
      </div>
    );
  }

  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const sizeClasses = {
    xs: 'size-4 text-[9px]',
    sm: 'size-5 text-[10px]',
    md: 'size-6 text-xs',
    lg: 'size-8 text-sm',
  }[size];

  return (
    <div
      data-slot="avatar"
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full select-none ${sizeClasses} ${className}`}
    >
      <span className="flex size-full items-center justify-center rounded-full bg-gradient-to-b from-[#b5b8bf] to-[#858890] font-sans leading-none font-medium tracking-normal text-white">
        {initials}
      </span>
    </div>
  );
};
