import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import ThreeDCameraIcon from '../../../../assets/icons/home/3d_sub.svg';
import styles from '@/src/features/home/styles/homeProModal.styles';

type HomeProModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubscribePress: () => void;
};

export default function HomeProModal({
  visible,
  onClose,
  onSubscribePress,
}: HomeProModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.proModalOverlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
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
              onPress={onSubscribePress}
              style={({ pressed }) => [styles.proModalButton, pressed && styles.pressed]}
            >
              <Text style={styles.proModalButtonText}>구독하러 가기</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
