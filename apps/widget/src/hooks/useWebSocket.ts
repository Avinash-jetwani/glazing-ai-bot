import { useState, useEffect, useCallback, useRef } from 'react';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface WebSocketResponse {
  type: string;
  message: string;
  session_id: string;
  timestamp?: string;
}

// Helper to determine WebSocket URL
const getWebSocketUrl = (widgetKey: string): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  // For testing purposes, we'll prefer direct localhost connection first
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `ws://localhost:8000/ws/${widgetKey}`;
  }

  // In production, use same host but with ws/wss protocol
  return `${protocol}//${window.location.host}/ws/${widgetKey}`;
};

const useWebSocket = (widgetKey: string, isActive: boolean = true) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const maxReconnectAttempts = 15;
  const reconnectDelay = 1000;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create WebSocket connection
  const connectWebSocket = useCallback(() => {
    // Don't attempt to connect if component unmounted or not active
    if (!isMountedRef.current || !isActive) return;

    try {
      // Clear any pending reconnect attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Close any existing connection
      if (wsRef.current) {
        try {
          if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
            wsRef.current.close();
          }
          wsRef.current = null;
        } catch (e) {
          console.error('Error closing existing connection:', e);
        }
      }

      // Don't attempt to connect if component unmounted or not active (check again after async operations)
      if (!isMountedRef.current || !isActive) return;

      // Create new connection
      const safeWidgetKey = widgetKey || 'demo-widget-key';
      const wsUrl = getWebSocketUrl(safeWidgetKey);
      console.log(`Creating WebSocket connection to: ${wsUrl}`);

      const ws = new WebSocket(wsUrl);

      // Set up event handlers
      ws.onopen = () => {
        // Don't update state if component unmounted
        if (!isMountedRef.current) return;

        console.log('WebSocket connection established');
        setIsConnected(true);
        setReconnectAttempt(0);
      };

      ws.onmessage = (event) => {
        // Don't update state if component unmounted
        if (!isMountedRef.current) return;

        console.log('Message received:', event.data);
        try {
          const data = JSON.parse(event.data) as WebSocketResponse;

          if (data.type === 'echo') {
            const newMessage: Message = {
              id: new Date().getTime().toString(),
              text: data.message,
              isUser: false,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, newMessage]);
          } else if (data.type === 'system') {
            console.log('System message:', data.message);
          } else if (data.type === 'ping') {
            // Reply with pong
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'pong',
                timestamp: new Date().toISOString()
              }));
            }
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      ws.onclose = (event) => {
        // Don't update state or attempt reconnect if component unmounted
        if (!isMountedRef.current) return;

        console.log(`WebSocket closed: ${event.code} - ${event.reason || 'No reason'}`);
        setIsConnected(false);

        // Don't attempt to reconnect if this is coming from a deliberate close
        if (event.code === 1000) {
          return;
        }

        // Don't attempt to reconnect if not active
        if (!isActive) {
          return;
        }

        // Attempt to reconnect, but with increased delay to avoid hammering the server
        if (reconnectAttempt < maxReconnectAttempts) {
          const nextAttempt = reconnectAttempt + 1;
          // Exponential backoff: wait longer between consecutive attempts
          const delay = reconnectDelay * Math.pow(1.5, nextAttempt - 1);

          console.log(`Reconnecting... Attempt ${nextAttempt}/${maxReconnectAttempts} in ${delay}ms`);
          setReconnectAttempt(nextAttempt);

          // Store the timeout reference so we can cancel it if needed
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            if (isMountedRef.current && isActive) {
              connectWebSocket();
            }
          }, delay);
        } else {
          console.log('Max reconnect attempts reached');
        }
      };

      ws.onerror = (error) => {
        // Don't log or update state if component unmounted
        if (!isMountedRef.current) return;

        console.error('WebSocket error:', error);
        // Let onclose handle reconnection
      };

      wsRef.current = ws;
    } catch (error) {
      // Don't update state if component unmounted
      if (!isMountedRef.current) return;

      console.error('Error setting up WebSocket:', error);
      setIsConnected(false);
    }
  }, [widgetKey, reconnectAttempt, maxReconnectAttempts, reconnectDelay, isActive]);

  // Send a message
  const sendMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket not open');
      return;
    }

    try {
      // Add user message to local state first
      const userMessage: Message = {
        id: new Date().getTime().toString(),
        text,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to server
      wsRef.current.send(text);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, []);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (!isActive) return;
    setReconnectAttempt(0);
    connectWebSocket();
  }, [connectWebSocket, isActive]);

  // Connect or disconnect based on isActive
  useEffect(() => {
    if (isActive) {
      console.log('WebSocket activation - connecting...');
      connectWebSocket();
    } else if (wsRef.current) {
      console.log('WebSocket deactivation - disconnecting...');
      wsRef.current.close(1000, 'Component deactivated');
      setIsConnected(false);
    }
  }, [isActive, connectWebSocket]);

  // Set up connection and cleanup
  useEffect(() => {
    console.log('Initializing WebSocket...');
    isMountedRef.current = true;

    // Connect on mount if active
    if (isActive) {
      connectWebSocket();
    }

    // Set up heartbeat to detect stale connections
    const heartbeatInterval = setInterval(() => {
      if (!isMountedRef.current || !isActive) return;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({
            type: 'ping',
            timestamp: new Date().toISOString()
          }));
        } catch (error) {
          console.error('Error sending heartbeat:', error);
          if (wsRef.current) {
            wsRef.current.close();
          }
        }
      }
    }, 20000);

    // Cleanup on unmount
    return () => {
      console.log('WebSocket component unmounting - cleaning up connections');
      isMountedRef.current = false;
      clearInterval(heartbeatInterval);

      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Close WebSocket connection if open
      if (wsRef.current) {
        try {
          wsRef.current.close(1000, 'Component unmounted');
        } catch (e) {
          console.error('Error closing WebSocket on unmount:', e);
        }
        wsRef.current = null;
      }
    };
  }, [connectWebSocket, isActive]);

  return { messages, sendMessage, isConnected, reconnect, reconnectAttempt };
};

export default useWebSocket;
