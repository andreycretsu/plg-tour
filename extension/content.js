// TourLayer Content Script - Renders tours on matching websites
(function() {
  // Prevent multiple injections
  if (window.__tourLayerInitialized) return;
  window.__tourLayerInitialized = true;

  const API_URL = 'https://plg-tour.vercel.app';
  
  let currentTour = null;
  let currentStepIndex = 0;
  let tourContainer = null;

  // Initialize
  async function init() {
    console.log('TourLayer: Initializing on', window.location.href);
    
    // Don't run on TourLayer web app itself
    if (window.location.hostname.includes('plg-tour') || 
        window.location.hostname.includes('vercel.app') && window.location.pathname.includes('/tours')) {
      console.log('TourLayer: Skipping on TourLayer app');
      return;
    }
    
    // Get API token from storage
    const result = await chrome.storage.local.get(['apiToken']);
    
    if (!result.apiToken) {
      console.log('TourLayer: No API token configured - please connect the extension first');
      return;
    }

    console.log('TourLayer: API token found, fetching tours...');

    // Fetch tours for current URL
    await fetchAndShowTours(result.apiToken);
  }

  // Fetch tours from API
  async function fetchAndShowTours(apiToken) {
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

      console.log('TourLayer: Found', tours.length, 'tours for this page');
      
      if (tours.length > 0) {
        console.log('TourLayer: Tours data:', JSON.stringify(tours, null, 2));
      }

      if (tours.length > 0 && tours[0].steps?.length > 0) {
        // Show first matching tour
        currentTour = tours[0];
        currentStepIndex = 0;
        
        console.log('TourLayer: Starting tour:', currentTour.name, 'with', currentTour.steps.length, 'steps');
        
        // Check if user has already seen this tour (skip check for now to always show)
        // const seenKey = `tourlayer_seen_${currentTour.id}`;
        // const seen = await chrome.storage.local.get([seenKey]);
        // if (!seen[seenKey]) {
        
        // Always show for now (for testing)
        showStep(currentStepIndex);
        // }
      } else if (tours.length > 0) {
        console.log('TourLayer: Tour found but no steps:', tours[0]);
      }
    } catch (error) {
      console.error('TourLayer: Error fetching tours', error);
    }
  }

  // Create tour container (Shadow DOM for isolation)
  function createContainer(zIndex = 2147483647) {
    if (tourContainer) {
      // Update z-index if container exists
      const host = document.getElementById('tourlayer-container');
      if (host) host.style.zIndex = zIndex.toString();
      return tourContainer;
    }

    const host = document.createElement('div');
    host.id = 'tourlayer-container';
    host.style.cssText = `all: initial; position: fixed; z-index: ${zIndex};`;
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'closed' });
    
    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .tourlayer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1;
      }
      
      .tourlayer-highlight {
        position: fixed;
        box-shadow: 0 0 0 4px #3b82f6, 0 0 0 9999px rgba(0, 0, 0, 0.5);
        border-radius: 4px;
        z-index: 2;
        pointer-events: none;
        transition: all 0.3s ease;
      }
      
      .tourlayer-beacon {
        position: fixed;
        width: 20px;
        height: 20px;
        z-index: 3;
        cursor: pointer;
      }
      
      .tourlayer-beacon-dot {
        width: 20px;
        height: 20px;
        background: #3b82f6;
        border-radius: 50%;
        animation: tourlayer-pulse 2s infinite;
      }
      
      @keyframes tourlayer-pulse {
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
        position: fixed;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        max-width: 320px;
        z-index: 4;
        overflow: hidden;
      }
      
      .tourlayer-tooltip-header {
        padding: 16px 20px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
      }
      
      .tourlayer-tooltip-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      .tourlayer-tooltip-step {
        font-size: 12px;
        opacity: 0.8;
      }
      
      .tourlayer-tooltip-body {
        padding: 16px 20px;
      }
      
      .tourlayer-tooltip-content {
        font-size: 14px;
        color: #374151;
        line-height: 1.6;
      }
      
      .tourlayer-tooltip-image {
        width: 100%;
        max-height: 150px;
        object-fit: cover;
        margin-bottom: 12px;
        border-radius: 8px;
      }
      
      .tourlayer-tooltip-footer {
        padding: 12px 20px;
        background: #f9fafb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      
      .tourlayer-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }
      
      .tourlayer-btn-secondary {
        background: #e5e7eb;
        color: #374151;
      }
      
      .tourlayer-btn-secondary:hover {
        background: #d1d5db;
      }
      
      .tourlayer-btn-primary {
        background: #3b82f6;
        color: white;
      }
      
      .tourlayer-btn-primary:hover {
        background: #2563eb;
      }
      
      .tourlayer-btn-skip {
        background: transparent;
        color: #6b7280;
        padding: 8px;
      }
      
      .tourlayer-btn-skip:hover {
        color: #374151;
      }
      
      .tourlayer-close {
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
      
      .tourlayer-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    `;
    shadow.appendChild(styles);

    const container = document.createElement('div');
    shadow.appendChild(container);

    tourContainer = container;
    return container;
  }

  // Show a tour step
  function showStep(index) {
    if (!currentTour || !currentTour.steps || index >= currentTour.steps.length) {
      endTour();
      return;
    }

    const step = currentTour.steps[index];
    
    // Check if selector is valid (not empty, not HTML)
    const isValidSelector = step.selector && 
                            step.selector.trim() !== '' && 
                            !step.selector.startsWith('<');
    
    if (!isValidSelector) {
      console.log('TourLayer: No valid selector, showing centered modal');
      renderCenteredStep(step, index);
      return;
    }

    let element = null;
    try {
      element = document.querySelector(step.selector);
    } catch (e) {
      console.warn('TourLayer: Invalid selector:', step.selector, e);
    }

    if (!element) {
      console.warn('TourLayer: Element not found:', step.selector);
      // Try next step after a delay (element might load later)
      setTimeout(() => {
        let retryElement = null;
        try {
          retryElement = document.querySelector(step.selector);
        } catch (e) {}
        
        if (retryElement) {
          renderStep(step, retryElement, index);
        } else {
          // Show centered modal instead of skipping
          renderCenteredStep(step, index);
        }
      }, 1000);
      return;
    }

    renderStep(step, element, index);
  }

  // Render centered modal (when no element target)
  function renderCenteredStep(step, index) {
    const zIndex = step.z_index || 2147483647;
    const container = createContainer(zIndex);
    container.innerHTML = '';

    const totalSteps = currentTour.steps.length;
    const isLastStep = index === totalSteps - 1;
    const isFirstStep = index === 0;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'tourlayer-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 1;';
    container.appendChild(overlay);

    // Create centered tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tourlayer-tooltip';
    tooltip.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 2;
    `;
    
    tooltip.innerHTML = `
      <button class="tourlayer-close" data-action="close">&times;</button>
      <div class="tourlayer-tooltip-header">
        <div class="tourlayer-tooltip-title">${escapeHtml(step.title)}</div>
        <div class="tourlayer-tooltip-step">Step ${index + 1} of ${totalSteps}</div>
      </div>
      <div class="tourlayer-tooltip-body">
        ${step.image_url ? `<img src="${escapeHtml(step.image_url)}" class="tourlayer-tooltip-image" alt="">` : ''}
        <div class="tourlayer-tooltip-content">${escapeHtml(step.content)}</div>
      </div>
      <div class="tourlayer-tooltip-footer">
        <button class="tourlayer-btn tourlayer-btn-skip" data-action="skip">Skip tour</button>
        <div style="display: flex; gap: 8px;">
          ${!isFirstStep ? '<button class="tourlayer-btn tourlayer-btn-secondary" data-action="prev">Back</button>' : ''}
          <button class="tourlayer-btn tourlayer-btn-primary" data-action="next">
            ${isLastStep ? 'Finish' : step.button_text || 'Next'}
          </button>
        </div>
      </div>
    `;

    container.appendChild(tooltip);
    tooltip.addEventListener('click', handleTooltipClick);
  }

  // Render step UI
  function renderStep(step, element, index) {
    const zIndex = step.z_index || 2147483647;
    const container = createContainer(zIndex);
    container.innerHTML = '';

    const rect = element.getBoundingClientRect();

    // Scroll element into view if needed
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Wait for scroll to complete
    setTimeout(() => {
      const updatedRect = element.getBoundingClientRect();
      
      // Create highlight
      const highlight = document.createElement('div');
      highlight.className = 'tourlayer-highlight';
      highlight.style.cssText = `
        top: ${updatedRect.top - 4}px;
        left: ${updatedRect.left - 4}px;
        width: ${updatedRect.width + 8}px;
        height: ${updatedRect.height + 8}px;
      `;
      container.appendChild(highlight);

      // Create tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'tourlayer-tooltip';
      
      const totalSteps = currentTour.steps.length;
      const isLastStep = index === totalSteps - 1;
      const isFirstStep = index === 0;

      tooltip.innerHTML = `
        <button class="tourlayer-close" data-action="close">&times;</button>
        <div class="tourlayer-tooltip-header">
          <div class="tourlayer-tooltip-title">${escapeHtml(step.title)}</div>
          <div class="tourlayer-tooltip-step">Step ${index + 1} of ${totalSteps}</div>
        </div>
        <div class="tourlayer-tooltip-body">
          ${step.image_url ? `<img src="${escapeHtml(step.image_url)}" class="tourlayer-tooltip-image" alt="">` : ''}
          <div class="tourlayer-tooltip-content">${escapeHtml(step.content)}</div>
        </div>
        <div class="tourlayer-tooltip-footer">
          <button class="tourlayer-btn tourlayer-btn-skip" data-action="skip">Skip tour</button>
          <div style="display: flex; gap: 8px;">
            ${!isFirstStep ? '<button class="tourlayer-btn tourlayer-btn-secondary" data-action="prev">Back</button>' : ''}
            <button class="tourlayer-btn tourlayer-btn-primary" data-action="next">
              ${isLastStep ? 'Finish' : step.button_text || 'Next'}
            </button>
          </div>
        </div>
      `;

      // Position tooltip
      positionTooltip(tooltip, updatedRect, step.placement || 'bottom');
      container.appendChild(tooltip);

      // Add event listeners
      tooltip.addEventListener('click', handleTooltipClick);

    }, 300);
  }

  // Position tooltip relative to element
  function positionTooltip(tooltip, rect, placement) {
    const padding = 16;
    const tooltipWidth = 320;
    
    let top, left;

    switch (placement) {
      case 'top':
        top = rect.top - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        tooltip.style.transform = 'translateY(-100%)';
        break;
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - tooltipWidth - padding;
        tooltip.style.transform = 'translateY(-50%)';
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + padding;
        tooltip.style.transform = 'translateY(-50%)';
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
  }

  // Handle tooltip button clicks
  function handleTooltipClick(e) {
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
      // Mark tour as seen
      const seenKey = `tourlayer_seen_${currentTour.id}`;
      chrome.storage.local.set({ [seenKey]: true });
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

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-check on URL changes (for SPAs)
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      init();
    }
  }).observe(document.body, { subtree: true, childList: true });

})();
