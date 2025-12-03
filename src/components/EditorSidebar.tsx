import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Trash2,
  Play,
  Eye,
  MousePointer,
} from 'lucide-react';
import { useTourStore } from '@/store/tourStore';
import { TourStep, PlacementType } from '@/types/tour';
import { generateId, saveTour } from '@/utils/storage';

interface EditorSidebarProps {
  onClose: () => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ onClose }) => {
  const {
    mode,
    currentTour,
    selectedElement,
    setMode,
    addStep,
    updateStep,
    deleteStep,
    setCurrentTour,
  } = useTourStore();

  const [editingStep, setEditingStep] = useState<TourStep | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    buttonText: 'Next',
    placement: 'bottom' as PlacementType,
    pulseEnabled: true,
  });

  // When element is selected, open form to create step
  useEffect(() => {
    if (selectedElement && mode === 'picking') {
      setFormData({
        title: 'New Step',
        content: 'Add your description here',
        imageUrl: '',
        buttonText: 'Next',
        placement: 'bottom',
        pulseEnabled: true,
      });
      setEditingStep(null);
      setMode('editing');
    }
  }, [selectedElement, mode, setMode]);

  const handleSaveStep = () => {
    if (!currentTour || !selectedElement) return;

    if (editingStep) {
      // Update existing step
      updateStep(editingStep.id, formData);
    } else {
      // Create new step
      const newStep: TourStep = {
        id: generateId(),
        selector: selectedElement.selector,
        ...formData,
      };
      addStep(newStep);
    }

    // Reset form
    setFormData({
      title: '',
      content: '',
      imageUrl: '',
      buttonText: 'Next',
      placement: 'bottom',
      pulseEnabled: true,
    });
    setEditingStep(null);
    setMode('idle');
  };

  const handleEditStep = (step: TourStep) => {
    setEditingStep(step);
    setFormData({
      title: step.title,
      content: step.content,
      imageUrl: step.imageUrl || '',
      buttonText: step.buttonText,
      placement: step.placement,
      pulseEnabled: step.pulseEnabled,
    });
    setMode('editing');
  };

  const handleDeleteStep = (stepId: string) => {
    if (confirm('Are you sure you want to delete this step?')) {
      deleteStep(stepId);
    }
  };

  const handleSaveTour = async () => {
    if (!currentTour) return;
    await saveTour(currentTour);
    alert('Tour saved successfully!');
  };

  const handleStartPicking = () => {
    setMode('picking');
  };

  const handlePreview = () => {
    setMode('viewing');
  };

  if (!currentTour) return null;

  return (
    <div className="tourlayer-sidebar">
      {/* Header */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Tour Builder
        </h2>
        <button onClick={onClose} className="tourlayer-btn-ghost" style={{ padding: '4px' }}>
          <X size={20} />
        </button>
      </div>

      {/* Tour Name */}
      <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
        <label className="tourlayer-label">Tour Name</label>
        <input
          type="text"
          className="tourlayer-input"
          value={currentTour.name}
          onChange={(e) =>
            setCurrentTour({ ...currentTour, name: e.target.value })
          }
          placeholder="My Product Tour"
        />
      </div>

      {/* Actions */}
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleStartPicking}
          className="tourlayer-btn-primary"
          disabled={mode === 'picking'}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            opacity: mode === 'picking' ? 0.6 : 1,
          }}
        >
          <MousePointer size={16} />
          {mode === 'picking' ? 'Picking...' : 'Add Step'}
        </button>

        <button
          onClick={handlePreview}
          className="tourlayer-btn-secondary"
          disabled={currentTour.steps.length === 0}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Play size={16} />
          Preview
        </button>

        <button
          onClick={handleSaveTour}
          className="tourlayer-btn-primary"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <Save size={16} />
          Save Tour
        </button>
      </div>

      {/* Step Form (when editing) */}
      {mode === 'editing' && (
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
            {editingStep ? 'Edit Step' : 'New Step'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="tourlayer-label">Title</label>
              <input
                type="text"
                className="tourlayer-input"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Step title"
              />
            </div>

            <div>
              <label className="tourlayer-label">Content</label>
              <textarea
                className="tourlayer-textarea"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Describe what the user should do..."
              />
            </div>

            <div>
              <label className="tourlayer-label">Image URL (Optional)</label>
              <input
                type="text"
                className="tourlayer-input"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                placeholder="https://example.com/image.png"
              />
            </div>

            <div>
              <label className="tourlayer-label">Button Text</label>
              <input
                type="text"
                className="tourlayer-input"
                value={formData.buttonText}
                onChange={(e) =>
                  setFormData({ ...formData, buttonText: e.target.value })
                }
                placeholder="Next"
              />
            </div>

            <div>
              <label className="tourlayer-label">Tooltip Position</label>
              <select
                className="tourlayer-select"
                value={formData.placement}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    placement: e.target.value as PlacementType,
                  })
                }
              >
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                className="tourlayer-checkbox"
                checked={formData.pulseEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, pulseEnabled: e.target.checked })
                }
                id="pulse-enabled"
              />
              <label htmlFor="pulse-enabled" style={{ fontSize: '14px', color: '#374151' }}>
                Enable pulse animation
              </label>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSaveStep}
                className="tourlayer-btn-primary"
                style={{ flex: 1 }}
              >
                Save Step
              </button>
              <button
                onClick={() => {
                  setMode('idle');
                  setEditingStep(null);
                }}
                className="tourlayer-btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Steps List */}
      <div style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
          Steps ({currentTour.steps.length})
        </h3>

        {currentTour.steps.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: '#9ca3af',
              fontSize: '14px',
            }}
          >
            No steps yet. Click "Add Step" to get started.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentTour.steps.map((step, index) => (
              <div
                key={step.id}
                style={{
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: '#fafafa',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                      Step {index + 1}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                      {step.title}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginTop: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {step.content}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                    <button
                      onClick={() => handleEditStep(step)}
                      className="tourlayer-btn-ghost"
                      style={{ padding: '4px' }}
                      title="Edit"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteStep(step.id)}
                      className="tourlayer-btn-ghost"
                      style={{ padding: '4px', color: '#ef4444' }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

