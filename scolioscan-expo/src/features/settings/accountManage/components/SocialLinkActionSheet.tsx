import { i18n } from '@/src/i18n';
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
function getConfirmVariant(provider: SocialProvider, mode: SocialLinkSheetMode) {
  if (mode === 'unlink') {
    return 'primary';
  }

  if (provider === 'google') return 'google';
  if (provider === 'naver') return 'naver';
  return 'kakao';
}
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
      title={i18n.t(isUnlinkMode ? 'social.unlinkTitle' : 'social.linkTitle', {
        provider: i18n.t(selectedProvider.label),
      })}
      description={
        isUnlinkMode
          ? email
            ? i18n.t('social.unlinkEmailDescription', { email })
            : i18n.t('social.unlinkDescription', { provider: i18n.t(selectedProvider.label) })
          : email
            ? i18n.t('social.linkEmailDescription', { email })
            : i18n.t('social.linkDescription', { provider: i18n.t(selectedProvider.label) })
      }
      headerTopContent={<>{selectedProvider.icon}</>}
      presentation="centerConfirm"
      bottomPlacement="safeArea"
      onClose={onClose}
      actions={[
        {
          label: i18n.t("취소"),
          onPress: onClose,
          disabled: submitting,
        },
        {
          label: isUnlinkMode ? i18n.t("해제하기") : i18n.t("연결하기"),
          variant: isUnlinkMode ? 'primary' : getConfirmVariant(provider, mode),
          onPress: onConfirm,
          disabled: submitting,
        },
      ]}
      contentStyle={styles.socialUnlinkSheetContent}
    />
  );
}
