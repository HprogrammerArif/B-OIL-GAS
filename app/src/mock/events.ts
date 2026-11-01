/**
 * In-app stand-in for the Socket.IO channel (doc 03 §22). Mock handlers emit the same
 * event names and payloads the server will push; `src/lib/realtime` subscribes in mock mode.
 */
export interface RealtimeEvent {
  event: string;
  /** Recipient user ids; empty = broadcast to every signed-in user. */
  to: string[];
  payload: unknown;
}

type Listener = (e: RealtimeEvent) => void;

const listeners = new Set<Listener>();

export const mockEvents = {
  emit(event: string, to: string[], payload: unknown): void {
    const e: RealtimeEvent = { event, to, payload };
    // Deliver after the HTTP response resolves, as a socket push would.
    setTimeout(() => listeners.forEach((l) => l(e)), 0);
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
