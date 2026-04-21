import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import './PasswordResetPage.css';

const PasswordResetPage = () => {
  const [formData, setFormData] = useState({
    user_id: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authAPI.passwordReset(formData);
      setSuccess(true);
    } catch (error) {
      setError(
        error.response?.data?.detail ||
        t('passwordReset.wrongInfo')
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="password-reset-page">
        <div className="password-reset-container">
          <div className="success-icon">✉️</div>
          <h1>{language === 'en' ? 'Email Sent' : '이메일 발송 완료'}</h1>
          <p className="success-message">
            {t('passwordReset.success')}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/login')}
          >
            {language === 'en' ? 'Back to Login' : '로그인으로 돌아가기'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="password-reset-page">
      <div className="password-reset-container">
        <div className="password-reset-header">
          <h1>{t('passwordReset.title')}</h1>
          <p>{language === 'en' ? 'Enter your registered email and name' : '가입 시 등록한 이메일과 이름을 입력해주세요'}</p>
        </div>

        <form className="password-reset-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>{t('passwordReset.email')}</label>
            <input
              type="email"
              name="user_id"
              className="input"
              placeholder={t('passwordReset.emailPlaceholder')}
              value={formData.user_id}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('passwordReset.name')}</label>
            <input
              type="text"
              name="name"
              className="input"
              placeholder={t('passwordReset.namePlaceholder')}
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary submit-btn"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('passwordReset.submit')}
          </button>
        </form>

        <div className="password-reset-footer">
          <Link to="/login" className="link">
            {language === 'en' ? 'Back to Login' : '로그인으로 돌아가기'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;
