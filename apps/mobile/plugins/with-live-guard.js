const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
} = require('@expo/config-plugins');

const PACKAGE_PATH = ['com', 'guvencheck', 'app', 'liveguard'];
const SOURCE_DIR = path.join(__dirname, 'liveguard-native');
const KOTLIN_FILES = [
  'GuvenCheckNotificationListenerService.kt',
  'LiveGuardModule.kt',
  'LiveGuardPackage.kt',
  'LiveGuardPolicy.kt',
  'ProtectionActivityStore.kt',
];

function withLiveGuardManifest(config) {
  return withAndroidManifest(config, (mod) => {
    const app = mod.modResults.manifest.application?.[0];
    if (!app) throw new Error('Live Guard: Android application node missing');
    app.service = app.service || [];
    const serviceName = '.liveguard.GuvenCheckNotificationListenerService';
    if (!app.service.some((item) => item.$?.['android:name'] === serviceName)) {
      app.service.push({
        $: {
          'android:name': serviceName,
          'android:label': 'GüvenCheck Canlı Koruma',
          'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [
              { $: { 'android:name': 'android.service.notification.NotificationListenerService' } },
            ],
          },
        ],
      });
    }
    return mod;
  });
}

function withLiveGuardMainApplication(config) {
  return withMainApplication(config, (mod) => {
    let source = mod.modResults.contents;
    const importLine = 'import com.guvencheck.app.liveguard.LiveGuardPackage';
    if (!source.includes(importLine)) {
      source = source.replace(
        'import expo.modules.ExpoReactHostFactory',
        `import expo.modules.ExpoReactHostFactory\n${importLine}`,
      );
    }
    if (!source.includes('add(LiveGuardPackage())')) {
      source = source.replace(
        /PackageList\(this\)\.packages\.apply \{[\s\S]*?\n\s*\}/,
        'PackageList(this).packages.apply {\n          add(LiveGuardPackage())\n        }',
      );
    }
    mod.modResults.contents = source;
    return mod;
  });
}

function withLiveGuardSources(config) {
  return withDangerousMod(config, ['android', async (mod) => {
    const target = path.join(
      mod.modRequest.platformProjectRoot,
      'app', 'src', 'main', 'java', ...PACKAGE_PATH,
    );
    await fs.promises.mkdir(target, { recursive: true });
    for (const file of KOTLIN_FILES) {
      await fs.promises.copyFile(path.join(SOURCE_DIR, file), path.join(target, file));
    }
    return mod;
  }]);
}

module.exports = function withLiveGuard(config) {
  config = withLiveGuardManifest(config);
  config = withLiveGuardMainApplication(config);
  config = withLiveGuardSources(config);
  return config;
};
