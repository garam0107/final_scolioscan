import { i18n } from '@/src/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { userAPI } from '@/src/api/user';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import ToastAlert from '@/src/components/ui/ToastAlert';
import { hasPasswordLength, hasPasswordMix } from '@/src/features/auth/registerValidation';
import styles from '@/src/features/settings/changePassword/resetPassword.styles';

type ToastTone = 'info' | 'success' | 'warning' | 'error';

function normalizeApiError(error: unknown) {
  // 비밀번호 변경 API 오류를 토스트에 보여줄 수 있는 메시지로 정리한다.
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    const detail = response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return '비밀번호 변경에 실패했습니다.';
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastTone, setToastTone] = useState<ToastTone>('info');
  const [toastKey, setToastKey] = useState(0);

  const passwordLengthReady = hasPasswordLength(newPassword);
  const passwordMixReady = hasPasswordMix(newPassword);
  const passwordConfirmed = confirmPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit =
    currentPassword.trim().length > 0 &&
    newPassword.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    passwordLengthReady &&
    passwordMixReady &&
    passwordConfirmed &&
    !submitting;

  function showToast(message: string, tone: ToastTone = 'info') {
    setToastKey((current) => current + 1);
    setToastTone(tone);
    setToastMessage(message);
  }

  async function handleChange() {
    // 현재 비밀번호와 새 비밀번호 조건이 모두 맞을 때만 변경 요청을 보낸다.
    if (!canSubmit) {
      return;
    }

    setSubmitting(true);

    try {
      await userAPI.changeUserPassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast(i18n.t("비밀번호가 변경되었습니다."), 'success');
      setTimeout(() => {
        router.dismissTo('/settings/account?toast=passwordChanged');
      }, 700);
    } catch (error) {
      showToast(normalizeApiError(error), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function renderPasswordField(
    label: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    visible: boolean,
    onToggleVisible: () => void,
    compact = false,
  ) {
    // 현재, 새 비밀번호, 확인 입력칸을 같은 구조로 렌더링한다.
    return (
      <View style={[styles.passwordFieldBlock, compact ? styles.passwordFieldBlockCompact : null]}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.passwordInputWrap}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#B5BFCE"
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            style={styles.passwordInput}
          />
          <Pressable onPress={onToggleVisible} hitSlop={8} style={styles.eyeButton}>
            <Ionicons
              name={visible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#B2BCCA"
            />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage}
        tone={toastTone}
        toastKey={toastKey}
        onDismiss={() => setToastMessage('')}
      />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#B9C1CC" />
        </Pressable>
        <Text style={styles.headerTitle}>{i18n.t("비밀번호 변경")}</Text>
        <View style={styles.headerSide} />
      </View>

      <KeyboardAwareScrollView
        bottomOffset={112}
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.guideBox}>
          <Text style={styles.guideText}>{i18n.t("새로 사용할 비밀번호를 입력해주세요.")}</Text>
          <Text style={styles.guideText}>{i18n.t("보안을 위해 다른 기기에서는 자동 로그아웃 돼요.")}</Text>
        </View>

        <View style={styles.inputCard}>
          {renderPasswordField(
            i18n.t("현재 비밀번호"),
            i18n.t("현재 비밀번호를 입력하세요"),
            currentPassword,
            setCurrentPassword,
            currentPasswordVisible,
            () => setCurrentPasswordVisible((current) => !current),
          )}

          {renderPasswordField(
            i18n.t("새 비밀번호"),
            i18n.t("새 비밀번호를 입력해주세요"),
            newPassword,
            setNewPassword,
            newPasswordVisible,
            () => setNewPasswordVisible((current) => !current),
            true,
          )}

          <View style={styles.ruleList}>
            <View style={styles.ruleRow}>
              <Ionicons
                name="checkmark"
                size={14}
                color={passwordMixReady ? '#5F9F9D' : '#C0CAD8'}
              />
              <Text style={[styles.ruleText, passwordMixReady ? styles.ruleTextActive : null]}>{i18n.t("영문자, 숫자, 특수문자 포함")}</Text>
            </View>
            <View style={styles.ruleRow}>
              <Ionicons
                name="checkmark"
                size={14}
                color={passwordLengthReady ? '#5F9F9D' : '#C0CAD8'}
              />
              <Text style={[styles.ruleText, passwordLengthReady ? styles.ruleTextActive : null]}>{i18n.t("최소 8자 이상")}</Text>
            </View>
          </View>

          {renderPasswordField(
            i18n.t("비밀번호 확인"),
            i18n.t("한 번 더 입력해주세요"),
            confirmPassword,
            setConfirmPassword,
            confirmPasswordVisible,
            () => setConfirmPasswordVisible((current) => !current),
          )}
        </View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: 46 }}>
        {/* 키보드에 화면 높이를 맡기지 않고 하단 버튼만 키보드 위로 붙인다. */}
        <View style={styles.footer}>
          <PrimaryButton
            title={i18n.t("비밀번호 변경하기")}
            onPress={handleChange}
            height={48}
            backgroundColor="#5F9F9D"
            borderRadius={6}
            style={styles.button}
            disabled={!canSubmit}
          />
        </View>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}
