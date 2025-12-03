'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { PreviewPanel } from '@/components/StepPreview';
import { Plus, Trash2, GripVertical, Save, Crosshair, AlertCircle, CheckCircle, Eye, Layers } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

interface Step {
  id: string;
  selector: string;
  title: string;
  content: string;
  imageUrl: string;
  buttonText: string;
  placement: string;
  pulseEnabled: boolean;
  zIndex: number;
}

interface TourStyling {
  cardBgColor: string;
  cardTextColor: string;
  cardBorderRadius: number;
  cardPadding: number;
  cardShadow: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonBorderRadius: number;
}

interface TourFrequency {
  type: 'once' | 'always' | 'count' | 'days';
  count: number;
  days: number;
}

const defaultStyling: TourStyling = {
  cardBgColor: '#ffffff',
  cardTextColor: '#1f2937',
  cardBorderRadius: 12,
  cardPadding: 20,
  cardShadow: 'medium',
  buttonColor: '#3b82f6',
  buttonTextColor: '#ffffff',
  buttonBorderRadius: 8,
};

const defaultFrequency: TourFrequency = {
  type: 'once',
  count: 1,
  days: 7,
};

export default function NewTourPage() {
  const router = useRouter();
  const [tourName, setTourName] = useState('New Product Tour');
  const [urlPattern, setUrlPattern] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [styling, setStyling] = useState<TourStyling>(defaultStyling);
  const [frequency, setFrequency] = useState<TourFrequency>(defaultFrequency);
  const [showStyling, setShowStyling] = useState(false);
  const [showFrequency, setShowFrequency] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [pickingForStep, setPickingForStep] = useState<string | null>(null);
  const [pickerStatus, setPickerStatus] = useState<'idle' | 'waiting' | 'success'>('idle');
  const [activePreviewStep, setActivePreviewStep] = useState<string | null>(null);

  // Check if extension is installed
  useEffect(() => {
    const checkExtension = () => {
      window.postMessage({ source: 'tourlayer-webapp', type: 'PING' }, '*');
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (!event.data || event.data.source !== 'tourlayer-extension') return;

      console.log('Received from extension:', event.data);

      switch (event.data.type) {
        case 'PONG':
        case 'EXTENSION_READY':
          setExtensionInstalled(true);
          break;
        case 'ELEMENT_PICKED':
          // Handle picked element
          if (pickingForStep && event.data.selector) {
            updateStep(pickingForStep, 'selector', event.data.selector);
            setPickerStatus('success');
            setTimeout(() => {
              setPickerStatus('idle');
              setPickingForStep(null);
            }, 2000);
          }
          break;
        case 'PICKER_CANCELLED':
          setPickerStatus('idle');
          setPickingForStep(null);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Check on mount and periodically
    checkExtension();
    const interval = setInterval(checkExtension, 3000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, [pickingForStep]);

  const addStep = () => {
    const newStep: Step = {
      id: `step-${Date.now()}`,
      selector: '',
      title: 'Step Title',
      content: 'Step description...',
      imageUrl: '',
      buttonText: 'Next',
      placement: 'bottom',
      pulseEnabled: true,
      zIndex: 2147483647,
    };
    setSteps([...steps, newStep]);
    setActivePreviewStep(newStep.id);
  };

  const updateStep = useCallback((id: string, field: keyof Step, value: any) => {
    setSteps(currentSteps => currentSteps.map(step => 
      step.id === id ? { ...step, [field]: value } : step
    ));
  }, []);

  const deleteStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id));
    if (activePreviewStep === id) {
      setActivePreviewStep(null);
    }
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

  const startPicker = (stepId: string) => {
    if (!extensionInstalled) {
      alert('Please install the TourLayer Chrome extension first!');
      return;
    }

    // Get target URL from URL pattern (remove wildcards for opening)
    let targetUrl = urlPattern.replace(/\*+/g, '').trim();
    
    if (!targetUrl) {
      alert('Please enter a URL pattern first so we know which website to pick elements from!');
      return;
    }

    // Ensure it's a valid URL
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    
    setPickingForStep(stepId);
    setPickerStatus('waiting');
    
    // Tell extension to open target URL and start picker
    window.postMessage({ 
      source: 'tourlayer-webapp', 
      type: 'START_PICKER',
      stepId,
      targetUrl
    }, '*');
  };

  const saveTour = async () => {
    if (!tourName || !urlPattern) {
      alert('Please fill in tour name and URL pattern');
      return;
    }

    if (steps.length === 0) {
      alert('Please add at least one step');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: tourName,
          urlPattern: urlPattern,
          // Tour-level styling
          cardBgColor: styling.cardBgColor,
          cardTextColor: styling.cardTextColor,
          cardBorderRadius: styling.cardBorderRadius,
          cardPadding: styling.cardPadding,
          cardShadow: getShadowValue(styling.cardShadow),
          buttonColor: styling.buttonColor,
          buttonTextColor: styling.buttonTextColor,
          buttonBorderRadius: styling.buttonBorderRadius,
          // Frequency settings
          frequencyType: frequency.type,
          frequencyCount: frequency.count,
          frequencyDays: frequency.days,
          steps: steps.map((step, index) => ({
            stepOrder: index,
            selector: step.selector,
            title: step.title,
            content: step.content,
            imageUrl: step.imageUrl || undefined,
            buttonText: step.buttonText,
            placement: step.placement,
            pulseEnabled: step.pulseEnabled,
            zIndex: step.zIndex,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save tour');
      }

      alert('Tour saved successfully!');
      router.push('/tours');
    } catch (error) {
      alert('Error saving tour: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const activeStep = steps.find(s => s.id === activePreviewStep);

  return (
    <DashboardLayout>
      <div className="flex gap-6">
        {/* Main Form */}
        <div className="flex-1 max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Tour</h1>
            <p className="text-gray-600 mt-2">Build an interactive product tour</p>
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
                  <p className="text-sm text-yellow-600">
                    Install the TourLayer extension to use the visual element picker. 
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Picker Status */}
          {pickerStatus === 'waiting' && (
            <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              <div>
                <p className="font-medium text-blue-800">Element Picker Active</p>
                <p className="text-sm text-blue-600">
                  Switch to your target website tab and click on any element. Press ESC to cancel.
                </p>
              </div>
            </div>
          )}

          {pickerStatus === 'success' && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
              <CheckCircle className="text-green-600" size={20} />
              <p className="font-medium text-green-800">Element selected successfully!</p>
            </div>
          )}

          {/* Tour Details */}
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tour Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="label">Tour Name</label>
                <input
                  type="text"
                  className="input"
                  value={tourName}
                  onChange={(e) => setTourName(e.target.value)}
                  placeholder="e.g., Welcome Tour"
                />
              </div>

              <div>
                <label className="label">URL Pattern</label>
                <input
                  type="text"
                  className="input"
                  value={urlPattern}
                  onChange={(e) => setUrlPattern(e.target.value)}
                  placeholder="e.g., https://app.example.com/dashboard*"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use * as wildcard. Example: https://app.example.com/* matches all pages
                </p>
              </div>
            </div>
          </div>

          {/* Card Styling (Collapsible) */}
          <div className="card p-6 mb-6">
            <button
              onClick={() => setShowStyling(!showStyling)}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="text-xl font-semibold text-gray-900">Card Styling</h2>
              <span className={`transform transition-transform ${showStyling ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {showStyling && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-gray-500">Customize how tour cards appear to users</p>
                
                {/* Card Appearance */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label text-xs">Background Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={styling.cardBgColor}
                        onChange={(e) => setStyling({...styling, cardBgColor: e.target.value})}
                        className="w-10 h-9 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        className="input text-sm flex-1"
                        value={styling.cardBgColor}
                        onChange={(e) => setStyling({...styling, cardBgColor: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label text-xs">Text Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={styling.cardTextColor}
                        onChange={(e) => setStyling({...styling, cardTextColor: e.target.value})}
                        className="w-10 h-9 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        className="input text-sm flex-1"
                        value={styling.cardTextColor}
                        onChange={(e) => setStyling({...styling, cardTextColor: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label text-xs">Shadow</label>
                    <select
                      className="input text-sm"
                      value={styling.cardShadow}
                      onChange={(e) => setStyling({...styling, cardShadow: e.target.value})}
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
                    <label className="label text-xs">Corner Radius (px)</label>
                    <input
                      type="number"
                      className="input text-sm"
                      value={styling.cardBorderRadius}
                      onChange={(e) => setStyling({...styling, cardBorderRadius: parseInt(e.target.value) || 12})}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Padding (px)</label>
                    <input
                      type="number"
                      className="input text-sm"
                      value={styling.cardPadding}
                      onChange={(e) => setStyling({...styling, cardPadding: parseInt(e.target.value) || 20})}
                    />
                  </div>
                </div>

                {/* Button Styling */}
                <div className="pt-3 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Button Styling</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="label text-xs">Button Background</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={styling.buttonColor}
                          onChange={(e) => setStyling({...styling, buttonColor: e.target.value})}
                          className="w-10 h-9 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          className="input text-sm flex-1"
                          value={styling.buttonColor}
                          onChange={(e) => setStyling({...styling, buttonColor: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label text-xs">Button Text Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={styling.buttonTextColor}
                          onChange={(e) => setStyling({...styling, buttonTextColor: e.target.value})}
                          className="w-10 h-9 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          className="input text-sm flex-1"
                          value={styling.buttonTextColor}
                          onChange={(e) => setStyling({...styling, buttonTextColor: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label text-xs">Button Radius (px)</label>
                      <input
                        type="number"
                        className="input text-sm"
                        value={styling.buttonBorderRadius}
                        onChange={(e) => setStyling({...styling, buttonBorderRadius: parseInt(e.target.value) || 8})}
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Preview</p>
                  <div 
                    className="p-4 rounded-lg inline-block"
                    style={{
                      backgroundColor: styling.cardBgColor,
                      color: styling.cardTextColor,
                      borderRadius: styling.cardBorderRadius,
                      padding: styling.cardPadding,
                      boxShadow: getShadowValue(styling.cardShadow),
                    }}
                  >
                    <h4 className="font-semibold mb-1">Sample Title</h4>
                    <p className="text-sm opacity-80 mb-3">This is how your tour card will look.</p>
                    <button
                      style={{
                        backgroundColor: styling.buttonColor,
                        color: styling.buttonTextColor,
                        borderRadius: styling.buttonBorderRadius,
                        padding: '8px 16px',
                        border: 'none',
                        fontWeight: 500,
                        fontSize: '14px',
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Display Frequency */}
          <div className="card p-6 mb-6">
            <button
              onClick={() => setShowFrequency(!showFrequency)}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="text-xl font-semibold text-gray-900">Display Frequency</h2>
              <span className={`transform transition-transform ${showFrequency ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            
            {showFrequency && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-gray-500">Control how often users see this tour</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFrequency({...frequency, type: 'once'})}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      frequency.type === 'once'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">Show Once</div>
                    <div className="text-xs text-gray-500 mt-1">User sees it only once, ever</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFrequency({...frequency, type: 'always'})}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      frequency.type === 'always'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">Show Always</div>
                    <div className="text-xs text-gray-500 mt-1">Show on every page visit</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFrequency({...frequency, type: 'count'})}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      frequency.type === 'count'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">Show X Times</div>
                    <div className="text-xs text-gray-500 mt-1">Limit total number of views</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFrequency({...frequency, type: 'days'})}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      frequency.type === 'days'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">Show Every X Days</div>
                    <div className="text-xs text-gray-500 mt-1">Repeat after a cooldown period</div>
                  </button>
                </div>

                {frequency.type === 'count' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="label">Maximum Times to Show</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="input w-24"
                        value={frequency.count}
                        onChange={(e) => setFrequency({...frequency, count: parseInt(e.target.value) || 1})}
                      />
                      <span className="text-sm text-gray-600">times per user</span>
                    </div>
                  </div>
                )}

                {frequency.type === 'days' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="label">Show Again After</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        className="input w-24"
                        value={frequency.days}
                        onChange={(e) => setFrequency({...frequency, days: parseInt(e.target.value) || 7})}
                      />
                      <span className="text-sm text-gray-600">days</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Tour Steps ({steps.length})
              </h2>
              <button
                onClick={addStep}
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                Add Step
              </button>
            </div>

            {steps.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No steps yet. Click "Add Step" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div 
                    key={step.id} 
                    className={`border rounded-lg p-4 transition-all cursor-pointer ${
                      activePreviewStep === step.id 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                    onClick={() => setActivePreviewStep(step.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 text-gray-400 mt-2">
                        <GripVertical size={20} />
                        <span className="text-sm font-semibold">{index + 1}</span>
                      </div>

                      <div className="flex-1 space-y-3" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label text-xs">Element Selector (CSS)</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                className="input text-sm flex-1"
                                value={step.selector}
                                onChange={(e) => updateStep(step.id, 'selector', e.target.value)}
                                placeholder="#button-id or .class-name"
                              />
                              <button
                                onClick={() => startPicker(step.id)}
                                disabled={!extensionInstalled || pickerStatus === 'waiting'}
                                className={`px-3 py-2 rounded-lg flex items-center gap-1 text-sm font-medium transition-colors ${
                                  extensionInstalled 
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                                title={extensionInstalled ? 'Pick element from page' : 'Install extension to use picker'}
                              >
                                <Crosshair size={16} />
                                Pick
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="label text-xs">Placement</label>
                              <select
                                className="input text-sm"
                                value={step.placement}
                                onChange={(e) => updateStep(step.id, 'placement', e.target.value)}
                              >
                                <option value="top">Top</option>
                                <option value="bottom">Bottom</option>
                                <option value="left">Left</option>
                                <option value="right">Right</option>
                                <option value="auto">Auto</option>
                              </select>
                            </div>
                            <div>
                              <label className="label text-xs flex items-center gap-1">
                                <Layers size={12} />
                                Z-Index
                              </label>
                              <input
                                type="number"
                                className="input text-sm"
                                value={step.zIndex}
                                onChange={(e) => updateStep(step.id, 'zIndex', parseInt(e.target.value) || 2147483647)}
                                placeholder="2147483647"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="label text-xs">Step Title</label>
                          <input
                            type="text"
                            className="input text-sm"
                            value={step.title}
                            onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                            placeholder="Welcome to Dashboard"
                          />
                        </div>

                        <div>
                          <label className="label text-xs">Step Content</label>
                          <textarea
                            className="input text-sm min-h-[80px]"
                            value={step.content}
                            onChange={(e) => updateStep(step.id, 'content', e.target.value)}
                            placeholder="This is where you can..."
                          />
                        </div>

                        <div>
                          <label className="label text-xs">Image (Optional)</label>
                          <ImageUpload
                            value={step.imageUrl}
                            onChange={(url) => updateStep(step.id, 'imageUrl', url)}
                          />
                        </div>

                        <div className="w-1/2">
                          <label className="label text-xs">Button Text</label>
                          <input
                            type="text"
                            className="input text-sm"
                            value={step.buttonText}
                            onChange={(e) => updateStep(step.id, 'buttonText', e.target.value)}
                            placeholder="Next"
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={step.pulseEnabled}
                              onChange={(e) => updateStep(step.id, 'pulseEnabled', e.target.checked)}
                              id={`pulse-${step.id}`}
                              className="w-4 h-4 text-primary-600 rounded"
                            />
                            <label htmlFor={`pulse-${step.id}`} className="text-sm text-gray-700">
                              Enable pulse animation
                            </label>
                          </div>
                          
                          <button
                            onClick={() => setActivePreviewStep(activePreviewStep === step.id ? null : step.id)}
                            className={`flex items-center gap-1 text-sm px-2 py-1 rounded ${
                              activePreviewStep === step.id 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            <Eye size={14} />
                            Preview
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); deleteStep(step.id); }}
                        className="btn-ghost text-red-600 hover:text-red-700 p-2"
                        title="Delete step"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/tours')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={saveTour}
              disabled={loading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Tour'}
            </button>
          </div>
        </div>

        {/* Preview Panel - Sticky Sidebar */}
        <div className="flex-1 min-w-[400px]">
          <div className="sticky top-0 h-screen py-6 flex flex-col">
            {activeStep ? (
              <div 
                className="rounded-xl p-6 flex-1 flex items-center justify-center"
                style={{ backgroundColor: '#f3f4f6' }}
              >
                {/* Preview Layout - changes based on placement */}
                <div 
                  className="flex items-center justify-center gap-4"
                  style={{
                    flexDirection: activeStep.placement === 'top' ? 'column-reverse' : 
                                   activeStep.placement === 'bottom' ? 'column' : 
                                   activeStep.placement === 'left' ? 'row-reverse' : 'row'
                  }}
                >
                  {/* Mock Element - Square */}
                  <div className="relative flex-shrink-0">
                    <div 
                      className="bg-gray-300 rounded-lg flex items-center justify-center text-gray-500 font-medium text-sm"
                      style={{ width: 100, height: 100 }}
                    >
                      Element
                      {/* Pulse Indicator */}
                      {activeStep.pulseEnabled && (
                        <div 
                          className="absolute w-4 h-4 bg-blue-500 rounded-full"
                          style={{
                            animation: 'pulse 2s infinite',
                            ...(activeStep.placement === 'top' && { top: -8, left: '50%', marginLeft: -8 }),
                            ...(activeStep.placement === 'bottom' && { bottom: -8, left: '50%', marginLeft: -8 }),
                            ...(activeStep.placement === 'left' && { left: -8, top: '50%', marginTop: -8 }),
                            ...(activeStep.placement === 'right' && { right: -8, top: '50%', marginTop: -8 }),
                            ...(activeStep.placement === 'auto' && { right: -8, top: '50%', marginTop: -8 }),
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Tour Card Preview */}
                  <div 
                    className="flex-shrink-0"
                    style={{
                      width: 280,
                      backgroundColor: styling.cardBgColor,
                      color: styling.cardTextColor,
                      borderRadius: styling.cardBorderRadius,
                      padding: styling.cardPadding,
                      boxShadow: getShadowValue(styling.cardShadow),
                    }}
                  >
                    {activeStep.imageUrl && (
                      <img 
                        src={activeStep.imageUrl} 
                        alt="Preview" 
                        className="w-full h-20 object-cover mb-2"
                        style={{ borderRadius: Math.max(0, styling.cardBorderRadius - 4) }}
                      />
                    )}
                    <h3 className="font-semibold text-sm mb-1">
                      {activeStep.title || 'Step Title'}
                    </h3>
                    <p className="text-xs opacity-80 mb-2">
                      Step {steps.findIndex(s => s.id === activeStep.id) + 1} of {steps.length}
                    </p>
                    <p className="text-xs opacity-70 mb-3">
                      {activeStep.content || 'Step content...'}
                    </p>
                    <div className="flex justify-between items-center">
                      <button className="text-xs text-gray-400">Skip</button>
                      <button
                        style={{
                          backgroundColor: styling.buttonColor,
                          color: styling.buttonTextColor,
                          borderRadius: styling.buttonBorderRadius,
                          padding: '6px 12px',
                          border: 'none',
                          fontWeight: 500,
                          fontSize: '12px',
                        }}
                      >
                        {activeStep.buttonText || 'Next'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl p-6 flex-1 flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
                <div className="text-center text-gray-500">
                  <Eye size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click on a step to preview</p>
                  {steps.length === 0 && (
                    <p className="text-xs mt-2 text-gray-400">Add your first step to get started</p>
                  )}
                </div>
              </div>
            )}

            {/* Placement Selector */}
            {activeStep && (
              <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-500 mb-2">Tooltip Position:</p>
                <div className="flex gap-2">
                  {['top', 'right', 'bottom', 'left', 'auto'].map((placement) => (
                    <button
                      key={placement}
                      onClick={() => updateStep(activeStep.id, 'placement', placement)}
                      className={`flex-1 py-2 text-xs font-medium rounded capitalize transition-colors ${
                        activeStep.placement === placement
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {placement}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
