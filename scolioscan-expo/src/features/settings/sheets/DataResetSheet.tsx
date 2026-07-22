import { i18n } from '@/src/i18n';
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
    // 시트를 닫을 때 확인 입력값을 비워 다음 열림에 이전 값이 남지 않게 한다.
    setConfirmText('');
    onClose();
  };

  const handleReset = () => {
    // 확인 문구가 정확히 입력된 경우에만 초기화 콜백을 실행한다.
    if (!canReset) {
      return;
    }

    onReset?.();
    closeSheet();
  };

  return (
    <CommonSettingsSheet
      visible={visible}
      title={i18n.t("데이터를 초기화할까요!?")}
      titleTone="danger"
      description={i18n.t("이 작업은 되돌릴 수 없어요")}
      bottomPlacement="safeArea"
      avoidKeyboard
      onClose={closeSheet}
      actions={[
        { label: i18n.t("취소"), onPress: closeSheet },
        {
          label: i18n.t("초기화"),
          variant: 'danger',
          disabled: !canReset,
          onPress: handleReset,
        },
      ]}
    >
      <View style={styles.resetDeleteBox}>
        <Text style={styles.resetDeleteTitle}>{i18n.t("삭제되는 항목")}</Text>
        {RESET_DELETED_ITEMS.map((item) => (
          <Text key={item} style={styles.resetDeleteItem}>{`• ${i18n.t(item)}`}</Text>
        ))}
      </View>
      <Text style={styles.resetConfirmLabel}>{i18n.t("확인을 위해 아래에 초기화 라고 입력해주세요")}</Text>
      <View style={styles.resetInputWrap}>
        <TextInput
          value={confirmText}
          onChangeText={setConfirmText}
          placeholder={i18n.t("초기화")}
          placeholderTextColor="#B6BECE"
          style={styles.resetInput}
        />
      </View>
    </CommonSettingsSheet>
  );
}
