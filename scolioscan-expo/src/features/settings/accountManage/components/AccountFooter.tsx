import { View } from 'react-native';

import PrimaryButton from '@/src/components/ui/PrimaryButton';
import styles from '@/src/features/settings/accountManage/components/accountManageComponents.styles';

type AccountFooterProps = {
  saving: boolean;
  canSave: boolean;
  bottomInset: number;
  onSave: () => void;
};

export default function AccountFooter({ saving, canSave, bottomInset, onSave }: AccountFooterProps) {
  return (
    <View style={[styles.fixedFooter, { paddingBottom: Math.max(bottomInset, 60) }]}>
      <PrimaryButton
        title={saving ? '저장 중...' : '저장'}
        onPress={onSave}
        height={40}
        backgroundColor="#3D9A9A"
        borderRadius={4}
        style={styles.saveButton}
        textStyle={styles.saveButtonText}
        disabled={!canSave}
      />
    </View>
  );
}
