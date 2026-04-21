import { useLocalSearchParams } from 'expo-router';
import AnalysisScreen from '@/src/features/analysis/AnalysisScreen';

export default function AnalysisDetailPage() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const analysisId = Array.isArray(id) ? id[0] : id;

  return <AnalysisScreen analysisId={analysisId} />;
}
