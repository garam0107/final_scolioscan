import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import DataResetSheet from '@/src/features/settings/sheets/DataResetSheet';
import LanguageSettingsSheet from '@/src/features/settings/sheets/LanguageSettingsSheet';
import styles from '@/src/features/settings/settings.styles';
import ProfileIcon from '../../../assets/images/basic_profile_image.svg'

type ToggleKey = 'cellular' | 'nightMode' | 'importantAlarm' | 'otherAlarm' | 'marketing' | 'cloudBackup';
type NightTimeTarget = 'start' | 'end';
type SettingsSheetType = 'language' | 'reset' | null;

type SettingRowProps = {
  title: string;
  description?: string;
  value?: string;
  danger?: boolean;
  onPress?: () => void;
  toggleKey?: ToggleKey;
  toggles?: Record<ToggleKey, boolean>;
  onToggle?: (key: ToggleKey) => void;
};

const DEFAULT_TOGGLES: Record<ToggleKey, boolean> = {
  cellular: true,
  nightMode: true,
  importantAlarm: true,
  otherAlarm: true,
  marketing: false,
  cloudBackup: true,
};

const NIGHT_TIME_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour);

function formatHourLabel(hour: number) {
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour % 12 || 12;

  return `${period} ${displayHour}시`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function SettingRow({
  title,
  description,
  value,
  danger = false,
  onPress,
  toggleKey,
  toggles,
  onToggle,
}: SettingRowProps) {
  const hasSwitch = Boolean(toggleKey && toggles && onToggle);
  const isOn = toggleKey ? toggles?.[toggleKey] : false;

  return (
    <Pressable
      disabled={!onPress && !hasSwitch}
      onPress={hasSwitch && toggleKey ? () => onToggle?.(toggleKey) : onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && styles.dangerText]}>{title}</Text>
        {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
      </View>
      {hasSwitch && toggleKey ? (
        <Switch
          value={isOn}
          onValueChange={() => onToggle?.(toggleKey)}
          trackColor={{ false: '#D4D9E2', true: '#2C9696' }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#D4D9E2"
        />
      ) : (
        <View style={styles.rowMeta}>
          {value ? <Text style={styles.rowValue}>{value}</Text> : null}
          {onPress ? <Ionicons name="chevron-forward" size={16} color="#B9C1CC" /> : null}
        </View>
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [toggles, setToggles] = useState(DEFAULT_TOGGLES);
  const [nightStartHour, setNightStartHour] = useState(22);
  const [nightEndHour, setNightEndHour] = useState(6);
  const [nightTimeTarget, setNightTimeTarget] = useState<NightTimeTarget | null>(null);
  const [settingsSheetType, setSettingsSheetType] = useState<SettingsSheetType>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('한국어');

  const profile = useMemo(
    () => ({
      name: user?.name || 'ooo',
      email: user?.user_id || 'abcd@example.com',
    }),
    [user?.name, user?.user_id],
  );

  const handleToggle = (key: ToggleKey) => {
    setToggles((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const showComingSoon = (label: string) => {
    Alert.alert(label, '아직 연결 전인 설정이에요.');
  };

  const closeSettingsSheet = () => {
    setSettingsSheetType(null);
  };

  const closeNightTimeDropdown = () => {
    setNightTimeTarget(null);
  };

  const handleNightTimeSelect = (hour: number) => {
    if (nightTimeTarget === 'start' && hour === nightEndHour) {
      Alert.alert('시간 설정', '시작 시간과 종료 시간은 같을 수 없습니다.');
      return;
    }

    if (nightTimeTarget === 'end' && hour === nightStartHour) {
      Alert.alert('시간 설정', '종료 시간과 시작 시간은 같을 수 없습니다.');
      return;
    }

    if (nightTimeTarget === 'start') {
      setNightStartHour(hour);
    }

    if (nightTimeTarget === 'end') {
      setNightEndHour(hour);
    }

    closeNightTimeDropdown();
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <ProfileIcon/>
          </View>
          <View style={styles.profileText}>
            <View style={styles.nameLine}>
              <Text style={styles.profileName}>{profile.name}</Text>
              {/* 구독한 사람만 뱃지 나오도록 수정 */}
              {/* <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>Pro</Text>
              </View> */}
            </View>
            <Text style={styles.profileEmail}>{profile.email}</Text>
          </View>
          <Pressable
            hitSlop={8}
            onPress={() => router.push('/settings/account')}
            style={({ pressed }) => [styles.accountManagePill, pressed && styles.accountManagePillPressed]}
          >
            <Text style={styles.accountManageText}>계정 관리</Text>
            <Ionicons name="chevron-forward" size={12} color="#B8C0CA" />
          </Pressable>
        </View>
        <Text style={styles.subscriptionLabel}>구독 정보</Text>
        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionLeft}>
            
            <View style={styles.subscriptionStatus}>
              {/* 구독 상태에 따라 표시하도록 수정 현재는 하드코딩 */}
              <Text style={styles.subscriptionText}>구독 상태에 따라 변경</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push('/settings/subscribe')} hitSlop={10}>
            <Text style={styles.linkText}>구독 관리</Text>
          </Pressable>
        </View>

        <Section title="앱 설정">
          <SettingRow
            title="언어 설정"
            description="앱 표시 언어"
            value="한국어"
            onPress={() => setSettingsSheetType('language')}
          />
          <SettingRow title="셀룰러 데이터 사용" toggleKey="cellular" toggles={toggles} onToggle={handleToggle} />
        </Section>

        <Section title="알림 설정">
          <SettingRow
            title="야간 모드"
            description="설정 시간 동안 알림 끄기"
            toggleKey="nightMode"
            toggles={toggles}
            onToggle={handleToggle}
          />
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>시작</Text>
              <Pressable
                style={({ pressed }) => [styles.timePill, pressed && styles.timePillPressed]}
                onPress={() => setNightTimeTarget('start')}
              >
                <Text numberOfLines={1} style={styles.timePillText}>{formatHourLabel(nightStartHour)}</Text>
              </Pressable>
            </View>
            <Text style={styles.timeSeparator}>~</Text>
            <View style={styles.timeField}>
              <Text style={styles.timeLabel}>종료</Text>
              <Pressable
                style={({ pressed }) => [styles.timePill, pressed && styles.timePillPressed]}
                onPress={() => setNightTimeTarget('end')}
              >
                <Text numberOfLines={1} style={styles.timePillText}>{formatHourLabel(nightEndHour)}</Text>
              </Pressable>
            </View>
          </View>
          <SettingRow
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
          />
        </Section>

        <Section title="데이터">
          <SettingRow
            title="클라우드 백업"
            description="마지막 백업: 방금 전"
            toggleKey="cloudBackup"
            toggles={toggles}
            onToggle={handleToggle}
          />
          <SettingRow
            title="히스토리 내보내기"
            description="PDF 파일로 저장"
            onPress={() => showComingSoon('히스토리 내보내기')}
          />
        </Section>

        <Section title="정보">
          <SettingRow title="가이드 다시보기" onPress={() => showComingSoon('가이드 다시보기')} />
          <SettingRow title="버전 정보" value="v.0.0.0" />
          <SettingRow title="앱 평가" description="스토어에 리뷰 남기기" onPress={() => showComingSoon('앱 평가')} />
          <SettingRow title="문의 / 피드백" description="개발팀에 의견 보내기" onPress={() => router.push('/settings/contact')} />
          <SettingRow title="데이터 초기화" danger onPress={() => setSettingsSheetType('reset')} />
        </Section>
      </ScrollView>

      <LanguageSettingsSheet
        visible={settingsSheetType === 'language'}
        selectedLanguage={selectedLanguage}
        onSelect={setSelectedLanguage}
        onClose={closeSettingsSheet}
      />

      <DataResetSheet
        visible={settingsSheetType === 'reset'}
        onClose={closeSettingsSheet}
      />

      <Modal
        visible={nightTimeTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={closeNightTimeDropdown}
      >
        <Pressable style={styles.timeDropdownOverlay} onPress={closeNightTimeDropdown}>
          <Pressable style={styles.timeDropdownCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.timeDropdownTitle}>
              {nightTimeTarget === 'start' ? '시작 시간 선택' : '종료 시간 선택'}
            </Text>
            <ScrollView style={styles.timeDropdownList} showsVerticalScrollIndicator={false}>
              {NIGHT_TIME_OPTIONS.map((hour) => {
                const selectedHour = nightTimeTarget === 'start' ? nightStartHour : nightEndHour;
                const disabled =
                  (nightTimeTarget === 'start' && hour === nightEndHour) ||
                  (nightTimeTarget === 'end' && hour === nightStartHour);

                return (
                  <Pressable
                    key={hour}
                    disabled={disabled}
                    style={[
                      styles.timeDropdownOption,
                      selectedHour === hour && styles.timeDropdownOptionSelected,
                      disabled && styles.timeDropdownOptionDisabled,
                    ]}
                    onPress={() => handleNightTimeSelect(hour)}
                  >
                    <Text
                      style={[
                        styles.timeDropdownOptionText,
                        selectedHour === hour && styles.timeDropdownOptionTextSelected,
                        disabled && styles.timeDropdownOptionTextDisabled,
                      ]}
                    >
                      {formatHourLabel(hour)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
