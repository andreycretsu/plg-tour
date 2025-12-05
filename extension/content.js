// Walko Content Script - Renders tours and tooltips on matching websites
(function() {
  // Prevent multiple injections - also check for embed script
  if (window.__tourLayerInitialized || window.__WalkoLoaded) {
    console.log('Walko Extension: Skipping - already initialized or embed script present');
    return;
  }
  window.__tourLayerInitialized = true;

  const API_URL = 'https://www.cleaqops.com';
  
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
        console.log('Walko Extension: Using configured locale:', locale);
        return locale;
      }
    }
    
    // 2. Fall back to browser language detection
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    const code = browserLang.split('-')[0].toLowerCase();
    
    // 3. Return supported language or default to English
    const finalLang = supported.includes(code) ? code : 'en';
    console.log('Walko Extension: Detected language:', finalLang, '(from:', browserLang, ')');
    return finalLang;
  }
  
  // Replace personalization variables in text
  function replaceVariables(text) {
    if (!text) return text;
    
    // Get first and last name from userName if available
    let firstName = '';
    let lastName = '';
    let fullName = userConfig.userName || '';
    
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }
    
    // Also check for separate firstName/lastName in config
    if (window.WalkoConfig) {
      firstName = window.WalkoConfig.firstName || firstName;
      lastName = window.WalkoConfig.lastName || lastName;
      fullName = window.WalkoConfig.userName || fullName || `${firstName} ${lastName}`.trim();
    }
    
    // Replace all variables (case-insensitive matching for flexibility)
    return text
      .replace(/\{\{firstName\}\}/gi, firstName)
      .replace(/\{\{lastName\}\}/gi, lastName)
      .replace(/\{\{userName\}\}/gi, fullName)
      .replace(/\{\{user_name\}\}/gi, fullName)
      .replace(/\{\{first_name\}\}/gi, firstName)
      .replace(/\{\{last_name\}\}/gi, lastName);
  }
  
  // Get user config from page (if set by website)
  function getUserConfig() {
    if (window.WalkoConfig) {
      userConfig.userId = window.WalkoConfig.userId || null;
      userConfig.userEmail = window.WalkoConfig.userEmail || null;
      userConfig.userName = window.WalkoConfig.userName || null;
      userConfig.userLocale = window.WalkoConfig.userLocale || null;
      if (userConfig.userId) {
        console.log('Walko Extension: User identified from WalkoConfig:', userConfig.userId);
      }
      if (userConfig.userLocale) {
        console.log('Walko Extension: Locale from WalkoConfig:', userConfig.userLocale);
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
      console.warn('Walko: Failed to fetch user views', error);
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
      console.warn('Walko: Failed to record view', error);
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
    badge.id = 'walko-debug-badge';
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
    badge.textContent = `🎯 Walko: ${status}`;
    
    const existing = document.getElementById('walko-debug-badge');
    if (existing) existing.remove();
    
    document.body.appendChild(badge);
    
    if (!color.includes('ef4444')) {
      setTimeout(() => badge.remove(), 5000);
    }
  }

  // Initialize
  async function init() {
    console.log('Walko: Initializing on', window.location.href);
    showDebugBadge('Loading...', '#6366f1');
    
    // Check for user config from page
    getUserConfig();
    
    // Don't run on Walko web app itself
    if (window.location.hostname.includes('cleaqops') || 
        window.location.hostname.includes('plg-tour') || 
        (window.location.hostname.includes('vercel.app') && window.location.pathname.includes('/tours'))) {
      console.log('Walko: Skipping on Walko app');
      showDebugBadge('Skipped (Walko app)', '#64748b');
      return;
    }
    
    const result = await chrome.storage.local.get(['apiToken']);
    
    if (!result.apiToken) {
      console.log('Walko: No API token configured');
      showDebugBadge('No API token! Connect in popup', '#ef4444');
      return;
    }
    
    // Store token globally
    apiToken = result.apiToken;

    console.log('Walko: API token found, fetching content...');
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
          const storageKey = `walko_tour_${currentTour.id}`;
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
      console.error('Walko: Error fetching tours', error);
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

      console.log('Walko: Found', tooltips.length, 'tooltips');

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
      console.error('Walko: Error fetching tooltips', error);
    }
  }

  function initTooltips() {
    // Create tooltip container
    if (!tooltipContainer) {
      const host = document.createElement('div');
      host.id = 'walko-tooltip-container';
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
    const storageKey = `walko_tooltip_${tooltip.id}`;
    
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
      console.log('Walko: Beacon already exists for tooltip', tooltip.id);
      return;
    }

    // Find target element
    let element;
    try {
      element = document.querySelector(tooltip.selector);
    } catch (e) {
      console.warn('Walko: Invalid tooltip selector:', tooltip.selector);
      return;
    }

    if (!element) {
      console.warn('Walko: Tooltip element not found:', tooltip.selector);
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
      beacon.className = 'walko-beacon';
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
      
      // Create beacon inner based on icon type
      if (tooltip.icon_type !== 'none') {
        const iconType = tooltip.icon_type || 'pulse_dot';
        const isAnimated = iconType.startsWith('pulse_') || iconType === 'pulse';
        const iconShape = iconType.replace('pulse_', '').replace('static_', '') || 'dot';
        const iconColor = tooltip.icon_color || '#3b82f6';
        
        const iconWrapper = document.createElement('div');
        iconWrapper.style.cssText = `
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          ${isAnimated ? 'animation: walko-pulse 2s infinite;' : ''}
        `;
        
        if (iconShape === 'dot' || iconShape === 'beacon' || iconShape === 'pulse') {
          // Dot
          const dot = document.createElement('div');
          dot.style.cssText = `
            width: 100%;
            height: 100%;
            background: ${iconColor};
            border-radius: 50%;
          `;
          iconWrapper.appendChild(dot);
        } else if (iconShape === 'star') {
          // Star SVG
          iconWrapper.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="${iconColor}"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
        } else if (iconShape === 'sparkle') {
          // Sparkle SVG
          iconWrapper.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="${iconColor}"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/></svg>`;
        } else if (iconShape === 'wand') {
          // Magic wand SVG
          iconWrapper.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="${iconColor}"><path d="M7.5 5.6L10 7L8.6 4.5L10 2L7.5 3.4L5 2L6.4 4.5L5 7L7.5 5.6ZM19.5 15.4L17 14L18.4 16.5L17 19L19.5 17.6L22 19L20.6 16.5L22 14L19.5 15.4ZM22 2L20.6 4.5L22 7L19.5 5.6L17 7L18.4 4.5L17 2L19.5 3.4L22 2ZM14.37 7.29C13.98 6.9 13.35 6.9 12.96 7.29L1.29 18.96C0.9 19.35 0.9 19.98 1.29 20.37L3.63 22.71C4.02 23.1 4.65 23.1 5.04 22.71L16.71 11.04C17.1 10.65 17.1 10.02 16.71 9.63L14.37 7.29Z"/></svg>`;
        } else {
          // Default to dot
          const dot = document.createElement('div');
          dot.style.cssText = `
            width: 100%;
            height: 100%;
            background: ${iconColor};
            border-radius: 50%;
          `;
          iconWrapper.appendChild(dot);
        }
        
        beacon.appendChild(iconWrapper);
      }
      
      // Add event listener based on trigger type
      if (tooltip.trigger_type === 'hover') {
        // Hover on beacon
        beacon.addEventListener('mouseenter', () => showTooltipCard(tooltip, element));
        beacon.addEventListener('mouseleave', (e) => {
          setTimeout(() => {
            if (!tooltipContainer.querySelector('.walko-card:hover')) {
              hideTooltipCard(tooltip.id);
            }
          }, 200);
        });
        
        // ALSO hover on the target element itself
        element.addEventListener('mouseenter', () => showTooltipCard(tooltip, element));
        element.addEventListener('mouseleave', (e) => {
          setTimeout(() => {
            const card = tooltipContainer.querySelector('.walko-card:hover');
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
    card.className = 'walko-card';
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
    
    // Apply variable replacement for personalization
    const displayTitle = replaceVariables(tooltip.title);
    const displayBody = replaceVariables(tooltip.body);
    const displayButtonText = replaceVariables(tooltip.button_text || 'Got it');
    
    card.innerHTML = `
      <button class="walko-card-close" data-action="close">&times;</button>
      ${tooltip.image_url ? `<img src="${escapeHtml(tooltip.image_url)}" class="walko-card-image" style="border-radius: ${Math.max(0, cardBorderRadius - 4)}px ${Math.max(0, cardBorderRadius - 4)}px 0 0;" alt="">` : ''}
      <div class="walko-card-content" style="color: ${cardTextColor}; padding: ${cardPadding}px;">
        <h3 class="walko-card-title">${escapeHtml(displayTitle)}</h3>
        ${displayBody ? `<p class="walko-card-body">${escapeHtml(displayBody)}</p>` : ''}
        <button class="walko-card-btn" style="background: ${buttonColor}; color: ${buttonTextColor}; border-radius: ${buttonBorderRadius}px; margin-top: 12px; padding: 10px 20px; border: none; cursor: pointer; font-weight: 500; width: ${tooltip.text_align === 'center' ? '100%' : 'auto'};" data-action="dismiss">
          ${escapeHtml(displayButtonText)}
        </button>
      </div>
    `;
    
    // Position card relative to the BEACON (not the element)
    const edge = tooltip.icon_edge || 'right';
    const iconSize = tooltip.icon_size || 16;
    const iconOffset = tooltip.icon_offset || 0;
    const iconOffsetY = tooltip.icon_offset_y || 0;
    let top, left;
    const gap = tooltip.card_gap || 12; // Space between beacon and card
    const cardPosOffset = tooltip.card_offset_y || 0; // Card offset along axis
    const cardHeight = 250; // Estimated card height
    
    // First, calculate beacon position (same logic as createBeacon)
    let beaconX, beaconY;
    switch (edge) {
      case 'top':
        beaconX = rect.left + rect.width / 2 + iconOffsetY;
        beaconY = rect.top - iconSize / 2 - iconOffset;
        break;
      case 'bottom':
        beaconX = rect.left + rect.width / 2 + iconOffsetY;
        beaconY = rect.bottom - iconSize / 2 + iconOffset;
        break;
      case 'left':
        beaconX = rect.left - iconSize / 2 - iconOffset;
        beaconY = rect.top + rect.height / 2 + iconOffsetY;
        break;
      case 'right':
      default:
        beaconX = rect.right - iconSize / 2 + iconOffset;
        beaconY = rect.top + rect.height / 2 + iconOffsetY;
        break;
    }
    
    // Now position card relative to beacon (on opposite side of element)
    switch (edge) {
      case 'top':
        // Beacon on top, card below beacon
        top = beaconY + iconSize + gap;
        left = beaconX - cardWidth / 2 + cardPosOffset;
        // If no room below, put above
        if (top + cardHeight > window.innerHeight) {
          top = beaconY - gap - cardHeight;
        }
        break;
      case 'bottom':
        // Beacon on bottom, card above beacon
        top = beaconY - gap - cardHeight;
        left = beaconX - cardWidth / 2 + cardPosOffset;
        // If no room above, put below
        if (top < 16) {
          top = beaconY + iconSize + gap;
        }
        break;
      case 'left':
        // Beacon on left, card to right of beacon
        top = beaconY - cardHeight / 2 + cardPosOffset;
        left = beaconX + iconSize + gap;
        // If no room on right, put on left
        if (left + cardWidth > window.innerWidth - 16) {
          left = beaconX - cardWidth - gap;
        }
        break;
      case 'right':
      default:
        // Beacon on right, card to left of beacon
        top = beaconY - cardHeight / 2 + cardPosOffset;
        left = beaconX - cardWidth - gap;
        // If no room on left, put on right
        if (left < 16) {
          left = beaconX + iconSize + gap;
        }
        break;
    }
    
    // Final viewport bounds check
    left = Math.max(16, Math.min(left, window.innerWidth - cardWidth - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - cardHeight - 16));
    
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
      const card = tooltipContainer.querySelector(`.walko-card[data-tooltip-id="${tooltipId}"]`);
      if (card) card.remove();
      if (openTooltipId === tooltipId) openTooltipId = null;
    } else {
      tooltipContainer.querySelectorAll('.walko-card').forEach(c => c.remove());
      openTooltipId = null;
    }
  }

  function dismissTooltip(tooltip) {
    hideTooltipCard(tooltip.id);
    
    // Remove beacon
    const beacon = tooltipContainer.querySelector(`.walko-beacon[data-tooltip-id="${tooltip.id}"]`);
    if (beacon) beacon.remove();
    
    // Record view (server-side if userId configured, otherwise chrome.storage)
    if (userConfig.userId) {
      recordServerView('tooltip', tooltip.id);
    } else {
      const storageKey = `walko_tooltip_${tooltip.id}`;
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
      
      .walko-beacon {
        transition: transform 0.2s;
      }
      
      .walko-beacon:hover {
        transform: scale(1.2);
      }
      
      .walko-beacon-pulse {
        animation: walko-pulse 2s infinite;
      }
      
      .walko-beacon-beacon {
        animation: walko-beacon 1.5s infinite;
      }
      
      .walko-beacon-dot {
        /* No animation */
      }
      
      @keyframes walko-pulse {
        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
        70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
      }
      
      @keyframes walko-beacon {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.8); }
      }
      
      .walko-card {
        animation: walko-fade-in 0.2s ease-out;
      }
      
      @keyframes walko-fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .walko-card-close {
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
      
      .walko-card-close:hover {
        background: rgba(0, 0, 0, 0.2);
      }
      
      .walko-card-image {
        width: 100%;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        display: block;
        background: #f3f4f6;
      }
      
      .walko-card-content {
        padding: 16px;
      }
      
      .walko-card-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      
      .walko-card-body {
        font-size: 14px;
        line-height: 1.5;
        opacity: 0.8;
      }
      
      .walko-card-footer {
        padding: 12px 16px;
        border-top: 1px solid #eee;
      }
      
      .walko-card-btn {
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
      
      .walko-card-btn:hover {
        opacity: 0.9;
      }
    `;
  }

  // =====================
  // TOUR RENDERING (existing code)
  // =====================

  function createContainer(zIndex = 2147483647) {
    if (tourContainer) {
      const host = document.getElementById('walko-container');
      if (host) host.style.zIndex = zIndex.toString();
      return tourContainer;
    }

    const host = document.createElement('div');
    host.id = 'walko-container';
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
      
      .walko-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1;
      }
      
      .walko-highlight {
        position: fixed;
        box-shadow: 0 0 0 4px #3b82f6, 0 0 0 9999px rgba(0, 0, 0, 0.5);
        border-radius: 4px;
        z-index: 2;
        pointer-events: none;
        transition: all 0.3s ease;
      }
      
      .walko-tooltip {
        position: fixed;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        max-width: 320px;
        z-index: 4;
        overflow: hidden;
      }
      
      .walko-tooltip-header {
        padding: 16px 20px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
      }
      
      .walko-tooltip-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      .walko-tooltip-step {
        font-size: 12px;
        opacity: 0.8;
      }
      
      .walko-tooltip-body {
        padding: 16px 20px;
      }
      
      .walko-tooltip-content {
        font-size: 14px;
        color: #374151;
        line-height: 1.6;
      }
      
      .walko-tooltip-image {
        width: 100%;
        max-height: 150px;
        object-fit: cover;
        margin-bottom: 12px;
        border-radius: 8px;
      }
      
      .walko-tooltip-footer {
        padding: 12px 20px;
        background: #f9fafb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      
      .walko-btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }
      
      .walko-btn-secondary {
        background: #e5e7eb;
        color: #374151;
      }
      
      .walko-btn-secondary:hover {
        background: #d1d5db;
      }
      
      .walko-btn-primary {
        background: #3b82f6;
        color: white;
      }
      
      .walko-btn-primary:hover {
        background: #2563eb;
      }
      
      .walko-btn-skip {
        background: transparent;
        color: #6b7280;
        padding: 8px;
      }
      
      .walko-btn-skip:hover {
        color: #374151;
      }
      
      .walko-close {
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
      
      .walko-close:hover {
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
      console.warn('Walko: Invalid selector:', step.selector, e);
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
    overlay.className = 'walko-overlay';
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 1;';
    container.appendChild(overlay);

    const tooltip = document.createElement('div');
    tooltip.className = 'walko-tooltip';
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
    
    // Apply variable replacement for personalization
    const displayTitle = replaceVariables(step.title);
    const displayContent = replaceVariables(step.content);
    
    tooltip.innerHTML = `
      <button class="walko-close" data-action="close">&times;</button>
      <div class="walko-tooltip-header" style="background: ${styling.buttonColor};">
        <div class="walko-tooltip-title">${escapeHtml(displayTitle)}</div>
        <div class="walko-tooltip-step">Step ${index + 1} of ${totalSteps}</div>
      </div>
      <div class="walko-tooltip-body" style="padding: ${styling.cardPadding}px; color: ${styling.cardTextColor};">
        ${step.image_url ? `<img src="${escapeHtml(step.image_url)}" class="walko-tooltip-image" style="border-radius: ${Math.max(0, styling.cardBorderRadius - 4)}px;" alt="">` : ''}
        <div class="walko-tooltip-content">${escapeHtml(displayContent)}</div>
      </div>
      <div class="walko-tooltip-footer">
        <button class="walko-btn walko-btn-skip" data-action="skip">Skip tour</button>
        <div style="display: flex; gap: 8px;">
          ${!isFirstStep ? '<button class="walko-btn walko-btn-secondary" data-action="prev">Back</button>' : ''}
          <button class="walko-btn walko-btn-primary" style="background: ${styling.buttonColor}; color: ${styling.buttonTextColor}; border-radius: ${styling.buttonBorderRadius}px;" data-action="next">
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
      highlight.className = 'walko-highlight';
      highlight.style.cssText = `
        top: ${updatedRect.top - 4}px;
        left: ${updatedRect.left - 4}px;
        width: ${updatedRect.width + 8}px;
        height: ${updatedRect.height + 8}px;
      `;
      container.appendChild(highlight);

      const tooltip = document.createElement('div');
      tooltip.className = 'walko-tooltip';
      tooltip.style.cssText = `
        background: ${styling.cardBgColor};
        border-radius: ${styling.cardBorderRadius}px;
        box-shadow: ${styling.cardShadow};
      `;
      
      const totalSteps = currentTour.steps.length;
      const isLastStep = index === totalSteps - 1;
      const isFirstStep = index === 0;

      // Apply variable replacement for personalization
      const displayStepTitle = replaceVariables(step.title);
      const displayStepContent = replaceVariables(step.content);
      
      tooltip.innerHTML = `
        <button class="walko-close" data-action="close">&times;</button>
        <div class="walko-tooltip-header" style="background: ${styling.buttonColor};">
          <div class="walko-tooltip-title">${escapeHtml(displayStepTitle)}</div>
          <div class="walko-tooltip-step">Step ${index + 1} of ${totalSteps}</div>
        </div>
        <div class="walko-tooltip-body" style="padding: ${styling.cardPadding}px; color: ${styling.cardTextColor};">
          ${step.image_url ? `<img src="${escapeHtml(step.image_url)}" class="walko-tooltip-image" style="border-radius: ${Math.max(0, styling.cardBorderRadius - 4)}px;" alt="">` : ''}
          <div class="walko-tooltip-content">${escapeHtml(displayStepContent)}</div>
        </div>
        <div class="walko-tooltip-footer">
          <button class="walko-btn walko-btn-skip" data-action="skip">Skip tour</button>
          <div style="display: flex; gap: 8px;">
            ${!isFirstStep ? '<button class="walko-btn walko-btn-secondary" data-action="prev">Back</button>' : ''}
            <button class="walko-btn walko-btn-primary" style="background: ${styling.buttonColor}; color: ${styling.buttonTextColor}; border-radius: ${styling.buttonBorderRadius}px;" data-action="next">
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
        const storageKey = `walko_tour_${currentTour.id}`;
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
