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

export default function NewTourPage() {
  const router = useRouter();
  const [tourName, setTourName] = useState('New Product Tour');
  const [urlPattern, setUrlPattern] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
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
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-6">
            {activeStep ? (
              <PreviewPanel
                step={{
                  title: activeStep.title,
                  content: activeStep.content,
                  buttonText: activeStep.buttonText,
                  placement: activeStep.placement,
                  imageUrl: activeStep.imageUrl,
                  selector: activeStep.selector,
                }}
                stepNumber={steps.findIndex(s => s.id === activeStep.id) + 1}
                totalSteps={steps.length}
                onPlacementChange={(placement) => updateStep(activeStep.id, 'placement', placement)}
              />
            ) : (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Eye size={18} />
                  <h3 className="font-semibold">Live Preview</h3>
                </div>
                <p className="text-slate-400 text-sm">
                  Click on a step to see a live preview of how it will appear to users.
                </p>
                {steps.length === 0 && (
                  <p className="text-slate-500 text-sm mt-4">
                    Add your first step to get started.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
