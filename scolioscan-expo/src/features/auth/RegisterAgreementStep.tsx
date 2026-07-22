import { i18n } from '@/src/i18n';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AGREEMENTS,
  AgreementKey,
  AgreementState,
  isAllAgreed,
} from './agreements';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { agreementStyles as s } from './registerAgreement.styles';

type Props = {
  state: AgreementState;
  onToggle: (key: AgreementKey) => void;
  onToggleAll: () => void;
};

export default function RegisterAgreementStep({ state, onToggle, onToggleAll }: Props) {
  const [openKey, setOpenKey] = useState<AgreementKey | null>(null);
  const allChecked = isAllAgreed(state);
  const openItem = openKey ? AGREEMENTS.find((item) => item.key === openKey) ?? null : null;

  const handleAgreeFromModal = () => {
    if (!openKey) {
      return;
    }

    // 이미 동의한 약관은 다시 누르더라도 체크가 해제되지 않도록 유지합니다.
    if (!state[openKey]) {
      onToggle(openKey);
    }

    setOpenKey(null);
  };

  return (
    <View style={s.wrap}>
      <View style={s.titleBlock}>
        <Text style={s.title}>{i18n.t("ScolioScan에 오신 것을 환영합니다!")}</Text>
        <Text style={s.subtitle}>{i18n.t("회원가입 전, ScolioScan 약관들을 동의해주세요")}</Text>
      </View>

      <View style={s.list}>
        <Pressable
          onPress={onToggleAll}
          style={[s.row, s.allRow, allChecked && s.allRowChecked]}
        >
          <View style={s.checkIcon}>
            <Ionicons
              name="checkmark"
              size={18}
              color={allChecked ? '#22BCB7' : '#C5CCD8'}
            />
          </View>
          <Text style={s.allLabel}>{i18n.t("전체 약관동의")}</Text>
        </Pressable>

        {AGREEMENTS.map((item) => {
          const checked = state[item.key];
          return (
            <View key={item.key} style={s.row}>
              <Pressable
                onPress={() => onToggle(item.key)}
                style={s.rowMain}
                hitSlop={6}
              >
                <View style={s.checkIcon}>
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={checked ? '#22BCB7' : '#C5CCD8'}
                  />
                </View>
                <Text style={s.itemLabel}>{i18n.t(`agreements.${item.key}.label`)}</Text>
              </Pressable>
              <Pressable onPress={() => setOpenKey(item.key)} hitSlop={8}>
                <Text style={s.moreLink}>{i18n.t("더보기")}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      <Modal
        visible={openItem !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpenKey(null)}
      >
        <SafeAreaView style={s.modalRoot} edges={['top', 'bottom']}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle} numberOfLines={1}>
              {openItem ? i18n.t(`agreements.${openItem.key}.label`) : ''}
            </Text>
            <Pressable onPress={() => setOpenKey(null)} hitSlop={12}>
              <Ionicons name="close" size={26} color="#3B4049" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={s.modalBody}>
            <Text style={s.modalText}>
              {openItem ? i18n.t(`agreements.${openItem.key}.body`) : ''}
            </Text>
          </ScrollView>
          <View style={s.modalFooter}>
            <PrimaryButton
              title={i18n.t("동의하기")}
              onPress={handleAgreeFromModal}
              width="100%"
              height={48}
              backgroundColor="#2C9696"
              borderRadius={6}
              textStyle={s.modalAgreeButtonText}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
