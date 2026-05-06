import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { hasPasswordLength, hasPasswordMix } from '@/src/features/auth/registerValidation';
import styles from '@/src/features/settings/changePassword/resetPassword.styles';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const passwordLengthReady = hasPasswordLength(newPassword);
  const passwordMixReady = hasPasswordMix(newPassword);
  const passwordConfirmed = confirmPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit =
    currentPassword.trim().length > 0 &&
    newPassword.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    passwordLengthReady &&
    passwordMixReady &&
    passwordConfirmed;

  function renderPasswordField(
    label: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    visible: boolean,
    onToggleVisible: () => void,
    compact = false,
  ) {
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
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#B9C1CC" />
          </Pressable>
          <Text style={styles.headerTitle}>비밀번호 변경</Text>
          <View style={styles.headerSide} />
        </View>

        <View style={styles.content}>
          <View style={styles.guideBox}>
            <Text style={styles.guideText}>새로 사용할 비밀번호를 입력해주세요.</Text>
            <Text style={styles.guideText}>보안을 위해 다른 기기에서는 자동 로그아웃 돼요.</Text>
          </View>

          <View style={styles.inputCard}>
            {renderPasswordField(
              '현재 비밀번호',
              '현재 비밀번호를 입력하세요',
              currentPassword,
              setCurrentPassword,
              currentPasswordVisible,
              () => setCurrentPasswordVisible((current) => !current),
            )}

            {renderPasswordField(
              '새 비밀번호',
              '새 비밀번호를 입력해주세요',
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
                <Text style={[styles.ruleText, passwordMixReady ? styles.ruleTextActive : null]}>
                  영문자, 숫자, 특수문자 포함
                </Text>
              </View>
              <View style={styles.ruleRow}>
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={passwordLengthReady ? '#5F9F9D' : '#C0CAD8'}
                />
                <Text style={[styles.ruleText, passwordLengthReady ? styles.ruleTextActive : null]}>
                  최소 8자 이상
                </Text>
              </View>
            </View>

            {renderPasswordField(
              '비밀번호 확인',
              '한 번 더 입력해주세요',
              confirmPassword,
              setConfirmPassword,
              confirmPasswordVisible,
              () => setConfirmPasswordVisible((current) => !current),
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title="비밀번호 변경하기"
            onPress={() => undefined}
            height={48}
            backgroundColor="#5F9F9D"
            borderRadius={6}
            style={styles.button}
            disabled={!canSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
