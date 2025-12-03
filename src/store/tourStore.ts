import { create } from 'zustand';
import { Tour, TourStep, ElementInfo, EditorMode } from '@/types/tour';

interface TourStore {
  mode: EditorMode;
  currentTour: Tour | null;
  currentStepIndex: number;
  selectedElement: ElementInfo | null;
  isPlaying: boolean;
  hoveredElement: HTMLElement | null;

  // Actions
  setMode: (mode: EditorMode) => void;
  setCurrentTour: (tour: Tour | null) => void;
  setCurrentStepIndex: (index: number) => void;
  setSelectedElement: (element: ElementInfo | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setHoveredElement: (element: HTMLElement | null) => void;
  
  addStep: (step: TourStep) => void;
  updateStep: (stepId: string, updates: Partial<TourStep>) => void;
  deleteStep: (stepId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

export const useTourStore = create<TourStore>((set) => ({
  mode: 'idle',
  currentTour: null,
  currentStepIndex: 0,
  selectedElement: null,
  isPlaying: false,
  hoveredElement: null,

  setMode: (mode) => set({ mode }),
  setCurrentTour: (tour) => set({ currentTour: tour }),
  setCurrentStepIndex: (index) => set({ currentStepIndex: index }),
  setSelectedElement: (element) => set({ selectedElement: element }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setHoveredElement: (element) => set({ hoveredElement: element }),

  addStep: (step) =>
    set((state) => ({
      currentTour: state.currentTour
        ? {
            ...state.currentTour,
            steps: [...state.currentTour.steps, step],
            updatedAt: Date.now(),
          }
        : null,
    })),

  updateStep: (stepId, updates) =>
    set((state) => ({
      currentTour: state.currentTour
        ? {
            ...state.currentTour,
            steps: state.currentTour.steps.map((step) =>
              step.id === stepId ? { ...step, ...updates } : step
            ),
            updatedAt: Date.now(),
          }
        : null,
    })),

  deleteStep: (stepId) =>
    set((state) => ({
      currentTour: state.currentTour
        ? {
            ...state.currentTour,
            steps: state.currentTour.steps.filter((step) => step.id !== stepId),
            updatedAt: Date.now(),
          }
        : null,
    })),

  nextStep: () =>
    set((state) => {
      const maxIndex = (state.currentTour?.steps.length || 1) - 1;
      return {
        currentStepIndex: Math.min(state.currentStepIndex + 1, maxIndex),
      };
    }),

  prevStep: () =>
    set((state) => ({
      currentStepIndex: Math.max(state.currentStepIndex - 1, 0),
    })),

  reset: () =>
    set({
      mode: 'idle',
      currentTour: null,
      currentStepIndex: 0,
      selectedElement: null,
      isPlaying: false,
      hoveredElement: null,
    }),
}));

