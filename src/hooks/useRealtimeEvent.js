import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Subscribe to a real-time socket event with automatic cleanup.
 *
 * Usage:
 *   useRealtimeEvent('attendance:saved', (data) => {
 *     console.log('Attendance saved:', data);
 *     refreshData();
 *   });
 *
 * The callback is stable (uses ref) so it won't cause re-subscriptions.
 */
export default function useRealtimeEvent(event, callback) {
  const { subscribe } = useSocket();
  const callbackRef = useRef(callback);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!event) return;

    const handler = (data) => {
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    };

    const unsubscribe = subscribe(event, handler);
    return unsubscribe;
  }, [event, subscribe]);
}