import { useState, useEffect } from 'react'
import Fab from './components/Fab'
import ChatModal from './components/ChatModal'
import './App.css'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [widgetKey, setWidgetKey] = useState<string>('demo-widget-key');

  useEffect(() => {
    // Get the widget key from the script data attribute
    const scriptElement = document.getElementById('glazing-widget-script');
    if (scriptElement) {
      const key = scriptElement.getAttribute('data-key');
      if (key) {
        setWidgetKey(key);
        console.log('Widget initialized with key:', key);
      } else {
        console.log('No widget key found in script, using default:', widgetKey);
      }
    } else {
      console.log('No script element found, using default widget key:', widgetKey);
    }
  }, []);

  const handleFabClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Fab onClick={handleFabClick} />
      <ChatModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        widgetKey={widgetKey}
      />
    </>
  )
}

export default App
