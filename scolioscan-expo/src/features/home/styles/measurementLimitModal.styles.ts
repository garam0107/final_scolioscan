import { StyleSheet } from 'react-native';

import { Colors, HomeMeasurementLimitModalTokens as tokens } from '@/src/constants/theme';
import { textFont } from '@/src/constants/fonts';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.overlayHorizontalPadding,
    backgroundColor: tokens.overlayBackgroundColor,
  },
  card: {
    width: '100%',
    maxWidth: tokens.cardMaxWidth,
    alignItems: 'center',
    paddingHorizontal: tokens.cardHorizontalPadding,
    paddingTop: tokens.cardTopPadding,
    paddingBottom: tokens.cardBottomPadding,
    borderRadius: tokens.cardRadius,
    backgroundColor: Colors.primary.white,
  },
  title: {
    ...textFont,
    color: Colors.gray[900],
    fontSize: tokens.titleFontSize,
    fontWeight: '700',
    lineHeight: tokens.titleLineHeight,
    textAlign: 'center',
  },
  description: {
    marginTop: tokens.descriptionMarginTop,
    ...textFont,
    color: Colors.gray[600],
    fontSize: tokens.descriptionFontSize,
    fontWeight: '400',
    lineHeight: tokens.descriptionLineHeight,
    textAlign: 'center',
  },
  confirmButton: {
    width: '100%',
    height: tokens.buttonHeight,
    marginTop: tokens.buttonMarginTop,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.buttonRadius,
    backgroundColor: Colors.primary[500],
  },
  confirmButtonText: {
    ...textFont,
    color: Colors.primary.white,
    fontSize: tokens.buttonFontSize,
    fontWeight: '600',
  },
  pressed: {
    opacity: tokens.pressedOpacity,
  },
});

export default styles;
