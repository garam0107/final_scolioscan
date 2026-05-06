import { MuseoModerno_700Bold, useFonts as useMuseoFonts } from '@expo-google-fonts/museomoderno';
import { useFonts as useExpoFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import CrownIcon from '../../../assets/home/crown.svg';
import { alarmAPI } from '@/src/api/alarm';
import { curvatureAPI } from '@/src/api/curvature';
import { useAuth } from '@/src/contexts/AuthContext';
import { HomeNotificationIcon } from '@/src/features/home/homeIcons';
import styles from '@/src/features/home/home.styles';
import ThreeDCameraIcon from '../../../assets/icons/3D_camera.svg';
import TwoIcon from '../../../assets/home/test.svg'
import ThreeIcon from '../../../assets/home/home_3d_camera.svg'
const pretendardFont = require('../../../assets/fonts/PretendardVariable.ttf');
const banner1 = require('../../../assets/images/BannerImage1.png');
const banner2 = require('../../../assets/images/BannerImage2.png');

type MeasurementItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onPress?: () => void;
  pro?: boolean;
  subtitleColor?: string;
  subtitleBackgroundColor?: string;
};

type MeasurementCardProps = MeasurementItem & {
  cardWidth: number;
};

type WeeklyResultItem = {
  id: string;
  label: string;
  value: number;
};

type WeeklyResultValues = {
  upperThoracic: number;
  mainThoracic: number;
  lumbar: number;
};

const INITIAL_WEEKLY_RESULT_VALUES: WeeklyResultValues = {
  upperThoracic: 0,
  mainThoracic: 0,
  lumbar: 0,
};

function formatAngleValue(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 10) / 10;
}

function MeasurementCard({
  title,
  subtitle,
  icon,
  onPress,
  pro,
  subtitleColor,
  subtitleBackgroundColor,
  cardWidth,
}: MeasurementCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.measurementCard, { width: cardWidth }, pressed && styles.pressed]}
    >
      {pro && (
        <View style={styles.proBadge}>
                 <CrownIcon width={10} height={10} />
          <Text style={styles.proBadgeText}>Pro</Text>
        </View>
      )}
      <View style={styles.measurementIconWrap}>{icon}</View>
      <View style={styles.measurementCardContent}>
        <Text style={styles.measurementTitle}>{title}</Text>
        <View style={[styles.measurementBadge, subtitleBackgroundColor ? { backgroundColor: subtitleBackgroundColor } : null]}>
          <Text style={[styles.measurementBadgeText, subtitleColor ? { color: subtitleColor } : null]}>{subtitle}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { loading, isAuthenticated, user } = useAuth();
  const [museoLoaded] = useMuseoFonts({ MuseoModerno_700Bold });
  const [pretendardLoaded, pretendardError] = useExpoFonts({ PretendardVariable: pretendardFont });
  const [bannerIndex, setBannerIndex] = useState(0);
  const [alarmCount, setAlarmCount] = useState(user?.alarm_count ?? 0);
  const [isProModalVisible, setIsProModalVisible] = useState(false);
  const [selectedWeeklyResultId, setSelectedWeeklyResultId] = useState('upper-thoracic');
  const [weeklyResultValues, setWeeklyResultValues] = useState<WeeklyResultValues>(INITIAL_WEEKLY_RESULT_VALUES);
  const isCompactWidth = width < 390;
  const bannerHeight = isCompactWidth ? 104 : 112;
  const measurementCardWidth = (width - 40 - 8) / 2;
  const displayName = user?.name?.trim() || '회원';



  const measurementItems: MeasurementItem[] = [
  {
    id: '2d',
    title: '2D 측정하기',
    subtitle: '집에서 간편하게 측정',
    icon: <TwoIcon width={70} height={70} />,
    onPress: () => router.push('/measure/2d'),
  },
  {
    id: '3d',
    title: '3D 동영상 측정',
    subtitle: '영상을 통한 정밀 측정',
    icon: <ThreeIcon width={70} height={70} />,
    pro: true,
    subtitleColor: '#2E96FF',
    subtitleBackgroundColor: '#EBF5FF',
    onPress: () => Alert.alert('준비중', '3D 측정 기능은 다음 화면에서 연결할게요.'),
  },
];
  const weeklyResults: WeeklyResultItem[] = [
    { id: 'upper-thoracic', label: '상부 흉추만곡', value: weeklyResultValues.upperThoracic },
    { id: 'main-thoracic', label: '주 흉추만곡', value: weeklyResultValues.mainThoracic },
    { id: 'lumbar', label: '요추만곡', value: weeklyResultValues.lumbar },
  ];

  const loadAlarmCount = useCallback(async () => {
    try {
      const response = await alarmAPI.getUnreadCount();
      console.log('[Home] unread alarm count from API:', response.data.count);
      setAlarmCount(response.data.count);
    } catch (error) {
      console.error('Failed to load alarm count:', error);
    }
  }, []);

  const loadLatestCurvature = useCallback(async () => {
    try {
      const response = await curvatureAPI.getAnalyses({ limit: 1 });
      const latestCurvature = response.data[0];

      if (!latestCurvature) {
        setWeeklyResultValues(INITIAL_WEEKLY_RESULT_VALUES);
        return;
      }

      setWeeklyResultValues({
        upperThoracic: formatAngleValue(latestCurvature.secondary_thoracic_cobb),
        mainThoracic: formatAngleValue(latestCurvature.main_thoracic_cobb),
        lumbar: formatAngleValue(latestCurvature.lumbar_cobb),
      });
    } catch (error) {
      console.error('Failed to load latest curvature:', error);
      setWeeklyResultValues(INITIAL_WEEKLY_RESULT_VALUES);
    }
  }, []);

  useEffect(() => {
    console.log('[Home] unread alarm count from user:', user?.alarm_count ?? 0);
    setAlarmCount(user?.alarm_count ?? 0);
  }, [user?.alarm_count]);

  useFocusEffect(
    useCallback(() => {
      void loadAlarmCount();
      void loadLatestCurvature();
    }, [loadAlarmCount, loadLatestCurvature]),
  );

  useEffect(() => {
    if (pretendardError) {
      console.error('Pretendard font failed to load:', pretendardError);
    }
  }, [pretendardError]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((value) => (value + 1) % 2);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const banners = useMemo(() => [banner1, banner2], []);

  if (loading || !museoLoaded || (!pretendardLoaded && !pretendardError)) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={['top', 'left', 'right',]}>
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>화면을 불러오는 중입니다...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right' , ]}>
      <View style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>ScolioScan</Text>
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push('/notifications')} style={styles.headerIconButton}>
              <HomeNotificationIcon unread={alarmCount > 0} />
            </Pressable>
          </View>
        </View>

        {pretendardError ? (
          <View style={styles.fontWarning}>
            <Text style={styles.fontWarningText}>
              폰트 로딩 실패: 기본 시스템 폰트로 표시 중입니다.
            </Text>
          </View>
        ) : null}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom:  20 }]}
        >
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingTitle}>{displayName}님 안녕하세요.</Text>
            <Text style={styles.greetingSubtitle}>점점 좋아지고 있어요. 화이팅! 🔥</Text>
          </View>

          <View style={styles.measurementGrid}>
            {measurementItems.map((item) => (
              <MeasurementCard
                key={item.id}
                {...item}
                cardWidth={measurementCardWidth}
                onPress={item.id === '3d' ? () => setIsProModalVisible(true) : item.onPress}
              />
            ))}
          </View>
         

          <View style={styles.bannerWrap}>
            <ImageBackground
              source={banners[bannerIndex]}
              style={[styles.banner, { height: bannerHeight }]}
              imageStyle={styles.bannerImage}
            >
              <View style={styles.bannerBadge}>
                <Text style={styles.bannerBadgeText}>{bannerIndex + 1} / 2</Text>
              </View>
            </ImageBackground>
          </View>

          <View style={styles.weeklySection}>
            <Text style={styles.sectionHeading}>최근 1주일 측정 결과</Text>
            <View style={styles.weeklyResultGrid}>
              {weeklyResults.map((item) => {
                const isSelected = selectedWeeklyResultId === item.id;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelectedWeeklyResultId(item.id)}
                    style={({ pressed }) => [
                      styles.weeklyResultCard,
                      isSelected ? styles.weeklyResultCardActive : null,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.weeklyResultLabel, isSelected ? styles.weeklyResultLabelActive : null]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.weeklyResultValue, isSelected ? styles.weeklyResultValueActive : null]}>
                      {item.value}°
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.contentSlot} />
        </ScrollView>

        <Modal
          visible={isProModalVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setIsProModalVisible(false)}
        >
          <View style={styles.proModalOverlay}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setIsProModalVisible(false)} />
            <View style={styles.proModalCard}>
              <View style={styles.proModalHeader}>
                <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
                  <Defs>
                    <SvgLinearGradient id="proModalGradient" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="18%" stopColor="#D6FFFE" />
                      <Stop offset="100%" stopColor="#FFFFFF" />
                    </SvgLinearGradient>
                  </Defs>
                  <Rect width="100%" height="100%" fill="url(#proModalGradient)" />
                </Svg>
                <ThreeDCameraIcon width={120} height={120} />
              </View>

              <View style={styles.proModalBody}>
                <Text style={styles.proModalTitle}>
                  3D 동영상 측정을 이용하시려면{'\n'}Pro 모델을 구독해주세요.
                </Text>
                <Text style={styles.proModalSubtitle}>처음 구독하시면 50% 할인해요!</Text>

                <Pressable
                  onPress={() => {
                    setIsProModalVisible(false);
                    Alert.alert('준비중', '구독 페이지는 다음 단계에서 연결할게요.');
                  }}
                  style={({ pressed }) => [styles.proModalButton, pressed && styles.pressed]}
                >
                  <Text style={styles.proModalButtonText}>구독하러 가기</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

