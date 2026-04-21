import React, { useState } from 'react';
import Modal from './Modal';
import InputNormal from './InputNormal';
import Button from './Button';
import { authAPI } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * 비밀번호 찾기 모달 컴포넌트
 */
const PasswordResetModal = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    email: '',
    name: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleEmailChange = (value) => {
    setFormData(prev => ({ ...prev, email: value }));
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handleNameChange = (value) => {
    setFormData(prev => ({ ...prev, name: value }));
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const handleEmailClear = () => {
    setFormData(prev => ({ ...prev, email: '' }));
    setErrors(prev => ({ ...prev, email: '' }));
  };

  const handleNameClear = () => {
    setFormData(prev => ({ ...prev, name: '' }));
    setErrors(prev => ({ ...prev, name: '' }));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 입력 값 검증
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = t('passwordReset.emailRequired');
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('passwordReset.invalidEmail');
    }

    if (!formData.name.trim()) {
      newErrors.name = t('passwordReset.nameRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await authAPI.passwordReset({
        user_id: formData.email.trim(),
        name: formData.name.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ email: '', name: '' });
      }, 2000);
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      if (error.response?.status === 404) {
        setErrors({ email: t('passwordReset.wrongInfo') });
      } else {
        setErrors({ email: error.response?.data?.detail || t('passwordReset.wrongInfo') });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      // 모달 닫힐 때 폼 초기화
      setTimeout(() => {
        setFormData({ email: '', name: '' });
        setErrors({});
        setSuccess(false);
      }, 300);
    }
  };

  const isButtonDisabled = !formData.email.trim() || !formData.name.trim() || !validateEmail(formData.email) || loading;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('passwordReset.title')}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Content */}
        <div className="flex-1 flex flex-col gap-6 px-5 pt-0 pb-10">
          {/* Success Message */}
          {success && (
            <div className="bg-mint-25 rounded-lg px-3 py-2">
              <p className="text-13m text-primary-500">
                {t('passwordReset.success')}
              </p>
            </div>
          )}

          {/* Info Message */}
          {!success && (
            <div className="bg-mint-25 rounded-lg px-3 py-2">
              <p className="text-13m text-primary-500 leading-[18px] whitespace-pre-line">
                {t('passwordReset.info')}
              </p>
            </div>
          )}

          {/* Input Fields */}
          <div className="flex flex-col gap-2">
            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label className="text-15m text-gray-800">{t('passwordReset.email')}</label>
              <InputNormal
                type="email"
                value={formData.email}
                placeholder={t('passwordReset.emailPlaceholder')}
                errorMessage={errors.email}
                disabled={loading || success}
                onChange={handleEmailChange}
                onClear={handleEmailClear}
              />
            </div>

            {/* Name Input */}
            <div className="flex flex-col gap-2">
              <label className="text-15m text-gray-800">{t('passwordReset.name')}</label>
              <InputNormal
                type="text"
                value={formData.name}
                placeholder={t('passwordReset.namePlaceholder')}
                errorMessage={errors.name}
                disabled={loading || success}
                onChange={handleNameChange}
                onClear={handleNameClear}
              />
            </div>
          </div>
        </div>

        {/* Bottom Button */}
        <div className="px-4 pt-1 pb-4">
          <Button
            type="submit"
            variant="filled"
            color="primary"
            size="big"
            disabled={isButtonDisabled || success}
            loading={loading}
            className="w-full disabled:opacity-100"
          >
            {t('passwordReset.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PasswordResetModal;
