/**
 * TourLayer Embed Script
 * Add this to your website to show product tours to all visitors
 * 
 * Usage:
 * <script src="https://plg-tour.vercel.app/embed.js" data-token="YOUR_API_TOKEN"></script>
 */

(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.__TourLayerLoaded) return;
  window.__TourLayerLoaded = true;

  const API_URL = 'https://plg-tour.vercel.app';
  
  let currentTour = null;
  let currentStepIndex = 0;
  let tourContainer = null;
  let apiToken = null;

  // Get API token from script tag
  function getApiToken() {
    const scripts = document.querySelectorAll('script[src*="embed.js"]');
    for (const script of scripts) {
      const token = script.getAttribute('data-token');
      if (token) return token;
    }
    // Also check for global config
    if (window.TourLayerConfig && window.TourLayerConfig.token) {
      return window.TourLayerConfig.token;
    }
    return null;
  }

  // Initialize
  async function init() {
    console.log('TourLayer: Initializing embed...');
    
    apiToken = getApiToken();
    
    if (!apiToken) {
      console.error('TourLayer: No API token found. Add data-token="YOUR_TOKEN" to the script tag.');
      return;
    }

    // Fetch and show tours
    await fetchAndShowTours();
  }

  // Fetch tours from API
  async function fetchAndShowTours() {
    try {
      const currentUrl = window.location.href;
      
      const response = await fetch(
        `${API_URL}/api/public/tours?url=${encodeURIComponent(currentUrl)}`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.error('TourLayer: Failed to fetch tours', response.status);
        return;
      }

      const data = await response.json();
      const tours = data.tours || [];

      console.log('TourLayer: Found', tours.length, 'tours');

      if (tours.length > 0 && tours[0].steps?.length > 0) {
        currentTour = tours[0];
        currentStepIndex = 0;
        
        // Check if user has seen this tour
        const seenKey = `tourlayer_seen_${currentTour.id}`;
        const hasSeen = localStorage.getItem(seenKey);
        
        if (!hasSeen) {
          setTimeout(() => showStep(currentStepIndex), 500);
        }
      }
    } catch (error) {
      console.error('TourLayer: Error', error);
    }
  }

  // Create container with Shadow DOM
  function createContainer(zIndex = 2147483647) {
    if (tourContainer) return tourContainer;

    const host = document.createElement('div');
    host.id = 'tourlayer-embed';
    host.style.cssText = `all: initial; position: fixed; z-index: ${zIndex};`;
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'closed' });
    
    const styles = document.createElement('style');
    styles.textContent = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .tl-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1;
      }
      
      .tl-highlight {
        position: fixed;
        box-shadow: 0 0 0 4px #3b82f6, 0 0 0 9999px rgba(0, 0, 0, 0.5);
        border-radius: 4px;
        z-index: 2;
        pointer-events: none;
        transition: all 0.3s ease;
      }
      
      .tl-tooltip {
        position: fixed;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        max-width: 320px;
        z-index: 4;
        overflow: hidden;
        animation: tl-fadeIn 0.3s ease;
      }
      
      @keyframes tl-fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .tl-header {
        padding: 16px 20px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        position: relative;
      }
      
      .tl-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
        padding-right: 24px;
      }
      
      .tl-step {
        font-size: 12px;
        opacity: 0.8;
      }
      
      .tl-body {
        padding: 16px 20px;
      }
      
      .tl-content {
        font-size: 14px;
        color: #374151;
        line-height: 1.6;
      }
      
      .tl-image {
        width: 100%;
        max-height: 150px;
        object-fit: cover;
        margin-bottom: 12px;
        border-radius: 8px;
      }
      
      .tl-footer {
        padding: 12px 20px;
        background: #f9fafb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      
      .tl-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }
      
      .tl-btn-skip {
        background: transparent;
        color: #6b7280;
        padding: 8px;
      }
      
      .tl-btn-skip:hover {
        color: #374151;
      }
      
      .tl-btn-secondary {
        background: #e5e7eb;
        color: #374151;
      }
      
      .tl-btn-secondary:hover {
        background: #d1d5db;
      }
      
      .tl-btn-primary {
        background: #3b82f6;
        color: white;
      }
      
      .tl-btn-primary:hover {
        background: #2563eb;
      }
      
      .tl-close {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 24px;
        height: 24px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }
      
      .tl-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      .tl-beacon {
        position: fixed;
        width: 20px;
        height: 20px;
        z-index: 3;
      }
      
      .tl-beacon-dot {
        width: 20px;
        height: 20px;
        background: #3b82f6;
        border-radius: 50%;
        animation: tl-pulse 2s infinite;
      }
      
      @keyframes tl-pulse {
        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
        70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
      }
    `;
    shadow.appendChild(styles);

    const container = document.createElement('div');
    shadow.appendChild(container);

    tourContainer = container;
    return container;
  }

  // Show step
  function showStep(index) {
    if (!currentTour || !currentTour.steps || index >= currentTour.steps.length) {
      endTour(true);
      return;
    }

    const step = currentTour.steps[index];
    
    // Check if selector is valid
    const isValidSelector = step.selector && 
                            step.selector.trim() !== '' && 
                            !step.selector.startsWith('<');
    
    if (!isValidSelector) {
      renderCenteredStep(step, index);
      return;
    }

    let element = null;
    try {
      element = document.querySelector(step.selector);
    } catch (e) {
      console.warn('TourLayer: Invalid selector', step.selector);
    }

    if (!element) {
      // Retry after delay
      setTimeout(() => {
        try {
          const retryEl = document.querySelector(step.selector);
          if (retryEl) {
            renderStep(step, retryEl, index);
          } else {
            renderCenteredStep(step, index);
          }
        } catch (e) {
          renderCenteredStep(step, index);
        }
      }, 1000);
      return;
    }

    renderStep(step, element, index);
  }

  // Render step attached to element
  function renderStep(step, element, index) {
    const zIndex = step.z_index || 2147483647;
    const container = createContainer(zIndex);
    container.innerHTML = '';

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      
      // Highlight
      const highlight = document.createElement('div');
      highlight.className = 'tl-highlight';
      highlight.style.cssText = `
        top: ${rect.top - 4}px;
        left: ${rect.left - 4}px;
        width: ${rect.width + 8}px;
        height: ${rect.height + 8}px;
      `;
      container.appendChild(highlight);

      // Beacon (pulsing dot)
      if (step.pulse_enabled) {
        const beacon = document.createElement('div');
        beacon.className = 'tl-beacon';
        beacon.innerHTML = '<div class="tl-beacon-dot"></div>';
        beacon.style.cssText = `
          top: ${rect.top + rect.height / 2 - 10}px;
          left: ${rect.right + 10}px;
        `;
        container.appendChild(beacon);
      }

      // Tooltip
      const tooltip = createTooltip(step, index);
      positionTooltip(tooltip, rect, step.placement || 'bottom');
      container.appendChild(tooltip);

    }, 300);
  }

  // Render centered step (no element)
  function renderCenteredStep(step, index) {
    const zIndex = step.z_index || 2147483647;
    const container = createContainer(zIndex);
    container.innerHTML = '';

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'tl-overlay';
    container.appendChild(overlay);

    // Centered tooltip
    const tooltip = createTooltip(step, index);
    tooltip.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 2;
    `;
    container.appendChild(tooltip);
  }

  // Create tooltip element
  function createTooltip(step, index) {
    const totalSteps = currentTour.steps.length;
    const isLastStep = index === totalSteps - 1;
    const isFirstStep = index === 0;

    const tooltip = document.createElement('div');
    tooltip.className = 'tl-tooltip';
    
    tooltip.innerHTML = `
      <button class="tl-close" data-action="close">&times;</button>
      <div class="tl-header">
        <div class="tl-title">${escapeHtml(step.title)}</div>
        <div class="tl-step">Step ${index + 1} of ${totalSteps}</div>
      </div>
      <div class="tl-body">
        ${step.image_url ? `<img src="${escapeHtml(step.image_url)}" class="tl-image" alt="">` : ''}
        <div class="tl-content">${escapeHtml(step.content)}</div>
      </div>
      <div class="tl-footer">
        <button class="tl-btn tl-btn-skip" data-action="skip">Skip tour</button>
        <div style="display: flex; gap: 8px;">
          ${!isFirstStep ? '<button class="tl-btn tl-btn-secondary" data-action="prev">Back</button>' : ''}
          <button class="tl-btn tl-btn-primary" data-action="next">
            ${isLastStep ? 'Finish' : step.button_text || 'Next'}
          </button>
        </div>
      </div>
    `;

    tooltip.addEventListener('click', handleClick);
    return tooltip;
  }

  // Position tooltip
  function positionTooltip(tooltip, rect, placement) {
    const padding = 16;
    const tooltipWidth = 320;
    
    let top, left;
    let transform = '';

    switch (placement) {
      case 'top':
        top = rect.top - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        transform = 'translateY(-100%)';
        break;
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - tooltipWidth - padding;
        transform = 'translateY(-50%)';
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + padding;
        transform = 'translateY(-50%)';
        break;
      default:
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
    }

    // Keep within viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, top);

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    if (transform) tooltip.style.transform = transform;
  }

  // Handle button clicks
  function handleClick(e) {
    const action = e.target.dataset.action;
    if (!action) return;

    switch (action) {
      case 'next':
        if (currentStepIndex < currentTour.steps.length - 1) {
          currentStepIndex++;
          showStep(currentStepIndex);
        } else {
          endTour(true);
        }
        break;
      case 'prev':
        if (currentStepIndex > 0) {
          currentStepIndex--;
          showStep(currentStepIndex);
        }
        break;
      case 'skip':
      case 'close':
        endTour(false);
        break;
    }
  }

  // End tour
  function endTour(completed = false) {
    if (tourContainer) {
      tourContainer.innerHTML = '';
    }

    if (currentTour && completed) {
      // Mark as seen
      const seenKey = `tourlayer_seen_${currentTour.id}`;
      localStorage.setItem(seenKey, 'true');
    }

    currentTour = null;
    currentStepIndex = 0;
  }

  // Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-initialize on SPA navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      // Reset and re-fetch
      if (tourContainer) tourContainer.innerHTML = '';
      currentTour = null;
      currentStepIndex = 0;
      fetchAndShowTours();
    }
  }).observe(document.body, { subtree: true, childList: true });

  // Expose API for manual control
  window.TourLayer = {
    show: (tourId) => {
      console.log('TourLayer: Manual show not implemented yet');
    },
    reset: (tourId) => {
      if (tourId) {
        localStorage.removeItem(`tourlayer_seen_${tourId}`);
      }
      console.log('TourLayer: Tour reset');
    },
    version: '1.0.0'
  };

})();

