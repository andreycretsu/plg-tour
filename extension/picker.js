// Element Picker - Visual selector tool
(function() {
  // Prevent multiple injections
  if (window.__tourLayerPickerActive) {
    return;
  }
  window.__tourLayerPickerActive = true;

  let overlay = null;
  let highlightBox = null;
  let selectorDisplay = null;
  let currentElement = null;

  // Generate a unique CSS selector for an element
  function generateSelector(element) {
    if (!element || element === document.body || element === document.documentElement) {
      return 'body';
    }

    // Priority 1: ID (most reliable)
    if (element.id && !element.id.match(/^\d/) && !element.id.includes(':')) {
      return `#${CSS.escape(element.id)}`;
    }

    // Priority 2: data-testid or data-cy (test attributes)
    const testId = element.getAttribute('data-testid') || 
                   element.getAttribute('data-cy') || 
                   element.getAttribute('data-test');
    if (testId) {
      return `[data-testid="${testId}"]`;
    }

    // Priority 3: data-bs-original-title or other meaningful data attributes
    const bsTitle = element.getAttribute('data-bs-original-title');
    if (bsTitle) {
      return `[data-bs-original-title="${bsTitle}"]`;
    }

    // Priority 4: name attribute (for form elements)
    if (element.name && ['input', 'select', 'textarea', 'button'].includes(element.tagName.toLowerCase())) {
      return `${element.tagName.toLowerCase()}[name="${element.name}"]`;
    }

    // Priority 5: Unique class combination
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\s+/).filter(c => {
        // Filter out dynamic/utility classes
        return c && 
               !c.match(/^(tw-|hover:|focus:|active:|lg:|md:|sm:|xs:)/) &&
               !c.match(/^\d/) &&
               c.length < 30;
      });
      
      if (classes.length > 0) {
        const selector = '.' + classes.slice(0, 3).map(c => CSS.escape(c)).join('.');
        const matches = document.querySelectorAll(selector);
        if (matches.length === 1) {
          return selector;
        }
      }
    }

    // Priority 6: Tag + aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      return `${element.tagName.toLowerCase()}[aria-label="${ariaLabel}"]`;
    }

    // Priority 7: Tag + title
    const title = element.getAttribute('title');
    if (title) {
      return `${element.tagName.toLowerCase()}[title="${title}"]`;
    }

    // Priority 8: Build path from parent
    const path = [];
    let el = element;
    
    while (el && el !== document.body && path.length < 4) {
      let selector = el.tagName.toLowerCase();
      
      if (el.id && !el.id.match(/^\d/) && !el.id.includes(':')) {
        selector = `#${CSS.escape(el.id)}`;
        path.unshift(selector);
        break;
      }
      
      // Add nth-child if needed
      const parent = el.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(el) + 1;
          selector += `:nth-child(${index})`;
        }
      }
      
      path.unshift(selector);
      el = parent;
    }
    
    return path.join(' > ');
  }

  // Create picker UI
  function createPickerUI() {
    // Create overlay
    overlay = document.createElement('div');
    overlay.id = 'walko-picker-overlay';
    overlay.innerHTML = `
      <style>
        #walko-picker-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 2147483646;
          cursor: crosshair;
        }
        #walko-highlight-box {
          position: fixed;
          pointer-events: none;
          border: 2px solid #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          z-index: 2147483647;
          transition: all 0.1s ease;
        }
        #walko-picker-toolbar {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #1e293b;
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          z-index: 2147483647;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 400px;
          max-width: 600px;
        }
        #walko-picker-toolbar h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #3b82f6;
        }
        #walko-selector-display {
          background: #0f172a;
          padding: 10px 14px;
          border-radius: 6px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 13px;
          color: #22c55e;
          word-break: break-all;
          min-height: 20px;
        }
        #walko-picker-buttons {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        #walko-picker-buttons button {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        #walko-btn-cancel {
          background: #475569;
          color: white;
        }
        #walko-btn-cancel:hover {
          background: #64748b;
        }
        #walko-btn-select {
          background: #3b82f6;
          color: white;
        }
        #walko-btn-select:hover {
          background: #2563eb;
        }
        #walko-btn-select:disabled {
          background: #1e40af;
          opacity: 0.5;
          cursor: not-allowed;
        }
        #walko-picker-hint {
          font-size: 12px;
          color: #94a3b8;
        }
      </style>
      <div id="walko-highlight-box"></div>
      <div id="walko-picker-toolbar">
        <h3>🎯 Walko Element Picker</h3>
        <p id="walko-picker-hint">Hover over any element and click to select it</p>
        <div id="walko-selector-display">Move mouse over an element...</div>
        <div id="walko-picker-buttons">
          <button id="walko-btn-cancel">Cancel (Esc)</button>
          <button id="walko-btn-select" disabled>Select Element</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    highlightBox = document.getElementById('walko-highlight-box');
    selectorDisplay = document.getElementById('walko-selector-display');
    
    // Event listeners
    overlay.addEventListener('mousemove', handleMouseMove);
    overlay.addEventListener('click', handleClick);
    document.getElementById('walko-btn-cancel').addEventListener('click', cleanup);
    document.getElementById('walko-btn-select').addEventListener('click', confirmSelection);
    document.addEventListener('keydown', handleKeyDown);
  }

  function handleMouseMove(e) {
    // Get element under cursor (need to temporarily hide overlay)
    overlay.style.pointerEvents = 'none';
    const element = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = 'auto';
    
    if (element && 
        element !== overlay && 
        !element.id?.startsWith('walko-') &&
        !element.closest('#walko-picker-overlay')) {
      currentElement = element;
      
      // Update highlight box
      const rect = element.getBoundingClientRect();
      highlightBox.style.left = rect.left + 'px';
      highlightBox.style.top = rect.top + 'px';
      highlightBox.style.width = rect.width + 'px';
      highlightBox.style.height = rect.height + 'px';
      highlightBox.style.display = 'block';
      
      // Update selector display
      const selector = generateSelector(element);
      selectorDisplay.textContent = selector;
      
      // Enable select button
      document.getElementById('walko-btn-select').disabled = false;
    }
  }

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (currentElement) {
      confirmSelection();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      cleanup();
    } else if (e.key === 'Enter' && currentElement) {
      confirmSelection();
    }
  }

  function confirmSelection() {
    if (!currentElement) return;
    
    const selector = generateSelector(currentElement);
    const rect = currentElement.getBoundingClientRect();
    
    // Show success feedback
    const toolbar = document.getElementById('walko-picker-toolbar');
    if (toolbar) {
      toolbar.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
          <h3 style="color: #22c55e; margin: 0 0 8px 0;">Element Selected!</h3>
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">Selector: <code style="background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #22c55e;">${selector}</code></p>
          <p style="color: #64748b; font-size: 12px; margin-top: 12px;">Returning to Walko...</p>
        </div>
      `;
    }
    
    // Hide the highlight box
    if (highlightBox) {
      highlightBox.style.display = 'none';
    }
    
    // Send selector back to extension/web app
    chrome.runtime.sendMessage({
      type: 'ELEMENT_SELECTED',
      selector: selector,
      tagName: currentElement.tagName.toLowerCase(),
      text: currentElement.textContent?.slice(0, 50) || '',
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      }
    });
    
    // Delay cleanup so user can see the success message
    setTimeout(() => {
      cleanup();
    }, 1500);
  }

  function cleanup() {
    window.__tourLayerPickerActive = false;
    document.removeEventListener('keydown', handleKeyDown);
    if (overlay) {
      overlay.remove();
    }
    
    // Notify that picker was closed
    chrome.runtime.sendMessage({ type: 'PICKER_CLOSED' });
  }

  // Initialize
  createPickerUI();
})();

