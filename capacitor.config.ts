import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.loveMap.app',
  appName: 'loveMap',
  webDir: 'dist',
  plugins: {
    Geolocation: {
      permissions: ['location']
    }
  }
};

export default config;