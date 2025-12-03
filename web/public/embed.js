/**
 * TourLayer Embed Script
 * Add this to your website to show product tours and tooltips to all visitors
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
  
  // Tour state
  let currentTour = null;
  let currentStepIndex = 0;
  let tourContainer = null;
  
  // Tooltip state
  let tooltipContainer = null;
  let activeTooltips = [];
  let openTooltipId = null;
  
  let apiToken = null;

  // Get API token from script tag
  function getApiToken() {
    // Method 1: Find script by src containing our domain or embed.js
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const src = script.getAttribute('src') || '';
      if (src.includes('plg-tour') || src.includes('embed.js') || src.includes('tourlayer')) {
        const token = script.getAttribute('data-token');
        if (token) {
          console.log('TourLayer: Token found in script tag');
          return token;
        }
      }
    }
    
    // Method 2: Check for global config
    if (window.TourLayerConfig && window.TourLayerConfig.token) {
      console.log('TourLayer: Token found in TourLayerConfig');
      return window.TourLayerConfig.token;
    }
    
    // Method 3: Check current script
    if (document.currentScript) {
      const token = document.currentScript.getAttribute('data-token');
      if (token) {
        console.log('TourLayer: Token found in currentScript');
        return token;
      }
    }
    
    return null;
  }

  // Initialize
  async function init() {
    console.log('TourLayer: Initializing embed on', window.location.href);
    
    apiToken = getApiToken();
    
    if (!apiToken) {
      console.warn('TourLayer: No API token found. Add data-token="YOUR_TOKEN" to the script tag.');
      console.warn('TourLayer: Example: <script src="https://plg-tour.vercel.app/embed.js" data-token="tl_xxx"></script>');
      return;
    }

    console.log('TourLayer: Token found, fetching content...');

    // Fetch both tours and tooltips
    await Promise.all([
      fetchAndShowTours(),
      fetchAndShowTooltips()
    ]);
  }

  // =====================
  // TOURS
  // =====================

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
        const seenKey = `tourlayer_seen_tour_${currentTour.id}`;
        const hasSeen = localStorage.getItem(seenKey);
        
        if (!hasSeen) {
          setTimeout(() => showStep(currentStepIndex), 500);
        } else {
          console.log('TourLayer: Tour already seen');
        }
      }
    } catch (error) {
      console.error('TourLayer: Error fetching tours', error);
    }
  }

  // =====================
  // TOOLTIPS
  // =====================

  async function fetchAndShowTooltips() {
    try {
      const currentUrl = window.location.href;
      
      const response = await fetch(
        `${API_URL}/api/public/tooltips?url=${encodeURIComponent(currentUrl)}`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.error('TourLayer: Failed to fetch tooltips', response.status);
        return;
      }

      const data = await response.json();
      const tooltips = data.tooltips || [];

      console.log('TourLayer: Found', tooltips.length, 'tooltips');

      if (tooltips.length > 0) {
        activeTooltips = tooltips;
        initTooltips();
      }
    } catch (error) {
      console.error('TourLayer: Error fetching tooltips', error);
    }
  }

  function initTooltips() {
    // Create tooltip container
    if (!tooltipContainer) {
      const host = document.createElement('div');
      host.id = 'tourlayer-tooltip-embed';
      host.style.cssText = 'all: initial; position: fixed; z-index: 2147483646;';
      document.body.appendChild(host);
      
      const shadow = host.attachShadow({ mode: 'closed' });
      
      const styles = document.createElement('style');
      styles.textContent = getTooltipStyles();
      shadow.appendChild(styles);
      
      const container = document.createElement('div');
      shadow.appendChild(container);
      tooltipContainer = container;
    }

    // Render beacons for each tooltip
    activeTooltips.forEach(tooltip => {
      if (tooltip.show_once) {
        const seenKey = `tourlayer_seen_tooltip_${tooltip.id}`;
        if (!localStorage.getItem(seenKey)) {
          createBeacon(tooltip);
        }
      } else {
        createBeacon(tooltip);
      }
    });
  }

  function createBeacon(tooltip) {
    let element;
    try {
      element = document.querySelector(tooltip.selector);
    } catch (e) {
      console.warn('TourLayer: Invalid tooltip selector:', tooltip.selector);
      return;
    }

    if (!element) {
      console.warn('TourLayer: Tooltip element not found:', tooltip.selector);
      return;
    }

    const delay = tooltip.delay_ms || 0;
    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      const sizes = { small: 12, medium: 16, large: 24 };
      const size = sizes[tooltip.icon_size] || 16;
      
      // Use new edge-based positioning with Y offset
      const beaconPos = getBeaconPositionEdge(rect, tooltip.icon_edge || 'right', tooltip.icon_offset || 0, size, tooltip.icon_offset_y || 0);
      
      const beacon = document.createElement('div');
      beacon.className = 'tl-beacon';
      beacon.dataset.tooltipId = tooltip.id;
      beacon.style.cssText = `
        position: fixed;
        top: ${beaconPos.top}px;
        left: ${beaconPos.left}px;
        width: ${size}px;
        height: ${size}px;
        z-index: ${tooltip.z_index || 2147483647};
        cursor: pointer;
      `;
      
      if (tooltip.icon_type !== 'none') {
        const dot = document.createElement('div');
        dot.className = `tl-beacon-${tooltip.icon_type || 'pulse'}`;
        dot.style.cssText = `
          width: 100%;
          height: 100%;
          background: ${tooltip.icon_color || '#3b82f6'};
          border-radius: 50%;
          ${tooltip.icon_type === 'pulse' ? 'animation: tl-pulse 2s infinite;' : ''}
        `;
        beacon.appendChild(dot);
      }
      
      if (tooltip.trigger_type === 'hover') {
        // Hover on beacon
        beacon.addEventListener('mouseenter', () => showTooltipCard(tooltip, element));
        beacon.addEventListener('mouseleave', () => {
          setTimeout(() => {
            if (!tooltipContainer.querySelector('.tl-card:hover')) {
              hideTooltipCard(tooltip.id);
            }
          }, 200);
        });
        
        // ALSO hover on the target element itself
        element.addEventListener('mouseenter', () => showTooltipCard(tooltip, element));
        element.addEventListener('mouseleave', () => {
          setTimeout(() => {
            const card = tooltipContainer?.querySelector('.tl-card:hover');
            const beaconHovered = beacon.matches(':hover');
            if (!card && !beaconHovered) {
              hideTooltipCard(tooltip.id);
            }
          }, 200);
        });
      } else {
        // Click on beacon
        beacon.addEventListener('click', (e) => {
          e.stopPropagation();
          if (openTooltipId === tooltip.id) {
            hideTooltipCard(tooltip.id);
          } else {
            showTooltipCard(tooltip, element);
          }
        });
      }
      
      tooltipContainer.appendChild(beacon);
      
      // Update position on scroll/resize
      const updatePosition = () => {
        const newRect = element.getBoundingClientRect();
        const newPos = getBeaconPositionEdge(newRect, tooltip.icon_edge || 'right', tooltip.icon_offset || 0, size, tooltip.icon_offset_y || 0);
        beacon.style.top = `${newPos.top}px`;
        beacon.style.left = `${newPos.left}px`;
      };
      
      window.addEventListener('scroll', updatePosition, { passive: true });
      window.addEventListener('resize', updatePosition, { passive: true });
      
    }, delay);
  }

  // Edge-based positioning with X and Y offsets
  // offset: perpendicular to edge (0 = on edge, positive = outside, negative = inside)
  // offsetY: along the edge (0 = center, positive = down/right, negative = up/left)
  function getBeaconPositionEdge(rect, edge, offset = 0, size = 16, offsetY = 0) {
    const halfSize = size / 2;
    
    switch (edge) {
      case 'top':
        return { 
          top: rect.top - halfSize - offset, 
          left: rect.left + rect.width / 2 - halfSize + offsetY
        };
      case 'bottom':
        return { 
          top: rect.bottom - halfSize + offset, 
          left: rect.left + rect.width / 2 - halfSize + offsetY
        };
      case 'left':
        return { 
          top: rect.top + rect.height / 2 - halfSize + offsetY, 
          left: rect.left - halfSize - offset 
        };
      case 'right':
      default:
        return { 
          top: rect.top + rect.height / 2 - halfSize + offsetY, 
          left: rect.right - halfSize + offset 
        };
    }
  }

  function showTooltipCard(tooltip, element) {
    hideTooltipCard();
    openTooltipId = tooltip.id;
    
    const rect = element.getBoundingClientRect();
    
    // Get styling values with defaults
    const cardWidth = tooltip.card_width || 320;
    const cardPadding = tooltip.card_padding || 20;
    const cardBorderRadius = tooltip.card_border_radius || 12;
    const cardShadow = tooltip.card_shadow || '0 4px 20px rgba(0,0,0,0.15)';
    const cardBgColor = tooltip.card_bg_color || '#ffffff';
    const cardTextColor = tooltip.card_text_color || '#1f2937';
    const buttonColor = tooltip.button_color || '#3b82f6';
    const buttonTextColor = tooltip.button_text_color || '#ffffff';
    const buttonBorderRadius = tooltip.button_border_radius || 8;
    
    const card = document.createElement('div');
    card.className = 'tl-card';
    card.dataset.tooltipId = tooltip.id;
    card.style.cssText = `
      position: fixed;
      width: ${cardWidth}px;
      background: ${cardBgColor};
      border-radius: ${cardBorderRadius}px;
      box-shadow: ${cardShadow};
      z-index: ${(tooltip.z_index || 2147483647) + 1};
      overflow: hidden;
      text-align: ${tooltip.text_align || 'left'};
      animation: tl-fade-in 0.2s ease-out;
    `;
    
    card.innerHTML = `
      <button class="tl-card-close" data-action="close">&times;</button>
      ${tooltip.image_url ? `<img src="${escapeHtml(tooltip.image_url)}" class="tl-card-image" style="border-radius: ${Math.max(0, cardBorderRadius - 4)}px ${Math.max(0, cardBorderRadius - 4)}px 0 0;" alt="">` : ''}
      <div class="tl-card-content" style="color: ${cardTextColor}; padding: ${cardPadding}px;">
        <h3 class="tl-card-title">${escapeHtml(tooltip.title)}</h3>
        ${tooltip.body ? `<p class="tl-card-body">${escapeHtml(tooltip.body)}</p>` : ''}
        <button class="tl-card-btn" style="background: ${buttonColor}; color: ${buttonTextColor}; border-radius: ${buttonBorderRadius}px; margin-top: 12px; padding: 10px 20px; border: none; cursor: pointer; font-weight: 500; width: ${tooltip.text_align === 'center' ? '100%' : 'auto'};" data-action="dismiss">
          ${escapeHtml(tooltip.button_text || 'Got it')}
        </button>
      </div>
    `;
    
    // Position card below element
    let top = rect.bottom + 16;
    let left = rect.left + rect.width / 2 - cardWidth / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - cardWidth - 16));
    
    card.style.top = `${top}px`;
    card.style.left = `${left}px`;
    
    card.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'close' || action === 'dismiss') {
        dismissTooltip(tooltip);
      }
    });
    
    if (tooltip.dismiss_type === 'click_outside') {
      setTimeout(() => {
        document.addEventListener('click', function outsideClick(e) {
          if (!card.contains(e.target)) {
            hideTooltipCard(tooltip.id);
            document.removeEventListener('click', outsideClick);
          }
        });
      }, 100);
    } else if (tooltip.dismiss_type === 'click_element') {
      element.addEventListener('click', function elementClick() {
        dismissTooltip(tooltip);
        element.removeEventListener('click', elementClick);
      }, { once: true });
    }
    
    if (tooltip.trigger_type === 'hover') {
      card.addEventListener('mouseleave', () => hideTooltipCard(tooltip.id));
    }
    
    tooltipContainer.appendChild(card);
  }

  function hideTooltipCard(tooltipId) {
    if (tooltipId) {
      const card = tooltipContainer?.querySelector(`.tl-card[data-tooltip-id="${tooltipId}"]`);
      if (card) card.remove();
      if (openTooltipId === tooltipId) openTooltipId = null;
    } else {
      tooltipContainer?.querySelectorAll('.tl-card').forEach(c => c.remove());
      openTooltipId = null;
    }
  }

  function dismissTooltip(tooltip) {
    hideTooltipCard(tooltip.id);
    
    const beacon = tooltipContainer?.querySelector(`.tl-beacon[data-tooltip-id="${tooltip.id}"]`);
    if (beacon) beacon.remove();
    
    if (tooltip.show_once) {
      localStorage.setItem(`tourlayer_seen_tooltip_${tooltip.id}`, 'true');
    }
  }

  function getTooltipStyles() {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      .tl-beacon {
        transition: transform 0.2s;
      }
      
      .tl-beacon:hover {
        transform: scale(1.2);
      }
      
      .tl-beacon-pulse {
        animation: tl-pulse 2s infinite;
      }
      
      @keyframes tl-pulse {
        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
        70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
      }
      
      @keyframes tl-fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .tl-card-close {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        background: rgba(0, 0, 0, 0.1);
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        z-index: 1;
      }
      
      .tl-card-close:hover {
        background: rgba(0, 0, 0, 0.2);
      }
      
      .tl-card-image {
        width: 100%;
        max-height: 150px;
        object-fit: cover;
      }
      
      .tl-card-content {
        padding: 16px;
      }
      
      .tl-card-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      
      .tl-card-body {
        font-size: 14px;
        line-height: 1.5;
        opacity: 0.8;
      }
      
      .tl-card-footer {
        padding: 12px 16px;
        border-top: 1px solid #eee;
      }
      
      .tl-card-btn {
        width: 100%;
        padding: 10px 16px;
        border: none;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      
      .tl-card-btn:hover {
        opacity: 0.9;
      }
    `;
  }

  // =====================
  // TOUR RENDERING
  // =====================

  function createContainer(zIndex = 2147483647) {
    if (tourContainer) return tourContainer;

    const host = document.createElement('div');
    host.id = 'tourlayer-embed';
    host.style.cssText = `all: initial; position: fixed; z-index: ${zIndex};`;
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'closed' });
    
    const styles = document.createElement('style');
    styles.textContent = getTourStyles();
    shadow.appendChild(styles);

    const container = document.createElement('div');
    shadow.appendChild(container);

    tourContainer = container;
    return container;
  }

  function getTourStyles() {
    return `
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
  }

  function showStep(index) {
    if (!currentTour || !currentTour.steps || index >= currentTour.steps.length) {
      endTour(true);
      return;
    }

    const step = currentTour.steps[index];
    
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

  function renderStep(step, element, index) {
    const zIndex = step.z_index || 2147483647;
    const container = createContainer(zIndex);
    container.innerHTML = '';

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      
      const highlight = document.createElement('div');
      highlight.className = 'tl-highlight';
      highlight.style.cssText = `
        top: ${rect.top - 4}px;
        left: ${rect.left - 4}px;
        width: ${rect.width + 8}px;
        height: ${rect.height + 8}px;
      `;
      container.appendChild(highlight);

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

      const tooltip = createTooltip(step, index);
      positionTooltip(tooltip, rect, step.placement || 'bottom');
      container.appendChild(tooltip);

    }, 300);
  }

  function renderCenteredStep(step, index) {
    const zIndex = step.z_index || 2147483647;
    const container = createContainer(zIndex);
    container.innerHTML = '';

    const overlay = document.createElement('div');
    overlay.className = 'tl-overlay';
    container.appendChild(overlay);

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

    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, top);

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    if (transform) tooltip.style.transform = transform;
  }

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

  function endTour(completed = false) {
    if (tourContainer) {
      tourContainer.innerHTML = '';
    }

    if (currentTour && completed) {
      localStorage.setItem(`tourlayer_seen_tour_${currentTour.id}`, 'true');
    }

    currentTour = null;
    currentStepIndex = 0;
  }

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
      if (tourContainer) tourContainer.innerHTML = '';
      if (tooltipContainer) tooltipContainer.innerHTML = '';
      currentTour = null;
      currentStepIndex = 0;
      activeTooltips = [];
      fetchAndShowTours();
      fetchAndShowTooltips();
    }
  }).observe(document.body, { subtree: true, childList: true });

  // Expose API
  window.TourLayer = {
    reset: (id) => {
      if (id) {
        localStorage.removeItem(`tourlayer_seen_tour_${id}`);
        localStorage.removeItem(`tourlayer_seen_tooltip_${id}`);
      }
      console.log('TourLayer: Reset complete');
    },
    version: '1.1.0'
  };

})();
