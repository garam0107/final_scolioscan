import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';

// 네이티브 앱에서 측정 완료 시 호출하는 전역 콜백 (React 로드 전에 등록)
// 이 콜백은 React가 로드되기 전에도 호출될 수 있으므로 여기서 먼저 등록
window.onMeasurementComplete = function(measurementId) {
  console.log('측정 완료 콜백 호출됨, ID:', measurementId);

  // 측정 완료 데이터를 저장 (React가 로드된 후 처리)
  localStorage.setItem('pendingMeasurementComplete', JSON.stringify({
    measurementId: measurementId,
    timestamp: Date.now()
  }));

  // 분석 페이지로 이동 (React Router가 로드되기 전이면 직접 이동)
  if (window.location.pathname !== '/analysis') {
    window.location.href = '/analysis?showLatest=true';
  } else {
    // 이미 분석 페이지에 있으면 리로드
    window.location.reload();
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
