'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FullScreenModal from '@/components/FullScreenModal';
import ImageUpload from '@/components/ImageUpload';
import ColorPicker from '@/components/ColorPicker';
import { Save, FileText, Palette, Repeat, Target, Move } from 'lucide-react';

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

// Define wizard steps for banners
const BANNER_WIZARD_STEPS = [
  { id: 1, title: 'Targeting', icon: Target },
  { id: 2, title: 'Content', icon: FileText },
  { id: 3, title: 'Position & Size', icon: Move },
  { id: 4, title: 'Card', icon: Palette },
  { id: 5, title: 'Frequency', icon: Repeat },
];

export default function NewBannerPage() {
  const router = useRouter();
  const { showAlert, AlertDialogComponent } = useAlertDialog();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [showPreview, setShowPreview] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [urlPattern, setUrlPattern] = useState('*');
  
  // Content
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [buttonText, setButtonText] = useState('Got it');
  
  // Position & Size
  const [positionX, setPositionX] = useState<'left' | 'center' | 'right' | string>('center');
  const [positionY, setPositionY] = useState<'top' | 'center' | 'bottom' | string>('top');
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [width, setWidth] = useState(400);
  const [height, setHeight] = useState<string | number>('auto');
  
  // Card styling
  const [cardBgColor, setCardBgColor] = useState('#ffffff');
  const [cardTextColor, setCardTextColor] = useState('#1f2937');
  const [cardBorderRadius, setCardBorderRadius] = useState(12);
  const [cardPadding, setCardPadding] = useState(20);
  const [cardShadow, setCardShadow] = useState('medium');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [cardBlurIntensity, setCardBlurIntensity] = useState(0);
  const [cardBgOpacity, setCardBgOpacity] = useState(100);
  
  // Typography
  const [titleSize, setTitleSize] = useState(16);
  const [bodySize, setBodySize] = useState(14);
  const [bodyLineHeight, setBodyLineHeight] = useState(1.5);
  
  // Button styling
  const [buttonColor, setButtonColor] = useState('#3b82f6');
  const [buttonTextColor, setButtonTextColor] = useState('#ffffff');
  const [buttonBorderRadius, setButtonBorderRadius] = useState(8);
  const [buttonSize, setButtonSize] = useState<'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl'>('m');
  const [buttonPosition, setButtonPosition] = useState<'left' | 'center' | 'right'>('left');
  const [buttonType, setButtonType] = useState<'regular' | 'stretched'>('regular');
  
  // Frequency
  const [frequencyType, setFrequencyType] = useState<'once' | 'always' | 'count' | 'days'>('once');
  const [frequencyCount, setFrequencyCount] = useState(1);
  const [frequencyDays, setFrequencyDays] = useState(7);
  
  // Advanced
  const [zIndex, setZIndex] = useState(2147483647);
  const [delayMs, setDelayMs] = useState(0);

  const getShadowValue = (shadow: string) => {
    const shadowMap: Record<string, string> = {
      'none': 'none',
      'small': '0 2px 8px rgba(0,0,0,0.1)',
      'medium': '0 4px 20px rgba(0,0,0,0.15)',
      'large': '0 8px 30px rgba(0,0,0,0.2)',
      'extra': '0 12px 40px rgba(0,0,0,0.25)',
    };
    return shadowMap[shadow] || shadow || '0 4px 20px rgba(0,0,0,0.15)';
  };

  const getButtonSizeStyles = (size: string) => {
    const sizes: Record<string, { fontSize: string; padding: string }> = {
      xxs: { fontSize: '10px', padding: '4px 8px' },
      xs: { fontSize: '11px', padding: '5px 10px' },
      s: { fontSize: '12px', padding: '6px 12px' },
      m: { fontSize: '14px', padding: '8px 16px' },
      l: { fontSize: '16px', padding: '10px 20px' },
      xl: { fontSize: '18px', padding: '12px 24px' },
    };
    return sizes[size] || sizes.m;
  };

  const saveBanner = async () => {
    if (!name || !urlPattern || !title) {
      showAlert({ title: 'Validation Error', description: 'Please fill in all required fields (Name, URL Pattern, and Title)' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          urlPattern,
          title,
          body,
          imageUrl,
          buttonText,
          positionX: positionX,
          positionY: positionY,
          offsetX,
          offsetY,
          width,
          height: height === 'auto' ? 'auto' : Number(height),
          cardBgColor,
          cardTextColor,
          cardBorderRadius,
          cardPadding,
          cardShadow: getShadowValue(cardShadow),
          textAlign,
          cardBlurIntensity,
          cardBgOpacity,
          titleSize,
          bodySize,
          bodyLineHeight,
          buttonColor,
          buttonTextColor,
          buttonBorderRadius,
          buttonSize,
          buttonPosition,
          buttonType,
          zIndex,
          delayMs,
          frequencyType,
          frequencyCount,
          frequencyDays,
        }),
      });

      if (response.ok) {
        showAlert({ title: 'Success', description: 'Banner created successfully!' });
        router.push('/banners');
      } else {
        const error = await response.json();
        showAlert({ title: 'Error', description: error.error || 'Failed to create banner' });
      }
    } catch (error) {
      showAlert({ title: 'Error', description: 'Failed to create banner: ' + error });
    } finally {
      setLoading(false);
    }
  };

  // Calculate banner position for preview
  const getBannerPreviewStyle = (): React.CSSProperties => {
    const hexToRgba = (hex: string, opacity: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
    };

    let left: string | number = '50%';
    let top: string | number = '50%';
    let transform = 'translate(-50%, -50%)';

    // Handle X position
    if (positionX === 'left') {
      left = 0;
      transform = `translate(0, -50%)`;
    } else if (positionX === 'right') {
      left = '100%';
      transform = `translate(-100%, -50%)`;
    } else if (positionX === 'center') {
      left = '50%';
    } else if (!isNaN(Number(positionX))) {
      left = Number(positionX);
      transform = `translate(0, -50%)`;
    }

    // Handle Y position
    if (positionY === 'top') {
      top = 0;
      transform = positionX === 'center' ? 'translate(-50%, 0)' : (positionX === 'left' ? 'translate(0, 0)' : 'translate(-100%, 0)');
    } else if (positionY === 'bottom') {
      top = '100%';
      transform = positionX === 'center' ? 'translate(-50%, -100%)' : (positionX === 'left' ? 'translate(0, -100%)' : 'translate(-100%, -100%)');
    } else if (positionY === 'center') {
      top = '50%';
    } else if (!isNaN(Number(positionY))) {
      top = Number(positionY);
      transform = positionX === 'center' ? 'translate(-50%, 0)' : (positionX === 'left' ? 'translate(0, 0)' : 'translate(-100%, 0)');
    }

    // Apply offsets
    if (typeof left === 'number') {
      left = left + offsetX;
    }
    if (typeof top === 'number') {
      top = top + offsetY;
    }

    return {
      position: 'absolute',
      left: typeof left === 'string' ? left : `${left}px`,
      top: typeof top === 'string' ? top : `${top}px`,
      transform,
      width: `${width}px`,
      height: height === 'auto' ? 'auto' : `${height}px`,
      backgroundColor: hexToRgba(cardBgColor, cardBgOpacity),
      backdropFilter: cardBlurIntensity > 0 ? `blur(${cardBlurIntensity}px)` : 'none',
      WebkitBackdropFilter: cardBlurIntensity > 0 ? `blur(${cardBlurIntensity}px)` : 'none',
      color: cardTextColor,
      borderRadius: `${cardBorderRadius}px`,
      padding: `${cardPadding}px`,
      boxShadow: getShadowValue(cardShadow),
      textAlign: textAlign,
      zIndex: 10,
      isolation: 'isolate' as const,
    };
  };

  return (
    <>
      <AlertDialogComponent />
      <FullScreenModal
        title="Create New Banner"
        onClose={() => router.push('/banners')}
        actions={
          <Button onClick={saveBanner} disabled={loading || !name || !urlPattern || !title}>
            {loading ? <Spinner className="mr-2" /> : <Save size={16} className="mr-2" />}
            Save Banner
          </Button>
        }
      >
        <div className="flex h-full">
          {/* Left Column - Form */}
          <div className="flex-1 max-w-xl overflow-y-auto">
            <Stepper steps={BANNER_WIZARD_STEPS} activeStep={activeStep} onStepChange={setActiveStep}>
              {/* Step 1: Targeting */}
              {activeStep === 1 && (
                <StepContent>
                  <div className="p-5">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Targeting</h2>
                    
                    <FieldGroup>
                      <Field>
                        <FieldLabel>Banner Name</FieldLabel>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g., Welcome Banner"
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
                    </FieldGroup>
                  </div>
                </StepContent>
              )}

              {/* Step 2: Content */}
              {activeStep === 2 && (
                <StepContent>
                  <div className="p-5">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Banner Content</h2>
                    
                    <FieldGroup>
                      <Field>
                        <FieldLabel>Title</FieldLabel>
                        <VariableInput
                          value={title}
                          onValueChange={setTitle}
                          placeholder="Hey {{firstName}}, welcome!"
                        />
                      </Field>

                      <Field>
                        <FieldLabel>Body</FieldLabel>
                        <VariableTextarea
                          value={body}
                          onValueChange={setBody}
                          placeholder="Hi {{userName}}, here's what's new..."
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
                  </div>
                </StepContent>
              )}

              {/* Step 3: Position & Size */}
              {activeStep === 3 && (
                <StepContent>
                  <div className="p-5">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Position & Size</h2>
                    
                    <FieldGroup>
                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel>Horizontal Position</FieldLabel>
                          <Select value={positionX} onValueChange={setPositionX}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                              <SelectItem value="custom">Custom (px)</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>

                        <Field>
                          <FieldLabel>Vertical Position</FieldLabel>
                          <Select value={positionY} onValueChange={setPositionY}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top">Top</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="bottom">Bottom</SelectItem>
                              <SelectItem value="custom">Custom (px)</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>

                      {(positionX === 'custom' || positionY === 'custom') && (
                        <div className="grid grid-cols-2 gap-4">
                          {positionX === 'custom' && (
                            <Field>
                              <FieldLabel>X Position (px)</FieldLabel>
                              <Input
                                type="number"
                                value={positionX === 'custom' ? offsetX : positionX}
                                onChange={(e) => setPositionX(e.target.value)}
                                placeholder="0"
                              />
                            </Field>
                          )}
                          {positionY === 'custom' && (
                            <Field>
                              <FieldLabel>Y Position (px)</FieldLabel>
                              <Input
                                type="number"
                                value={positionY === 'custom' ? offsetY : positionY}
                                onChange={(e) => setPositionY(e.target.value)}
                                placeholder="0"
                              />
                            </Field>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel>Offset X (px)</FieldLabel>
                          <Input
                            type="number"
                            value={offsetX}
                            onChange={(e) => setOffsetX(parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </Field>

                        <Field>
                          <FieldLabel>Offset Y (px)</FieldLabel>
                          <Input
                            type="number"
                            value={offsetY}
                            onChange={(e) => setOffsetY(parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </Field>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Field>
                          <FieldLabel>Width (px)</FieldLabel>
                          <Input
                            type="number"
                            value={width}
                            onChange={(e) => setWidth(parseInt(e.target.value) || 400)}
                            placeholder="400"
                          />
                        </Field>

                        <Field>
                          <FieldLabel>Height</FieldLabel>
                          <Select 
                            value={height === 'auto' ? 'auto' : String(height)} 
                            onValueChange={(value) => setHeight(value === 'auto' ? 'auto' : parseInt(value) || 'auto')}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto</SelectItem>
                              <SelectItem value="200">200px</SelectItem>
                              <SelectItem value="300">300px</SelectItem>
                              <SelectItem value="400">400px</SelectItem>
                              <SelectItem value="500">500px</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>

                      {height === 'custom' && (
                        <Field>
                          <FieldLabel>Custom Height (px)</FieldLabel>
                          <Input
                            type="number"
                            value={typeof height === 'number' ? height : ''}
                            onChange={(e) => setHeight(parseInt(e.target.value) || 'auto')}
                            placeholder="300"
                          />
                        </Field>
                      )}
                    </FieldGroup>
                  </div>
                </StepContent>
              )}

              {/* Step 4: Card Styling */}
              {activeStep === 4 && (
                <StepContent>
                  <div className="space-y-0">
                    {/* Card Style */}
                    <div className="p-5">
                      <h2 className="text-base font-semibold text-gray-900 mb-4">Card Styling</h2>
                      
                      <FieldGroup>
                        <div className="grid grid-cols-3 gap-4">
                          <Field>
                            <FieldLabel>Width (px)</FieldLabel>
                            <Input
                              type="number"
                              value={width}
                              onChange={(e) => setWidth(parseInt(e.target.value) || 400)}
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

                        <Field>
                          <FieldLabel>Text Alignment</FieldLabel>
                          <div className="flex gap-2">
                            {(['left', 'center', 'right'] as const).map((align) => (
                              <button
                                key={align}
                                type="button"
                                onClick={() => setTextAlign(align)}
                                className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-2 text-sm transition-colors ${
                                  textAlign === align
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                }`}
                              >
                                {align === 'left' && <span>←</span>}
                                {align === 'center' && <span>•</span>}
                                {align === 'right' && <span>→</span>}
                                {align.charAt(0).toUpperCase() + align.slice(1)}
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
                    <div className="p-5 border-t border-gray-200">
                      <h2 className="text-base font-semibold text-gray-900 mb-4">Typography</h2>
                      
                      <FieldGroup>
                        <Field>
                          <FieldLabel>Title Size: {titleSize}px</FieldLabel>
                          <Slider
                            value={[titleSize]}
                            onValueChange={(value) => setTitleSize(value[0])}
                            min={12}
                            max={32}
                            step={1}
                            className="w-full"
                          />
                        </Field>

                        <Field>
                          <FieldLabel>Body Size: {bodySize}px</FieldLabel>
                          <Slider
                            value={[bodySize]}
                            onValueChange={(value) => setBodySize(value[0])}
                            min={10}
                            max={20}
                            step={1}
                            className="w-full"
                          />
                        </Field>

                        <Field>
                          <FieldLabel>Line Height: {bodyLineHeight}</FieldLabel>
                          <Slider
                            value={[Number(bodyLineHeight) * 100]}
                            onValueChange={([value]) => setBodyLineHeight(value / 100)}
                            min={100}
                            max={200}
                            step={5}
                            className="w-full"
                          />
                        </Field>
                      </FieldGroup>
                    </div>

                    {/* Button Styling */}
                    <div className="p-5 border-t border-gray-200">
                      <h2 className="text-base font-semibold text-gray-900 mb-4">Button Styling</h2>
                      
                      <FieldGroup>
                        <Field>
                          <FieldLabel>Size</FieldLabel>
                          <div className="grid grid-cols-6 gap-2">
                            {(['xxs', 'xs', 's', 'm', 'l', 'xl'] as const).map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setButtonSize(size)}
                                className={`py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                                  buttonSize === size
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                }`}
                              >
                                {size.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </Field>

                        <Field>
                          <FieldLabel>Position</FieldLabel>
                          <div className="flex gap-2">
                            {(['left', 'center', 'right'] as const).map((pos) => (
                              <button
                                key={pos}
                                type="button"
                                onClick={() => setButtonPosition(pos)}
                                className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-2 text-sm transition-colors ${
                                  buttonPosition === pos
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                }`}
                              >
                                {pos === 'left' && <span>←</span>}
                                {pos === 'center' && <span>•</span>}
                                {pos === 'right' && <span>→</span>}
                                {pos.charAt(0).toUpperCase() + pos.slice(1)}
                              </button>
                            ))}
                          </div>
                        </Field>

                        <Field>
                          <FieldLabel>Type</FieldLabel>
                          <div className="flex gap-2">
                            {(['regular', 'stretched'] as const).map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => setButtonType(type)}
                                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                                  buttonType === type
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                }`}
                              >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </button>
                            ))}
                          </div>
                        </Field>

                        <div className="grid grid-cols-3 gap-4">
                          <Field>
                            <FieldLabel>Corner Radius (px)</FieldLabel>
                            <Input
                              type="number"
                              value={buttonBorderRadius}
                              onChange={(e) => setButtonBorderRadius(parseInt(e.target.value) || 8)}
                            />
                          </Field>

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

              {/* Step 5: Frequency */}
              {activeStep === 5 && (
                <StepContent>
                  <div className="p-5">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Display Frequency</h2>
                    <p className="text-sm text-gray-500 mb-4">Control how often users see this banner</p>
                    
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
                          <div className="text-xs text-gray-500 mt-1">Display only the first time</div>
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
                          <div className="font-medium text-gray-900">Always Show</div>
                          <div className="text-xs text-gray-500 mt-1">Show every time</div>
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
                          <Field>
                            <FieldLabel>Maximum Times to Show</FieldLabel>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                className="w-24"
                                value={frequencyCount}
                                onChange={(e) => setFrequencyCount(parseInt(e.target.value) || 1)}
                              />
                              <span className="text-sm text-gray-600">times per user</span>
                            </div>
                          </Field>
                        </div>
                      )}

                      {frequencyType === 'days' && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Field>
                            <FieldLabel>Show Again After</FieldLabel>
                            <div className="flex items-center gap-3">
                              <Input
                                type="number"
                                min="1"
                                max="365"
                                className="w-24"
                                value={frequencyDays}
                                onChange={(e) => setFrequencyDays(parseInt(e.target.value) || 7)}
                              />
                              <span className="text-sm text-gray-600">days</span>
                            </div>
                          </Field>
                        </div>
                      )}
                    </div>
                  </div>
                </StepContent>
              )}
            </Stepper>
          </div>

          {/* Right Column - Preview */}
          <div className="flex-1 min-w-[400px] border-l border-gray-200">
            <div className="sticky top-0 h-screen py-6 flex flex-col">
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-sm font-medium text-gray-700">Preview</span>
              </div>

              <div className="flex-1 relative overflow-hidden bg-white rounded-xl">
                <DotPattern
                  className="absolute inset-0 [mask-image:radial-gradient(300px_circle_at_center,white,transparent)]"
                  cellSize={20}
                  dotRadius={1}
                  color="000000"
                  dotOpacity={0.15}
                  lineOpacity={0}
                  opacity={1}
                />
                
                {/* Banner Preview */}
                <div style={getBannerPreviewStyle()}>
                  {imageUrl && (
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="w-full object-cover mb-3"
                      style={{ borderRadius: Math.max(0, cardBorderRadius - 4), aspectRatio: '16 / 9' }}
                    />
                  )}
                  <h3 className="font-semibold mb-1" style={{ fontSize: `${titleSize}px` }}>
                    {title || 'Banner Title'}
                  </h3>
                  <p className="opacity-80 mb-3" style={{ fontSize: `${bodySize}px`, lineHeight: bodyLineHeight }}>
                    {body || 'Banner description goes here...'}
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
              </div>
            </div>
          </div>
        </div>
      </FullScreenModal>
    </>
  );
}

