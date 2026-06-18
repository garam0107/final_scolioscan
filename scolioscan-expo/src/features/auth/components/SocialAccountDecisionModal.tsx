import React from 'react';
import { Image, Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { Colors } from '@/src/constants/theme';
import { createSocialStyles } from '../styles/social.styles';

type SocialAccountDecisionModalProps = {
  visible: boolean;
  loading: boolean;
  providerLabel: string;
  providerEmail: string | null;
  onClose: () => void;
  onHasAccount: () => void;
  onNeedSignup: () => void;
};

export default function SocialAccountDecisionModal({
  visible,
  loading,
  onClose,
  onHasAccount,
  onNeedSignup,
}: SocialAccountDecisionModalProps) {
  const { width } = useWindowDimensions();
  // 작은 화면에서도 피그마 카드 비율이 크게 틀어지지 않도록 폭을 제한한다.
  const styles = createSocialStyles(Math.min(Math.max(width - 40, 280), 328));

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.socialDecisionOverlay}>
        <Pressable style={styles.socialDecisionBackdrop} onPress={onClose} />

        <View style={styles.socialDecisionCard}>
          <View style={styles.socialDecisionContent}>
            <Image
              source={require('@/assets/icons/key.png')}
              style={styles.socialDecisionIcon}
              resizeMode="contain"
            />

            <View style={styles.socialDecisionTextGroup}>
              <Text style={styles.socialDecisionTitle}>ScolioScan에 가입한 계정이 있으신가요?</Text>
              <Text style={styles.socialDecisionMessage}>소셜 아이디와 ScolioScan 계정을 연동할게요.</Text>
            </View>
          </View>

          <View style={styles.socialDecisionButtonGroup}>
            <PrimaryButton
              title="ScolioScan 계정으로 로그인"
              onPress={onHasAccount}
              disabled={loading}
              width="100%"
              height={40}
              backgroundColor={Colors.primary[500]}
              borderRadius={6}
              textStyle={styles.socialDecisionPrimaryButtonText}
            />

            <PrimaryButton
              title="ScolioScan 계정 만들기"
              onPress={onNeedSignup}
              disabled={loading}
              width="100%"
              height={40}
              backgroundColor={Colors.primary.white}
              borderRadius={6}
              style={styles.socialDecisionSecondaryButton}
              textStyle={styles.socialDecisionSecondaryButtonText}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
