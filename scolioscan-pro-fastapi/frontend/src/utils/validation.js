/**
 * 이메일 유효성 검증
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 비밀번호 유효성 검증
 */
export const validatePassword = (password) => {
  const hasLetterNumberSpecial = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
  const minLength = password.length >= 8;
  
  return {
    isValid: hasLetterNumberSpecial && minLength,
    hasLetterNumberSpecial,
    minLength,
  };
};

/**
 * 비밀번호 유효성 검증 상세 (체크리스트용)
 */
export const validatePasswordDetail = (password) => {
  return {
    hasLetterNumberSpecial: /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password),
    minLength: password.length >= 8,
  };
};

