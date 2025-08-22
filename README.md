# UdoPaints Theme - Horizon

A custom Shopify theme forked from Shopify's Horizon theme, enhanced with specialized features for UdoPaints.

## 📋 Overview

This repository contains a **forked and customized version** of Shopify's Horizon theme, specifically tailored for UdoPaints. The theme has been enhanced with custom integrations and specialized product features.

### 🎯 Key Enhancements

- **Custom Product Integration**: Specialized product templates and functionality
- **Enhanced User Experience**: Improved product customization workflows
- **Advanced Product Templates**: Specialized templates for different product types
- **Custom JavaScript Modules**: Enhanced functionality and state management
- **Extended Type Definitions**: Improved development experience

## 🏗️ Project Structure

```
udopaints-theme-horizon/
├── assets/                    # JavaScript, CSS, and media files
│   ├── *.js                  # Theme functionality modules
│   ├── base.css              # Main stylesheet
│   └── *.svg                 # Icons and graphics
├── blocks/                   # Reusable content blocks
├── config/                   # Theme configuration
│   ├── settings_schema.json  # Theme settings
│   └── settings_data.json    # Default settings
├── layout/                   # Theme layout templates
├── locales/                  # Internationalization files
├── sections/                 # Page sections and components
├── snippets/                 # Reusable template snippets
└── templates/                # Page templates
    ├── product.json          # Standard product template
    └── *.json               # Other template configurations
```

## 🚀 Features

### Core Theme Features
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Modern UI/UX**: Clean, contemporary design with smooth animations
- **Performance Optimized**: Fast loading with critical CSS and lazy loading
- **Accessibility**: WCAG compliant with skip links and proper ARIA labels
- **SEO Optimized**: Structured data and meta tags
- **Gift Card Support**: Enhanced gift card recipient forms
- **Touch Device Optimization**: Improved submenu handling for tablets

### Custom Enhancements
- **Specialized Product Templates**: Custom templates for different product types
- **Enhanced Product Forms**: Advanced variant handling and state management
- **Custom Integration**: Seamless integration with specialized applications
- **Advanced State Management**: Robust state handling for complex configurations
- **Performance Optimizations**: Custom optimizations for specific use cases

### Page Templates
- **Homepage** (`index.json`) - Hero sections, featured products, content blocks
- **Product Pages** (`product.json`) - Product templates with enhanced functionality
- **Collection Pages** (`collection.json`) - Product grids, filters, sorting
- **Blog & Articles** (`blog.json`, `article.json`) - Content management
- **Cart & Checkout** (`cart.json`) - Shopping cart functionality
- **Search Results** (`search.json`) - Product search with filters
- **Contact Page** (`page.contact.json`) - Contact forms and information
- **404 Error Page** (`404.json`) - Custom error handling

## 🛠️ Development Setup

### Prerequisites
- [Shopify CLI](https://shopify.dev/themes/tools/cli) (latest version)
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/udopaints-theme-horizon.git
   cd udopaints-theme-horizon
   ```

2. **Install Shopify CLI** (if not already installed)
   ```bash
   npm install -g @shopify/cli
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

# Check theme for issues
shopify theme check

# List themes
shopify theme list
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

## 📁 Key Files

### Assets
- `critical.js` - Critical JavaScript for page load
- `base.css` - Main stylesheet
- Custom JavaScript modules for enhanced functionality
- Icon SVGs and media assets

### Templates
- `product.json` - Standard product template with enhancements

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

### Push to Store
```bash
# Push to specific theme
shopify theme push --theme=theme-id

# Push to live theme
shopify theme push --live
```

## 📝 Version Control

### Git Workflow
1. Create feature branch: `git checkout -b feature/new-feature`
2. Make changes and commit: `git commit -m "Add new feature"`
3. Push to remote: `git push origin feature/new-feature`
4. Create pull request for review

### Branch Strategy
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `hotfix/*` - Critical bug fixes

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

- **Shopify Documentation**: [Shopify Theme Development](https://help.shopify.com/en/manual/online-store/themes)
- **Theme Support**: [Shopify Support](https://support.shopify.com/)
- **Development Tools**: [Shopify CLI Documentation](https://shopify.dev/themes/tools/cli)

## 📄 License

This theme is forked from Shopify's Horizon theme and is customized for UdoPaints. The original Horizon theme is licensed under Shopify's terms of service. Please refer to Shopify's terms of service for theme usage and the LICENSE.md file for complete licensing information.

## 📋 Changelog

See `release-notes.md` for detailed information about recent changes and updates.

