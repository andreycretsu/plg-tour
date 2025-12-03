'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

interface StepPreviewProps {
  title: string;
  content: string;
  buttonText: string;
  placement: string;
  imageUrl?: string;
  stepNumber: number;
  totalSteps: number;
  onClose?: () => void;
}

export default function StepPreview({
  title,
  content,
  buttonText,
  placement,
  imageUrl,
  stepNumber,
  totalSteps,
  onClose,
}: StepPreviewProps) {
  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-xs border border-gray-100">
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-3 right-3 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-sm transition-colors"
      >
        ×
      </button>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 text-white relative">
        <h3 className="font-semibold text-base">{title || 'Step Title'}</h3>
        <p className="text-xs text-blue-100 mt-1">Step {stepNumber} of {totalSteps}</p>
      </div>
      
      {/* Body */}
      <div className="px-5 py-4">
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt="" 
            className="w-full h-24 object-cover rounded-lg mb-3 bg-gray-100"
          />
        )}
        <p className="text-sm text-gray-600 leading-relaxed">
          {content || 'Step description...'}
        </p>
      </div>
      
      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
        <button className="text-sm text-gray-500 hover:text-gray-700">
          Skip tour
        </button>
        <div className="flex gap-2">
          {stepNumber > 1 && (
            <button className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700">
              Back
            </button>
          )}
          <button className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium">
            {buttonText || 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Placement indicator component
interface PlacementIndicatorProps {
  placement: string;
  onChange: (placement: string) => void;
}

export function PlacementIndicator({ placement, onChange }: PlacementIndicatorProps) {
  const placements = ['top', 'bottom', 'left', 'right', 'auto'];
  
  return (
    <div className="flex flex-col items-center">
      {/* Visual placement selector */}
      <div className="relative w-32 h-32 mb-3">
        {/* Center element (target) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-8 bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center text-xs text-gray-500">
          Element
        </div>
        
        {/* Top placement */}
        <button
          onClick={() => onChange('top')}
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-10 h-6 rounded text-xs font-medium transition-all ${
            placement === 'top' 
              ? 'bg-blue-600 text-white shadow-md scale-110' 
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          Top
        </button>
        
        {/* Bottom placement */}
        <button
          onClick={() => onChange('bottom')}
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-6 rounded text-xs font-medium transition-all ${
            placement === 'bottom' 
              ? 'bg-blue-600 text-white shadow-md scale-110' 
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          Bot
        </button>
        
        {/* Left placement */}
        <button
          onClick={() => onChange('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-6 rounded text-xs font-medium transition-all ${
            placement === 'left' 
              ? 'bg-blue-600 text-white shadow-md scale-110' 
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          Left
        </button>
        
        {/* Right placement */}
        <button
          onClick={() => onChange('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 w-10 h-6 rounded text-xs font-medium transition-all ${
            placement === 'right' 
              ? 'bg-blue-600 text-white shadow-md scale-110' 
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          Right
        </button>
      </div>
      
      {/* Auto option */}
      <button
        onClick={() => onChange('auto')}
        className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${
          placement === 'auto' 
            ? 'bg-purple-600 text-white' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        Auto (Smart placement)
      </button>
    </div>
  );
}

// Full preview panel with placement visualization
interface PreviewPanelProps {
  step: {
    title: string;
    content: string;
    buttonText: string;
    placement: string;
    imageUrl?: string;
    selector?: string;
  };
  stepNumber: number;
  totalSteps: number;
  onPlacementChange: (placement: string) => void;
}

export function PreviewPanel({ step, stepNumber, totalSteps, onPlacementChange }: PreviewPanelProps) {
  const [showPreview, setShowPreview] = useState(true);
  
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Eye size={18} />
          Live Preview
        </h3>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
        >
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPreview ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {showPreview && (
        <div className="space-y-6">
          {/* Placement selector */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Tooltip Position</label>
            <PlacementIndicator 
              placement={step.placement} 
              onChange={onPlacementChange}
            />
          </div>
          
          {/* Visual preview */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Tooltip Preview</label>
            <div className="flex justify-center">
              <StepPreview
                title={step.title}
                content={step.content}
                buttonText={step.buttonText}
                placement={step.placement}
                imageUrl={step.imageUrl}
                stepNumber={stepNumber}
                totalSteps={totalSteps}
              />
            </div>
          </div>
          
          {/* Selector info */}
          {step.selector && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target Selector</label>
              <code className="text-xs bg-slate-700 px-2 py-1 rounded text-green-400 block overflow-x-auto">
                {step.selector}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

