import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  primary: {
    black: '#000000',
    white: '#FFFFFF',
    500: '#2C9696',
  },
  gray: {
    900: '#25272D',
    800: '#2B2F36',
    700: '#3B4049',
    600: '#515968',
    500: '#657085',
    400: '#7E89A0',
    300: '#97A2B9',
    200: '#B6BECE',
    100: '#D4D9E2',
    90: '#E3E7ED',
    75: '#EDEFF3',
    50: '#F3F4F7',
    25: '#F9FAFB',
  },
  mint: {
    600: '#20797E',
    500: '#2C9696',
    400: '#22BCB7',
    300: '#7AD7D4',
    50: '#D7F9F9',
    25: '#EDFDFC',
  },
  blue: {
    600: '#007AF5',
    500: '#2E96FF',
    400: '#52A8FF',
    300: '#80BFFF',
    50: '#CFE7FF',
    25: '#EBF5FF',
  },
  red: {
    300: '#FF7373',
    400: '#FF4747',
    50: '#FFDBDB',
    25: '#FFF3F3',
  },
  yellow: {
    300: '#FAD342',
  },

};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// 홈 측정 제한 알림창의 크기와 간격을 한 곳에서 관리한다.
export const HomeMeasurementLimitModalTokens = {
  overlayBackgroundColor: 'rgba(20, 28, 36, 0.28)',
  overlayHorizontalPadding: 24,
  cardMaxWidth: 330,
  cardRadius: 20,
  cardHorizontalPadding: 24,
  cardTopPadding: 28,
  cardBottomPadding: 20,
  titleFontSize: 18,
  titleLineHeight: 26,
  descriptionMarginTop: 12,
  descriptionFontSize: 14,
  descriptionLineHeight: 21,
  buttonMarginTop: 24,
  buttonHeight: 44,
  buttonRadius: 10,
  buttonFontSize: 15,
  pressedOpacity: 0.92,
} as const;

// 로그인 화면의 공통 세로 여백을 한곳에서 관리한다.
export const LoginScreenTokens = {
  screenVerticalPadding: 24,
} as const;
