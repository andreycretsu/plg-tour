'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FullScreenModal from '@/components/FullScreenModal';
import ImageUpload from '@/components/ImageUpload';
import ColorPicker from '@/components/ColorPicker';
import CenterSlider from '@/components/CenterSlider';
import { Save, Crosshair, AlertCircle, CheckCircle, MousePointer, Hand, Languages, Settings, FileText, Star, Sparkles, Wand2, Circle, Type, Palette, Repeat, Target, Zap, Camera } from 'lucide-react';

// Shadcn UI components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldGroup, FieldDescription } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Stepper, StepContent, StepNavigation } from '@/components/ui/stepper';
import { VariableInput, VariableTextarea } from '@/components/ui/variable-input';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAlertDialog } from '@/components/useAlertDialog';
import { Spinner } from '@/components/ui/spinner';
import { DotPattern } from '@/components/ui/dot-pattern';

// Define wizard steps
const WIZARD_STEPS = [
  { id: 1, title: 'Targeting & Trigger', icon: Target },
  { id: 2, title: 'Content', icon: FileText },
  { id: 3, title: 'Beacon', icon: Circle },
  { id: 4, title: 'Card', icon: Palette },
  { id: 5, title: 'Frequency', icon: Repeat },
];

export default function NewTooltipPage() {
  const router = useRouter();
  const { showAlert, AlertDialogComponent } = useAlertDialog();
  const [loading, setLoading] = useState(false);
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [pickingElement, setPickingElement] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  const [previewLang, setPreviewLang] = useState('en');
  
  // Screenshot preview state
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotElementRect, setScreenshotElementRect] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [screenshotViewport, setScreenshotViewport] = useState<{width: number, height: number} | null>(null);
  const [capturingScreenshot, setCapturingScreenshot] = useState(false);
  
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
  const [urlPattern, setUrlPattern] = useState('*');
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
  const [cardBlurIntensity, setCardBlurIntensity] = useState(0); // 0-20px blur
  const [cardBgOpacity, setCardBgOpacity] = useState(100); // 0-100% opacity
  
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
      if (event.data.type === 'SCREENSHOT_CAPTURED') {
        setCapturingScreenshot(false);
        if (event.data.success) {
          setScreenshot(event.data.screenshot);
          setScreenshotElementRect(event.data.elementRect);
          setScreenshotViewport(event.data.viewport);
        } else {
          showAlert('Failed to capture screenshot: ' + event.data.error);
        }
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
    
    setPickingElement(true);
    window.postMessage({ 
      source: 'tourlayer-webapp', 
      type: 'START_PICKER',
      targetUrl
    }, '*');
  };

  const capturePreviewScreenshot = () => {
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
    
    setCapturingScreenshot(true);
    window.postMessage({ 
      source: 'tourlayer-webapp', 
      type: 'CAPTURE_SCREENSHOT',
      targetUrl,
      selector: selector || undefined
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
      showAlert('Please fill in name, URL pattern, selector, and title');
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
          cardBlurIntensity,
          cardBgOpacity,
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

      showAlert('Tooltip saved successfully!');
      router.push('/tooltips');
    } catch (error) {
      showAlert('Error saving tooltip: ' + error);
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

  return (
    <>
      <AlertDialogComponent />
      <FullScreenModal
        title="New Tooltip"
      headerExtra={
        <StatusBadge variant={extensionInstalled ? 'success' : 'fail'}>
          {extensionInstalled ? 'Extension ready' : 'Extension not connected'}
        </StatusBadge>
      }
      onClose={() => router.push('/tooltips')}
      actions={
        <Button
          onClick={saveTooltip}
          disabled={loading || !name || !urlPattern || !selector || !title}
        >
          {loading ? (
            <>
              <Spinner className="size-4" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Tooltip
            </>
          )}
        </Button>
      }
    >
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
      `}</style>

      <div className="flex h-full relative">
        {/* Left Sidebar - Stepper */}
        <div className="w-52 border-r border-gray-200 bg-gray-50/50 p-4 overflow-y-auto shrink-0">
          {/* Vertical Stepper */}
          <Stepper
            steps={WIZARD_STEPS}
            currentStep={activeStep}
            onStepClick={setActiveStep}
          />
        </div>

        {/* Middle Column - Form Content */}
        <div className="flex-1 max-w-xl overflow-y-auto">
          {/* Step 1: Targeting & Trigger */}
          {activeStep === 1 && (
            <StepContent>
              <div className="space-y-6">
                <div className="card p-5">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Targeting</h2>
                  
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Tooltip Name</FieldLabel>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Feature Discovery"
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Website URL</FieldLabel>
                      <Input
                        value={urlPattern}
                        onChange={(e) => setUrlPattern(e.target.value)}
                        placeholder="/dashboard* or /teams"
                      />
                      <FieldDescription>Examples: /teams, /settings/*, or * for all pages</FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel>Element Selector</FieldLabel>
                      <div className="flex gap-2">
                        <Input
                          className="flex-1"
                          value={selector}
                          onChange={(e) => setSelector(e.target.value)}
                          placeholder=".my-button"
                        />
                        <button
                          onClick={startPicker}
                          disabled={!extensionInstalled || pickingElement}
                          className={`px-3 py-2 rounded-md flex items-center gap-1 text-sm font-medium transition-colors ${
                            extensionInstalled 
                              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {pickingElement ? (
                            <>
                              <Spinner className="size-3.5" />
                              Picking...
                            </>
                          ) : (
                            <>
                              <Crosshair size={14} />
                              Pick
                            </>
                          )}
                        </button>
                      </div>
                    </Field>
                  </FieldGroup>
                </div>

                <div className="card p-5">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Trigger Settings</h2>
                  
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Trigger On</FieldLabel>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTriggerType('click')}
                          className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-2 text-sm transition-colors ${
                            triggerType === 'click' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                          }`}
                        >
                          <MousePointer size={14} />
                          Click
                        </button>
                        <button
                          type="button"
                          onClick={() => setTriggerType('hover')}
                          className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-2 text-sm transition-colors ${
                            triggerType === 'hover' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                          }`}
                        >
                          <Hand size={14} />
                          Hover
                        </button>
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel>Dismiss When</FieldLabel>
                      <Select value={dismissType} onValueChange={(v) => setDismissType(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="button">Click Button</SelectItem>
                          <SelectItem value="click_element">Click Target Element</SelectItem>
                          <SelectItem value="click_outside">Click Outside</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </FieldGroup>
                </div>
              </div>
            </StepContent>
          )}

          {/* Step 2: Content */}
          {activeStep === 2 && (
            <StepContent>
              <div className="card p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Tooltip Content</h2>
                
                <FieldGroup>
                  <Field>
                    <FieldLabel>Title</FieldLabel>
                    <VariableInput
                      value={title}
                      onValueChange={setTitle}
                      placeholder="Hey {{firstName}}, check this out!"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Body</FieldLabel>
                    <VariableTextarea
                      value={body}
                      onValueChange={setBody}
                      placeholder="Hi {{userName}}, here's a quick tip..."
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Button Text</FieldLabel>
                    <Input
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      placeholder="Got it"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Image (Optional)</FieldLabel>
                    <ImageUpload
                      value={imageUrl}
                      onChange={setImageUrl}
                    />
                  </Field>
                </FieldGroup>

                {/* Translations Info */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Languages size={16} className="text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Translations</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    Save first, then auto-translate to 10+ languages.
                  </p>
                </div>
              </div>
            </StepContent>
          )}

          {/* Step 3: Beacon */}
          {activeStep === 3 && (
            <StepContent>
              <div className="card p-5">
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

                <Field>
                  <FieldLabel>Beacon Color</FieldLabel>
                  <ColorPicker value={iconColor} onChange={setIconColor} />
                </Field>
              </div>
            </StepContent>
          )}

          {/* Step 4: Card */}
          {activeStep === 4 && (
            <StepContent>
              <div className="space-y-6">
                {/* Card Style */}
                <div className="card p-5">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Card Styling</h2>
                  
                  <FieldGroup>
                    <div className="grid grid-cols-3 gap-4">
                      <Field>
                        <FieldLabel>Width (px)</FieldLabel>
                        <Input
                          type="number"
                          value={cardWidth}
                          onChange={(e) => setCardWidth(parseInt(e.target.value) || 320)}
                        />
                      </Field>

                      <Field>
                        <FieldLabel>Padding (px)</FieldLabel>
                        <Input
                          type="number"
                          value={cardPadding}
                          onChange={(e) => setCardPadding(parseInt(e.target.value) || 20)}
                        />
                      </Field>

                      <Field>
                        <FieldLabel>Corner Radius (px)</FieldLabel>
                        <Input
                          type="number"
                          value={cardBorderRadius}
                          onChange={(e) => setCardBorderRadius(parseInt(e.target.value) || 12)}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel>Text Alignment</FieldLabel>
                        <div className="flex gap-1">
                          {['left', 'center', 'right'].map((align) => (
                            <button
                              key={align}
                              type="button"
                              onClick={() => setTextAlign(align as any)}
                              className={`flex-1 py-1.5 rounded-md capitalize text-sm font-medium transition-colors ${
                                textAlign === align 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                              }`}
                            >
                              {align}
                            </button>
                          ))}
                        </div>
                      </Field>

                      <Field>
                        <FieldLabel>Shadow</FieldLabel>
                        <Select value={cardShadow} onValueChange={setCardShadow}>
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
                        <FieldLabel>Background Color</FieldLabel>
                        <ColorPicker value={cardBgColor} onChange={setCardBgColor} />
                      </Field>

                      <Field>
                        <FieldLabel>Text Color</FieldLabel>
                        <ColorPicker value={cardTextColor} onChange={setCardTextColor} />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel>Background Blur</FieldLabel>
                        <div className="space-y-2">
                          <Slider
                            value={[cardBlurIntensity]}
                            onValueChange={(value) => setCardBlurIntensity(value[0])}
                            min={0}
                            max={20}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>None</span>
                            <span>{cardBlurIntensity}px</span>
                            <span>Strong</span>
                          </div>
                        </div>
                      </Field>

                      <Field>
                        <FieldLabel>Background Opacity</FieldLabel>
                        <div className="space-y-2">
                          <Slider
                            value={[cardBgOpacity]}
                            onValueChange={(value) => setCardBgOpacity(value[0])}
                            min={0}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Transparent</span>
                            <span>{cardBgOpacity}%</span>
                            <span>Opaque</span>
                          </div>
                        </div>
                      </Field>
                    </div>
                  </FieldGroup>
                </div>

                {/* Typography */}
                <div className="card p-5">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Typography</h2>
                  
                  <FieldGroup>
                    <div className="grid grid-cols-3 gap-4">
                      <Field>
                        <FieldLabel>Title Size: {titleSize}px</FieldLabel>
                        <Slider
                          value={[Number(titleSize)]}
                          onValueChange={([value]) => setTitleSize(value)}
                          min={12}
                          max={24}
                          step={1}
                        />
                      </Field>

                      <Field>
                        <FieldLabel>Body Size: {bodySize}px</FieldLabel>
                        <Slider
                          value={[Number(bodySize)]}
                          onValueChange={([value]) => setBodySize(value)}
                          min={10}
                          max={18}
                          step={1}
                        />
                      </Field>

                      <Field>
                        <FieldLabel>Line Height: {Number(bodyLineHeight).toFixed(2)}</FieldLabel>
                        <Slider
                          value={[Number(bodyLineHeight) * 100]}
                          onValueChange={([value]) => setBodyLineHeight(value / 100)}
                          min={100}
                          max={200}
                          step={10}
                        />
                      </Field>
                    </div>
                  </FieldGroup>
                </div>

                {/* Button Styling */}
                <div className="card p-5">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Button Styling</h2>
                  
                  <FieldGroup>
                    {/* Size */}
                    <Field>
                      <FieldLabel>Size</FieldLabel>
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
                            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                              buttonSize === size
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </Field>

                    {/* Position and Type */}
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel>Position</FieldLabel>
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
                              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                buttonPosition === pos
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </Field>

                      <Field>
                        <FieldLabel>Type</FieldLabel>
                        <div className="flex gap-1">
                          {[
                            { type: 'regular', label: 'Regular' },
                            { type: 'stretched', label: 'Stretched' },
                          ].map(({ type, label }) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setButtonType(type as any)}
                              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                buttonType === type
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </Field>
                    </div>

                    {/* Corner Radius */}
                    <Field>
                      <FieldLabel>Corner Radius (px)</FieldLabel>
                      <Input
                        type="number"
                        value={buttonBorderRadius}
                        onChange={(e) => setButtonBorderRadius(parseInt(e.target.value) || 8)}
                      />
                    </Field>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel>Button Background</FieldLabel>
                        <ColorPicker value={buttonColor} onChange={setButtonColor} />
                      </Field>

                      <Field>
                        <FieldLabel>Button Text Color</FieldLabel>
                        <ColorPicker value={buttonTextColor} onChange={setButtonTextColor} />
                      </Field>
                    </div>
                  </FieldGroup>
                </div>
              </div>
            </StepContent>
          )}

          {/* Step 5: Display Frequency */}
          {activeStep === 5 && (
            <StepContent>
              <div className="card p-5">
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

                {/* Advanced Settings inline */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">Advanced Options</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Z-Index</FieldLabel>
                      <Input
                        type="number"
                        value={zIndex}
                        onChange={(e) => setZIndex(parseInt(e.target.value) || 2147483647)}
                      />
                      <FieldDescription>Higher = above other elements</FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel>Delay (ms)</FieldLabel>
                      <Input
                        type="number"
                        value={delayMs}
                        onChange={(e) => setDelayMs(parseInt(e.target.value) || 0)}
                      />
                      <FieldDescription>1000ms = 1 second</FieldDescription>
                    </Field>
                  </div>
                </div>
              </div>
            </StepContent>
          )}

        </div>

        {/* Right Column - Preview */}
        <div className="flex-1 min-w-[400px] border-l border-gray-200">
          <div className="sticky top-0 h-screen py-6 flex flex-col">
            {/* Capture Preview Button */}
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-sm font-medium text-gray-700">Preview</span>
              <Button
                variant="outline"
                size="sm"
                onClick={capturePreviewScreenshot}
                disabled={capturingScreenshot || !urlPattern}
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

            {/* Preview Area */}
            {showPreview && (
              <div 
                className="rounded-xl flex-1 flex items-center justify-center h-full overflow-hidden relative bg-white"
                style={{ minHeight: 'calc(100vh - 100px)' }}
              >
                <DotPattern
                  className="absolute inset-0 [mask-image:radial-gradient(300px_circle_at_center,white,transparent)]"
                  cellSize={20}
                  dotRadius={1}
                  color="000000"
                  dotOpacity={0.15}
                  lineOpacity={0}
                  opacity={1}
                />
                {/* Screenshot Preview Mode */}
                {screenshot ? (
                  <div className="relative w-full h-full">
                    {/* Scrollable screenshot container */}
                    <div className="w-full h-full overflow-auto">
                      {/* Screenshot as background */}
                      <div className="relative" style={{ minWidth: screenshotViewport?.width || 'auto' }}>
                        <img 
                          src={screenshot} 
                          alt="Page screenshot" 
                          className="w-full h-auto block"
                        />
                    
                        {/* Element highlight + Tooltip overlay */}
                    {screenshotElementRect && (
                      <>
                        {/* Element highlight box */}
                        <div
                          className="absolute border-2 border-blue-500 bg-blue-500/10 rounded pointer-events-none"
                          style={{
                            left: screenshotElementRect.x,
                            top: screenshotElementRect.y,
                            width: screenshotElementRect.width,
                            height: screenshotElementRect.height,
                          }}
                        />
                        
                        {/* Beacon */}
                        {iconShape && (
                          <div
                            className="absolute pointer-events-none"
                            style={{
                              left: iconEdge === 'left' 
                                ? screenshotElementRect.x - iconSize - iconOffset
                                : iconEdge === 'right'
                                ? screenshotElementRect.x + screenshotElementRect.width + iconOffset
                                : screenshotElementRect.x + screenshotElementRect.width / 2 - iconSize / 2 + iconOffsetY,
                              top: iconEdge === 'top'
                                ? screenshotElementRect.y - iconSize - iconOffset
                                : iconEdge === 'bottom'
                                ? screenshotElementRect.y + screenshotElementRect.height + iconOffset
                                : screenshotElementRect.y + screenshotElementRect.height / 2 - iconSize / 2 + iconOffsetY,
                            }}
                          >
                            {renderBeaconIcon()}
                          </div>
                        )}
                        
                        {/* Tooltip Card */}
                        {(() => {
                          // Calculate beacon position first (matching the beacon positioning above)
                          // beaconLeft and beaconTop are the LEFT and TOP edges of the beacon
                          const beaconLeft = iconEdge === 'left' 
                            ? screenshotElementRect.x - iconSize - iconOffset
                            : iconEdge === 'right'
                            ? screenshotElementRect.x + screenshotElementRect.width + iconOffset
                            : screenshotElementRect.x + screenshotElementRect.width / 2 - iconSize / 2 + iconOffsetY;
                          
                          const beaconTop = iconEdge === 'top'
                            ? screenshotElementRect.y - iconSize - iconOffset
                            : iconEdge === 'bottom'
                            ? screenshotElementRect.y + screenshotElementRect.height + iconOffset
                            : screenshotElementRect.y + screenshotElementRect.height / 2 - iconSize / 2 + iconOffsetY;
                          
                          // Calculate beacon center
                          const beaconCenterX = beaconLeft + iconSize / 2;
                          const beaconCenterY = beaconTop + iconSize / 2;
                          
                          // Calculate card position relative to beacon
                          let cardLeft: number;
                          let cardTop: number;
                          
                          switch (iconEdge) {
                            case 'right':
                              // Card to the right of beacon, offset vertically
                              cardLeft = beaconLeft + iconSize + cardGap;
                              cardTop = beaconCenterY - 50 + cardOffsetY; // Center card vertically on beacon, then offset
                              break;
                            case 'left':
                              // Card to the left of beacon, offset vertically
                              cardLeft = beaconLeft - cardGap - cardWidth;
                              cardTop = beaconCenterY - 50 + cardOffsetY; // Center card vertically on beacon, then offset
                              break;
                            case 'bottom':
                              // Card below beacon, centered horizontally with horizontal offset
                              cardLeft = beaconCenterX - cardWidth / 2 + cardOffsetY;
                              cardTop = beaconTop + iconSize + cardGap;
                              break;
                            case 'top':
                              // Card above beacon, centered horizontally with horizontal offset
                              cardLeft = beaconCenterX - cardWidth / 2 + cardOffsetY;
                              cardTop = beaconTop - cardGap;
                              break;
                            default:
                              // Center position (shouldn't happen with valid iconEdge)
                              cardLeft = screenshotElementRect.x + screenshotElementRect.width / 2 - cardWidth / 2;
                              cardTop = screenshotElementRect.y + screenshotElementRect.height / 2;
                          }
                          
                          // Convert hex to rgba with opacity
                          const hexToRgba = (hex: string, opacity: number) => {
                            const r = parseInt(hex.slice(1, 3), 16);
                            const g = parseInt(hex.slice(3, 5), 16);
                            const b = parseInt(hex.slice(5, 7), 16);
                            return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
                          };
                          
                          return (
                            <div
                              className="absolute pointer-events-none"
                              style={{
                                left: `${cardLeft}px`,
                                top: iconEdge === 'top' ? `${cardTop}px` : `${cardTop}px`,
                                transform: iconEdge === 'top' ? `translateY(-100%)` : undefined,
                                width: cardWidth,
                                backgroundColor: hexToRgba(cardBgColor, cardBgOpacity),
                                backdropFilter: cardBlurIntensity > 0 ? `blur(${cardBlurIntensity}px)` : 'none',
                                WebkitBackdropFilter: cardBlurIntensity > 0 ? `blur(${cardBlurIntensity}px)` : 'none',
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
                                  className="w-full object-cover mb-3"
                                  style={{ borderRadius: Math.max(0, cardBorderRadius - 4), aspectRatio: '16 / 9' }}
                                />
                              )}
                              <h3 className="font-semibold mb-1" style={{ fontSize: `${titleSize}px` }}>
                                {title || 'Tooltip Title'}
                              </h3>
                              <p className="opacity-80 mb-3" style={{ fontSize: `${bodySize}px`, lineHeight: bodyLineHeight }}>
                                {body || 'Tooltip description goes here...'}
                              </p>
                              {buttonText && (
                                <div style={{ display: 'flex', justifyContent: buttonPosition === 'center' ? 'center' : buttonPosition === 'right' ? 'flex-end' : 'flex-start' }}>
                                  <button style={{
                                    backgroundColor: buttonColor,
                                    color: buttonTextColor,
                                    borderRadius: buttonBorderRadius,
                                    padding: getButtonSizeStyles(buttonSize).padding,
                                    width: buttonType === 'stretched' ? '100%' : 'auto',
                                    border: 'none',
                                    fontWeight: 500,
                                    fontSize: getButtonSizeStyles(buttonSize).fontSize,
                                  }}>
                                    {buttonText}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    )}
                      </div>
                    </div>
                    
                    {/* Fade indicators for horizontal scroll */}
                    <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-gray-100 to-transparent pointer-events-none" />
                    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-100 to-transparent pointer-events-none" />
                    
                    {/* Clear screenshot button */}
                    <button
                      onClick={() => { setScreenshot(null); setScreenshotElementRect(null); }}
                      className="absolute top-2 right-10 bg-black/50 text-white px-2 py-1 rounded text-xs hover:bg-black/70 z-10"
                    >
                      Clear Screenshot
                    </button>
                  </div>
                ) : (
                  /* Mock Preview Mode */
                  <div className="relative p-6">
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
                      
                      // Convert hex to rgba with opacity
                      const hexToRgba = (hex: string, opacity: number) => {
                        const r = parseInt(hex.slice(1, 3), 16);
                        const g = parseInt(hex.slice(3, 5), 16);
                        const b = parseInt(hex.slice(5, 7), 16);
                        return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
                      };
                      
                      let cardStyle: React.CSSProperties = {
                        position: 'absolute',
                        width: cardWidth,
                        backgroundColor: hexToRgba(cardBgColor, cardBgOpacity),
                        backdropFilter: cardBlurIntensity > 0 ? `blur(${cardBlurIntensity}px)` : 'none',
                        WebkitBackdropFilter: cardBlurIntensity > 0 ? `blur(${cardBlurIntensity}px)` : 'none',
                        color: cardTextColor,
                        borderRadius: cardBorderRadius,
                        padding: cardPadding,
                        boxShadow: getShadowValue(cardShadow),
                        textAlign: textAlign,
                      };

                      // Calculate beacon position to match getBeaconPreviewStyle()
                      const halfSize = iconSize / 2;
                      let beaconLeft: number;
                      let beaconTop: number;
                      
                      switch (iconEdge) {
                        case 'top':
                          // Beacon left/top edges
                          beaconLeft = halfElement + iconOffsetY - halfSize;
                          beaconTop = -halfSize - iconOffset;
                          // Beacon center
                          const beaconCenterXTop = beaconLeft + halfSize;
                          // Card below beacon, centered horizontally with horizontal offset
                          cardStyle.top = beaconTop + iconSize + cardGap;
                          cardStyle.left = beaconCenterXTop - cardWidth / 2 + cardOffsetY;
                          cardStyle.transform = 'none';
                          break;
                        case 'bottom':
                          // Beacon left/top edges
                          beaconLeft = halfElement + iconOffsetY - halfSize;
                          beaconTop = elementSize + halfSize + iconOffset;
                          // Beacon center
                          const beaconCenterXBottom = beaconLeft + halfSize;
                          // Card above beacon, centered horizontally with horizontal offset
                          cardStyle.bottom = (elementSize - beaconTop) + iconSize + cardGap;
                          cardStyle.left = beaconCenterXBottom - cardWidth / 2 + cardOffsetY;
                          cardStyle.transform = 'none';
                          break;
                        case 'left':
                          // Beacon left/top edges
                          beaconLeft = -halfSize - iconOffset;
                          beaconTop = halfElement + iconOffsetY - halfSize;
                          // Beacon center
                          const beaconCenterYLeft = beaconTop + halfSize;
                          // Card to the right of beacon, offset vertically
                          cardStyle.left = beaconLeft + iconSize + cardGap;
                          cardStyle.top = beaconCenterYLeft - 50 + cardOffsetY; // Center card vertically on beacon, then offset
                          cardStyle.transform = 'none';
                          break;
                        case 'right':
                        default:
                          // Beacon left/top edges
                          beaconLeft = elementSize + halfSize + iconOffset;
                          beaconTop = halfElement + iconOffsetY - halfSize;
                          // Beacon center
                          const beaconCenterYRight = beaconTop + halfSize;
                          // Card to the right of beacon, offset vertically
                          cardStyle.left = beaconLeft + iconSize + cardGap;
                          cardStyle.top = beaconCenterYRight - 50 + cardOffsetY; // Center card vertically on beacon, then offset
                          cardStyle.transform = 'none';
                          break;
                      }

                      return (
                        <div style={cardStyle}>
                          {imageUrl && (
                            <img 
                              src={imageUrl} 
                              alt="Preview" 
                              className="w-full object-cover mb-3"
                              style={{ borderRadius: Math.max(0, cardBorderRadius - 4), aspectRatio: '16 / 9' }}
                            />
                          )}
                          <h3 className="font-semibold mb-1" style={{ fontSize: `${titleSize}px` }}>
                            {title || 'Tooltip Title'}
                          </h3>
                          <p className="opacity-80 mb-3" style={{ fontSize: `${bodySize}px`, lineHeight: bodyLineHeight }}>
                            {body || 'Tooltip description goes here...'}
                          </p>
                          {buttonText && (
                            <div style={{ display: 'flex', justifyContent: buttonPosition === 'center' ? 'center' : buttonPosition === 'right' ? 'flex-end' : 'flex-start' }}>
                              <button style={{
                                backgroundColor: buttonColor,
                                color: buttonTextColor,
                                borderRadius: buttonBorderRadius,
                                padding: getButtonSizeStyles(buttonSize).padding,
                                width: buttonType === 'stretched' ? '100%' : 'auto',
                                border: 'none',
                                fontWeight: 500,
                                fontSize: getButtonSizeStyles(buttonSize).fontSize,
                              }}>
                                {buttonText}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Sticky Navigation Panel - Full Width */}
        {activeStep === 1 && (
          <StepNavigation
            onNext={() => setActiveStep(2)}
            isFirst={true}
            nextLabel="Next: Content"
          />
        )}
        {activeStep === 2 && (
          <StepNavigation
            onBack={() => setActiveStep(1)}
            onNext={() => setActiveStep(3)}
            nextLabel="Next: Beacon"
          />
        )}
        {activeStep === 3 && (
          <StepNavigation
            onBack={() => setActiveStep(2)}
            onNext={() => setActiveStep(4)}
            nextLabel="Next: Card"
          />
        )}
        {activeStep === 4 && (
          <StepNavigation
            onBack={() => setActiveStep(3)}
            onNext={() => setActiveStep(5)}
            nextLabel="Next: Frequency"
          />
        )}
        {activeStep === 5 && (
          <StepNavigation
            onBack={() => setActiveStep(4)}
            isLast={true}
          />
        )}
      </div>
    </FullScreenModal>
    <AlertDialogComponent />
  </>
  );
}
