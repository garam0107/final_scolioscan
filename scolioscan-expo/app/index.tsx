import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function IndexPage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();
    useEffect(() => {
    if (loading) return;

    router.replace(isAuthenticated ? '/home' : '/login');
  }, [loading, isAuthenticated, router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.brand}>ScolioScan</Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#22BCB7',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    color: '#F5F7FB',
    fontFamily: 'MuseoModerno_700Bold',
    fontSize: 28,
    marginBottom: 16,
  },

});
