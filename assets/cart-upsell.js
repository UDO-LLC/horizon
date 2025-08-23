import { Component } from '@theme/component';
import { CartUpdateEvent } from '@theme/events';

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'cart-upsell-dismissed';
const BUTTON_RESET_DELAY = 2000;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * @typedef {Object} CartUpsellRefs
 * @property {HTMLButtonElement[]} dismissButtons - Dismiss buttons for each upsell item
 * @property {HTMLButtonElement[]} addButtons - Add to cart buttons for each upsell item
 * @property {HTMLElement[]} upsellItems - Individual upsell item containers
 */

/**
 * @typedef {Object} CartUpsellOptions
 * @property {string} addButtonText - Text for the add to cart button
 * @property {string} addingText - Text shown while adding to cart
 * @property {string} addedText - Text shown after successful add
 */

/**
 * @typedef {Object} CartAddResponse
 * @property {Object} cart - Cart data from Shopify
 * @property {string} status - Response status
 */

// ============================================================================
// CART UPSELL COMPONENT
// ============================================================================

/**
 * Cart Upsell Component
 * 
 * Handles cart upsell product interactions including:
 * - Dismissing upsell items
 * - Adding upsell products to cart
 * - Managing dismissed state in sessionStorage
 * 
 * @extends {Component<CartUpsellRefs>}
 */
export class CartUpsellComponent extends Component {
  /**
   * Called when the element is connected to the document's DOM.
   */
  connectedCallback() {
    super.connectedCallback();
    this.initializeObserver();
    this.ensureFlagElement();
    this.hideDismissedItems();
  }

  /**
   * Horizon Theme Morph made things complicated, so we need to observe the DOM changes
   * Initialize the MutationObserver to watch for DOM changes
   */
  initializeObserver() {
    this.observer = new MutationObserver((mutations) => {
      let shouldRecheck = false;
      
      mutations.forEach((mutation) => {
        // Check if our flag element was removed
        if (mutation.type === 'childList') {
          mutation.removedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && 
                node instanceof Element && 
                node.classList.contains('cart-upsell__flag')) {
              shouldRecheck = true;
            }
          });
        }
      });

      if (shouldRecheck) {
        this.ensureFlagElement();
        this.hideDismissedItems();
      }
    });

    // Start observing
    this.observer.observe(this, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Ensure the flag element exists and is properly positioned
   */
  ensureFlagElement() {
    let flagElement = this.querySelector('.cart-upsell__flag');
    
    if (!flagElement) {
      flagElement = this.createFlagElement();
      this.appendChild(flagElement);
    }

    // Update flag element with current dismissed products
    this.updateFlagElement();
  }

  /**
   * Create the flag element to track dismissed products
   * @returns {HTMLElement} The created flag element
   */
  createFlagElement() {
    const flagElement = document.createElement('div');
    flagElement.className = 'cart-upsell__flag';
    flagElement.setAttribute('aria-hidden', 'true');
    flagElement.style.cssText = 'position: absolute; left: -9999px; top: -9999px; width: 1px; height: 1px; overflow: hidden; pointer-events: none;';
    return flagElement;
  }

  /**
   * Update the flag element with current dismissed products
   */
  updateFlagElement() {
    const flagElement = this.querySelector('.cart-upsell__flag');
    if (flagElement) {
      const dismissedProducts = this.getDismissedProducts();
      flagElement.setAttribute('data-dismissed-products', JSON.stringify(dismissedProducts));
    }
  }

  /**
   * Called when the element is disconnected from the document's DOM.
   */
  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }
    super.disconnectedCallback();
  }

  /**
   * Handle dismiss button clicks
   * @param {Event} event - Click event
   */
  handleDismiss(event) {
    const button = /** @type {HTMLButtonElement} */ (event.target);
    const productId = button.getAttribute('data-upsell-dismiss');
    const item = /** @type {HTMLElement} */ (button.closest('.cart-upsell__item'));
    
    if (!item || !productId) {
      return;
    }

    this.hideItem(item);
    this.saveDismissedState(productId);
  }

  /**
   * Handle add to cart button clicks
   * @param {Event} event - Click event
   */
  async handleAddToCart(event) {
    const button = /** @type {HTMLButtonElement} */ (event.target);
    const productId = button.getAttribute('data-product-id');
    const variantId = button.getAttribute('data-variant-id');
    
    if (!productId || !variantId) {
      console.error('Missing product or variant ID for upsell add to cart');
      return;
    }

    const item = /** @type {HTMLElement} */ (button.closest('.cart-upsell__item'));
    if (!item) {
      return;
    }

    await this.processAddToCart(button, productId, variantId, item);
  }

  /**
   * Process the add to cart operation
   * @param {HTMLButtonElement} button - The add to cart button
   * @param {string} productId - Product ID
   * @param {string} variantId - Variant ID
   * @param {HTMLElement} item - The upsell item container
   */
  async processAddToCart(button, productId, variantId, item) {
    try {
      this.setButtonLoading(button, true);
      
      // Add to cart using Shopify's AJAX API
      await this.addToCart(variantId, 1);
      
      // Hide the upsell item after successful add
      this.hideItem(item);
      
      // Save as dismissed so it doesn't show up again
      this.saveDismissedState(productId);
      
      // Reset button after delay
      this.resetButtonAfterDelay(button);
      
    } catch (error) {
      console.error('Error adding upsell product to cart:', error);
      this.setButtonLoading(button, false);
    }
  }

  /**
   * Add product to cart via AJAX
   * @param {string} variantId - Product variant ID
   * @param {number} quantity - Quantity to add
   * @returns {Promise<CartAddResponse>} Response from cart API
   */
  async addToCart(variantId, quantity) {
    const formData = {
      items: [{
        id: variantId,
        quantity: quantity
      }]
    };

    const response = await fetch(Theme.routes.cart_add_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();

    // Trigger cart update event with proper data
    this.dispatchCartUpdateEvent(responseData, variantId, quantity);
    
    return responseData;
  }

  /**
   * Dispatch cart update event
   * @param {CartAddResponse} responseData - Cart response data
   * @param {string} variantId - Variant ID that was added
   * @param {number} quantity - Quantity that was added
   */
  dispatchCartUpdateEvent(responseData, variantId, quantity) {
    document.dispatchEvent(new CartUpdateEvent(
      responseData || {},
      'cart-upsell-component',
      {
        source: 'cart-upsell-component',
        productId: variantId,
        variantId: variantId,
        itemCount: quantity
      }
    ));
  }

  /**
   * Set button loading state
   * @param {HTMLButtonElement} button - Button to update
   * @param {boolean} isLoading - Whether button should be in loading state
   */
  setButtonLoading(button, isLoading) {
    button.disabled = isLoading;
    if (isLoading) {
      button.classList.add('is-loading');
    } else {
      button.classList.remove('is-loading');
    }
  }

  /**
   * Reset button after delay
   * @param {HTMLButtonElement} button - Button to reset
   */
  resetButtonAfterDelay(button) {
    setTimeout(() => {
      this.setButtonLoading(button, false);
    }, BUTTON_RESET_DELAY);
  }

  /**
   * Hide an upsell item
   * @param {HTMLElement} item - Item to hide
   */
  hideItem(item) {
    item.style.display = 'none';
    this.checkAndHideComponent();
  }

  /**
   * Check if all items are hidden and hide the component if needed
   */
  checkAndHideComponent() {
    const visibleItems = this.querySelectorAll('.cart-upsell__item:not([style*="display: none"])');
    if (visibleItems.length === 0) {
      this.style.display = 'none';
    }
  }

  /**
   * Save dismissed state to sessionStorage
   * @param {string} productId - Product ID to mark as dismissed
   */
  saveDismissedState(productId) {
    const dismissed = this.getDismissedProducts();
    if (!dismissed.includes(productId)) {
      dismissed.push(productId);
      this.setDismissedProducts(dismissed);
      this.updateFlagElement();
    }
  }

  /**
   * Get list of dismissed product IDs
   * @returns {string[]} Array of dismissed product IDs
   */
  getDismissedProducts() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    } catch (error) {
      console.error('Error parsing dismissed products from sessionStorage:', error);
      return [];
    }
  }

  /**
   * Set dismissed products in sessionStorage
   * @param {string[]} dismissed - Array of dismissed product IDs
   */
  setDismissedProducts(dismissed) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
    } catch (error) {
      console.error('Error saving dismissed products to sessionStorage:', error);
    }
  }

  /**
   * Check if a product is dismissed
   * @param {string} productId - Product ID to check
   * @returns {boolean} True if product is dismissed
   */
  isDismissed(productId) {
    const dismissed = this.getDismissedProducts();
    return dismissed.includes(productId);
  }

  /**
   * Hide dismissed items on page load
   */
  hideDismissedItems() {
    const dismissButtons = this.querySelectorAll('[data-upsell-dismiss]');
    
    dismissButtons.forEach((button) => {
      const productId = button.getAttribute('data-upsell-dismiss');
      if (productId && this.isDismissed(productId)) {
        const item = /** @type {HTMLElement} */ (button.closest('.cart-upsell__item'));
        if (item) {
          this.hideItem(item);
        }
      }
    });

    // Check if component should be hidden after hiding dismissed items
    this.checkAndHideComponent();
  }

  /**
   * Clear all dismissed states
   */
  clearDismissedStates() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      this.updateFlagElement();
    } catch (error) {
      console.error('Error clearing dismissed states from sessionStorage:', error);
    }
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Register the custom element
if (!customElements.get('cart-upsell-component')) {
  customElements.define('cart-upsell-component', CartUpsellComponent);
}

// Export for use in other modules
export default CartUpsellComponent;
