'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FullScreenModal from '@/components/FullScreenModal';
import ImageUpload from '@/components/ImageUpload';
import ColorPicker from '@/components/ColorPicker';
import { Plus, Trash2, GripVertical, Save, Crosshair, Languages, Settings, FileText, Type, Palette, Repeat, Layers, Eye, Camera } from 'lucide-react';

// Shadcn UI components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldGroup, FieldDescription } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Stepper, StepContent } from '@/components/ui/stepper';
import { VariableInput, VariableTextarea } from '@/components/ui/variable-input';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAlertDialog } from '@/components/useAlertDialog';
import { Spinner } from '@/components/ui/spinner';

// Define wizard steps for tours
const TOUR_WIZARD_STEPS = [
  { id: 1, title: 'Tour Details', icon: FileText },
  { id: 2, title: 'Steps', icon: Layers },
  { id: 3, title: 'Card Style', icon: Palette },
  { id: 4, title: 'Typography', icon: Type },
  { id: 5, title: 'Button', icon: Settings },
  { id: 6, title: 'Frequency', icon: Repeat },
];

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
  const { showAlert, AlertDialogComponent } = useAlertDialog();
  const [activeStep, setActiveStep] = useState(1);
  const [tourName, setTourName] = useState('New Product Tour');
  const [urlPattern, setUrlPattern] = useState('*');
  const [steps, setSteps] = useState<Step[]>([]);
  const [styling, setStyling] = useState<TourStyling>(defaultStyling);
  const [frequency, setFrequency] = useState<TourFrequency>(defaultFrequency);
  const [loading, setLoading] = useState(false);
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [pickingForStep, setPickingForStep] = useState<string | null>(null);
  const [pickerStatus, setPickerStatus] = useState<'idle' | 'waiting' | 'success'>('idle');
  const [activePreviewStep, setActivePreviewStep] = useState<string | null>(null);
  
  // Screenshot preview state
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotElementRect, setScreenshotElementRect] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [screenshotViewport, setScreenshotViewport] = useState<{width: number, height: number} | null>(null);
  const [capturingScreenshot, setCapturingScreenshot] = useState(false);

  // Check if extension is installed
  useEffect(() => {
    const checkExtension = () => {
      window.postMessage({ source: 'tourlayer-webapp', type: 'PING' }, '*');
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (!event.data || event.data.source !== 'tourlayer-extension') return;

      switch (event.data.type) {
        case 'PONG':
        case 'EXTENSION_READY':
          setExtensionInstalled(true);
          break;
        case 'ELEMENT_PICKED':
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
        case 'SCREENSHOT_CAPTURED':
          setCapturingScreenshot(false);
          if (event.data.success) {
            setScreenshot(event.data.screenshot);
            setScreenshotElementRect(event.data.elementRect);
            setScreenshotViewport(event.data.viewport);
          } else {
            showAlert('Failed to capture screenshot: ' + event.data.error);
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
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
      showAlert('Please install the Walko Chrome extension first!');
      return;
    }

    let targetUrl = urlPattern.replace(/\*+/g, '').trim();
    if (!targetUrl) {
      showAlert('Please enter a URL pattern first!');
      return;
    }
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    
    setPickingForStep(stepId);
    setPickerStatus('waiting');
    window.postMessage({ 
      source: 'tourlayer-webapp', 
      type: 'START_PICKER',
      stepId,
      targetUrl
    }, '*');
  };

  const capturePreviewScreenshot = () => {
    if (!extensionInstalled) {
      showAlert('Please install the Walko Chrome extension first!');
      return;
    }

    const activeStep = steps.find(s => s.id === activePreviewStep);
    if (!activeStep || !activeStep.selector) {
      showAlert('Please select a step with a selector first!');
      return;
    }

    let targetUrl = urlPattern.replace(/\*+/g, '').trim();
    if (!targetUrl) {
      showAlert('Please enter a URL pattern first!');
      return;
    }
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    
    setCapturingScreenshot(true);
    window.postMessage({ 
      source: 'tourlayer-webapp', 
      type: 'CAPTURE_SCREENSHOT',
      targetUrl,
      selector: activeStep.selector
    }, '*');
  };

  const saveTour = async () => {
    if (!tourName || !urlPattern) {
      showAlert('Please fill in tour name and URL pattern');
      return;
    }

    if (steps.length === 0) {
      showAlert('Please add at least one step');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tourName,
          urlPattern: urlPattern,
          cardBgColor: styling.cardBgColor,
          cardTextColor: styling.cardTextColor,
          cardBorderRadius: styling.cardBorderRadius,
          cardPadding: styling.cardPadding,
          cardShadow: getShadowValue(styling.cardShadow),
          buttonColor: styling.buttonColor,
          buttonTextColor: styling.buttonTextColor,
          buttonBorderRadius: styling.buttonBorderRadius,
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

      showAlert('Tour saved successfully!');
      router.push('/tours');
    } catch (error) {
      showAlert('Error saving tour: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const activeStepData = steps.find(s => s.id === activePreviewStep);

  return (
    <>
      <AlertDialogComponent />
      <FullScreenModal
      title="Create New Tour"
      headerExtra={
        <StatusBadge variant={extensionInstalled ? 'success' : 'fail'}>
          {extensionInstalled ? 'Extension ready' : 'Extension not connected'}
        </StatusBadge>
      }
      onClose={() => router.push('/tours')}
      actions={
        <Button
          onClick={saveTour}
          disabled={loading || steps.length === 0 || !tourName || !urlPattern}
        >
          <Save size={18} />
          {loading ? 'Saving...' : 'Save Tour'}
        </Button>
      }
    >
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
      `}</style>

      <div className="flex h-full">
        {/* Left Sidebar - Stepper */}
        <div className="w-52 border-r border-gray-200 bg-gray-50/50 p-4 overflow-y-auto shrink-0">
          <Stepper
            steps={TOUR_WIZARD_STEPS}
            currentStep={activeStep}
            onStepClick={setActiveStep}
          />
        </div>

        {/* Middle Column - Form Content */}
        <div className="flex-1 max-w-xl overflow-y-auto p-6">
          {/* Step 1: Tour Details */}
          {activeStep === 1 && (
            <StepContent
              currentStep={activeStep}
              onNext={() => setActiveStep(2)}
              isFirst={true}
              nextLabel="Next: Steps"
            >
              <div className="card p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Tour Details</h2>
                
                <FieldGroup>
                  <Field>
                    <FieldLabel>Tour Name</FieldLabel>
                    <Input
                      value={tourName}
                      onChange={(e) => setTourName(e.target.value)}
                      placeholder="e.g., Welcome Tour"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>URL Pattern</FieldLabel>
                    <Input
                      value={urlPattern}
                      onChange={(e) => setUrlPattern(e.target.value)}
                      placeholder="/dashboard* or /teams"
                    />
                    <FieldDescription>Examples: /teams, /settings/*, or * for all pages</FieldDescription>
                  </Field>
                </FieldGroup>

                {/* Translations Info */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Languages size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Translations</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    Save first, then auto-translate to 10+ languages on the Edit page.
                  </p>
                </div>
              </div>
            </StepContent>
          )}

          {/* Step 2: Steps Management */}
          {activeStep === 2 && (
            <StepContent
              currentStep={activeStep}
              onBack={() => setActiveStep(1)}
              onNext={() => setActiveStep(3)}
              nextLabel="Next: Card Style"
            >
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-gray-900">
                    Tour Steps ({steps.length})
                  </h2>
                  <Button onClick={addStep} size="sm">
                    <Plus size={16} />
                    Add Step
                  </Button>
                </div>

                {pickerStatus === 'waiting' && (
                  <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2">
                    <Spinner className="size-4 text-blue-600" />
                    <p className="text-sm text-blue-800">Element Picker Active - Switch to target website and click an element</p>
                  </div>
                )}

                {pickerStatus === 'success' && (
                  <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
                    Element selected successfully!
                  </div>
                )}

                {steps.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Layers size={32} className="mx-auto mb-2 opacity-50" />
                    <p>No steps yet. Click "Add Step" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <div 
                        key={step.id} 
                        className={`border rounded-lg p-4 transition-all ${
                          activePreviewStep === step.id 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2 text-gray-400 mt-2">
                            <GripVertical size={20} />
                            <span className="text-sm font-semibold">{index + 1}</span>
                          </div>

                          <div className="flex-1 space-y-3" onClick={(e) => e.stopPropagation()}>
                            <div className="grid grid-cols-2 gap-3">
                              <Field>
                                <FieldLabel>Element Selector</FieldLabel>
                                <div className="flex gap-2">
                                  <Input
                                    className="flex-1"
                                    value={step.selector}
                                    onChange={(e) => updateStep(step.id, 'selector', e.target.value)}
                                    placeholder=".my-button"
                                  />
                                  <Button
                                    onClick={() => startPicker(step.id)}
                                    disabled={!extensionInstalled || pickerStatus === 'waiting'}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <Crosshair size={14} />
                                    Pick
                                  </Button>
                                </div>
                              </Field>
                              <div className="grid grid-cols-2 gap-2">
                                <Field>
                                  <FieldLabel>Placement</FieldLabel>
                                  <Select value={step.placement} onValueChange={(value) => updateStep(step.id, 'placement', value)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="top">Top</SelectItem>
                                      <SelectItem value="bottom">Bottom</SelectItem>
                                      <SelectItem value="left">Left</SelectItem>
                                      <SelectItem value="right">Right</SelectItem>
                                      <SelectItem value="auto">Auto</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </Field>
                                <Field>
                                  <FieldLabel>Z-Index</FieldLabel>
                                  <Input
                                    type="number"
                                    value={step.zIndex}
                                    onChange={(e) => updateStep(step.id, 'zIndex', parseInt(e.target.value) || 2147483647)}
                                  />
                                </Field>
                              </div>
                            </div>

                            <Field>
                              <FieldLabel>Step Title</FieldLabel>
                              <VariableInput
                                value={step.title}
                                onValueChange={(value) => updateStep(step.id, 'title', value)}
                                placeholder="Welcome to Dashboard"
                              />
                            </Field>

                            <Field>
                              <FieldLabel>Step Content</FieldLabel>
                              <VariableTextarea
                                value={step.content}
                                onValueChange={(value) => updateStep(step.id, 'content', value)}
                                placeholder="This is where you can..."
                              />
                            </Field>

                            <Field>
                              <FieldLabel>Image (Optional)</FieldLabel>
                              <ImageUpload
                                value={step.imageUrl}
                                onChange={(url) => updateStep(step.id, 'imageUrl', url)}
                              />
                            </Field>

                            <Field>
                              <FieldLabel>Button Text</FieldLabel>
                              <Input
                                value={step.buttonText}
                                onChange={(e) => updateStep(step.id, 'buttonText', e.target.value)}
                                placeholder="Next"
                              />
                            </Field>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={step.pulseEnabled}
                                  onChange={(e) => updateStep(step.id, 'pulseEnabled', e.target.checked)}
                                  id={`pulse-${step.id}`}
                                  className="w-4 h-4"
                                />
                                <label htmlFor={`pulse-${step.id}`} className="text-sm text-gray-700">
                                  Enable pulse animation
                                </label>
                              </div>
                              
                              <Button
                                onClick={() => setActivePreviewStep(activePreviewStep === step.id ? null : step.id)}
                                variant="outline"
                                size="sm"
                              >
                                <Eye size={14} />
                                Preview
                              </Button>
                            </div>
                          </div>

                          <Button
                            onClick={(e) => { e.stopPropagation(); deleteStep(step.id); }}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </StepContent>
          )}

          {/* Step 3: Card Style */}
          {activeStep === 3 && (
            <StepContent
              currentStep={activeStep}
              onBack={() => setActiveStep(2)}
              onNext={() => setActiveStep(4)}
              nextLabel="Next: Typography"
            >
              <div className="card p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Card Style</h2>
                
                <FieldGroup>
                  <div className="grid grid-cols-3 gap-4">
                    <Field>
                      <FieldLabel>Background Color</FieldLabel>
                      <ColorPicker 
                        value={styling.cardBgColor} 
                        onChange={(color) => setStyling({...styling, cardBgColor: color})} 
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Text Color</FieldLabel>
                      <ColorPicker 
                        value={styling.cardTextColor} 
                        onChange={(color) => setStyling({...styling, cardTextColor: color})} 
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Shadow</FieldLabel>
                      <Select value={styling.cardShadow} onValueChange={(value) => setStyling({...styling, cardShadow: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                          <SelectItem value="extra">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Corner Radius (px)</FieldLabel>
                      <Input
                        type="number"
                        value={styling.cardBorderRadius}
                        onChange={(e) => setStyling({...styling, cardBorderRadius: parseInt(e.target.value) || 12})}
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Padding (px)</FieldLabel>
                      <Input
                        type="number"
                        value={styling.cardPadding}
                        onChange={(e) => setStyling({...styling, cardPadding: parseInt(e.target.value) || 20})}
                      />
                    </Field>
                  </div>
                </FieldGroup>
              </div>
            </StepContent>
          )}

          {/* Step 4: Typography */}
          {activeStep === 4 && (
            <StepContent
              currentStep={activeStep}
              onBack={() => setActiveStep(3)}
              onNext={() => setActiveStep(5)}
              nextLabel="Next: Button"
            >
              <div className="card p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Typography</h2>
                <p className="text-sm text-gray-500 mb-4">Typography settings are applied at the step level. Configure individual step titles and content in Step 2.</p>
              </div>
            </StepContent>
          )}

          {/* Step 5: Button */}
          {activeStep === 5 && (
            <StepContent
              currentStep={activeStep}
              onBack={() => setActiveStep(4)}
              onNext={() => setActiveStep(6)}
              nextLabel="Next: Frequency"
            >
              <div className="card p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Button Style</h2>
                
                <FieldGroup>
                  <div className="grid grid-cols-3 gap-4">
                    <Field>
                      <FieldLabel>Button Color</FieldLabel>
                      <ColorPicker 
                        value={styling.buttonColor} 
                        onChange={(color) => setStyling({...styling, buttonColor: color})} 
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Text Color</FieldLabel>
                      <ColorPicker 
                        value={styling.buttonTextColor} 
                        onChange={(color) => setStyling({...styling, buttonTextColor: color})} 
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Border Radius (px)</FieldLabel>
                      <Input
                        type="number"
                        value={styling.buttonBorderRadius}
                        onChange={(e) => setStyling({...styling, buttonBorderRadius: parseInt(e.target.value) || 8})}
                      />
                    </Field>
                  </div>
                </FieldGroup>
              </div>
            </StepContent>
          )}

          {/* Step 6: Frequency */}
          {activeStep === 6 && (
            <StepContent
              currentStep={activeStep}
              onBack={() => setActiveStep(5)}
              isLast={true}
            >
              <div className="card p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Display Frequency</h2>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
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
                    <Field>
                      <FieldLabel>Maximum Times to Show</FieldLabel>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          className="w-24"
                          value={frequency.count}
                          onChange={(e) => setFrequency({...frequency, count: parseInt(e.target.value) || 1})}
                        />
                        <span className="text-sm text-gray-600">times per user</span>
                      </div>
                    </Field>
                  </div>
                )}

                {frequency.type === 'days' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Field>
                      <FieldLabel>Show Again After</FieldLabel>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          min="1"
                          max="365"
                          className="w-24"
                          value={frequency.days}
                          onChange={(e) => setFrequency({...frequency, days: parseInt(e.target.value) || 7})}
                        />
                        <span className="text-sm text-gray-600">days</span>
                      </div>
                    </Field>
                  </div>
                )}
              </div>
            </StepContent>
          )}
        </div>

        {/* Right Column - Preview */}
        <div className="flex-1 min-w-[400px]">
          <div className="sticky top-0 h-screen py-6 flex flex-col">
            {/* Capture Preview Button */}
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-sm font-medium text-gray-700">Preview</span>
              <Button
                variant="outline"
                size="sm"
                onClick={capturePreviewScreenshot}
                disabled={capturingScreenshot || !urlPattern || !activeStepData?.selector}
              >
                {capturingScreenshot ? (
                  <>
                    <Spinner className="size-3.5" />
                    Capturing...
                  </>
                ) : (
                  <>
                    <Camera size={14} />
                    Capture Live Preview
                  </>
                )}
              </Button>
            </div>

            {/* Step Indicators */}
            {steps.length > 0 && (
              <div className="flex items-center justify-center gap-2 mb-3 px-2">
                {steps.map((step, index) => {
                  const isActive = activePreviewStep === step.id;
                  return (
                    <button
                      key={step.id}
                      onClick={() => setActivePreviewStep(step.id)}
                      className={`transition-all ${
                        isActive 
                          ? 'w-2.5 h-2.5 bg-gray-900' 
                          : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                      } rounded-full`}
                      aria-label={`Go to step ${index + 1}`}
                    />
                  );
                })}
              </div>
            )}

            {/* Preview Area */}
            <div 
              className="rounded-xl flex-1 flex items-center justify-center h-full overflow-hidden relative"
              style={{ backgroundColor: '#f3f4f6', minHeight: 'calc(100vh - 100px)' }}
            >
              {screenshot && activeStepData && screenshotElementRect ? (
                /* Screenshot Preview Mode */
                <div className="relative w-full h-full">
                  <div className="w-full h-full overflow-auto">
                    <div className="relative" style={{ minWidth: screenshotViewport?.width || 'auto' }}>
                      <img 
                        src={screenshot} 
                        alt="Page screenshot" 
                        className="w-full h-auto block"
                      />
                    
                      {/* Element highlight */}
                      <div
                        className="absolute border-2 border-blue-500 bg-blue-500/10 rounded pointer-events-none"
                        style={{
                          left: screenshotElementRect.x,
                          top: screenshotElementRect.y,
                          width: screenshotElementRect.width,
                          height: screenshotElementRect.height,
                        }}
                      />
                      
                      {/* Pulse indicator */}
                      {activeStepData.pulseEnabled && (
                        <div
                          className="absolute w-4 h-4 bg-blue-500 rounded-full pointer-events-none"
                          style={{
                            animation: 'pulse 2s infinite',
                            left: screenshotElementRect.x + screenshotElementRect.width / 2 - 8,
                            top: screenshotElementRect.y + screenshotElementRect.height / 2 - 8,
                          }}
                        />
                      )}

                      {/* Tour Card */}
                      <div 
                        className="absolute pointer-events-none"
                        style={{
                          width: 280,
                          backgroundColor: styling.cardBgColor,
                          color: styling.cardTextColor,
                          borderRadius: styling.cardBorderRadius,
                          padding: styling.cardPadding,
                          boxShadow: getShadowValue(styling.cardShadow),
                          left: screenshotElementRect.x + screenshotElementRect.width / 2 - 140,
                          top: screenshotElementRect.y + screenshotElementRect.height + 20,
                        }}
                      >
                        {activeStepData.imageUrl && (
                          <img 
                            src={activeStepData.imageUrl} 
                            alt="Preview" 
                            className="w-full object-cover mb-2"
                            style={{ 
                              borderRadius: Math.max(0, styling.cardBorderRadius - 4),
                              aspectRatio: '16 / 9'
                            }}
                          />
                        )}
                        <h3 className="font-semibold text-sm mb-1">
                          {activeStepData.title || 'Step Title'}
                        </h3>
                        <p className="text-xs opacity-80 mb-2">
                          Step {steps.findIndex(s => s.id === activeStepData.id) + 1} of {steps.length}
                        </p>
                        <p className="text-xs opacity-70 mb-3">
                          {activeStepData.content || 'Step content...'}
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
                            {activeStepData.buttonText || 'Next'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Clear screenshot button */}
                  <button
                    onClick={() => { setScreenshot(null); setScreenshotElementRect(null); }}
                    className="absolute top-2 right-10 bg-black/50 text-white px-2 py-1 rounded text-xs hover:bg-black/70 z-10"
                  >
                    Clear Screenshot
                  </button>
                </div>
              ) : activeStepData ? (
                /* Mock Preview Mode */
                <div className="relative p-6">
                  <div 
                    className="bg-gray-300 rounded-lg flex items-center justify-center text-gray-500 font-medium text-sm"
                    style={{ width: 100, height: 100 }}
                  >
                    Element
                    {activeStepData.pulseEnabled && (
                      <div 
                        className="absolute w-4 h-4 bg-blue-500 rounded-full"
                        style={{
                          animation: 'pulse 2s infinite',
                          ...(activeStepData.placement === 'top' && { top: -8, left: '50%', marginLeft: -8 }),
                          ...(activeStepData.placement === 'bottom' && { bottom: -8, left: '50%', marginLeft: -8 }),
                          ...(activeStepData.placement === 'left' && { left: -8, top: '50%', marginTop: -8 }),
                          ...(activeStepData.placement === 'right' && { right: -8, top: '50%', marginTop: -8 }),
                          ...(activeStepData.placement === 'auto' && { right: -8, top: '50%', marginTop: -8 }),
                        }}
                      />
                    )}
                  </div>

                  {/* Tour Card Preview */}
                  <div 
                    className="absolute"
                    style={{
                      width: 280,
                      backgroundColor: styling.cardBgColor,
                      color: styling.cardTextColor,
                      borderRadius: styling.cardBorderRadius,
                      padding: styling.cardPadding,
                      boxShadow: getShadowValue(styling.cardShadow),
                      ...(activeStepData.placement === 'top' && { bottom: 120, left: '50%', marginLeft: -140 }),
                      ...(activeStepData.placement === 'bottom' && { top: 120, left: '50%', marginLeft: -140 }),
                      ...(activeStepData.placement === 'left' && { right: 120, top: '50%', marginTop: -100 }),
                      ...(activeStepData.placement === 'right' && { left: 120, top: '50%', marginTop: -100 }),
                      ...(activeStepData.placement === 'auto' && { left: 120, top: '50%', marginTop: -100 }),
                    }}
                  >
                    {activeStepData.imageUrl && (
                      <img 
                        src={activeStepData.imageUrl} 
                        alt="Preview" 
                        className="w-full object-cover mb-2"
                        style={{ 
                          borderRadius: Math.max(0, styling.cardBorderRadius - 4),
                          aspectRatio: '16 / 9'
                        }}
                      />
                    )}
                    <h3 className="font-semibold text-sm mb-1">
                      {activeStepData.title || 'Step Title'}
                    </h3>
                    <p className="text-xs opacity-80 mb-2">
                      Step {steps.findIndex(s => s.id === activeStepData.id) + 1} of {steps.length}
                    </p>
                    <p className="text-xs opacity-70 mb-3">
                      {activeStepData.content || 'Step content...'}
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
                        {activeStepData.buttonText || 'Next'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Eye size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a step to preview</p>
                  {steps.length === 0 && (
                    <p className="text-xs mt-2 text-gray-400">Add your first step to get started</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FullScreenModal>
    </>
  );
}
