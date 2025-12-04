'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface FullScreenModalProps {
  children: ReactNode;
  title: string;
  onClose: () => void;
  actions?: ReactNode;
  headerExtra?: ReactNode; // Extra content after title (e.g., status toggle)
}

export default function FullScreenModal({ 
  children, 
  title, 
  onClose,
  actions,
  headerExtra
}: FullScreenModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm">
      <div 
        className="absolute bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          top: 16,
          left: 16,
          right: 16,
          bottom: 16,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            {headerExtra}
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

