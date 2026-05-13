import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PrimaryButton from '@/src/components/ui/PrimaryButton';
import ToastAlert from '@/src/components/ui/ToastAlert';
import { useAuth } from '@/src/contexts/AuthContext';
import { normalizePhoneNumber, normalizeRegisterMessage } from '@/src/features/auth/registerValidation';
import PasswordMessage from '@/src/features/settings/changePassword/PasswordMessage';
import { styles } from '@/src/features/settings/changePassword/passwordRegister.styles';
import { openSmsComposer } from '../../auth/register/openSmsComposer';

type ToastTone = 'info' | 'success' | 'warning' | 'error';

export default function PasswordMessageScreen() {
  const router = useRouter();
  const { user, messageCode, octomoApi } = useAuth();
  const [smsRequested, setSmsRequested] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastTone, setToastTone] = useState<ToastTone>('info');
  const [toastKey, setToastKey] = useState(0);

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    setToastKey((current) => current + 1);
    setToastTone(tone);
    setToastMessage(message);
  }, []);

  const handleVerifyPhone = useCallback(async () => {
    // 문자 앱에서 돌아온 뒤 인증 완료 여부를 확인하고 완료되면 재설정 화면으로 보낸다.
    if (!smsRequested || verifyingPhone) {
      return;
    }

    const normalizedPhone = normalizePhoneNumber(user?.phone || '');

    if (!normalizedPhone) {
      showToast('현재 사용자 휴대전화 번호를 찾을 수 없습니다.', 'error');
      return;
    }

    setVerifyingPhone(true);

    try {
      const response = await octomoApi(normalizedPhone);

      if (response.verified) {
        showToast('휴대전화 번호 인증이 완료되었습니다.', 'success');
        setSmsRequested(false);
        router.push('/settings/password-reset')
        return;
      }

      showToast('아직 휴대전화 번호 인증이 완료되지 않았습니다.', 'warning');
    } catch (error) {
      const message = error instanceof Error ? error.message : '휴대전화 번호 인증 확인에 실패했습니다.';
      showToast(normalizeRegisterMessage(message), 'error');
    } finally {
      setVerifyingPhone(false);
    }
  }, [octomoApi, showToast, smsRequested, user?.phone, verifyingPhone]);

  useEffect(() => {
    // 문자 인증을 요청한 뒤 앱이 다시 활성화되면 서버 검증을 자동으로 시도한다.
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

  const handleMessagePress = async () => {
    // 서버에서 받은 인증 문구로 문자 앱을 열고, 복귀 후 검증할 수 있게 상태를 남긴다.
    try {
      if (!user?.phone) {
        showToast('현재 사용자 휴대전화 번호를 찾을 수 없습니다.', 'error');
        return;
      }

      const messageCodeResponse = await messageCode(user.phone);

      const opened = await openSmsComposer({
        phoneNumber: messageCodeResponse.recipientNumber,
        message: messageCodeResponse.messageText,
      });

      if (!opened) {
        showToast('메시지 앱을 열 수 없습니다.', 'error');
        return;
      }

      setSmsRequested(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : '문자 인증 메시지 생성에 실패했습니다.';
      showToast(normalizeRegisterMessage(message), 'error');
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.page}>
      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage}
        tone={toastTone}
        toastKey={toastKey}
        onDismiss={() => setToastMessage('')}
      />
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color="#B9C1CC" />
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>인증을 위해 메시지 어플을 실행할게요</Text>
          <PasswordMessage />
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title="동의 및 휴대전화 번호 확인"
            onPress={handleMessagePress}
            // onPress={() => router.push('/settings/password-reset') }
            height={48}
            backgroundColor="#5F9F9D"
            borderRadius={6}
            style={styles.primaryButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
