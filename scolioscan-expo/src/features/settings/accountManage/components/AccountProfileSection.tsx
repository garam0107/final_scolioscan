import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import AccountInfoRow from '@/src/features/settings/accountManage/components/AccountInfoRow';
import styles from '@/src/features/settings/accountManage/components/accountManageComponents.styles';

type AccountProfileSectionProps = {
  email: string;
  deviceName: string;
  deviceMeta: string;
  onDeviceLogout: () => void;
  onPasswordPress: () => void;
  onWithdrawPress: () => void;
};

export default function AccountProfileSection({
  email,
  deviceName,
  deviceMeta,
  onDeviceLogout,
  onPasswordPress,
  onWithdrawPress,
}: AccountProfileSectionProps) {
  return (
    <>
      <View style={styles.sectionSpacing}>
        <Text style={styles.sectionTitle}>로그인 방법</Text>
        <View style={styles.cardSection}>
          <AccountInfoRow
            icon={<Ionicons name="mail-outline" size={22} color="#25272D" />}
            title="이메일"
            subtitle={email || '-'}
            badgeLabel="기본"
          />
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
