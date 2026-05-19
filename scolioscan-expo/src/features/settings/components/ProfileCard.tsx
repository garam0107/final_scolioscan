import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import ProfileIcon from '@/assets/images/basic_profile_image.svg';
import styles from '@/src/features/settings/components/profileCard.styles';

type ProfileCardProps = {
  name: string;
  email: string;
  onAccountPress: () => void;
};

export default function ProfileCard({ name, email, onAccountPress }: ProfileCardProps) {
  return (
    <View style={styles.profileCard}>
      <View style={styles.avatar}>
        <ProfileIcon />
      </View>
      <View style={styles.profileText}>
        <View style={styles.nameLine}>
          <Text style={styles.profileName}>{name}</Text>
          {/* 구독한 사람만 뱃지 나오도록 수정 */}
          {/* <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>Pro</Text>
          </View> */}
        </View>
        <Text style={styles.profileEmail}>{email}</Text>
      </View>
      <Pressable
        hitSlop={8}
        onPress={onAccountPress}
        style={({ pressed }) => [styles.accountManagePill, pressed && styles.accountManagePillPressed]}
      >
        <Text style={styles.accountManageText}>계정 관리</Text>
        <Ionicons name="chevron-forward" size={12} color="#B8C0CA" />
      </Pressable>
    </View>
  );
}
