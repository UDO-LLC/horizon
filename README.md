# UdoPaints Theme - Horizon

A custom Shopify theme based on the Horizon theme template, designed for UdoPaints with future custom features planned.

## 📋 Overview

This is a Shopify theme project built on the **Horizon** theme template (version 2.0.3) by Shopify. The theme has been customized for UdoPaints and is prepared for additional custom features in the future.

## 🏗️ Project Structure

```
udopaints-theme-horizon/
├── assets/                 # JavaScript, CSS, and media files
│   ├── *.js              # Theme functionality modules
│   ├── *.css             # Stylesheets
│   └── *.svg             # Icons and graphics
├── blocks/                # Reusable content blocks
├── config/                # Theme configuration
│   ├── settings_schema.json
│   └── settings_data.json
├── layout/                # Theme layout templates
│   ├── theme.liquid      # Main layout template
│   └── password.liquid   # Password page layout
├── locales/               # Internationalization files
├── sections/              # Page sections and components
├── snippets/              # Reusable template snippets
└── templates/             # Page templates
    ├── *.json            # Template configurations
    └── *.liquid          # Liquid templates
```

## 🚀 Features

### Core Theme Features
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Modern UI/UX**: Clean, contemporary design with smooth animations
- **Performance Optimized**: Fast loading with critical CSS and lazy loading
- **Accessibility**: WCAG compliant with skip links and proper ARIA labels
- **SEO Optimized**: Structured data and meta tags

### Page Templates
- **Homepage** (`index.json`) - Hero sections, featured products, content blocks
- **Product Pages** (`product.json`) - Product galleries, variants, recommendations
- **Collection Pages** (`collection.json`) - Product grids, filters, sorting
- **Blog & Articles** (`blog.json`, `article.json`) - Content management
- **Cart & Checkout** (`cart.json`) - Shopping cart functionality
- **Search Results** (`search.json`) - Product search with filters
- **Contact Page** (`page.contact.json`) - Contact forms and information
- **404 Error Page** (`404.json`) - Custom error handling

### Key Components
- **Header**: Logo, navigation, search, cart icon
- **Footer**: Links, social media, newsletter signup
- **Product Cards**: Quick add, variants, pricing
- **Media Gallery**: Image zoom, video support, thumbnails
- **Cart Drawer**: Slide-out cart with real-time updates
- **Search Modal**: Predictive search functionality
- **Quick Add**: One-click product addition

## 🛠️ Development Setup

### Prerequisites
- [Shopify CLI](https://shopify.dev/themes/tools/cli) (latest version)
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd udopaints-theme-horizon
   ```

2. **Install Shopify CLI** (if not already installed)
   ```bash
   npm install -g @shopify/cli @shopify/theme
   ```

3. **Login to Shopify**
   ```bash
   shopify auth login
   ```

4. **Connect to your store**
   ```bash
   shopify theme dev --store=your-store.myshopify.com
   ```

### Development Commands

```bash
# Start development server
shopify theme dev

# Push theme to store
shopify theme push

# Pull theme from store
shopify theme pull

# Deploy to production
shopify theme deploy

# Check theme for issues
shopify theme check
```

## 🎨 Customization

### Theme Settings
The theme can be customized through the Shopify admin panel under **Online Store > Themes > Customize**. Key customization areas include:

- **Colors**: Primary, secondary, and accent color schemes
- **Typography**: Font families and sizes
- **Layout**: Page width, spacing, and grid settings
- **Header & Footer**: Logo, navigation, and footer content
- **Product Display**: Grid layouts, hover effects, quick add options

### Code Customization

#### Adding Custom CSS
```css
/* Add to assets/base.css or create new CSS file */
.custom-styles {
  /* Your custom styles */
}
```

#### Adding Custom JavaScript
```javascript
// Add to assets/component.js or create new JS file
class CustomFeature {
  constructor() {
    this.init();
  }
  
  init() {
    // Your custom functionality
  }
}
```

#### Creating Custom Sections
```liquid
<!-- Create new file in sections/ -->
<div class="custom-section">
  {% for block in section.blocks %}
    <div class="custom-block">
      {{ block.settings.content }}
    </div>
  {% endfor %}
</div>

{% schema %}
{
  "name": "Custom Section",
  "blocks": [
    {
      "type": "content",
      "name": "Content Block",
      "settings": [
        {
          "type": "richtext",
          "id": "content",
          "label": "Content"
        }
      ]
    }
  ]
}
{% endschema %}
```

## 🔧 Future Custom Features

This theme is prepared for the following custom features:

- [ ] **Custom Product Configurator**
- [ ] **Advanced Filtering System**
- [ ] **Wishlist Functionality**
- [ ] **Product Comparison Tool**
- [ ] **Custom Checkout Process**
- [ ] **Inventory Management Integration**
- [ ] **Customer Portal Enhancements**

## 📁 File Organization

### Assets
- `critical.js` - Critical JavaScript for page load
- `base.css` - Main stylesheet
- Component files (e.g., `cart-drawer.js`, `product-form.js`)
- Icon SVGs and media assets

### Sections
- `header.liquid` - Site header with navigation
- `footer.liquid` - Site footer
- `product-information.liquid` - Product details
- `collection-list.liquid` - Collection pages
- `slideshow.liquid` - Image carousels

### Snippets
- `product-card.liquid` - Product display component
- `cart-drawer.liquid` - Shopping cart overlay
- `search-modal.liquid` - Search functionality
- `button.liquid` - Reusable button component

## 🌐 Internationalization

The theme supports multiple languages through the `locales/` directory:
- English (default): `en.default.json`
- Additional languages: `fr.json`, `es.json`, `de.json`, etc.

## 🚀 Deployment

### Development
```bash
shopify theme dev --store=your-store.myshopify.com
```

### Staging
```bash
shopify theme push --theme=staging-theme-id
```

### Production
```bash
shopify theme deploy --theme=production-theme-id
```

## 📝 Version Control

### Git Workflow
1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes and commit: `git commit -m "Add new feature"`
3. Push to remote: `git push origin feature/new-feature`
4. Create pull request for review

### Ignored Files
- `.shopify/` - Shopify CLI files
- `node_modules/` - Dependencies
- `*.theme` - Compiled theme files
- IDE and OS-specific files

## 🐛 Troubleshooting

### Common Issues

**Theme not loading properly:**
- Clear browser cache
- Check for JavaScript errors in console
- Verify all assets are uploaded

**Changes not appearing:**
- Ensure you're editing the correct theme version
- Check if changes are saved and published
- Clear CDN cache if using one

**Performance issues:**
- Optimize images and assets
- Minimize JavaScript and CSS
- Use lazy loading for images

## 📞 Support

For technical support or questions about this theme:

- **Documentation**: [Shopify Theme Development](https://help.shopify.com/en/manual/online-store/themes)
- **Theme Support**: [Shopify Support](https://support.shopify.com/)
- **Development Tools**: [Shopify CLI Documentation](https://shopify.dev/themes/tools/cli)

## 📄 License

This theme is based on the Shopify Horizon theme template and is customized for UdoPaints. Please refer to Shopify's terms of service for theme usage.

---

**Last Updated**: December 2024  
**Theme Version**: 2.0.3 (Horizon Base)  
**Custom Version**: 1.0.0 (UdoPaints) 