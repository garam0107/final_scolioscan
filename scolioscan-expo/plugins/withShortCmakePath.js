const { withAppBuildGradle } = require('expo/config-plugins');
const os = require('node:os');

const SHORT_CMAKE_PATH = 'C:/tmp/scolioscan-cmake';

function withShortCmakePath(config) {
  if (os.platform() !== 'win32') {
    return config;
  }

  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = addShortCmakePath(config.modResults.contents);
    }

    return config;
  });
}

function addShortCmakePath(appBuildGradle) {
  if (appBuildGradle.includes('buildStagingDirectory = file("C:/tmp/scolioscan-cmake")')) {
    return appBuildGradle;
  }

  const cmakeConfig = `
    // 윈도우 CMake 산출물 경로를 짧게 만들어 260자 경로 제한을 피합니다.
    externalNativeBuild {
        cmake {
            buildStagingDirectory = file("${SHORT_CMAKE_PATH}")
        }
    }`;

  const pattern = /(android\s*\{[\s\S]*?compileSdk[^\n]*\n)/;

  if (pattern.test(appBuildGradle)) {
    return appBuildGradle.replace(pattern, `$1${cmakeConfig}\n`);
  }

  return appBuildGradle;
}

module.exports = withShortCmakePath;
