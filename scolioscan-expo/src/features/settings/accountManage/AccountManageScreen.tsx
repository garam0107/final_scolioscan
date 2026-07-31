import { i18n } from '@/src/i18n';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
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
import styles from '@/src/features/settings/accountManage/accountManage.styles';
import {
  formatLocationAddress,
  getCurrentDeviceLabel,
  normalizeApiError,
  splitBirthday,
} from '@/src/features/settings/accountManage/accountManageUtils';
import AccountEditForm from '@/src/features/settings/accountManage/components/AccountEditForm';
import AccountFooter from '@/src/features/settings/accountManage/components/AccountFooter';
import AccountProfileSection from '@/src/features/settings/accountManage/components/AccountProfileSection';
import DeleteAccountModal from '@/src/features/settings/accountManage/components/DeleteAccountModal';
import SocialLinkActionSheet from '@/src/features/settings/accountManage/components/SocialLinkActionSheet';
import { useSocialAccountManager } from '@/src/features/settings/accountManage/useSocialAccountManager';

type GenderValue = 'male' | 'female';
type ToastTone = 'info' | 'success' | 'warning' | 'error';

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
  const scrollViewRef = useRef<ScrollViewType | null>(null);
  const [phoneFieldY, setPhoneFieldY] = useState(0);

  useEffect(() => {
    // 세션 사용자 정보가 바뀌면 화면 입력값도 같은 기준으로 다시 맞춘다.
    const birthday = splitBirthday(user?.birthday);

    setName(user?.name || '');
    setBirthYear(birthday.year);
    setBirthMonth(birthday.month);
    setBirthDay(birthday.day);
    setGender(user?.sex === false ? 'female' : 'male');
    setPhone(user?.phone || '');
    // Apple 직접 가입의 내부 식별자 대신 Apple relay 이메일만 화면에 표시한다.
    setEmail(user?.display_email || '');
  }, [user]);

  useEffect(() => {
    // 비밀번호 변경 화면에서 돌아온 경우에만 성공 토스트를 보여준다.
    if (params.toast !== 'passwordChanged') {
      return;
    }

    showToast(i18n.t("비밀번호가 변경되었습니다."), 'success');
    router.setParams({ toast: undefined });
  }, [params.toast, router]);

  useEffect(() => {
    let isMounted = true;

    async function loadDeviceLocation() {
      // 현재 로그인 기기의 최근 위치를 가져와 기기 목록 영역에 표시한다.
      setDeviceName(getCurrentDeviceLabel());

      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== 'granted') {
          if (isMounted) setDeviceMeta(i18n.t("위치 권한 필요 • 로그인 중"));
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
          setDeviceMeta(`${formatLocationAddress(address)} • 방금 전`);
        }
      } catch {
        if (isMounted) setDeviceMeta(i18n.t("위치 확인 실패 • 로그인 중"));
      }
    }

    void loadDeviceLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleFieldLayout(setter: (value: number) => void) {
    return (event: LayoutChangeEvent) => {
      setter(event.nativeEvent.layout.y);
    };
  }

  function scrollToField(y: number) {
    // 키보드가 올라왔을 때 전화번호 입력칸이 가려지지 않게 위로 이동시킨다.
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

  const {
    closeSocialLinkSheet,
    confirmSocialSheet,
    socialLinkMethods,
    socialSheetEmail,
    socialSheetMode,
    socialSheetProvider,
    socialSheetSubmitting,
  } = useSocialAccountManager({
    user,
    refreshSession,
    showToast,
  });

  function closeWithdrawModal() {
    if (withdrawing) return;
    setWithdrawModalVisible(false);
    setWithdrawPassword('');
    setWithdrawErrorMessage('');
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

  async function handleSave() {
    // 저장 전에 필수값과 형식을 다시 확인해 잘못된 프로필 갱신을 막는다.
    if (!canSave) return;
    if (!name.trim()) {
      showToast(i18n.t("이름을 입력해주세요."), 'warning');
      return;
    }
    const isAppleDirectSignup = user?.is_apple_direct_signup ?? false;
    const hasPhone = Boolean(phone.trim());
    const hasBirthdayInput = Boolean(birthYear || birthMonth || birthDay);

    if ((!isAppleDirectSignup || hasPhone) && !isValidPhoneNumber(phone)) {
      showToast(i18n.t("연락처를 올바르게 입력해주세요."), 'warning');
      return;
    }
    if ((!isAppleDirectSignup || hasBirthdayInput) && !isValidBirthday(birthYear, birthMonth, birthDay)) {
      showToast(i18n.t("생년월일을 올바르게 입력해주세요."), 'warning');
      return;
    }

    try {
      setSaving(true);
      await userAPI.updateUserProfile({
        name: name.trim(),
        ...(isAppleDirectSignup
          ? {
              phone: hasPhone ? phone : undefined,
              birthday: hasBirthdayInput ? formatBirthdayIso(birthYear, birthMonth, birthDay) : undefined,
              sex: user?.sex === null && gender === 'male' ? undefined : gender === 'male',
            }
          : {
              phone,
              address: user?.address ?? null,
              detail_address: user?.detail_address ?? null,
              birthday: formatBirthdayIso(birthYear, birthMonth, birthDay),
              sex: gender === 'male',
            }),
      });
      await refreshSession();
      showToast(i18n.t("사용자 정보가 변경되었습니다."), 'success');
    } catch (error) {
      showToast(normalizeApiError(error), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleWithdraw() {
    // 회원 탈퇴는 비밀번호 확인 이후 완료 모달로 이어진다.
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

  async function handleAppleWithdraw() {
    // Apple 직접 가입 계정은 저장된 임시 비밀번호 대신 탈퇴 직전에 Apple로 다시 본인 확인한다.
    if (withdrawing) return;

    try {
      setWithdrawErrorMessage('');
      setWithdrawing(true);
      const credential = await AppleAuthentication.signInAsync({ requestedScopes: [] });

      if (!credential.identityToken || !credential.authorizationCode) {
        throw new Error(i18n.t('Apple 재인증 정보를 받지 못했습니다.'));
      }

      await userAPI.deleteCurrentUser({
        apple_identity_token: credential.identityToken,
        apple_authorization_code: credential.authorizationCode,
      });
      setWithdrawModalVisible(false);
      setWithdrawCompleteVisible(true);
    } catch (error) {
      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';

      if (errorCode !== 'ERR_REQUEST_CANCELED') {
        setWithdrawErrorMessage(normalizeApiError(error));
      }
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
        requiresAppleReauthentication={user?.is_apple_direct_signup ?? false}
        onClose={closeWithdrawModal}
        onPasswordChange={(value) => {
          setWithdrawPassword(value);
          if (withdrawErrorMessage) setWithdrawErrorMessage('');
        }}
        onWithdraw={() => void handleWithdraw()}
        onAppleWithdraw={() => void handleAppleWithdraw()}
        onCompleteConfirm={() => void handleWithdrawCompleteConfirm()}
      />

      <SocialLinkActionSheet
        visible={socialSheetProvider !== null}
        provider={socialSheetProvider}
        mode={socialSheetMode}
        email={socialSheetEmail}
        submitting={socialSheetSubmitting}
        onClose={closeSocialLinkSheet}
        onConfirm={confirmSocialSheet}
      />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="#B9C1CC" />
        </Pressable>
        <Text style={styles.headerTitle}>{i18n.t("계정 관리")}</Text>
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
        <Text style={styles.sectionTitle}>{i18n.t("계정 정보")}</Text>

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
          isAppleDirectSignup={user?.is_apple_direct_signup ?? false}
          socialLoginMethods={socialLinkMethods}
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
