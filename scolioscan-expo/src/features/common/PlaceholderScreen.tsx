import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import BottomTabBar from '@/src/components/BottomTabBar';
import PrimaryButton from '@/src/components/ui/PrimaryButton';

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
          title="홈으로 돌아가기"
          onPress={() => router.replace('/home')}
          style={{ marginTop: 22 }}
        />
      </View>
      <BottomTabBar />
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
    fontFamily: 'PretendardVariable',
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    color: '#6B7280',
    fontFamily: 'PretendardVariable',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    textAlign: 'center',
  },
});
