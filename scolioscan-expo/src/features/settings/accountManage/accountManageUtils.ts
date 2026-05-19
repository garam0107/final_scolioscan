import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

const DEVICE_MODEL_NAMES: Record<string, string> = {
  'SM-G981N': 'Galaxy S20 5G',
  'SM-G986N': 'Galaxy S20+ 5G',
  'SM-G988N': 'Galaxy S20 Ultra 5G',
  'SM-G991N': 'Galaxy S21 5G',
  'SM-G996N': 'Galaxy S21+ 5G',
  'SM-G998N': 'Galaxy S21 Ultra 5G',
  'SM-S901N': 'Galaxy S22',
  'SM-S906N': 'Galaxy S22+',
  'SM-S908N': 'Galaxy S22 Ultra',
  'SM-S911N': 'Galaxy S23',
  'SM-S916N': 'Galaxy S23+',
  'SM-S918N': 'Galaxy S23 Ultra',
  'SM-S921N': 'Galaxy S24',
  'SM-S926N': 'Galaxy S24+',
  'SM-S928N': 'Galaxy S24 Ultra',
  'SM-S931N': 'Galaxy S25',
  'SM-S936N': 'Galaxy S25+',
  'SM-S938N': 'Galaxy S25 Ultra',
};

export function splitBirthday(birthday?: string) {
  // 서버 생년월일 문자열을 입력칸 세 개에서 쓰기 쉬운 값으로 나눈다.
  if (!birthday) {
    return { year: '', month: '', day: '' };
  }

  const datePart = birthday.split(/[T ]/)[0];
  const [year, month, day] = datePart.split(/[-/.]/);

  return {
    year: year || '',
    month: month?.padStart(2, '0') || '',
    day: day?.padStart(2, '0') || '',
  };
}

export function normalizeBirthdayInput(value: string, maxLength: number) {
  // 생년월일 입력은 숫자만 남기고 각 칸의 최대 길이를 제한한다.
  return value.replace(/\D/g, '').slice(0, maxLength);
}

export function normalizeApiError(error: unknown) {
  // API 응답과 일반 오류를 토스트에 보여줄 수 있는 한 줄 메시지로 정리한다.
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    const detail = response?.data?.detail;

    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return '요청 처리 중 오류가 발생했습니다.';
}

export function getCurrentDeviceLabel() {
  // 기기 모델 코드가 그대로 보이지 않도록 가능한 경우 사용자 친화적인 모델명으로 바꾼다.
  const modelName = Device.modelName?.trim();
  const modelId = Device.modelId?.trim();
  const deviceName = Device.deviceName?.trim();
  const manufacturer = Device.manufacturer;
  const mappedModelName = DEVICE_MODEL_NAMES[modelName || ''] || DEVICE_MODEL_NAMES[modelId || ''];

  if (mappedModelName) return mappedModelName;
  if (modelName && !/^SM-[A-Z0-9]+$/i.test(modelName)) return modelName;
  if (deviceName && !/^SM-[A-Z0-9]+$/i.test(deviceName)) return deviceName;
  if (manufacturer && modelName && !modelName.toLowerCase().includes(manufacturer.toLowerCase())) {
    return `${manufacturer} ${modelName}`;
  }
  if (modelName) return modelName;
  if (Platform.OS === 'ios') return 'iPhone';
  if (Platform.OS === 'android') return 'Android 기기';
  return '현재 기기';
}

function normalizeRegionName(regionName: string) {
  const regionAliases: Record<string, string> = {
    서울특별시: '서울',
    부산광역시: '부산',
    대구광역시: '대구',
    인천광역시: '인천',
    광주광역시: '광주',
    대전광역시: '대전',
    울산광역시: '울산',
    세종특별자치시: '세종',
    경기도: '경기',
    강원도: '강원',
    강원특별자치도: '강원',
    충청북도: '충북',
    충청남도: '충남',
    전라북도: '전북',
    전북특별자치도: '전북',
    전라남도: '전남',
    경상북도: '경북',
    경상남도: '경남',
    제주특별자치도: '제주',
  };

  return regionAliases[regionName] || regionName.replace(/특별자치시|특별자치도|특별시|광역시|도|시$/g, '');
}

export function formatLocationAddress(address?: Location.LocationGeocodedAddress) {
  // 위치 권한이 허용된 경우 설정 화면에 시도 단위의 짧은 위치만 표시한다.
  if (!address) {
    return '위치 확인 완료';
  }

  const regionName = address.city || address.region || address.country;

  return regionName ? normalizeRegionName(regionName) : '위치 확인 완료';
}
