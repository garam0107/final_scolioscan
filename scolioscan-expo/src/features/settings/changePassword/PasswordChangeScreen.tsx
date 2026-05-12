import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import ToastAlert from '@/src/components/ui/ToastAlert';
import { useAuth } from '@/src/contexts/AuthContext';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { formatPhoneNumber, isValidPhoneNumber, normalizePhoneNumber } from '@/src/features/auth/registerValidation';
import styles from '@/src/features/settings/changePassword/passwordChange.styles';

export default function PasswordChangeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const canContinue = useMemo(() => isValidPhoneNumber(phone), [phone]);

  function showToast(message: string) {
    setToastKey((current) => current + 1);
    setToastMessage(message);
  }

  function handleContinue() {
    const normalizedInputPhone = normalizePhoneNumber(phone);
    const normalizedUserPhone = normalizePhoneNumber(user?.phone || '');

    if (!normalizedUserPhone) {
      showToast('현재 사용자 휴대전화 번호를 찾을 수 없습니다.');
      return;
    }

    if (!canContinue) {
      showToast('휴대전화 번호를 올바르게 입력해주세요.');
      return;
    }

    if (normalizedInputPhone !== normalizedUserPhone) {
      showToast('입력한 휴대전화 번호가 현재 사용자 번호와 일치하지 않습니다.');
      return;
    }

    router.push('/settings/password-message');
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
            <Ionicons name="chevron-back" size={22} color="#B9C1CC" />
          </Pressable>
          <Text style={styles.headerTitle}>비밀번호 변경</Text>
          <View style={styles.headerSide} />
        </View>

        <KeyboardAwareScrollView
          bottomOffset={96}
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.guideBox}>
            <Text style={styles.guideText}>휴대전화 인증 후 비밀번호를 변경해주세요.</Text>
            <Text style={styles.guideText}>보안을 위해 다른 기기에서는 자동 로그아웃 돼요.</Text>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.fieldLabel}>휴대전화 번호</Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={formatPhoneNumber(phone)}
                onChangeText={(value) => setPhone(normalizePhoneNumber(value))}
                placeholder="전화번호를 입력해주세요"
                placeholderTextColor="#B6BECE"
                keyboardType="number-pad"
                maxLength={13}
                textContentType="telephoneNumber"
                autoComplete="tel"
                autoCorrect={false}
                style={styles.input}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: 46 }}>
        {/* 키보드에 화면 높이를 맡기지 않고 하단 버튼만 키보드 위로 붙인다. */}
        <View style={styles.footer}>
          <PrimaryButton
            title="계속하기"
            onPress={handleContinue}
            height={48}
            backgroundColor="#5F9F9D"
            borderRadius={6}
            style={styles.button}
            disabled={!canContinue}
          />
        </View>
      </KeyboardStickyView>
    </SafeAreaView>
  );
}
