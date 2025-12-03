import { createRoot } from 'react-dom/client';
import { App } from './App';
// @ts-ignore - Vite CSS inline import
import styles from './styles.css?inline';

/**
 * Shadow DOM Rendering System
 * This is the critical piece that isolates our extension UI from the host page
 */

class TourLayerExtension {
  private shadowRoot: ShadowRoot | null = null;
  private container: HTMLDivElement | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.mount());
    } else {
      this.mount();
    }
  }

  private mount() {
    // Create container in the actual DOM
    this.container = document.createElement('div');
    this.container.id = 'tourlayer-root';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999997;
    `;

    // Attach shadow root
    this.shadowRoot = this.container.attachShadow({ mode: 'open' });

    // Create style element and inject CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    this.shadowRoot.appendChild(styleElement);

    // Create React root inside shadow DOM
    const appContainer = document.createElement('div');
    appContainer.id = 'tourlayer-app';
    appContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `;

    // Enable pointer events for interactive elements
    appContainer.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('.tourlayer-sidebar') ||
        target.closest('.tourlayer-card') ||
        target.closest('.tourlayer-beacon')
      ) {
        appContainer.style.pointerEvents = 'auto';
      } else {
        appContainer.style.pointerEvents = 'none';
      }
    });

    this.shadowRoot.appendChild(appContainer);

    // Mount React app
    const root = createRoot(appContainer);
    root.render(<App />);

    // Append to body
    document.body.appendChild(this.container);

    console.log('✅ TourLayer Extension initialized');
  }

  public unmount() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// Initialize extension
new TourLayerExtension();

// Export for potential cleanup
export {};

