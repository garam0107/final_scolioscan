import { StyleSheet } from 'react-native';
import { textFont } from '@/src/constants/fonts';
import { Colors } from '@/src/constants/theme';

const FIGMA_CARD_MAX_WIDTH = 328;
const FIGMA_CARD_MIN_WIDTH = 280;
const FIGMA_TITLE_MAX_WIDTH = 250;
const FIGMA_MESSAGE_MAX_WIDTH = 264;
const FIGMA_ICON_SIZE = 108;

export function createSocialStyles(cardWidth: number) {
  return StyleSheet.create({
    socialDecisionOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },

    socialDecisionBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: `${Colors.primary.black}59`,
    },

    socialDecisionCard: {
      width: cardWidth,
      maxWidth: FIGMA_CARD_MAX_WIDTH,
      minWidth: FIGMA_CARD_MIN_WIDTH,
      borderRadius: 24,
      backgroundColor: Colors.gray[25],
      paddingTop: 24,
      paddingRight: 20,
      paddingBottom: 24,
      paddingLeft: 20,
      gap: 32,
      shadowColor: Colors.primary.black,
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.04,
      shadowRadius: 16,
      elevation: 2,
      boxShadow: '0px 0px 16px #0000000A',
    },

    socialDecisionContent: {
      alignItems: 'center',
      gap: 16,
      width: '100%',
    },

    // PNG 원본을 모든 기기에서 같은 비율로 보이게 피그마 기준 96 크기로 고정한다.
    socialDecisionIcon: {
      width: FIGMA_ICON_SIZE,
      height: FIGMA_ICON_SIZE,
    },

    socialDecisionTextGroup: {
      alignItems: 'center',
      gap: 16,
      width: '100%',
    },

    // 제목은 강제 줄바꿈 없이 폭만 제어해서 피그마처럼 2줄로 정리되게 맞춘다.
    socialDecisionTitle: {
      ...textFont,
      width: '100%',
      maxWidth: FIGMA_TITLE_MAX_WIDTH,
      alignSelf: 'center',
      color: Colors.primary[500],
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600',
      textAlign: 'center',
    },

    // 본문도 최대 폭을 고정해 피그마와 같은 줄 길이로 보이도록 맞춘다.
    socialDecisionMessage: {
      ...textFont,
      width: '100%',
      maxWidth: FIGMA_MESSAGE_MAX_WIDTH,
      alignSelf: 'center',
      color: Colors.gray[600],
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '500',
      textAlign: 'center',
    },

    socialDecisionButtonGroup: {
      width: '100%',
      gap: 12,
    },

    socialDecisionPrimaryButtonText: {
      ...textFont,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      color: Colors.primary.white,
    },

    socialDecisionSecondaryButton: {
      borderWidth: 1,
      borderColor: Colors.gray[100],
      backgroundColor: Colors.gray[50],
    },

    socialDecisionSecondaryButtonText: {
      ...textFont,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      color: Colors.gray[900],
    },
  });
}

export default createSocialStyles(FIGMA_CARD_MAX_WIDTH);
