import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import AccountInfoRow from '@/src/features/settings/accountManage/components/AccountInfoRow';
import LoginMethodRow from '@/src/features/settings/accountManage/components/LoginMethodRow';
import styles from '@/src/features/settings/accountManage/components/accountManageComponents.styles';
import type { SocialLoginMethod } from '@/src/features/settings/accountManage/components/accountProfileSection.types';
import GoogleIcon from '../../../../../assets/icons/google.svg';
import KakaoIcon from '../../../../../assets/icons/kakao.svg';
import NaverIcon from '../../../../../assets/icons/naver.svg';

type AccountProfileSectionProps = {
  email: string;
  deviceName: string;
  deviceMeta: string;
  onDeviceLogout: () => void;
  onPasswordPress: () => void;
  onWithdrawPress: () => void;
  socialLoginMethods?: SocialLoginMethod[];
};

export default function AccountProfileSection({
  email,
  deviceName,
  deviceMeta,
  onDeviceLogout,
  onPasswordPress,
  onWithdrawPress,
  socialLoginMethods,
}: AccountProfileSectionProps) {
  // 연동 정보가 아직 없을 때도 로그인 방법 카드 레이아웃은 먼저 맞춰둔다.
  const loginMethodRows: SocialLoginMethod[] = socialLoginMethods ?? [
    { provider: 'google', isLinked: false },
    { provider: 'naver', isLinked: false },
    { provider: 'kakao', isLinked: false },
  ];

  const providerMeta = {
    google: {
      title: 'Google',
      icon: <GoogleIcon width={22} height={22} />,
    },
    naver: {
      title: 'Naver',
      icon: <NaverIcon width={22} height={22} />,
    },
    kakao: {
      title: '카카오',
      icon: <KakaoIcon width={22} height={22} />,
    },
  } as const;

  return (
    <>
      <View style={styles.sectionSpacing}>
        <Text style={styles.sectionTitle}>로그인 방법</Text>
        <View style={styles.cardSection}>
          <View style={styles.loginMethodList}>
            <AccountInfoRow
              icon={<Ionicons name="mail-outline" size={22} color="#25272D" />}
              title="이메일"
              subtitle={email || '-'}
              badgeLabel="기본"
            />
            {loginMethodRows.map((method) => {
              const meta = providerMeta[method.provider];

              return (
                <LoginMethodRow
                  key={method.provider}
                  icon={meta.icon}
                  title={meta.title}
                  subtitle={method.isLinked ? method.email || '연결됨' : '연결되지 않음'}
                  badgeLabel={method.isLinked ? '연결됨' : undefined}
                  actionLabel={method.isLinked ? '연결해제' : '연결하기'}
                  actionTone={method.isLinked ? 'muted' : 'primary'}
                  onPressAction={method.onPress}
                />
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.sectionSpacing}>
        <Text style={styles.sectionTitle}>로그인 기기</Text>
        <View style={styles.cardSection}>
          <AccountInfoRow
            variant="device"
            title={deviceName}
            subtitle={deviceMeta}
            badgeLabel="현재"
            rightElement={
              <Pressable hitSlop={8} onPress={onDeviceLogout}>
                <Text style={styles.deviceLogoutText}>로그아웃</Text>
              </Pressable>
            }
          />
        </View>
      </View>

      <View style={styles.actionArea}>
        <View style={styles.actionLinkRow}>
          <Pressable onPress={onPasswordPress}>
            <Text style={styles.actionLinkText}>비밀번호 변경</Text>
          </Pressable>
          <View style={styles.actionDivider} />
          <Pressable onPress={onWithdrawPress}>
            <Text style={styles.actionLinkText}>회원 탈퇴</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}
