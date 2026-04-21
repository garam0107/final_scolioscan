import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './RegisterPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    user_id: '',
    user_pw: '',
    confirmPassword: '',
    name: '',
    phone: '',
    birthday: '',
    sex: true, // true: Male, false: Female
    ssn_first: '', // 주민번호 앞 6자리
    ssn_second: '', // 주민번호 뒤 1자리
    address: '',
    detail_address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
  };

  const handleAddressSearch = () => {
    new window.daum.Postcode({
      oncomplete: function(data) {
        setFormData(prev => ({
          ...prev,
          address: data.roadAddress || data.jibunAddress
        }));
      }
    }).open();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 유효성 검증
    if (formData.user_pw !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.user_pw.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (formData.user_pw.length > 128) {
      setError('비밀번호는 128자 이하여야 합니다.');
      return;
    }

    if (formData.ssn_first.length !== 6 || formData.ssn_second.length !== 1) {
      setError('주민번호를 올바르게 입력해주세요.');
      return;
    }

    // 주민번호로 생년월일 계산
    const year = parseInt(formData.ssn_first.substring(0, 2));
    const month = parseInt(formData.ssn_first.substring(2, 4));
    const day = parseInt(formData.ssn_first.substring(4, 6));
    const genderCode = parseInt(formData.ssn_second);

    // 세기 판단 (1,2: 1900년대, 3,4: 2000년대)
    const century = (genderCode === 1 || genderCode === 2) ? 1900 : 2000;
    const fullYear = century + year;

    // 성별 판단 (1,3: 남성, 2,4: 여성)
    const sex = (genderCode === 1 || genderCode === 3);

    const birthday = new Date(fullYear, month - 1, day);

    setLoading(true);

    try {
      await register({
        user_id: formData.user_id,
        user_pw: formData.user_pw,
        name: formData.name,
        phone: formData.phone,
        birthday: birthday.toISOString(),
        sex: sex,
        address: formData.address,
        detail_address: formData.detail_address || null
      });

      alert('회원가입이 완료되었습니다. 로그인해주세요.');
      navigate('/login');
    } catch (error) {
      setError(error.response?.data?.detail || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>회원가입</h1>
          <p>Scolioscan에 오신 것을 환영합니다</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>이메일 *</label>
            <input
              type="email"
              name="user_id"
              className="input"
              placeholder="email@example.com"
              value={formData.user_id}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>비밀번호 *</label>
            <input
              type="password"
              name="user_pw"
              className="input"
              placeholder="8자 이상 입력하세요"
              value={formData.user_pw}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>비밀번호 확인 *</label>
            <input
              type="password"
              name="confirmPassword"
              className="input"
              placeholder="비밀번호를 다시 입력하세요"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>이름 *</label>
            <input
              type="text"
              name="name"
              className="input"
              placeholder="이름을 입력하세요"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>연락처 *</label>
            <input
              type="tel"
              name="phone"
              className="input"
              placeholder="010-0000-0000"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>주민번호 *</label>
            <div className="ssn-input-group">
              <input
                type="text"
                name="ssn_first"
                className="input ssn-input"
                placeholder="000000"
                maxLength="6"
                value={formData.ssn_first}
                onChange={handleChange}
                required
              />
              <span className="ssn-separator">-</span>
              <input
                type="text"
                name="ssn_second"
                className="input ssn-input-short"
                placeholder="0"
                maxLength="1"
                value={formData.ssn_second}
                onChange={handleChange}
                required
              />
              <span className="ssn-mask">● ● ● ● ● ●</span>
            </div>
          </div>

          <div className="form-group">
            <label>주소 *</label>
            <div className="address-input-group">
              <input
                type="text"
                name="address"
                className="input"
                placeholder="주소 검색 버튼을 클릭하세요"
                value={formData.address}
                readOnly
                required
              />
              <button
                type="button"
                className="btn btn-secondary address-btn"
                onClick={handleAddressSearch}
              >
                주소 검색
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>상세 주소</label>
            <input
              type="text"
              name="detail_address"
              className="input"
              placeholder="상세 주소를 입력하세요"
              value={formData.detail_address}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary register-btn"
            disabled={loading}
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <div className="register-footer">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="link">
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
