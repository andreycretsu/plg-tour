'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import FullScreenModal from '@/components/FullScreenModal';
import { Plus, Trash2, GripVertical, Save, Crosshair, AlertCircle, CheckCircle, Loader2, Settings, FileText, Languages, RefreshCw, Copy } from 'lucide-react';
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
}

interface Tour {
  id: string;
  name: string;
  url_pattern: string;
  is_active: boolean;
  steps: Array<{
    id: string;
    selector: string;
    title: string;
    content: string;
    image_url?: string;
    button_text: string;
    placement: string;
    pulse_enabled: boolean;
    step_order: number;
  }>;
}

export default function EditTourPage() {
  const router = useRouter();
  const params = useParams();
  const tourId = params.id as string;

  const [tourName, setTourName] = useState('');
  const [urlPattern, setUrlPattern] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [pickingForStep, setPickingForStep] = useState<string | null>(null);
  const [pickerStatus, setPickerStatus] = useState<'idle' | 'waiting' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'customisation'>('content');
  
  // Translations
  const [previewLang, setPreviewLang] = useState('en');
  const [translations, setTranslations] = useState<Record<string, Record<string, any>>>({});
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

  // Load tour data
  useEffect(() => {
    const loadTour = async () => {
      try {
        const response = await fetch(`/api/tours/${tourId}`);

        if (!response.ok) {
          throw new Error('Failed to load tour');
        }

        const data = await response.json();
        const tour: Tour = data.tour;

        setTourName(tour.name);
        setUrlPattern(tour.url_pattern);
        setIsActive(tour.is_active);
        setSteps(tour.steps.map(s => ({
          id: String(s.id),
          selector: s.selector,
          title: s.title,
          content: s.content,
          imageUrl: s.image_url || '',
          buttonText: s.button_text,
          placement: s.placement,
          pulseEnabled: s.pulse_enabled,
        })).sort((a, b) => {
          const stepA = tour.steps.find(s => s.id === a.id);
          const stepB = tour.steps.find(s => s.id === b.id);
          return (stepA?.step_order || 0) - (stepB?.step_order || 0);
        }));
      } catch (err) {
        setError('Failed to load tour. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTour();
  }, [tourId]);

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      if (!tourId) return;
      try {
        const response = await fetch(`/api/translations?contentType=tour&contentId=${tourId}`);
        if (response.ok) {
          const data = await response.json();
          // Group translations by language
          const grouped: Record<string, Record<string, any>> = {};
          data.translations?.forEach((t: any) => {
            if (!grouped[t.language_code]) {
              grouped[t.language_code] = {};
            }
            grouped[t.language_code][t.field_name] = t.translated_text;
          });
          setTranslations(grouped);
        }
      } catch (err) {
        console.error('Failed to load translations:', err);
      }
    };
    loadTranslations();
  }, [tourId]);

  const handleAutoTranslate = async () => {
    if (!steps.length || !steps[0]?.title) {
      alert('Please add at least one step with a title first');
      return;
    }
    
    setTranslating(true);
    try {
      const response = await fetch('/api/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'tour',
          contentId: tourId,
          sourceContent: {
            title: steps[0]?.title || '',
            body: steps[0]?.content || '',
            buttonText: steps[0]?.buttonText || 'Next',
          },
        }),
      });
      
      if (!response.ok) throw new Error('Translation failed');
      
      const data = await response.json();
      // Reload translations
      const transResponse = await fetch(`/api/translations?contentType=tour&contentId=${tourId}`);
      if (transResponse.ok) {
        const transData = await transResponse.json();
        const grouped: Record<string, Record<string, any>> = {};
        transData.translations?.forEach((t: any) => {
          if (!grouped[t.language_code]) {
            grouped[t.language_code] = {};
          }
          grouped[t.language_code][t.field_name] = t.translated_text;
        });
        setTranslations(grouped);
      }
      
      alert('Successfully translated to all languages!');
    } catch (err) {
      console.error('Translation error:', err);
      alert('Failed to translate. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  const saveTranslation = async (langCode: string, content: { title: string; body: string; buttonText: string }) => {
    try {
      // Save each field
      for (const [field, value] of Object.entries(content)) {
        if (!value) continue;
        await fetch('/api/translations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: 'tour',
            contentId: tourId,
            languageCode: langCode,
            fieldName: field,
            translatedText: value,
          }),
        });
      }
      
      // Update local state
      setTranslations(prev => ({
        ...prev,
        [langCode]: content,
      }));
      setEditingLang(null);
      alert('Translation saved!');
    } catch (err) {
      console.error('Save translation error:', err);
      alert('Failed to save translation');
    }
  };

  const addStep = () => {
    const newStep: Step = {
      id: `new-step-${Date.now()}`,
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

    setSaving(true);

    try {
      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tourName,
          urlPattern: urlPattern,
          isActive: isActive,
          steps: steps.map((step, index) => ({
            id: String(step.id).startsWith('new-step-') ? undefined : step.id,
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

      alert('Tour updated successfully!');
      router.push('/tours');
    } catch (error) {
      alert('Error saving tour: ' + error);
    } finally {
      setSaving(false);
    }
  };

  const deleteTour = async () => {
    if (!confirm('Are you sure you want to delete this tour?')) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      router.push('/tours');
    } catch (error) {
      alert('Error deleting tour: ' + error);
    } finally {
      setDeleting(false);
    }
  };

  const duplicateTour = async () => {
    setDuplicating(true);
    try {
      const response = await fetch(`/api/tours/${tourId}/duplicate`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to duplicate');
      
      const newTour = await response.json();
      router.push(`/tours/${newTour.id}`);
    } catch (error) {
      alert('Error duplicating tour: ' + error);
    } finally {
      setDuplicating(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Tour</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/tours')}
            className="btn btn-secondary"
          >
            Back to Tours
          </button>
        </div>
      </div>
    );
  }

  return (
    <FullScreenModal
      title="Edit Tour"
      onClose={() => router.push('/tours')}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={duplicateTour}
            disabled={duplicating}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Copy size={16} />
            {duplicating ? 'Duplicating...' : 'Duplicate'}
          </button>
          <button
            onClick={deleteTour}
            disabled={deleting}
            className="btn btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <Trash2 size={16} />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={saveTour}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      }
    >
      <div className="p-6 overflow-y-auto h-full">
        <div className="max-w-4xl mx-auto">
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

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                id="tour-active"
                className="w-4 h-4 text-primary-600 rounded"
              />
              <label htmlFor="tour-active" className="text-sm text-gray-700">
                Tour is active (visible to users)
              </label>
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

            {/* Translations */}
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Languages size={20} className="text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Translations</h2>
                </div>
                <button
                  type="button"
                  onClick={handleAutoTranslate}
                  disabled={translating || !steps.length}
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
                Auto-translate the first step's content to multiple languages. Visitors will see content in their browser's language.
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
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tour Styling</h2>
            <p className="text-sm text-gray-500">
              Styling customisation for tours is coming soon. For now, you can customise individual step content in the Content tab.
            </p>
          </div>
        )}

        </div>
      </div>
    </FullScreenModal>
  );
}

