// TourLayer Background Script - Handles API communication and picker

let apiToken = null;
let apiUrl = 'https://plg-tour.vercel.app';
let pickerCallback = null;

// Load saved token on startup
chrome.storage.local.get(['apiToken', 'apiUrl'], (result) => {
  if (result.apiToken) {
    apiToken = result.apiToken;
  }
  if (result.apiUrl) {
    apiUrl = result.apiUrl;
  }
});

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  switch (message.type) {
    case 'SET_API_TOKEN':
      apiToken = message.token;
      chrome.storage.local.set({ apiToken: message.token });
      sendResponse({ success: true });
      break;

    case 'SET_API_URL':
      apiUrl = message.url;
      chrome.storage.local.set({ apiUrl: message.url });
      sendResponse({ success: true });
      break;

    case 'GET_CONFIG':
      sendResponse({ apiToken, apiUrl });
      break;

    case 'FETCH_TOURS':
      fetchTours(message.url).then(sendResponse);
      return true; // Async response

    case 'START_PICKER':
      // If targetUrl is provided, open it in new tab first
      if (message.targetUrl) {
        openUrlAndStartPicker(message.targetUrl).then(sendResponse);
      } else {
        startElementPicker(sender.tab?.id).then(sendResponse);
      }
      return true;

    case 'ELEMENT_SELECTED':
      // Forward selected element to any listening tabs (web app)
      console.log('Element selected:', message.selector);
      broadcastToWebApp({
        type: 'ELEMENT_PICKED',
        selector: message.selector,
        tagName: message.tagName,
        text: message.text,
        rect: message.rect
      });
      
      // Switch back to the web app tab
      switchToWebAppTab();
      
      sendResponse({ success: true });
      break;

    case 'PICKER_CLOSED':
      broadcastToWebApp({ type: 'PICKER_CANCELLED' });
      sendResponse({ success: true });
      break;

    case 'VALIDATE_TOKEN':
      validateToken(message.token).then(sendResponse);
      return true;

    case 'CAPTURE_SCREENSHOT':
      captureScreenshot(message.targetUrl, message.selector).then(sendResponse);
      return true;
  }
});

// Fetch tours from API
async function fetchTours(pageUrl) {
  if (!apiToken) {
    return { success: false, error: 'No API token configured' };
  }

  try {
    const response = await fetch(`${apiUrl}/api/public/tours?url=${encodeURIComponent(pageUrl)}`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, tours: data.tours || [] };
  } catch (error) {
    console.error('Failed to fetch tours:', error);
    return { success: false, error: error.message };
  }
}

// Validate API token
async function validateToken(token) {
  try {
    const response = await fetch(`${apiUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, user: data.user };
    } else {
      return { success: false, error: 'Invalid token' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Open URL in new tab and start picker
async function openUrlAndStartPicker(targetUrl) {
  try {
    console.log('Opening URL for picker:', targetUrl);
    
    // Create a new tab with the target URL
    const tab = await chrome.tabs.create({ 
      url: targetUrl,
      active: true 
    });

    // Wait for the tab to finish loading
    await new Promise((resolve) => {
      const listener = (tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }, 30000);
    });

    // Small delay to ensure page is fully ready
    await new Promise(r => setTimeout(r, 500));

    // Inject picker script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['picker.js']
    });

    return { success: true, tabId: tab.id };
  } catch (error) {
    console.error('Failed to open URL and start picker:', error);
    return { success: false, error: error.message };
  }
}

// Start element picker on current tab
async function startElementPicker(tabId) {
  try {
    // Get current active tab if not provided
    if (!tabId) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      tabId = tab.id;
    }

    // Inject picker script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['picker.js']
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to start picker:', error);
    return { success: false, error: error.message };
  }
}

// Broadcast message to web app tabs (any Vercel deployment)
async function broadcastToWebApp(message) {
  try {
    // Search for ALL vercel.app tabs that might be TourLayer
    const tabs = await chrome.tabs.query({ url: 'https://*.vercel.app/*' });
    
    // Also check localhost for development
    const localTabs = await chrome.tabs.query({ url: 'http://localhost:3000/*' });
    const allTabs = [...tabs, ...localTabs];
    
    console.log('Broadcasting to tabs:', allTabs.length);
    
    for (const tab of allTabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, message);
        console.log('Sent message to tab:', tab.id, tab.url);
      } catch (e) {
        // Tab might not have content script, inject it
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (msg) => {
              window.postMessage({ source: 'tourlayer-extension', ...msg }, '*');
            },
            args: [message]
          });
          console.log('Injected message to tab:', tab.id);
        } catch (e2) {
          console.log('Could not send to tab:', tab.id, e2.message);
        }
      }
    }
  } catch (error) {
    console.error('Failed to broadcast:', error);
  }
}

// Capture screenshot of a URL with optional element highlight
async function captureScreenshot(targetUrl, selector) {
  try {
    console.log('Capturing screenshot for:', targetUrl, 'selector:', selector);
    
    // Find existing tab with the URL or create new one
    let tab;
    const existingTabs = await chrome.tabs.query({ url: targetUrl + '*' });
    
    if (existingTabs.length > 0) {
      tab = existingTabs[0];
    } else {
      // Create a new tab with the target URL
      tab = await chrome.tabs.create({ 
        url: targetUrl,
        active: true 
      });
      
      // Wait for the tab to finish loading
      await new Promise((resolve) => {
        const listener = (tabId, changeInfo) => {
          if (tabId === tab.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
        
        // Timeout after 15 seconds
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }, 15000);
      });
    }
    
    // Make the tab active and focus its window
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
    
    // Wait for focus to take effect
    await new Promise(r => setTimeout(r, 500));
    
    // Re-query the tab to get updated info
    tab = await chrome.tabs.get(tab.id);
    console.log('Tab ready:', tab.id, tab.url, 'active:', tab.active);
    
    // Get element position if selector provided
    let elementRect = null;
    if (selector) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (sel) => {
            const el = document.querySelector(sel);
            if (el) {
              const rect = el.getBoundingClientRect();
              return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                top: rect.top,
                left: rect.left
              };
            }
            return null;
          },
          args: [selector]
        });
        elementRect = results[0]?.result;
      } catch (e) {
        console.log('Could not get element rect:', e);
      }
    }
    
    // Capture the screenshot using null for current window
    console.log('Attempting captureVisibleTab for window:', tab.windowId);
    const screenshot = await chrome.tabs.captureVisibleTab(null, {
      format: 'png'
    });
    console.log('Screenshot captured successfully');
    
    // Get viewport dimensions
    const viewportResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => ({
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY
      })
    });
    const viewport = viewportResults[0]?.result;
    
    return { 
      success: true, 
      screenshot,
      elementRect,
      viewport,
      url: tab.url
    };
  } catch (error) {
    console.error('Failed to capture screenshot:', error);
    return { success: false, error: error.message };
  }
}

// Switch back to web app tab after element selection
async function switchToWebAppTab() {
  try {
    // Find web app tabs
    const tabs = await chrome.tabs.query({ url: 'https://*.vercel.app/*' });
    const localTabs = await chrome.tabs.query({ url: 'http://localhost:3000/*' });
    const allTabs = [...tabs, ...localTabs];
    
    // Find a tab that looks like TourLayer (includes tours, tooltips, or dashboard)
    const tourLayerTab = allTabs.find(tab => 
      tab.url.includes('/tours') || 
      tab.url.includes('/tooltips') || 
      tab.url.includes('/dashboard')
    );
    
    if (tourLayerTab) {
      await chrome.tabs.update(tourLayerTab.id, { active: true });
      console.log('Switched to web app tab:', tourLayerTab.id);
    }
  } catch (error) {
    console.error('Failed to switch tabs:', error);
  }
}

// Handle external messages (from web app)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('External message from:', sender.origin, message);

  if (message.type === 'START_PICKER') {
    // Web app is requesting to start picker
    startPickerFromWebApp(sender.tab?.id).then(sendResponse);
    return true;
  }

  if (message.type === 'PING') {
    sendResponse({ success: true, version: '2.0.0' });
  }
});

async function startPickerFromWebApp(webAppTabId) {
  try {
    // Get the currently active tab (should be the target website)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || tab.id === webAppTabId) {
      return { success: false, error: 'Please open the target website in another tab first' };
    }

    // Inject picker
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['picker.js']
    });

    return { success: true, targetTab: tab.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
