// Content script - Tour player that runs on websites

const API_URL = 'https://plg-tour.vercel.app/api';

class TourLayerPlayer {
  constructor() {
    this.shadowRoot = null;
    this.currentTour = null;
    this.currentStepIndex = 0;
    this.init();
  }

  async init() {
    // Get API token
    const result = await chrome.storage.local.get(['apiToken']);
    if (!result.apiToken) {
      console.log('TourLayer: No API token found');
      return;
    }

    // Fetch tours for current URL
    await this.fetchAndDisplayTours(result.apiToken);
  }

  async fetchAndDisplayTours(apiToken) {
    try {
      const currentUrl = window.location.href;
      const response = await fetch(`${API_URL}/public/tours?url=${encodeURIComponent(currentUrl)}`, {
        headers: {
          'X-API-Token': apiToken,
        },
      });

      if (!response.ok) {
        console.error('TourLayer: Failed to fetch tours');
        return;
      }

      const tours = await response.json();
      
      if (tours && tours.length > 0) {
        console.log(`TourLayer: Found ${tours.length} tour(s) for this page`);
        // For now, show the first matching tour
        this.currentTour = tours[0];
        this.setupShadowDOM();
        this.startTour();
      } else {
        console.log('TourLayer: No tours found for this URL');
      }
    } catch (error) {
      console.error('TourLayer: Error fetching tours:', error);
    }
  }

  setupShadowDOM() {
    // Create shadow root container
    const container = document.createElement('div');
    container.id = 'tourlayer-root';
    container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999999;';
    
    this.shadowRoot = container.attachShadow({ mode: 'open' });
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = this.getStyles();
    this.shadowRoot.appendChild(style);
    
    document.body.appendChild(container);
  }

  getStyles() {
    return `
      .tourlayer-beacon {
        position: absolute;
        width: 24px;
        height: 24px;
        background: #3b82f6;
        border-radius: 50%;
        cursor: pointer;
        pointer-events: auto;
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
        }
        70% {
          box-shadow: 0 0 0 15px rgba(59, 130, 246, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
        }
      }

      .tourlayer-tooltip {
        position: absolute;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        padding: 20px;
        max-width: 400px;
        pointer-events: auto;
        z-index: 1000000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .tourlayer-tooltip h3 {
        margin: 0 0 12px 0;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }

      .tourlayer-tooltip p {
        margin: 0 0 16px 0;
        font-size: 14px;
        color: #6b7280;
        line-height: 1.5;
      }

      .tourlayer-tooltip img {
        width: 100%;
        border-radius: 6px;
        margin-bottom: 12px;
      }

      .tourlayer-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .tourlayer-progress {
        font-size: 12px;
        color: #9ca3af;
      }

      .tourlayer-buttons {
        display: flex;
        gap: 8px;
      }

      .tourlayer-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .tourlayer-btn-primary {
        background: #3b82f6;
        color: white;
      }

      .tourlayer-btn-primary:hover {
        background: #2563eb;
      }

      .tourlayer-btn-secondary {
        background: #f3f4f6;
        color: #374151;
      }

      .tourlayer-btn-secondary:hover {
        background: #e5e7eb;
      }

      .tourlayer-close {
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        font-size: 20px;
        line-height: 1;
        padding: 4px;
      }

      .tourlayer-close:hover {
        color: #374151;
      }
    `;
  }

  startTour() {
    if (!this.currentTour || !this.currentTour.steps || this.currentTour.steps.length === 0) {
      return;
    }

    this.currentStepIndex = 0;
    this.showStep(this.currentStepIndex);
  }

  async showStep(index) {
    const step = this.currentTour.steps[index];
    if (!step) return;

    // Find element
    const element = await this.waitForElement(step.selector);
    if (!element) {
      console.warn(`TourLayer: Element not found: ${step.selector}`);
      return;
    }

    // Show beacon
    this.showBeacon(element, step);
  }

  showBeacon(element, step) {
    const rect = element.getBoundingClientRect();
    const beacon = document.createElement('div');
    beacon.className = 'tourlayer-beacon';
    beacon.style.left = `${rect.left + rect.width / 2 - 12}px`;
    beacon.style.top = `${rect.top + rect.height / 2 - 12}px`;
    
    beacon.onclick = () => {
      beacon.remove();
      this.showTooltip(element, step);
    };

    this.shadowRoot.appendChild(beacon);
  }

  showTooltip(element, step) {
    const rect = element.getBoundingClientRect();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tourlayer-tooltip';
    
    // Position based on placement
    let top = rect.bottom + 10;
    let left = rect.left;

    if (step.placement === 'top') {
      top = rect.top - 200;
    } else if (step.placement === 'left') {
      left = rect.left - 420;
      top = rect.top;
    } else if (step.placement === 'right') {
      left = rect.right + 10;
      top = rect.top;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    tooltip.innerHTML = `
      <button class="tourlayer-close" id="closeBtn">×</button>
      <h3>${step.title}</h3>
      ${step.image_url ? `<img src="${step.image_url}" alt="${step.title}">` : ''}
      <p>${step.content}</p>
      <div class="tourlayer-footer">
        <div class="tourlayer-progress">
          ${this.currentStepIndex + 1} of ${this.currentTour.steps.length}
        </div>
        <div class="tourlayer-buttons">
          ${this.currentStepIndex > 0 ? '<button class="tourlayer-btn tourlayer-btn-secondary" id="backBtn">Back</button>' : ''}
          <button class="tourlayer-btn tourlayer-btn-primary" id="nextBtn">
            ${this.currentStepIndex < this.currentTour.steps.length - 1 ? step.button_text : 'Done'}
          </button>
        </div>
      </div>
    `;

    this.shadowRoot.appendChild(tooltip);

    // Event listeners
    const closeBtn = tooltip.querySelector('#closeBtn');
    const nextBtn = tooltip.querySelector('#nextBtn');
    const backBtn = tooltip.querySelector('#backBtn');

    closeBtn.onclick = () => {
      tooltip.remove();
      this.currentStepIndex = 0;
    };

    nextBtn.onclick = () => {
      tooltip.remove();
      if (this.currentStepIndex < this.currentTour.steps.length - 1) {
        this.currentStepIndex++;
        this.showStep(this.currentStepIndex);
      } else {
        this.currentStepIndex = 0;
      }
    };

    if (backBtn) {
      backBtn.onclick = () => {
        tooltip.remove();
        this.currentStepIndex--;
        this.showStep(this.currentStepIndex);
      };
    }
  }

  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }
}

// Initialize player
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new TourLayerPlayer();
  });
} else {
  new TourLayerPlayer();
}

// Listen for token updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TOKEN_UPDATED') {
    // Reload page to start tours
    window.location.reload();
  }
});

