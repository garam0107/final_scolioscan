import CommonSettingsSheet from '@/src/features/settings/components/CommonSettingsSheet';

type HistoryExportSheetProps = {
  visible: boolean;
  onClose: () => void;
  onShare: () => void;
};

export default function HistoryExportSheet({ visible, onClose, onShare }: HistoryExportSheetProps) {
  return (
    <CommonSettingsSheet
      visible={visible}
      title="히스토리를 PDF로 저장했어요"
      description="저장한 PDF 파일을 다른 사람에게 공유할까요?"
      presentation="centerConfirm"
      bottomPlacement="safeArea"
      onClose={onClose}
      actions={[
        { label: '취소', onPress: onClose },
        {
          label: '공유하기',
          variant: 'primary',
          onPress: onShare,
        },
      ]}
    />
  );
}
