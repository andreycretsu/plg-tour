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
      startElementPicker(sender.tab?.id).then(sendResponse);
      return true;

    case 'ELEMENT_SELECTED':
      // Forward selected element to any listening tabs (web app)
      broadcastToWebApp({
        type: 'ELEMENT_PICKED',
        selector: message.selector,
        tagName: message.tagName,
        text: message.text,
        rect: message.rect
      });
      sendResponse({ success: true });
      break;

    case 'PICKER_CLOSED':
      broadcastToWebApp({ type: 'PICKER_CANCELLED' });
      sendResponse({ success: true });
      break;

    case 'VALIDATE_TOKEN':
      validateToken(message.token).then(sendResponse);
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

// Broadcast message to web app tabs
async function broadcastToWebApp(message) {
  try {
    const tabs = await chrome.tabs.query({ url: `${apiUrl}/*` });
    
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, message);
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
        } catch (e2) {
          console.log('Could not send to tab:', tab.id);
        }
      }
    }
  } catch (error) {
    console.error('Failed to broadcast:', error);
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
