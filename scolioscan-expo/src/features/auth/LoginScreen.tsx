import { MuseoModerno_700Bold, useFonts as useMuseoFonts } from '@expo-google-fonts/museomoderno';
import { loadAsync } from 'expo-font';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/src/contexts/AuthContext';
import ToastAlert from '@/src/components/ui/ToastAlert';
import { clearSavedEmail, loadSavedEmail, saveSavedEmail } from '@/src/lib/savedEmailStorage';
import LoginLogo from '../../../assets/icons/login_logo.svg';
import GoogleIcon from '../../../assets/icons/google.svg';
import NaverIcon from '../../../assets/icons/naver.svg';
import AppleIcon from '../../../assets/icons/apple.svg';
import styles from './login.styles';

const pretendardFont = require('../../../assets/fonts/PretendardVariable.ttf');

function isValidEmail(email: string) {
  // 서버 호출 전에 기본 이메일 형식만 먼저 확인해 불필요한 요청을 줄인다.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeLoginToastMessage(message: string) {
  // 서버와 라이브러리에서 온 에러 문구를 로그인 화면의 안내 문구로 맞춘다.
  if (message.includes('Incorrect email or password')) {
    return '아이디 혹은 비밀번호가 맞지 않아요';
  }

  if (
    message.includes('올바른 이메일 형식') ||
    message.includes('not a valid email') ||
    message.includes('email') && message.includes('422') ||
    message.includes('422')
  ) {
    return '올바른 이메일 형식이 아닙니다';
  }

  return message;
}

function Field({
  label,
  value,
  placeholder,
  secureTextEntry,
  onChangeText,
  onClear,
  onToggleSecure,
}: {
  label: string;
  value: string;
  placeholder: string;
  secureTextEntry?: boolean;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onToggleSecure?: () => void;
}) {
  // 로그인 화면에서 이메일과 비밀번호 입력 UI를 같은 구조로 재사용한다.
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldBox}>
        <TextInput
          autoCapitalize="none"
          autoComplete={label === '이메일' ? 'email' : 'password'}
          autoCorrect={false}
          placeholder={placeholder}
          placeholderTextColor="#C7CCD7"
          secureTextEntry={secureTextEntry}
          style={[styles.fieldInput, secureTextEntry ? styles.fieldInputWithIcon : null]}
          value={value}
          onChangeText={onChangeText}
        />
        <View style={styles.fieldActions}>
          {onClear && value ? (
            <Pressable onPress={onClear} hitSlop={10} style={styles.fieldIconButton}>
              <Ionicons name="close" size={24} color="#B9C0CF" />
            </Pressable>
          ) : null}
          {onToggleSecure ? (
            <Pressable onPress={onToggleSecure} hitSlop={10} style={styles.fieldIconButton}>
              <Ionicons
                name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color="#B9C0CF"
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function PrimaryButton({
  title,
  onPress,
  disabled,
  active,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        active ? styles.primaryButtonActive : styles.primaryButtonInactive,
        pressed && !disabled ? styles.buttonPressed : null,
        disabled ? styles.buttonDisabled : null,
      ]}
    >
      <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
  );
}

function SimpleModal({
  visible,
  title,
  message,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <Pressable onPress={onClose} style={styles.modalButton}>
            <Text style={styles.modalButtonText}>확인</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const [museoLoaded] = useMuseoFonts({ MuseoModerno_700Bold });
  const [pretendardLoaded, setPretendardLoaded] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberId, setRememberId] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastKey, setToastKey] = useState(0);

  useEffect(() => {
    loadAsync({ PretendardVariable: pretendardFont })
      .then(() => setPretendardLoaded(true))
      .catch(() => setPretendardLoaded(true));
  }, []);

  useEffect(() => {
    let active = true;

    const loadRememberedEmail = async () => {
      // 저장된 이메일이 있으면 입력값과 체크 상태를 함께 복원한다.
      const savedEmail = await loadSavedEmail();
      if (!active || !savedEmail) {
        return;
      }

      setEmail(savedEmail);
      setRememberId(true);
    };

    void loadRememberedEmail();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // 이미 로그인된 사용자는 로그인 화면을 건너뛰고 홈으로 보낸다.
    if (!authLoading && isAuthenticated) {
      router.replace('/home');
    }
  }, [authLoading, isAuthenticated, router]);

  const fontsLoaded = museoLoaded && pretendardLoaded;
  const isLoginReady = Boolean(email.trim() && password.trim());
  const isLoginDisabled = loading || authLoading || !isLoginReady;

  const showToast = (message: string) => {
    setToastKey((current) => current + 1);
    setToastMessage(message);
  };

  const handleLogin = async () => {
    if (loading || authLoading) {
      return;
    }

    if (!email.trim()) {
      showToast('이메일을 입력해주세요.');
      return;
    }

    if (!isValidEmail(email.trim())) {
      showToast('올바른 이메일 형식이 아닙니다');
      return;
    }

    if (!password.trim()) {
      showToast('비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);

    const trimmedEmail = email.trim();

    try {
      await login({ user_id: trimmedEmail, user_pw: password });
      // 아이디 저장 선택에 맞춰 로컬 저장소의 이메일을 갱신한다.
      if (rememberId) {
        await saveSavedEmail(trimmedEmail);
      } else {
        await clearSavedEmail();
      }
      router.replace('/home');
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : '로그인에 실패했습니다.';
      showToast(normalizeLoginToastMessage(message));
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.loadingPage}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#5F9F9D" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage}
        onDismiss={() => setToastMessage('')}
        tone="info"
        toastKey={toastKey}
      />
          {loading ? (
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#2C9696" />
          <Text style={styles.loadingText}>로그인 중입니다...</Text>
        </View>
      </View>
    ) : null}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardWrap}
      >
        <View style={styles.content}>
          <View style={styles.brandArea}>
            <LoginLogo width={60} height={60} />
            <Text style={styles.brandName}>ScolioScan</Text>
            <Text style={styles.subtitle}>당신의 척추 건강을 측정합니다</Text>
          </View>

          <View style={styles.formArea}>
            <Field
              label="이메일"
              value={email}
              placeholder="이메일을 입력해주세요"
              onChangeText={setEmail}
              onClear={() => setEmail('')}
            />
            <Field
              label="비밀번호"
              value={password}
              placeholder="비밀번호를 입력해주세요"
              secureTextEntry={!passwordVisible}
              onChangeText={setPassword}
              onToggleSecure={() => setPasswordVisible((current) => !current)}
            />

            <View style={styles.helperRow}>
              <Pressable
                onPress={() => setRememberId((current) => !current)}
                style={styles.rememberWrap}
                hitSlop={8}
              >
                <View style={[styles.checkbox, rememberId && styles.checkboxChecked]}>
                  {rememberId ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                </View>
                <Text style={styles.rememberText}>이메일 저장</Text>
              </Pressable>
            </View>

            <PrimaryButton
              title="로그인"
              onPress={() => void handleLogin()}
              disabled={isLoginDisabled}
              active={isLoginReady}
            />
            {/* 소셜 로그인 추가 후 해제 */}
            {/* <View style={styles.dividerWrap}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <Pressable
                onPress={() => setSocialModalOpen(true)}
                disabled={loading || authLoading}
                style={({ pressed }) => [styles.socialButton, pressed ? styles.buttonPressed : null]}
              >
                <GoogleIcon width={40} height={40} />
              </Pressable>
              <Pressable
                onPress={() => setSocialModalOpen(true)}
                disabled={loading || authLoading}
                style={({ pressed }) => [styles.socialButton, pressed ? styles.buttonPressed : null]}
              >
                <NaverIcon width={40} height={40} />
              </Pressable>
              <Pressable
                onPress={() => setSocialModalOpen(true)}
                disabled={loading || authLoading}
                style={({ pressed }) => [styles.socialButton, pressed ? styles.buttonPressed : null]}
              >
                <AppleIcon width={40} height={40} />
              </Pressable>
            </View> */}

            <View style={styles.signupPrompt}>
              <Text style={styles.signupPromptText}>아직 계정이 없으신가요?</Text>
              <Pressable onPress={() => router.push('/register')} hitSlop={8}>
                <Text style={styles.signupLink}>회원가입</Text>
              </Pressable>
            </View>

            <View style={styles.findAccountRow}>
              <Pressable
                onPress={() => router.push('/email-find')}
                disabled={loading || authLoading}
                hitSlop={8}
              >
                <Text style={styles.findAccountText}>아이디 찾기</Text>
              </Pressable>
              <Text style={styles.findAccountDivider}>|</Text>
              <Pressable
                onPress={() => router.push('/password-find')}
                disabled={loading || authLoading}
                hitSlop={8}
              >
                <Text style={styles.findAccountText}>비밀번호 찾기</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <SimpleModal
        visible={socialModalOpen}
        title="소셜 로그인"
        message="소셜 로그인 기능은 준비 중입니다."
        onClose={() => setSocialModalOpen(false)}
      />
    </SafeAreaView>
  );
}

