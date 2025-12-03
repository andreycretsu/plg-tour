'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ImageUpload from '@/components/ImageUpload';
import { Save, Crosshair, AlertCircle, CheckCircle, ArrowLeft, MousePointer, Hand, X } from 'lucide-react';

export default function NewTooltipPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [pickingElement, setPickingElement] = useState(false);

  // Form state
  const [name, setName] = useState('New Tooltip');
  const [urlPattern, setUrlPattern] = useState('');
  const [selector, setSelector] = useState('');
  
  // Trigger settings
  const [triggerType, setTriggerType] = useState<'click' | 'hover'>('click');
  const [dismissType, setDismissType] = useState<'button' | 'click_element' | 'click_outside'>('button');
  
  // Icon/Beacon settings
  const [iconType, setIconType] = useState<'pulse' | 'beacon' | 'dot' | 'none'>('pulse');
  const [iconPosition, setIconPosition] = useState('right');
  const [iconPadding, setIconPadding] = useState(12);
  const [iconSize, setIconSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [iconColor, setIconColor] = useState('#3b82f6');
  const [iconBgColor, setIconBgColor] = useState('#ffffff');
  
  // Card settings
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [cardWidth, setCardWidth] = useState(320);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [cardTextColor, setCardTextColor] = useState('#1f2937');
  const [cardBgColor, setCardBgColor] = useState('#ffffff');
  const [buttonText, setButtonText] = useState('Got it');
  const [buttonColor, setButtonColor] = useState('#3b82f6');
  
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
          iconPosition,
          iconPadding,
          iconSize,
          iconColor,
          iconBgColor,
          title,
          body,
          imageUrl: imageUrl || null,
          cardWidth,
          textAlign,
          cardTextColor,
          cardBgColor,
          buttonText,
          buttonColor,
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

  const iconPositions = [
    { value: 'top-left', label: '↖' },
    { value: 'top', label: '↑' },
    { value: 'top-right', label: '↗' },
    { value: 'left', label: '←' },
    { value: 'right', label: '→' },
    { value: 'bottom-left', label: '↙' },
    { value: 'bottom', label: '↓' },
    { value: 'bottom-right', label: '↘' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/tooltips')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Tooltip</h1>
            <p className="text-gray-600 mt-1">Create a contextual hint with beacon</p>
          </div>
        </div>

        {/* Extension Status */}
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          extensionInstalled 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          {extensionInstalled ? (
            <>
              <CheckCircle className="text-green-600" size={20} />
              <div>
                <p className="font-medium text-green-800">Extension Connected</p>
                <p className="text-sm text-green-600">You can use the visual element picker!</p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="text-yellow-600" size={20} />
              <div>
                <p className="font-medium text-yellow-800">Extension Not Detected</p>
                <p className="text-sm text-yellow-600">Install extension for visual element picker</p>
              </div>
            </>
          )}
        </div>

        {/* Targeting Section */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Targeting</h2>
          
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

            <div>
              <label className="label">Website URL</label>
              <input
                type="text"
                className="input"
                value={urlPattern}
                onChange={(e) => setUrlPattern(e.target.value)}
                placeholder="https://app.example.com/dashboard*"
              />
              <p className="text-sm text-gray-500 mt-1">Use * as wildcard</p>
            </div>

            <div>
              <label className="label">Element Selector</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  value={selector}
                  onChange={(e) => setSelector(e.target.value)}
                  placeholder=".my-button or #feature-btn"
                />
                <button
                  onClick={startPicker}
                  disabled={!extensionInstalled || pickingElement}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
                    extensionInstalled 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Crosshair size={16} />
                  {pickingElement ? 'Picking...' : 'Select'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Trigger Settings */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trigger Settings</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="label">Trigger On</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTriggerType('click')}
                  className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    triggerType === 'click' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MousePointer size={16} />
                  Click
                </button>
                <button
                  type="button"
                  onClick={() => setTriggerType('hover')}
                  className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    triggerType === 'hover' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Hand size={16} />
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

        {/* Icon/Beacon Settings */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Icon Settings</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="label">Icon Type</label>
              <select
                className="input"
                value={iconType}
                onChange={(e) => setIconType(e.target.value as any)}
              >
                <option value="pulse">Pulse (Animated)</option>
                <option value="beacon">Beacon</option>
                <option value="dot">Simple Dot</option>
                <option value="none">No Icon</option>
              </select>
            </div>

            <div>
              <label className="label">Icon Position</label>
              <div className="grid grid-cols-4 gap-1 bg-gray-100 p-2 rounded-lg">
                {iconPositions.map((pos) => (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() => setIconPosition(pos.value)}
                    className={`p-2 rounded text-sm font-medium transition-colors ${
                      iconPosition === pos.value 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-gray-200'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Icon Size</label>
              <div className="flex gap-2">
                {['small', 'medium', 'large'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setIconSize(size as any)}
                    className={`flex-1 py-2 px-4 rounded-lg capitalize transition-colors ${
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

            <div>
              <label className="label">Icon Padding (px)</label>
              <input
                type="number"
                className="input"
                value={iconPadding}
                onChange={(e) => setIconPadding(parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="label">Icon Color</label>
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

            <div>
              <label className="label">Icon Background</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={iconBgColor}
                  onChange={(e) => setIconBgColor(e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  className="input flex-1"
                  value={iconBgColor}
                  onChange={(e) => setIconBgColor(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card/Content Settings */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Card Settings</h2>
          
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
                className="input min-h-[100px]"
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

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Card Width (px)</label>
                <input
                  type="number"
                  className="input"
                  value={cardWidth}
                  onChange={(e) => setCardWidth(parseInt(e.target.value) || 320)}
                />
              </div>

              <div>
                <label className="label">Text Alignment</label>
                <div className="flex gap-1">
                  {['left', 'center', 'right'].map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() => setTextAlign(align as any)}
                      className={`flex-1 py-2 rounded capitalize transition-colors ${
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
                <label className="label">Button Text</label>
                <input
                  type="text"
                  className="input"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Got it"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
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
                <label className="label">Button Color</label>
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
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Advanced Settings</h2>
          
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
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <span className="text-sm text-gray-700">Show only once per user</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
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
    </DashboardLayout>
  );
}

