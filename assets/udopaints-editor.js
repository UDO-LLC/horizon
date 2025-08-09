/**
 * UdoPaintsEditor Integration Utility
 * Provides a clean interface for interacting with the UdoPaintsEditor app block
 */

class UdoPaintsEditorManager {
  /** @type {boolean} */
  isReady;
  
  /** @type {(() => void)[]} */
  readyCallbacks;
  
  constructor() {
    this.isReady = false;
    this.readyCallbacks = [];
    this.checkAvailability();
  }

  /**
   * Check if UdoPaintsEditor is available
   */
  checkAvailability() {
    if (window.UdoPaintsEditor) {
      this.isReady = true;
      this.readyCallbacks.forEach(callback => callback());
      this.readyCallbacks = [];
    } else {
      // Check again after a short delay
      setTimeout(() => this.checkAvailability(), 100);
    }
  }

  /**
   * Wait for UdoPaintsEditor to be ready
   * @param {() => void} callback - Callback to execute when ready
   */
  onReady(callback) {
    if (this.isReady) {
      callback();
    } else {
      this.readyCallbacks.push(callback);
    }
  }

  /**
   * Call onAddToCart method
   * @param {object} params - The parameters object
   * @param {string} params.productId - The product ID
   * @param {string} params.variantId - The variant ID
   * @returns {Promise<any>} Promise with result object
   */
  async onAddToCart(params) {
    return new Promise((resolve) => {
      this.onReady(async () => {
        try {
          const result = await window.UdoPaintsEditor.onAddToCart(params);
          resolve(result);
        } catch (error) {
          resolve({
            success: false,
            error: error.message || 'Failed to call onAddToCart'
          });
        }
      });
    });
  }

  /**
   * Call afterAddToCart method
   * @param {object} params - The parameters object
   * @param {string} params.itemKey - The cart item key
   * @param {string} params.cartToken - The cart token
   * @returns {Promise<any>} Promise with result object
   */
  async afterAddToCart(params) {
    return new Promise((resolve) => {
      this.onReady(async () => {
        try {
          const result = await window.UdoPaintsEditor.afterAddToCart(params);
          resolve(result);
        } catch (error) {
          resolve({
            success: false,
            error: error.message || 'Failed to call afterAddToCart'
          });
        }
      });
    });
  }

  /**
   * Call isReadyToExport method
   * @returns {Promise<any>} Promise with result object
   */
  async isReadyToExport() {
    return new Promise((resolve) => {
      this.onReady(async () => {
        try {
          const result = await window.UdoPaintsEditor.isReadyToExport();
          resolve(result);
        } catch (error) {
          resolve({
            success: false,
            error: error.message || 'Failed to call isReadyToExport'
          });
        }
      });
    });
  }

  /**
   * Call onError method
   * @param {any} error - The error object
   * @returns {Promise<void>} Promise that resolves when the error is handled
   */
  async onError(error) {
    return new Promise((resolve) => {
      this.onReady(async () => {
        try {
          await window.UdoPaintsEditor.onError(error);
          resolve();
        } catch (err) {
          console.error('Failed to call UdoPaintsEditor.onError:', err);
          resolve();
        }
      });
    });
  }

  /**
   * Call uploadImage method
   * @returns {Promise<{ success: boolean, feature: string, error?: string }>} Promise with result object
   */
  async uploadImage() {
    return new Promise((resolve) => {
      this.onReady(async () => {
        try {
          const result = await window.UdoPaintsEditor.uploadImage();
          resolve(result);
        } catch (error) {
          console.error('Failed to call UdoPaintsEditor.uploadImage:', error);
          resolve({
            success: false,
            feature: '',
            error: error.message || 'Failed to call uploadImage'
          });
        }
      });
    });
  }

  /**
   * Set up state change handler
   * @param {(params: any) => Promise<void> | void} handler - Function to handle state changes
   */
  onStateChange(handler) {
    this.onReady(() => {
      try {
        window.UdoPaintsEditor.onStateChange(handler);
      } catch (error) {
        console.error('Failed to set UdoPaintsEditor.onStateChange:', error);
      }
    });
  }

  /**
   * Check if UdoPaintsEditor is available
   * @returns {boolean} True if available
   */
  isAvailable() {
    return this.isReady;
  }
}

// Create a global instance
const udopaintsEditor = new UdoPaintsEditorManager();

// Export for use in other modules
export { udopaintsEditor as UdoPaintsEditor };

// Also make it available globally for easy access
window.UdoPaintsEditorManager = udopaintsEditor;
