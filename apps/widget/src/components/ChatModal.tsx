import React, { useEffect, useRef, useState } from 'react';
import useWebSocket from '../hooks/useWebSocket';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetKey?: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, widgetKey }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const [localMessages, setLocalMessages] = useState<Array<{
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
  }>>([]);

  // Always call hooks unconditionally
  const { messages, sendMessage, isConnected, reconnect, reconnectAttempt } = useWebSocket(widgetKey || 'demo-widget-key', isOpen);

  // Sync messages from WebSocket to local state
  useEffect(() => {
    if (messages.length > 0) {
      setLocalMessages(messages);
    }
  }, [messages]);

  // Handle Escape key press
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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [localMessages]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && isConnected) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReconnect = () => {
    reconnect();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[500px] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Chat with us</h2>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm text-gray-500 mr-2">{isConnected ? 'Connected' : 'Disconnected'}</span>
            {!isConnected && (
              <button
                onClick={handleReconnect}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded mr-2 hover:bg-blue-600"
              >
                Reconnect
              </button>
            )}
            <button
              onClick={onClose}
              className="ml-4 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div ref={messageContainerRef} className="flex-1 overflow-auto p-4 bg-gray-50">
          <div className="space-y-4">
            {localMessages.length === 0 ? (
              <div className="bg-blue-100 p-3 rounded-lg max-w-[80%]">
                <p className="text-sm">Hello! How can I help you today?</p>
                <p className="text-xs text-gray-500 mt-1">Widget Key: {widgetKey || 'demo-widget-key'}</p>
              </div>
            ) : (
              localMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.isUser
                      ? 'bg-blue-600 text-white ml-auto'
                      : 'bg-blue-100 text-gray-800'
                  } max-w-[80%] ${message.isUser ? 'ml-auto' : ''}`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            )}
            {!isConnected && reconnectAttempt > 0 && (
              <div className="bg-yellow-100 p-3 rounded-lg w-full text-center">
                <p className="text-sm text-yellow-800">Connection lost. {reconnectAttempt >= 15 ? 'Please try reconnecting manually.' : `Reconnecting (${reconnectAttempt}/15)...`}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t">
          <div className="flex">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isConnected}
            />
            <button
              onClick={handleSendMessage}
              disabled={!isConnected || !inputMessage.trim()}
              className={`px-4 py-2 rounded-r-lg ${
                isConnected && inputMessage.trim()
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
