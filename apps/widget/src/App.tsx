import { useState, useEffect } from 'react'
import Fab from './components/Fab'
import ChatModal from './components/ChatModal'
import './App.css'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [widgetKey, setWidgetKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Get the widget key from the script data attribute
    const scriptElement = document.getElementById('glazing-widget-script');
    if (scriptElement) {
      const key = scriptElement.getAttribute('data-key');
      setWidgetKey(key || undefined);

      if (key) {
        console.log('Widget initialized with key:', key);
      }
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
