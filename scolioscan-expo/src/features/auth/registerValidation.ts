export function isValidEmail(email: string) {
  // 가입 단계에서 서버 요청 전에 기본 이메일 형식만 먼저 거른다.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function hasPasswordLength(password: string) {
  // 비밀번호 최소 길이 조건을 UI 체크리스트와 동일하게 맞춘다.
  return password.trim().length >= 8;
}

export function hasPasswordMix(password: string) {
  // 영문, 숫자, 특수문자가 모두 포함되어야 가입을 진행한다.
  return /[A-Za-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

function isDigits(value: string) {
  return /^\d+$/.test(value);
}

export function normalizePhoneNumber(phone: string) {
  // 저장과 검증은 하이픈 없는 숫자만 사용한다.
  return phone.replace(/\D/g, '');
}

export function formatPhoneNumber(phone: string) {
  // 입력 중인 휴대폰 번호를 화면 표시용 하이픈 형식으로 바꾼다.
  const digits = normalizePhoneNumber(phone).slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function isValidPhoneNumber(phone: string) {
  const normalizedPhone = normalizePhoneNumber(phone);
  // 010은 8자리, 나머지 01X는 7~8자리
  if (normalizedPhone.startsWith('010')) {
    return /^010\d{8}$/.test(normalizedPhone);
  }
  return /^01[16789]\d{7,8}$/.test(normalizedPhone);
}

export function isValidBirthday(year: string, month: string, day: string) {
  // 실제 존재하는 날짜인지까지 확인해 잘못된 생년월일 저장을 막는다.
  if (!year || !month || !day) {
    return false;
  }

  if (!isDigits(year) || !isDigits(month) || !isDigits(day)) {
    return false;
  }

  if (year.length !== 4 || month.length > 2 || day.length > 2) {
    return false;
  }

  const parsedYear = Number(year);
  const parsedMonth = Number(month);
  const parsedDay = Number(day);

  if (parsedYear < 1900 || parsedYear > new Date().getFullYear()) {
    return false;
  }

  const birthday = new Date(parsedYear, parsedMonth - 1, parsedDay);
  return (
    birthday.getFullYear() === parsedYear &&
    birthday.getMonth() === parsedMonth - 1 &&
    birthday.getDate() === parsedDay
  );
}
export function isPhoneNumberComplete(phone: string) {
  return normalizePhoneNumber(phone).length >= 11;
}
export function formatBirthdayIso(year: string, month: string, day: string) {
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`;
}

export function normalizeRegisterMessage(message: string) {
  if (message.includes('Email already registered')) {
    return '이미 가입된 이메일입니다.';
  }

  if (message.includes('Phone verification is required')) {
    return '휴대전화 인증에 실패하였습니다.';
  }

  return message;
}
