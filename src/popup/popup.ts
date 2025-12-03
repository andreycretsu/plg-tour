import { Tour } from '@/types/tour';
import { getAllTours, generateId } from '@/utils/storage';

// Get current tab
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Open editor in content script
async function openEditor() {
  const tab = await getCurrentTab();
  if (!tab.id) return;

  // Send message to content script to open editor
  chrome.tabs.sendMessage(tab.id, {
    type: 'OPEN_EDITOR',
  });

  // Create new tour
  const newTour: Tour = {
    id: generateId(),
    name: 'New Tour',
    url: tab.url || '',
    urlPattern: tab.url || '',
    steps: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Store in chrome.storage and set as current
  await chrome.storage.local.set({ currentTour: newTour });

  // Also send the tour data
  chrome.tabs.sendMessage(tab.id, {
    type: 'SET_CURRENT_TOUR',
    tour: newTour,
  });

  window.close();
}

// View all tours
async function viewTours() {
  const tours = await getAllTours();
  const toursContainer = document.getElementById('toursContainer');
  const toursList = document.getElementById('toursList');

  if (!toursContainer || !toursList) return;

  if (tours.length === 0) {
    toursList.innerHTML = '<div style="text-align: center; color: #9ca3af; padding: 20px; font-size: 13px;">No tours yet</div>';
  } else {
    toursList.innerHTML = tours
      .map(
        (tour) => `
        <div class="tour-item" data-tour-id="${tour.id}">
          <div class="tour-name">${tour.name}</div>
          <div class="tour-meta">${tour.steps.length} steps • ${new URL(tour.url).hostname}</div>
        </div>
      `
      )
      .join('');

    // Add click handlers
    toursList.querySelectorAll('.tour-item').forEach((item) => {
      item.addEventListener('click', async () => {
        const tourId = (item as HTMLElement).dataset.tourId;
        const tour = tours.find((t) => t.id === tourId);
        if (tour) {
          await startTour(tour);
        }
      });
    });
  }

  toursContainer.style.display = 'block';
}

// Start a tour
async function startTour(tour: Tour) {
  const tab = await getCurrentTab();
  if (!tab.id) return;

  // Set current tour
  await chrome.storage.local.set({ currentTour: tour });

  // Send message to content script
  chrome.tabs.sendMessage(tab.id, {
    type: 'START_TOUR',
    tour: tour,
  });

  window.close();
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  const openEditorBtn = document.getElementById('openEditor');
  const viewToursBtn = document.getElementById('viewTours');

  if (openEditorBtn) {
    openEditorBtn.addEventListener('click', openEditor);
  }

  if (viewToursBtn) {
    viewToursBtn.addEventListener('click', viewTours);
  }
});

