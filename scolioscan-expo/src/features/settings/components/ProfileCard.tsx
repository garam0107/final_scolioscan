import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View, Image } from 'react-native';
import ProfileIcon from '@/assets/images/basic_profile_image.svg';
import styles from '@/src/features/settings/components/profileCard.styles';

type ProfileCardProps = {
  name: string;
  email: string;
  profileImage?: string | null;
  onAccountPress: () => void;
  onImagePress?: () => void;
};

export default function ProfileCard({ name, email, profileImage, onAccountPress,onImagePress }: ProfileCardProps) {
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace('/api', '') || '';
  const imageUrl = profileImage 
    ? (profileImage.startsWith('http') ? profileImage : `${API_BASE_URL}${profileImage}`)
    : null;

  console.log('[DEBUG] ProfileCard Render - imageUrl:', imageUrl);

  return (
    <View style={styles.profileCard}>
       <Pressable style={styles.avatar} onPress={onImagePress}>
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={{ width: '100%', height: '100%', borderRadius: 100 }}
          />
        ) : (
        <ProfileIcon />
        )}
       </Pressable>
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
