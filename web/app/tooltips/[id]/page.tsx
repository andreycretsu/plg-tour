'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ImageUpload from '@/components/ImageUpload';
import ColorPicker from '@/components/ColorPicker';
import CenterSlider from '@/components/CenterSlider';
import { Save, Crosshair, AlertCircle, CheckCircle, ArrowLeft, MousePointer, Hand, Trash2, Loader2, Languages, Globe, RefreshCw, Settings, FileText, Star, Sparkles, Wand2, Circle } from 'lucide-react';

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
  const [iconShape, setIconShape] = useState<'dot' | 'star' | 'sparkle' | 'wand'>('dot');
  const [isPulsing, setIsPulsing] = useState(true);
  // Card position settings (relative to beacon)
  const [cardGap, setCardGap] = useState(12);
  const [cardPosOffsetY, setCardPosOffsetY] = useState(0);
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
  
  // Typography
  const [titleSize, setTitleSize] = useState(16);
  const [bodySize, setBodySize] = useState(14);
  const [bodyLineHeight, setBodyLineHeight] = useState(1.5);
  
  // Button settings
  const [buttonText, setButtonText] = useState('Got it');
  const [buttonColor, setButtonColor] = useState('#3b82f6');
  const [buttonTextColor, setButtonTextColor] = useState('#ffffff');
  const [buttonBorderRadius, setButtonBorderRadius] = useState(8);
  const [buttonSize, setButtonSize] = useState<'s' | 'm' | 'l'>('m');
  
  // Display Frequency
  const [frequencyType, setFrequencyType] = useState<'once' | 'always' | 'count' | 'days'>('once');
  const [frequencyCount, setFrequencyCount] = useState(1);
  const [frequencyDays, setFrequencyDays] = useState(7);
  
  // Advanced
  const [zIndex, setZIndex] = useState(2147483647);
  const [delayMs, setDelayMs] = useState(0);

  // Tabs and Translations
  const [activeTab, setActiveTab] = useState<'content' | 'customisation'>('content');
  const [previewLang, setPreviewLang] = useState('en');
  const [translations, setTranslations] = useState<Record<string, { title: string; body: string; buttonText: string }>>({});
  const [translating, setTranslating] = useState(false);
  const [editingLang, setEditingLang] = useState<string | null>(null);
  
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

  // Load tooltip data
  useEffect(() => {
    const loadTooltip = async () => {
      try {
        const response = await fetch(`/api/tooltips/${tooltipId}`);
        
        if (!response.ok) throw new Error('Failed to load tooltip');
        
        const data = await response.json();
        const t = data.tooltip;
        
        setName(t.name || '');
        setUrlPattern(t.url_pattern || '');
        setSelector(t.selector || '');
        setTriggerType(t.trigger_type || 'click');
        setDismissType(t.dismiss_type || 'button');
        // Parse iconType into shape and pulse state
        const savedIconType = t.icon_type || 'pulse_dot';
        setIsPulsing(savedIconType.startsWith('pulse_'));
        const shape = savedIconType.replace('pulse_', '').replace('static_', '');
        setIconShape((shape === 'dot' || shape === 'star' || shape === 'sparkle' || shape === 'wand') ? shape : 'dot');
        setIconEdge(t.icon_edge || 'right');
        setIconOffset(t.icon_offset || 0);
        setIconOffsetY(t.icon_offset_y || 0);
        // Card position settings
        setCardGap(t.card_gap || 12);
        setCardPosOffsetY(t.card_offset_y || 0);
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
        // Typography
        setTitleSize(t.title_size || 16);
        setBodySize(t.body_size || 14);
        setBodyLineHeight(t.body_line_height || 1.5);
        // Button
        setButtonText(t.button_text || 'Got it');
        setButtonColor(t.button_color || '#3b82f6');
        setButtonTextColor(t.button_text_color || '#ffffff');
        setButtonBorderRadius(t.button_border_radius || 8);
        setButtonSize(t.button_size || 'm');
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

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/api/translations?contentType=tooltip&contentId=${tooltipId}`);
        if (response.ok) {
          const data = await response.json();
          setTranslations(data.translations || {});
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
      }
    };
    
    if (tooltipId) {
      loadTranslations();
    }
  }, [tooltipId]);

  // Auto-translate to all languages
  const handleAutoTranslate = async () => {
    if (!title) {
      alert('Please add a title before translating');
      return;
    }

    setTranslating(true);
    try {
      const response = await fetch('/api/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'tooltip',
          contentId: parseInt(tooltipId),
          title,
          body,
          buttonText,
          sourceLanguage: 'en'
        }),
      });

      if (!response.ok) throw new Error('Translation failed');

      const data = await response.json();
      alert(`Translated to ${data.translatedTo?.length || 0} languages!`);
      
      // Reload translations
      const reloadResponse = await fetch(`/api/translations?contentType=tooltip&contentId=${tooltipId}`);
      if (reloadResponse.ok) {
        const reloadData = await reloadResponse.json();
        setTranslations(reloadData.translations || {});
      }
    } catch (error) {
      alert('Error translating: ' + error);
    } finally {
      setTranslating(false);
    }
  };

  // Save single translation
  const saveTranslation = async (langCode: string, data: { title: string; body: string; buttonText: string }) => {
    try {
      await fetch('/api/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'tooltip',
          contentId: parseInt(tooltipId),
          ...data,
          sourceLanguage: langCode // This will just save it directly
        }),
      });
      
      setTranslations(prev => ({ ...prev, [langCode]: data }));
      setEditingLang(null);
    } catch (error) {
      alert('Error saving translation: ' + error);
    }
  };

  // Get preview content based on selected language
  const getPreviewContent = () => {
    if (previewLang === 'en') {
      return { title, body, buttonText };
    }
    const trans = translations[previewLang];
    if (trans) {
      return {
        title: trans.title || title,
        body: trans.body || body,
        buttonText: trans.buttonText || buttonText
      };
    }
    return { title, body, buttonText };
  };

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

  const getButtonSizeStyles = (size: 's' | 'm' | 'l') => {
    const sizes = {
      's': { padding: '4px 10px', fontSize: '11px' },
      'm': { padding: '8px 16px', fontSize: '13px' },
      'l': { padding: '12px 24px', fontSize: '15px' },
    };
    return sizes[size] || sizes.m;
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
      const response = await fetch(`/api/tooltips/${tooltipId}`, {
        method: 'PUT',
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
          cardGap,
          cardOffsetY: cardPosOffsetY,
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
      const response = await fetch(`/api/tooltips/${tooltipId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      router.push('/tooltips');
    } catch (error) {
      alert('Error deleting tooltip: ' + error);
    } finally {
      setDeleting(false);
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

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('content')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all ${
                activeTab === 'content'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText size={18} />
              Content
            </button>
            <button
              onClick={() => setActiveTab('customisation')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all ${
                activeTab === 'customisation'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings size={18} />
              Customisation
            </button>
          </div>

          {/* CONTENT TAB */}
          {activeTab === 'content' && (
            <>
              {/* Card Content */}
              <div className="card p-5 mb-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Content</h2>
                
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

              {/* Translations */}
              <div className="card p-5 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Languages size={20} className="text-blue-600" />
                    <h2 className="text-base font-semibold text-gray-900">Translations</h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoTranslate}
                    disabled={translating || !title}
                    className="btn btn-secondary btn-sm flex items-center gap-2"
                  >
                    {translating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Translating...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} />
                        Auto-translate All
                      </>
                    )}
                  </button>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">
                  Auto-translate your content to multiple languages. Visitors will see content in their browser's language.
                </p>

                {/* Preview Language Selector */}
                <div className="mb-4">
                  <label className="label">Preview Language</label>
                  <select
                    value={previewLang}
                    onChange={(e) => setPreviewLang(e.target.value)}
                    className="input"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.native} ({lang.name}) {translations[lang.code] ? '✓' : lang.code === 'en' ? '(source)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Translation Status Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.filter(l => l.code !== 'en').map(lang => {
                    const hasTranslation = !!translations[lang.code];
                    const isEditing = editingLang === lang.code;
                    
                    return (
                      <div
                        key={lang.code}
                        className={`p-3 rounded-lg border ${
                          hasTranslation 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{lang.native}</span>
                          {hasTranslation && <CheckCircle size={14} className="text-green-500" />}
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewLang(lang.code)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Preview
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => setEditingLang(isEditing ? null : lang.code)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {isEditing ? 'Cancel' : 'Edit'}
                          </button>
                        </div>
                        
                        {/* Inline Edit Form */}
                        {isEditing && (
                          <div className="mt-3 space-y-2 border-t border-gray-200 pt-3">
                            <input
                              type="text"
                              placeholder="Translated title"
                              className="input text-sm"
                              defaultValue={translations[lang.code]?.title || ''}
                              id={`trans-title-${lang.code}`}
                            />
                            <textarea
                              placeholder="Translated body"
                              className="input text-sm min-h-[60px]"
                              defaultValue={translations[lang.code]?.body || ''}
                              id={`trans-body-${lang.code}`}
                            />
                            <input
                              type="text"
                              placeholder="Button text"
                              className="input text-sm"
                              defaultValue={translations[lang.code]?.buttonText || ''}
                              id={`trans-btn-${lang.code}`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const titleEl = document.getElementById(`trans-title-${lang.code}`) as HTMLInputElement;
                                const bodyEl = document.getElementById(`trans-body-${lang.code}`) as HTMLTextAreaElement;
                                const btnEl = document.getElementById(`trans-btn-${lang.code}`) as HTMLInputElement;
                                saveTranslation(lang.code, {
                                  title: titleEl?.value || '',
                                  body: bodyEl?.value || '',
                                  buttonText: btnEl?.value || ''
                                });
                              }}
                              className="btn btn-primary btn-sm w-full"
                            >
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* CUSTOMISATION TAB */}
          {activeTab === 'customisation' && (
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
                    value={cardPosOffsetY}
                    onChange={setCardPosOffsetY}
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
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Size</label>
                <div className="flex gap-2">
                  {[
                    { size: 's', label: 'S' },
                    { size: 'm', label: 'M' },
                    { size: 'l', label: 'L' },
                  ].map(({ size, label }) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setButtonSize(size as any)}
                      className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
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
            </>
          )}

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

        {/* Right Column - Preview */}
        <div className="flex-1 min-w-[400px]">
          <div className="sticky top-0 h-screen py-6 flex flex-col">
            {/* Preview Area */}
            {showPreview && (
              <div 
                className="rounded-xl p-6 flex-1 flex items-center justify-center h-full overflow-hidden"
                style={{ backgroundColor: '#f3f4f6', minHeight: 'calc(100vh - 48px)' }}
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
                    const preview = getPreviewContent();
                    const elementSize = 100;
                    const halfElement = elementSize / 2;
                    
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
                        cardStyle.bottom = elementSize + iconOffset + iconSize + cardGap;
                        cardStyle.left = halfElement - cardWidth / 2 + cardPosOffsetY;
                        break;
                      case 'bottom':
                        cardStyle.top = elementSize + iconOffset + iconSize + cardGap;
                        cardStyle.left = halfElement - cardWidth / 2 + cardPosOffsetY;
                        break;
                      case 'left':
                        cardStyle.right = elementSize + iconOffset + iconSize + cardGap;
                        cardStyle.top = halfElement - 100 + cardPosOffsetY;
                        break;
                      case 'right':
                      default:
                        cardStyle.left = elementSize + iconOffset + iconSize + cardGap;
                        cardStyle.top = halfElement - 100 + cardPosOffsetY;
                        break;
                    }

                    return (
                      <div style={cardStyle}>
                        {/* Language Badge */}
                        {previewLang !== 'en' && (
                          <div className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded inline-block mb-2">
                            {LANGUAGES.find(l => l.code === previewLang)?.native}
                          </div>
                        )}
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
                          {preview.title || 'Tooltip Title'}
                        </h3>
                        <p className="opacity-80 mb-3" style={{ fontSize: `${bodySize}px`, lineHeight: bodyLineHeight }}>
                          {preview.body || 'Tooltip description goes here...'}
                        </p>
                        {preview.buttonText && (
                          <button
                            style={{
                              backgroundColor: buttonColor,
                              color: buttonTextColor,
                              borderRadius: buttonBorderRadius,
                              padding: getButtonSizeStyles(buttonSize).padding,
                              width: textAlign === 'center' ? '100%' : 'auto',
                              display: textAlign === 'center' ? 'block' : 'inline-block',
                              border: 'none',
                              fontWeight: 500,
                              fontSize: getButtonSizeStyles(buttonSize).fontSize,
                              cursor: 'pointer',
                            }}
                          >
                            {preview.buttonText}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

