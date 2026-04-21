import React, { createContext, useContext, useState, useEffect } from 'react';

const SignupContext = createContext(null);

const SIGNUP_DATA_KEY = 'signup_data';

export const SignupProvider = ({ children }) => {
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    name: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    gender: '', // 'male' or 'female'
  });

  // localStorage에서 데이터 복원
  useEffect(() => {
    const savedData = localStorage.getItem(SIGNUP_DATA_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setSignupData(parsed);
      } catch (error) {
        console.error('Failed to parse signup data:', error);
      }
    }
  }, []);

  const updateSignupData = (data) => {
    const newData = { ...signupData, ...data };
    setSignupData(newData);
    // 비밀번호는 보안상 localStorage에 저장하지 않음
    const dataToSave = { ...newData };
    if (dataToSave.password) {
      delete dataToSave.password;
    }
    localStorage.setItem(SIGNUP_DATA_KEY, JSON.stringify(dataToSave));
  };

  const clearSignupData = () => {
    setSignupData({
      email: '',
      password: '',
      name: '',
      birthYear: '',
      birthMonth: '',
      birthDay: '',
      gender: '',
    });
    localStorage.removeItem(SIGNUP_DATA_KEY);
  };

  return (
    <SignupContext.Provider
      value={{
        signupData,
        updateSignupData,
        clearSignupData,
      }}
    >
      {children}
    </SignupContext.Provider>
  );
};

export const useSignup = () => {
  const context = useContext(SignupContext);
  if (!context) {
    throw new Error('useSignup must be used within a SignupProvider');
  }
  return context;
};

