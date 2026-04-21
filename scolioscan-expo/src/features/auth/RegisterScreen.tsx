import { Link } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function RegisterScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>회원가입 화면</Text>
        <Text style={styles.description}>다음 단계에서 회원가입 폼을 붙일 예정입니다.</Text>
        <Link href="/login" style={styles.link}>
          로그인으로 돌아가기
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
  },
  description: {
    color: '#4B5563',
    fontSize: 16,
    lineHeight: 24,
  },
  link: {
    color: '#0F766E',
    fontSize: 15,
    marginTop: 8,
  },
});
