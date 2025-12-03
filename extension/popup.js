// Popup script for TourLayer extension

const API_URL = 'https://plg-tour.vercel.app/api';

// Elements
const notConnectedView = document.getElementById('notConnected');
const connectedView = document.getElementById('connected');
const apiTokenInput = document.getElementById('apiToken');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const tourCountElement = document.getElementById('tourCount');

// Check connection status on load
chrome.storage.local.get(['apiToken'], async (result) => {
  if (result.apiToken) {
    // Already connected
    showConnectedView(result.apiToken);
  } else {
    // Not connected
    showNotConnectedView();
  }
});

// Connect button
connectBtn.addEventListener('click', async () => {
  const apiToken = apiTokenInput.value.trim();
  
  if (!apiToken) {
    alert('Please enter your API token');
    return;
  }

  // Test the token by fetching tours
  try {
    connectBtn.textContent = 'Connecting...';
    connectBtn.disabled = true;

    const response = await fetch(`${API_URL}/public/tours`, {
      headers: {
        'X-API-Token': apiToken,
      },
    });

    if (!response.ok) {
      throw new Error('Invalid API token');
    }

    // Save token
    await chrome.storage.local.set({ apiToken });

    // Show success
    showConnectedView(apiToken);

    // Notify content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'TOKEN_UPDATED', apiToken });
    }
  } catch (error) {
    alert('Failed to connect. Please check your API token.');
    connectBtn.textContent = 'Connect';
    connectBtn.disabled = false;
  }
});

// Disconnect button
disconnectBtn.addEventListener('click', async () => {
  if (confirm('Are you sure you want to disconnect?')) {
    await chrome.storage.local.remove('apiToken');
    showNotConnectedView();
  }
});

// Show not connected view
function showNotConnectedView() {
  notConnectedView.classList.remove('hidden');
  connectedView.classList.add('hidden');
  apiTokenInput.value = '';
}

// Show connected view
async function showConnectedView(apiToken) {
  notConnectedView.classList.add('hidden');
  connectedView.classList.remove('hidden');

  // Fetch tour count
  try {
    const response = await fetch(`${API_URL}/public/tours`, {
      headers: {
        'X-API-Token': apiToken,
      },
    });

    if (response.ok) {
      const tours = await response.json();
      tourCountElement.textContent = tours.length;
    }
  } catch (error) {
    console.error('Failed to fetch tours:', error);
  }
}

