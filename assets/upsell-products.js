import { Component } from "@theme/component";
import { ThemeEvents } from "./events.js";

// ============================================================================
// CONSTANTS
// ============================================================================

export const UPSELL_PRODUCT_PREFIX = '_upsell_variant_';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * @typedef {Object} Variant
 * @property {string} id - The variant ID
 * @property {string} name - The variant name
 * @property {string} title - The variant title
 * @property {string[]} options - The variant options
 * @property {number} price - The variant price
 * @property {number} compare_at_price - The compare at price
 */

/**
 * @typedef {Object} Option
 * @property {string} name - The option name
 * @property {number} position - The option position
 * @property {string[]} values - The option values
 */

/**
 * @typedef {Object} HideCondition
 * @property {string} optionName - The option name to check
 * @property {string} optionValue - The option value to match
 * @property {string[]} upsellProducts - Array of upsell product names to hide
 */

/**
 * @typedef {Object} UpsellProductMatch
 * @property {HTMLInputElement} checkbox - The checkbox element
 * @property {Variant | null} variant - The best matching variant
 */

// ============================================================================
// UTILITY CLASSES
// ============================================================================

/**
 * Handles UdoPaints Editor integration and state management
 */
class UdoPaintsEditorManager {
  static #instance = /** @type {UdoPaintsEditorManager | null} */ (null);
  #isReady = false;
  #maxAttempts = 50;
  #attemptInterval = 100;

  static getInstance() {
    if (!UdoPaintsEditorManager.#instance) {
      UdoPaintsEditorManager.#instance = new UdoPaintsEditorManager();
    }
    return UdoPaintsEditorManager.#instance;
  }

  /**
   * Wait for UdoPaintsEditorManager to be available
   * @returns {Promise<void>}
   */
  async waitForManager() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const checkManager = () => {
        attempts++;
        if (window.UdoPaintsEditorManager?.isReady) {
          resolve();
          return;
        }
        if (attempts >= this.#maxAttempts) {
          console.warn('UdoPaintsEditorManager: Not available after maximum attempts');
          reject(new Error('UdoPaintsEditorManager not available'));
          return;
        }
        setTimeout(checkManager, this.#attemptInterval);
      };
      checkManager();
    });
  }

  /**
   * Check if the editor is ready to export
   * @returns {Promise<boolean>}
   */
  async checkReadyToExport() {
    if (!window.UdoPaintsEditorManager?.isReady) {
      console.warn('UdoPaintsEditorManager: Not available for ready check');
      return false;
    }

    try {
      const result = await window.UdoPaintsEditorManager.isReadyToExport();
      this.#isReady = result?.success === true;
      
      if (!this.#isReady) {
        console.warn('UdoPaintsEditorManager: App not ready to export:', result?.error || 'Unknown error');
      }
      
      return this.#isReady;
    } catch (error) {
      console.error('UdoPaintsEditorManager: Error calling isReadyToExport:', error);
      this.#isReady = false;
      return false;
    }
  }

  /**
   * Setup state change listener
   * @param {Function} callback - Callback function to execute on state change
   */
  setupStateChangeListener(callback) {
    if (!window.UdoPaintsEditorManager?.isReady) {
      console.warn('UdoPaintsEditorManager: Not available for listener setup');
      return;
    }

    try {
      window.UdoPaintsEditorManager.onStateChange(async (data) => {
        if (data.state.startsWith('editor:')) {
          await callback();
        }
      });
    } catch (error) {
      console.error('UdoPaintsEditorManager: Error setting up onStateChange listener:', error);
    }
  }

  get isReady() {
    return this.#isReady;
  }

  set isReady(value) {
    this.#isReady = value;
  }
}

/**
 * Handles variant matching and selection logic
 */
class VariantMatcher {
  /**
   * Find the best match variant for a specific upsell product
   * @param {Object.<string, string>} mainProductVariants - The main product variants
   * @param {string | undefined} upsellProductId - The upsell product ID
   * @param {Object.<string, Variant[]>} upsellVariants - All upsell variants
   * @param {Object.<string, string[]>} upsellOptions - All upsell options
   * @returns {Variant | null} The best match variant
   */
  static findBestMatchVariant(mainProductVariants, upsellProductId, upsellVariants, upsellOptions) {
    if (!upsellProductId) return null;
    
    const bestMatchVariantId = this.findBestMatchingUpsellVariant(
      mainProductVariants, 
      upsellProductId, 
      upsellVariants, 
      upsellOptions
    );
    
    const currentUpsellVariants = upsellVariants[upsellProductId];
    const bestMatchVariant = currentUpsellVariants?.find(variant => variant.id === bestMatchVariantId);
    
    return bestMatchVariant || currentUpsellVariants?.[0] || null;
  }

  /**
   * Find the best matching upsell variant
   * @param {Object.<string, string>} mainProductVariants - The main product variants
   * @param {string | undefined} upsellProductId - The upsell product ID
   * @param {Object.<string, Variant[]>} upsellVariants - All upsell variants
   * @param {Object.<string, string[]>} upsellOptions - All upsell options
   * @returns {string | null} The best matching upsell variant ID
   */
  static findBestMatchingUpsellVariant(mainProductVariants, upsellProductId, upsellVariants, upsellOptions) {
    if (!upsellProductId) return null;
    
    const upsellProductVariants = upsellVariants[upsellProductId] || [];
    const upsellProductOptions = upsellOptions[upsellProductId] || [];
    
    if (upsellProductVariants.length === 0) return null;

    return upsellProductVariants
      .map(variant => ({
        variantId: variant.id,
        matchScore: this.calculateMatchScore(variant, upsellProductOptions, mainProductVariants)
      }))
      .reduce((best, current) => 
        current.matchScore > best.matchScore ? current : best, 
        { variantId: null, matchScore: 0 }
      )
      .variantId;
  }

  /**
   * Calculate the match score for a specific upsell variant
   * @param {Variant} upsellVariant - The upsell variant
   * @param {Array.<string>} upsellProductOptions - The upsell product options
   * @param {Object.<string, string>} mainProductVariants - The main product variants
   * @returns {number} The match score
   */
  static calculateMatchScore(upsellVariant, upsellProductOptions, mainProductVariants) {
    let matchScore = 0;
    let totalOptions = 0;
    
    upsellProductOptions.forEach((optionName, optionIndex) => {
      const upsellOptionValue = upsellVariant.options[optionIndex];
      if (upsellOptionValue && mainProductVariants[optionName]) {
        totalOptions++;
        if (upsellOptionValue.toLowerCase() === mainProductVariants[optionName]?.toLowerCase()) {
          matchScore++;
        }
      }
    });
    
    return totalOptions > 0 ? (matchScore / totalOptions) * 100 : 0;
  }

  /**
   * Map main product variants to option names
   * @param {string | undefined} variantId - The main product variant ID
   * @param {Option[]} mainProductOptions - Main product options
   * @param {Variant[]} mainProductVariants - Main product variants
   * @returns {Object.<string, string>} The mapped main product variants
   */
  static mapMainProductVariants(variantId, mainProductOptions, mainProductVariants) {
    const mainProductVariant = mainProductVariants.find(variant => variant.id == variantId);
    
    if (!mainProductVariant) return {};
    
    return mainProductOptions.reduce((acc, option) => {
      if (!option.name) return acc;
      acc[option.name] = mainProductVariant.options[option.position - 1] || '';
      return acc;
    }, /** @type {Object.<string, string>} */({}));
  }
}

/**
 * Handles hide conditions parsing and evaluation
 */
class HideConditionManager {
  /**
   * Parse hide conditions from a string
   * @param {string | undefined} hideConditionsString - The hide conditions string
   * @returns {HideCondition[]} The parsed hide conditions
   */
  static parseHideConditions(hideConditionsString) {
    if (!hideConditionsString || hideConditionsString.trim() === '') return [];
    
    return /** @type {HideCondition[]} */ (hideConditionsString
      .split(';')
      .map(condition => this.parseSingleCondition(condition))
      .filter(condition => condition !== null));
  }

  /**
   * Parse a single hide condition
   * @param {string} condition - The condition string
   * @returns {HideCondition | null} The parsed condition
   */
  static parseSingleCondition(condition) {
    // Parse format: OptionName:Value[Upsell Product Name, Upsell Product Name1]
    const regex = /^([^:]+):([^[]+)\[([^\]]+)\]$/;
    const match = regex.exec(condition);
    
    if (!match) {
      console.warn(`HideConditionManager: Invalid hide condition format: ${condition}`);
      return null;
    }
    
    const [, optionName, optionValue, upsellProductNames] = match;
    
    if (!optionName || !optionValue || !upsellProductNames) {
      console.warn(`HideConditionManager: Invalid hide condition format: ${condition}`);
      return null;
    }
    
    const upsellProducts = upsellProductNames
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    return {
      optionName: optionName.trim().toLowerCase(),
      optionValue: optionValue.trim().toLowerCase(),
      upsellProducts: upsellProducts
    };
  }

  /**
   * Normalize options to lowercase
   * @param {Object.<string, string>} options - The options to normalize
   * @returns {Object.<string, string>} The normalized options
   */
  static normalizeOptions(options) {
    return Object.fromEntries(
      Object.entries(options).map(([key, value]) => [
        key.toLowerCase(),
        value.toLowerCase()
      ])
    );
  }
}

/**
 * Handles price formatting and display
 */
class PriceFormatter {
  /**
   * Format money
   * @param {number} amount - The amount to format
   * @returns {string} The formatted money
   */
  static formatMoney(amount) {
    if (typeof amount === 'string') {
      amount = parseFloat(amount);
    }
    
    if (window.Shopify?.formatMoney) {
      return window.Shopify.formatMoney(amount);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: window.Shopify?.currency?.active || 'USD'
    }).format(amount / 100);
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Custom element for managing upsell products in Shopify product pages.
 * Handles dynamic pricing, variant matching, and form integration.
 */
class UpsellProducts extends Component {

  // Private properties
  /** @type {AbortController} */
  #abortController;
  /** @type {UdoPaintsEditorManager} */
  #udoPaintsEditor;
  /** @type {NodeListOf<HTMLInputElement>} */
  #checkboxes;
  /** @type {HTMLButtonElement | null} */
  #addToCartButton;
  /** @type {HTMLFormElement | null} */
  #form;
  /** @type {boolean} */
  #enableButtonStyling;
  /** @type {boolean} */
  #syncVariants;
  /** @type {HideCondition[]} */
  #hideConditions;
  /** @type {Object.<string, Variant[]>} */
  #upsellVariants;
  /** @type {Object.<string, string[]>} */
  #upsellOptions;
  /** @type {UpsellProductMatch[]} */
  #bestMatchUpsellVariants;
  /** @type {Set.<string>} */
  #hiddenUpsellProducts;
  /** @type {string | null} */
  #originalDisplayValue;
  /** @type {Option[]} */
  #mainProductOptions;
  /** @type {Variant[]} */
  #mainProductVariants;
  /** @type {string} */
  #mainProductSelectedVariantId;

  constructor() {
    super();
    this.#initializeProperties();
  }

  #initializeProperties() {
    this.#udoPaintsEditor = UdoPaintsEditorManager.getInstance();
    this.#checkboxes = this.querySelectorAll('.upsell-product__checkbox-input');
    this.#addToCartButton = document.querySelector('.add-to-cart-button');
    this.#form = this.#addToCartButton?.closest('form') ?? null;
    this.#enableButtonStyling = this.dataset.enableButtonStyling === 'true';
    this.#syncVariants = this.dataset.syncVariants === 'true';
    this.#hideConditions = HideConditionManager.parseHideConditions(this.dataset.hideConditions);
    this.#mainProductSelectedVariantId = this.dataset.mainProductSelectedVariantId ?? '';
    this.#upsellVariants = {};
    this.#upsellOptions = {};
    this.#bestMatchUpsellVariants = [];
    this.#hiddenUpsellProducts = new Set();
    this.#originalDisplayValue = null;
    this.#mainProductOptions = [];
    this.#mainProductVariants = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this.#abortController = new AbortController();
    this.init();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController?.abort();
  }

  async init() {
    await this.#checkUdoPaintsEditor();
    this.#setupCheckboxListeners();
    
    if (this.#syncVariants) {
      this.#initOptionsAndVariants();
    }
    
    this.#setupVariantChangeListener();
  }

  // ============================================================================
  // UDOPAINTS EDITOR INTEGRATION
  // ============================================================================

  async #checkUdoPaintsEditor() {
    try {
      await this.#udoPaintsEditor.waitForManager();
      await this.#checkReadyToExport();
      this.#setupUdoPaintsEditorListener();
    } catch (error) {
      console.error('UpsellProducts: Error during UdoPaintsEditor check:', error);
      this.hideAllUpsellProducts();
    }
  }

  async #checkReadyToExport() {
    const isReady = await this.#udoPaintsEditor.checkReadyToExport();
    
    if (isReady) {
      this.showAllUpsellProducts();
      const initialMainVariant = VariantMatcher.mapMainProductVariants(
        this.#mainProductSelectedVariantId,
        this.#mainProductOptions,
        this.#mainProductVariants
      );
      
      this.#updateBestMatchVariants(initialMainVariant);
      this.#checkHideConditions(initialMainVariant);
      
      if (this.#form) {
        this.#syncUpsellProductsBlock();
      }
    } else {
      this.hideAllUpsellProducts();
    }
  }

  #setupUdoPaintsEditorListener() {
    this.#udoPaintsEditor.setupStateChangeListener(async () => {
      await this.#checkReadyToExport();
    });
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  #setupCheckboxListeners() {
    const initialMainVariant = VariantMatcher.mapMainProductVariants(
      this.#mainProductSelectedVariantId,
      this.#mainProductOptions,
      this.#mainProductVariants
    );
    
    this.#updateBestMatchVariants(initialMainVariant);
    
    this.#checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (event) => {
        this.#handleCheckboxChange(event);
        this.#resetHiddenUpsellInputs();
      }, { signal: this.#abortController.signal });
      
      checkbox.addEventListener('checkbox-unchecked', (event) => {
        this.#handleCheckboxChange(event);
      }, { signal: this.#abortController.signal });
    });
  }

  #setupVariantChangeListener() {
    document.addEventListener(ThemeEvents.variantSelected, (event) => {
      this.#listenForVariantChange(event);
      this.#resetHiddenUpsellInputs();
    }, { signal: this.#abortController.signal });
    
    document.addEventListener(ThemeEvents.cartUpdate, (event) => {
      this.clearCheckedUpsellProducts();
      this.#removeExistingUpsellInputs();
    }, { signal: this.#abortController.signal });
  }

  /**
   * Listen for variant change
   * @param {Event} event - The event object
   */
  #listenForVariantChange(event) {
    if (!this.#udoPaintsEditor.isReady) return;
    
    const customEvent = /** @type {CustomEvent} */ (event);
    const variant = customEvent.detail?.resource;
    
    if (variant) {
      const mappedMainVariant = VariantMatcher.mapMainProductVariants(
        variant.variantId,
        this.#mainProductOptions,
        this.#mainProductVariants
      );
      
      this.#updateBestMatchVariants(mappedMainVariant);
      this.#checkHideConditions(mappedMainVariant);
      
      if (this.#udoPaintsEditor.isReady) {
        this.#syncUpsellProductsBlock();
      }
    }
  }

  // ============================================================================
  // VARIANT MATCHING
  // ============================================================================

  /**
   * Update the best match variants
   * @param {Object.<string, string>} mainProductVariants - The main product variants
   */
  #updateBestMatchVariants(mainProductVariants) {
    this.#bestMatchUpsellVariants = Array.from(this.#checkboxes)
      .map(checkbox => ({
        checkbox: checkbox,
        variant: VariantMatcher.findBestMatchVariant(
          mainProductVariants,
          checkbox.dataset.upsellId,
          this.#upsellVariants,
          this.#upsellOptions
        )
      }));
  }

  /**
   * Initialize the options and variants
   */
  #initOptionsAndVariants() {
    this.#mainProductOptions = JSON.parse(
      this.querySelector('script[data-main-product-options]')?.textContent || '[]'
    );
    this.#mainProductVariants = JSON.parse(
      this.querySelector('script[data-main-product-variants]')?.textContent || '[]'
    );
    
    this.#checkboxes.forEach(checkbox => {
      const upsellId = checkbox.dataset.upsellId;
      if (!upsellId) return;
      
      try {
        this.#upsellVariants[upsellId] = JSON.parse(
          this.querySelector(`script[data-upsell-variants][data-upsell-id="${upsellId}"]`)?.textContent || '[]'
        );
        this.#upsellOptions[upsellId] = JSON.parse(
          this.querySelector(`script[data-upsell-option-names][data-upsell-id="${upsellId}"]`)?.textContent || '[]'
        );
      } catch (error) {
        console.error(`UpsellProducts: Error parsing JSON data for upsell product ${upsellId}:`, error);
        this.#upsellVariants[upsellId] = [];
        this.#upsellOptions[upsellId] = [];
      }
    });
  }

  // ============================================================================
  // HIDE CONDITIONS
  // ============================================================================

  /**
   * Check the hide conditions
   * @param {Object.<string, string>} mappedMainVariant - The mapped main variant
   */
  #checkHideConditions(mappedMainVariant) {
    if (!this.#udoPaintsEditor.isReady) {
      this.hideAllUpsellProducts();
      return;
    }
    
    const normalizedOptions = HideConditionManager.normalizeOptions(mappedMainVariant);
    this.#checkIndividualHideConditions(normalizedOptions);
  }

  /**
   * Check the individual hide conditions
   * @param {Object.<string, string>} normalizedOptions - The normalized options
   */
  #checkIndividualHideConditions(normalizedOptions) {
    // First, show all upsell products
    this.#checkboxes.forEach(checkbox => {
      const upsellId = checkbox.dataset.upsellId;
      const item = /** @type {HTMLElement} */ (checkbox.closest('.upsell-product__item'));
      this.showUpsellProduct(upsellId, item);
    });
    
    // Then check each hide condition
    this.#hideConditions.forEach(condition => {
      const optionValue = normalizedOptions[condition.optionName];
      
      if (optionValue && optionValue == condition.optionValue) {
        condition.upsellProducts.forEach(upsellProductName => {
          this.#hideUpsellProductByName(upsellProductName);
        });
      }
    });
  }

  /**
   * Hide the upsell product by name
   * @param {string} upsellProductName - The name of the upsell product to hide
   */
  #hideUpsellProductByName(upsellProductName) {
    this.#checkboxes.forEach(checkbox => {
      const item = /** @type {HTMLElement} */ (checkbox.closest('.upsell-product__item'));
      const productNameElement = /** @type {HTMLElement} */ (item.querySelector('.upsell-product__content h4'));
      
      if (!productNameElement) return;
      
      const elementText = productNameElement.textContent?.trim().toLowerCase();
      const targetName = upsellProductName.toLowerCase();
      
      if (elementText === targetName) {
        const upsellId = checkbox.dataset.upsellId;
        this.hideUpsellProduct(upsellId, item);
      }
    });
  }

  // ============================================================================
  // UI UPDATES
  // ============================================================================

  /**
   * Sync the upsell products block
   */
  #syncUpsellProductsBlock() {
    if (!this.#udoPaintsEditor.isReady) return;
    
    this.#bestMatchUpsellVariants
      .filter(upsell => !this.#hiddenUpsellProducts.has(upsell.checkbox.dataset.upsellId || ''))
      .forEach(upsell => this.#setUpsellProductPrice(
        upsell.checkbox.dataset.upsellId,
        upsell.variant?.price,
        upsell.variant?.compare_at_price
      ));
  }

  /**
   * Set the upsell product price
   * @param {string | undefined} upsellProductId - The ID of the upsell product
   * @param {number | undefined} newPrice - The new price
   * @param {number | null} newComparePrice - The new compare price
   * @returns {boolean} Whether the price was set successfully
   */
  #setUpsellProductPrice(upsellProductId, newPrice, newComparePrice = null) {
    if (!upsellProductId || newPrice === null || newPrice === undefined) {
      console.warn('UpsellProducts: Invalid parameters provided for setUpsellProductPrice');
      return false;
    }
    
    const upsellItem = this.querySelector(`[data-upsell-product="${upsellProductId}"]`);
    if (!upsellItem) {
      console.warn(`UpsellProducts: Upsell product with ID ${upsellProductId} not found`);
      return false;
    }
    
    const currentPriceElement = /** @type {HTMLElement} */ (upsellItem.querySelector('.upsell-product__current-price'));
    const comparePriceElement = /** @type {HTMLElement} */ (upsellItem.querySelector('.upsell-product__compare-price'));
    
    if (currentPriceElement) {
      currentPriceElement.textContent = PriceFormatter.formatMoney(newPrice);
    }
    
    if (newComparePrice && newComparePrice > newPrice) {
      if (comparePriceElement) {
        comparePriceElement.textContent = PriceFormatter.formatMoney(newComparePrice);
        comparePriceElement.style.display = 'inline-block';
      }
    } else if (comparePriceElement) {
      comparePriceElement.style.display = 'none';
    }
    
    return true;
  }

  // ============================================================================
  // FORM HANDLING
  // ============================================================================

  /**
   * Reset the hidden upsell inputs
   */
  #resetHiddenUpsellInputs() {
    this.#removeExistingUpsellInputs();
    this.#setHiddenUpsellInputs();
  }

  /**
   * Set the hidden upsell inputs
   */
  #setHiddenUpsellInputs() {
    this.#bestMatchUpsellVariants
      .filter(upsell => upsell.checkbox.checked && !this.#hiddenUpsellProducts.has(upsell.checkbox.dataset.upsellId || ''))
      .map(upsell => upsell.variant)
      .forEach(variant => {
        if (!variant || !this.#form) return;
        
        const hiddenInput = this.#form.ownerDocument.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = `${UPSELL_PRODUCT_PREFIX}${variant.id}`;
        hiddenInput.value = variant.name;
        this.#form.appendChild(hiddenInput);
      });
  }

  /**
   * Remove the existing upsell inputs
   */
  #removeExistingUpsellInputs() {
    if (!this.#form) return;
    
    const existingUpsellInputs = /** @type {NodeListOf<HTMLInputElement>} */ (
      this.#form.querySelectorAll(`[name^="${UPSELL_PRODUCT_PREFIX}"]`)
    );
    existingUpsellInputs.forEach(input => input.remove());
  }

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  /**
   * Handle checkbox change event
   * @param {Event} event - The event object
   */
  #handleCheckboxChange(event) {
    const checkbox = /** @type {HTMLInputElement} */ (event.target);
    const item = /** @type {HTMLElement} */ (checkbox.closest('.upsell-product__item'));
    
    if (!item) return;
    
    if (checkbox.checked) {
      item.classList.add('upsell-product__item--selected');
    } else {
      item.classList.remove('upsell-product__item--selected');
    }
    
    this.#updateButtonStyling();
  }

  #updateButtonStyling() {
    if (!this.#enableButtonStyling || !this.#addToCartButton) return;
    
    const hasSelectedUpsells = Array.from(this.#checkboxes)
      .filter(checkbox => !this.#hiddenUpsellProducts.has(checkbox.dataset.upsellId || ''))
      .some(checkbox => checkbox.checked);
    
    if (hasSelectedUpsells) {
      this.#addToCartButton.classList.add('btn--upsell-selected');
    } else {
      this.#addToCartButton.classList.remove('btn--upsell-selected');
    }
  }

  clearCheckedUpsellProducts() {
    this.#checkboxes.forEach(checkbox => {
      if (checkbox.checked) {
        checkbox.checked = false;
        checkbox.dispatchEvent(new CustomEvent('checkbox-unchecked'));
      }
    });
  }

  /**
   * Get the form data as an object
   * @returns {Object.<string, string>} The form data as an object
   */
  getFormDataAsObject() {
    if (!this.#form) return {};
    
    const formData = new FormData(this.#form);
    const formDataObj = /** @type {Object.<string, any>} */ ({});
    
    for (let [key, value] of formData.entries()) {
      formDataObj[key] = value;
    }
    
    return formDataObj;
  }

  // ============================================================================
  // VISIBILITY MANAGEMENT
  // ============================================================================

  /**
   * Hide a specific upsell product
   * @param {string | undefined} upsellId - The upsell product ID
   * @param {HTMLElement | null} item - The upsell product item element
   */
  hideUpsellProduct(upsellId, item) {
    if (!item || !upsellId) return;
    
    // Store the current display value before hiding
    const currentDisplay = window.getComputedStyle(item).display;
    if (currentDisplay !== 'none') {
      this.#originalDisplayValue = currentDisplay;
    }
    
    this.#hiddenUpsellProducts.add(upsellId);
    item.style.display = 'none';

    // Uncheck the checkbox if it's hidden
    const checkbox = /** @type {HTMLInputElement} */ (item.querySelector('.upsell-product__checkbox-input'));
    if (checkbox?.checked) {
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change'));
    }
  }

  /**
   * Show a specific upsell product
   * @param {string | undefined} upsellId - The upsell product ID
   * @param {HTMLElement | null} item - The upsell product item element
   */
  showUpsellProduct(upsellId, item) {
    if (!item) return;
    
    this.#hiddenUpsellProducts.delete(upsellId || '');
    
    // Restore the original display value
    if (this.#originalDisplayValue) {
      item.style.display = this.#originalDisplayValue;
    } else {
      // Fallback to 'block' if no original value is stored
      item.style.display = 'block';
    }
  }

  /**
   * Hide all upsell products
   */
  hideAllUpsellProducts() {
    this.#checkboxes.forEach(checkbox => {
      const upsellId = checkbox.dataset.upsellId;
      const item = /** @type {HTMLElement} */ (checkbox.closest('.upsell-product__item'));
      this.hideUpsellProduct(upsellId, item);
    });
  }

  /**
   * Show all upsell products
   */
  showAllUpsellProducts() {
    this.#checkboxes.forEach(checkbox => {
      const upsellId = checkbox.dataset.upsellId;
      const item = /** @type {HTMLElement} */ (checkbox.closest('.upsell-product__item'));
      this.showUpsellProduct(upsellId, item);
    });
  }
}

// Register the custom element
if (!customElements.get('upsell-products')) {
  customElements.define('upsell-products', UpsellProducts);
}
