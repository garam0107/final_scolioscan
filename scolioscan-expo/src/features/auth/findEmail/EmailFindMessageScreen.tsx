import { i18n } from '@/src/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authAPI } from '@/src/api/auth';
import SmsVerificationGuide from '@/src/components/SmsVerificationGuide';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import ToastAlert from '@/src/components/ui/ToastAlert';
import styles from '@/src/features/auth/findEmail/emailFindMessage.styles';
import { normalizePhoneNumber, normalizeRegisterMessage } from '@/src/features/auth/registerValidation';
import { openSmsComposer } from '@/src/features/auth/register/openSmsComposer';

export default function EmailFindMessageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name?: string;
    phone?: string;
  }>();
  const [smsRequested, setSmsRequested] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const accountInfo = useMemo(
    () => ({
      name: typeof params.name === 'string' ? params.name : '',
      phone: normalizePhoneNumber(typeof params.phone === 'string' ? params.phone : ''),
    }),
    [params.name, params.phone],
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

    if (!accountInfo.name || !accountInfo.phone) {
      showToast(i18n.t("이메일 찾기 정보를 다시 입력해주세요."));
      return;
    }

    setVerifyingPhone(true);

    try {
      const response = await authAPI.verifyEmailFind(accountInfo);
      setSmsRequested(false);
      showToast(i18n.t("휴대전화 번호가 인증되었어요."));
      setTimeout(() => {
        router.push({
          pathname: '/email-find-result',
          params: {
            email: response.data.email,
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
      showToast(i18n.t("휴대전화 번호를 찾을 수 없습니다."));
      return;
    }

    try {
      const response = await authAPI.messageCode({ phoneNumber: accountInfo.phone });
      const opened = await openSmsComposer({
        phoneNumber: response.data.recipientNumber,
        message: response.data.messageText,
      });

      if (!opened) {
        showToast(i18n.t("메시지 앱을 열 수 없습니다."));
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
          <Text style={styles.headerTitle}>{i18n.t("이메일 찾기")}</Text>
          <View style={styles.headerSide} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{i18n.t("인증을 위해 메시지 어플을 실행할게요")}</Text>
          <SmsVerificationGuide />
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title={i18n.t("동의 및 휴대전화 번호 확인")}
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
