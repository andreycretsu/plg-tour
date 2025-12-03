/**
 * Background Service Worker
 * Handles extension lifecycle and communication
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('TourLayer Extension installed');
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_ACTIVE_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({ tab: tabs[0] });
      }
    });
    return true; // Keep channel open for async response
  }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Could auto-start tours here based on URL matching
    console.log('Tab updated:', tab.url);
  }
});

export {};

