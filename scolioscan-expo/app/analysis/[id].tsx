import { useLocalSearchParams } from 'expo-router';
import AnalysisScreen from '@/src/features/analysis/AnalysisScreen';

export default function AnalysisDetailPage() {
  const { id, source } = useLocalSearchParams<{
    id?: string | string[];
    source?: string | string[];
  }>();
  const analysisId = Array.isArray(id) ? id[0] : id;
  const sourceType = Array.isArray(source) ? source[0] : source;

  return <AnalysisScreen analysisId={analysisId} sourceType={sourceType} />;
}
