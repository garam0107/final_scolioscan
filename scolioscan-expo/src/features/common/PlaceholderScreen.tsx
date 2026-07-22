import { i18n } from '@/src/i18n';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '@/src/components/ui/PrimaryButton';
import { textFont } from '@/src/constants/fonts';

export default function PlaceholderScreen({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <PrimaryButton
          title={i18n.t("홈으로 돌아가기")}
          onPress={() => router.replace('/home')}
          style={{ marginTop: 22 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F7F8FB',
    flex: 1,
    position: 'relative',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 96,
    paddingHorizontal: 24,
  },
  title: {
    color: '#20222D',
    ...textFont,
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    color: '#6B7280',
    ...textFont,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    textAlign: 'center',
  },
});
