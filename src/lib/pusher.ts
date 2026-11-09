import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Real-time updates are optional: without Pusher keys the app falls back to polling.
export const realtimeEnabled = Boolean(process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER);

export const pusherServer = realtimeEnabled && process.env.PUSHER_APP_ID && process.env.PUSHER_SECRET
  ? new PusherServer({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    })
  : null;

let client: PusherClient | null = null;

export function getPusherClient() {
  if (!realtimeEnabled || typeof window === 'undefined') return null;
  client ??= new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
  return client;
}
