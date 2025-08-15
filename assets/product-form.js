import { Component } from '@theme/component';
import { fetchConfig, onAnimationEnd, preloadImage } from '@theme/utilities';
import { ThemeEvents, CartAddEvent, CartErrorEvent, VariantUpdateEvent } from '@theme/events';
import { cartPerformance } from '@theme/performance';
import { morph } from '@theme/morph';
import { UPSELL_PRODUCT_PREFIX } from './upsell-products.js';

export const ADD_TO_CART_TEXT_ANIMATION_DURATION = 2000;

/**
 * A custom element that manages an add to cart button.
 *
 * @typedef {object} AddToCartRefs
 * @property {HTMLButtonElement} addToCartButton - The add to cart button.
 * @extends Component<AddToCartRefs>
 */
export class AddToCartComponent extends Component {
  requiredRefs = ['addToCartButton'];

  /** @type {number | undefined} */
  #animationTimeout;

  /** @type {number | undefined} */
  #cleanupTimeout;

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('pointerenter', this.#preloadImage);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.#animationTimeout) clearTimeout(this.#animationTimeout);
    if (this.#cleanupTimeout) clearTimeout(this.#cleanupTimeout);
    this.removeEventListener('pointerenter', this.#preloadImage);
  }

  /**
   * Disables the add to cart button.
   */
  disable() {
    this.refs.addToCartButton.disabled = true;
  }

  /**
   * Enables the add to cart button.
   */
  enable() {
    this.refs.addToCartButton.disabled = false;
  }

  /**
   * Shows the loading spinner on the add to cart button.
   */
  showSpinner() {
    this.refs.addToCartButton.classList.add('is-loading');
  }

  /**
   * Hides the loading spinner on the add to cart button.
   */
  hideSpinner() {
    this.refs.addToCartButton.classList.remove('is-loading');
  }

  /**
   * Handles the click event for the add to cart button.
   * @param {MouseEvent & {target: HTMLElement}} event - The click event.
   */
  handleClick(event) {
    if (!this.#checkFormValidity()) return;
    this.listenToAppBlockState();
  }

  listenToAppBlockState() {
    window.UdoPaintsEditorManager.onStateChange((params) => {
      if (params.state === 'upload-state:loading') {
        this.disable();
      } else if (params.state === 'upload-state:success') {
        this.enable();
      }
    });
  }

  /**
   * Handles the started adding to cart event.
   */
  handleStartedAddingToCart() {
    this.disable();
    this.showSpinner();
  }

  /**
   * Handles the successful add to cart event.
   */
  handleSuccessfulAddToCart() {
    this.animateAddToCart();
    if (!this.closest('.quick-add-modal')) this.#animateFlyToCart();
    this.enable();
    this.hideSpinner();
  }

  #preloadImage = () => {
    const image = this.dataset.productVariantMedia;

    if (!image) return;

    preloadImage(image);
  };

  /**
   * Animates the fly to cart animation.
   */
  #animateFlyToCart() {
    const { addToCartButton } = this.refs;
    const cartIcon = document.querySelector('.header-actions__cart-icon');

    const image = this.dataset.productVariantMedia;

    if (!cartIcon || !addToCartButton || !image) return;

    const flyToCartElement = /** @type {FlyToCart} */ (document.createElement('fly-to-cart'));

    flyToCartElement.style.setProperty('background-image', `url(${image})`);
    flyToCartElement.source = addToCartButton;
    flyToCartElement.destination = cartIcon;

    document.body.appendChild(flyToCartElement);
  }

  /**
   * Animates the add to cart button.
   */
  animateAddToCart() {
    const { addToCartButton } = this.refs;

    if (this.#animationTimeout) clearTimeout(this.#animationTimeout);
    if (this.#cleanupTimeout) clearTimeout(this.#cleanupTimeout);

    if (!addToCartButton.classList.contains('atc-added')) {
      addToCartButton.classList.add('atc-added');
    }

    this.#animationTimeout = setTimeout(() => {
      this.#cleanupTimeout = setTimeout(() => {
        this.refs.addToCartButton.classList.remove('atc-added');
      }, 10);
    }, ADD_TO_CART_TEXT_ANIMATION_DURATION);
  }

  /**
   * Checks if the form is valid when the user adds an item to cart.
   * Currently only checks the gift card recipient form.
   * @returns {boolean} - True if the form is valid, false otherwise.
   */
  #checkFormValidity() {
    const form = this.closest('form');
    if (!form) return true;

    const allInputs = Array.from(form.querySelectorAll('input, select, textarea')).filter((input) =>
      input.id.includes('Recipient')
    );
    let allInputsValid = true;
    for (const input of allInputs) {
      if (
        !(
          input instanceof HTMLInputElement ||
          input instanceof HTMLSelectElement ||
          input instanceof HTMLTextAreaElement
        )
      ) {
        continue;
      }

      // Skip disabled inputs
      if (input.disabled) continue;

      // Check validity on all input elements
      if (!input.checkValidity()) {
        allInputsValid = false;
        break;
      }
    }
    return allInputsValid;
  }
}

if (!customElements.get('add-to-cart-component')) {
  customElements.define('add-to-cart-component', AddToCartComponent);
}

/**
 * @typedef {object} UpsellProduct
 * @property {string} id - The ID of the upsell product.
 * @property {string} title - The title of the upsell product.
 * @property {number} quantity - The quantity of the upsell product.
 * @property {Record<string, any>} properties - The properties of the upsell product.
 */

/**
 * A custom element that manages a product form.
 *
 * @typedef {object} ProductFormRefs
 * @property {HTMLInputElement} variantId - The form input for submitting the variant ID.
 * @property {AddToCartComponent | undefined} addToCartButtonContainer - The add to cart button container element.
 * @property {HTMLElement | undefined} addToCartTextError - The add to cart text error.
 * @property {HTMLElement | undefined} acceleratedCheckoutButtonContainer - The accelerated checkout button container element.
 * @property {HTMLElement} liveRegion - The live region.
 *
 * @extends Component<ProductFormRefs>
 */
class ProductFormComponent extends Component {

  requiredRefs = ['variantId', 'liveRegion'];

  #abortController = new AbortController();

  /** @type {number | undefined} */
  #timeout;

  connectedCallback() {
    super.connectedCallback();
    const { signal } = this.#abortController;
    const target = this.closest('.shopify-section, dialog, product-card');
    target?.addEventListener(ThemeEvents.variantUpdate, this.#onVariantUpdate, { signal });
    target?.addEventListener(ThemeEvents.variantSelected, this.#onVariantSelected, { signal });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#abortController.abort();
  }

  /**
   * Handles the submit event for the product form.
   *
   * @param {Event} event - The submit event.
   */
  async handleSubmit(event) {
    // Stop default behaviour from the browser
    event.preventDefault();

    if (this.#timeout) clearTimeout(this.#timeout);

    // Check if the add to cart button is disabled and do an early return if it is
    if (this.refs.addToCartButtonContainer?.refs.addToCartButton?.getAttribute('disabled') === 'true') return;

    // Check if App Block is ready to export
    const { success, feature } = await this.#checkAppBlockState();
    if (!success || !feature) return;

    this.refs.addToCartButtonContainer?.handleStartedAddingToCart();

    // Send the add to cart information to the cart
    const form = this.querySelector('form');

    if (!form) throw new Error('Product form element missing');

    const formData = new FormData(form);

    const cartItemsComponents = document.querySelectorAll('cart-items-component');
    /** @type {string[]} */
    let cartItemComponentsSectionIds = [];
    cartItemsComponents.forEach((item) => {
      if (item instanceof HTMLElement && item.dataset.sectionId) {
        cartItemComponentsSectionIds.push(item.dataset.sectionId);
      }
    });
    formData.append('sections', cartItemComponentsSectionIds.join(','));

    /* Convert FormData to JSON for the cart API */
    const formDataAsJson = Object.fromEntries(formData.entries());

    const productId = formDataAsJson['product-id'];
    const variantId = formDataAsJson['id'];

    if (!productId || !variantId) throw new Error('Product ID or variant ID is missing from form data');

    const lineItemProperties = await this.#getLineItemProperties(feature, productId.toString(), variantId.toString());
    Object.assign(formDataAsJson, { properties: lineItemProperties });

    const { cleanFormJsonData, upsellProducts } = this.#detectUpsellProducts(formDataAsJson);

    this.refs.addToCartButtonContainer?.handleSuccessfulAddToCart();

    await this.#addToCart(cleanFormJsonData, upsellProducts);

    cartPerformance.measureFromEvent('add:user-action', event);
  }

  /**
   * Adds items to the cart via API call.
   *
   * @param {Record<string, any>} formJsonData - The form data containing product information.
   * @param {UpsellProduct[]} upsellProducts - The upsell products.
   */
  async #addToCart(formJsonData, upsellProducts) {
    const fetchCfg = fetchConfig();

    try {
      const response = await fetch(Theme.routes.cart_add_url, {
        ...fetchCfg,
        body: JSON.stringify({ items: [formJsonData, ...upsellProducts] }),
      });

      const responseData = await response.json();

      if (responseData.status) {
        this.#handleCartError(responseData.message, formJsonData);
      } else {
        await this.#handleCartSuccess(formJsonData, responseData);
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Handles cart error responses.
   *
   * @param {string} message - The error message.
   * @param {Record<string, any>} formJsonData - The form data containing product information.
   */
  #handleCartError(message, formJsonData) {
    const { addToCartTextError } = this.refs;
    window.dispatchEvent(new CartErrorEvent(this.id, message));
    if (!addToCartTextError) return;
    addToCartTextError.classList.remove('hidden');

    // Reuse the text node if the user is spam-clicking
    const textNode = addToCartTextError.childNodes[2];
    if (textNode) {
      textNode.textContent = message;
    } else {
      const newTextNode = document.createTextNode(message);
      addToCartTextError.appendChild(newTextNode);
    }

    // Create or get existing error live region for screen readers
    this.#setLiveRegionText(message);

    this.#timeout = setTimeout(() => {
      if (!addToCartTextError) return;
      addToCartTextError.classList.add('hidden');

      // Clear the announcement
      this.#clearLiveRegionText();
    }, 10000);

    // When we add more than the maximum amount of items to the cart, we need to dispatch a cart update event
    // because our back-end still adds the max allowed amount to the cart.
    this.dispatchEvent(
      new CartAddEvent({}, this.id, {
        didError: true,
        source: 'product-form-component',
        itemCount: Number(formJsonData['quantity']) || Number(this.dataset.quantityDefault),
        productId: this.dataset.productId,
      })
    );
  }

  /**
   * Handles successful cart addition.
  *
  * @param {Record<string, any>} formJsonData - The form data containing product information.
  * @param {Object} responseData - The response data from the cart API.
  * @param {any} responseData.sections - The sections data from the response.
  * @param {any} responseData.items - The items data from the response.
  */
  async #handleCartSuccess(formJsonData, responseData) {

    const { addToCartTextError } = this.refs;
    const id = formJsonData['id'];

    if (addToCartTextError) {
      addToCartTextError.classList.add('hidden');
      addToCartTextError.removeAttribute('aria-live');
    }

    if (!id) throw new Error('Form ID is required');

    // Add aria-live region to inform screen readers that the item was added
    if (this.refs.addToCartButtonContainer?.refs.addToCartButton) {
      const addToCartButton = this.refs.addToCartButtonContainer.refs.addToCartButton;
      const addedTextElement = addToCartButton.querySelector('.add-to-cart-text--added');
      const addedText = addedTextElement?.textContent?.trim() || Theme.translations.added;
      this.#setLiveRegionText(addedText);
      setTimeout(() => {
        this.#clearLiveRegionText();
      }, 5000);
    }

    const cartData = await this.#getCartData();
    await this.#successAddToCart(cartData?.['token'], responseData?.['items']?.[0]?.key);

    this.dispatchEvent(
      new CartAddEvent({}, id.toString(), {
        source: 'product-form-component',
        itemCount: Number(formJsonData['quantity']) || Number(this.dataset.quantityDefault),
        productId: this.dataset.productId,
        sections: responseData.sections,
      })
    );
  }

  /**
   * @param {*} text
  */
  #setLiveRegionText(text) {
    const liveRegion = this.refs.liveRegion;
    liveRegion.textContent = text;
  }

  #clearLiveRegionText() {
    const liveRegion = this.refs.liveRegion;
    liveRegion.textContent = '';
  }

  /**
   * @param {VariantUpdateEvent} event
   */
  #onVariantUpdate = (event) => {
    if (event.detail.data.newProduct) {
      this.dataset.productId = event.detail.data.newProduct.id;
    } else if (event.detail.data.productId !== this.dataset.productId) {
      return;
    }

    const { variantId, addToCartButtonContainer } = this.refs;

    const currentAddToCartButton = addToCartButtonContainer?.refs.addToCartButton;
    const newAddToCartButton = event.detail.data.html.querySelector('[ref="addToCartButton"]');

    if (!currentAddToCartButton) return;

    // Update the button state
    if (event.detail.resource == null || event.detail.resource.available == false) {
      addToCartButtonContainer.disable();
      this.refs.acceleratedCheckoutButtonContainer?.setAttribute('hidden', 'true');
    } else {
      addToCartButtonContainer.enable();
      this.refs.acceleratedCheckoutButtonContainer?.removeAttribute('hidden');
    }

    // Update the add to cart button text and icon
    if (newAddToCartButton) {
      morph(currentAddToCartButton, newAddToCartButton);
    }

    // Update the variant ID
    variantId.value = event.detail.resource.id ?? '';

    // Set the data attribute for the add to cart button to the product variant media if it exists
    if (event.detail.resource) {
      const productVariantMedia = event.detail.resource.featured_media?.preview_image?.src;
      productVariantMedia &&
        addToCartButtonContainer?.setAttribute('data-product-variant-media', productVariantMedia + '&width=100');
    }
  };

  /**
   * Disable the add to cart button while the UI is updating before #onVariantUpdate is called.
   * Accelerated checkout button is also disabled via its own event listener not exposed to the theme.
   */
  #onVariantSelected = () => {
    this.refs.addToCartButtonContainer?.disable();
  };

  /* UdoPaint Editor Integration */
  /* ========================== */
  /**
   * Check if the UdoPaints Editor App Block is ready to export.
   * If it is not, trigger the image uploader when the feature is not gallery-kit.
   * @returns {Promise<{success: boolean, feature: string | null}>} The App Block state.
   */
  async #checkAppBlockState() {
    try {
      const { success, feature } = await window.UdoPaintsEditorManager.isReadyToExport();
      // If the App Block is not ready to export and the feature is not gallery-kit, trigger the image uploader
      if (!success && feature !== 'gallery-kit') await window.UdoPaintsEditorManager.uploadImage();
      return { success, feature };
    } catch (error) {
      console.error('Error checking App Block state:', error);
      return { success: false, feature: null };
    }
  }

  /**
   * Get the cart data.
   * @returns {Promise<Record<string, any> | null>} The cart data.
   */
  async #getCartData() {
    try {
      const response = await fetch(`${Theme.routes.cart_url}.json`);
      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('Error getting cart data:', error);
      return null;
    }
  }

  /**
   * Get the line item properties for the App Block.
   * @param {string} feature - The feature of the App Block.
   * @param {string} productId - The product ID.
   * @param {string} variantId - The variant ID.
   * @returns {Promise<Record<string, any>>} The line item properties.
   */
  async #getLineItemProperties(feature, productId, variantId) {
    /** @type {Record<string, any>} */
    let properties = { _feature: feature };
    const { originalImage, previewImage, supplierImage } = await window.UdoPaintsEditorManager.onAddToCart({ productId, variantId });
    if (feature === 'gallery-kit') {
      if (!supplierImage) throw new Error('Failed to get supplier image from Gallery Kit product');
      properties = {
        _supplier_image: supplierImage.cdnUrl || supplierImage.url,
        ...properties
      };
    } else {
      if (!previewImage || !originalImage || !supplierImage) throw new Error('Failed to get line item properties');
      properties = {
        preview_image: previewImage.cdnUrl,
        _supplier_image: supplierImage.cdnUrl,
        _original_image: originalImage.cdnUrl,
        _tmp_preview_image: previewImage.url,
        _tmp_supplier_image: supplierImage.url,
        _tmp_original_image: originalImage.url,
        ...properties
      };
    }
    return properties;
  }

  /**
   * Successfully add to cart.
   * @param {string} cartToken - The cart token.
   * @param {string} itemKey - The added item key.
   */
  async #successAddToCart(cartToken, itemKey) {
    try {
      await window.UdoPaintsEditorManager.afterAddToCart({ itemKey, cartToken });
    } catch (error) {
      console.error('Error when calling afterAddToCart:', error);
    }
  }

  /* Upsell Products */
  /* ========================== */
  /**
   * Detect upsell products in the form data.
   * @param {Record<string, any>} formJsonData - The form data containing product information.
   * @returns {{cleanFormJsonData: Record<string, any>, upsellProducts: UpsellProduct[]}} The cleaned form data and the upsell products.
   */
  #detectUpsellProducts(formJsonData) {
    const upsellProductsFormData = Object.entries(formJsonData).filter(([key]) => key.startsWith(UPSELL_PRODUCT_PREFIX));
    if (upsellProductsFormData.length === 0) return { cleanFormJsonData: formJsonData, upsellProducts: [] };
    const productTitle = formJsonData['product-title'];
    if (!productTitle) {
      console.error('Product title is missing from form data');
      window.UdoPaintsEditorManager.onError('Product title is missing from form data');
      return { cleanFormJsonData: formJsonData, upsellProducts: [] };
    }
    /** @type {UpsellProduct[]} */ const upsellProducts = [];
    Object.entries(formJsonData).forEach(([key, value]) => {
      if (key.startsWith(UPSELL_PRODUCT_PREFIX)) {
        upsellProducts.push({
          id: key.replace(UPSELL_PRODUCT_PREFIX, ''),
          title: value,
          quantity: 1,
          properties: {
            "Product": productTitle,
          }
        });
      }
    });
    // Remove the upsell products from the form data
    const cleanFormJsonData = Object.fromEntries(Object.entries(formJsonData)
      .filter(([key]) => !key.startsWith(UPSELL_PRODUCT_PREFIX)));
    const formDataProperties = {
      ...cleanFormJsonData['properties'],
      // Add the upsell products to the properties
      ...Object.fromEntries(upsellProductsFormData),
    };
    Object.assign(cleanFormJsonData, { properties: formDataProperties });
    return { cleanFormJsonData, upsellProducts };
  }
}

if (!customElements.get('product-form-component')) {
  customElements.define('product-form-component', ProductFormComponent);
}

class FlyToCart extends HTMLElement {
  /** @type {Element} */
  source;

  /** @type {Element} */
  destination;

  connectedCallback() {
    this.#animate();
  }

  #animate() {
    const rect = this.getBoundingClientRect();
    const sourceRect = this.source.getBoundingClientRect();
    const destinationRect = this.destination.getBoundingClientRect();

    //Define bezier curve points
    // Maybe add half of the size of the flying thingy to the x and y to make it center properly
    const offset = {
      x: rect.width / 2,
      y: rect.height / 2,
    };
    const startPoint = {
      x: sourceRect.left + sourceRect.width / 2 - offset.x,
      y: sourceRect.top + sourceRect.height / 2 - offset.y,
    };

    const endPoint = {
      x: destinationRect.left + destinationRect.width / 2 - offset.x,
      y: destinationRect.top + destinationRect.height / 2 - offset.y,
    };

    //Calculate the control points
    const controlPoint1 = { x: startPoint.x, y: startPoint.y - 200 }; // Go up 200px
    const controlPoint2 = { x: endPoint.x - 300, y: endPoint.y - 100 }; // Go left 300px and up 100px

    //Animation variables
    /** @type {number | null} */
    let startTime = null;
    const duration = 600; // 600ms

    this.style.opacity = '1';

    /**
     * Animates the flying thingy along the bezier curve.
     * @param {number} currentTime - The current time.
     */
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Calculate current position along the bezier curve
      const position = bezierPoint(progress, startPoint, controlPoint1, controlPoint2, endPoint);

      //Update the position of the flying thingy
      this.style.setProperty('--x', `${position.x}px`);
      this.style.setProperty('--y', `${position.y}px`);

      // Scale down as it approaches the cart
      const scale = 1 - progress * 0.5;
      this.style.setProperty('--scale', `${scale}`);

      //Continue the animation if not finished
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        //Fade out the flying thingy
        this.style.opacity = '0';
        onAnimationEnd(this, () => this.remove());
      }
    };

    // Position the flying thingy back to the start point
    this.style.setProperty('--x', `${startPoint.x}px`);
    this.style.setProperty('--y', `${startPoint.y}px`);

    //Start the animation
    requestAnimationFrame(animate);
  }
}

/**
 * Calculates a point on a cubic Bézier curve.
 * @param {number} t - The parameter value (0 <= t <= 1).
 * @param {{x: number, y: number}} p0 - The starting point (x, y).
 * @param {{x: number, y: number}} p1 - The first control point (x, y).
 * @param {{x: number, y: number}} p2 - The second control point (x, y).
 * @param {{x: number, y: number}} p3 - The ending point (x, y).
 * @returns {{x: number, y: number}} The point on the curve.
 */
function bezierPoint(t, p0, p1, p2, p3) {
  const cX = 3 * (p1.x - p0.x);
  const bX = 3 * (p2.x - p1.x) - cX;
  const aX = p3.x - p0.x - cX - bX;

  const cY = 3 * (p1.y - p0.y);
  const bY = 3 * (p2.y - p1.y) - cY;
  const aY = p3.y - p0.y - cY - bY;

  const x = aX * Math.pow(t, 3) + bX * Math.pow(t, 2) + cX * t + p0.x;
  const y = aY * Math.pow(t, 3) + bY * Math.pow(t, 2) + cY * t + p0.y;

  return { x, y };
}

if (!customElements.get('fly-to-cart')) {
  customElements.define('fly-to-cart', FlyToCart);
}
