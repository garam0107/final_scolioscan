import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FormTextField from '@/src/components/FormTextField';
import GuideMessageBox from '@/src/components/GuideMessageBox';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import ToastAlert from '@/src/components/ui/ToastAlert';
import { authAPI } from '@/src/api/auth';
import {
  formatPhoneNumber,
  isValidEmail,
  isValidPhoneNumber,
  normalizePhoneNumber,
} from '@/src/features/auth/registerValidation';
import styles from '@/src/features/auth/findPassword/passwordFind.styles';

export default function PasswordFindScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [checkingAccount, setCheckingAccount] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const canContinue = useMemo(
    () => Boolean(name.trim()) && isValidEmail(email.trim()) && isValidPhoneNumber(phone),
    [email, name, phone],
  );

  function showToast(message: string) {
    setToastKey((current) => current + 1);
    setToastMessage(message);
  }

  function getApiErrorMessage(error: unknown) {
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

    return '요청 처리 중 오류가 발생했습니다.';
  }

  async function handleContinue() {
    if (checkingAccount) {
      return;
    }

    if (!name.trim()) {
      showToast('이름을 입력해주세요.');
      return;
    }

    if (!isValidEmail(email.trim())) {
      showToast('올바른 이메일 형식으로 입력해주세요.');
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      showToast('휴대전화 번호를 올바르게 입력해주세요.');
      return;
    }

    setCheckingAccount(true);

    try {
      const payload = {
        user_id: email.trim(),
        name: name.trim(),
        phone: normalizePhoneNumber(phone),
      };
      const response = await authAPI.checkPasswordResetAccount(payload);

      if (!response.data.exists) {
        showToast('입력하신 메일 혹은 휴대전화 번호로 가입한 계정 정보가 없어요');
        return;
      }

      router.push({
        pathname: '/password-find-message',
        params: payload,
      });
    } catch (error) {
      showToast(getApiErrorMessage(error));
    } finally {
      setCheckingAccount(false);
    }
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
        keyboardVerticalOffset={0}
        style={styles.screen}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#7E89A0" />
          </Pressable>
          <Text style={styles.headerTitle}>비밀번호 찾기</Text>
          <View style={styles.headerSide} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.guideBoxWrap}>
            <GuideMessageBox
              messages={[
                '가입하신 이메일 주소와 휴대전화 번호를 입력해주세요.',
                '휴대전화 번호 인증 후 변경하실 수 있어요.',
              ]}
            />
          </View>

          <FormTextField
            label="이름"
            value={name}
            placeholder="이름을 입력하세요"
            textContentType="name"
            autoComplete="name"
            onChangeText={setName}
          />
          <FormTextField
            label="이메일"
            value={email}
            placeholder="example@email.com"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            onChangeText={setEmail}
          />
          <FormTextField
            label="휴대전화 번호"
            value={formatPhoneNumber(phone)}
            placeholder="010-0000-0000"
            keyboardType="number-pad"
            maxLength={13}
            textContentType="telephoneNumber"
            autoComplete="tel"
            onChangeText={(value) => setPhone(normalizePhoneNumber(value))}
          />
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            title="계속하기"
            onPress={handleContinue}
            height={48}
            backgroundColor="#5F9F9D"
            borderRadius={6}
            disabled={!canContinue || checkingAccount}
            style={styles.button}
            textStyle={{ fontSize: 16, fontWeight: '500', lineHeight: 22 }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
