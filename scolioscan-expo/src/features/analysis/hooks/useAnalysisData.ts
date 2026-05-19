import { useCallback, useEffect, useState } from 'react';

import { curvatureAPI } from '@/src/api/curvature';
import { measurementSetAPI } from '@/src/api/measurementSet';
import { rotationAPI } from '@/src/api/rotation';
import { useMeasurementRefreshStore } from '@/src/store/measurementRefreshStore';
import type { AnalysisResponse } from '@/src/types/analysis';
import {
  toAnalysisFromCurvature,
  toAnalysisFromMeasurementSet,
  toAnalysisFromRotation,
} from '../utils/analysisMappers';

type UseAnalysisDataParams = {
  analysisId?: string;
  sourceType?: string;
};

type UseAnalysisDataResult = {
  analysis: AnalysisResponse | null;
  loading: boolean;
  error: string | null;
  reloadAnalysisData: () => void;
};

export function useAnalysisData({
  analysisId,
  sourceType,
}: UseAnalysisDataParams): UseAnalysisDataResult {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

      try {
        let targetAnalysis: AnalysisResponse | null = null;

        if (analysisId) {
          // 상세 화면은 전달받은 id와 sourceType 기준으로 정확한 분석 한 건을 불러옵니다.
          if (sourceType === 'rotation') {
            const response = await rotationAPI.getAnalysis(analysisId);
            targetAnalysis = toAnalysisFromRotation(response.data);
          } else {
            const response = await curvatureAPI.getAnalysis(analysisId);
            targetAnalysis = toAnalysisFromCurvature(response.data);
          }
        } else {
          // 탭 화면은 최신 2D 결과를 기준으로 연결된 측정 세트를 찾아 보여줍니다.
          const response = await curvatureAPI.getAnalyses({ limit: 1 });
          const latestCurvature = response.data[0] ?? null;

          if (latestCurvature) {
            const measurementSetResponse = await measurementSetAPI.getByCurvature(latestCurvature.id);
            targetAnalysis = toAnalysisFromMeasurementSet(measurementSetResponse.data);
          }
        }

        if (!mounted) return;

        setAnalysis(targetAnalysis ?? null);
      } catch {
        if (!mounted) return;
        setAnalysis(null);
        setError('최신 분석 결과를 불러오지 못했어요.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadLatest();

    return () => {
      mounted = false;
    };
  }, [analysisId, measurementVersion, reloadKey, sourceType]);

  return {
    analysis,
    loading,
    error,
    reloadAnalysisData,
  };
}
