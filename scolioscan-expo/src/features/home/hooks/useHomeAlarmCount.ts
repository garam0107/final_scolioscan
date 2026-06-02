import { useCallback, useEffect, useState } from 'react';
import { alarmAPI } from '@/src/api/alarm';
import { isNetworkError } from '@/src/lib/apiError';

export function useHomeAlarmCount(
  userAlarmCount: number | undefined,
  setNetworkError: (value: boolean) => void,
) {
  const [alarmCount, setAlarmCount] = useState(userAlarmCount ?? 0);

  const loadAlarmCount = useCallback(async () => {
    try {
      const response = await alarmAPI.getUnreadCount();

      setAlarmCount(response.data.count);
    } catch (error) {
      if (isNetworkError(error)) {
        setNetworkError(true);
      }
    }
  }, [setNetworkError]);

  useEffect(() => {
    setAlarmCount(userAlarmCount ?? 0);
  }, [userAlarmCount]);

  return {
    alarmCount,
    loadAlarmCount,
  };
}
