import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import FormTextField from '@/src/components/FormTextField';
import GuideMessageBox from '@/src/components/GuideMessageBox';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import ToastAlert from '@/src/components/ui/ToastAlert';
import { hasPasswordLength, hasPasswordMix } from '@/src/features/auth/registerValidation';
import styles from '@/src/features/auth/findPassword/passwordFindReset.styles';

export default function PasswordFindResetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const passwordMixReady = hasPasswordMix(newPassword);
  const passwordLengthReady = hasPasswordLength(newPassword);
  const passwordConfirmed = confirmPassword.length > 0 && newPassword === confirmPassword;
  const canContinue = useMemo(
    () => Boolean(newPassword.trim()) && Boolean(confirmPassword.trim()),
    [confirmPassword, newPassword],
  );

  function showToast(message: string) {
    setToastKey((current) => current + 1);
    setToastMessage(message);
  }

  function handleContinue() {
    if (!passwordMixReady || !passwordLengthReady) {
      showToast('비밀번호 조건을 확인해주세요.');
      return;
    }

    if (!passwordConfirmed) {
      showToast('새 비밀번호와 비밀번호 확인이 일치하지 않아요');
      return;
    }

    showToast('비밀번호 변경 API는 마지막에 연결할게요.');
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage}
        onDismiss={() => setToastMessage('')}
        toastKey={toastKey}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
        style={styles.screen}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#7E89A0" />
          </Pressable>
          <Text style={styles.headerTitle}>비밀번호 찾기</Text>
          <View style={styles.headerSide} />
        </View>

        <View style={styles.content}>
          <View style={styles.guideBoxWrap}>
            <GuideMessageBox
              messages={[
                '새로 사용할 비밀번호를 입력해주세요.',
                '보안을 위해 다른 기기에서는 자동 로그아웃 돼요.',
              ]}
            />
          </View>

          <FormTextField
            label="새 비밀번호"
            value={newPassword}
            placeholder="새 비밀번호를 입력해주세요"
            textContentType="password"
            autoComplete="password"
            secureTextEntry={!newPasswordVisible}
            showSecureToggle
            onToggleSecure={() => setNewPasswordVisible((current) => !current)}
            onChangeText={setNewPassword}
          />

          <View style={styles.passwordRules}>
            <View style={styles.passwordRuleRow}>
              <Ionicons
                name="checkmark"
                size={18}
                color={passwordMixReady ? '#5F9F9D' : '#B6BECE'}
                style={styles.passwordRuleIcon}
              />
              <Text style={[styles.passwordRuleText, passwordMixReady ? styles.passwordRuleTextActive : null]}>
                영문자, 숫자, 특수문자 포함
              </Text>
            </View>
            <View style={styles.passwordRuleRow}>
              <Ionicons
                name="checkmark"
                size={18}
                color={passwordLengthReady ? '#5F9F9D' : '#B6BECE'}
                style={styles.passwordRuleIcon}
              />
              <Text style={[styles.passwordRuleText, passwordLengthReady ? styles.passwordRuleTextActive : null]}>
                최소 8자 이상
              </Text>
            </View>
          </View>

          <FormTextField
            label="비밀번호 확인"
            value={confirmPassword}
            placeholder="한 번 더 입력해주세요"
            textContentType="password"
            autoComplete="password"
            secureTextEntry={!confirmPasswordVisible}
            showSecureToggle
            onToggleSecure={() => setConfirmPasswordVisible((current) => !current)}
            onChangeText={setConfirmPassword}
          />
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title="계속하기"
            onPress={handleContinue}
            height={48}
            backgroundColor="#5F9F9D"
            borderRadius={6}
            disabled={!canContinue}
            style={styles.button}
            textStyle={styles.buttonText}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
