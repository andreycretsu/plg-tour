// TourLayer Content Script - Renders tours and tooltips on matching websites
(function() {
  // Prevent multiple injections - also check for embed script
  if (window.__tourLayerInitialized || window.__TourLayerLoaded) {
    console.log('TourLayer Extension: Skipping - already initialized or embed script present');
    return;
  }
  window.__tourLayerInitialized = true;

  const API_URL = 'https://plg-tour.vercel.app';
  
  // Tour state
  let currentTour = null;
  let currentStepIndex = 0;
  let tourContainer = null;
  
  // Tooltip state
  let activeTooltips = [];
  let tooltipContainer = null;
  let openTooltipId = null;
  
  // API token
  let apiToken = null;
  
  // User identification for server-side tracking
  let userConfig = {
    userId: null,
    userEmail: null,
    userName: null,
    userLocale: null
  };
  
  // Cache for server-side view data
  let serverViewsCache = {
    tours: {},
    tooltips: {}
  };
  
  // Get user's language (userLocale config > browser detection > English default)
  function getUserLanguage() {
    const supported = ['en', 'uk', 'pl', 'es', 'pt', 'de', 'ru', 'fr', 'it', 'ja', 'zh', 'hu', 'sk'];
    
    // 1. Check if userLocale is explicitly set in config
    if (userConfig.userLocale) {
      // Handle both formats: 'de' and 'de-DE'
      const locale = userConfig.userLocale.split('-')[0].toLowerCase();
      if (supported.includes(locale)) {
        console.log('TourLayer Extension: Using configured locale:', locale);
        return locale;
      }
    }
    
    // 2. Fall back to browser language detection
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    const code = browserLang.split('-')[0].toLowerCase();
    
    // 3. Return supported language or default to English
    const finalLang = supported.includes(code) ? code : 'en';
    console.log('TourLayer Extension: Detected language:', finalLang, '(from:', browserLang, ')');
    return finalLang;
  }
  
  // Get user config from page (if set by website)
  function getUserConfig() {
    if (window.TourLayerConfig) {
      userConfig.userId = window.TourLayerConfig.userId || null;
      userConfig.userEmail = window.TourLayerConfig.userEmail || null;
      userConfig.userName = window.TourLayerConfig.userName || null;
      userConfig.userLocale = window.TourLayerConfig.userLocale || null;
      if (userConfig.userId) {
        console.log('TourLayer Extension: User identified from TourLayerConfig:', userConfig.userId);
      }
      if (userConfig.userLocale) {
        console.log('TourLayer Extension: Locale from TourLayerConfig:', userConfig.userLocale);
      }
    }
  }
  
  // Fetch user views from server (for server-side tracking)
  async function fetchUserViews(contentType, contentIds) {
    if (!userConfig.userId || !contentIds.length || !apiToken) return {};
    
    try {
      const response = await fetch(
        `${API_URL}/api/public/views?type=${contentType}&ids=${contentIds.join(',')}`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'X-User-Id': userConfig.userId
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.views || {};
      }
    } catch (error) {
      console.warn('TourLayer: Failed to fetch user views', error);
    }
    
    return {};
  }
  
  // Record view to server
  async function recordServerView(contentType, contentId) {
    if (!userConfig.userId || !apiToken) return;
    
    try {
      await fetch(`${API_URL}/api/public/views`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({
          userId: userConfig.userId,
          userEmail: userConfig.userEmail,
          userName: userConfig.userName,
          contentType,
          contentId,
          metadata: {
            url: window.location.href,
            source: 'extension'
          }
        })
      });
      
      // Update local cache
      if (contentType === 'tour') {
        serverViewsCache.tours[contentId] = serverViewsCache.tours[contentId] || { viewCount: 0 };
        serverViewsCache.tours[contentId].viewCount++;
      } else {
        serverViewsCache.tooltips[contentId] = serverViewsCache.tooltips[contentId] || { viewCount: 0 };
        serverViewsCache.tooltips[contentId].viewCount++;
      }
    } catch (error) {
      console.warn('TourLayer: Failed to record view', error);
    }
  }
  
  // Check if content should be shown based on frequency settings (server-side)
  function shouldShowContentServer(content, contentType) {
    const frequencyType = content.frequency_type || (content.show_once ? 'once' : 'always');
    const cache = contentType === 'tour' ? serverViewsCache.tours : serverViewsCache.tooltips;
    const viewData = cache[content.id] || { viewCount: 0, lastSeen: null };
    
    switch (frequencyType) {
      case 'once':
        return viewData.viewCount === 0;
      case 'always':
        return true;
      case 'count':
        return viewData.viewCount < (content.frequency_count || 1);
      case 'days':
        if (!viewData.lastSeen) return true;
        const cooldownMs = (content.frequency_days || 7) * 24 * 60 * 60 * 1000;
        const timeSince = Date.now() - new Date(viewData.lastSeen).getTime();
        return timeSince >= cooldownMs;
      default:
        return viewData.viewCount === 0;
    }
  }

  // Show debug badge (temporary - remove in production)
  function showDebugBadge(status, color = '#3b82f6') {
    const badge = document.createElement('div');
    badge.id = 'tourlayer-debug-badge';
    badge.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: ${color};
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-family: system-ui, sans-serif;
      font-size: 12px;
      z-index: 2147483647;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    badge.textContent = `🎯 TourLayer: ${status}`;
    
    const existing = document.getElementById('tourlayer-debug-badge');
    if (existing) existing.remove();
    
    document.body.appendChild(badge);
    
    if (!color.includes('ef4444')) {
      setTimeout(() => badge.remove(), 5000);
    }
  }

  // Initialize
  async function init() {
    console.log('TourLayer: Initializing on', window.location.href);
    showDebugBadge('Loading...', '#6366f1');
    
    // Check for user config from page
    getUserConfig();
    
    // Don't run on TourLayer web app itself
    if (window.location.hostname.includes('plg-tour') || 
        window.location.hostname.includes('vercel.app') && window.location.pathname.includes('/tours')) {
      console.log('TourLayer: Skipping on TourLayer app');
      showDebugBadge('Skipped (TourLayer app)', '#64748b');
      return;
    }
    
    const result = await chrome.storage.local.get(['apiToken']);
    
    if (!result.apiToken) {
      console.log('TourLayer: No API token configured');
      showDebugBadge('No API token! Connect in popup', '#ef4444');
      return;
    }
    
    // Store token globally
    apiToken = result.apiToken;

    console.log('TourLayer: API token found, fetching content...');
    showDebugBadge('Fetching...', '#3b82f6');

    // Fetch both tours and tooltips
    await Promise.all([
      fetchAndShowTours(apiToken),
      fetchAndShowTooltips(apiToken)
    ]);
  }

  // =====================
  // TOURS FUNCTIONALITY
  // =====================

  async function fetchAndShowTours(apiToken) {
    try {
      const currentUrl = window.location.href;
      const lang = getUserLanguage();
      const response = await fetch(
        `${API_URL}/api/public/tours?url=${encodeURIComponent(currentUrl)}&lang=${lang}`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      const tours = data.tours || [];

      if (tours.length > 0 && tours[0].steps?.length > 0) {
        currentTour = tours[0];
        currentStepIndex = 0;
        
        let shouldShow = false;
        
        // Use server-side tracking if userId is available
        if (userConfig.userId) {
          const tourIds = tours.map(t => t.id);
          serverViewsCache.tours = await fetchUserViews('tour', tourIds);
          shouldShow = shouldShowContentServer(currentTour, 'tour');
        } else {
          // Fall back to chrome.storage.local
          const frequencyType = currentTour.frequency_type || 'once';
          const storageKey = `tourlayer_tour_${currentTour.id}`;
          const result = await chrome.storage.local.get([storageKey]);
          const storageData = result[storageKey] || { viewCount: 0, lastSeen: null };
          const now = Date.now();
          
          switch (frequencyType) {
            case 'once':
              shouldShow = storageData.viewCount === 0;
              break;
            case 'always':
              shouldShow = true;
              break;
            case 'count':
              shouldShow = storageData.viewCount < (currentTour.frequency_count || 1);
              break;
            case 'days':
              const cooldownMs = (currentTour.frequency_days || 7) * 24 * 60 * 60 * 1000;
              const timeSince = storageData.lastSeen ? (now - storageData.lastSeen) : Infinity;
              shouldShow = timeSince >= cooldownMs;
              break;
            default:
              shouldShow = storageData.viewCount === 0;
          }
        }
        
        if (shouldShow) {
          showDebugBadge(`Tour: ${currentTour.name}`, '#22c55e');
          setTimeout(() => showStep(currentStepIndex), 500);
        }
      }
    } catch (error) {
      console.error('TourLayer: Error fetching tours', error);
    }
  }

  // =====================
  // TOOLTIPS FUNCTIONALITY
  // =====================

  async function fetchAndShowTooltips(apiToken) {
    try {
      const currentUrl = window.location.href;
      const lang = getUserLanguage();
      const response = await fetch(
        `${API_URL}/api/public/tooltips?url=${encodeURIComponent(currentUrl)}&lang=${lang}`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) return;

      const tooltipsData = await response.json();
      const tooltips = tooltipsData.tooltips || [];

      console.log('TourLayer: Found', tooltips.length, 'tooltips');

      if (tooltips.length > 0) {
        activeTooltips = tooltips;
        
        // Fetch server views if userId is available
        if (userConfig.userId) {
          const tooltipIds = tooltips.map(t => t.id);
          serverViewsCache.tooltips = await fetchUserViews('tooltip', tooltipIds);
        }
        
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
      host.id = 'tourlayer-tooltip-container';
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
    activeTooltips.forEach(tooltip => renderTooltipBeacon(tooltip));
  }

  function renderTooltipBeacon(tooltip) {
    // Use server-side tracking if userId is available
    if (userConfig.userId) {
      if (shouldShowContentServer(tooltip, 'tooltip')) {
        createBeacon(tooltip);
      }
      return;
    }
    
    // Fall back to chrome.storage.local for anonymous users
    const frequencyType = tooltip.frequency_type || (tooltip.show_once ? 'once' : 'always');
    const storageKey = `tourlayer_tooltip_${tooltip.id}`;
    
    chrome.storage.local.get([storageKey], (result) => {
      const data = result[storageKey] || { viewCount: 0, lastSeen: null };
      const now = Date.now();
      
      let shouldShow = false;
      
      switch (frequencyType) {
        case 'once':
          shouldShow = data.viewCount === 0;
          break;
          
        case 'always':
          shouldShow = true;
          break;
          
        case 'count':
          const maxCount = tooltip.frequency_count || 1;
          shouldShow = data.viewCount < maxCount;
          break;
          
        case 'days':
          const daysCooldown = tooltip.frequency_days || 7;
          const cooldownMs = daysCooldown * 24 * 60 * 60 * 1000;
          const timeSinceLastSeen = data.lastSeen ? (now - data.lastSeen) : Infinity;
          shouldShow = timeSinceLastSeen >= cooldownMs;
          break;
          
        default:
          shouldShow = data.viewCount === 0;
      }
      
      if (shouldShow) {
        createBeacon(tooltip);
      }
    });
  }

  function createBeacon(tooltip) {
    // Check if beacon already exists for this tooltip
    const existingBeacon = document.querySelector(`[data-tooltip-id="${tooltip.id}"]`);
    if (existingBeacon) {
      console.log('TourLayer: Beacon already exists for tooltip', tooltip.id);
      return;
    }

    // Find target element
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

    // Apply delay if set
    const delay = tooltip.delay_ms || 0;
    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      
      // Get size - supports both numeric and legacy string values
      const sizeMap = { small: 10, medium: 16, large: 24 };
      const rawSize = tooltip.icon_size;
      const size = typeof rawSize === 'number' ? rawSize : (sizeMap[rawSize] || 16);
      
      // Calculate beacon position using edge + offset + Y offset
      const beaconPos = getBeaconPositionEdge(rect, tooltip.icon_edge || 'right', tooltip.icon_offset || 0, size, tooltip.icon_offset_y || 0);
      
      // Create beacon element
      const beacon = document.createElement('div');
      beacon.className = 'tourlayer-beacon';
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
      
      // Create beacon inner (pulsing dot)
      if (tooltip.icon_type !== 'none') {
        const dot = document.createElement('div');
        dot.className = `tourlayer-beacon-${tooltip.icon_type || 'pulse'}`;
        dot.style.cssText = `
          width: 100%;
          height: 100%;
          background: ${tooltip.icon_color || '#3b82f6'};
          border-radius: 50%;
          ${tooltip.icon_type === 'pulse' ? `animation: tourlayer-pulse 2s infinite;` : ''}
        `;
        beacon.appendChild(dot);
      }
      
      // Add event listener based on trigger type
      if (tooltip.trigger_type === 'hover') {
        // Hover on beacon
        beacon.addEventListener('mouseenter', () => showTooltipCard(tooltip, element));
        beacon.addEventListener('mouseleave', (e) => {
          setTimeout(() => {
            if (!tooltipContainer.querySelector('.tourlayer-card:hover')) {
              hideTooltipCard(tooltip.id);
            }
          }, 200);
        });
        
        // ALSO hover on the target element itself
        element.addEventListener('mouseenter', () => showTooltipCard(tooltip, element));
        element.addEventListener('mouseleave', (e) => {
          setTimeout(() => {
            const card = tooltipContainer.querySelector('.tourlayer-card:hover');
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
      const sizeMapForUpdate = { small: 10, medium: 16, large: 24 };
      const rawSizeForUpdate = tooltip.icon_size;
      const sizeForUpdate = typeof rawSizeForUpdate === 'number' ? rawSizeForUpdate : (sizeMapForUpdate[rawSizeForUpdate] || 16);
      const updatePosition = () => {
        const newRect = element.getBoundingClientRect();
        const newPos = getBeaconPositionEdge(newRect, tooltip.icon_edge || 'right', tooltip.icon_offset || 0, sizeForUpdate, tooltip.icon_offset_y || 0);
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
    // Hide any open tooltip
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
    
    // Create card
    const card = document.createElement('div');
    card.className = 'tourlayer-card';
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
    `;
    
    card.innerHTML = `
      <button class="tourlayer-card-close" data-action="close">&times;</button>
      ${tooltip.image_url ? `<img src="${escapeHtml(tooltip.image_url)}" class="tourlayer-card-image" style="border-radius: ${Math.max(0, cardBorderRadius - 4)}px ${Math.max(0, cardBorderRadius - 4)}px 0 0;" alt="">` : ''}
      <div class="tourlayer-card-content" style="color: ${cardTextColor}; padding: ${cardPadding}px;">
        <h3 class="tourlayer-card-title">${escapeHtml(tooltip.title)}</h3>
        ${tooltip.body ? `<p class="tourlayer-card-body">${escapeHtml(tooltip.body)}</p>` : ''}
        <button class="tourlayer-card-btn" style="background: ${buttonColor}; color: ${buttonTextColor}; border-radius: ${buttonBorderRadius}px; margin-top: 12px; padding: 10px 20px; border: none; cursor: pointer; font-weight: 500; width: ${tooltip.text_align === 'center' ? '100%' : 'auto'};" data-action="dismiss">
          ${escapeHtml(tooltip.button_text || 'Got it')}
        </button>
      </div>
    `;
    
    // Position card based on beacon edge (opposite side)
    const edge = tooltip.icon_edge || 'right';
    let top, left;
    const gap = 16; // Space between element and card
    
    switch (edge) {
      case 'top':
        // Beacon on top, card below
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - cardWidth / 2;
        break;
      case 'bottom':
        // Beacon on bottom, card above (estimate card height ~200px)
        top = rect.top - gap - 200;
        left = rect.left + rect.width / 2 - cardWidth / 2;
        break;
      case 'left':
        // Beacon on left, card on right
        top = rect.top + rect.height / 2 - 100;
        left = rect.right + gap;
        break;
      case 'right':
      default:
        // Beacon on right, card on left
        top = rect.top + rect.height / 2 - 100;
        left = rect.left - cardWidth - gap;
        break;
    }
    
    // Keep within viewport
    left = Math.max(16, Math.min(left, window.innerWidth - cardWidth - 16));
    top = Math.max(16, top);
    
    card.style.top = `${top}px`;
    card.style.left = `${left}px`;
    
    // Event listeners
    card.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'close' || action === 'dismiss') {
        dismissTooltip(tooltip);
      }
    });
    
    // Handle dismiss type
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
    
    // Hover behavior for hover-triggered tooltips
    if (tooltip.trigger_type === 'hover') {
      card.addEventListener('mouseleave', () => hideTooltipCard(tooltip.id));
    }
    
    tooltipContainer.appendChild(card);
  }

  function hideTooltipCard(tooltipId) {
    if (tooltipId) {
      const card = tooltipContainer.querySelector(`.tourlayer-card[data-tooltip-id="${tooltipId}"]`);
      if (card) card.remove();
      if (openTooltipId === tooltipId) openTooltipId = null;
    } else {
      tooltipContainer.querySelectorAll('.tourlayer-card').forEach(c => c.remove());
      openTooltipId = null;
    }
  }

  function dismissTooltip(tooltip) {
    hideTooltipCard(tooltip.id);
    
    // Remove beacon
    const beacon = tooltipContainer.querySelector(`.tourlayer-beacon[data-tooltip-id="${tooltip.id}"]`);
    if (beacon) beacon.remove();
    
    // Record view (server-side if userId configured, otherwise chrome.storage)
    if (userConfig.userId) {
      recordServerView('tooltip', tooltip.id);
    } else {
      const storageKey = `tourlayer_tooltip_${tooltip.id}`;
      chrome.storage.local.get([storageKey], (result) => {
        const data = result[storageKey] || { viewCount: 0, lastSeen: null };
        chrome.storage.local.set({
          [storageKey]: {
            viewCount: data.viewCount + 1,
            lastSeen: Date.now()
          }
        });
      });
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
      
      .tourlayer-beacon {
        transition: transform 0.2s;
      }
      
      .tourlayer-beacon:hover {
        transform: scale(1.2);
      }
      
      .tourlayer-beacon-pulse {
        animation: tourlayer-pulse 2s infinite;
      }
      
      .tourlayer-beacon-beacon {
        animation: tourlayer-beacon 1.5s infinite;
      }
      
      .tourlayer-beacon-dot {
        /* No animation */
      }
      
      @keyframes tourlayer-pulse {
        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
        70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
      }
      
      @keyframes tourlayer-beacon {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.8); }
      }
      
      .tourlayer-card {
        animation: tourlayer-fade-in 0.2s ease-out;
      }
      
      @keyframes tourlayer-fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .tourlayer-card-close {
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
      
      .tourlayer-card-close:hover {
        background: rgba(0, 0, 0, 0.2);
      }
      
      .tourlayer-card-image {
        width: 100%;
        max-height: 150px;
        object-fit: cover;
      }
      
      .tourlayer-card-content {
        padding: 16px;
      }
      
      .tourlayer-card-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      
      .tourlayer-card-body {
        font-size: 14px;
        line-height: 1.5;
        opacity: 0.8;
      }
      
      .tourlayer-card-footer {
        padding: 12px 16px;
        border-top: 1px solid #eee;
      }
      
      .tourlayer-card-btn {
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
      
      .tourlayer-card-btn:hover {
        opacity: 0.9;
      }
    `;
  }

  // =====================
  // TOUR RENDERING (existing code)
  // =====================

  function createContainer(zIndex = 2147483647) {
    if (tourContainer) {
      const host = document.getElementById('tourlayer-container');
      if (host) host.style.zIndex = zIndex.toString();
      return tourContainer;
    }

    const host = document.createElement('div');
    host.id = 'tourlayer-container';
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

  function showStep(index) {
    if (!currentTour || !currentTour.steps || index >= currentTour.steps.length) {
      endTour();
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
      console.warn('TourLayer: Invalid selector:', step.selector, e);
    }

    if (!element) {
      setTimeout(() => {
        let retryElement = null;
        try {
          retryElement = document.querySelector(step.selector);
        } catch (e) {}
        
        if (retryElement) {
          renderStep(step, retryElement, index);
        } else {
          renderCenteredStep(step, index);
        }
      }, 1000);
      return;
    }

    renderStep(step, element, index);
  }

  function renderCenteredStep(step, index) {
    const zIndex = step.z_index || 2147483647;
    const container = createContainer(zIndex);
    container.innerHTML = '';

    const totalSteps = currentTour.steps.length;
    const isLastStep = index === totalSteps - 1;
    const isFirstStep = index === 0;

    // Get tour styling with defaults
    const styling = {
      cardBgColor: currentTour.card_bg_color || '#ffffff',
      cardTextColor: currentTour.card_text_color || '#1f2937',
      cardBorderRadius: currentTour.card_border_radius || 12,
      cardPadding: currentTour.card_padding || 20,
      cardShadow: currentTour.card_shadow || '0 4px 20px rgba(0,0,0,0.15)',
      buttonColor: currentTour.button_color || '#3b82f6',
      buttonTextColor: currentTour.button_text_color || '#ffffff',
      buttonBorderRadius: currentTour.button_border_radius || 8,
    };

    const overlay = document.createElement('div');
    overlay.className = 'tourlayer-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 1;';
    container.appendChild(overlay);

    const tooltip = document.createElement('div');
    tooltip.className = 'tourlayer-tooltip';
    tooltip.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 2;
      background: ${styling.cardBgColor};
      border-radius: ${styling.cardBorderRadius}px;
      box-shadow: ${styling.cardShadow};
      overflow: hidden;
    `;
    
    tooltip.innerHTML = `
      <button class="tourlayer-close" data-action="close">&times;</button>
      <div class="tourlayer-tooltip-header" style="background: ${styling.buttonColor};">
        <div class="tourlayer-tooltip-title">${escapeHtml(step.title)}</div>
        <div class="tourlayer-tooltip-step">Step ${index + 1} of ${totalSteps}</div>
      </div>
      <div class="tourlayer-tooltip-body" style="padding: ${styling.cardPadding}px; color: ${styling.cardTextColor};">
        ${step.image_url ? `<img src="${escapeHtml(step.image_url)}" class="tourlayer-tooltip-image" style="border-radius: ${Math.max(0, styling.cardBorderRadius - 4)}px;" alt="">` : ''}
        <div class="tourlayer-tooltip-content">${escapeHtml(step.content)}</div>
      </div>
      <div class="tourlayer-tooltip-footer">
        <button class="tourlayer-btn tourlayer-btn-skip" data-action="skip">Skip tour</button>
        <div style="display: flex; gap: 8px;">
          ${!isFirstStep ? '<button class="tourlayer-btn tourlayer-btn-secondary" data-action="prev">Back</button>' : ''}
          <button class="tourlayer-btn tourlayer-btn-primary" style="background: ${styling.buttonColor}; color: ${styling.buttonTextColor}; border-radius: ${styling.buttonBorderRadius}px;" data-action="next">
            ${isLastStep ? 'Finish' : step.button_text || 'Next'}
          </button>
        </div>
      </div>
    `;

    container.appendChild(tooltip);
    tooltip.addEventListener('click', handleTooltipClick);
  }

  function renderStep(step, element, index) {
    const zIndex = step.z_index || 2147483647;
    const container = createContainer(zIndex);
    container.innerHTML = '';

    // Get tour styling with defaults
    const styling = {
      cardBgColor: currentTour.card_bg_color || '#ffffff',
      cardTextColor: currentTour.card_text_color || '#1f2937',
      cardBorderRadius: currentTour.card_border_radius || 12,
      cardPadding: currentTour.card_padding || 20,
      cardShadow: currentTour.card_shadow || '0 4px 20px rgba(0,0,0,0.15)',
      buttonColor: currentTour.button_color || '#3b82f6',
      buttonTextColor: currentTour.button_text_color || '#ffffff',
      buttonBorderRadius: currentTour.button_border_radius || 8,
    };

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      const updatedRect = element.getBoundingClientRect();
      
      const highlight = document.createElement('div');
      highlight.className = 'tourlayer-highlight';
      highlight.style.cssText = `
        top: ${updatedRect.top - 4}px;
        left: ${updatedRect.left - 4}px;
        width: ${updatedRect.width + 8}px;
        height: ${updatedRect.height + 8}px;
      `;
      container.appendChild(highlight);

      const tooltip = document.createElement('div');
      tooltip.className = 'tourlayer-tooltip';
      tooltip.style.cssText = `
        background: ${styling.cardBgColor};
        border-radius: ${styling.cardBorderRadius}px;
        box-shadow: ${styling.cardShadow};
      `;
      
      const totalSteps = currentTour.steps.length;
      const isLastStep = index === totalSteps - 1;
      const isFirstStep = index === 0;

      tooltip.innerHTML = `
        <button class="tourlayer-close" data-action="close">&times;</button>
        <div class="tourlayer-tooltip-header" style="background: ${styling.buttonColor};">
          <div class="tourlayer-tooltip-title">${escapeHtml(step.title)}</div>
          <div class="tourlayer-tooltip-step">Step ${index + 1} of ${totalSteps}</div>
        </div>
        <div class="tourlayer-tooltip-body" style="padding: ${styling.cardPadding}px; color: ${styling.cardTextColor};">
          ${step.image_url ? `<img src="${escapeHtml(step.image_url)}" class="tourlayer-tooltip-image" style="border-radius: ${Math.max(0, styling.cardBorderRadius - 4)}px;" alt="">` : ''}
          <div class="tourlayer-tooltip-content">${escapeHtml(step.content)}</div>
        </div>
        <div class="tourlayer-tooltip-footer">
          <button class="tourlayer-btn tourlayer-btn-skip" data-action="skip">Skip tour</button>
          <div style="display: flex; gap: 8px;">
            ${!isFirstStep ? '<button class="tourlayer-btn tourlayer-btn-secondary" data-action="prev">Back</button>' : ''}
            <button class="tourlayer-btn tourlayer-btn-primary" style="background: ${styling.buttonColor}; color: ${styling.buttonTextColor}; border-radius: ${styling.buttonBorderRadius}px;" data-action="next">
              ${isLastStep ? 'Finish' : step.button_text || 'Next'}
            </button>
          </div>
        </div>
      `;

      positionTooltip(tooltip, updatedRect, step.placement || 'bottom');
      container.appendChild(tooltip);
      tooltip.addEventListener('click', handleTooltipClick);

    }, 300);
  }

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

    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
    top = Math.max(padding, top);

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

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

  function endTour(completed = false) {
    if (tourContainer) {
      tourContainer.innerHTML = '';
    }

    if (currentTour && completed) {
      // Record view (server-side if userId configured, otherwise chrome.storage)
      if (userConfig.userId) {
        recordServerView('tour', currentTour.id);
      } else {
        const storageKey = `tourlayer_tour_${currentTour.id}`;
        chrome.storage.local.get([storageKey], (result) => {
          const data = result[storageKey] || { viewCount: 0, lastSeen: null };
          chrome.storage.local.set({
            [storageKey]: {
              viewCount: data.viewCount + 1,
              lastSeen: Date.now()
            }
          });
        });
      }
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
