// Background service worker for TourLayer extension

console.log('TourLayer Extension background worker loaded');

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FETCH_TOURS') {
    // Fetch tours from API
    chrome.storage.local.get(['apiToken'], async (result) => {
      if (!result.apiToken) {
        sendResponse({ error: 'No API token' });
        return;
      }

      try {
        const response = await fetch(`${message.apiUrl}/public/tours?url=${message.url}`, {
          headers: {
            'X-API-Token': result.apiToken,
          },
        });

        const tours = await response.json();
        sendResponse({ tours });
      } catch (error) {
        sendResponse({ error: error.message });
      }
    });

    return true; // Keep channel open for async response
  }
});

