import { useCallback, useEffect, useState } from 'react';

import { measurementSetAPI } from '@/src/api/measurementSet';
import { subscribeAPI } from '@/src/api/subscribe';
import { isNetworkError } from '@/src/lib/apiError';
import { useMeasurementRefreshStore } from '@/src/store/measurementRefreshStore';
import type { AnalysisResponse } from '@/src/types/analysis';
import type { MeasurementSetResponse } from '@/src/types/measurementSet';
import {
  toAnalysisFromMeasurementSet,
} from '../utils/analysisMappers';

type UseAnalysisDataParams = {
  analysisId?: string;
};

type UseAnalysisDataResult = {
  analysis: AnalysisResponse | null;
  measurementSet: MeasurementSetResponse | null;
  hasActiveSubscription: boolean;
  loading: boolean;
  error: string | null;
  networkError: boolean;
  reloadAnalysisData: () => void;
};

export function useAnalysisData({
  analysisId,
}: UseAnalysisDataParams): UseAnalysisDataResult {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [measurementSet, setMeasurementSet] = useState<MeasurementSetResponse | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const measurementVersion = useMeasurementRefreshStore((state) => state.version);

  const reloadAnalysisData = useCallback(() => {
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadLatest() {
      // 상세 진입이면 해당 id를, 탭 진입이면 최신 2D 기준 측정 세트를 불러와 분석 모델로 변환합니다.
      setLoading(true);
      setError(null);
      // 재시도할 때 이전 네트워크 오류 화면이 남지 않도록 요청 직전에 초기화합니다.
      setNetworkError(false);

      try {
        let targetMeasurementSet: MeasurementSetResponse | null = null;

        const subscriptionRequest = subscribeAPI.getCurrent();

        if (analysisId) {
          // 상세 화면은 전달받은 만곡도 id로 연결된 측정 세트를 불러옵니다.
          // 상세 화면도 만곡도와 비틀림이 묶인 측정 세트를 기준으로 조회합니다.
          const [measurementSetResponse, subscriptionResponse] = await Promise.all([
            measurementSetAPI.getByCurvature(analysisId),
            subscriptionRequest,
          ]);
          targetMeasurementSet = measurementSetResponse.data;

          if (!mounted) return;
          setHasActiveSubscription(subscriptionResponse.data !== null);
        } else {
          // 탭 화면은 최신 2D 결과를 기준으로 연결된 측정 세트를 찾아 보여줍니다.
          // 분석 탭은 최신 측정 세트를 그대로 가져와 2D와 3D가 같은 원본 값을 쓰게 합니다.
          const [measurementSetResponse, subscriptionResponse] = await Promise.all([
            measurementSetAPI.getAnalyses({ limit: 1 }),
            subscriptionRequest,
          ]);
          targetMeasurementSet = measurementSetResponse.data[0] ?? null;

          if (!mounted) return;
          setHasActiveSubscription(subscriptionResponse.data !== null);
        }

        if (!mounted) return;

        const targetAnalysis = targetMeasurementSet
          ? toAnalysisFromMeasurementSet(targetMeasurementSet)
          : null;

        setMeasurementSet(targetMeasurementSet);
        setAnalysis(targetAnalysis ?? null);
      } catch (loadError) {
        if (!mounted) return;
        setMeasurementSet(null);
        setAnalysis(null);
        setHasActiveSubscription(false);
        if (isNetworkError(loadError)) {
          setNetworkError(true);
        }
        setError('최신 분석 결과를 불러오지 못했어요.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadLatest();

    return () => {
      mounted = false;
    };
  }, [analysisId, measurementVersion, reloadKey]);

  return {
    analysis,
    measurementSet,
    hasActiveSubscription,
    loading,
    error,
    networkError,
    reloadAnalysisData,
  };
}
