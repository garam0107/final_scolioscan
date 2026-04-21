import React, { useState, useMemo, useEffect, useRef } from 'react';
import BottomMenu from '../components/BottomMenu';
import SideMenu from '../components/SideMenu';
import AlarmPanel from '../components/AlarmPanel';
import { alarmAPI, analysisAPI } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

// 척추측만증 유형 이미지
import type0Image from '../assets/images/type0.png';
import type1Image from '../assets/images/type1.png';
import type2Image from '../assets/images/type2.png';
import type3Image from '../assets/images/type3.png';
import type4Image from '../assets/images/type4.png';
import type5Image from '../assets/images/type5.png';

// 운동 추천 이미지
import exercise1Image from '../assets/images/exercise_1.jpg';
import exercise2Image from '../assets/images/exercise_2.jpg';
import exercise3Image from '../assets/images/exercise_3.jpg';

// 삼각형 레이더 차트 컴포넌트 (각도 기반)
const TriangleChart = ({ myValues, avgValues, size = 320, labels, myMeasurementLabel, avgLabel, chartDescriptionText, maxAngle = 40 }) => {
  const [animated, setAnimated] = useState(false);
  const padding = 25; // 라벨을 위한 여백 (최소화)
  const chartSize = size - padding * 2;
  const centerX = size / 2;
  const centerY = size / 2; // 삼각형 중앙 배치
  const maxRadius = chartSize * 0.52; // 그래프 크기 최대화

  // 애니메이션 시작
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // 삼각형의 각 꼭지점 각도 (맨 위부터 시계방향, 120도 간격)
  const getPoint = (index, value) => {
    const angle = (index * 120 - 90) * (Math.PI / 180);
    const radius = (Math.min(value, maxAngle) / maxAngle) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  // 배경 그리드 (10°, 20°, 30°, 40°)
  const gridAngles = [10, 20, 30, 40];

  // 데이터 포인트들을 path로 변환
  const createPath = (values) => {
    const points = values.map((val, idx) => getPoint(idx, val));
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  };

  // 라벨 위치 계산
  const getLabelPosition = (index) => {
    const angle = (index * 120 - 90) * (Math.PI / 180);
    // 상단 라벨은 가깝게, 하단 라벨은 멀게
    const labelRadius = index === 0 ? maxRadius + 18 : maxRadius + 28;
    return {
      x: centerX + labelRadius * Math.cos(angle),
      y: centerY + labelRadius * Math.sin(angle)
    };
  };

  // 그리드 각도 라벨 위치 (왼쪽 아래 방향)
  const getGridLabelPosition = (gridValue) => {
    const angle = (2 * 120 - 90) * (Math.PI / 180); // 왼쪽 아래 방향 (index 2)
    const radius = (gridValue / maxAngle) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle) - 15,
      y: centerY + radius * Math.sin(angle) + 5
    };
  };

  const svgHeight = size - 50; // 하단 여백 최소화

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <svg
        width="100%"
        height="auto"
        viewBox={`0 0 ${size} ${svgHeight}`}
        className="overflow-visible max-w-[360px]"
        style={{ aspectRatio: `${size} / ${svgHeight}` }}
      >
        {/* 배경 그리드 - 삼각형 */}
        {gridAngles.map((val, idx) => (
          <polygon
            key={idx}
            points={[0, 1, 2].map(i => {
              const p = getPoint(i, val);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="1"
          />
        ))}

        {/* 중심에서 꼭지점으로 가는 선 */}
        {[0, 1, 2].map(i => {
          const p = getPoint(i, maxAngle);
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={p.x}
              y2={p.y}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          );
        })}

        {/* 그리드 각도 라벨 */}
        {gridAngles.map((val) => {
          const pos = getGridLabelPosition(val);
          return (
            <text
              key={val}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] fill-gray-400"
            >
              {val}°
            </text>
          );
        })}

        {/* 한국 평균 (회색) - 애니메이션 적용 */}
        <path
          d={createPath(avgValues)}
          fill="rgba(156, 163, 175, 0.25)"
          stroke="#9CA3AF"
          strokeWidth="2"
          strokeDasharray="4 4"
          style={{
            transform: `scale(${animated ? 1 : 0})`,
            transformOrigin: `${centerX}px ${centerY}px`,
            transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transitionDelay: '0.1s'
          }}
        />

        {/* 나의 측정값 (민트색, 반투명) - 애니메이션 적용 */}
        <path
          d={createPath(myValues)}
          fill="rgba(34, 188, 183, 0.35)"
          stroke="#22BCB7"
          strokeWidth="2.5"
          style={{
            transform: `scale(${animated ? 1 : 0})`,
            transformOrigin: `${centerX}px ${centerY}px`,
            transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transitionDelay: '0.3s'
          }}
        />

        {/* 나의 측정값 점과 각도 표시 */}
        {myValues.map((val, idx) => {
          const p = getPoint(idx, val);
          // 각도 텍스트 위치: 0=상단(위), 1=우측하단(우측 아래), 2=좌측하단(하단)
          const textOffset = idx === 0
            ? { x: 0, y: -12, anchor: 'middle' }
            : idx === 1
              ? { x: 10, y: 10, anchor: 'start' }
              : { x: 0, y: 14, anchor: 'middle' };
          return (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r="6"
                fill="#22BCB7"
                style={{
                  opacity: animated ? 1 : 0,
                  transform: `scale(${animated ? 1 : 0})`,
                  transformOrigin: `${p.x}px ${p.y}px`,
                  transition: 'all 0.4s ease-out',
                  transitionDelay: `${0.5 + idx * 0.1}s`
                }}
              />
              <text
                x={p.x + textOffset.x}
                y={p.y + textOffset.y}
                textAnchor={textOffset.anchor}
                dominantBaseline="middle"
                className="text-[11px] fill-[#22BCB7] font-semibold"
                style={{
                  opacity: animated ? 1 : 0,
                  transition: 'opacity 0.4s ease-out',
                  transitionDelay: `${0.6 + idx * 0.1}s`
                }}
              >
                {val.toFixed(0)}°
              </text>
            </g>
          );
        })}

        {/* 라벨 */}
        {labels.map((label, idx) => {
          const pos = getLabelPosition(idx);
          // 모바일 대응: 하단 라벨들을 안쪽으로 이동 (1=우측→좌측으로, 2=좌측→우측으로)
          const xOffset = idx === 0 ? 0 : idx === 1 ? -25 : 25;
          return (
            <text
              key={idx}
              x={pos.x + xOffset}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[12px] fill-gray-600"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* 범례 */}
      <div className="flex gap-6 items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-[rgba(34,188,183,0.35)] border-2 border-[#22BCB7]"></div>
          <span className="text-[11px] text-gray-600">{myMeasurementLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-[rgba(156,163,175,0.25)] border-2 border-gray-400 border-dashed"></div>
          <span className="text-[11px] text-gray-600">{avgLabel}</span>
        </div>
      </div>

      {/* 설명 */}
      <p className="text-12r text-gray-500 text-center px-4 mt-2">
        {chartDescriptionText}
      </p>
    </div>
  );
};

// 심각도 게이지 컴포넌트
const SeverityGauge = ({ angle, mildLabel, moderateLabel, severeLabel, mildRangeLabel, moderateRangeLabel, severeRangeLabel, angleDescTemplate }) => {
  const [animated, setAnimated] = useState(false);

  // 애니메이션 시작
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // 10° ~ 50° 범위에서 위치 계산 (0-100%)
  const minAngle = 10;
  const maxAngle = 50;
  const position = Math.min(100, Math.max(0, ((angle - minAngle) / (maxAngle - minAngle)) * 100));

  // 심각도 판단
  const getSeverity = (angle) => {
    if (angle < 25) return mildLabel;
    if (angle <= 40) return moderateLabel;
    return severeLabel;
  };

  const severity = getSeverity(angle);

  return (
    <div className="flex flex-col gap-4">
      {/* 게이지 바 */}
      <div className="relative">
        {/* 그라데이션 바 - 정적 배경 */}
        <div
          className="h-4 rounded-full w-full"
          style={{
            background: 'linear-gradient(to right, #3B82F6, #22BCB7, #EAB308, #F97316, #EF4444)'
          }}
        />

        {/* 마커 (동그라미만) - 애니메이션 적용 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{
            left: animated ? `${position}%` : '0%',
            transition: 'left 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transitionDelay: '0.1s'
          }}
        >
          <div
            className="w-5 h-5 bg-gray-900 rounded-full border-2 border-white shadow-md"
            style={{
              transform: `scale(${animated ? 1 : 0})`,
              transition: 'transform 0.3s ease-out',
              transitionDelay: '0.05s'
            }}
          ></div>
        </div>
      </div>

      {/* 라벨 */}
      <div className="flex justify-between text-12r text-gray-600">
        <span>{mildRangeLabel}</span>
        <span>{moderateRangeLabel}</span>
        <span>{severeRangeLabel}</span>
      </div>

      {/* 설명 */}
      <p className="text-14m text-gray-700 text-center">
        {angleDescTemplate.replace('{angle}', angle).replace('{severity}', severity)}
      </p>
    </div>
  );
};

// 개별 심각도 바 컴포넌트
const SeverityBar = ({ label, angle, mildLabel, moderateLabel, severeLabel, delay = 0 }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100 + delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // 0° ~ 50° 범위에서 위치 계산 (0-100%)
  const position = Math.min(100, Math.max(0, (angle / 50) * 100));

  // 심각도 판단 및 색상
  const getSeverityInfo = (angle) => {
    if (angle < 10) return { label: '정상', color: '#3B82F6' };
    if (angle < 25) return { label: mildLabel, color: '#22BCB7' };
    if (angle <= 40) return { label: moderateLabel, color: '#F97316' };
    return { label: severeLabel, color: '#EF4444' };
  };

  const severityInfo = getSeverityInfo(angle);

  return (
    <div className="flex flex-col gap-2">
      {/* 라벨과 각도 */}
      <div className="flex justify-between items-center">
        <span className="text-13m text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-13sb text-gray-900">{angle.toFixed(0)}°</span>
          <span
            className="text-11r px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${severityInfo.color}20`,
              color: severityInfo.color
            }}
          >
            {severityInfo.label}
          </span>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: animated ? `${position}%` : '0%',
            backgroundColor: severityInfo.color,
            transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transitionDelay: `${delay * 0.001}s`
          }}
        />
      </div>
    </div>
  );
};

// 운동 추천 아이템 컴포넌트
const ExerciseItem = ({ title, duration, thumbnail }) => {
  return (
    <div className="flex gap-4 items-center">
      {/* 비디오 프리뷰 */}
      <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-300"></div>
        )}
        {/* 반투명 오버레이 + 플레이 버튼 */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* 운동 정보 */}
      <div className="flex flex-col gap-1">
        <p className="text-14sb text-gray-900">{title}</p>
        <p className="text-13r text-gray-500">{duration}</p>
      </div>
    </div>
  );
};

const ReportPage = () => {
  const { t } = useLanguage();
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [alarmPanelOpen, setAlarmPanelOpen] = useState(false);
  const [alarmCount, setAlarmCount] = useState(0);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refs for back button handler
  const stateRef = useRef({
    showAppointmentModal: false,
    alarmPanelOpen: false,
    sideMenuOpen: false
  });

  // Keep refs in sync with state
  useEffect(() => {
    stateRef.current = {
      showAppointmentModal,
      alarmPanelOpen,
      sideMenuOpen
    };
  }, [showAppointmentModal, alarmPanelOpen, sideMenuOpen]);

  // 페이지별 오버레이 핸들러 등록 (App.js의 글로벌 handleBackButton에서 호출됨)
  useEffect(() => {
    window._pageOverlayHandler = () => {
      const state = stateRef.current;
      if (state.showAppointmentModal) {
        setShowAppointmentModal(false);
        return true;
      }
      if (state.alarmPanelOpen) {
        setAlarmPanelOpen(false);
        return true;
      }
      if (state.sideMenuOpen) {
        setSideMenuOpen(false);
        return true;
      }
      return false;
    };
    return () => {
      delete window._pageOverlayHandler;
    };
  }, []);

  useEffect(() => {
    loadAlarmCount();
    loadLatestAnalysis();
  }, []);

  const loadAlarmCount = async () => {
    try {
      const response = await alarmAPI.getUnreadCount();
      setAlarmCount(response.data.count);
    } catch (error) {
      console.error('Failed to load alarm count:', error);
    }
  };

  const loadLatestAnalysis = async () => {
    try {
      setLoading(true);
      const response = await analysisAPI.getAnalyses();
      // 2D 카메라 측정 데이터만 필터링 (analysis_type === 1)
      // 최근 검사 순으로 정렬 (created_at 기준 내림차순)
      const sortedAnalyses = (response.data || [])
        .filter(a => a.analysis_type === 1) // 2D 카메라 측정만
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      if (sortedAnalyses.length > 0) {
        setLatestAnalysis(sortedAnalyses[0]);
      }
    } catch (error) {
      console.error('Failed to load analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  // 각도를 0-100 점수로 변환 (0°=100점, 50°=0점)
  const angleToScore = (angle) => {
    if (angle === null || angle === undefined) return 50;
    const maxAngle = 50;
    return Math.max(0, Math.min(100, 100 - (Math.abs(angle) / maxAngle) * 100));
  };

  // 분석 데이터를 기반으로 척추 각도 (삼각형 차트용 - 실제 각도값)
  const mySpineValues = useMemo(() => {
    if (!latestAnalysis) {
      return [0, 0, 0]; // 데이터 없을 때 기본값
    }

    const mainThoracic = Math.abs(latestAnalysis.main_thoracic || 0);      // 상부 흉추만곡
    const secondThoracic = Math.abs(latestAnalysis.second_thoracic || 0); // 주 흉추만곡
    const lumbar = Math.abs(latestAnalysis.lumbar || 0);                   // 요추만곡

    return [
      mainThoracic,      // 상부 흉추만곡
      secondThoracic,    // 주 흉추만곡
      lumbar,            // 요추만곡
    ];
  }, [latestAnalysis]);

  const avgSpineValues = [18, 18, 18]; // 한국 측만도 평균 (18°)

  // 주요 만곡 각도 (가장 큰 각도)
  const mainAngle = useMemo(() => {
    if (!latestAnalysis) return 0;
    return Math.max(
      Math.abs(latestAnalysis.main_thoracic || 0),
      Math.abs(latestAnalysis.second_thoracic || 0),
      Math.abs(latestAnalysis.lumbar || 0)
    );
  }, [latestAnalysis]);

  // 가장 심각한 부위 정보
  const worstSeverity = useMemo(() => {
    const labels = [t('report.proximalThoracic'), t('report.mainThoracic'), t('report.lumbar')];
    let worstIdx = 0;
    for (let i = 1; i < mySpineValues.length; i++) {
      if (mySpineValues[i] > mySpineValues[worstIdx]) worstIdx = i;
    }
    const angle = mySpineValues[worstIdx];
    let severity, color;
    if (angle < 10) { severity = t('report.normal'); color = '#3B82F6'; }
    else if (angle < 25) { severity = t('report.mild'); color = '#22BCB7'; }
    else if (angle <= 40) { severity = t('report.moderate'); color = '#F97316'; }
    else { severity = t('report.severe'); color = '#EF4444'; }
    return { label: labels[worstIdx], angle, severity, color };
  }, [mySpineValues, t]);

  // 척추측만증 타입 정보 (AnalysisPage와 동일)
  const scoliosisTypes = {
    0: {
      image: type0Image,
      nameKo: '정상',
      nameEn: 'Normal',
      descKo: '척추가 정상 범위 내에 있습니다. 현재 상태를 유지하시고 정기적인 검진을 권장합니다.',
    },
    1: {
      image: type1Image,
      nameKo: '1형 (흉추형)',
      nameEn: 'Type 1 (Thoracic)',
      descKo: '주 흉추 부위에 만곡이 있습니다. 전문의 상담을 권장합니다.',
    },
    2: {
      image: type2Image,
      nameKo: '2형 (이중 흉추형)',
      nameEn: 'Type 2 (Double Thoracic)',
      descKo: '상부 및 주 흉추 부위에 만곡이 있습니다. 전문의 상담이 필요합니다.',
    },
    3: {
      image: type3Image,
      nameKo: '3형 (이중 주만곡형)',
      nameEn: 'Type 3 (Double Major)',
      descKo: '주 흉추와 요추 부위에 만곡이 있습니다. 전문의 상담이 필요합니다.',
    },
    4: {
      image: type4Image,
      nameKo: '4형 (삼중 만곡형)',
      nameEn: 'Type 4 (Triple Major)',
      descKo: '세 부위 모두에 만곡이 있습니다. 적극적인 치료가 필요할 수 있습니다.',
    },
    5: {
      image: type5Image,
      nameKo: '5형 (요추형)',
      nameEn: 'Type 5 (Lumbar)',
      descKo: '요추 부위에 만곡이 있습니다. 전문의 상담을 권장합니다.',
    }
  };

  // 척추측만증 타입 판정 함수 (AnalysisPage와 동일)
  const getScoliosisType = (proximal, main, lumbarAngle) => {
    const pVal = Math.abs(proximal);
    const mVal = Math.abs(main);
    const lVal = Math.abs(lumbarAngle);

    const p = pVal >= 10;
    const m = mVal >= 10;
    const l = lVal >= 10;

    // 완전히 일치하는 타입 확인
    if (!p && !m && !l) return 0; // 정상
    if (!p && m && !l) return 1;  // 1형 (흉추형)
    if (p && m && !l) return 2;   // 2형 (이중 흉추형)
    if (!p && m && l) return 3;   // 3형 (이중 주만곡형)
    if (p && m && l) return 4;    // 4형 (삼중 만곡형)
    if (!p && !m && l) return 5;  // 5형 (요추형)

    // 완전히 일치하는 타입이 없을 경우, 가장 유사한 타입 찾기
    const typeConditions = [
      { type: 0, conditions: [false, false, false] },
      { type: 1, conditions: [false, true, false] },
      { type: 2, conditions: [true, true, false] },
      { type: 3, conditions: [false, true, true] },
      { type: 4, conditions: [true, true, true] },
      { type: 5, conditions: [false, false, true] },
    ];

    const actualValues = [pVal, mVal, lVal];
    const actualConditions = [p, m, l];

    let bestType = 0;
    let bestScore = -Infinity;

    for (const { type, conditions } of typeConditions) {
      let score = 0;
      for (let i = 0; i < 3; i++) {
        const expected = conditions[i];
        const actual = actualConditions[i];
        const value = actualValues[i];

        if (expected === actual) {
          score += 10;
        } else if (expected) {
          score += value;
        } else {
          score += Math.max(0, 20 - value);
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestType = type;
      }
    }

    return bestType;
  };

  // 척추 지배만곡 유형 판단 (AnalysisPage와 동일한 로직)
  const dominantCurveType = useMemo(() => {
    // mySpineValues: [상부흉추(PT), 주흉추(MT), 요추(TL/L)]
    // DB 매핑: main_thoracic=상부 흉추, second_thoracic=주 흉추, lumbar=요추
    const proximal = mySpineValues[0]; // 상부 흉추만곡
    const main = mySpineValues[1];     // 주 흉추만곡
    const lumbar = mySpineValues[2];   // 요추만곡

    const typeNumber = getScoliosisType(proximal, main, lumbar);
    const typeInfo = scoliosisTypes[typeNumber];

    // 원래 형식: scoliosisTypes 배열과 images 배열 반환
    return {
      typeNumber,
      scoliosisTypes: [typeInfo.nameKo],
      images: [typeInfo.image]
    };
  }, [mySpineValues]);

  // 곡선 패턴 판단 (C형/S형 만곡)
  const curvePattern = useMemo(() => {
    if (!latestAnalysis) {
      return { name: t('report.noDataTitle'), description: t('report.noDataDesc') };
    }

    // mySpineValues: [상부흉추(PT), 주흉추(MT), 요추(TL/L)]
    const pt = mySpineValues[0]; // 상부 흉추
    const mt = mySpineValues[1]; // 주 흉추
    const tll = mySpineValues[2]; // 요추

    // 구조적 만곡 개수 (>= 10°)
    const structuralCount = [pt, mt, tll].filter(angle => angle >= 10).length;

    // C형 만곡: 1형, 5형 (단일 만곡)
    // S형 만곡: 2형, 3형, 4형 (두 개 이상 반대 방향 만곡)
    if (structuralCount <= 1) {
      // C형 만곡 (단일 만곡 또는 정상)
      return {
        name: 'C형 만곡',
        description: '한 방향으로 형성된 단일 만곡'
      };
    } else {
      // S형 만곡 (복합 만곡)
      return {
        name: 'S형 만곡',
        description: '서로 반대 방향의 두 개 이상 만곡'
      };
    }
  }, [latestAnalysis, mySpineValues, t]);

  // 위험도 및 권장사항
  const riskAssessment = useMemo(() => {
    // 위험도 레벨
    let level, color, brace, posture;
    if (mainAngle < 10) {
      level = t('report.normal'); color = 'text-blue-500';
      brace = t('report.normalBrace'); posture = t('report.normalPosture');
    } else if (mainAngle < 25) {
      level = t('report.mildRisk'); color = 'text-green-500';
      brace = t('report.mildBrace'); posture = t('report.mildPosture');
    } else if (mainAngle <= 40) {
      level = t('report.moderateRisk'); color = 'text-orange-500';
      brace = t('report.moderateBrace'); posture = t('report.moderatePosture');
    } else {
      level = t('report.severeRisk'); color = 'text-red-500';
      brace = t('report.severeBrace'); posture = t('report.severePosture');
    }

    // 예후 (Cobb angle 기준 추적 관리)
    let prognosis;
    if (mainAngle < 20) {
      prognosis = t('report.prognosisUnder20');
    } else if (mainAngle <= 40) {
      prognosis = t('report.prognosis20to40');
    } else {
      prognosis = t('report.prognosisOver40');
    }

    return { level, color, prognosis, brace, posture };
  }, [mainAngle, t]);

  // 운동 추천 (심각도에 따라 다른 추천)
  const exercises = useMemo(() => {
    const thumbnails = [exercise1Image, exercise2Image, exercise3Image];
    if (mainAngle < 25) {
      return [
        { title: t('report.exercise1Mild'), duration: t('report.exercise1MildDur'), thumbnail: thumbnails[0] },
        { title: t('report.exercise2Mild'), duration: t('report.exercise2MildDur'), thumbnail: thumbnails[1] },
        { title: t('report.exercise3Mild'), duration: t('report.exercise3MildDur'), thumbnail: thumbnails[2] },
      ];
    } else if (mainAngle <= 40) {
      return [
        { title: t('report.exercise1Moderate'), duration: t('report.exercise1ModerateDur'), thumbnail: thumbnails[0] },
        { title: t('report.exercise2Moderate'), duration: t('report.exercise2ModerateDur'), thumbnail: thumbnails[1] },
        { title: t('report.exercise3Moderate'), duration: t('report.exercise3ModerateDur'), thumbnail: thumbnails[2] },
      ];
    } else {
      return [
        { title: t('report.exercise1Severe'), duration: t('report.exercise1SevereDur'), thumbnail: thumbnails[0] },
        { title: t('report.exercise2Severe'), duration: t('report.exercise2SevereDur'), thumbnail: thumbnails[1] },
        { title: t('report.exercise3Severe'), duration: t('report.exercise3SevereDur'), thumbnail: thumbnails[2] },
      ];
    }
  }, [mainAngle, t]);

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col pb-36 pt-[70px]">
      {/* 헤더 */}
      <div className="fixed top-0 left-0 right-0 bg-gray-50 flex items-center justify-between p-5 z-40">
        <div className="h-6 w-[120px]">
          <h1
            className="text-[27px] font-bold text-mint-400 leading-normal tracking-[-0.27px]"
            style={{ fontFamily: 'MuseoModerno, sans-serif', marginTop: '-7px' }}
          >
            Scolioscan
          </h1>
        </div>
        <div className="flex gap-[14px] items-center">
          <button
            onClick={() => setAlarmPanelOpen(true)}
            className="relative w-7 h-7"
          >
            {/* Bell Icon */}
            <svg
              className="w-full h-full text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {/* Alarm Badge */}
            {alarmCount > 0 && (
              <div className="absolute right-0 top-0 bg-red-400 rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                <span className="text-white text-[10px] font-bold leading-none">
                  {alarmCount > 9 ? '9+' : alarmCount}
                </span>
              </div>
            )}
          </button>
          <button
            onClick={() => setSideMenuOpen(true)}
            className="w-7 h-7 text-gray-600"
          >
            {/* Hamburger Icon */}
            <svg
              className="w-full h-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex flex-col gap-4 px-5 w-full">

        {/* 데이터 없을 때 빈 상태 */}
        {!loading && !latestAnalysis && (
          <div className="flex flex-col items-center justify-center px-5 min-h-[60vh]">
            <div className="w-[80px] h-[80px] mb-4 flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-16m text-gray-500 text-center leading-6 whitespace-pre-line">
              {t('report.emptyStateMessage')}
            </p>
          </div>
        )}

        {/* 섹션 1: 척추 균형 분석 */}
        {latestAnalysis && (
          <>
        <div className="bg-white flex flex-col gap-4 px-5 py-5 rounded-xl shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)] w-full">
          <h2 className="text-16sb text-gray-900 leading-[22px]">{t('report.spineBalanceAnalysis')}</h2>
          <TriangleChart
            myValues={mySpineValues}
            avgValues={avgSpineValues}
            size={360}
            maxAngle={40}
            labels={[t('report.proximalThoracic'), t('report.mainThoracic'), t('report.lumbar')]}
            myMeasurementLabel={t('report.myMeasurement')}
            avgLabel={t('report.koreaAvg')}
            chartDescriptionText={t('report.triangleChartDescription')}
          />
        </div>

        {/* 섹션 2: 심각도 분석 */}
        <div className="bg-white flex flex-col gap-4 px-5 py-5 rounded-xl shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)] w-full">
          <h2 className="text-16sb text-gray-900 leading-[22px]">{t('report.severityAnalysis')}</h2>

          {/* 3개의 심각도 바 */}
          <div className="flex flex-col gap-4">
            <SeverityBar
              label={t('report.proximalThoracic')}
              angle={mySpineValues[0]}
              mildLabel={t('report.mild')}
              moderateLabel={t('report.moderate')}
              severeLabel={t('report.severe')}
              delay={0}
            />
            <SeverityBar
              label={t('report.mainThoracic')}
              angle={mySpineValues[1]}
              mildLabel={t('report.mild')}
              moderateLabel={t('report.moderate')}
              severeLabel={t('report.severe')}
              delay={100}
            />
            <SeverityBar
              label={t('report.lumbar')}
              angle={mySpineValues[2]}
              mildLabel={t('report.mild')}
              moderateLabel={t('report.moderate')}
              severeLabel={t('report.severe')}
              delay={200}
            />
          </div>

          {/* 범례 */}
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div>
              <span className="text-11r text-gray-500">{t('report.normal')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#22BCB7]"></div>
              <span className="text-11r text-gray-500">{t('report.mild')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#F97316]"></div>
              <span className="text-11r text-gray-500">{t('report.moderate')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#EF4444]"></div>
              <span className="text-11r text-gray-500">{t('report.severe')}</span>
            </div>
          </div>

          {/* 주요 만곡 코멘트 */}
          <p className="text-14r text-gray-600 text-center mt-1 leading-6">
            주요 만곡 각도는 <span className="font-semibold" style={{ color: worstSeverity.color }}>{worstSeverity.label}</span> <span className="font-semibold" style={{ color: worstSeverity.color }}>{worstSeverity.angle.toFixed(1)}°</span>로
            <br />
            <span className="font-semibold" style={{ color: worstSeverity.color }}>{worstSeverity.severity}</span>에 해당합니다.
          </p>
        </div>

        {/* 섹션 3: 척추 지배만곡 유형 */}
        <div className="bg-white flex flex-col gap-4 px-5 py-5 rounded-xl shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)] w-full">
          <h2 className="text-16sb text-gray-900 leading-[22px]">척추 지배만곡 유형</h2>

          {/* 유형 설명 */}
          <p className="text-14r text-gray-600 text-center leading-6">
            귀하의 척추 지배만곡유형은
            <br />
            <span className="font-semibold text-mint-600">
              {dominantCurveType.scoliosisTypes.join(', ')}
            </span> 유형에 해당합니다.
          </p>

          {/* 유형 이미지 */}
          <div className={`flex justify-center gap-3 ${dominantCurveType.images.length === 1 ? '' : ''}`}>
            {dominantCurveType.images.map((img, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <img
                  src={img}
                  alt={dominantCurveType.scoliosisTypes[idx]}
                  className="w-32 h-auto rounded-lg"
                />
                <span className="text-12r text-gray-500 mt-2">
                  {dominantCurveType.scoliosisTypes[idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 섹션 4: 곡선 패턴 */}
        <div className="bg-white flex flex-col gap-4 px-5 py-5 rounded-xl shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)] w-full">
          {/* 제목 */}
          <h2 className="text-16sb text-gray-900 leading-[22px]">{t('report.curvePattern')}</h2>

          {/* 패턴 정보 */}
          <div className="flex gap-4 items-start">
            {/* 차트 아이콘 */}
            <div className="flex-shrink-0 w-10 h-10 bg-mint-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-mint-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>

            {/* 패턴 내용 */}
            <div className="flex flex-col gap-1">
              <p className="text-15sb text-mint-600">{curvePattern.name}</p>
              <p className="text-14r text-gray-600 leading-5">
                {curvePattern.description}
              </p>
            </div>
          </div>
        </div>

        {/* 섹션 5: 의사 소견 (최종 평가) */}
        <div className="bg-white flex flex-col px-5 py-5 rounded-xl shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)] w-full">
          <h2 className="text-16sb text-gray-900 leading-[22px] mb-4">{t('report.doctorOpinion')}</h2>

          {/* 위험도 평가 헤더 */}
          <div className="flex gap-3 items-start">
            {/* 청진기 아이콘 */}
            <div className="flex-shrink-0 w-10 h-10 bg-mint-50 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-mint-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-14m text-gray-600">{t('report.riskAssessment')}</p>
              <p className={`text-14m ${riskAssessment.color}`}>{riskAssessment.level}</p>
            </div>
          </div>

          {/* 구분선 */}
          <hr className="my-4 border-gray-100" />

          {/* 예후 */}
          <div className="flex flex-col gap-2">
            <h4 className="text-14sb text-gray-900">{t('report.prognosis')}</h4>
            <p className="text-14r text-gray-600 leading-5">
              {riskAssessment.prognosis}
            </p>
          </div>

          {/* 구분선 */}
          <hr className="my-4 border-gray-100" />

          {/* 보조기 권장 사항 */}
          <div className="flex flex-col gap-2">
            <h4 className="text-14sb text-gray-900">{t('report.braceRecommendation')}</h4>
            <p className="text-14r text-gray-600 leading-5">
              {riskAssessment.brace}
            </p>
          </div>

          {/* 구분선 */}
          <hr className="my-4 border-gray-100" />

          {/* 자세 및 인체공학 */}
          <div className="flex flex-col gap-2">
            <h4 className="text-14sb text-gray-900">{t('report.postureErgonomics')}</h4>
            <p className="text-14r text-gray-600 leading-5">
              {riskAssessment.posture}
            </p>
          </div>

          {/* 구분선 */}
          <hr className="my-4 border-gray-100" />

          {/* 권장 운동 */}
          <div className="flex flex-col gap-3">
            <h4 className="text-14sb text-gray-900">{t('report.recommendedExercises')}</h4>
            <div className="flex flex-col gap-4">
              {exercises.map((exercise, idx) => (
                <ExerciseItem
                  key={idx}
                  title={exercise.title}
                  duration={exercise.duration}
                  thumbnail={exercise.thumbnail}
                />
              ))}
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {/* 후속 진료 예약 - 고정 하단 버튼 */}
      <div className="fixed bottom-[72px] left-0 right-0 px-5 pt-2 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent z-30">
        <button
          onClick={() => setShowAppointmentModal(true)}
          className="w-full bg-[#22BCB7] text-white py-4 rounded-xl text-16sb shadow-lg hover:bg-[#1fa89f] transition-colors"
        >
          {t('report.followUpAppointment')}
        </button>
      </div>

      {/* 후속 진료 예약 모달 */}
      {showAppointmentModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowAppointmentModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 z-50 w-[280px] text-center">
            <div className="w-16 h-16 bg-mint-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-mint-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-18sb text-gray-900 mb-2">{t('report.preparingTitle')}</h3>
            <p className="text-14r text-gray-600 mb-6 whitespace-pre-line">
              {t('report.preparingDesc')}
            </p>
            <button
              onClick={() => setShowAppointmentModal(false)}
              className="bg-mint-500 text-white px-6 py-3 rounded-lg text-14m"
            >
              {t('common.confirm')}
            </button>
          </div>
        </>
      )}

      {/* AlarmPanel */}
      <AlarmPanel
        isOpen={alarmPanelOpen}
        onClose={() => setAlarmPanelOpen(false)}
      />

      {/* SideMenu */}
      <SideMenu
        isOpen={sideMenuOpen}
        onClose={() => setSideMenuOpen(false)}
      />

      {/* 하단 네비게이션 */}
      <BottomMenu />
    </div>
  );
};

export default ReportPage;
