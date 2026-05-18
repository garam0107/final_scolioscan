import { useState } from 'react';
import { useRouter } from 'expo-router';
import MeasurementGuideStepScreen from '@/src/features/measurementGuide/shared/MeasurementGuideStepScreen';

const guidePages = [
  {
    title: '척추측만계 이용 방법',
    description: '파란 반원 (가로 모드) / 흰 원 (평면 모드) 을 척추에 대어주세요.',
    buttonLabel: '다음',
  },
  {
    title: '척추측만계 이용 방법',
    description: '척추에 휴대전화를 댄 채로 등 각도를 재어주세요.',
    buttonLabel: '다음',
  },
  {
    title: '척추측만계 이용 방법',
    description: '각도가 가장 큰 곳을 위에서부터 최대 3곳까지 측정해주세요.',
    buttonLabel: '다음',
  },
  {
    title: '척추측만계 이용 방법',
    description: '촬영이 끝나면, ScolioScan이 알아서 분석하고 결과를 알려드릴게요!',
    subDescription:
      '의료 관련 안내\n본 서비스는 의료행위 또는 의료기기가 아니며,\n진단, 치료 또는 예방을 목적으로 하지 않습니다.\n제공되는 정보는 참고용이며,\n건강 관련 판단은 반드시 의료 전문가와 상담하시기 바랍니다.',
    buttonLabel: '시작하기',
  },
];


export default function MeasurementGuideSpineScreen() {
  const router = useRouter();
  const [pageIndex, setPageIndex] = useState(0);
  const currentPage = guidePages[pageIndex];
  
    function handleBack() {
    if (pageIndex > 0) {
      setPageIndex((value) => value - 1);
      return;
    }

    router.back();
  }

  function handleNext() {
    // 마지막 페이지 전까지는 같은 라우트 안에서 다음 안내 페이지로만 전환한다.
    if (pageIndex < guidePages.length - 1) {
      setPageIndex((value) => value + 1);
      return;
    }

    router.back();
  }
  return (
    <MeasurementGuideStepScreen
      title={currentPage.title}
      description={currentPage.description}
      subDescription={currentPage.subDescription}
      nextLabel={currentPage.buttonLabel}
      onBack={handleBack}
      onNext={handleNext}
    />
  );
}
