import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PrimaryButton from '@/src/components/ui/PrimaryButton';
import styles from '@/src/features/auth/findEmail/emailFindResult.styles';

export default function EmailFindResultScreen() {
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' && params.email.trim() ? params.email : 'example@email.com';
  const resetToLogin = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'login' }],
      }),
    );
  }, [navigation]);
  const resetToPasswordFind = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'login' }, { name: 'password-find' }],
      }),
    );
  }, [navigation]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      resetToLogin();
      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [resetToLogin]);

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.page}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={resetToLogin} hitSlop={12} style={styles.backButton}>
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
            onPress={resetToPasswordFind}
            height={48}
            backgroundColor="#F9FAFB"
            borderRadius={6}
            style={styles.secondaryButton}
            textStyle={styles.secondaryButtonText}
          />

          <PrimaryButton
            title="로그인 하러가기"
            onPress={resetToLogin}
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
