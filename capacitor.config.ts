import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.multivohub.jobapp',
  appName: 'MultivoHub',
  webDir: 'frontend/dist',
  server: {
    // In development, point to the live URL so native app loads from web
    // Comment out for production builds that bundle the web assets
    // url: 'https://jobapp.multivohub.com',
    // allowNavigation: ['jobapp.multivohub.com', 'clerk.com', '*.clerk.accounts.dev'],
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
    backgroundColor: '#020617',
  },
  android: {
    backgroundColor: '#020617',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#020617',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      iosSplashResourceName: 'Default',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#020617',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
