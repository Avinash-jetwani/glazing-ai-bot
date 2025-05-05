# Glazing AI Widget

A customizable chat widget for the Glazing AI platform.

## Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build the widget
npm run build

# Build the UMD widget bundle
npm run build:widget

# Run Storybook for component development
npm run storybook
```

## Usage

Include the widget in your website:

```html
<!-- Basic installation -->
<script src="https://cdn.example.com/inject.js"></script>

<!-- With API key -->
<script src="https://cdn.example.com/inject.js" data-key="YOUR_API_KEY"></script>
```

Or initialize programmatically:

```javascript
// Basic initialization
window.initGlazingWidget();

// With configuration
window.initGlazingWidget({
  key: 'YOUR_API_KEY'
});
```

## Features

- Floating action button to trigger chat
- Responsive chat modal
- API key configuration
- ESC key to close modal
- Customizable UI with Tailwind CSS

## Project Structure

- `src/components/` - UI components (Fab, ChatModal)
- `src/docs/` - Usage documentation
- `public/inject.js` - Widget injection script
- `.storybook/` - Storybook configuration
