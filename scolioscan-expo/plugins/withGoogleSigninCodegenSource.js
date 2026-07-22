const { withProjectBuildGradle } = require('expo/config-plugins');

const GOOGLE_SIGNIN_PROJECT = 'react-native-google-signin_google-signin';

module.exports = function withGoogleSigninCodegenSource(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    if (config.modResults.contents.includes(GOOGLE_SIGNIN_PROJECT)) {
      return config;
    }

    // RN 0.81 새 아키텍처에서 Google Sign-In의 생성 Java 소스를 컴파일 경로에 포함한다.
    config.modResults.contents += `

// Google Sign-In Codegen 산출물은 라이브러리 build.gradle에 자동 등록되지 않아 보정한다.
subprojects { subproject ->
    if (subproject.name == '${GOOGLE_SIGNIN_PROJECT}') {
        subproject.afterEvaluate {
            def androidExtension = subproject.extensions.findByName('android')
            androidExtension.sourceSets.main.java.srcDir(
                new File(subproject.buildDir, 'generated/source/codegen/java')
            )
        }
    }
}
`;

    return config;
  });
};
