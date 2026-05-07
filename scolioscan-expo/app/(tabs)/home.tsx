import TabFocusTransition from '@/src/components/navigation/TabFocusTransition';
import HomeScreen from '@/src/features/home/HomeScreen';

export default function HomePage() {
  return (
    <TabFocusTransition>
      <HomeScreen />
    </TabFocusTransition>
  );
}
