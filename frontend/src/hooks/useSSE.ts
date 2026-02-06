import { useEffect, useRef, useState } from 'react';
import { SSEEvent } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const useSSE = (runId: string | null) => {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!runId) {
      return;
    }

    const eventSource = new EventSource(`${API_BASE_URL}/runs/${runId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);
        setEvents((prev) => [...prev, data]);
      } catch (error) {
        console.error('Error parsing SSE event:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [runId]);

  const clearEvents = () => {
    setEvents([]);
  };

  return { events, isConnected, clearEvents };
};

