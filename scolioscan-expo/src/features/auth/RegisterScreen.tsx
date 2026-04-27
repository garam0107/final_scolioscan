import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import ToastAlert from '@/src/components/ui/ToastAlert';
import AuthField from './AuthField';
import { styles } from './register.styles';

type RegisterStep = 'email' | 'password' | 'name' | 'gender';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hasPasswordLength(password: string) {
  return password.trim().length >= 8;
}

function hasPasswordMix(password: string) {
  return /[A-Za-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

function normalizeRegisterMessage(message: string) {
  if (message.includes('Email already registered')) {
    return '이미 가입된 이메일입니다.';
  }

  return message;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { checkEmail, register } = useAuth();
  const [step, setStep] = useState<RegisterStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [gender, setGender] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const [doneModalVisible, setDoneModalVisible] = useState(false);
  const passwordHasLength = hasPasswordLength(password);
  const passwordHasMix = hasPasswordMix(password);

  const stepMeta = useMemo(() => {
    if (step === 'email') {
      return {
        title: '이메일을\n입력해주세요',
        buttonText: '계속하기',
      };
    }

    if (step === 'password') {
      return {
        title: '비밀번호를\n입력해주세요',
        buttonText: '계속하기',
      };
    }

    if (step === 'name') {
      return {
        title: '이름을\n입력해주세요',
        buttonText: '계속하기',
      };
    }

    return {
      title: '마지막으로\n성별을 알려주세요',
      buttonText: '시작하기',
    };
  }, [step]);

  const showToast = (message: string) => {
    setToastKey((current) => current + 1);
    setToastMessage(message);
  };

  const handleEmailCheck = async (trimmedEmail: string) => {
    if (checkingEmail || loading) {
      return;
    }

    setCheckingEmail(true);

    try {
      const exists = await checkEmail(trimmedEmail);
      if (exists) {
        showToast('이미 가입된 이메일입니다.');
        return;
      }

      setStep('password');
    } catch (error) {
      const message = error instanceof Error ? error.message : '이메일 중복 확인에 실패했습니다.';
      showToast(normalizeRegisterMessage(message));
    } finally {
      setCheckingEmail(false);
    }
  };

  const goNext = () => {
    if (step === 'email') {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        showToast('이메일을 입력해주세요.');
        return;
      }

      if (!isValidEmail(trimmedEmail)) {
        showToast('올바른 이메일 형식이 아닙니다.');
        return;
      }

      void handleEmailCheck(trimmedEmail);
      return;
    }

    if (step === 'password') {
      if (!passwordHasLength || !passwordHasMix) {
        showToast('비밀번호 조건을 모두 만족해야 합니다.');
        return;
      }

      setStep('name');
      return;
    }

    if (step === 'name') {
      if (!name.trim()) {
        showToast('이름을 입력해주세요.');
        return;
      }

      setStep('gender');
    }
  };

  const handleStart = async () => {
    if (gender === null) {
      showToast('성별을 선택해주세요.');
      return;
    }

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      await register({
        user_id: email.trim(),
        user_pw: password,
        name: name.trim(),
        sex: gender,
        // 현재 화면에는 아직 없는 필수 항목이라 임시값을 넣었습니다.
        // 다음 단계에서 전화번호, 생년월일, 주소 입력이 붙으면 이 부분만 바꾸면 됩니다.
        phone: '',
        birthday: new Date().toISOString(),
        address: '',
        detail_address: null,
      });

      setDoneModalVisible(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : '회원가입에 실패했습니다.';
      showToast(normalizeRegisterMessage(message));
    } finally {
      setLoading(false);
    }
  };

  const primaryDisabled =
    loading ||
    checkingEmail ||
    (step === 'email' && (!email.trim() || !isValidEmail(email.trim()))) ||
    (step === 'password' && (!passwordHasLength || !passwordHasMix)) ||
    (step === 'name' && !name.trim()) ||
    (step === 'gender' && gender === null);

  const handlePrimaryPress = () => {
    if (step === 'gender') {
      void handleStart();
      return;
    }

    goNext();
  };

  const handleBack = () => {
    if (step === 'email') {
      router.back();
      return;
    }

    if (step === 'password') {
      setStep('email');
      return;
    }

    if (step === 'name') {
      setStep('password');
      return;
    }

    setStep('name');
  };

  return (
    <SafeAreaView style={styles.page}>
      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage}
        onDismiss={() => setToastMessage('')}
        tone="info"
        toastKey={toastKey}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable onPress={handleBack} hitSlop={12} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color="#4B5563" />
            </Pressable>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{stepMeta.title}</Text>

            {step === 'email' ? (
              <AuthField
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                label="이메일"
                placeholder=""
                returnKeyType="next"
                textContentType="emailAddress"
                value={email}
                variant="email"
                onChangeText={setEmail}
                onClear={() => setEmail('')}
                onSubmitEditing={() => void goNext()}
              />
            ) : null}

            {step === 'password' ? (
              <>
                <AuthField
                  autoCapitalize="none"
                  autoComplete="password"
                  autoCorrect={false}
                  label="비밀번호"
                  placeholder="비밀번호를 입력해주세요"
                  returnKeyType="next"
                  secureTextEntry={!passwordVisible}
                  textContentType="password"
                  value={password}
                  variant="password"
                  onChangeText={setPassword}
                  onToggleSecure={() => setPasswordVisible((current) => !current)}
                />
                <View style={styles.passwordRules}>
                  <View style={styles.passwordRuleRow}>
                    <Ionicons
                      name={passwordHasMix ? 'checkmark' : 'checkmark'}
                      size={16}
                      color={passwordHasMix ? '#5F9F9D' : '#C3CAD6'}
                      style={styles.passwordRuleIcon}
                    />
                    <Text
                      style={[
                        styles.passwordRuleText,
                        passwordHasMix ? styles.passwordRuleTextActive : null,
                      ]}
                    >
                      영문, 숫자, 특수문자 포함
                    </Text>
                  </View>
                  <View style={styles.passwordRuleRow}>
                    <Ionicons
                      name={passwordHasLength ? 'checkmark' : 'checkmark'}
                      size={16}
                      color={passwordHasLength ? '#5F9F9D' : '#C3CAD6'}
                      style={styles.passwordRuleIcon}
                    />
                    <Text
                      style={[
                        styles.passwordRuleText,
                        passwordHasLength ? styles.passwordRuleTextActive : null,
                      ]}
                    >
                      최소 8자 이상
                    </Text>
                  </View>
                </View>
              </>
            ) : null}

            {step === 'name' ? (
              <AuthField
                autoCapitalize="words"
                autoComplete="name"
                autoCorrect={false}
                label="이름"
                placeholder="이름을 입력해주세요"
                returnKeyType="next"
                textContentType="name"
                value={name}
                maxLength={8}
                variant="text"
                onChangeText={setName}
                onClear={() => setName('')}
                onSubmitEditing={() => void goNext()}
              />
            ) : null}

            {step === 'gender' ? (
              <View style={styles.genderWrap}>
                <View style={styles.genderRow}>
                  <Pressable
                    onPress={() => setGender(true)}
                    style={({ pressed }) => [
                      styles.genderButton,
                      gender === true ? styles.genderButtonActive : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        gender === true ? styles.genderTextActive : null,
                      ]}
                    >
                      남성
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setGender(false)}
                    style={({ pressed }) => [
                      styles.genderButton,
                      gender === false ? styles.genderButtonActive : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        gender === false ? styles.genderTextActive : null,
                      ]}
                    >
                      여성
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.footer}>
            <Pressable
              disabled={primaryDisabled}
              onPress={handlePrimaryPress}
              style={({ pressed }) => [
                styles.primaryButton,
                primaryDisabled ? styles.primaryButtonDisabled : styles.primaryButtonActive,
                pressed && !primaryDisabled ? styles.pressed : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>{stepMeta.buttonText}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal transparent animationType="fade" visible={doneModalVisible} onRequestClose={() => setDoneModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDoneModalVisible(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>회원가입 완료</Text>
            <Text style={styles.modalMessage}>가입이 완료되었습니다. 로그인 화면으로 이동합니다.</Text>
            <Pressable
              onPress={() => {
                setDoneModalVisible(false);
                router.replace('/login');
              }}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>확인</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
