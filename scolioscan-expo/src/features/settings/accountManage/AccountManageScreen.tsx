import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { unlink as unlinkKakao } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';
import { CommonActions, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { LayoutChangeEvent, ScrollView as ScrollViewType } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { userAPI } from '@/src/api/user';
import ToastAlert from '@/src/components/ui/ToastAlert';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  formatBirthdayIso,
  isValidBirthday,
  isValidPhoneNumber,
} from '@/src/features/auth/registerValidation';
import AccountEditForm from '@/src/features/settings/accountManage/components/AccountEditForm';
import AccountFooter from '@/src/features/settings/accountManage/components/AccountFooter';
import AccountProfileSection from '@/src/features/settings/accountManage/components/AccountProfileSection';
import DeleteAccountModal from '@/src/features/settings/accountManage/components/DeleteAccountModal';
import SocialUnlinkConfirmSheet from '@/src/features/settings/accountManage/components/SocialUnlinkConfirmSheet';
import styles from '@/src/features/settings/accountManage/accountManage.styles';
import {
  formatLocationAddress,
  getCurrentDeviceLabel,
  normalizeApiError,
  splitBirthday,
} from '@/src/features/settings/accountManage/accountManageUtils';
import type { SocialProvider } from '@/src/types/user';

type GenderValue = 'male' | 'female';
type ToastTone = 'info' | 'success' | 'warning' | 'error';
const PENDING_SOCIAL_UNLINK_STORAGE_KEY = 'pending_social_unlinks';

export default function AccountManageScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ toast?: string }>();
  const insets = useSafeAreaInsets();
  const { user, refreshSession, logout } = useAuth();

  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [gender, setGender] = useState<GenderValue>('male');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [withdrawErrorMessage, setWithdrawErrorMessage] = useState('');
  const [withdrawCompleteVisible, setWithdrawCompleteVisible] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastTone, setToastTone] = useState<ToastTone>('info');
  const [toastKey, setToastKey] = useState(0);
  const [deviceName, setDeviceName] = useState(getCurrentDeviceLabel());
  const [deviceMeta, setDeviceMeta] = useState('위치 확인 중');
  const [unlinkingProvider, setUnlinkingProvider] = useState<SocialProvider | null>(null);
  const [syncingPendingUnlinks, setSyncingPendingUnlinks] = useState(false);
  const [socialUnlinkConfirmProvider, setSocialUnlinkConfirmProvider] = useState<SocialProvider | null>(null);
  const scrollViewRef = useRef<ScrollViewType | null>(null);
  const [phoneFieldY, setPhoneFieldY] = useState(0);

  useEffect(() => {
    // 세션 사용자 정보가 바뀌면 화면 입력값도 최신 계정 정보로 맞춘다.
    const birthday = splitBirthday(user?.birthday);

    setName(user?.name || '');
    setBirthYear(birthday.year);
    setBirthMonth(birthday.month);
    setBirthDay(birthday.day);
    setGender(user?.sex === false ? 'female' : 'male');
    setPhone(user?.phone || '');
    setEmail(user?.user_id || '');
  }, [user]);

  useEffect(() => {
    // 비밀번호 변경 화면에서 돌아온 경우 한 번만 성공 토스트를 보여준다.
    if (params.toast !== 'passwordChanged') {
      return;
    }

    showToast('비밀번호가 변경되었습니다.', 'success');
    router.setParams({ toast: undefined });
  }, [params.toast, router]);

  useEffect(() => {
    let isMounted = true;

    async function loadDeviceLocation() {
      // 현재 로그인 기기와 최근 위치를 가져와 기기 목록 영역에 표시한다.
      setDeviceName(getCurrentDeviceLabel());

      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== 'granted') {
          if (isMounted) setDeviceMeta('위치 권한 필요 · 로그인 중');
          return;
        }

        const lastKnownLocation = await Location.getLastKnownPositionAsync({
          maxAge: 1000 * 60 * 5,
        });
        const location =
          lastKnownLocation ??
          (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }));

        const [address] = await Location.reverseGeocodeAsync(location.coords);

        if (isMounted) {
          setDeviceMeta(`${formatLocationAddress(address)} · 방금 전`);
        }
      } catch {
        if (isMounted) setDeviceMeta('위치 확인 실패 · 로그인 중');
      }
    }

    void loadDeviceLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // SDK 해제 후 DB 삭제만 남은 provider가 있으면 화면 진입 후 자동 복구를 시도한다.
    if (!user?.id || syncingPendingUnlinks || unlinkingProvider) {
      return;
    }

    void retryPendingSocialUnlinks();
  }, [syncingPendingUnlinks, unlinkingProvider, user?.id]);

  function handleFieldLayout(setter: (value: number) => void) {
    return (event: LayoutChangeEvent) => {
      setter(event.nativeEvent.layout.y);
    };
  }

  function scrollToField(y: number) {
    // 키보드가 올라왔을 때 전화번호 입력칸이 가려지지 않도록 살짝 위로 이동한다.
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, y - 30),
      animated: true,
    });
  }

  function showToast(message: string, tone: ToastTone = 'info') {
    setToastKey((current) => current + 1);
    setToastTone(tone);
    setToastMessage(message);
  }

  async function loadPendingSocialUnlinks() {
    // 부분 성공 상태를 복구할 수 있게 provider 목록을 로컬에 저장한다.
    const rawValue = await AsyncStorage.getItem(PENDING_SOCIAL_UNLINK_STORAGE_KEY);

    if (!rawValue) {
      return [] as SocialProvider[];
    }

    try {
      const parsedValue = JSON.parse(rawValue);

      if (!Array.isArray(parsedValue)) {
        return [] as SocialProvider[];
      }

      return parsedValue.filter(
        (provider): provider is SocialProvider =>
          provider === 'google' || provider === 'naver' || provider === 'kakao',
      );
    } catch {
      return [] as SocialProvider[];
    }
  }

  async function savePendingSocialUnlinks(providers: SocialProvider[]) {
    // 같은 provider가 중복 저장되지 않게 정리해서 보관한다.
    const uniqueProviders = Array.from(new Set(providers));
    await AsyncStorage.setItem(PENDING_SOCIAL_UNLINK_STORAGE_KEY, JSON.stringify(uniqueProviders));
  }

  async function addPendingSocialUnlink(provider: SocialProvider) {
    const providers = await loadPendingSocialUnlinks();
    await savePendingSocialUnlinks([...providers, provider]);
  }

  async function removePendingSocialUnlink(provider: SocialProvider) {
    const providers = await loadPendingSocialUnlinks();
    await savePendingSocialUnlinks(providers.filter((item) => item !== provider));
  }

  async function retryPendingSocialUnlinks() {
    const providers = await loadPendingSocialUnlinks();

    if (providers.length === 0) {
      return;
    }

    try {
      setSyncingPendingUnlinks(true);

      let hasResolvedPendingUnlink = false;

      for (const provider of providers) {
        try {
          // SDK는 이미 해제됐을 수 있으므로 DB row 삭제만 멱등적으로 재시도한다.
          await userAPI.deleteSocialAccount(provider);
          await removePendingSocialUnlink(provider);
          hasResolvedPendingUnlink = true;
        } catch {
          // 실패한 항목은 다음 진입에서도 다시 재시도할 수 있게 남겨둔다.
        }
      }

      if (hasResolvedPendingUnlink) {
        await refreshSession();
      }
    } finally {
      setSyncingPendingUnlinks(false);
    }
  }

  function closeWithdrawModal() {
    if (withdrawing) return;
    setWithdrawModalVisible(false);
    setWithdrawPassword('');
    setWithdrawErrorMessage('');
  }

  function openSocialUnlinkConfirm(provider: SocialProvider) {
    // 연결 해제는 즉시 실행하지 않고 확인 시트를 먼저 보여준다.
    if (unlinkingProvider || syncingPendingUnlinks) {
      return;
    }

    setSocialUnlinkConfirmProvider(provider);
  }

  function closeSocialUnlinkConfirm() {
    if (unlinkingProvider) {
      return;
    }

    setSocialUnlinkConfirmProvider(null);
  }

  const initialBirthday = splitBirthday(user?.birthday);
  const initialGender: GenderValue = user?.sex === false ? 'female' : 'male';
  const hasChanges =
    // 서버에 저장된 값과 달라진 항목이 있을 때만 저장 버튼을 활성화한다.
    name !== (user?.name || '') ||
    phone !== (user?.phone || '') ||
    birthYear !== initialBirthday.year ||
    birthMonth !== initialBirthday.month ||
    birthDay !== initialBirthday.day ||
    gender !== initialGender;
  const canSave = hasChanges && !saving;
  const socialLoginMethods = [
    {
      provider: 'google' as const,
      isLinked: user?.social_accounts.google.is_linked ?? false,
      email: user?.social_accounts.google.email ?? null,
      onPress:
        user?.social_accounts.google.is_linked && unlinkingProvider === null && !syncingPendingUnlinks
          ? () => openSocialUnlinkConfirm('google')
          : undefined,
    },
    {
      provider: 'naver' as const,
      isLinked: user?.social_accounts.naver.is_linked ?? false,
      email: user?.social_accounts.naver.email ?? null,
      onPress:
        user?.social_accounts.naver.is_linked && unlinkingProvider === null && !syncingPendingUnlinks
          ? () => openSocialUnlinkConfirm('naver')
          : undefined,
    },
    {
      provider: 'kakao' as const,
      isLinked: user?.social_accounts.kakao.is_linked ?? false,
      email: user?.social_accounts.kakao.email ?? null,
      onPress:
        user?.social_accounts.kakao.is_linked && unlinkingProvider === null && !syncingPendingUnlinks
          ? () => openSocialUnlinkConfirm('kakao')
          : undefined,
    },
  ];

  function getSocialProviderLabel(provider: SocialProvider) {
    if (provider === 'google') return '구글';
    if (provider === 'naver') return '네이버';
    return '카카오';
  }

  function getSocialProviderEmail(provider: SocialProvider) {
    if (provider === 'google') return user?.social_accounts.google.email ?? null;
    if (provider === 'naver') return user?.social_accounts.naver.email ?? null;
    return user?.social_accounts.kakao.email ?? null;
  }

  function extractSocialSdkErrorMessage(error: unknown) {
    // 네이티브 SDK reject 객체에서도 message/code를 최대한 읽어 사용자에게 정확한 원인을 보여준다.
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null) {
      const message = 'message' in error ? (error as { message?: unknown }).message : undefined;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }

      const code = 'code' in error ? (error as { code?: unknown }).code : undefined;
      if (typeof code === 'string' && code.trim()) {
        return code;
      }
    }

    return '';
  }

  function isNaverDeleteTokenRetryableError(message: string) {
    const normalizedMessage = message.toLowerCase();

    return (
      normalizedMessage.length === 0 ||
      normalizedMessage.includes('token') ||
      normalizedMessage.includes('login') ||
      normalizedMessage.includes('oauth') ||
      normalizedMessage.includes('unauthorized') ||
      normalizedMessage.includes('access_denied')
    );
  }

  async function ensureNaverDeleteToken() {
    // 네이버 SDK 내부 토큰이 없는 경우 재로그인으로 토큰을 확보한 뒤 삭제를 한 번 더 시도한다.
    try {
      await NaverLogin.deleteToken();
      return;
    } catch (error) {
      const message = extractSocialSdkErrorMessage(error);

      if (!isNaverDeleteTokenRetryableError(message)) {
        throw new Error(message || '네이버 연결 해제에 실패했습니다.');
      }
    }

    const loginResult = await NaverLogin.login();
    const successResponse = (loginResult as { successResponse?: { accessToken?: string } }).successResponse;
    const failureResponse = (loginResult as { failureResponse?: { message?: string; isCancel?: boolean } }).failureResponse;

    if (failureResponse?.isCancel) {
      throw new Error('네이버 로그인 후 연결 해제가 취소되었습니다.');
    }

    if (!successResponse?.accessToken) {
      throw new Error(failureResponse?.message ?? '네이버 로그인 정보를 다시 가져오지 못했습니다.');
    }

    await NaverLogin.deleteToken();
  }

  async function unlinkSocialWithSdk(provider: SocialProvider) {
    // SDK 해제가 성공한 경우에만 백엔드 row 삭제 단계로 넘긴다.
    if (provider === 'google') {
      await GoogleSignin.revokeAccess();
      return;
    }

    if (provider === 'kakao') {
      await unlinkKakao();
      return;
    }

    await ensureNaverDeleteToken();
  }

  async function handleSocialUnlink(provider: SocialProvider) {
    // 중복 요청을 막고 SDK 해제 이후에만 DB 삭제를 요청한다.
    if (unlinkingProvider || syncingPendingUnlinks) {
      return;
    }

    try {
      setUnlinkingProvider(provider);
      await unlinkSocialWithSdk(provider);
      await addPendingSocialUnlink(provider);
      await userAPI.deleteSocialAccount(provider);
      await removePendingSocialUnlink(provider);
      await refreshSession();
      showToast(`${getSocialProviderLabel(provider)} 소셜 연동이 해제되었습니다.`, 'success');
    } catch (error) {
      const sdkMessage = extractSocialSdkErrorMessage(error);
      showToast(sdkMessage || normalizeApiError(error), 'error');
    } finally {
      setSocialUnlinkConfirmProvider(null);
      setUnlinkingProvider(null);
    }
  }

  async function handleSave() {
    // 저장 전에 필수값과 형식을 다시 확인해 잘못된 프로필 갱신을 막는다.
    if (!canSave) return;
    if (!name.trim()) {
      showToast('이름을 입력해주세요.', 'warning');
      return;
    }
    if (!isValidPhoneNumber(phone)) {
      showToast('연락처를 올바르게 입력해주세요.', 'warning');
      return;
    }
    if (!isValidBirthday(birthYear, birthMonth, birthDay)) {
      showToast('생년월일을 올바르게 입력해주세요.', 'warning');
      return;
    }

    try {
      setSaving(true);
      await userAPI.updateUserProfile({
        name: name.trim(),
        phone,
        address: user?.address ?? null,
        detail_address: user?.detail_address ?? null,
        birthday: formatBirthdayIso(birthYear, birthMonth, birthDay),
        sex: gender === 'male',
      });
      await refreshSession();
      showToast('사용자 정보가 변경되었습니다.', 'success');
    } catch (error) {
      showToast(normalizeApiError(error), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleWithdraw() {
    // 회원 탈퇴는 비밀번호 확인이 끝난 뒤 완료 모달을 보여준다.
    const password = withdrawPassword.trim();

    if (!password || withdrawing) return;

    try {
      setWithdrawErrorMessage('');
      setWithdrawing(true);
      await userAPI.deleteCurrentUser({ password });
      setWithdrawModalVisible(false);
      setWithdrawCompleteVisible(true);
    } catch (error) {
      setWithdrawErrorMessage(normalizeApiError(error));
    } finally {
      setWithdrawing(false);
    }
  }

  async function handleWithdrawCompleteConfirm() {
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'login' }],
      }),
    );
  }

  async function handleDeviceLogout() {
    // 현재 기기 로그아웃 후 네비게이션 스택을 로그인 화면으로 초기화한다.
    await logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'login' }],
      }),
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage}
        tone={toastTone}
        toastKey={toastKey}
        onDismiss={() => setToastMessage('')}
      />

      <DeleteAccountModal
        visible={withdrawModalVisible}
        completeVisible={withdrawCompleteVisible}
        password={withdrawPassword}
        errorMessage={withdrawErrorMessage}
        withdrawing={withdrawing}
        onClose={closeWithdrawModal}
        onPasswordChange={(value) => {
          setWithdrawPassword(value);
          if (withdrawErrorMessage) setWithdrawErrorMessage('');
        }}
        onWithdraw={() => void handleWithdraw()}
        onCompleteConfirm={() => void handleWithdrawCompleteConfirm()}
      />

      <SocialUnlinkConfirmSheet
        visible={socialUnlinkConfirmProvider !== null}
        provider={socialUnlinkConfirmProvider}
        email={socialUnlinkConfirmProvider ? getSocialProviderEmail(socialUnlinkConfirmProvider) : null}
        submitting={unlinkingProvider !== null}
        onClose={closeSocialUnlinkConfirm}
        onConfirm={() => {
          if (!socialUnlinkConfirmProvider) {
            return;
          }

          void handleSocialUnlink(socialUnlinkConfirmProvider);
        }}
      />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#B9C1CC" />
        </Pressable>
        <Text style={styles.headerTitle}>계정 관리</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.content, { paddingBottom: 0 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
        <Text style={styles.sectionTitle}>계정 정보</Text>

        <AccountEditForm
          name={name}
          birthYear={birthYear}
          birthMonth={birthMonth}
          birthDay={birthDay}
          gender={gender}
          phone={phone}
          email={email}
          phoneFieldY={phoneFieldY}
          onNameChange={setName}
          onBirthYearChange={setBirthYear}
          onBirthMonthChange={setBirthMonth}
          onBirthDayChange={setBirthDay}
          onGenderChange={setGender}
          onPhoneChange={setPhone}
          onEmailChange={setEmail}
          onPhoneLayout={handleFieldLayout(setPhoneFieldY)}
          onPhoneFocus={scrollToField}
        />

        <AccountProfileSection
          email={email}
          deviceName={deviceName}
          deviceMeta={deviceMeta}
          onDeviceLogout={() => void handleDeviceLogout()}
          onPasswordPress={() => router.push('/settings/password')}
          onWithdrawPress={() => setWithdrawModalVisible(true)}
          socialLoginMethods={socialLoginMethods}
        />
      </ScrollView>

      <AccountFooter
        saving={saving}
        canSave={canSave}
        bottomInset={insets.bottom}
        onSave={() => void handleSave()}
      />
    </SafeAreaView>
  );
}
