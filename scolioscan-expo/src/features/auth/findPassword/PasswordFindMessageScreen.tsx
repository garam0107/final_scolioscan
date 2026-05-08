import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authAPI } from '@/src/api/auth';
import SmsVerificationGuide from '@/src/components/SmsVerificationGuide';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import ToastAlert from '@/src/components/ui/ToastAlert';
import styles from '@/src/features/auth/findPassword/passwordFindMessage.styles';
import { normalizePhoneNumber, normalizeRegisterMessage } from '@/src/features/auth/registerValidation';
import { openSmsComposer } from '@/src/features/auth/register/openSmsComposer';

export default function PasswordFindMessageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    user_id?: string;
    name?: string;
    phone?: string;
  }>();
  const [smsRequested, setSmsRequested] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const accountInfo = useMemo(
    () => ({
      user_id: typeof params.user_id === 'string' ? params.user_id : '',
      name: typeof params.name === 'string' ? params.name : '',
      phone: normalizePhoneNumber(typeof params.phone === 'string' ? params.phone : ''),
    }),
    [params.name, params.phone, params.user_id],
  );

  const showToast = useCallback((message: string) => {
    setToastKey((current) => current + 1);
    setToastMessage(message);
  }, []);

  function getApiErrorMessage(error: unknown) {
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

    return '휴대전화 번호 인증 확인에 실패했습니다.';
  }

  const handleVerifyPhone = useCallback(async () => {
    if (!smsRequested || verifyingPhone) {
      return;
    }

    if (!accountInfo.user_id || !accountInfo.name || !accountInfo.phone) {
      showToast('비밀번호 찾기 정보를 다시 입력해주세요.');
      return;
    }

    setVerifyingPhone(true);

    try {
      const response = await authAPI.verifyPasswordReset(accountInfo);
      setSmsRequested(false);
      showToast('휴대전화 번호가 인증되었어요.');
      setTimeout(() => {
        router.push({
          pathname: '/password-find-reset',
          params: {
            reset_token: response.data.reset_token,
          },
        });
      }, 700);
    } catch (error) {
      showToast(getApiErrorMessage(error));
    } finally {
      setVerifyingPhone(false);
    }
  }, [accountInfo, router, showToast, smsRequested, verifyingPhone]);

  useEffect(() => {
    if (!smsRequested) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        timeoutId = setTimeout(() => {
          void handleVerifyPhone();
        }, 1500);
      }
    });

    return () => {
      subscription.remove();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [handleVerifyPhone, smsRequested]);

  async function handleMessagePress() {
    if (!accountInfo.phone) {
      showToast('휴대전화 번호를 찾을 수 없습니다.');
      return;
    }

    try {
      const response = await authAPI.messageCode({ phoneNumber: accountInfo.phone });
      const opened = await openSmsComposer({
        phoneNumber: response.data.recipientNumber,
        message: response.data.messageText,
      });

      if (!opened) {
        showToast('메시지 앱을 열 수 없습니다.');
        return;
      }

      setSmsRequested(true);
    } catch (error) {
      showToast(getApiErrorMessage(error));
    }
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.page}>
      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage}
        onDismiss={() => setToastMessage('')}
        toastKey={toastKey}
      />
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#7E89A0" />
          </Pressable>
          <Text style={styles.headerTitle}>비밀번호 찾기</Text>
          <View style={styles.headerSide} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>인증을 위해 메시지 앱을 실행할게요</Text>
          <SmsVerificationGuide />
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title="동의 및 휴대전화 번호 확인"
            onPress={() => void handleMessagePress()}
            height={48}
            backgroundColor="#2C9696"
            borderRadius={6}
            disabled={verifyingPhone}
            style={styles.primaryButton}
            textStyle={styles.primaryButtonText}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
