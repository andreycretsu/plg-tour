import { Tour } from '@/types/tour';

const STORAGE_KEY = 'tourlayer_tours';

/**
 * Storage utilities using chrome.storage.local
 */

export async function saveTour(tour: Tour): Promise<void> {
  const tours = await getAllTours();
  const existingIndex = tours.findIndex(t => t.id === tour.id);
  
  if (existingIndex >= 0) {
    tours[existingIndex] = tour;
  } else {
    tours.push(tour);
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: tours });
}

export async function getAllTours(): Promise<Tour[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

export async function getTourById(id: string): Promise<Tour | null> {
  const tours = await getAllTours();
  return tours.find(t => t.id === id) || null;
}

export async function getToursByUrl(url: string): Promise<Tour[]> {
  const tours = await getAllTours();
  return tours.filter(t => {
    // Simple URL matching
    return url.includes(t.url) || t.url.includes(url);
  });
}

export async function deleteTour(id: string): Promise<void> {
  const tours = await getAllTours();
  const filtered = tours.filter(t => t.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

