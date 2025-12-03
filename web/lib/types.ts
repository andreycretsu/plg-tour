// Shared types for the platform

export interface User {
  id: number;
  email: string;
  name: string;
  apiToken: string;
  createdAt: string;
}

export interface Tour {
  id: number;
  userId: number;
  name: string;
  urlPattern: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  steps?: TourStep[];
}

export interface TourStep {
  id: number;
  tourId: number;
  stepOrder: number;
  selector: string;
  title: string;
  content: string;
  imageUrl?: string;
  buttonText: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  pulseEnabled: boolean;
  zIndex?: number;
}

export interface TourAnalytics {
  id: number;
  tourId: number;
  stepId?: number;
  eventType: 'started' | 'completed' | 'skipped';
  userIdentifier?: string;
  timestamp: string;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateTourRequest {
  name: string;
  urlPattern: string;
  steps: Omit<TourStep, 'id' | 'tourId'>[];
}

export interface ApiError {
  error: string;
  message: string;
}

