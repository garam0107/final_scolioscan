import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SmsVerificationGuide from '@/src/components/SmsVerificationGuide';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import styles from '@/src/features/auth/findPassword/passwordFindMessage.styles';

export default function PasswordFindMessageScreen() {
  const router = useRouter();

  async function handleMessagePress() {
    router.push('/password-find-reset');
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.page}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#7E89A0" />
          </Pressable>
          <Text style={styles.headerTitle}>비밀번호 찾기</Text>
          <View style={styles.headerSide} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>인증을 위해 메시지 어플을 실행할게요</Text>
          <SmsVerificationGuide />
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title="동의 및 휴대전화 번호 확인"
            onPress={() => void handleMessagePress()}
            height={48}
            backgroundColor="#2C9696"
            borderRadius={6}
            style={styles.primaryButton}
            textStyle={styles.primaryButtonText}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
