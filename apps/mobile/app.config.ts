import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'GüvenCheck',
  slug: 'guvencheck-mobile-alpha',
  version: '0.9.0-beta.1',
  orientation: 'portrait',
  scheme: 'guvencheck',
  userInterfaceStyle: 'dark',

  icon: './assets/brand/guvencheck-app-icon.png',

  ios: {
    bundleIdentifier: 'com.guvencheck.app',
    buildNumber: '1',
    supportsTablet: true,
    infoPlist: {
      NSPhotoLibraryUsageDescription:
        'GüvenCheck, seçtiğin ekran görüntüsünü risk analizi için kullanır.',
    },
  },

  android: {
    package: 'com.guvencheck.app',
    versionCode: 1,
    blockedPermissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
    ],
    adaptiveIcon: {
      foregroundImage: './assets/brand/guvencheck-adaptive-foreground-1024.png',
      backgroundColor: '#071D18',
    },
  },

  plugins: [
  'expo-router',
  'expo-image',
  [
      'expo-splash-screen',
      {
        backgroundColor: '#071D18',
        image: './assets/brand/splash-transparent.png',
        imageWidth: 1,
        resizeMode: 'contain',
      },
    ],

    [
      'expo-image-picker',
      {
        photosPermission:
          'GüvenCheck, seçtiğin ekran görüntüsünü risk analizi için kullanır.',
        cameraPermission: false,
        microphonePermission: false,
      },
    ],

    [
      'expo-sharing',
      {
        ios: {
          enabled: true,
          extensionBundleIdentifier: 'com.guvencheck.app.ShareExtension',
          appGroupId: 'group.com.guvencheck.app',
          activationRule: {
            supportsImageWithMaxCount: 1,
            supportsText: true,
            supportsWebUrlWithMaxCount: 1,
            supportsWebPageWithMaxCount: 1,
          },
        },

        android: {
          enabled: true,
          singleShareMimeTypes: ['image/*', 'text/plain'],
          multipleShareMimeTypes: [],
        },
      },
    ],
  ],

  web: {
    favicon: './assets/brand/guvencheck-mark.png',
  },

  extra: {
    apiBaseUrl:
      process.env.EXPO_PUBLIC_API_BASE_URL ||
      'https://guvencheck.vercel.app',

    eas: {
      projectId: 'a1f0f38c-d342-4435-9ceb-52a0c95abbfa',
    },
  },

  experiments: {
    typedRoutes: true,
  },
};

export default config;
