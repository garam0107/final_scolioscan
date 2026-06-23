import CommonSettingsSheet from '@/src/features/settings/components/CommonSettingsSheet';
import styles from '@/src/features/settings/accountManage/components/accountManageComponents.styles';
import type { SocialProvider } from '@/src/types/user';
import GoogleIcon from '../../../../../assets/icons/setting/setting_google.svg';
import KakaoIcon from '../../../../../assets/icons/setting/setting_kakao.svg';
import NaverIcon from '../../../../../assets/icons/setting/setting_naver.svg';

type SocialLinkSheetMode = 'link' | 'unlink';

type SocialLinkActionSheetProps = {
  visible: boolean;
  provider: SocialProvider | null;
  mode: SocialLinkSheetMode;
  email?: string | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function SocialLinkActionSheet({
  visible,
  provider,
  mode,
  email,
  submitting = false,
  onClose,
  onConfirm,
}: SocialLinkActionSheetProps) {
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
  const isUnlinkMode = mode === 'unlink';

  return (
    <CommonSettingsSheet
      visible={visible}
      title={isUnlinkMode ? `${selectedProvider.label} 연결 해제` : `${selectedProvider.label} 연결하기`}
      description={
        isUnlinkMode
          ? email
            ? `${email} 연결을 해제할게요`
            : `${selectedProvider.label} 연결을 해제할게요`
          : email
            ? `${email} 계정으로 연결할게요`
            : `${selectedProvider.label} 계정으로 연결할게요`
      }
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
          label: isUnlinkMode ? '해제하기' : '연결하기',
          variant: 'primary',
          onPress: onConfirm,
          disabled: submitting,
        },
      ]}
      contentStyle={styles.socialUnlinkSheetContent}
    />
  );
}
