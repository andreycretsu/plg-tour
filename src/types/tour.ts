export type PlacementType = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface TourStep {
  id: string;
  selector: string;
  title: string;
  content: string;
  imageUrl?: string;
  placement: PlacementType;
  pulseEnabled: boolean;
  buttonText: string;
}

export interface Tour {
  id: string;
  name: string;
  url: string;
  urlPattern: string; // For regex matching
  steps: TourStep[];
  createdAt: number;
  updatedAt: number;
}

export interface ElementInfo {
  selector: string;
  element: HTMLElement;
  rect: DOMRect;
}

export type EditorMode = 'idle' | 'picking' | 'editing' | 'viewing';

export interface TourState {
  mode: EditorMode;
  currentTour: Tour | null;
  currentStepIndex: number;
  selectedElement: ElementInfo | null;
  isPlaying: boolean;
}

