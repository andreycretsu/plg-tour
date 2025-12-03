// TourLayer Web App Bridge
// This script runs on the TourLayer web app to enable communication with the extension

(function() {
  console.log('TourLayer Bridge: Initializing...');

  // Listen for messages from the web app
  window.addEventListener('message', async (event) => {
    // Only accept messages from the same origin
    if (event.source !== window) return;
    
    const message = event.data;
    
    // Only handle TourLayer messages
    if (!message || message.source !== 'tourlayer-webapp') return;

    console.log('TourLayer Bridge: Received message from webapp', message);

    switch (message.type) {
      case 'START_PICKER':
        // Forward to background script
        chrome.runtime.sendMessage({ type: 'START_PICKER' }, (response) => {
          window.postMessage({
            source: 'tourlayer-extension',
            type: 'PICKER_STARTED',
            ...response
          }, '*');
        });
        break;

      case 'GET_STATUS':
        // Check if extension is connected
        chrome.storage.local.get(['apiToken'], (result) => {
          window.postMessage({
            source: 'tourlayer-extension',
            type: 'STATUS_RESPONSE',
            connected: !!result.apiToken
          }, '*');
        });
        break;

      case 'PING':
        window.postMessage({
          source: 'tourlayer-extension',
          type: 'PONG',
          version: '2.0.0'
        }, '*');
        break;
    }
  });

  // Listen for messages from background script (e.g., element selected)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('TourLayer Bridge: Received message from background', message);
    
    // Forward to web app
    window.postMessage({
      source: 'tourlayer-extension',
      ...message
    }, '*');
    
    sendResponse({ received: true });
  });

  // Announce extension is available
  window.postMessage({
    source: 'tourlayer-extension',
    type: 'EXTENSION_READY',
    version: '2.0.0'
  }, '*');

  console.log('TourLayer Bridge: Ready!');
})();

