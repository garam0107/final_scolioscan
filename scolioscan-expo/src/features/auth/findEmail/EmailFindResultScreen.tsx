import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PrimaryButton from '@/src/components/ui/PrimaryButton';
import styles from '@/src/features/auth/findEmail/emailFindResult.styles';

export default function EmailFindResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' && params.email.trim() ? params.email : 'example@email.com';

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.page}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#7E89A0" />
          </Pressable>
          <Text style={styles.headerTitle}>이메일 찾기</Text>
          <View style={styles.headerSide} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>이메일을 찾았어요!</Text>
          <Text style={styles.description}>가입하신 이메일은</Text>

          <View style={styles.emailCard}>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          <PrimaryButton
            title="비밀번호 찾기"
            onPress={() => router.push('/password-find')}
            height={48}
            backgroundColor="#F9FAFB"
            borderRadius={6}
            style={styles.secondaryButton}
            textStyle={styles.secondaryButtonText}
          />

          <PrimaryButton
            title="로그인 하러가기"
            onPress={() => router.replace('/login')}
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
