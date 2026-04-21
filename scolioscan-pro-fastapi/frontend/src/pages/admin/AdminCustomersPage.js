import React, { useState, useEffect } from 'react';
import { FiSearch, FiEdit2, FiTrash2, FiX, FiUser, FiMail, FiSend, FiLogIn } from 'react-icons/fi';
import { adminAPI } from '../../utils/api';
import AdminSidebar from '../../components/AdminSidebar';

const AdminCustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [emailConsent, setEmailConsent] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async (search = '') => {
    try {
      setLoading(true);
      const response = await adminAPI.getCustomers({ search });
      setCustomers(response.data || []);
    } catch (error) {
      console.error('고객 목록 조회 실패:', error);
      setMessage('고객 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadCustomers(searchTerm);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer({ ...customer });
    setShowEditModal(true);
  };

  const handleDelete = (customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await adminAPI.updateCustomer(selectedCustomer.id, {
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
        address: selectedCustomer.address,
        detail_address: selectedCustomer.detail_address,
        is_admin: selectedCustomer.is_admin,
      });
      setMessage('고객 정보가 수정되었습니다.');
      setShowEditModal(false);
      loadCustomers(searchTerm);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('고객 정보 수정 실패:', error);
      setMessage('고객 정보 수정에 실패했습니다.');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await adminAPI.deleteCustomer(selectedCustomer.id);
      setMessage('고객이 삭제되었습니다.');
      setShowDeleteModal(false);
      loadCustomers(searchTerm);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('고객 삭제 실패:', error);
      setMessage('고객 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const handleEmailClick = async (customer) => {
    setSelectedCustomer(customer);
    setEmailSubject('');
    setEmailContent('');
    setEmailConsent(null);

    try {
      const response = await adminAPI.checkEmailConsent(customer.id);
      setEmailConsent(response.data.email_consent);
    } catch (error) {
      console.error('이메일 수신 동의 확인 실패:', error);
      setEmailConsent(false);
    }

    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailContent) {
      setMessage('제목과 내용을 입력해주세요.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setSendingEmail(true);
      await adminAPI.sendEmail({
        customer_ids: [selectedCustomer.id],
        subject: emailSubject,
        content: emailContent,
      });
      setMessage('이메일이 발송되었습니다.');
      setShowEmailModal(false);
      setEmailSubject('');
      setEmailContent('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('이메일 발송 실패:', error);
      const errorMsg = error.response?.data?.detail || '이메일 발송에 실패했습니다.';
      setMessage(errorMsg);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleBulkEmailClick = () => {
    setEmailSubject('');
    setEmailContent('');
    setShowBulkEmailModal(true);
  };

  const handleLoginAs = async (customer) => {
    try {
      const response = await adminAPI.loginAsCustomer(customer.id);
      const token = response.data.access_token;
      const name = encodeURIComponent(customer.name);
      // 새 창에서 해당 사용자로 로그인 (관리자 세션 유지)
      window.open(`/impersonate?token=${token}&name=${name}`, '_blank');
      setMessage(`'${customer.name}' 계정으로 새 창이 열렸습니다.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('로그인 전환 실패:', error);
      setMessage('해당 사용자로 로그인하는데 실패했습니다.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSendBulkEmail = async () => {
    if (!emailSubject || !emailContent) {
      setMessage('제목과 내용을 입력해주세요.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setSendingEmail(true);
      const response = await adminAPI.sendBulkEmail({
        subject: emailSubject,
        content: emailContent,
      });
      setMessage(`${response.data.success_count}명에게 이메일이 발송되었습니다.`);
      setShowBulkEmailModal(false);
      setEmailSubject('');
      setEmailContent('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('이메일 발송 실패:', error);
      const errorMsg = error.response?.data?.detail || '이메일 발송에 실패했습니다.';
      setMessage(errorMsg);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="bg-[#f3f4f7] min-h-screen flex flex-col">
      {/* 헤더 */}
      <div className="bg-white box-border flex h-[68px] items-center justify-between px-4 md:px-8 relative shrink-0 w-full shadow-sm">
        <div className="flex items-center gap-3">
          <AdminSidebar />
          <div className="font-['Pretendard_Variable',sans-serif] font-semibold text-[18px] text-[#2b2f36]">
            고객 정보 관리
          </div>
        </div>
        <button
          onClick={handleBulkEmailClick}
          className="flex items-center gap-2 px-3 py-2 bg-[#22BCB7] text-white rounded-lg text-[14px] hover:bg-[#1fa89f] transition-colors"
        >
          <FiSend size={16} />
          <span className="hidden md:inline">전체 메일 발송</span>
        </button>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-8">
        {/* 메시지 */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-center text-[14px] ${
            message.includes('실패') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          }`}>
            {message}
          </div>
        )}

        {/* 검색 */}
        <div className="bg-white p-4 rounded-[16px] shadow-sm mb-4">
          <form onSubmit={handleSearch} className="flex gap-2 md:gap-3">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9ca3af]" size={20} />
              <input
                type="text"
                placeholder="이름 또는 이메일로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[44px] pl-10 pr-4 border border-[#d4d9e2] rounded-lg text-[14px] focus:outline-none focus:border-[#22BCB7]"
              />
            </div>
            <button
              type="submit"
              className="h-[44px] px-4 md:px-6 bg-[#22BCB7] text-white rounded-lg font-medium text-[14px] hover:bg-[#1fa89f] transition-colors"
            >
              검색
            </button>
          </form>
        </div>

        {/* 고객 목록 */}
        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-[#515968]">로딩 중...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-white rounded-[16px] shadow-sm flex flex-col items-center justify-center h-[200px]">
            <FiUser size={48} className="text-[#d4d9e2] mb-4" />
            <p className="text-[#515968]">고객이 없습니다.</p>
          </div>
        ) : (
          <>
            {/* PC 테이블 뷰 */}
            <div className="hidden md:block bg-white rounded-[16px] shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#f8f9fa] border-b border-[#edeff3]">
                  <tr>
                    <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#515968]">이름</th>
                    <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#515968]">이메일</th>
                    <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#515968]">전화번호</th>
                    <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#515968]">가입일</th>
                    <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#515968]">권한</th>
                    <th className="text-center px-6 py-4 text-[14px] font-semibold text-[#515968]">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-[#edeff3] last:border-b-0 hover:bg-[#f8f9fa]">
                      <td className="px-6 py-4 text-[14px] text-[#2b2f36] font-medium">{customer.name}</td>
                      <td className="px-6 py-4 text-[14px] text-[#515968]">{customer.user_id}</td>
                      <td className="px-6 py-4 text-[14px] text-[#515968]">{customer.phone || '-'}</td>
                      <td className="px-6 py-4 text-[14px] text-[#9ca3af]">{formatDate(customer.created_at)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[12px] ${
                          customer.is_admin ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {customer.is_admin ? '관리자' : '일반'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleLoginAs(customer)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] hover:bg-[#F59E0B]/20"
                            title="이 계정으로 로그인"
                          >
                            <FiLogIn size={16} />
                          </button>
                          <button
                            onClick={() => handleEmailClick(customer)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#22BCB7]/10 text-[#22BCB7] hover:bg-[#22BCB7]/20"
                            title="이메일 발송"
                          >
                            <FiMail size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(customer)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6]/20"
                            title="수정"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(customer)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                            title="삭제"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 모바일 카드 뷰 */}
            <div className="md:hidden flex flex-col gap-3">
              {customers.map((customer) => (
                <div key={customer.id} className="bg-white p-4 rounded-[12px] shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[16px] text-[#2b2f36] truncate">
                          {customer.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] shrink-0 ${
                          customer.is_admin ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {customer.is_admin ? '관리자' : '일반'}
                        </span>
                      </div>
                      <p className="text-[14px] text-[#515968] truncate">{customer.user_id}</p>
                      <p className="text-[13px] text-[#9ca3af] mt-1">{customer.phone || '-'}</p>
                      <p className="text-[12px] text-[#9ca3af] mt-1">가입일: {formatDate(customer.created_at)}</p>
                    </div>
                    <div className="flex gap-2 ml-3">
                      <button
                        onClick={() => handleLoginAs(customer)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]"
                      >
                        <FiLogIn size={18} />
                      </button>
                      <button
                        onClick={() => handleEmailClick(customer)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#22BCB7]/10 text-[#22BCB7]"
                      >
                        <FiMail size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(customer)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#3B82F6]/10 text-[#3B82F6]"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(customer)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-500"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 수정 모달 */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[16px] p-6 w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-[18px] text-[#2b2f36]">
                고객 정보 수정
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <FiX size={24} className="text-[#9ca3af]" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[14px] text-[#515968] mb-2">이름</label>
                <input
                  type="text"
                  value={selectedCustomer.name || ''}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })}
                  className="w-full h-[44px] px-4 border border-[#d4d9e2] rounded-lg text-[14px] focus:outline-none focus:border-[#22BCB7]"
                />
              </div>
              <div>
                <label className="block text-[14px] text-[#515968] mb-2">이메일</label>
                <input
                  type="email"
                  value={selectedCustomer.user_id || ''}
                  disabled
                  className="w-full h-[44px] px-4 border border-[#d4d9e2] rounded-lg text-[14px] bg-gray-50 text-[#9ca3af]"
                />
              </div>
              <div>
                <label className="block text-[14px] text-[#515968] mb-2">전화번호</label>
                <input
                  type="tel"
                  value={selectedCustomer.phone || ''}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, phone: e.target.value })}
                  className="w-full h-[44px] px-4 border border-[#d4d9e2] rounded-lg text-[14px] focus:outline-none focus:border-[#22BCB7]"
                />
              </div>
              <div>
                <label className="block text-[14px] text-[#515968] mb-2">주소</label>
                <input
                  type="text"
                  value={selectedCustomer.address || ''}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, address: e.target.value })}
                  className="w-full h-[44px] px-4 border border-[#d4d9e2] rounded-lg text-[14px] focus:outline-none focus:border-[#22BCB7]"
                />
              </div>
              <div>
                <label className="block text-[14px] text-[#515968] mb-2">상세주소</label>
                <input
                  type="text"
                  value={selectedCustomer.detail_address || ''}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, detail_address: e.target.value })}
                  className="w-full h-[44px] px-4 border border-[#d4d9e2] rounded-lg text-[14px] focus:outline-none focus:border-[#22BCB7]"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="is_admin"
                  checked={selectedCustomer.is_admin || false}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, is_admin: e.target.checked })}
                  className="w-5 h-5 rounded accent-[#22BCB7]"
                />
                <label htmlFor="is_admin" className="text-[14px] text-[#515968]">관리자 권한 부여</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 h-[44px] bg-[#f3f4f7] text-[#515968] rounded-lg font-medium text-[14px] hover:bg-[#e5e7eb]"
              >
                취소
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 h-[44px] bg-[#22BCB7] text-white rounded-lg font-medium text-[14px] hover:bg-[#1fa89f]"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[16px] p-6 w-full max-w-[360px]">
            <h3 className="font-semibold text-[18px] text-[#2b2f36] mb-3">
              고객 삭제
            </h3>
            <p className="text-[14px] text-[#515968] leading-[22px]">
              <span className="font-medium text-[#2b2f36]">'{selectedCustomer.name}'</span> 고객을 삭제하시겠습니까?<br />
              관련된 모든 분석 데이터도 함께 삭제됩니다.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 h-[44px] bg-[#f3f4f7] text-[#515968] rounded-lg font-medium text-[14px] hover:bg-[#e5e7eb]"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 h-[44px] bg-red-500 text-white rounded-lg font-medium text-[14px] hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개별 이메일 발송 모달 */}
      {showEmailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[16px] p-6 w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-[18px] text-[#2b2f36]">
                이메일 발송
              </h3>
              <button onClick={() => setShowEmailModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <FiX size={24} className="text-[#9ca3af]" />
              </button>
            </div>

            {/* 수신자 정보 */}
            <div className="bg-[#f8f9fa] p-4 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#22BCB7] rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedCustomer.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium text-[#2b2f36]">{selectedCustomer.name}</p>
                  <p className="text-[14px] text-[#515968]">{selectedCustomer.user_id}</p>
                </div>
              </div>
            </div>

            {/* 이메일 수신 동의 상태 */}
            {emailConsent === null ? (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-[14px] text-[#515968]">이메일 수신 동의 확인 중...</p>
              </div>
            ) : emailConsent === false ? (
              <div className="mb-4 p-3 bg-red-50 rounded-lg">
                <p className="text-[14px] text-red-600">이 사용자는 이메일 수신에 동의하지 않았습니다.</p>
              </div>
            ) : null}

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[14px] text-[#515968] mb-2">제목</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="이메일 제목을 입력하세요"
                  disabled={!emailConsent}
                  className="w-full h-[44px] px-4 border border-[#d4d9e2] rounded-lg text-[14px] focus:outline-none focus:border-[#22BCB7] disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-[14px] text-[#515968] mb-2">내용</label>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="이메일 내용을 입력하세요"
                  rows={6}
                  disabled={!emailConsent}
                  className="w-full px-4 py-3 border border-[#d4d9e2] rounded-lg text-[14px] focus:outline-none focus:border-[#22BCB7] resize-none disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 h-[44px] bg-[#f3f4f7] text-[#515968] rounded-lg font-medium text-[14px] hover:bg-[#e5e7eb]"
              >
                취소
              </button>
              <button
                onClick={handleSendEmail}
                disabled={!emailConsent || sendingEmail}
                className="flex-1 h-[44px] bg-[#22BCB7] text-white rounded-lg font-medium text-[14px] hover:bg-[#1fa89f] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingEmail ? (
                  '발송 중...'
                ) : (
                  <>
                    <FiSend size={16} />
                    발송
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 전체 이메일 발송 모달 */}
      {showBulkEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[16px] p-6 w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-[18px] text-[#2b2f36]">
                전체 이메일 발송
              </h3>
              <button onClick={() => setShowBulkEmailModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <FiX size={24} className="text-[#9ca3af]" />
              </button>
            </div>

            {/* 안내 메시지 */}
            <div className="bg-[#22BCB7]/10 p-4 rounded-lg mb-4">
              <p className="text-[14px] text-[#22BCB7]">
                이메일 수신에 동의한 모든 사용자에게 메일이 발송됩니다.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[14px] text-[#515968] mb-2">제목</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="이메일 제목을 입력하세요"
                  className="w-full h-[44px] px-4 border border-[#d4d9e2] rounded-lg text-[14px] focus:outline-none focus:border-[#22BCB7]"
                />
              </div>
              <div>
                <label className="block text-[14px] text-[#515968] mb-2">내용</label>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="이메일 내용을 입력하세요"
                  rows={6}
                  className="w-full px-4 py-3 border border-[#d4d9e2] rounded-lg text-[14px] focus:outline-none focus:border-[#22BCB7] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBulkEmailModal(false)}
                className="flex-1 h-[44px] bg-[#f3f4f7] text-[#515968] rounded-lg font-medium text-[14px] hover:bg-[#e5e7eb]"
              >
                취소
              </button>
              <button
                onClick={handleSendBulkEmail}
                disabled={sendingEmail}
                className="flex-1 h-[44px] bg-[#22BCB7] text-white rounded-lg font-medium text-[14px] hover:bg-[#1fa89f] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingEmail ? (
                  '발송 중...'
                ) : (
                  <>
                    <FiSend size={16} />
                    전체 발송
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomersPage;
