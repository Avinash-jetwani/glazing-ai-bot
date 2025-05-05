(function() {
  // Configuration
  const widgetScriptUrl = 'https://cdn.example.com/widget.js'; // Replace with actual CDN URL in production

  // Create and inject the script element
  function injectWidget(widgetKey) {
    // Check if the script is already injected
    if (document.getElementById('glazing-widget-script')) {
      console.warn('Glazing Widget already injected');
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.id = 'glazing-widget-script';
    script.src = widgetScriptUrl;
    script.async = true;
    script.defer = true;

    // Add widget key if provided
    if (widgetKey) {
      script.setAttribute('data-key', widgetKey);
    }

    // Append to document
    document.body.appendChild(script);

    console.log('Glazing Widget injected successfully');
  }

  // Initialize widget from script tag data attribute
  const currentScript = document.currentScript;
  const widgetKey = currentScript ? currentScript.getAttribute('data-key') : null;

  // Inject when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      injectWidget(widgetKey);
    });
  } else {
    injectWidget(widgetKey);
  }

  // Expose global initialization function
  window.initGlazingWidget = function(config) {
    injectWidget(config && config.key);
  };
})();
