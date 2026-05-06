import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, {useState} from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import PasswordMessage from '@/src/features/settings/changePassword/PasswordMessage';
import { styles } from '@/src/features/settings/changePassword/passwordRegister.styles';
import { openSmsComposer } from '../../auth/register/openSmsComposer';
import ToastAlert from '@/src/components/ui/ToastAlert';

type ToastTone = 'info' | 'success' | 'warning' | 'error';


export default function PasswordMessageScreen() {
  const router = useRouter();
  const {user, messageCode} = useAuth();
  const [smsRequested, setSmsRequested] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastTone, setToastTone] = useState<ToastTone>('info');
  const [toastKey, setToastKey] = useState(0);
  function showToast(message: string, tone: ToastTone = 'info') {
    setToastKey((current) => current + 1);
    setToastTone(tone);
    setToastMessage(message);
  }
  // 문자 인증 함수
    const handleMessagePress = async () => {
    try {
      if (!user?.phone){
        showToast('사용자 휴대전화 번호를 찾을 수 없습니다.');
        return;
      }
      
      const messageCodeResponse = await messageCode(user.phone);
  
      const opened = await openSmsComposer({
        phoneNumber: messageCodeResponse.recipientNumber,
        message: messageCodeResponse.messageText,
      });
  
      if (!opened) {
        showToast('메시지 앱을 열 수 없습니다.');
        return;
      }
  
      setSmsRequested(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : '인증 메시지 생성에 실패했습니다.';
      showToast('메시지 인증에 실패하였습니다.');
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
            onPress={() => handleMessagePress()}
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
