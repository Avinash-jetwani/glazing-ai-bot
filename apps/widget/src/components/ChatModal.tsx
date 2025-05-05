import React, { useEffect } from 'react';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetKey?: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, widgetKey }) => {
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[500px] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Chat with us</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          <div className="space-y-4">
            <div className="bg-blue-100 p-3 rounded-lg max-w-[80%]">
              <p className="text-sm">Hello! How can I help you today?</p>
              <p className="text-xs text-gray-500 mt-1">Widget Key: {widgetKey || 'No key provided'}</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t">
          <div className="flex">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
