import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/contexts/AuthContext';
import styles from '@/src/features/settings/settings.styles';
import ProfileIcon from '../../../assets/images/basic_profile_image.svg'

type ToggleKey = 'cellular' | 'nightMode' | 'importantAlarm' | 'otherAlarm' | 'marketing' | 'cloudBackup';

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
          trackColor={{ false: '#DDE3EA', true: '#74B8B3' }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#DDE3EA"
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
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [toggles, setToggles] = useState(DEFAULT_TOGGLES);

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

  const handleLogout = () => {
    Alert.alert('로그아웃', '현재 계정에서 로그아웃할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const showComingSoon = (label: string) => {
    Alert.alert(label, '아직 연결 전인 설정이에요.');
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 10 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.profileCard} onPress={() => router.push('/settings/account')}>
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
            <View style={styles.accountManagePill}>
            <Text style={styles.accountManageText}>계정 관리</Text>
            <Ionicons name="chevron-forward" size={12} color="#B8C0CA" />
          </View>
        </Pressable>
        <Text style={styles.subscriptionLabel}>구독 정보</Text>
        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionLeft}>
            
            <View style={styles.subscriptionStatus}>
              {/* 구독 상태에 따라 표시하도록 수정 현재는 하드코딩 */}
              <Text style={styles.subscriptionText}>구독 상태에 따라 변경</Text>
            </View>
          </View>
          <Pressable onPress={() => showComingSoon('구독 관리')} hitSlop={10}>
            <Text style={styles.linkText}>구독 관리</Text>
          </Pressable>
        </View>

        <Section title="앱 설정">
          <SettingRow
            title="언어 설정"
            description="앱 표시 언어"
            value="한국어"
            onPress={() => showComingSoon('언어 설정')}
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
            <Text style={styles.timeLabel}>시간</Text>
            <View style={styles.timePills}>
              <View style={styles.timePill}>
                <Text style={styles.timePillText}>오전 10시</Text>
              </View>
              <Text style={styles.timeSeparator}>-</Text>
              <View style={styles.timePill}>
                <Text style={styles.timePillText}>오후 6시</Text>
              </View>
            </View>
          </View>
          <SettingRow
            title="중요 알림"
            description="측정 결과 알림, 자동 등"
            toggleKey="importantAlarm"
            toggles={toggles}
            onToggle={handleToggle}
          />
          <SettingRow
            title="기타 알림"
            description="새로운 측정 가이드 등"
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
          <SettingRow title="버전 정보" value="v1.0.0" />
          <SettingRow title="앱 평가" description="스토어에 리뷰 남기기" onPress={() => showComingSoon('앱 평가')} />
          <SettingRow title="문의 / 피드백" description="개발팀에 의견 보내기" onPress={() => router.push('/settings/contact')} />
          <SettingRow title="로그아웃" danger onPress={handleLogout} />
          <SettingRow title="데이터 초기화" danger onPress={() => showComingSoon('데이터 초기화')} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
