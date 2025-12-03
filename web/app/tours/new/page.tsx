'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Trash2, GripVertical, Save, Crosshair, AlertCircle, CheckCircle } from 'lucide-react';

interface Step {
  id: string;
  selector: string;
  title: string;
  content: string;
  imageUrl: string;
  buttonText: string;
  placement: string;
  pulseEnabled: boolean;
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
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = useCallback((id: string, field: keyof Step, value: any) => {
    setSteps(currentSteps => currentSteps.map(step => 
      step.id === id ? { ...step, [field]: value } : step
    ));
  }, []);

  const deleteStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const startPicker = (stepId: string) => {
    if (!extensionInstalled) {
      alert('Please install the TourLayer Chrome extension first!');
      return;
    }
    
    setPickingForStep(stepId);
    setPickerStatus('waiting');
    
    // Tell extension to start picker
    window.postMessage({ 
      source: 'tourlayer-webapp', 
      type: 'START_PICKER',
      stepId 
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
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
                  <a href="/extension" className="underline ml-1">Download →</a>
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
                <div key={step.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 text-gray-400 mt-2">
                      <GripVertical size={20} />
                      <span className="text-sm font-semibold">{index + 1}</span>
                    </div>

                    <div className="flex-1 space-y-3">
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

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label text-xs">Image URL (Optional)</label>
                          <input
                            type="text"
                            className="input text-sm"
                            value={step.imageUrl}
                            onChange={(e) => updateStep(step.id, 'imageUrl', e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className="label text-xs">Button Text</label>
                          <input
                            type="text"
                            className="input text-sm"
                            value={step.buttonText}
                            onChange={(e) => updateStep(step.id, 'buttonText', e.target.value)}
                            placeholder="Next"
                          />
                        </div>
                      </div>

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
                    </div>

                    <button
                      onClick={() => deleteStep(step.id)}
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
    </DashboardLayout>
  );
}
