import Ionicons from '@expo/vector-icons/Ionicons';
import { MuseoModerno_700Bold, useFonts as useMuseoFonts } from '@expo-google-fonts/museomoderno';
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { loadAsync } from 'expo-font';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ToastAlert from '@/src/components/ui/ToastAlert';
import { useAuth } from '@/src/contexts/AuthContext';
import { clearSavedEmail, loadSavedEmail, saveSavedEmail } from '@/src/lib/savedEmailStorage';
import GoogleIcon from '../../../assets/icons/google.svg';
import KakaoIcon from '../../../assets/icons/kakao.svg';
import LoginLogo from '../../../assets/icons/login_logo.svg';
import NaverIcon from '../../../assets/icons/naver.svg';
import styles from './login.styles';

const pretendardFont = require('../../../assets/fonts/PretendardVariable.ttf');
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.EXPO_PUBLIC_KAKAO_REDIRECT_URI;
const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID;
const NAVER_REDIRECT_URI = process.env.EXPO_PUBLIC_NAVER_REDIRECT_URI;

function isValidEmail(email: string) {
  // 서버 요청 전에 이메일 형식을 먼저 확인해서 불필요한 요청을 줄인다.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeLoginToastMessage(message: string) {
  // 서버와 라이브러리 오류 문구를 로그인 화면용 안내 문구로 정리한다.
  if (message.includes('Incorrect email or password')) {
    return '이메일 또는 비밀번호가 맞지 않습니다.';
  }

  if (
    message.includes('올바른 이메일 형식') ||
    (message.includes('email') && message.includes('422')) ||
    message.includes('not a valid email') ||
    message.includes('422')
  ) {
    return '올바른 이메일 형식이 아닙니다.';
  }

  return message;
}

function buildKakaoAuthorizeUrl() {
  if (!KAKAO_REST_API_KEY || !KAKAO_REDIRECT_URI) {
    throw new Error('카카오 로그인 환경변수가 설정되지 않았습니다.');
  }

  // 카카오 OAuth 로그인 페이지를 열기 위한 최소 authorize URL이다.
  const query = new URLSearchParams({
    client_id: KAKAO_REST_API_KEY,
    redirect_uri: KAKAO_REDIRECT_URI,
    response_type: 'code',
  });

  return `https://kauth.kakao.com/oauth/authorize?${query.toString()}`;
}

function buildNaverAuthorizeUrl() {
  if (!NAVER_CLIENT_ID || !NAVER_REDIRECT_URI) {
    throw new Error('네이버 로그인 환경변수가 설정되지 않았습니다.');
  }

  // 네이버는 state가 필수라서 요청할 때마다 새 값을 만든다.
  const query = new URLSearchParams({
    client_id: NAVER_CLIENT_ID,
    redirect_uri: NAVER_REDIRECT_URI,
    response_type: 'code',
    state: `naver-${Date.now()}`,
  });

  return `https://nid.naver.com/oauth2.0/authorize?${query.toString()}`;
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
  // 로그인 화면의 입력 필드를 같은 구조로 재사용한다.
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
  const [toastMessage, setToastMessage] = useState('');
  const [toastKey, setToastKey] = useState(0);

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();

    loadAsync({ PretendardVariable: pretendardFont })
      .then(() => setPretendardLoaded(true))
      .catch(() => setPretendardLoaded(true));
  }, []);

  useEffect(() => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      return;
    }

    // 구글 SDK가 id_token을 반환하도록 앱 시작 시 한 번만 설정한다.
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      scopes: ['openid', 'email', 'profile'],
    });
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
      showToast('올바른 이메일 형식이 아닙니다.');
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

      // 아이디 저장 여부에 맞춰 로컬 저장소 값을 갱신한다.
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

  const handleGoogleLogin = async () => {
    if (loading || authLoading) {
      return;
    }

    if (!GOOGLE_WEB_CLIENT_ID) {
      showToast('구글 로그인 환경변수가 설정되지 않았습니다.');
      return;
    }

    try {
      // 현재 단계에서는 구글 로그인 화면이 열리고 id_token을 받을 수 있는지만 확인한다.
      await GoogleSignin.signOut();
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      if (isCancelledResponse(response)) {
        showToast('구글 로그인이 취소되었습니다.');
        return;
      }

      if (isSuccessResponse(response)) {
        if (response.data.idToken) {
          console.log("구글 id token", response.data.idToken);
          showToast('구글 로그인 화면이 정상적으로 동작했습니다.');
          return;
        }

        showToast('구글 로그인은 완료됐지만 id_token을 받지 못했습니다.');
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          showToast('구글 로그인이 취소되었습니다.');
          return;
        }

        if (error.code === statusCodes.IN_PROGRESS) {
          showToast('구글 로그인이 이미 진행 중입니다.');
          return;
        }

        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          showToast('Google Play 서비스가 필요합니다.');
          return;
        }
      }

      const message = error instanceof Error ? error.message : '구글 로그인 화면을 열지 못했습니다.';
      showToast(message);
    }
  };

  const handleOAuthPageOpen = async (provider: 'kakao' | 'naver') => {
    if (loading || authLoading) {
      return;
    }

    try {
      // 카카오와 네이버는 지금 단계에서 OAuth 로그인 페이지 진입만 먼저 확인한다.
      const authUrl = provider === 'kakao' ? buildKakaoAuthorizeUrl() : buildNaverAuthorizeUrl();
      await WebBrowser.openBrowserAsync(authUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : '소셜 로그인 화면을 열지 못했습니다.';
      showToast(message);
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            <View style={styles.brandArea}>
              <LoginLogo width={60} height={60} />
              <Text style={styles.brandName}>ScolioScan</Text>
              <Text style={styles.subtitle}>당신의 척추 건강을 측정합니다.</Text>
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

              <View style={styles.dividerWrap}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>또는</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialRow}>
                <Pressable
                  onPress={() => void handleGoogleLogin()}
                  disabled={loading || authLoading}
                  style={({ pressed }) => [styles.socialButton, pressed ? styles.buttonPressed : null]}
                >
                  <GoogleIcon width={40} height={40} />
                </Pressable>
                <Pressable
                  onPress={() => void handleOAuthPageOpen('naver')}
                  disabled={loading || authLoading}
                  style={({ pressed }) => [styles.socialButton, pressed ? styles.buttonPressed : null]}
                >
                  <NaverIcon width={40} height={40} />
                </Pressable>
                <Pressable
                  onPress={() => void handleOAuthPageOpen('kakao')}
                  disabled={loading || authLoading}
                  style={({ pressed }) => [styles.socialButton, pressed ? styles.buttonPressed : null]}
                >
                  <KakaoIcon width={40} height={40} />
                </Pressable>
              </View>

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
                  <Text style={styles.findAccountText}>이메일 찾기</Text>
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
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
