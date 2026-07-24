import { useScrollToTop } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker'
import { useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopScrollGradient, { useTopScrollGradient } from '@/src/components/TopScrollGradient';
import { useAuth } from '@/src/contexts/AuthContext';
import ProfileCard from '@/src/features/settings/components/ProfileCard';
import SettingRow, { type SettingsToggleKey } from '@/src/features/settings/components/SettingRow';
import SettingsSection from '@/src/features/settings/components/SettingsSection';
import SettingsTimeRow from '@/src/features/settings/components/SettingsTimeRow';
// import SubscriptionCard from '@/src/features/settings/components/SubscriptionCard';
import DataResetSheet from '@/src/features/settings/sheets/DataResetSheet';
import GuideReplaySheet from '@/src/features/settings/sheets/GuideReplaySheet';
import HistoryExportSheet from '@/src/features/settings/sheets/HistoryExportSheet';
import LanguageSettingsSheet from '@/src/features/settings/sheets/LanguageSettingsSheet';
import NightModeSettingsSheet from '@/src/features/settings/sheets/NightModeSettingsSheet';
import styles from '@/src/features/settings/settings.styles';
import { createHistoryReportPdfHtml } from '@/src/features/settings/utils/historyReportPdfHtml';
import { useAppSettingsStore } from '@/src/store/appSettingsStore';
import { measurementSetAPI } from '@/src/api/measurementSet';
import { userAPI } from '@/src/api/user';
import ToastAlert, { type ToastTone } from '@/src/components/ui/ToastAlert';
import { useMeasurementRefreshStore } from '@/src/store/measurementRefreshStore';
import { getAppLanguage, i18n, setAppLanguage } from '@/src/i18n';
import type { AppLanguage } from '@/src/i18n/resources';
import { useTranslation } from 'react-i18next';
type SettingsSheetType = 'language' | 'reset' | 'guide' | 'historyExport' | 'nightMode' | null;

const DEFAULT_TOGGLES: Record<SettingsToggleKey, boolean> = {
  cellular: true,
  nightMode: false,
  importantAlarm: false,
  otherAlarm: false,
  marketing: false,
  cloudBackup: false,
};

function formatTimeLabel(hour: number, minute: number) {
  // 야간 모드 시간 선택값을 설정 화면 표시 형식으로 바꾼다.
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour % 12 || 12;
  const displayMinute = String(minute).padStart(2, '0');

  return `${period} ${displayHour}:${displayMinute}`;
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, refreshSession } = useAuth();
  const cellularDataAllowed = useAppSettingsStore((state) => state.cellularDataAllowed);
  const nightModeEnabled = useAppSettingsStore((state) => state.nightModeEnabled);
  const nightStartHour = useAppSettingsStore((state) => state.nightStartHour);
  const nightStartMinute = useAppSettingsStore((state) => state.nightStartMinute);
  const nightEndHour = useAppSettingsStore((state) => state.nightEndHour);
  const nightEndMinute = useAppSettingsStore((state) => state.nightEndMinute);
  const setCellularDataAllowed = useAppSettingsStore((state) => state.setCellularDataAllowed);
  const setNightModeEnabled = useAppSettingsStore((state) => state.setNightModeEnabled);
  const setNightModeHours = useAppSettingsStore((state) => state.setNightModeHours);
   // 앱 설정 리셋
  const resetSettings = useAppSettingsStore((state) => state.resetSettings);
  const [toggles, setToggles] = useState(DEFAULT_TOGGLES);
  const [settingsSheetType, setSettingsSheetType] = useState<SettingsSheetType>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(getAppLanguage());
  const [historyExporting, setHistoryExporting] = useState(false);
  const [historyPdfUri, setHistoryPdfUri] = useState<string | null>(null);
  const [historySharing, setHistorySharing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const topScrollGradient = useTopScrollGradient();
  // 토스트 알림 상태 
  const [toastMessage, setToastMessage] = useState('');
  const [toastTone, setToastTone] = useState<ToastTone>('info');
  const [toastKey, setToastKey] = useState(0);
  // 데이터 초기화 후 분석,리포트 재조회
  const markMeasurementChanged = useMeasurementRefreshStore((state) => state.markMeasurementChanged);
 
  // 현재 선택된 설정 탭을 다시 누르면 설정 목록 맨 위로 이동한다.
  useScrollToTop(scrollRef);

  // 토스트 알림 보여주는 함수 
  function showToast(message: string, tone: ToastTone = 'info') {
  setToastKey((current) => current + 1);
  setToastTone(tone);
  setToastMessage(message);
  }
  // 데이터 초기화 API 호출 함수 
  async function handleDataReset() {
  try {
    await userAPI.deleteUserData();
    markMeasurementChanged();
    await resetSettings();
    showToast(i18n.t("데이터가 초기화되었습니다."), 'success');
  } catch {
    showToast(i18n.t("데이터 초기화에 실패했습니다. 다시 시도해주세요."), 'error');
  }
  }
  const profile = useMemo(
    // 세션의 사용자 정보가 없을 때도 설정 화면이 빈 값으로 깨지지 않게 기본값을 둔다.
    () => ({
      name: user?.name || 'ooo',
      email: user?.user_id || 'abcd@example.com',
      profileImage : user?.profile_image,
    }),
    [user?.name, user?.user_id, user?.profile_image],
  );

  const displayedToggles = useMemo(
    () => ({
      ...toggles,
      cellular: cellularDataAllowed,
      nightMode: nightModeEnabled,
    }),
    [cellularDataAllowed, nightModeEnabled, toggles],
  );

  const handleToggle = (key: SettingsToggleKey) => {
    if (key === 'cellular') {
      // 모바일 데이터 허용 여부는 앱을 다시 켜도 유지되도록 저장소에 반영한다.
      void setCellularDataAllowed(!cellularDataAllowed).catch(() => {
        Alert.alert(i18n.t("설정 저장 실패"), i18n.t("셀룰러 데이터 사용 설정을 저장하지 못했어요. 다시 시도해주세요."));
      });
      return;
    }

    if (key === 'nightMode') {
      // 야간 모드 사용 여부도 앱 재실행 후 유지되도록 저장소에 반영한다.
      void setNightModeEnabled(!nightModeEnabled).catch(() => {
        Alert.alert(i18n.t("설정 저장 실패"), i18n.t("야간 모드 설정을 저장하지 못했어요. 다시 시도해주세요."));
      });
      return;
    }

    // 설정 토글은 서버 연동 전까지 화면 내부 상태로만 즉시 반영한다.
    setToggles((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const showComingSoon = (label: string) => {
    Alert.alert(label, i18n.t("아직 준비중이에요."));
  };

  const handleLanguageSelect = (language: AppLanguage) => {
    setSelectedLanguage(language);
    // 저장 실패 시 화면 상태도 이전 언어로 되돌려 선택 표시가 실제 언어와 어긋나지 않게 한다.
    void setAppLanguage(language).catch(() => {
      setSelectedLanguage(getAppLanguage());
      Alert.alert(t('common.error'), i18n.t("언어 설정을 저장하지 못했습니다. 다시 시도해주세요."));
    });
  };

  const handleHistoryExportPress = async () => {
    if (historyExporting) {
      return;
    }

    setHistoryExporting(true);
    let failureTitle = '히스토리 내보내기 실패';
    let failureMessage = '측정 결과를 불러오지 못했어요. 다시 시도해주세요.';

    try {
      // PDF 생성 전 최신 측정 결과가 있는지 먼저 확인한다.
      const response = await measurementSetAPI.getAnalyses({ limit: 5 });
      const measurementSets = response.data;

      if (measurementSets.length === 0) {
        Alert.alert(i18n.t("측정 결과 없음"), i18n.t("내보낼 측정 결과가 없습니다."));
        return;
      }

      failureTitle = 'PDF 생성 실패';
      failureMessage = 'PDF 파일을 생성하지 못했어요. 다시 시도해주세요.';
      setHistoryPdfUri(null);
      const html = createHistoryReportPdfHtml({
        userName: user?.name?.trim() || '회원',
        measurementSets,
      });
      // expo-print는 HTML 문자열을 앱 캐시의 PDF 파일로 저장하고 uri를 돌려준다.
      const result = await Print.printToFileAsync({ html });
      setHistoryPdfUri(result.uri);
      setSettingsSheetType('historyExport');
    } catch {
      Alert.alert(failureTitle, failureMessage);
    } finally {
      setHistoryExporting(false);
    }
  };

  const handleHistorySharePress = async () => {
    if (historySharing) {
      return;
    }

    if (!historyPdfUri) {
      Alert.alert(i18n.t("PDF 파일 없음"), i18n.t("공유할 PDF 파일이 없습니다. 다시 시도해주세요."));
      return;
    }

    try {
      setHistorySharing(true);
      const available = await Sharing.isAvailableAsync();

      if (!available) {
        Alert.alert(i18n.t("공유 기능 사용 불가"), i18n.t("이 기기에서는 파일 공유 기능을 사용할 수 없습니다."));
        return;
      }

      // 생성된 PDF 파일 uri를 OS 기본 공유 시트로 전달한다.
      await Sharing.shareAsync(historyPdfUri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: '측정 리포트 공유',
      });
    } catch {
      Alert.alert(i18n.t("공유 실패"), i18n.t("PDF 파일을 공유하지 못했어요. 다시 시도해주세요."));
    } finally {
      setHistorySharing(false);
    }
  };

  const closeSettingsSheet = () => {
    setSettingsSheetType(null);
  };

  const handleNightModeApply = (startHour: number, startMinute: number, endHour: number, endMinute: number) => {
    // 시작과 종료 시간이 같으면 야간 모드 범위가 사라지므로 선택을 막는다.
    if (startHour === endHour && startMinute === endMinute) {
      Alert.alert(i18n.t("시간 설정"), i18n.t("시작 시간과 종료 시간은 같을 수 없습니다."));
      return;
    }

    // 야간 모드 시간도 앱을 다시 켜도 유지되도록 저장한다.
    void setNightModeHours(startHour, startMinute, endHour, endMinute).catch(() => {
      Alert.alert(i18n.t("설정 저장 실패"), i18n.t("야간 모드 시간을 저장하지 못했어요. 다시 시도해주세요."));
    });
  };

  // 프로필 이미지 수정 함수
  const handleImageUpdate = async () => {
    try {
      // 1. 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets[0].uri) {
        return;
      }

      const imageUri = result.assets[0].uri;
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';


      // 2. FormData 생성 (React Native 표준 방식)
      const formData = new FormData();
      const fileData = {
        uri: imageUri,
        name: filename,
        type,
      };

      // @ts-ignore: React Native FormData append expects a specific object for files
      formData.append('file', fileData);

      // 3. API 호출
      
      const response = await userAPI.updateProfileImage(formData);
      

      // 4. 세션 갱신 및 알림
      await refreshSession();
      showToast(i18n.t("프로필 이미지가 변경되었습니다."), 'success');
    } catch (error: any) {
      

      if (error.config) {

      }

      if (error.request) {
      
      }

  
      showToast(i18n.t("이미지 업로드에 실패했습니다."), 'error');
    }
  };


  return (
    
    <View style={styles.screen}>
      <ToastAlert
        visible={Boolean(toastMessage)}
        message={toastMessage}
        tone={toastTone}
        toastKey={toastKey}
        onDismiss={() => setToastMessage('')}
      />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: 20 }]}
        showsVerticalScrollIndicator={false}
        onScroll={topScrollGradient.onScroll}
        scrollEventThrottle={16}
      >
        <ProfileCard
          name={profile.name}
          email={profile.email}
          profileImage={profile.profileImage}
          onAccountPress={() => router.push('/settings/account')}
          onImagePress={handleImageUpdate} 
        />
        {/* <SubscriptionCard onManagePress={() => router.push('/settings/subscribe')} /> */}

        <SettingsSection title={i18n.t("앱 설정")}>
          <SettingRow
            title={t('settings.language.title')}
            description={t('settings.language.display')}
            value={t(`settings.language.${selectedLanguage === 'ko' ? 'korean' : selectedLanguage === 'en' ? 'english' : 'japanese'}`)}
            onPress={() => setSettingsSheetType('language')}
          />
          <SettingRow
            title={i18n.t("셀룰러 데이터 사용")}
            toggleKey="cellular"
            toggles={displayedToggles}
            onToggle={handleToggle}
          />
        </SettingsSection>
        {/* 알림  */}
        <SettingsSection title={i18n.t("알림 설정")}>
          <SettingRow
            title={i18n.t("야간 모드")}
            description={i18n.t("설정 시간 동안 알림 끄기")}
            toggleKey="nightMode"
            toggles={displayedToggles}
            onToggle={handleToggle}
          />
          <SettingsTimeRow
            startHour={nightStartHour}
            startMinute={nightStartMinute}
            endHour={nightEndHour}
            endMinute={nightEndMinute}
            formatTimeLabel={formatTimeLabel}
            onPress={() => setSettingsSheetType('nightMode')}
            isToggled={nightModeEnabled}
          />
          {/* API 개발 되면 추가 */}
          {/* <SettingRow
            title="중요 알림"
            description="측정 결과 알림, 채팅 등"
            toggleKey="importantAlarm"
            toggles={toggles}
            onToggle={handleToggle}
          />
          <SettingRow
            title="기타 알림"
            description="새로운 측정 제안 등"
            toggleKey="otherAlarm"
            toggles={toggles}
            onToggle={handleToggle}
          />
          <SettingRow
            title="마케팅 수신 동의"
            description="이벤트 등"
            toggleKey="marketing"
            toggles={toggles}
            onToggle={handleToggle}
          /> */}
        </SettingsSection>

        <SettingsSection title={i18n.t("데이터")}>
          {/* 나중에 기능 개발하면 추가 */}
          {/* <SettingRow
            title="클라우드 백업"
            description="마지막 백업: 방금 전"
            toggleKey="cloudBackup"
            toggles={toggles}
            onToggle={handleToggle}
          /> */}
          <SettingRow
            title={i18n.t("히스토리 내보내기")}
            description={i18n.t("PDF 파일로 저장")}
            onPress={handleHistoryExportPress}
          />
        </SettingsSection>

        <SettingsSection title={i18n.t("정보")}>
          <SettingRow title={i18n.t("가이드 다시보기")} onPress={() => showComingSoon(i18n.t("가이드"))} />
          <SettingRow title={i18n.t("버전 정보")} value="v.1.0.0" />
          <SettingRow title={i18n.t("앱 평가")} description={i18n.t("스토어에 리뷰 남기기")} onPress={() => showComingSoon(i18n.t("앱 평가"))} />
          <SettingRow title={i18n.t("문의 / 피드백")} description={i18n.t("개발팀에 의견 보내기")} onPress={() => router.push('/settings/contact')} />
          <SettingRow title={i18n.t("데이터 초기화")} danger onPress={() => setSettingsSheetType('reset')} />
          {/* <SettingRow title="데이터 초기화" danger onPress={() => showComingSoon('초기화')} /> */}
        </SettingsSection>
      </ScrollView>

      <LanguageSettingsSheet
        visible={settingsSheetType === 'language'}
        selectedLanguage={selectedLanguage}
        onSelect={handleLanguageSelect}
        onClose={closeSettingsSheet}
      />

      <DataResetSheet
        visible={settingsSheetType === 'reset'}
        onClose={closeSettingsSheet}
        onReset={handleDataReset}
      />

      <GuideReplaySheet
        visible={settingsSheetType === 'guide'}
        onClose={closeSettingsSheet}
      />

      <HistoryExportSheet
        visible={settingsSheetType === 'historyExport'}
        onClose={closeSettingsSheet}
        onShare={handleHistorySharePress}
      />

      <NightModeSettingsSheet
        visible={settingsSheetType === 'nightMode'}
        startHour={nightStartHour}
        startMinute={nightStartMinute}
        endHour={nightEndHour}
        endMinute={nightEndMinute}
        onClose={closeSettingsSheet}
        onApply={handleNightModeApply}
      />
      </SafeAreaView>
      <TopScrollGradient visible={topScrollGradient.visible} />
    </View>
  );
}
