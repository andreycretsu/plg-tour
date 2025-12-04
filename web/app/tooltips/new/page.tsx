'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FullScreenModal from '@/components/FullScreenModal';
import ImageUpload from '@/components/ImageUpload';
import ColorPicker from '@/components/ColorPicker';
import CenterSlider from '@/components/CenterSlider';
import { Save, Crosshair, AlertCircle, CheckCircle, MousePointer, Hand, Languages, Settings, FileText, Star, Sparkles, Wand2, Circle, Check, RefreshCw } from 'lucide-react';

export default function NewTooltipPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [pickingElement, setPickingElement] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [previewLang, setPreviewLang] = useState('en');
  
  const LANGUAGES = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'uk', name: 'Ukrainian', native: 'Українська' },
    { code: 'pl', name: 'Polish', native: 'Polski' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'zh', name: 'Chinese', native: '中文' },
  ];

  // Form state
  const [name, setName] = useState('New Tooltip');
  const [urlPattern, setUrlPattern] = useState('');
  const [selector, setSelector] = useState('');
  
  // Trigger settings
  const [triggerType, setTriggerType] = useState<'click' | 'hover'>('click');
  const [dismissType, setDismissType] = useState<'button' | 'click_element' | 'click_outside'>('button');
  
  // Icon/Beacon settings
  const [iconShape, setIconShape] = useState<'dot' | 'star' | 'sparkle' | 'wand'>('dot');
  const [isPulsing, setIsPulsing] = useState(true);
  const [iconEdge, setIconEdge] = useState<'top' | 'right' | 'bottom' | 'left'>('right');
  const [iconOffset, setIconOffset] = useState(0); // Beacon distance from element edge
  const [iconOffsetY, setIconOffsetY] = useState(0); // Beacon position along edge
  const [iconSize, setIconSize] = useState(16); // Size in pixels
  const [iconColor, setIconColor] = useState('#3b82f6');
  
  // Card position settings (relative to beacon)
  const [cardGap, setCardGap] = useState(12); // Distance between beacon and card
  const [cardOffsetY, setCardOffsetY] = useState(0); // Card offset along the axis
  
  // Card settings
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [cardWidth, setCardWidth] = useState(320);
  const [cardPadding, setCardPadding] = useState(20);
  const [cardBorderRadius, setCardBorderRadius] = useState(12);
  const [cardShadow, setCardShadow] = useState('medium');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [cardTextColor, setCardTextColor] = useState('#1f2937');
  const [cardBgColor, setCardBgColor] = useState('#ffffff');
  
  // Typography
  const [titleSize, setTitleSize] = useState(16);
  const [bodySize, setBodySize] = useState(14);
  const [bodyLineHeight, setBodyLineHeight] = useState(1.5);
  
  // Button settings
  const [buttonText, setButtonText] = useState('Got it');
  const [buttonColor, setButtonColor] = useState('#3b82f6');
  const [buttonTextColor, setButtonTextColor] = useState('#ffffff');
  const [buttonBorderRadius, setButtonBorderRadius] = useState(8);
  const [buttonSize, setButtonSize] = useState<'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl'>('m');
  const [buttonPosition, setButtonPosition] = useState<'left' | 'center' | 'right'>('left');
  const [buttonType, setButtonType] = useState<'regular' | 'stretched'>('regular');
  
  // Display Frequency
  const [frequencyType, setFrequencyType] = useState<'once' | 'always' | 'count' | 'days'>('once');
  const [frequencyCount, setFrequencyCount] = useState(1);
  const [frequencyDays, setFrequencyDays] = useState(7);
  
  // Advanced
  const [zIndex, setZIndex] = useState(2147483647);
  const [delayMs, setDelayMs] = useState(0);

  // Extension communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (!event.data || event.data.source !== 'tourlayer-extension') return;

      if (event.data.type === 'PONG' || event.data.type === 'EXTENSION_READY') {
        setExtensionInstalled(true);
      }
      if (event.data.type === 'ELEMENT_PICKED' && event.data.selector) {
        setSelector(event.data.selector);
        setPickingElement(false);
      }
      if (event.data.type === 'PICKER_CANCELLED') {
        setPickingElement(false);
      }
    };

    window.addEventListener('message', handleMessage);
    window.postMessage({ source: 'tourlayer-webapp', type: 'PING' }, '*');
    const interval = setInterval(() => {
      window.postMessage({ source: 'tourlayer-webapp', type: 'PING' }, '*');
    }, 3000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, []);

  const startPicker = () => {
    if (!extensionInstalled) {
      alert('Please install the TourLayer Chrome extension first!');
      return;
    }

    let targetUrl = urlPattern.replace(/\*+/g, '').trim();
    if (!targetUrl) {
      alert('Please enter a URL pattern first!');
      return;
    }
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    
    setPickingElement(true);
    window.postMessage({ 
      source: 'tourlayer-webapp', 
      type: 'START_PICKER',
      targetUrl
    }, '*');
  };

  const getShadowValue = (shadow: string) => {
    const shadows: Record<string, string> = {
      'none': 'none',
      'small': '0 2px 8px rgba(0,0,0,0.1)',
      'medium': '0 4px 20px rgba(0,0,0,0.15)',
      'large': '0 8px 30px rgba(0,0,0,0.2)',
      'extra': '0 12px 40px rgba(0,0,0,0.25)',
    };
    return shadows[shadow] || shadows.medium;
  };

  const getButtonSizeStyles = (size: string) => {
    const sizes: Record<string, { padding: string; fontSize: string }> = {
      'xxs': { padding: '2px 6px', fontSize: '10px' },
      'xs': { padding: '4px 10px', fontSize: '11px' },
      's': { padding: '6px 12px', fontSize: '12px' },
      'm': { padding: '8px 16px', fontSize: '13px' },
      'l': { padding: '10px 20px', fontSize: '14px' },
      'xl': { padding: '12px 24px', fontSize: '15px' },
    };
    return sizes[size] || sizes.m;
  };

  const saveTooltip = async () => {
    if (!name || !urlPattern || !selector || !title) {
      alert('Please fill in name, URL pattern, selector, and title');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/tooltips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          urlPattern,
          selector,
          triggerType,
          dismissType,
          iconType: `${isPulsing ? 'pulse' : 'static'}_${iconShape}`,
          iconEdge,
          iconOffset,
          iconOffsetY,
          iconSize,
          iconColor,
          // Card position relative to beacon
          cardGap,
          cardOffsetY,
          title,
          body,
          imageUrl: imageUrl || null,
          cardWidth,
          cardPadding,
          cardBorderRadius,
          cardShadow: getShadowValue(cardShadow),
          textAlign,
          cardTextColor,
          cardBgColor,
          titleSize,
          bodySize,
          bodyLineHeight,
          buttonText,
          buttonColor,
          buttonTextColor,
          buttonBorderRadius,
          buttonSize,
          buttonPosition,
          buttonType,
          zIndex,
          delayMs,
          // Frequency settings
          frequencyType,
          frequencyCount,
          frequencyDays,
          showOnce: frequencyType === 'once', // backwards compatibility
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save tooltip');
      }

      alert('Tooltip saved successfully!');
      router.push('/tooltips');
    } catch (error) {
      alert('Error saving tooltip: ' + error);
    } finally {
      setLoading(false);
    }
  };

  // Animation is controlled by isPulsing state directly

  // Get beacon position for preview - properly centered
  const getBeaconPreviewStyle = (): React.CSSProperties => {
    const size = iconSize;
    const halfSize = size / 2;
    
    const base: React.CSSProperties = {
      position: 'absolute',
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: isPulsing ? 'pulse 2s infinite' : undefined,
    };

    // Position beacon on the edge with offsets
    // iconOffset: perpendicular to edge (- = inside, + = outside)
    // iconOffsetY: along the edge (- = up/left, + = down/right)
    switch (iconEdge) {
      case 'top':
        return { 
          ...base, 
          top: -halfSize - iconOffset, 
          left: '50%',
          marginLeft: -halfSize + iconOffsetY,
        };
      case 'bottom':
        return { 
          ...base, 
          bottom: -halfSize - iconOffset, 
          left: '50%',
          marginLeft: -halfSize + iconOffsetY,
        };
      case 'left':
        return { 
          ...base, 
          left: -halfSize - iconOffset, 
          top: '50%',
          marginTop: -halfSize + iconOffsetY,
        };
      case 'right':
      default:
        return { 
          ...base, 
          right: -halfSize - iconOffset, 
          top: '50%',
          marginTop: -halfSize + iconOffsetY,
        };
    }
  };

  // Render beacon icon based on type
  const renderBeaconIcon = () => {
    const size = iconSize;
    
    if (iconShape === 'dot') {
      return (
        <div style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: iconColor,
        }} />
      );
    }
    
    if (iconShape === 'star') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={iconColor}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      );
    }
    
    if (iconShape === 'sparkle') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={iconColor}>
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
        </svg>
      );
    }
    
    if (iconShape === 'wand') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={iconColor}>
          <path d="M7.5 5.6L10 7L8.6 4.5L10 2L7.5 3.4L5 2L6.4 4.5L5 7L7.5 5.6ZM19.5 15.4L17 14L18.4 16.5L17 19L19.5 17.6L22 19L20.6 16.5L22 14L19.5 15.4ZM22 2L20.6 4.5L22 7L19.5 5.6L17 7L18.4 4.5L17 2L19.5 3.4L22 2ZM14.37 7.29C13.98 6.9 13.35 6.9 12.96 7.29L1.29 18.96C0.9 19.35 0.9 19.98 1.29 20.37L3.63 22.71C4.02 23.1 4.65 23.1 5.04 22.71L16.71 11.04C17.1 10.65 17.1 10.02 16.71 9.63L14.37 7.29Z"/>
        </svg>
      );
    }
    
    // Default: dot
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: iconColor,
      }} />
    );
  };

  // Stepper configuration
  const steps = [
    { id: 0, label: 'Content', icon: FileText },
    { id: 1, label: 'Target', icon: Crosshair },
    { id: 2, label: 'Beacon', icon: Circle },
    { id: 3, label: 'Card Style', icon: Settings },
    { id: 4, label: 'Frequency', icon: RefreshCw },
  ];

  return (
    <FullScreenModal
      title="New Tooltip"
      onClose={() => router.push('/tooltips')}
      actions={
        <button
          onClick={saveTooltip}
          disabled={loading || !name || !urlPattern || !selector || !title}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={18} />
          {loading ? 'Saving...' : 'Save Tooltip'}
        </button>
      }
    >
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
      `}</style>

      <div className="flex h-full">
        {/* Left Column - Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl">
          {/* Extension Status */}
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${
            extensionInstalled 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            {extensionInstalled ? (
              <>
                <CheckCircle className="text-green-600" size={18} />
                <p className="text-sm text-green-700">Extension connected - use visual picker!</p>
              </>
            ) : (
              <>
                <AlertCircle className="text-yellow-600" size={18} />
                <p className="text-sm text-yellow-700">Install extension for visual picker</p>
              </>
            )}
          </div>

          {/* Step Content */}
          {activeStep === 0 && (
              {/* Card Content */}
              <div className="card p-5 mb-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Content</h2>
                
                {/* Available Variables */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-xs font-medium text-blue-800 mb-2">📝 Available Variables (click to copy)</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { var: '{{firstName}}', label: 'First Name' },
                      { var: '{{lastName}}', label: 'Last Name' },
                      { var: '{{userName}}', label: 'Full Name' },
                    ].map(({ var: v, label }) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => navigator.clipboard.writeText(v)}
                        className="px-2 py-1 bg-white border border-blue-300 rounded text-xs text-blue-700 hover:bg-blue-100 transition-colors"
                        title={`Click to copy ${v}`}
                      >
                        {v} <span className="text-blue-400">({label})</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label">Title</label>
                    <input
                      type="text"
                      className="input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Hey {{firstName}}, check this out!"
                    />
                  </div>

                  <div>
                    <label className="label">Body</label>
                    <textarea
                      className="input min-h-[80px]"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Hi {{userName}}, here's a quick tip..."
                    />
                  </div>

                  <div>
                    <label className="label">Button Text</label>
                    <input
                      type="text"
                      className="input"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      placeholder="Got it"
                    />
                  </div>

                  <div>
                    <label className="label">Image (Optional)</label>
                    <ImageUpload
                      value={imageUrl}
                      onChange={setImageUrl}
                    />
                  </div>
                </div>
              </div>

              {/* Translations Info */}
              <div className="card p-5 mb-5 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Languages size={20} className="text-blue-600" />
                  <h2 className="text-base font-semibold text-gray-900">Translations</h2>
                </div>
                <p className="text-sm text-blue-700">
                  Save this tooltip first, then you can auto-translate to 10+ languages on the Edit page.
                </p>
              </div>
          )}

          {/* CUSTOMISATION STEPS */}
          {activeStep >= 1 && (
            <>
              {/* Targeting Section */}
          <div className="card p-5 mb-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Targeting</h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Tooltip Name</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Feature Discovery"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Website URL</label>
                  <input
                    type="text"
                    className="input"
                    value={urlPattern}
                    onChange={(e) => setUrlPattern(e.target.value)}
                    placeholder="https://app.example.com/*"
                  />
                </div>

                <div>
                  <label className="label">Element Selector</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input flex-1"
                      value={selector}
                      onChange={(e) => setSelector(e.target.value)}
                      placeholder=".my-button"
                    />
                    <button
                      onClick={startPicker}
                      disabled={!extensionInstalled || pickingElement}
                      className={`px-3 py-2 rounded-lg flex items-center gap-1 text-sm font-medium transition-colors ${
                        extensionInstalled 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Crosshair size={14} />
                      {pickingElement ? '...' : 'Pick'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trigger Settings */}
          <div className="card p-5 mb-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Trigger Settings</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Trigger On</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTriggerType('click')}
                    className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors ${
                      triggerType === 'click' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <MousePointer size={14} />
                    Click
                  </button>
                  <button
                    type="button"
                    onClick={() => setTriggerType('hover')}
                    className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors ${
                      triggerType === 'hover' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Hand size={14} />
                    Hover
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Dismiss When</label>
                <select
                  className="input"
                  value={dismissType}
                  onChange={(e) => setDismissType(e.target.value as any)}
                >
                  <option value="button">Click Button</option>
                  <option value="click_element">Click Target Element</option>
                  <option value="click_outside">Click Outside</option>
                </select>
              </div>
            </div>
          </div>

          {/* Beacon Settings */}
          <div className="card p-5 mb-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Beacon Settings</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Icon Shape</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { type: 'dot', icon: Circle, label: 'Dot' },
                    { type: 'star', icon: Star, label: 'Star' },
                    { type: 'sparkle', icon: Sparkles, label: 'Sparkle' },
                    { type: 'wand', icon: Wand2, label: 'Wand' },
                  ].map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setIconShape(type as any)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        iconShape === type
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-xs mt-1">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Animation</label>
                <button
                  type="button"
                  onClick={() => setIsPulsing(!isPulsing)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    isPulsing
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-4 h-4 rounded-full bg-blue-500 ${isPulsing ? 'animate-pulse' : ''}`}
                    />
                    <span className="text-sm font-medium">Pulse Animation</span>
                  </div>
                  <div className={`w-10 h-6 rounded-full transition-colors ${isPulsing ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${isPulsing ? 'translate-x-4.5 ml-4' : 'translate-x-0.5 ml-0.5'}`} />
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Size: {iconSize}px</label>
                <input
                  type="range"
                  min="8"
                  max="32"
                  value={iconSize}
                  onChange={(e) => setIconSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* Edge Position */}
            <div className="mb-4">
              <label className="label">Position Edge</label>
              <div className="flex gap-2">
                {(['top', 'right', 'bottom', 'left'] as const).map((edge) => (
                  <button
                    key={edge}
                    type="button"
                    onClick={() => setIconEdge(edge)}
                    className={`flex-1 py-2 rounded-lg capitalize text-sm transition-colors ${
                      iconEdge === edge 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {edge === 'top' && '↑'}
                    {edge === 'right' && '→'}
                    {edge === 'bottom' && '↓'}
                    {edge === 'left' && '←'}
                    {' '}{edge}
                  </button>
                ))}
              </div>
            </div>

            {/* Two columns for positioning */}
            <div className="grid grid-cols-2 gap-6 mb-4">
              {/* Left column: Beacon Position (relative to element) */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">📍 Beacon Position</h3>
                <p className="text-xs text-gray-500 mb-3">Distance from the selected element</p>
                
                <div className="mb-3">
                  <CenterSlider
                    value={iconOffset}
                    onChange={setIconOffset}
                    min={-30}
                    max={30}
                    label="From Edge"
                    magneticRange={3}
                  />
                </div>

                <div>
                  <CenterSlider
                    value={iconOffsetY}
                    onChange={setIconOffsetY}
                    min={-50}
                    max={50}
                    label="Along Edge"
                    magneticRange={5}
                  />
                </div>
              </div>

              {/* Right column: Card Position (relative to beacon) */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">💬 Card Position</h3>
                <p className="text-xs text-gray-500 mb-3">Distance from the beacon</p>
                
                <div className="mb-3">
                  <CenterSlider
                    value={cardGap}
                    onChange={setCardGap}
                    min={0}
                    max={40}
                    label="Gap from Beacon"
                    centered={false}
                    color="purple"
                  />
                </div>

                <div>
                  <CenterSlider
                    value={cardOffsetY}
                    onChange={setCardOffsetY}
                    min={-50}
                    max={50}
                    label="Card Offset"
                    magneticRange={5}
                    centered={true}
                    color="purple"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Beacon Color</label>
              <ColorPicker value={iconColor} onChange={setIconColor} />
            </div>
          </div>

          {/* Card Styling */}
          <div className="card p-5 mb-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Card Styling</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="label">Width (px)</label>
                <input
                  type="number"
                  className="input"
                  value={cardWidth}
                  onChange={(e) => setCardWidth(parseInt(e.target.value) || 320)}
                />
              </div>

              <div>
                <label className="label">Padding (px)</label>
                <input
                  type="number"
                  className="input"
                  value={cardPadding}
                  onChange={(e) => setCardPadding(parseInt(e.target.value) || 20)}
                />
              </div>

              <div>
                <label className="label">Corner Radius (px)</label>
                <input
                  type="number"
                  className="input"
                  value={cardBorderRadius}
                  onChange={(e) => setCardBorderRadius(parseInt(e.target.value) || 12)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Text Alignment</label>
                <div className="flex gap-1">
                  {['left', 'center', 'right'].map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => setTextAlign(align as any)}
                      className={`flex-1 py-2 rounded capitalize text-sm transition-colors ${
                        textAlign === align 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Shadow</label>
                <select
                  className="input"
                  value={cardShadow}
                  onChange={(e) => setCardShadow(e.target.value)}
                >
                  <option value="none">None</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra">Extra Large</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Background Color</label>
                <ColorPicker value={cardBgColor} onChange={setCardBgColor} />
              </div>

              <div>
                <label className="label">Text Color</label>
                <ColorPicker value={cardTextColor} onChange={setCardTextColor} />
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="card p-5 mb-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Typography</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="label">Title Size: {titleSize}px</label>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={titleSize}
                  onChange={(e) => setTitleSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <label className="label">Body Size: {bodySize}px</label>
                <input
                  type="range"
                  min="10"
                  max="18"
                  value={bodySize}
                  onChange={(e) => setBodySize(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <label className="label">Line Height: {bodyLineHeight}</label>
                <input
                  type="range"
                  min="1"
                  max="2"
                  step="0.1"
                  value={bodyLineHeight}
                  onChange={(e) => setBodyLineHeight(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Button Styling */}
          <div className="card p-5 mb-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Button Styling</h2>
            
            {/* Size */}
            <div className="mb-4">
              <label className="label">Size</label>
              <div className="flex gap-1">
                {[
                  { size: 'xxs', label: 'XXS' },
                  { size: 'xs', label: 'XS' },
                  { size: 's', label: 'S' },
                  { size: 'm', label: 'M' },
                  { size: 'l', label: 'L' },
                  { size: 'xl', label: 'XL' },
                ].map(({ size, label }) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setButtonSize(size as any)}
                    className={`flex-1 py-2 rounded text-xs font-medium transition-colors ${
                      buttonSize === size
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Position and Type */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Position</label>
                <div className="flex gap-1">
                  {[
                    { pos: 'left', label: '←' },
                    { pos: 'center', label: '•' },
                    { pos: 'right', label: '→' },
                  ].map(({ pos, label }) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setButtonPosition(pos as any)}
                      className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                        buttonPosition === pos
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Type</label>
                <div className="flex gap-1">
                  {[
                    { type: 'regular', label: 'Regular' },
                    { type: 'stretched', label: 'Stretched' },
                  ].map(({ type, label }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setButtonType(type as any)}
                      className={`flex-1 py-2 rounded text-xs font-medium transition-colors ${
                        buttonType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Corner Radius */}
            <div className="mb-4">
              <label className="label">Corner Radius (px)</label>
              <input
                type="number"
                className="input"
                value={buttonBorderRadius}
                onChange={(e) => setButtonBorderRadius(parseInt(e.target.value) || 8)}
              />
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Button Background</label>
                <ColorPicker value={buttonColor} onChange={setButtonColor} />
              </div>

              <div>
                <label className="label">Button Text Color</label>
                <ColorPicker value={buttonTextColor} onChange={setButtonTextColor} />
              </div>
            </div>
          </div>

          {/* Display Frequency */}
          <div className="card p-5 mb-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Display Frequency</h2>
            <p className="text-sm text-gray-500 mb-4">Control how often users see this tooltip</p>
            
            <div className="space-y-4">
              {/* Frequency Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFrequencyType('once')}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    frequencyType === 'once'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">Show Once</div>
                  <div className="text-xs text-gray-500 mt-1">User sees it only once, ever</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFrequencyType('always')}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    frequencyType === 'always'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">Show Always</div>
                  <div className="text-xs text-gray-500 mt-1">Show on every page visit</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFrequencyType('count')}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    frequencyType === 'count'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">Show X Times</div>
                  <div className="text-xs text-gray-500 mt-1">Limit total number of views</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFrequencyType('days')}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    frequencyType === 'days'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">Show Every X Days</div>
                  <div className="text-xs text-gray-500 mt-1">Repeat after a cooldown period</div>
                </button>
              </div>

              {/* Conditional inputs based on frequency type */}
              {frequencyType === 'count' && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="label">Maximum Times to Show</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="input w-24"
                      value={frequencyCount}
                      onChange={(e) => setFrequencyCount(parseInt(e.target.value) || 1)}
                    />
                    <span className="text-sm text-gray-600">times per user</span>
                  </div>
                </div>
              )}

              {frequencyType === 'days' && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="label">Show Again After</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      className="input w-24"
                      value={frequencyDays}
                      onChange={(e) => setFrequencyDays(parseInt(e.target.value) || 7)}
                    />
                    <span className="text-sm text-gray-600">days</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    After user dismisses, show again after {frequencyDays} day{frequencyDays !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="card p-5 mb-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Advanced</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Z-Index</label>
                <input
                  type="number"
                  className="input"
                  value={zIndex}
                  onChange={(e) => setZIndex(parseInt(e.target.value) || 2147483647)}
                />
                <p className="text-xs text-gray-500 mt-1">Higher = appears above other elements</p>
              </div>

              <div>
                <label className="label">Delay Before Showing (ms)</label>
                <input
                  type="number"
                  className="input"
                  value={delayMs}
                  onChange={(e) => setDelayMs(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-500 mt-1">Wait before showing (1000ms = 1 second)</p>
              </div>
            </div>
          </div>
            </>
          )}

          </div>
        </div>

        {/* Right Column - Stepper + Preview */}
        <div className="w-[500px] flex flex-col border-l border-gray-200">
          {/* Vertical Stepper */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex gap-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === index;
                const isCompleted = activeStep > index;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(index)}
                    className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : isCompleted
                          ? 'bg-green-50 text-green-600'
                          : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200'
                    }`}>
                      {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                    </div>
                    <span className="text-xs font-medium">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Preview Area */}
          <div 
            className="flex-1 flex items-center justify-center overflow-hidden bg-gray-50"
          >
                {/* Preview container - positions calculated from beacon */}
                <div className="relative">
                  {/* Mock Element */}
                  <div 
                    className="bg-gray-300 rounded-lg flex items-center justify-center text-gray-500 font-medium text-sm"
                    style={{ width: 100, height: 100 }}
                  >
                    Element
                  </div>
                  
                  {/* Beacon - positioned on element edge */}
                  {iconShape && (
                    <div style={getBeaconPreviewStyle()}>
                      {renderBeaconIcon()}
                    </div>
                  )}

                  {/* Card - positioned relative to beacon */}
                  {(() => {
                    const elementSize = 100;
                    const halfElement = elementSize / 2;
                    const halfBeacon = iconSize / 2;
                    
                    // Calculate card position based on beacon position + cardGap
                    let cardStyle: React.CSSProperties = {
                      position: 'absolute',
                      width: cardWidth,
                      backgroundColor: cardBgColor,
                      color: cardTextColor,
                      borderRadius: cardBorderRadius,
                      padding: cardPadding,
                      boxShadow: getShadowValue(cardShadow),
                      textAlign: textAlign,
                    };

                    // Position card based on edge - distance from beacon, not element
                    switch (iconEdge) {
                      case 'top':
                        // Beacon is above element, card is above beacon
                        cardStyle.bottom = elementSize + iconOffset + iconSize + cardGap;
                        cardStyle.left = halfElement - cardWidth / 2 + cardOffsetY;
                        break;
                      case 'bottom':
                        // Beacon is below element, card is below beacon
                        cardStyle.top = elementSize + iconOffset + iconSize + cardGap;
                        cardStyle.left = halfElement - cardWidth / 2 + cardOffsetY;
                        break;
                      case 'left':
                        // Beacon is left of element, card is left of beacon
                        cardStyle.right = elementSize + iconOffset + iconSize + cardGap;
                        cardStyle.top = halfElement - 100 + cardOffsetY; // -100 to roughly center card vertically
                        break;
                      case 'right':
                      default:
                        // Beacon is right of element, card is right of beacon
                        cardStyle.left = elementSize + iconOffset + iconSize + cardGap;
                        cardStyle.top = halfElement - 100 + cardOffsetY;
                        break;
                    }

                    return (
                      <div style={cardStyle}>
                        {imageUrl && (
                          <img 
                            src={imageUrl} 
                            alt="Preview" 
                            className="w-full object-cover mb-3"
                            style={{ 
                              borderRadius: Math.max(0, cardBorderRadius - 4),
                              aspectRatio: '16 / 9'
                            }}
                          />
                        )}
                        <h3 className="font-semibold mb-1" style={{ fontSize: `${titleSize}px` }}>
                          {title || 'Tooltip Title'}
                        </h3>
                        <p className="opacity-80 mb-3" style={{ fontSize: `${bodySize}px`, lineHeight: bodyLineHeight }}>
                          {body || 'Tooltip description goes here...'}
                        </p>
                        {buttonText && (
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: buttonPosition === 'center' ? 'center' : buttonPosition === 'right' ? 'flex-end' : 'flex-start' 
                          }}>
                            <button
                              style={{
                                backgroundColor: buttonColor,
                                color: buttonTextColor,
                                borderRadius: buttonBorderRadius,
                                padding: getButtonSizeStyles(buttonSize).padding,
                                width: buttonType === 'stretched' ? '100%' : 'auto',
                                border: 'none',
                                fontWeight: 500,
                                fontSize: getButtonSizeStyles(buttonSize).fontSize,
                                cursor: 'pointer',
                              }}
                            >
                              {buttonText}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
          </div>
        </div>
      </div>
    </FullScreenModal>
  );
}
