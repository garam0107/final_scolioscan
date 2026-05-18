import { useRouter } from 'expo-router';
import MeasurementGuideStepScreen from '@/src/features/measurementGuide/shared/MeasurementGuideStepScreen';

export default function MeasurementGuideSpineScreen() {
  const router = useRouter();

  return (
    <MeasurementGuideStepScreen
      title="척추측만계 측정 방법"
      description="안내에 맞춰 척추측만계 측정을 준비해주세요."
      nextLabel="다음"
      onBack={() => router.back()}
      onNext={() => undefined}
    />
  );
}
