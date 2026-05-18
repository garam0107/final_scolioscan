import { useRouter } from 'expo-router';
import MeasurementGuideStepScreen from '@/src/features/measurementGuide/shared/MeasurementGuideStepScreen';

export default function MeasurementGuide3DCameraScreen() {
  const router = useRouter();

  return (
    <MeasurementGuideStepScreen
      title="3D 카메라 촬영 방법"
      description="화면 속 가이드라인에 맞춰 영상을 촬영해주세요."
      nextLabel="다음"
      onBack={() => router.back()}
      onNext={() => undefined}
    />
  );
}
