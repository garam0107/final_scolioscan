const { withAndroidManifest } = require('expo/config-plugins');

function withPhoneOnlyAndroidScreens(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // 태블릿 크기 화면은 Google Play 기기 필터링에서 제외되도록 휴대폰 화면만 지원한다.
    manifest['supports-screens'] = [
      {
        $: {
          'android:smallScreens': 'true',
          'android:normalScreens': 'true',
          'android:largeScreens': 'false',
          'android:xlargeScreens': 'false',
        },
      },
    ];

    return config;
  });
}

module.exports = withPhoneOnlyAndroidScreens;
