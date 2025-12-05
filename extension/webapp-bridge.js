// Walko Web App Bridge
// This script runs on the Walko web app to enable communication with the extension

(function() {
  console.log('Walko Bridge: Initializing...');

  // Listen for messages from the web app
  window.addEventListener('message', async (event) => {
    // Only accept messages from the same origin
    if (event.source !== window) return;
    
    const message = event.data;
    
    // Only handle Walko messages
    if (!message || message.source !== 'walko-webapp') return;

    console.log('Walko Bridge: Received message from webapp', message);

    switch (message.type) {
      case 'START_PICKER':
        // Forward to background script with target URL
        chrome.runtime.sendMessage({ 
          type: 'START_PICKER',
          targetUrl: message.targetUrl,
          stepId: message.stepId
        }, (response) => {
          window.postMessage({
            source: 'walko-extension',
            type: 'PICKER_STARTED',
            ...response
          }, '*');
        });
        break;

      case 'GET_STATUS':
        // Check if extension is connected
        chrome.storage.local.get(['apiToken'], (result) => {
          window.postMessage({
            source: 'walko-extension',
            type: 'STATUS_RESPONSE',
            connected: !!result.apiToken
          }, '*');
        });
        break;

      case 'CAPTURE_SCREENSHOT':
        // Forward screenshot request to background script
        chrome.runtime.sendMessage({ 
          type: 'CAPTURE_SCREENSHOT',
          targetUrl: message.targetUrl,
          selector: message.selector
        }, (response) => {
          window.postMessage({
            source: 'walko-extension',
            type: 'SCREENSHOT_CAPTURED',
            ...response
          }, '*');
        });
        break;

      case 'PING':
        window.postMessage({
          source: 'walko-extension',
          type: 'PONG',
          version: '2.0.0'
        }, '*');
        break;
    }
  });

  // Listen for messages from background script (e.g., element selected)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Walko Bridge: Received message from background', message);
    
    // Forward to web app
    window.postMessage({
      source: 'walko-extension',
      ...message
    }, '*');
    
    sendResponse({ received: true });
  });

  // Announce extension is available
  window.postMessage({
    source: 'walko-extension',
    type: 'EXTENSION_READY',
    version: '2.0.0'
  }, '*');

  console.log('Walko Bridge: Ready!');
})();

