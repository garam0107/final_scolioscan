import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const ImpersonatePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const name = searchParams.get('name');

    if (token) {
      // sessionStorage에 토큰 저장 (탭별로 분리됨)
      sessionStorage.setItem('access_token', token);
      if (name) {
        sessionStorage.setItem('impersonate_name', name);
      }
      // 홈으로 리다이렉트
      window.location.href = '/home';
    } else {
      // 토큰이 없으면 로그인 페이지로
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#22BCB7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 중...</p>
      </div>
    </div>
  );
};

export default ImpersonatePage;
