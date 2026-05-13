const { withAndroidManifest, withInfoPlist } = require('expo/config-plugins');

function withCleartextTraffic(config) {
  config = withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];

    if (application) {
      // 안드로이드에서 HTTP 통신을 임시로 허용한다.
      application.$['android:usesCleartextTraffic'] = 'true';
    }

    return config;
  });

  config = withInfoPlist(config, (config) => {
    const appTransportSecurity = config.modResults.NSAppTransportSecurity ?? {};

    config.modResults.NSAppTransportSecurity = {
      ...appTransportSecurity,
      // iOS에서 HTTP 통신을 임시로 허용한다.
      NSAllowsArbitraryLoads: true,
    };

    return config;
  });

  return config;
}

module.exports = withCleartextTraffic;
