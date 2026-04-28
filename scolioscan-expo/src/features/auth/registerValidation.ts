export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function hasPasswordLength(password: string) {
  return password.trim().length >= 8;
}

export function hasPasswordMix(password: string) {
  return /[A-Za-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

function isDigits(value: string) {
  return /^\d+$/.test(value);
}

export function normalizePhoneNumber(phone: string) {
  return phone.replace(/\D/g, '');
}

export function formatPhoneNumber(phone: string) {
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
  return /^01[016789]\d{7,8}$/.test(normalizedPhone);
}

export function isValidBirthday(year: string, month: string, day: string) {
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

export function formatBirthdayIso(year: string, month: string, day: string) {
  return new Date(Number(year), Number(month) - 1, Number(day)).toISOString();
}

export function normalizeRegisterMessage(message: string) {
  if (message.includes('Email already registered')) {
    return '이미 가입된 이메일입니다.';
  }

  return message;
}
