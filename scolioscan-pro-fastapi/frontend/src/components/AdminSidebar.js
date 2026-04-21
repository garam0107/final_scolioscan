import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiUsers, FiActivity, FiHome, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      title: '대시보드',
      icon: FiHome,
      path: '/adm',
    },
    {
      title: '고객 정보 관리',
      icon: FiUsers,
      path: '/adm/customers',
    },
    {
      title: '분석 결과 관리',
      icon: FiActivity,
      path: '/adm/analysis',
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/adm') {
      return location.pathname === '/adm';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* 햄버거 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="메뉴 열기"
      >
        <FiMenu size={24} className="text-[#2b2f36]" />
      </button>

      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 사이드바 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <span className="font-['Pretendard_Variable',sans-serif] font-semibold text-[18px] text-[#2b2f36]">
            관리자 메뉴
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="메뉴 닫기"
          >
            <FiX size={24} className="text-[#515968]" />
          </button>
        </div>

        {/* 메뉴 목록 */}
        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {menuItems.map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-[#22BCB7]/10 text-[#22BCB7]'
                      : 'text-[#515968] hover:bg-gray-100'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-['Pretendard_Variable',sans-serif] font-medium text-[15px]">
                    {item.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* 로그아웃 버튼 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#515968] hover:bg-gray-100 transition-colors"
          >
            <FiLogOut size={20} />
            <span className="font-['Pretendard_Variable',sans-serif] font-medium text-[15px]">
              로그아웃
            </span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
