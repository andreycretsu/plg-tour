'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ImageUpload from '@/components/ImageUpload';
import { Save, Crosshair, AlertCircle, CheckCircle, ArrowLeft, MousePointer, Hand, Eye } from 'lucide-react';

export default function NewTooltipPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [pickingElement, setPickingElement] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  // Form state
  const [name, setName] = useState('New Tooltip');
  const [urlPattern, setUrlPattern] = useState('');
  const [selector, setSelector] = useState('');
  
  // Trigger settings
  const [triggerType, setTriggerType] = useState<'click' | 'hover'>('click');
  const [dismissType, setDismissType] = useState<'button' | 'click_element' | 'click_outside'>('button');
  
  // Icon/Beacon settings
  const [iconType, setIconType] = useState<'pulse' | 'beacon' | 'dot' | 'none'>('pulse');
  const [iconEdge, setIconEdge] = useState<'top' | 'right' | 'bottom' | 'left'>('right');
  const [iconOffset, setIconOffset] = useState(0);
  const [iconSize, setIconSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [iconColor, setIconColor] = useState('#3b82f6');
  
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
  const [buttonText, setButtonText] = useState('Got it');
  const [buttonColor, setButtonColor] = useState('#3b82f6');
  const [buttonTextColor, setButtonTextColor] = useState('#ffffff');
  const [buttonBorderRadius, setButtonBorderRadius] = useState(8);
  
  // Advanced
  const [zIndex, setZIndex] = useState(2147483647);
  const [showOnce, setShowOnce] = useState(true);
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

  const saveTooltip = async () => {
    if (!name || !urlPattern || !selector || !title) {
      alert('Please fill in name, URL pattern, selector, and title');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tooltips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          urlPattern,
          selector,
          triggerType,
          dismissType,
          iconType,
          iconEdge,
          iconOffset,
          iconSize,
          iconColor,
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
          buttonText,
          buttonColor,
          buttonTextColor,
          buttonBorderRadius,
          zIndex,
          showOnce,
          delayMs,
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

  // Get beacon position for preview
  const getBeaconPreviewStyle = () => {
    const sizes = { small: 12, medium: 16, large: 24 };
    const size = sizes[iconSize];
    const offset = iconOffset;
    
    const base: React.CSSProperties = {
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: iconColor,
      animation: iconType === 'pulse' ? 'pulse 2s infinite' : undefined,
    };

    switch (iconEdge) {
      case 'top':
        return { ...base, top: offset - size/2, left: '50%', transform: 'translateX(-50%)' };
      case 'bottom':
        return { ...base, bottom: offset - size/2, left: '50%', transform: 'translateX(-50%)' };
      case 'left':
        return { ...base, left: offset - size/2, top: '50%', transform: 'translateY(-50%)' };
      case 'right':
      default:
        return { ...base, right: offset - size/2, top: '50%', transform: 'translateY(-50%)' };
    }
  };

  return (
    <DashboardLayout>
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
      `}</style>

      <div className="flex gap-6">
        {/* Left Column - Form */}
        <div className="flex-1 max-w-2xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/tooltips')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Tooltip</h1>
              <p className="text-gray-600 text-sm">Create a contextual hint with beacon</p>
            </div>
          </div>

          {/* Extension Status */}
          <div className={`mb-6 p-3 rounded-lg flex items-center gap-3 ${
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
                <label className="label">Beacon Type</label>
                <select
                  className="input"
                  value={iconType}
                  onChange={(e) => setIconType(e.target.value as any)}
                >
                  <option value="pulse">Pulse (Animated)</option>
                  <option value="beacon">Static Beacon</option>
                  <option value="dot">Simple Dot</option>
                  <option value="none">No Beacon</option>
                </select>
              </div>

              <div>
                <label className="label">Size</label>
                <div className="flex gap-1">
                  {['small', 'medium', 'large'].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setIconSize(size as any)}
                      className={`flex-1 py-2 rounded-lg capitalize text-sm transition-colors ${
                        iconSize === size 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
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

            {/* Distance Slider */}
            <div className="mb-4">
              <label className="label">Distance from Edge: {iconOffset}px</label>
              <input
                type="range"
                min="-20"
                max="40"
                value={iconOffset}
                onChange={(e) => setIconOffset(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-20 (inside)</span>
                <span>0 (edge)</span>
                <span>+40 (outside)</span>
              </div>
            </div>

            <div>
              <label className="label">Beacon Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={iconColor}
                  onChange={(e) => setIconColor(e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  className="input flex-1"
                  value={iconColor}
                  onChange={(e) => setIconColor(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Card Settings */}
          <div className="card p-5 mb-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Card Content</h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input
                  type="text"
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Feature Title"
                />
              </div>

              <div>
                <label className="label">Body</label>
                <textarea
                  className="input min-h-[80px]"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Description of the feature..."
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
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={cardBgColor}
                    onChange={(e) => setCardBgColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    className="input flex-1"
                    value={cardBgColor}
                    onChange={(e) => setCardBgColor(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Text Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={cardTextColor}
                    onChange={(e) => setCardTextColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    className="input flex-1"
                    value={cardTextColor}
                    onChange={(e) => setCardTextColor(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Button Styling */}
          <div className="card p-5 mb-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Button Styling</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
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
                <label className="label">Corner Radius (px)</label>
                <input
                  type="number"
                  className="input"
                  value={buttonBorderRadius}
                  onChange={(e) => setButtonBorderRadius(parseInt(e.target.value) || 8)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Button Background</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={buttonColor}
                    onChange={(e) => setButtonColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    className="input flex-1"
                    value={buttonColor}
                    onChange={(e) => setButtonColor(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Button Text Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={buttonTextColor}
                    onChange={(e) => setButtonTextColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    className="input flex-1"
                    value={buttonTextColor}
                    onChange={(e) => setButtonTextColor(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="card p-5 mb-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Advanced</h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Z-Index</label>
                <input
                  type="number"
                  className="input"
                  value={zIndex}
                  onChange={(e) => setZIndex(parseInt(e.target.value) || 2147483647)}
                />
              </div>

              <div>
                <label className="label">Delay (ms)</label>
                <input
                  type="number"
                  className="input"
                  value={delayMs}
                  onChange={(e) => setDelayMs(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnce}
                    onChange={(e) => setShowOnce(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Show once</span>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push('/tooltips')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={saveTooltip}
              disabled={loading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Tooltip'}
            </button>
          </div>
        </div>

        {/* Right Column - Live Preview */}
        <div className="w-96 flex-shrink-0">
          <div className="sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Eye size={18} />
                Live Preview
              </h2>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {showPreview ? 'Hide' : 'Show'}
              </button>
            </div>

            {showPreview && (
              <div 
                className="rounded-xl p-8 min-h-[500px] flex items-center justify-center"
                style={{ backgroundColor: '#f3f4f6' }}
              >
                {/* Preview Container */}
                <div className="relative">
                  {/* Mock Element */}
                  <div 
                    className="bg-gray-300 rounded-lg flex items-center justify-center text-gray-600 font-medium relative"
                    style={{ width: 200, height: 80 }}
                  >
                    <span>Element</span>
                    
                    {/* Beacon */}
                    {iconType !== 'none' && (
                      <div style={getBeaconPreviewStyle()} />
                    )}
                  </div>

                  {/* Tooltip Card Preview */}
                  <div 
                    className="mt-4"
                    style={{
                      width: Math.min(cardWidth, 340),
                      backgroundColor: cardBgColor,
                      color: cardTextColor,
                      borderRadius: cardBorderRadius,
                      padding: cardPadding,
                      boxShadow: getShadowValue(cardShadow),
                      textAlign: textAlign,
                    }}
                  >
                    {imageUrl && (
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded-lg mb-3"
                        style={{ borderRadius: Math.max(0, cardBorderRadius - 4) }}
                      />
                    )}
                    <h3 className="font-semibold text-base mb-2">
                      {title || 'Tooltip Title'}
                    </h3>
                    <p className="text-sm opacity-80 mb-4">
                      {body || 'Tooltip description goes here...'}
                    </p>
                    {buttonText && (
                      <button
                        style={{
                          backgroundColor: buttonColor,
                          color: buttonTextColor,
                          borderRadius: buttonBorderRadius,
                          padding: '8px 16px',
                          width: textAlign === 'center' ? '100%' : 'auto',
                          display: textAlign === 'center' ? 'block' : 'inline-block',
                          border: 'none',
                          fontWeight: 500,
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        {buttonText}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Position Indicator */}
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Beacon Position:</p>
              <div className="flex items-center gap-2">
                <div className="w-16 h-16 bg-gray-100 border border-gray-300 rounded relative">
                  <div 
                    className="absolute w-2 h-2 bg-blue-500 rounded-full"
                    style={{
                      ...(iconEdge === 'top' && { top: `${50 - iconOffset}%`, left: '50%', transform: 'translate(-50%, -50%)' }),
                      ...(iconEdge === 'bottom' && { bottom: `${50 - iconOffset}%`, left: '50%', transform: 'translate(-50%, 50%)' }),
                      ...(iconEdge === 'left' && { left: `${50 - iconOffset}%`, top: '50%', transform: 'translate(-50%, -50%)' }),
                      ...(iconEdge === 'right' && { right: `${50 - iconOffset}%`, top: '50%', transform: 'translate(50%, -50%)' }),
                    }}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>{iconEdge}</strong> edge</p>
                  <p>{iconOffset}px offset</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
