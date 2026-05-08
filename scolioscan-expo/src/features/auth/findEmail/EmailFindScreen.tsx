import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import FormTextField from '@/src/components/FormTextField';
import GuideMessageBox from '@/src/components/GuideMessageBox';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import ToastAlert from '@/src/components/ui/ToastAlert';
import { formatPhoneNumber, isValidPhoneNumber, normalizePhoneNumber } from '@/src/features/auth/registerValidation';
import styles from '@/src/features/auth/findEmail/emailFind.styles';

export default function EmailFindScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const canContinue = useMemo(() => Boolean(name.trim()) && isValidPhoneNumber(phone), [name, phone]);

  function showToast(message: string) {
    setToastKey((current) => current + 1);
    setToastMessage(message);
  }

  function handleContinue() {
    if (!name.trim()) {
      showToast('이름을 입력해주세요.');
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      showToast('휴대전화 번호를 올바르게 입력해주세요.');
      return;
    }

    router.push({
      pathname: '/email-find-message',
      params: {
        phone,
      },
    });
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage}
        onDismiss={() => setToastMessage('')}
        toastKey={toastKey}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
        style={styles.screen}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color="#7E89A0" />
          </Pressable>
          <Text style={styles.headerTitle}>이메일 찾기</Text>
          <View style={styles.headerSide} />
        </View>

        <ScrollView
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
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            title="계속하기"
            onPress={handleContinue}
            height={48}
            backgroundColor="#5F9F9D"
            borderRadius={6}
            disabled={!canContinue}
            style={styles.button}
            textStyle={styles.buttonText}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
