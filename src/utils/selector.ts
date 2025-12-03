/**
 * Robust Selector Generation Utility
 * Priority: id > data-testid > unique class > nth-child path
 */

export function generateSelector(element: HTMLElement): string {
  // Priority 1: Use ID if available
  if (element.id) {
    return `#${element.id}`;
  }

  // Priority 2: Use data-testid if available
  if (element.hasAttribute('data-testid')) {
    return `[data-testid="${element.getAttribute('data-testid')}"]`;
  }

  // Priority 3: Try to find unique class combination
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(' ').filter(c => c.trim());
    if (classes.length > 0) {
      const classSelector = classes.map(c => `.${c}`).join('');
      const matches = document.querySelectorAll(classSelector);
      if (matches.length === 1) {
        return classSelector;
      }
    }
  }

  // Priority 4: Build a path with nth-child
  return buildNthChildPath(element);
}

function buildNthChildPath(element: HTMLElement): string {
  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    // If we find an ID on the way up, use it as anchor
    if (current.id) {
      path.unshift(`#${current.id}`);
      break;
    }

    // Calculate nth-child position
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(current) + 1;
      const sameTagSiblings = siblings.filter(
        s => s.tagName === current!.tagName
      );

      if (sameTagSiblings.length > 1) {
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

/**
 * Find element by selector with retry logic
 * Useful for SPAs where elements load dynamically
 */
export function waitForElement(
  selector: string,
  timeout = 5000
): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Check if selector matches current URL pattern
 */
export function matchesUrlPattern(pattern: string, url: string): boolean {
  // Simple string match
  if (pattern === url) return true;

  // Wildcard match
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  
  try {
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(url);
  } catch {
    return false;
  }
}

