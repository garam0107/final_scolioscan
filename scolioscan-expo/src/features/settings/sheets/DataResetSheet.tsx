import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import CommonSettingsSheet from '@/src/features/settings/components/CommonSettingsSheet';
import styles from '@/src/features/settings/sheets/settingsSheets.styles';

type DataResetSheetProps = {
  visible: boolean;
  onClose: () => void;
  onReset?: () => void;
};

const RESET_DELETED_ITEMS = ['2D, 3D 촬영 기록', '척추측만계 측정 기록', '분석 및 리포트 히스토리', '앱 설정 (알림 등)'];

export default function DataResetSheet({ visible, onClose, onReset }: DataResetSheetProps) {
  const [confirmText, setConfirmText] = useState('');
  const canReset = confirmText.trim() === '초기화';

  const closeSheet = () => {
    setConfirmText('');
    onClose();
  };

  const handleReset = () => {
    if (!canReset) {
      return;
    }

    onReset?.();
    closeSheet();
  };

  return (
    <CommonSettingsSheet
      visible={visible}
      title="데이터를 초기화할까요?"
      titleTone="danger"
      description="이 작업은 되돌릴 수 없어요"
      height={420}
      onClose={closeSheet}
      actions={[
        { label: '취소', onPress: closeSheet },
        {
          label: '초기화',
          variant: 'danger',
          disabled: !canReset,
          onPress: handleReset,
        },
      ]}
    >
      <View style={styles.resetDeleteBox}>
        <Text style={styles.resetDeleteTitle}>삭제되는 항목</Text>
        {RESET_DELETED_ITEMS.map((item) => (
          <Text key={item} style={styles.resetDeleteItem}>{`• ${item}`}</Text>
        ))}
      </View>
      <Text style={styles.resetConfirmLabel}>확인을 위해 아래에 초기화 라고 입력해주세요</Text>
      <View style={styles.resetInputWrap}>
        <TextInput
          value={confirmText}
          onChangeText={setConfirmText}
          placeholder="초기화"
          placeholderTextColor="#B6BECE"
          style={styles.resetInput}
        />
      </View>
    </CommonSettingsSheet>
  );
}
