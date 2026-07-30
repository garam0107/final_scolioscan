import { i18n } from '@/src/i18n';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMeasurementGuideStore } from '@/src/store/measurementGuideStore';
import MeasurementGuideStepScreen from '@/src/features/measurementGuide/shared/MeasurementGuideStepScreen';
import TwoDguideFirstPageLottie from '../../../../assets/lottie/2dGuide_firstPage.json';
import TwoDguideSecondPageLottie from '../../../../assets/lottie/2dGuide_secondPage.json';


const guidePages = [
  {
    title: '카메라로 측정 이용 방법',
    description: '화면 속 가이드라인에 맞춰 등을 찍어주세요.',
    buttonLabel: '다음',
    lottieSource : TwoDguideFirstPageLottie,
  },
  {
    title: '카메라로 측정 이용 방법',
    description: '자동 촬영을 지원하지만, 수동 촬영도 가능해요.',
    subDescription:
    '의료 관련 안내\n본 서비스는 의료행위 또는 의료기기가 아니며,\n진단, 치료 또는 예방을 목적으로 하지 않습니다.\n제공되는 정보는 참고용이며,\n건강 관련 판단은 반드시 의료 전문가와 상담하시기 바랍니다.',
    buttonLabel: '시작하기',
    lottieSource: TwoDguideSecondPageLottie
  },

];

export default function MeasurementGuide2DCameraScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [pageIndex, setPageIndex] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState<1 | -1>(1);
  const currentPage = guidePages[pageIndex];
  const completeTwoDGuide = useMeasurementGuideStore((state) => state.completeTwoDGuide);
  const isReplayMode = mode === 'replay';
  function handleBack() {
    if (pageIndex > 0) {
      setTransitionDirection(-1);
      setPageIndex((value) => value - 1);
      return;
    }

    router.back();
  }

 function handleNext() {
  if (pageIndex < guidePages.length - 1) {
    setTransitionDirection(1);
    setPageIndex((value) => value + 1);
    return;
  }

  if (isReplayMode) {
    router.back();
    return;
  }

  // 최초 가이드 완료 후에는 카메라 측정 화면으로 바로 이동한다.
  completeTwoDGuide();
  router.replace('/measure/2d');
}

  return (
    <MeasurementGuideStepScreen
      pageKey={pageIndex}
      transitionDirection={transitionDirection}
      title={currentPage.title}
      description={currentPage.description}
      subDescription={currentPage.subDescription}
      lottieSource={currentPage.lottieSource}
      nextLabel={pageIndex === guidePages.length - 1 && isReplayMode ? i18n.t("닫기") : currentPage.buttonLabel}
      onBack={handleBack}
      onNext={handleNext}
    />
  );
}
