import { i18n } from '@/src/i18n';
import CommonSettingsSheet from '@/src/features/settings/components/CommonSettingsSheet';

type HistoryExportConfirmSheetProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function HistoryExportConfirmSheet({
  visible,
  onClose,
  onConfirm,
}: HistoryExportConfirmSheetProps) {
  return (
    <CommonSettingsSheet
      visible={visible}
      title={i18n.t('히스토리를 PDF로 저장하시겠어요?')}
      presentation="centerConfirm"
      bottomPlacement="safeArea"
      onClose={onClose}
      actions={[
        { label: i18n.t('취소'), onPress: onClose },
        { label: i18n.t('저장하기'), variant: 'primary', onPress: onConfirm },
      ]}
    />
  );
}
