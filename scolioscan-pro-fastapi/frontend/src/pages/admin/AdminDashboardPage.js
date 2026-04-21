import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiActivity } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from '../../components/AdminSidebar';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    {
      title: '고객 정보 관리',
      description: '고객 정보 조회, 수정, 삭제',
      icon: FiUsers,
      path: '/adm/customers',
      color: '#3B82F6',
    },
    {
      title: '분석 결과 관리',
      description: '분석 결과 조회, 추가, 삭제',
      icon: FiActivity,
      path: '/adm/analysis',
      color: '#8B5CF6',
    },
  ];

  return (
    <div className="bg-[#f3f4f7] min-h-screen flex flex-col">
      {/* 헤더 */}
      <div className="bg-white box-border flex h-[68px] items-center justify-between px-4 md:px-8 relative shrink-0 w-full shadow-sm">
        <div className="flex items-center gap-3">
          <AdminSidebar />
          <div className="font-['Pretendard_Variable',sans-serif] font-semibold text-[18px] md:text-[20px] text-[#2b2f36]">
            관리자 대시보드
          </div>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-8">
        {/* 관리자 정보 */}
        <div className="bg-white p-4 md:p-6 rounded-[16px] shadow-sm mb-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-[#22BCB7] rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-[18px] md:text-[20px]">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div>
              <p className="font-['Pretendard_Variable',sans-serif] font-semibold text-[16px] md:text-[18px] text-[#2b2f36]">
                {user?.name || '관리자'}
              </p>
              <p className="font-['Pretendard_Variable',sans-serif] font-normal text-[14px] text-[#515968]">
                {user?.user_id || 'admin@example.com'}
              </p>
            </div>
            <div className="ml-auto">
              <span className="bg-[#22BCB7]/10 text-[#22BCB7] px-3 py-1 rounded-full text-[13px] font-medium">
                관리자
              </span>
            </div>
          </div>
        </div>

        {/* 메뉴 카드들 - PC에서는 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="bg-white p-5 md:p-6 rounded-[16px] shadow-sm flex items-center gap-4 w-full text-left hover:shadow-md transition-all hover:scale-[1.02]"
            >
              <div
                className="w-14 h-14 md:w-16 md:h-16 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <item.icon size={28} style={{ color: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-['Pretendard_Variable',sans-serif] font-semibold text-[16px] md:text-[18px] text-[#2b2f36]">
                  {item.title}
                </p>
                <p className="font-['Pretendard_Variable',sans-serif] font-normal text-[14px] text-[#515968] mt-1">
                  {item.description}
                </p>
              </div>
              <div className="text-[#d4d9e2] shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
