export {};

declare global {
  interface Shopify {
    country: string;
    currency: {
      active: string;
      rate: string;
    };
    designMode: boolean;
    locale: string;
    shop: string;
    loadFeatures(features: ShopifyFeature[], callback?: LoadCallback): void;
    ModelViewerUI?: ModelViewer;
    visualPreviewMode: boolean;
    formatMoney(amount: number): string;
  }

  interface Theme {
    translations: Record<string, string>;
    placeholders: {
      general: string[];
      product: string[];
    };
    routes: {
      cart_add_url: string;
      cart_change_url: string;
      cart_update_url: string;
      cart_url: string;
      predictive_search_url: string;
      search_url: string;
    };
    utilities: {
      scheduler: {
        schedule: (task: () => void) => void;
      };
    };
    template: {
      name: string;
    };
  }

  interface Window {
    Shopify: Shopify;
    UdoPaintsEditor: UdoPaintsEditor;
    UdoPaintsEditorManager: UdoPaintsEditorManager;
  }

  declare const Shopify: Shopify;
  declare const Theme: Theme;

  type LoadCallback = (error: Error | undefined) => void;

  // Refer to https://github.com/Shopify/shopify/blob/main/areas/core/shopify/app/assets/javascripts/storefront/load_feature/load_features.js
  interface ShopifyFeature {
    name: string;
    version: string;
    onLoad?: LoadCallback;
  }

  // Refer to https://github.com/Shopify/model-viewer-ui/blob/main/src/js/model-viewer-ui.js
  interface ModelViewer {
    new (
      element: Element,
      options?: {
        focusOnPlay?: boolean;
      }
    ): ModelViewer;
    play(): void;
    pause(): void;
    toggleFullscreen(): void;
    zoom(amount: number): void;
    destroy(): void;
  }

  // UdoPaintsEditor App Block Interface
  interface UdoPaintsEditor {
    /**
     * Called when a product is added to cart
     * @param {object} params - The parameters object
     * @param {string} params.productId - The product ID
     * @param {string} params.variantId - The variant ID
     * @returns Promise with result object
     */
    onAddToCart(params: {productId: string, variantId: string}): Promise<{
      success: boolean;
      feature?: string;
      error?: string;
      orientation?: string;
      previewImage?: {
        url: string;
        cdnUrl: string;
      };
      originalImageUrl?: string;
      supplierImageUrl?: string;
    }>;

    /**
     * Called after a product has been added to cart
     * @param {object} params - The parameters object
     * @param {string} params.itemKey - The cart item key
     * @param {string} params.cartToken - The cart token
     * @returns Promise with result object
     */
    afterAddToCart(params: {itemKey: string, cartToken: string}): Promise<{
      success: boolean;
      error?: string;
    }>;

    /**
     * Checks if the product is ready for export
     * @returns Promise with result object
     */
    isReadyToExport(): Promise<{
      success: boolean;
      feature: string;
      error?: string;
    }>;

    /**
     * Handles errors from the app
     * @param error - The error object
     */
    onError(error: any): Promise<void>;

    /**
     * Initiates image upload process
     * @returns Promise with result object
     */
    uploadImage(): Promise<{
      success: boolean;
      feature: string;
      error?: string;
    }>;

    /**
     * State change handler function
     */
    onStateChange(callback: (params: {state: string, timestamp: number}) => Promise<void> | void): void;
  }

  // UdoPaintsEditor Manager Interface
  interface UdoPaintsEditorManager {
    isReady: boolean;
    readyCallbacks: (() => void)[];
    checkAvailability(): void;
    onReady(callback: () => void): void;
    isAvailable(): boolean;
    // All UdoPaintsEditor methods with same signatures
    onAddToCart: UdoPaintsEditor['onAddToCart'];
    afterAddToCart: UdoPaintsEditor['afterAddToCart'];
    isReadyToExport: UdoPaintsEditor['isReadyToExport'];
    onError: UdoPaintsEditor['onError'];
    uploadImage: UdoPaintsEditor['uploadImage'];
    onStateChange: UdoPaintsEditor['onStateChange'];
  }
}
