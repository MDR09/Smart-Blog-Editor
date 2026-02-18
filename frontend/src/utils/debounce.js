/**
 * Debounce function - DSA Implementation
 * 
 * Time Complexity: O(1) for each call
 * Space Complexity: O(1)
 * 
 * This creates a debounced version of a function that delays its execution
 * until after a specified wait time has elapsed since the last call.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
  let timeoutId = null;

  const debounced = function (...args) {
    // Clear the previous timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set a new timeout
    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  };

  // Add cancel method to clear pending execution
  debounced.cancel = function () {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Advanced debounce with leading and trailing edge options
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @param {Object} options - Configuration options
 * @param {boolean} options.leading - Execute on the leading edge
 * @param {boolean} options.trailing - Execute on the trailing edge (default)
 * @returns {Function} - Debounced function
 */
export function debounceAdvanced(func, wait, { leading = false, trailing = true } = {}) {
  let timeoutId = null;
  let lastCallTime = 0;

  const debounced = function (...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    const execute = () => {
      func.apply(this, args);
      lastCallTime = now;
    };

    // Clear previous timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Leading edge execution
    if (leading && timeSinceLastCall > wait) {
      execute();
    }

    // Trailing edge execution
    if (trailing) {
      timeoutId = setTimeout(() => {
        execute();
        timeoutId = null;
      }, wait);
    }
  };

  debounced.cancel = function () {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Throttle function - complementary to debounce
 * Ensures function is called at most once per specified time period
 * 
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
