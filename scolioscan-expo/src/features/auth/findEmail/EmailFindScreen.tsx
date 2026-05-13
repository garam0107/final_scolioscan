import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authAPI } from '@/src/api/auth';
import FormTextField from '@/src/components/FormTextField';
import GuideMessageBox from '@/src/components/GuideMessageBox';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import ToastAlert from '@/src/components/ui/ToastAlert';
import {
  formatPhoneNumber,
  isValidPhoneNumber,
  normalizePhoneNumber,
  normalizeRegisterMessage,
} from '@/src/features/auth/registerValidation';
import styles from '@/src/features/auth/findEmail/emailFind.styles';

export default function EmailFindScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [checkingAccount, setCheckingAccount] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const canContinue = useMemo(() => Boolean(name.trim()) && isValidPhoneNumber(phone), [name, phone]);

  function showToast(message: string) {
    setToastKey((current) => current + 1);
    setToastMessage(message);
  }

  function getApiErrorMessage(error: unknown) {
    // 계정 찾기 API 오류를 사용자에게 보여줄 안내 문구로 정리한다.
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { data?: { detail?: string } } }).response;
      const detail = response?.data?.detail;
      if (typeof detail === 'string' && detail.trim()) {
        return normalizeRegisterMessage(detail);
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return normalizeRegisterMessage(error.message);
    }

    return '이메일 찾기 정보 확인에 실패했습니다.';
  }

  async function handleContinue() {
    // 이름과 휴대폰 번호로 가입 계정이 있는지 확인한 뒤 문자 인증 단계로 이동한다.
    if (checkingAccount) {
      return;
    }

    if (!name.trim()) {
      showToast('이름을 입력해주세요.');
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      showToast('휴대전화 번호를 올바르게 입력해주세요.');
      return;
    }

    const payload = {
      name: name.trim(),
      phone,
    };

    setCheckingAccount(true);

    try {
      const response = await authAPI.checkEmailFindAccount(payload);

      if (!response.data.exists) {
        showToast('해당 정보로 가입된 이메일이 없어요.');
        return;
      }

      router.push({
        pathname: '/email-find-message',
        params: {
          name: payload.name,
          phone: payload.phone,
        },
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
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#7E89A0" />
          </Pressable>
          <Text style={styles.headerTitle}>이메일 찾기</Text>
          <View style={styles.headerSide} />
        </View>

        <KeyboardAwareScrollView
          bottomOffset={96}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.guideBoxWrap}>
            <GuideMessageBox
              messages={[
                '가입하신 이름과 휴대전화 번호를 입력해주세요.',
                '휴대전화 번호 인증 후 확인하실 수 있어요.',
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
            label="휴대전화 번호"
            value={formatPhoneNumber(phone)}
            placeholder="010-0000-0000"
            keyboardType="number-pad"
            maxLength={13}
            textContentType="telephoneNumber"
            autoComplete="tel"
            onChangeText={(value) => setPhone(normalizePhoneNumber(value))}
          />
        </KeyboardAwareScrollView>
      <KeyboardStickyView offset={{ closed: 0, opened: 46 }}>
        {/* 키보드에 화면 높이를 맡기지 않고 하단 버튼만 키보드 위로 붙인다. */}
        <View style={styles.footer}>
          <PrimaryButton
            title="계속하기"
            onPress={handleContinue}
            height={48}
            backgroundColor="#2C9696"
            borderRadius={6}
            disabled={!canContinue || checkingAccount}
            style={styles.button}
            textStyle={styles.buttonText}
          />
        </View>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}
