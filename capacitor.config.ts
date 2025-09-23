import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chordriff.generator',
  appName: 'Chord Riff Generator',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  }
};

export default config;
