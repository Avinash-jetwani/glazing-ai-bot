import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import testWebSocketConnection from './utils/wsTest.ts'
import './wsConnectionTest.js'

// Create a widget container element
const createWidgetContainer = () => {
  const containerId = 'glazing-widget-container';
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  return container;
};

// Initialize the widget
const initWidget = () => {
  const container = createWidgetContainer();

  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};

// Declare global interface for TypeScript
declare global {
  interface Window {
    GlazingWidget: {
      init: () => void;
      testWebSocket: (widgetKey?: string) => WebSocket;
      testConnection: (widgetKey?: string) => string;
    };
  }
}

// Expose the widget interface globally
if (typeof window !== 'undefined') {
  console.log('Initializing GlazingWidget global object');
  window.GlazingWidget = {
    init: initWidget,
    testWebSocket: testWebSocketConnection,
    testConnection: window.testWebSocketConnection || (() => 'Test utility not available'),
  };
  console.log('GlazingWidget initialized:', window.GlazingWidget);
}

// Auto-initialize the widget
initWidget();
