import CommonSettingsSheet from '@/src/features/settings/components/CommonSettingsSheet';
import styles from '@/src/features/settings/accountManage/components/accountManageComponents.styles';
import type { SocialProvider } from '@/src/types/user';
import GoogleIcon from '../../../../../assets/icons/setting/setting_google.svg';
import KakaoIcon from '../../../../../assets/icons/setting/setting_kakao.svg';
import NaverIcon from '../../../../../assets/icons/setting/setting_naver.svg';

type SocialUnlinkConfirmSheetProps = {
  visible: boolean;
  provider: SocialProvider | null;
  email?: string | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function SocialUnlinkConfirmSheet({
  visible,
  provider,
  email,
  submitting = false,
  onClose,
  onConfirm,
}: SocialUnlinkConfirmSheetProps) {
  if (!provider) {
    return null;
  }

  const providerMeta = {
    google: {
      label: '구글',
      icon: <GoogleIcon width={24} height={24} />,
    },
    naver: {
      label: '네이버',
      icon: <NaverIcon width={24} height={24} />,
    },
    kakao: {
      label: '카카오',
      icon: <KakaoIcon width={24} height={24} />,
    },
  } as const;

  const selectedProvider = providerMeta[provider];

  return (
    <CommonSettingsSheet
      visible={visible}
      title={`${selectedProvider.label} 연결 해제`}
      description={email ? `${email} 연결을 해제할게요` : `${selectedProvider.label} 연결을 해제할게요`}
      headerTopContent={<>{selectedProvider.icon}</>}
      presentation="centerConfirm"
      bottomPlacement="safeArea"
      onClose={onClose}
      actions={[
        {
          label: '취소',
          onPress: onClose,
          disabled: submitting,
        },
        {
          label: '해제하기',
          variant: 'primary',
          onPress: onConfirm,
          disabled: submitting,
        },
      ]}
      contentStyle={styles.socialUnlinkSheetContent}
    />
  );
}
