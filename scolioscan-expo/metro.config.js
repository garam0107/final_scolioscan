const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...new Set([...config.resolver.sourceExts, 'svg'])];
config.resolver.assetExts = [...new Set([...config.resolver.assetExts, 'glb'])];
// Android Gradle/CMake가 생성·삭제하는 중간 산출물은 Metro 감시 대상에서 제외한다.
// 제외하지 않으면 Clean 또는 빌드 도중 사라진 폴더를 감시하다 ENOENT로 Metro가 종료될 수 있다.
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
  /[\\/]node_modules[\\/].+[\\/]android[\\/]\.cxx[\\/].*/,
];
module.exports = config;
