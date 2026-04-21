import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiTrash2, FiEye, FiX, FiActivity } from 'react-icons/fi';
import { adminAPI } from '../../utils/api';
import AdminSidebar from '../../components/AdminSidebar';

const AdminAnalysisPage = () => {
  const [analyses, setAnalyses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [message, setMessage] = useState('');

  // 분석 타입 목록
  const analysisTypes = [
    { id: 1, name: '2D 이미지' },
    { id: 2, name: '3D 동영상' },
    { id: 3, name: '척추측만계' },
  ];

  const [newAnalysis, setNewAnalysis] = useState({
    user_uuid: '',
    analysis_type: 1,
    main_thoracic: 0,
    second_thoracic: 0,
    lumbar: 0,
    score: 85,
  });

  // 심각도 계산 (점수 기반)
  const getSeverity = (score) => {
    if (score >= 80) return { label: '정상', color: 'bg-green-100 text-green-600' };
    if (score >= 60) return { label: '경미', color: 'bg-yellow-100 text-yellow-600' };
    if (score >= 40) return { label: '중등도', color: 'bg-orange-100 text-orange-600' };
    return { label: '심각', color: 'bg-red-100 text-red-600' };
  };

  // 분석 타입 이름 가져오기
  const getAnalysisTypeName = (typeId) => {
    const type = analysisTypes.find(t => t.id === typeId);
    return type ? type.name : '-';
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (search = '') => {
    try {
      setLoading(true);
      const [analysisRes, customersRes] = await Promise.all([
        adminAPI.getAnalyses({ search }),
        adminAPI.getCustomers({})
      ]);
      setAnalyses(analysisRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      setMessage('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadData(searchTerm);
  };

  const handleViewDetail = (analysis) => {
    setSelectedAnalysis(analysis);
    setShowDetailModal(true);
  };

  const handleDelete = (analysis) => {
    setSelectedAnalysis(analysis);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await adminAPI.deleteAnalysis(selectedAnalysis.id);
      setMessage('분석 결과가 삭제되었습니다.');
      setShowDeleteModal(false);
      loadData(searchTerm);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('분석 결과 삭제 실패:', error);
      setMessage('분석 결과 삭제에 실패했습니다.');
    }
  };

  const handleAddAnalysis = async () => {
    if (!newAnalysis.user_uuid) {
      setMessage('고객을 선택해주세요.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await adminAPI.createAnalysis(newAnalysis);
      setMessage('분석 결과가 추가되었습니다.');
      setShowAddModal(false);
      setNewAnalysis({
        user_uuid: '',
        analysis_type: 1,
        main_thoracic: 0,
        second_thoracic: 0,
        lumbar: 0,
        score: 85,
      });
      loadData(searchTerm);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('분석 결과 추가 실패:', error);
      setMessage('분석 결과 추가에 실패했습니다.');
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const filteredAnalyses = analyses.filter(analysis =>
    analysis.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analysis.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-[#f3f4f7] min-h-screen flex flex-col">
      {/* 헤더 */}
      <div className="bg-white box-border flex h-[68px] items-center justify-between px-4 md:px-8 relative shrink-0 w-full shadow-sm">
        <div className="flex items-center gap-3">
          <AdminSidebar />
          <div className="font-['Pretendard_Variable',sans-serif] font-semibold text-[18px] text-[#2b2f36]">
            분석 결과 관리
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[#22BCB7] text-white rounded-lg text-[14px] hover:bg-[#1fa89f] transition-colors"
        >
          <FiPlus size={16} />
          <span className="hidden md:inline">분석 추가</span>
        </button>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:p-8">
        {/* 메시지 */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-center text-[14px] ${
            message.includes('실패') || message.includes('선택') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
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
                placeholder="고객 이름으로 검색"
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

        {/* 분석 결과 목록 */}
        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-[#515968]">로딩 중...</p>
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="bg-white rounded-[16px] shadow-sm flex flex-col items-center justify-center h-[200px]">
            <FiActivity size={48} className="text-[#d4d9e2] mb-4" />
            <p className="text-[#515968]">분석 결과가 없습니다.</p>
          </div>
        ) : (
          <>
            {/* PC 테이블 뷰 */}
            <div className="hidden md:block bg-white rounded-[16px] shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#f8f9fa] border-b border-[#edeff3]">
                  <tr>
                    <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#515968]">고객명</th>
                    <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#515968]">이메일</th>
                    <th className="text-center px-6 py-4 text-[14px] font-semibold text-[#515968]">분석타입</th>
                    <th className="text-center px-6 py-4 text-[14px] font-semibold text-[#515968]">점수</th>
                    <th className="text-center px-6 py-4 text-[14px] font-semibold text-[#515968]">상태</th>
                    <th className="text-left px-6 py-4 text-[14px] font-semibold text-[#515968]">분석일시</th>
                    <th className="text-center px-6 py-4 text-[14px] font-semibold text-[#515968]">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnalyses.map((analysis) => {
                    const severity = getSeverity(analysis.score || 0);
                    return (
                      <tr key={analysis.id} className="border-b border-[#edeff3] last:border-b-0 hover:bg-[#f8f9fa]">
                        <td className="px-6 py-4 text-[14px] text-[#2b2f36] font-medium">{analysis.user_name}</td>
                        <td className="px-6 py-4 text-[14px] text-[#515968]">{analysis.user_email}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-1 rounded-full text-[12px] bg-blue-50 text-blue-600">
                            {getAnalysisTypeName(analysis.analysis_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[16px] font-semibold text-[#22BCB7]">{analysis.score || 0}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-[12px] ${severity.color}`}>
                            {severity.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#9ca3af]">{formatDateTime(analysis.created_at)}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleViewDetail(analysis)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6]/20"
                            >
                              <FiEye size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(analysis)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 모바일 카드 뷰 */}
            <div className="md:hidden flex flex-col gap-3">
              {filteredAnalyses.map((analysis) => {
                const severity = getSeverity(analysis.score || 0);
                return (
                  <div key={analysis.id} className="bg-white p-4 rounded-[12px] shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-[16px] text-[#2b2f36] truncate">
                            {analysis.user_name}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] shrink-0 ${severity.color}`}>
                            {severity.label}
                          </span>
                        </div>
                        <p className="text-[14px] text-[#515968] truncate">{analysis.user_email}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-600">
                            {getAnalysisTypeName(analysis.analysis_type)}
                          </span>
                          <span className="text-[14px] text-[#515968]">
                            점수: <span className="font-semibold text-[#22BCB7]">{analysis.score || 0}</span>
                          </span>
                        </div>
                        <p className="text-[12px] text-[#9ca3af] mt-1">{formatDateTime(analysis.created_at)}</p>
                      </div>
                      <div className="flex gap-2 ml-3">
                        <button
                          onClick={() => handleViewDetail(analysis)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#3B82F6]/10 text-[#3B82F6]"
                        >
                          <FiEye size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(analysis)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-500"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 상세 보기 모달 */}
      {showDetailModal && selectedAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[16px] p-6 w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-[18px] text-[#2b2f36]">
                분석 결과 상세
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <FiX size={24} className="text-[#9ca3af]" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[13px] text-[#9ca3af] mb-1">고객</p>
                  <p className="text-[16px] text-[#2b2f36] font-medium">{selectedAnalysis.user_name}</p>
                </div>
                <div>
                  <p className="text-[13px] text-[#9ca3af] mb-1">이메일</p>
                  <p className="text-[14px] text-[#515968]">{selectedAnalysis.user_email}</p>
                </div>
              </div>

              <div>
                <p className="text-[13px] text-[#9ca3af] mb-1">분석 타입</p>
                <span className="px-3 py-1 rounded-full text-[13px] bg-blue-50 text-blue-600">
                  {getAnalysisTypeName(selectedAnalysis.analysis_type)}
                </span>
              </div>

              <div className="bg-[#f8f9fa] p-4 rounded-xl">
                <p className="text-[13px] text-[#9ca3af] mb-2">종합 점수</p>
                <div className="flex items-center gap-3">
                  <span className="text-[32px] font-bold text-[#22BCB7]">{selectedAnalysis.score || 0}</span>
                  <span className={`px-3 py-1 rounded-full text-[13px] ${getSeverity(selectedAnalysis.score || 0).color}`}>
                    {getSeverity(selectedAnalysis.score || 0).label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#f8f9fa] p-3 rounded-lg text-center">
                  <p className="text-[12px] text-[#9ca3af] mb-1">Main Thoracic</p>
                  <p className="text-[18px] font-semibold text-[#2b2f36]">{selectedAnalysis.main_thoracic || 0}°</p>
                </div>
                <div className="bg-[#f8f9fa] p-3 rounded-lg text-center">
                  <p className="text-[12px] text-[#9ca3af] mb-1">2nd Thoracic</p>
                  <p className="text-[18px] font-semibold text-[#2b2f36]">{selectedAnalysis.second_thoracic || 0}°</p>
                </div>
                <div className="bg-[#f8f9fa] p-3 rounded-lg text-center">
                  <p className="text-[12px] text-[#9ca3af] mb-1">Lumber</p>
                  <p className="text-[18px] font-semibold text-[#2b2f36]">{selectedAnalysis.lumbar || 0}°</p>
                </div>
              </div>

              <div>
                <p className="text-[13px] text-[#9ca3af] mb-1">분석 일시</p>
                <p className="text-[14px] text-[#2b2f36]">{formatDateTime(selectedAnalysis.created_at)}</p>
              </div>
            </div>

            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full h-[44px] bg-[#22BCB7] text-white rounded-lg font-medium text-[14px] mt-6 hover:bg-[#1fa89f]"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[16px] p-6 w-full max-w-[480px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-[18px] text-[#2b2f36]">
                분석 결과 추가
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <FiX size={24} className="text-[#9ca3af]" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[14px] text-[#515968] mb-2">고객 선택</label>
                <select
                  value={newAnalysis.user_uuid}
                  onChange={(e) => setNewAnalysis({ ...newAnalysis, user_uuid: e.target.value })}
                  className="w-full h-[44px] px-4 border border-[#d4d9e2] rounded-lg text-[14px] focus:outline-none focus:border-[#22BCB7] bg-white"
                >
                  <option value="">고객을 선택하세요</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.user_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[14px] text-[#515968] mb-2">분석 타입</label>
                <select
                  value={newAnalysis.analysis_type}
                  onChange={(e) => setNewAnalysis({ ...newAnalysis, analysis_type: parseInt(e.target.value) })}
                  className="w-full h-[44px] px-4 border border-[#d4d9e2] rounded-lg text-[14px] focus:outline-none focus:border-[#22BCB7] bg-white"
                >
                  {analysisTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[14px] text-[#515968] mb-2">Main Thoracic</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAnalysis.main_thoracic}
                    onChange={(e) => setNewAnalysis({ ...newAnalysis, main_thoracic: parseFloat(e.target.value) || 0 })}
                    className="w-full h-[44px] px-3 border border-[#d4d9e2] rounded-lg text-[14px] focus:outline-none focus:border-[#22BCB7]"
                  />
                </div>
                <div>
                  <label className="block text-[14px] text-[#515968] mb-2">2nd Thoracic</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAnalysis.second_thoracic}
                    onChange={(e) => setNewAnalysis({ ...newAnalysis, second_thoracic: parseFloat(e.target.value) || 0 })}
                    className="w-full h-[44px] px-3 border border-[#d4d9e2] rounded-lg text-[14px] focus:outline-none focus:border-[#22BCB7]"
                  />
                </div>
                <div>
                  <label className="block text-[14px] text-[#515968] mb-2">Lumber</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAnalysis.lumbar}
                    onChange={(e) => setNewAnalysis({ ...newAnalysis, lumbar: parseFloat(e.target.value) || 0 })}
                    className="w-full h-[44px] px-3 border border-[#d4d9e2] rounded-lg text-[14px] focus:outline-none focus:border-[#22BCB7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[14px] text-[#515968] mb-2">종합 점수 (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newAnalysis.score}
                  onChange={(e) => setNewAnalysis({ ...newAnalysis, score: parseInt(e.target.value) || 0 })}
                  className="w-full h-[44px] px-4 border border-[#d4d9e2] rounded-lg text-[14px] focus:outline-none focus:border-[#22BCB7]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 h-[44px] bg-[#f3f4f7] text-[#515968] rounded-lg font-medium text-[14px] hover:bg-[#e5e7eb]"
              >
                취소
              </button>
              <button
                onClick={handleAddAnalysis}
                className="flex-1 h-[44px] bg-[#22BCB7] text-white rounded-lg font-medium text-[14px] hover:bg-[#1fa89f]"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && selectedAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[16px] p-6 w-full max-w-[360px]">
            <h3 className="font-semibold text-[18px] text-[#2b2f36] mb-3">
              분석 결과 삭제
            </h3>
            <p className="text-[14px] text-[#515968] leading-[22px]">
              <span className="font-medium text-[#2b2f36]">'{selectedAnalysis.user_name}'</span>의 분석 결과를 삭제하시겠습니까?
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
    </div>
  );
};

export default AdminAnalysisPage;
