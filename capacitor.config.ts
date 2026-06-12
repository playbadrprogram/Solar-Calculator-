import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.solar.calculator',
  appName: 'حاسبة المنظومة الشمسية',
  webDir: 'out',
  server: {
    // In production Android app, load from bundled assets
    // For development, uncomment and set your dev server URL:
    // url: 'http://192.168.1.100:3000',
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#F59E0B',
      showSpinner: true,
      spinnerColor: '#FFFFFF',
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#F59E0B',
    },
    Geolocation: {
      // Required for solar irradiance based on GPS
    },
    Network: {
      // Monitor network status
    },
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#F59E0B',
  },
};

export default config;
