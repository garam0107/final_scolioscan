const { withAndroidManifest } = require('expo/config-plugins');

const BLOCKED_PERMISSIONS = new Set([
  'android.permission.RECORD_AUDIO',
  'android.permission.SYSTEM_ALERT_WINDOW',
]);

function withBlockedAndroidPermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const permissions = manifest['uses-permission'] ?? [];

    // 출시 앱에서 사용하지 않는 민감 권한만 빌드 시점에 제거한다.
    manifest['uses-permission'] = permissions.filter((permission) => {
      const permissionName = permission.$?.['android:name'];
      return !BLOCKED_PERMISSIONS.has(permissionName);
    });

    return config;
  });
}

module.exports = withBlockedAndroidPermissions;
