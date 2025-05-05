import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

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

// Expose the widget interface globally
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.GlazingWidget = {
    init: initWidget,
  };
}

// Auto-initialize the widget
initWidget();
