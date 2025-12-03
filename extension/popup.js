// TourLayer Popup Script

const API_URL = 'https://plg-tour.vercel.app';

// DOM Elements
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const userInfo = document.getElementById('userInfo');
const tokenSection = document.getElementById('tokenSection');
const toolsSection = document.getElementById('toolsSection');
const tokenInput = document.getElementById('tokenInput');
const connectBtn = document.getElementById('connectBtn');
const pickerBtn = document.getElementById('pickerBtn');
const dashboardBtn = document.getElementById('dashboardBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// State
let isConnected = false;
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await checkConnection();
  setupEventListeners();
});

// Check if already connected
async function checkConnection() {
  try {
    const result = await chrome.storage.local.get(['apiToken']);
    
    if (result.apiToken) {
      // Validate token
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${result.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConnected(true, data.user);
      } else {
        // Token invalid, clear it
        await chrome.storage.local.remove(['apiToken']);
        setConnected(false);
      }
    } else {
      setConnected(false);
    }
  } catch (error) {
    console.error('Connection check failed:', error);
    setConnected(false);
  }
}

// Update UI based on connection state
function setConnected(connected, user = null) {
  isConnected = connected;
  currentUser = user;

  if (connected && user) {
    statusDot.classList.add('connected');
    statusText.textContent = 'Connected';
    userInfo.textContent = `Logged in as ${user.email}`;
    tokenSection.classList.add('hidden');
    toolsSection.classList.remove('hidden');
  } else {
    statusDot.classList.remove('connected');
    statusText.textContent = 'Not Connected';
    userInfo.textContent = '';
    tokenSection.classList.remove('hidden');
    toolsSection.classList.add('hidden');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Connect button
  connectBtn.addEventListener('click', handleConnect);

  // Token input - connect on Enter
  tokenInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleConnect();
    }
  });

  // Picker button
  pickerBtn.addEventListener('click', handleStartPicker);

  // Dashboard button
  dashboardBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: `${API_URL}/dashboard` });
  });

  // Disconnect button
  disconnectBtn.addEventListener('click', handleDisconnect);
}

// Handle connect
async function handleConnect() {
  const token = tokenInput.value.trim();
  
  if (!token) {
    showError('Please enter your API token');
    return;
  }

  connectBtn.disabled = true;
  connectBtn.textContent = 'Connecting...';
  hideMessages();

  try {
    // Validate token with API
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // Save token
      await chrome.storage.local.set({ apiToken: token });
      
      // Update background script
      chrome.runtime.sendMessage({ type: 'SET_API_TOKEN', token });
      
      showSuccess('Connected successfully!');
      setConnected(true, data.user);
      tokenInput.value = '';
    } else {
      showError('Invalid API token. Please check and try again.');
    }
  } catch (error) {
    console.error('Connect error:', error);
    showError('Failed to connect. Please try again.');
  } finally {
    connectBtn.disabled = false;
    connectBtn.textContent = '🔗 Connect';
  }
}

// Handle disconnect
async function handleDisconnect() {
  await chrome.storage.local.remove(['apiToken']);
  chrome.runtime.sendMessage({ type: 'SET_API_TOKEN', token: null });
  setConnected(false);
  showSuccess('Disconnected');
}

// Handle start picker
async function handleStartPicker() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showError('No active tab found');
      return;
    }

    // Check if it's a restricted page
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showError('Cannot pick elements on Chrome system pages');
      return;
    }

    // Inject picker script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['picker.js']
    });

    // Close popup
    window.close();
  } catch (error) {
    console.error('Failed to start picker:', error);
    showError('Failed to start picker: ' + error.message);
  }
}

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  successMessage.style.display = 'none';
}

// Show success message
function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.style.display = 'block';
  errorMessage.style.display = 'none';
}

// Hide all messages
function hideMessages() {
  errorMessage.style.display = 'none';
  successMessage.style.display = 'none';
}
