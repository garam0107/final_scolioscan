import { i18n } from '@/src/i18n';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';

import styles from '@/src/features/settings/accountManage/components/accountManageComponents.styles';

type DeleteAccountModalProps = {
  visible: boolean;
  completeVisible: boolean;
  password: string;
  errorMessage: string;
  withdrawing: boolean;
  onClose: () => void;
  onPasswordChange: (value: string) => void;
  onWithdraw: () => void;
  onCompleteConfirm: () => void;
};

export default function DeleteAccountModal({
  visible,
  completeVisible,
  password,
  errorMessage,
  withdrawing,
  onClose,
  onPasswordChange,
  onWithdraw,
  onCompleteConfirm,
}: DeleteAccountModalProps) {
  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable style={styles.withdrawModalOverlay} onPress={onClose}>
          <Pressable style={styles.withdrawModalCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.withdrawModalTitle}>{i18n.t("떠나신다니 아쉬워요.")}</Text>
            <Text style={styles.withdrawModalDescription}>{i18n.t("탈퇴하신다면 아래 정보가 삭제돼요.")}</Text>

            <View style={styles.withdrawDeleteBox}>
              <Text style={styles.withdrawDeleteTitle}>{i18n.t("삭제되는 항목")}</Text>
              <Text style={styles.withdrawDeleteText}>{i18n.t("• 가입 계정 및 비밀번호")}</Text>
              <Text style={styles.withdrawDeleteText}>{i18n.t("• 이름 및 전화번호 등의 개인정보")}</Text>
              <Text style={styles.withdrawDeleteText}>{i18n.t("• 2D, 3D 촬영 기록")}</Text>
              <Text style={styles.withdrawDeleteText}>{i18n.t("• 척추측만계 측정 기록")}</Text>
              <Text style={styles.withdrawDeleteText}>{i18n.t("• 분석 및 리포트 히스토리")}</Text>
              <Text style={styles.withdrawDeleteText}>{i18n.t("• 앱 설정 (알림 등)")}</Text>
            </View>

            <Text style={styles.withdrawConfirmText}>{i18n.t("확인을 위해 아래에 비밀번호를 입력해주세요")}</Text>
            <View style={styles.withdrawPasswordWrap}>
              <TextInput
                value={password}
                onChangeText={onPasswordChange}
                placeholder={i18n.t("비밀번호를 입력해주세요")}
                placeholderTextColor="#B6BECE"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                style={styles.withdrawPasswordInput}
              />
            </View>
            {errorMessage ? <Text style={styles.withdrawErrorText}>{errorMessage}</Text> : null}

            <View style={styles.withdrawButtonRow}>
              <Pressable style={styles.withdrawCancelButton} onPress={onClose}>
                <Text style={styles.withdrawCancelText}>{i18n.t("취소")}</Text>
              </Pressable>
              <Pressable
                disabled={!password.trim() || withdrawing}
                style={[
                  styles.withdrawConfirmButton,
                  password.trim() ? styles.withdrawConfirmButtonActive : null,
                ]}
                onPress={onWithdraw}
              >
                <Text style={styles.withdrawConfirmButtonText}>{withdrawing ? i18n.t("처리 중...") : i18n.t("회원탈퇴")}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={completeVisible}
        transparent
        animationType="fade"
        onRequestClose={() => undefined}
      >
        <View style={styles.withdrawModalOverlay}>
          <View style={styles.withdrawCompleteCard}>
            <Text style={styles.withdrawCompleteTitle}>{i18n.t("회원 탈퇴가 완료되었습니다.")}</Text>
            <Pressable style={styles.withdrawCompleteButton} onPress={onCompleteConfirm}>
              <Text style={styles.withdrawCompleteButtonText}>{i18n.t("확인")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
