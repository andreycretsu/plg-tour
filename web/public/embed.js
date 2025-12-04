/**
 * TourLayer Embed Script
 * Add this to your website to show product tours and tooltips to all visitors
 * 
 * Usage (basic):
 * <script src="https://plg-tour.vercel.app/embed.js" data-token="YOUR_API_TOKEN"></script>
 * 
 * Usage (with user tracking - recommended for "show once" to work across devices):
 * <script>
 *   window.TourLayerConfig = {
 *     token: 'YOUR_API_TOKEN',
 *     userId: 'user_123',        // Required for cross-device tracking
 *     userEmail: 'user@example.com', // Optional
 *     userName: 'John Doe'       // Optional
 *   };
 * </script>
 * <script src="https://plg-tour.vercel.app/embed.js"></script>
 */

(function() {
  'use strict';

  // Prevent multiple initializations - also check for Chrome extension
  if (window.__TourLayerLoaded || window.__tourLayerInitialized) {
    console.log('TourLayer Embed: Skipping - already initialized or extension present');
    return;
  }
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
  
  // User identification for server-side tracking
  let userConfig = {
    userId: null,
    userEmail: null,
    userName: null,
    userLocale: null // Override browser language detection
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
        console.log('TourLayer: Using configured locale:', locale);
        return locale;
      }
    }
    
    // 2. Fall back to browser language detection
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    const code = browserLang.split('-')[0].toLowerCase();
    
    // 3. Return supported language or default to English
    const finalLang = supported.includes(code) ? code : 'en';
    console.log('TourLayer: Detected language:', finalLang, '(from:', browserLang, ')');
    return finalLang;
  }
  
  // Alias for backwards compatibility
  function getBrowserLanguage() {
    return getUserLanguage();
  }

  // Get API token and user config
  function getConfig() {
    let token = null;
    
    // Method 1: Check for global config (preferred for user tracking)
    if (window.TourLayerConfig) {
      token = window.TourLayerConfig.token;
      userConfig.userId = window.TourLayerConfig.userId || null;
      userConfig.userEmail = window.TourLayerConfig.userEmail || null;
      userConfig.userName = window.TourLayerConfig.userName || null;
      userConfig.userLocale = window.TourLayerConfig.userLocale || null;
      
      if (token) {
        console.log('TourLayer: Config found in TourLayerConfig', userConfig.userId ? '(with user tracking)' : '(anonymous)', userConfig.userLocale ? `(locale: ${userConfig.userLocale})` : '');
        return token;
      }
    }
    
    // Method 2: Find script by src containing our domain or embed.js
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const src = script.getAttribute('src') || '';
      if (src.includes('plg-tour') || src.includes('embed.js') || src.includes('tourlayer')) {
        token = script.getAttribute('data-token');
        // Also check for user data in script attributes
        userConfig.userId = script.getAttribute('data-user-id') || userConfig.userId;
        userConfig.userEmail = script.getAttribute('data-user-email') || userConfig.userEmail;
        userConfig.userName = script.getAttribute('data-user-name') || userConfig.userName;
        
        if (token) {
          console.log('TourLayer: Token found in script tag', userConfig.userId ? '(with user tracking)' : '(anonymous)');
          return token;
        }
      }
    }
    
    // Method 3: Check current script
    if (document.currentScript) {
      token = document.currentScript.getAttribute('data-token');
      if (token) {
        console.log('TourLayer: Token found in currentScript');
        return token;
      }
    }
    
    return null;
  }
  
  // Fetch user views from server (for server-side tracking)
  async function fetchUserViews(contentType, contentIds) {
    if (!userConfig.userId || !contentIds.length) return {};
    
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
  async function recordView(contentType, contentId) {
    if (!userConfig.userId) {
      // Fall back to localStorage for anonymous users
      const storageKey = `tourlayer_${contentType}_${contentId}`;
      const stored = localStorage.getItem(storageKey);
      const data = stored ? JSON.parse(stored) : { viewCount: 0, lastSeen: null };
      localStorage.setItem(storageKey, JSON.stringify({
        viewCount: data.viewCount + 1,
        lastSeen: Date.now()
      }));
      return;
    }
    
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
            userAgent: navigator.userAgent
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
  
  // Check if content should be shown based on frequency settings
  function shouldShowContent(content, contentType) {
    const frequencyType = content.frequency_type || (content.show_once ? 'once' : 'always');
    
    // Server-side tracking (when userId is provided)
    if (userConfig.userId) {
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
    
    // Fall back to localStorage for anonymous users
    const storageKey = `tourlayer_${contentType}_${content.id}`;
    const stored = localStorage.getItem(storageKey);
    const data = stored ? JSON.parse(stored) : { viewCount: 0, lastSeen: null };
    const now = Date.now();
    
    switch (frequencyType) {
      case 'once':
        return data.viewCount === 0;
      case 'always':
        return true;
      case 'count':
        return data.viewCount < (content.frequency_count || 1);
      case 'days':
        const cooldownMs = (content.frequency_days || 7) * 24 * 60 * 60 * 1000;
        const timeSince = data.lastSeen ? (now - data.lastSeen) : Infinity;
        return timeSince >= cooldownMs;
      default:
        return data.viewCount === 0;
    }
  }

  // Initialize
  async function init() {
    console.log('TourLayer: Initializing embed on', window.location.href);
    
    apiToken = getConfig();
    
    if (!apiToken) {
      console.warn('TourLayer: No API token found. Add data-token="YOUR_TOKEN" to the script tag.');
      console.warn('TourLayer: Example: <script src="https://plg-tour.vercel.app/embed.js" data-token="tl_xxx"></script>');
      return;
    }

    if (!userConfig.userId) {
      console.warn('TourLayer: No userId configured. "Show once" will only work per browser, not per user.');
      console.warn('TourLayer: For cross-device tracking, set window.TourLayerConfig.userId before loading the script.');
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
      const lang = getBrowserLanguage();
      
      const response = await fetch(
        `${API_URL}/api/public/tours?url=${encodeURIComponent(currentUrl)}&lang=${lang}`,
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

      const toursData = await response.json();
      const tours = toursData.tours || [];

      console.log('TourLayer: Found', tours.length, 'tours');

      if (tours.length > 0 && tours[0].steps?.length > 0) {
        currentTour = tours[0];
        currentStepIndex = 0;
        
        // Fetch user views from server if userId is configured
        if (userConfig.userId) {
          const tourIds = tours.map(t => t.id);
          serverViewsCache.tours = await fetchUserViews('tour', tourIds);
        }
        
        // Check if tour should be shown
        if (shouldShowContent(currentTour, 'tour')) {
          setTimeout(() => showStep(currentStepIndex), 500);
        } else {
          console.log('TourLayer: Tour skipped due to frequency settings');
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
      const lang = getBrowserLanguage();
      
      const response = await fetch(
        `${API_URL}/api/public/tooltips?url=${encodeURIComponent(currentUrl)}&lang=${lang}`,
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

      const tooltipsData = await response.json();
      const tooltips = tooltipsData.tooltips || [];

      console.log('TourLayer: Found', tooltips.length, 'tooltips');

      if (tooltips.length > 0) {
        activeTooltips = tooltips;
        
        // Fetch user views from server if userId is configured
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

    // Render beacons for each tooltip based on frequency settings
    activeTooltips.forEach(tooltip => {
      if (shouldShowContent(tooltip, 'tooltip')) {
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
      // Support both numeric and legacy string sizes
      const sizeMap = { small: 10, medium: 16, large: 24 };
      const rawSize = tooltip.icon_size;
      const size = typeof rawSize === 'number' ? rawSize : (sizeMap[rawSize] || 16);
      
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
          ${isAnimated ? 'animation: tl-pulse 2s infinite;' : ''}
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
    
    // Position card relative to the BEACON (not the element)
    const edge = tooltip.icon_edge || 'right';
    const iconSize = tooltip.icon_size || 16;
    const iconOffset = tooltip.icon_offset || 0;
    const iconOffsetY = tooltip.icon_offset_y || 0;
    let top, left;
    const gap = tooltip.card_gap || 12; // Space between beacon and card
    const cardPosOffset = tooltip.card_offset_y || 0; // Card offset along axis
    const cardHeight = 250; // Estimated card height
    
    // First, calculate beacon position
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
    
    // Now position card relative to beacon
    switch (edge) {
      case 'top':
        top = beaconY + iconSize + gap;
        left = beaconX - cardWidth / 2 + cardPosOffset;
        if (top + cardHeight > window.innerHeight) {
          top = beaconY - gap - cardHeight;
        }
        break;
      case 'bottom':
        top = beaconY - gap - cardHeight;
        left = beaconX - cardWidth / 2 + cardPosOffset;
        if (top < 16) {
          top = beaconY + iconSize + gap;
        }
        break;
      case 'left':
        top = beaconY - cardHeight / 2 + cardPosOffset;
        left = beaconX + iconSize + gap;
        if (left + cardWidth > window.innerWidth - 16) {
          left = beaconX - cardWidth - gap;
        }
        break;
      case 'right':
      default:
        top = beaconY - cardHeight / 2 + cardPosOffset;
        left = beaconX - cardWidth - gap;
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
    
    // Record view (server-side if userId configured, otherwise localStorage)
    recordView('tooltip', tooltip.id);
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
        aspect-ratio: 16 / 9;
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
        aspect-ratio: 16 / 9;
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
      // Record view (server-side if userId configured, otherwise localStorage)
      recordView('tour', currentTour.id);
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
  // Expose API for runtime control
  window.TourLayer = {
    // Identify user (can be called after initial load)
    identify: (userId, userEmail, userName) => {
      userConfig.userId = userId;
      userConfig.userEmail = userEmail || null;
      userConfig.userName = userName || null;
      console.log('TourLayer: User identified', userId);
    },
    
    // Get current user
    getUser: () => ({ ...userConfig }),
    
    // Reset view tracking
    reset: (id) => {
      if (id) {
        localStorage.removeItem(`tourlayer_tour_${id}`);
        localStorage.removeItem(`tourlayer_tooltip_${id}`);
      }
      // Clear server cache
      serverViewsCache = { tours: {}, tooltips: {} };
      console.log('TourLayer: Reset complete');
    },
    
    // Refresh content (re-fetch and re-render)
    refresh: async () => {
      // Clear existing
      if (tooltipContainer) tooltipContainer.innerHTML = '';
      if (tourContainer) tourContainer.innerHTML = '';
      activeTooltips = [];
      currentTour = null;
      
      // Re-fetch
      await Promise.all([
        fetchAndShowTours(),
        fetchAndShowTooltips()
      ]);
      console.log('TourLayer: Refreshed');
    },
    
    version: '2.0.0'
  };

})();
