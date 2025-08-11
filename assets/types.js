/**
 * @fileoverview Custom type definitions for the UdoPaints theme
 * @author UdoPaints Team
 */

/**
 * @typedef {Object} ProductVariant
 * @property {string} id - The variant ID
 * @property {string} title - The variant title
 * @property {string} [option1] - First option value
 * @property {string} [option2] - Second option value
 * @property {string} [option3] - Third option value
 * @property {number} price - The variant price
 * @property {number} [compare_at_price] - The compare at price
 * @property {boolean} available - Whether the variant is available
 * @property {string} [featured_media] - Featured media ID
 */

/**
 * @typedef {Object} CartItem
 * @property {string} key - The cart item key
 * @property {string} id - The product ID
 * @property {string} variant_id - The variant ID
 * @property {number} quantity - The quantity
 * @property {string} title - The product title
 * @property {string} variant_title - The variant title
 * @property {number} price - The item price
 * @property {string} [image] - The product image URL
 */

/**
 * @typedef {Object} CartUpdateEvent
 * @property {CartItem[]} items - The cart items
 * @property {number} item_count - Total number of items
 * @property {string} [note] - Cart note
 * @property {Object} [attributes] - Cart attributes
 */

/**
 * @typedef {Object} ProductFormData
 * @property {string} id - Product ID
 * @property {string} [quantity] - Quantity
 * @property {Object.<string, string>} [options] - Product options
 * @property {string} [properties] - Line item properties
 */

/**
 * @typedef {Object} SearchResult
 * @property {string} id - Product ID
 * @property {string} title - Product title
 * @property {string} url - Product URL
 * @property {string} [image] - Product image
 * @property {number} [price] - Product price
 * @property {string} [type] - Result type (product, article, page)
 */

/**
 * @typedef {Object} FilterOption
 * @property {string} label - Filter label
 * @property {string} value - Filter value
 * @property {number} count - Number of products with this filter
 * @property {boolean} active - Whether this filter is currently active
 */

/**
 * @typedef {Object} PaginationInfo
 * @property {number} current_page - Current page number
 * @property {number} total_pages - Total number of pages
 * @property {number} total_products - Total number of products
 * @property {string} [next_url] - URL for next page
 * @property {string} [prev_url] - URL for previous page
 */

/**
 * @typedef {Object} ThemeSettings
 * @property {Object} colors - Color scheme settings
 * @property {Object} typography - Typography settings
 * @property {Object} layout - Layout settings
 * @property {Object} cart - Cart settings
 * @property {Object} product - Product page settings
 */

/**
 * @typedef {Object} ComponentRefs
 * @property {HTMLElement} [root] - Root element
 * @property {HTMLElement[]} [items] - Item elements
 * @property {HTMLButtonElement} [button] - Button element
 * @property {HTMLFormElement} [form] - Form element
 */

/**
 * @typedef {Object} EventHandler
 * @property {string} event - Event name
 * @property {Function} handler - Event handler function
 * @property {Object} [options] - Event listener options
 */

/**
 * @typedef {Object} AnimationConfig
 * @property {string} [duration] - Animation duration
 * @property {string} [easing] - Animation easing function
 * @property {number} [delay] - Animation delay
 * @property {boolean} [enabled] - Whether animation is enabled
 */

/**
 * @typedef {Object} MediaItem
 * @property {string} id - Media ID
 * @property {string} type - Media type (image, video, model)
 * @property {string} src - Media source URL
 * @property {string} [alt] - Alt text for images
 * @property {Object} [sizes] - Responsive image sizes
 * @property {Object} [preview] - Preview image data
 */

/**
 * @typedef {Object} LocalizationData
 * @property {string} locale - Current locale
 * @property {string} currency - Current currency
 * @property {Object.<string, string>} translations - Translation strings
 * @property {Object} [formatting] - Number/date formatting options
 */

export {};
