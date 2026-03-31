import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gamingkrew.nexuschat',
  appName: 'NexusChat',
  webDir: 'public',
  server: {
    url: 'https://nexus-chat-puce.vercel.app',
    cleartext: true
  }
};

export default config;
