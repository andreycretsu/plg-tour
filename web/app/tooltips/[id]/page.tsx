'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ImageUpload from '@/components/ImageUpload';
import { Save, Crosshair, AlertCircle, CheckCircle, ArrowLeft, MousePointer, Hand, Eye, Trash2, Loader2 } from 'lucide-react';

export default function EditTooltipPage() {
  const router = useRouter();
  const params = useParams();
  const tooltipId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [pickingElement, setPickingElement] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [urlPattern, setUrlPattern] = useState('');
  const [selector, setSelector] = useState('');
  
  // Trigger settings
  const [triggerType, setTriggerType] = useState<'click' | 'hover'>('click');
  const [dismissType, setDismissType] = useState<'button' | 'click_element' | 'click_outside'>('button');
  
  // Icon/Beacon settings
  const [iconType, setIconType] = useState<'pulse' | 'beacon' | 'dot' | 'none'>('pulse');
  const [iconEdge, setIconEdge] = useState<'top' | 'right' | 'bottom' | 'left'>('right');
  const [iconOffset, setIconOffset] = useState(0);
  const [iconOffsetY, setIconOffsetY] = useState(0);
  const [iconSize, setIconSize] = useState(16); // Size in pixels
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
  
  // Display Frequency
  const [frequencyType, setFrequencyType] = useState<'once' | 'always' | 'count' | 'days'>('once');
  const [frequencyCount, setFrequencyCount] = useState(1);
  const [frequencyDays, setFrequencyDays] = useState(7);
  
  // Advanced
  const [zIndex, setZIndex] = useState(2147483647);
  const [delayMs, setDelayMs] = useState(0);

  // Load tooltip data
  useEffect(() => {
    const loadTooltip = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/tooltips/${tooltipId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!response.ok) throw new Error('Failed to load tooltip');
        
        const data = await response.json();
        const t = data.tooltip;
        
        setName(t.name || '');
        setUrlPattern(t.url_pattern || '');
        setSelector(t.selector || '');
        setTriggerType(t.trigger_type || 'click');
        setDismissType(t.dismiss_type || 'button');
        setIconType(t.icon_type || 'pulse');
        setIconEdge(t.icon_edge || 'right');
        setIconOffset(t.icon_offset || 0);
        setIconOffsetY(t.icon_offset_y || 0);
        // Handle both numeric and legacy string sizes
        const sizeMap: Record<string, number> = { small: 10, medium: 16, large: 24 };
        const rawSize = t.icon_size;
        setIconSize(typeof rawSize === 'number' ? rawSize : sizeMap[rawSize] || 16);
        setIconColor(t.icon_color || '#3b82f6');
        setTitle(t.title || '');
        setBody(t.body || '');
        setImageUrl(t.image_url || '');
        setCardWidth(t.card_width || 320);
        setCardPadding(t.card_padding || 20);
        setCardBorderRadius(t.card_border_radius || 12);
        setCardShadow(getShadowName(t.card_shadow) || 'medium');
        setTextAlign(t.text_align || 'left');
        setCardTextColor(t.card_text_color || '#1f2937');
        setCardBgColor(t.card_bg_color || '#ffffff');
        setButtonText(t.button_text || 'Got it');
        setButtonColor(t.button_color || '#3b82f6');
        setButtonTextColor(t.button_text_color || '#ffffff');
        setButtonBorderRadius(t.button_border_radius || 8);
        setZIndex(t.z_index || 2147483647);
        setDelayMs(t.delay_ms || 0);
        setFrequencyType(t.frequency_type || 'once');
        setFrequencyCount(t.frequency_count || 1);
        setFrequencyDays(t.frequency_days || 7);
        setIsActive(t.is_active ?? true);
      } catch (err) {
        console.error('Failed to load tooltip:', err);
        alert('Failed to load tooltip');
        router.push('/tooltips');
      } finally {
        setLoading(false);
      }
    };
    
    loadTooltip();
  }, [tooltipId, router]);

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

  const getShadowName = (shadowValue: string) => {
    if (!shadowValue || shadowValue === 'none') return 'none';
    if (shadowValue.includes('2px')) return 'small';
    if (shadowValue.includes('4px')) return 'medium';
    if (shadowValue.includes('8px')) return 'large';
    if (shadowValue.includes('12px')) return 'extra';
    return 'medium';
  };

  const saveTooltip = async () => {
    if (!name || !urlPattern || !selector || !title) {
      alert('Please fill in name, URL pattern, selector, and title');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tooltips/${tooltipId}`, {
        method: 'PUT',
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
          iconOffsetY,
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
          delayMs,
          frequencyType,
          frequencyCount,
          frequencyDays,
          showOnce: frequencyType === 'once',
          isActive,
        }),
      });

      if (!response.ok) throw new Error('Failed to save tooltip');

      alert('Tooltip saved successfully!');
      router.push('/tooltips');
    } catch (error) {
      alert('Error saving tooltip: ' + error);
    } finally {
      setSaving(false);
    }
  };

  const deleteTooltip = async () => {
    if (!confirm('Are you sure you want to delete this tooltip?')) return;
    
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tooltips/${tooltipId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      router.push('/tooltips');
    } catch (error) {
      alert('Error deleting tooltip: ' + error);
    } finally {
      setDeleting(false);
    }
  };

  // Get beacon position for preview - properly centered
  const getBeaconPreviewStyle = (): React.CSSProperties => {
    const size = iconSize;
    const halfSize = size / 2;
    
    const base: React.CSSProperties = {
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: '50%',
      backgroundColor: iconColor,
      animation: iconType === 'pulse' ? 'pulse 2s infinite' : undefined,
    };

    // Position beacon on the edge with offsets
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      </DashboardLayout>
    );
  }

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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/tooltips')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Tooltip</h1>
                <p className="text-gray-600 text-sm">Modify tooltip settings</p>
              </div>
            </div>
            <button
              onClick={deleteTooltip}
              disabled={deleting}
              className="btn btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 size={16} />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>

          {/* Status Toggle */}
          <div className="card p-4 mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Tooltip Status</h3>
              <p className="text-sm text-gray-500">Enable or disable this tooltip</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </label>
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
                <label className="label">Size: {iconSize}px</label>
                <input
                  type="range"
                  min="8"
                  max="32"
                  value={iconSize}
                  onChange={(e) => setIconSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-2"
                />
                <div className="flex gap-1">
                  {[
                    { label: 'S', value: 10 },
                    { label: 'M', value: 16 },
                    { label: 'L', value: 24 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setIconSize(preset.value)}
                      className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
                        iconSize === preset.value 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {preset.label}
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

            {/* Y-axis Slider */}
            <div className="mb-4">
              <label className="label">
                Position Along Edge: {iconOffsetY}px 
                <span className="text-gray-400 font-normal ml-1">
                  ({iconEdge === 'left' || iconEdge === 'right' ? 'vertical' : 'horizontal'})
                </span>
              </label>
              <input
                type="range"
                min="-50"
                max="50"
                value={iconOffsetY}
                onChange={(e) => setIconOffsetY(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{iconEdge === 'left' || iconEdge === 'right' ? '↑ Top' : '← Left'}</span>
                <span>Center</span>
                <span>{iconEdge === 'left' || iconEdge === 'right' ? '↓ Bottom' : 'Right →'}</span>
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

          {/* Display Frequency */}
          <div className="card p-5 mb-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Display Frequency</h2>
            <p className="text-sm text-gray-500 mb-4">Control how often users see this tooltip</p>
            
            <div className="space-y-4">
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
              disabled={saving}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Right Column - Live Preview */}
        <div className="flex-1 min-w-[400px]">
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
                className="rounded-xl p-6 min-h-[400px] flex items-center justify-center"
                style={{ backgroundColor: '#f3f4f6' }}
              >
                {/* Preview Layout - changes based on edge */}
                <div className={`flex items-center justify-center gap-4`}
                style={{
                  flexDirection: iconEdge === 'top' ? 'column-reverse' : 
                                 iconEdge === 'bottom' ? 'column' : 
                                 iconEdge === 'left' ? 'row-reverse' : 'row'
                }}>
                  
                  {/* Mock Element - Square */}
                  <div className="relative flex-shrink-0">
                    <div 
                      className="bg-gray-300 rounded-lg flex items-center justify-center text-gray-500 font-medium text-sm"
                      style={{ width: 100, height: 100 }}
                    >
                      Element
                      
                      {/* Beacon */}
                      {iconType !== 'none' && (
                        <div style={getBeaconPreviewStyle()} />
                      )}
                    </div>
                  </div>

                  {/* Tooltip Card Preview */}
                  <div 
                    className="flex-shrink-0"
                    style={{
                      width: Math.min(cardWidth, 280),
                      backgroundColor: cardBgColor,
                      color: cardTextColor,
                      borderRadius: cardBorderRadius,
                      padding: Math.min(cardPadding, 16),
                      boxShadow: getShadowValue(cardShadow),
                      textAlign: textAlign,
                    }}
                  >
                    {imageUrl && (
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-full h-24 object-cover mb-3"
                        style={{ borderRadius: Math.max(0, cardBorderRadius - 4) }}
                      />
                    )}
                    <h3 className="font-semibold text-sm mb-1">
                      {title || 'Tooltip Title'}
                    </h3>
                    <p className="text-xs opacity-80 mb-3">
                      {body || 'Tooltip description goes here...'}
                    </p>
                    {buttonText && (
                      <button
                        style={{
                          backgroundColor: buttonColor,
                          color: buttonTextColor,
                          borderRadius: buttonBorderRadius,
                          padding: '6px 12px',
                          width: textAlign === 'center' ? '100%' : 'auto',
                          display: textAlign === 'center' ? 'block' : 'inline-block',
                          border: 'none',
                          fontWeight: 500,
                          fontSize: '12px',
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
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gray-100 border border-gray-300 rounded relative">
                  <div 
                    className="absolute w-2 h-2 bg-blue-500 rounded-full"
                    style={{
                      ...(iconEdge === 'top' && { 
                        top: `${50 - iconOffset}%`, 
                        left: `calc(50% + ${iconOffsetY * 0.5}px)`, 
                        transform: 'translate(-50%, -50%)' 
                      }),
                      ...(iconEdge === 'bottom' && { 
                        bottom: `${50 - iconOffset}%`, 
                        left: `calc(50% + ${iconOffsetY * 0.5}px)`, 
                        transform: 'translate(-50%, 50%)' 
                      }),
                      ...(iconEdge === 'left' && { 
                        left: `${50 - iconOffset}%`, 
                        top: `calc(50% + ${iconOffsetY * 0.5}px)`, 
                        transform: 'translate(-50%, -50%)' 
                      }),
                      ...(iconEdge === 'right' && { 
                        right: `${50 - iconOffset}%`, 
                        top: `calc(50% + ${iconOffsetY * 0.5}px)`, 
                        transform: 'translate(50%, -50%)' 
                      }),
                    }}
                  />
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong className="text-gray-800">{iconEdge}</strong> edge</p>
                  <p>Distance: <span className="font-mono">{iconOffset}px</span></p>
                  <p>Along: <span className="font-mono">{iconOffsetY}px</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

