import { MuseoModerno_700Bold, useFonts as useMuseoFonts } from '@expo-google-fonts/museomoderno';
import { useFonts as useExpoFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
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

import { alarmAPI } from '@/src/api/alarm';
import { useAuth } from '@/src/contexts/AuthContext';
import {
  HomeMeasurement2DIcon,
  HomeMeasurement3DIcon,
  HomeNotificationIcon,
  HomeSpineIcon,
} from '@/src/features/home/homeIcons';
import styles from '@/src/features/home/home.styles';
import ThreeDCameraIcon from '../../../assets/icons/3D_camera.svg';
import TwoIcon from '../../../assets/home/test.svg'
import ThreeIcon from '../../../assets/home/home_3d_camera.svg'
import ScolioIcon from '../../../assets/home/home_scolio.svg'
const pretendardFont = require('../../../assets/fonts/PretendardVariable.ttf');
// const router = useRouter();
const banner1 = require('../../../assets/images/BannerImage1.png');
const banner2 = require('../../../assets/images/BannerImage2.png');
const example_home = require('../../../assets/images/example_home.png');


// title하고 subtitle은 나중에 수정 예정 
const exerciseVideos = [
  {
    id: 'core-balance',
    title: '코어 강화 : 플랭크',
    subtitle: '36~60초 유지, 3세트',
    image: example_home,
  },
  {
    id: 'cat-cow',
    title: '스트레칭 : 고양이-소 자세',
    subtitle: '10회 반복, 2세트',
    image: example_home,
  },
   {
    id: 'cat',
    title: '스트레칭 : 고양이-소 자세',
    subtitle: '10회 반복, 2세트',
    image: example_home,
  },
  
];

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



function MeasurementRow({
  title,
  subtitle,
  icon,
  onPress,
  pro,
  subtitleColor,
  subtitleBackgroundColor,
}: MeasurementItem) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.measurementRow, pressed && styles.pressed]}
    >
      <View style={styles.measurementRowContent}>
        <View style={styles.measurementTitleRow}>
          <Text style={styles.measurementTitle}>{title}</Text>
          {pro && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>👑 Pro</Text>
            </View>
          )}
        </View>
        <View
          style={[
            styles.measurementBadge,
            subtitleBackgroundColor ? { backgroundColor: subtitleBackgroundColor } : null,
          ]}
        >
          <Text style={[styles.measurementBadgeText, subtitleColor ? { color: subtitleColor } : null]}>
            {subtitle}
          </Text>
        </View>
      </View>
      <View style={styles.measurementIconWrap}>{icon}</View>
    </Pressable>
  );
}

type ExerciseCardProps = {
  title: string;
  subtitle: string;
  image: number;
  onPress?: () => void;
};

function ExerciseCard({ title, subtitle, image, onPress }: ExerciseCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.exerciseCard}>
      <Image source={image} style={styles.exerciseThumbnail} resizeMode="cover" />
      <Text style={styles.exerciseTitle}>{title}</Text>
      <Text style={styles.exerciseSubtitle}>{subtitle}</Text>
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
  const isCompactWidth = width < 390;
  const bannerHeight = isCompactWidth ? 104 : 112;



  // icon 배경이랑 하단에 그림자가 피그마랑 다르게 보여서 추후 수정 예정
  const measurementItems: MeasurementItem[] = [
  {
    id: '2d',
    title: '2D 이미지 측정',
    subtitle: '카메라를 통한 간편 측정',
    icon: <TwoIcon />,
    onPress: () => router.push('/measure/2d'),
  },
  {
    id: 'spine',
    title: '척추측만계 측정',
    subtitle: '기기를 통한 정확한 측정',
    icon: <ScolioIcon />,
    onPress: () => router.push('/measure/scoliometer'),
  },
  {
    id: '3d',
    title: '3D 동영상 측정',
    subtitle: '영상을 통한 정밀 측정',
    icon: <ThreeIcon />,
    pro: true,
    subtitleColor: '#6A8DFF',
    subtitleBackgroundColor: '#EAF1FF',
    onPress: () => Alert.alert('준비중', '3D 측정 기능은 다음 화면에서 연결할게요.'),
  },
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

  useEffect(() => {
    console.log('[Home] unread alarm count from user:', user?.alarm_count ?? 0);
    setAlarmCount(user?.alarm_count ?? 0);
  }, [user?.alarm_count]);

  useFocusEffect(
    useCallback(() => {
      void loadAlarmCount();
    }, [loadAlarmCount]),
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
          <Text style={styles.headline}>3분만에 끝나는 척추검진</Text>

          <View style={styles.measurementGroupCard}>
            {measurementItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <MeasurementRow
                  {...item}
                  onPress={item.id === '3d' ? () => setIsProModalVisible(true) : item.onPress}
                />
                {index !== measurementItems.length - 1 ? <View style={styles.measurementRowDivider} /> : null}
              </React.Fragment>
            ))}
          </View>
         
          {/* <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>척추측만증이란?</Text>
            <View style={styles.infoRow}>
              <InfoCard
                title="척추측만증이란?"
                subtitle="척추측만증 알아보기"
                image={intro1}
                onPress={() => Alert.alert('안내', '척추측만증 소개 화면은 다음 단계에서 연결할게요.')}
              />
              <InfoCard
                title="스콜리오스캔 사용법"
                subtitle="사용법 알아보기"
                image={intro3}
                onPress={() => Alert.alert('안내', '스콜리오스캔 사용법 화면은 다음 단계에서 연결할게요.')}
              />
            </View>
          </View> */}

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
          {/* 현재는 임의의 화면과 글을 넣었고 추후 글에 맞는 유튜브 링크로 이동하도록 변경 */}
          <View style={styles.exerciseSection}>
                <Text style={styles.exerciseSectionTitle}>허리 건강에 도움이 되는 운동 정보</Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.exerciseScrollContent}
                >
                  {exerciseVideos.map((item) => (
                    <ExerciseCard
                      key={item.id}
                      title={item.title}
                      subtitle={item.subtitle}
                      image={item.image}
                      onPress={() => Alert.alert('운동 정보', `${item.title} 화면은 다음 단계에서 연결할게요.`)}
                    />
                  ))}
                </ScrollView>
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

