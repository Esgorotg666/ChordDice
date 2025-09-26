import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chordriff.generator',
  appName: 'chorddice',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  }
};

export default config;
