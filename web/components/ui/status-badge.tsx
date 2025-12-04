import React from 'react';
import { cn } from '@/lib/utils';

export type StatusBadgeVariant = 'success' | 'fail';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: StatusBadgeVariant;
  children: React.ReactNode;
}

export function StatusBadge({ 
  variant = 'success', 
  children, 
  className,
  ...props 
}: StatusBadgeProps) {
  if (variant === 'fail') {
    return (
      <div
        className={cn(
          "bg-gradient-to-r from-[#fad9d9] to-white",
          "border-[0.5px] border-[#f19696]",
          "rounded-full",
          "px-3 py-2",
          "flex items-center gap-2",
          "shadow-sm",
          className
        )}
        {...props}
      >
        <div className="bg-[#f8cbcb] rounded-full p-1 shrink-0">
          <div className="bg-[#e42e2e] rounded-full w-2 h-2" />
        </div>
        <p className="text-xs font-medium leading-none text-[#000f30] whitespace-nowrap">
          {children}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-[#d9f9e5] to-white",
        "border-[0.5px] border-[#95eeb6]",
        "rounded-full",
        "px-3 py-2",
        "flex items-center gap-2",
        "shadow-sm",
        className
      )}
      {...props}
    >
      <div className="bg-[#caf7db] rounded-full p-1 shrink-0">
        <div className="bg-[#2cde6d] rounded-full w-2 h-2" />
      </div>
      <p className="text-xs font-medium leading-none text-[#000f30] whitespace-nowrap">
        {children}
      </p>
    </div>
  );
}

