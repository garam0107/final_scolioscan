import React, { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, ReferenceLine, Tooltip } from 'recharts';
import SpineImage from '../assets/images/spine.png';
import Type0Image from '../assets/images/type0.png';
import Type1Image from '../assets/images/type1.png';
import Type2Image from '../assets/images/type2.png';
import Type3Image from '../assets/images/type3.png';
import Type4Image from '../assets/images/type4.png';
import Type5Image from '../assets/images/type5.png';
import api, { analysisAPI } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

// 척추 시각화 컴포넌트
// analysisType: 1 = 2D 카메라, 3 = 척추측만계
const SpineVisualization = ({ upperBack, middleBack, lumbar, upperBackLabel, middleBackLabel, lumbarLabel, analysisType = 3 }) => {
  const angleToOffset = (angle) => angle * 0.8;

  const spine5X = angleToOffset(upperBack);
  const spine10X = -angleToOffset(lumbar);

  const totalVertebrae = 14;
  const baseWidth = 50;
  const vertebraHeight = baseWidth * 0.4;

  const smoothLerp = (a, b, t) => {
    const ct = (1 - Math.cos(t * Math.PI)) / 2;
    return a + (b - a) * ct;
  };

  const generateSpineData = () => {
    const lastIndex = totalVertebrae - 1;
    const xPositions = [];

    for (let i = 0; i < totalVertebrae; i++) {
      let xOffset = 0;
      if (i === 0 || i === lastIndex) {
        xOffset = 0;
      } else if (i <= 4) {
        const t = i / 4;
        xOffset = smoothLerp(0, spine5X, t);
      } else if (i <= 9) {
        const t = (i - 4) / 5;
        xOffset = smoothLerp(spine5X, spine10X, t);
      } else {
        const t = (i - 9) / (lastIndex - 9);
        xOffset = smoothLerp(spine10X, 0, t);
      }
      xPositions.push(xOffset);
    }

    const vertebrae = [];
    for (let i = 0; i < totalVertebrae; i++) {
      let rotation = 0;
      if (i > 0 && i < lastIndex) {
        const dx = xPositions[i + 1] - xPositions[i - 1];
        const dy = vertebraHeight * 2;
        rotation = -Math.atan2(dx, dy) * (180 / Math.PI);
      } else if (i === 0) {
        const dx = xPositions[1] - xPositions[0];
        rotation = -Math.atan2(dx, vertebraHeight) * (180 / Math.PI);
      } else {
        const dx = xPositions[lastIndex] - xPositions[lastIndex - 1];
        rotation = -Math.atan2(dx, vertebraHeight) * (180 / Math.PI);
      }
      vertebrae.push({
        x: xPositions[i],
        y: i * vertebraHeight,
        scale: 1,
        rotation
      });
    }
    return vertebrae;
  };

  const vertebrae = generateSpineData();

  // SVG 컨테이너 크기
  const svgWidth = 150;
  const centerX = svgWidth / 2;

  // 보간된 위치 계산 (소수점 인덱스 지원)
  const getInterpolatedPosition = (fractionalIndex) => {
    const i = Math.floor(fractionalIndex);
    const t = fractionalIndex - i;
    const v1 = vertebrae[Math.min(i, totalVertebrae - 1)];
    const v2 = vertebrae[Math.min(i + 1, totalVertebrae - 1)];
    return {
      x: v1.x + (v2.x - v1.x) * t,
      y: v1.y + (v2.y - v1.y) * t,
      rotation: v1.rotation + (v2.rotation - v1.rotation) * t,
    };
  };

  // 회전 화살표 생성 (SVG 타원 원호 + 화살촉)
  const generateRotationArrow = (position, clockwise, radiusX = 33) => {
    const cx = centerX + position.x;
    const cy = position.y + 10;
    const rotDeg = position.rotation;
    const radiusY = radiusX * 0.5;

    const startAngle = -15;
    const endAngle = 195;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const rotRad = toRad(rotDeg);

    const rotatePoint = (angle) => {
      const rad = toRad(angle);
      const px = radiusX * Math.cos(rad);
      const py = radiusY * Math.sin(rad);
      const rx = px * Math.cos(rotRad) - py * Math.sin(rotRad);
      const ry = px * Math.sin(rotRad) + py * Math.cos(rotRad);
      return { x: cx + rx, y: cy + ry };
    };

    const arrowPoint = clockwise ? rotatePoint(endAngle) : rotatePoint(startAngle);
    const arrowLen = 9;
    const arrowWidth = 6;

    const tangentAngle = clockwise ? (endAngle + 90) : (startAngle - 90);
    const tangentRad = toRad(tangentAngle);
    const tx = Math.cos(tangentRad) * Math.cos(rotRad) - Math.sin(tangentRad) * Math.sin(rotRad);
    const ty = Math.cos(tangentRad) * Math.sin(rotRad) + Math.sin(tangentRad) * Math.cos(rotRad);

    const nx = -ty;
    const ny = tx;

    const arrowTip = { x: arrowPoint.x + tx * arrowLen, y: arrowPoint.y + ty * arrowLen };
    const arrowLeft = { x: arrowPoint.x + nx * arrowWidth, y: arrowPoint.y + ny * arrowWidth };
    const arrowRight = { x: arrowPoint.x - nx * arrowWidth, y: arrowPoint.y - ny * arrowWidth };

    const segments = 24;
    const angleRange = endAngle - startAngle;
    const points = [];
    for (let s = 0; s <= segments; s++) {
      const angle = startAngle + (angleRange * s) / segments;
      points.push(rotatePoint(angle));
    }

    const pathD = points.map((p, idx) =>
      idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
    ).join(' ');

    return { pathD, arrowTip, arrowLeft, arrowRight, center: { x: cx, y: cy } };
  };

  // 20%, 50%, 80% 위치의 화살표 데이터
  const arrowPositions = [
    { pct: 0.20, clockwise: true },
    { pct: 0.50, clockwise: false },
    { pct: 0.80, clockwise: true },
  ];

  const arrows = arrowPositions.map(({ pct, clockwise }) => {
    const idx = pct * (totalVertebrae - 1);
    const pos = getInterpolatedPosition(idx);
    return { ...generateRotationArrow(pos, clockwise), clockwise };
  });

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="relative bg-gradient-to-b from-[#1a9a95] to-[#0d7370] rounded-2xl overflow-hidden" style={{ minHeight: '340px' }}>
        <div className="relative flex justify-center items-start pt-6 pb-4" style={{ height: '300px' }}>
          <div className="relative" style={{ width: '150px', height: '260px' }}>
            {vertebrae.map((v, index) => (
              <img
                key={index}
                src={SpineImage}
                alt=""
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: v.y,
                  width: `${baseWidth * v.scale}px`,
                  transform: `translateX(-50%) translateX(${v.x}px) rotate(${v.rotation}deg)`,
                  zIndex: index + 1,
                  transformOrigin: 'center top',
                }}
              />
            ))}

            {/* 회전 화살표 또는 위치 표시 SVG 오버레이 */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 50,
                overflow: 'visible',
                pointerEvents: 'none',
              }}
            >
              {analysisType === 3 ? (
                // 척추측만계: 회전 화살표 표시
                arrows.map((arrow, idx) => (
                  <g key={idx}>
                    {/* 원호 테두리 (초록색) */}
                    <path
                      d={arrow.pathD}
                      fill="none"
                      stroke="#22BCB7"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    {/* 원호 내부 (흰색) */}
                    <path
                      d={arrow.pathD}
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* 화살촉 (흰색, 테두리 없음 - 원호와 연결) */}
                    <polygon
                      points={`${arrow.arrowTip.x},${arrow.arrowTip.y} ${arrow.arrowLeft.x},${arrow.arrowLeft.y} ${arrow.arrowRight.x},${arrow.arrowRight.y}`}
                      fill="white"
                    />
                  </g>
                ))
              ) : (
                // 2D 카메라: 위치 표시 동그라미
                arrows.map((arrow, idx) => (
                  <g key={idx}>
                    {/* 외부 원 - 반투명 흰색 */}
                    <circle
                      cx={arrow.center.x}
                      cy={arrow.center.y}
                      r={38}
                      fill="rgba(255, 255, 255, 0.15)"
                      stroke="rgba(255, 255, 255, 0.5)"
                      strokeWidth="2"
                    />
                    {/* 내부 원 - 더 진한 흰색 */}
                    <circle
                      cx={arrow.center.x}
                      cy={arrow.center.y}
                      r={12}
                      fill="rgba(255, 255, 255, 0.6)"
                    />
                  </g>
                ))
              )}
            </svg>
          </div>

          {/* 각도 값 표시 - 화살표 촉 Y 좌표에 맞춰 배치 */}
          {(() => {
            const spineOffsetY = 24;
            const arrow1TipY = spineOffsetY + arrows[0].arrowTip.y;
            const arrow2TipY = spineOffsetY + arrows[1].arrowTip.y;
            const arrow3TipY = spineOffsetY + arrows[2].arrowTip.y;

            return (
              <>
                <div
                  className="absolute left-4 text-white"
                  style={{ top: `${arrow1TipY}px`, transform: 'translateY(-50%)' }}
                >
                  <p className="text-white/70 mb-1" style={{ fontSize: '0.9rem' }}>{upperBackLabel}</p>
                  <p className="font-bold" style={{ fontSize: '2.2rem', marginTop: '-14px' }}>{Number(upperBack).toFixed(0)}°</p>
                </div>

                <div
                  className="absolute right-4 text-white text-right"
                  style={{ top: `${arrow2TipY}px`, transform: 'translateY(-50%)' }}
                >
                  <p className="text-white/70 mb-1" style={{ fontSize: '0.9rem' }}>{middleBackLabel}</p>
                  <p className="font-bold" style={{ fontSize: '2.2rem', marginTop: '-14px' }}>{Number(middleBack).toFixed(0)}°</p>
                </div>

                <div
                  className="absolute left-4 text-white"
                  style={{ top: `${arrow3TipY}px`, transform: 'translateY(-50%)' }}
                >
                  <p className="text-white/70 mb-1" style={{ fontSize: '0.9rem' }}>{lumbarLabel}</p>
                  <p className="font-bold" style={{ fontSize: '2.2rem', marginTop: '-14px' }}>{Number(lumbar).toFixed(0)}°</p>
                </div>
              </>
            );
          })()}

          {/* 화살표와 각도를 연결하는 선 */}
          {(() => {
            // 화살표 팁 좌표 계산 (spine container 기준 → SVG 기준)
            const spineToSvgOffsetX = 75;
            const spineOffsetY = 24;

            const arrow1TipX = arrows[0].arrowTip.x + spineToSvgOffsetX;
            const arrow1TipY = spineOffsetY + arrows[0].arrowTip.y;
            const arrow2TipX = arrows[1].arrowTip.x + spineToSvgOffsetX;
            const arrow2TipY = spineOffsetY + arrows[1].arrowTip.y;
            const arrow3TipX = arrows[2].arrowTip.x + spineToSvgOffsetX;
            const arrow3TipY = spineOffsetY + arrows[2].arrowTip.y;

            return (
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '300px',
                  height: '100%',
                  zIndex: 60,
                  pointerEvents: 'none',
                  overflow: 'visible',
                }}
              >
                {/* 상부 흉추 연결선 - 수평선 */}
                <line
                  x1={arrow1TipX}
                  y1={arrow1TipY}
                  x2={65}
                  y2={arrow1TipY}
                  stroke="white"
                  strokeWidth="1"
                  strokeDasharray="3 2"
                  opacity="0.7"
                />
                {/* 흉요추 연결선 - 수평선 */}
                <line
                  x1={arrow2TipX}
                  y1={arrow2TipY}
                  x2={235}
                  y2={arrow2TipY}
                  stroke="white"
                  strokeWidth="1"
                  strokeDasharray="3 2"
                  opacity="0.7"
                />
                {/* 요추 연결선 - 수평선 */}
                <line
                  x1={arrow3TipX}
                  y1={arrow3TipY}
                  x2={65}
                  y2={arrow3TipY}
                  stroke="white"
                  strokeWidth="1"
                  strokeDasharray="3 2"
                  opacity="0.7"
                />
              </svg>
            );
          })()}
        </div>
      </div>
      <div className="flex gap-2 w-full">
        <div className="flex-1 bg-white flex flex-col gap-1 items-center justify-center px-4 py-3 rounded-xl shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)]">
          <p className="text-11r text-gray-500 text-center leading-4">{upperBackLabel}</p>
          <p className="text-18b text-gray-900 leading-6">{Number(upperBack).toFixed(0)}°</p>
        </div>
        <div className="flex-1 bg-white flex flex-col gap-1 items-center justify-center px-4 py-3 rounded-xl shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)]">
          <p className="text-11r text-gray-500 text-center leading-4">{middleBackLabel}</p>
          <p className="text-18b text-gray-900 leading-6">{Number(middleBack).toFixed(0)}°</p>
        </div>
        <div className="flex-1 bg-white flex flex-col gap-1 items-center justify-center px-4 py-3 rounded-xl shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)]">
          <p className="text-11r text-gray-500 text-center leading-4">{lumbarLabel}</p>
          <p className="text-18b text-gray-900 leading-6">{Number(lumbar).toFixed(0)}°</p>
        </div>
      </div>
    </div>
  );
};

/**
 * 측정 상세 모달 컴포넌트
 */
const MeasurementDetailModal = ({ isOpen, onClose, measurement, history = [] }) => {
  const { t, language, isEnglish } = useLanguage();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageBlobUrl, setImageBlobUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedChartAngle, setSelectedChartAngle] = useState('proximal');

  // 척추측만증 타입 정보
  const scoliosisTypes = {
    0: {
      image: Type0Image,
      nameKo: '정상',
      nameEn: 'Normal',
      descKo: '척추가 정상 범위 내에 있습니다. 현재 상태를 유지하시고 정기적인 검진을 권장합니다.',
      descEn: 'Your spine is within the normal range. Maintain your current condition and regular check-ups are recommended.'
    },
    1: {
      image: Type1Image,
      nameKo: '1형 (흉추형) 척추측만증',
      nameEn: 'Type 1 (Thoracic) Scoliosis',
      descKo: '주 흉추 부위에 만곡이 있습니다. 전문의 상담을 권장합니다.',
      descEn: 'There is a curve in the main thoracic area. Medical consultation is recommended.'
    },
    2: {
      image: Type2Image,
      nameKo: '2형 (이중 흉추형) 척추측만증',
      nameEn: 'Type 2 (Double Thoracic) Scoliosis',
      descKo: '상부 및 주 흉추 부위에 만곡이 있습니다. 전문의 상담이 필요합니다.',
      descEn: 'There are curves in both proximal and main thoracic areas. Medical consultation is needed.'
    },
    3: {
      image: Type3Image,
      nameKo: '3형 (이중 주만곡형) 척추측만증',
      nameEn: 'Type 3 (Double Major) Scoliosis',
      descKo: '주 흉추와 요추 부위에 만곡이 있습니다. 전문의 상담이 필요합니다.',
      descEn: 'There are curves in main thoracic and lumbar areas. Medical consultation is needed.'
    },
    4: {
      image: Type4Image,
      nameKo: '4형 (삼중 만곡형) 척추측만증',
      nameEn: 'Type 4 (Triple Major) Scoliosis',
      descKo: '세 부위 모두에 만곡이 있습니다. 적극적인 치료가 필요할 수 있습니다.',
      descEn: 'There are curves in all three areas. Active treatment may be required.'
    },
    5: {
      image: Type5Image,
      nameKo: '5형 (요추형) 척추측만증',
      nameEn: 'Type 5 (Lumbar) Scoliosis',
      descKo: '요추 부위에 만곡이 있습니다. 전문의 상담을 권장합니다.',
      descEn: 'There is a curve in the lumbar area. Medical consultation is recommended.'
    }
  };

  // 척추측만증 타입 판정 함수
  const getScoliosisType = (proximal, main, lumbarAngle) => {
    const pVal = Math.abs(proximal);
    const mVal = Math.abs(main);
    const lVal = Math.abs(lumbarAngle);

    const p = pVal >= 10;
    const m = mVal >= 10;
    const l = lVal >= 10;

    if (!p && !m && !l) return 0;
    if (!p && m && !l) return 1;
    if (p && m && !l) return 2;
    if (!p && m && l) return 3;
    if (p && m && l) return 4;
    if (!p && !m && l) return 5;

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

  useEffect(() => {
    let isMounted = true;

    const fetchDetail = async () => {
      if (!measurement || !isOpen) return;

      setDetail(measurement);
      setLoading(true);

      try {
        const response = await analysisAPI.getAnalysis(measurement.id);
        if (isMounted) {
          setDetail(response.data || measurement);
        }
      } catch (error) {
        console.error('Failed to load analysis detail:', error);
        if (isMounted) {
          setDetail(measurement);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [measurement, isOpen]);

  const target = detail || measurement;

  const typeMap = {
    1: t('analysis.camera2D'),
    2: t('analysis.video3D'),
    3: t('analysis.scoliometerMeasurement')
  };

  const formatDateWithTime = (dateString) => {
    if (!dateString) return t('analysis.measurementResult');
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    if (isEnglish) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${hours}:${minutes} Result`;
    }
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${hours}시 ${minutes}분 검사 결과`;
  };

  // 차트 데이터 (선택된 검사일 기준 과거 5건)
  const chartData = useMemo(() => {
    if (!history?.length || !target?.created_at) return [];
    const targetDate = new Date(target.created_at);

    // 선택된 검사일 기준으로 그 날짜 이하의 기록만 필터링
    const filteredHistory = [...history]
      .filter(item => new Date(item.created_at) <= targetDate)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .slice(-5); // 과거 5건

    return filteredHistory.map((analysis, index) => {
      const date = new Date(analysis.created_at);
      const displayLabel = `${date.getMonth() + 1}/${date.getDate()}`;
      const fullDate = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      // 고유 키: 인덱스를 포함하여 중복 방지
      const uniqueKey = `${index}_${displayLabel}`;

      let value = 0;
      switch (selectedChartAngle) {
        case 'proximal':
          value = Number(analysis.main_thoracic) || 0;
          break;
        case 'main':
          value = Number(analysis.second_thoracic) || 0;
          break;
        case 'lumbar':
          value = Number(analysis.lumbar) || 0;
          break;
        default:
          value = Number(analysis.main_thoracic) || 0;
      }
      return { uniqueKey, displayLabel, fullDate, value, id: analysis.id || index };
    });
  }, [history, selectedChartAngle, target?.created_at]);

  // 평균 변화량 계산
  const progression = useMemo(() => {
    if (chartData.length < 2) return 0;
    let totalChange = 0;
    let validCount = 0;
    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i - 1].value;
      const curr = chartData[i].value;
      totalChange += Math.abs(curr - prev);
      validCount++;
    }
    if (validCount === 0) return 0;
    return Number((totalChange / validCount).toFixed(1));
  }, [chartData]);

  // 최근 변화 계산
  const recentChange = useMemo(() => {
    if (chartData.length < 2) return 0;
    const prev = chartData[chartData.length - 2].value;
    const last = chartData[chartData.length - 1].value;
    return Number((last - prev).toFixed(1));
  }, [chartData]);

  // 차트 Y축 도메인
  const chartDomain = useMemo(() => {
    if (!chartData.length) return [0, 50];
    const values = chartData.map(d => d.value);
    const max = Math.max(...values, 45);
    return [0, Math.ceil(max * 1.1)];
  }, [chartData]);

  const severityLevels = {
    mild: 10,
    moderate: 25,
    severe: 40
  };

  const mainThoracic = target ? target.main_thoracic || 0 : 0;
  const secondThoracic = target ? target.second_thoracic || 0 : 0;
  const lumbar = target ? target.lumbar || 0 : 0;
  const analysisTypeLabel = typeMap[target?.analysis_type] || t('analysis.camera2D');

  // 현재 측만증 타입
  const currentScoliosisType = getScoliosisType(mainThoracic, secondThoracic, lumbar);
  const currentTypeInfo = scoliosisTypes[currentScoliosisType];

  useEffect(() => {
    let isMounted = true;
    let objectUrl;

    const fetchImage = async () => {
      if (!isOpen || !target?.image_url) {
        setImageBlobUrl(null);
        setImageLoading(false);
        return;
      }

      setImageLoading(true);
      try {
        const image_url = target.image_url.replace('/api', '')
        const response = await api.get(image_url, { responseType: 'blob' });
        objectUrl = URL.createObjectURL(response.data);
        if (isMounted) {
          setImageBlobUrl(objectUrl);
        }
      } catch (error) {
        console.error('Failed to load analysis image:', error);
        if (isMounted) {
          setImageBlobUrl(null);
        }
      } finally {
        if (isMounted) {
          setImageLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isOpen, target?.image_url]);

  if (!measurement) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={formatDateWithTime(target.created_at)}
      subtitle={analysisTypeLabel}
      bgColor="bg-gray-50"
    >
      <div className="flex flex-col gap-5 px-5 pb-10">
        {/* 척추 시각화 */}
        <SpineVisualization
          upperBack={mainThoracic}
          middleBack={secondThoracic}
          lumbar={lumbar}
          upperBackLabel={t('analysis.upperBack')}
          middleBackLabel={target?.analysis_type === 3 ? t('analysis.thoracolumbar') : t('analysis.middleBack')}
          lumbarLabel={t('analysis.lumbar')}
          analysisType={target?.analysis_type || 1}
        />

        {/* 분석 결과 섹션 */}
        <div className="flex flex-col gap-4 w-full">
          <h2 className="text-16sb text-gray-900 leading-[22px]">
            {language === 'en' ? 'Analysis Results' : '분석 결과'}
          </h2>

          {/* 타입 이미지와 설명 카드 */}
          <div className="bg-white rounded-xl shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex flex-row">
              <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                <p className="text-14sb text-gray-900 mb-1">
                  {language === 'en' ? currentTypeInfo.nameEn : currentTypeInfo.nameKo}
                </p>
                <p className="text-12r text-gray-500 leading-[17px]">
                  {language === 'en' ? currentTypeInfo.descEn : currentTypeInfo.descKo}
                </p>
              </div>
              <div className="w-[100px] min-h-[120px] bg-[#1a9a95] flex items-center justify-center p-2 flex-shrink-0">
                <img
                  src={currentTypeInfo.image}
                  alt={language === 'en' ? currentTypeInfo.nameEn : currentTypeInfo.nameKo}
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>

            {/* 분류 기준 표 */}
            <div className="border-t border-gray-100">
              <table className="w-full text-center text-11r">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-2 text-gray-500 font-medium">{language === 'en' ? 'Type' : '유형'}</th>
                    <th className="py-2 px-1 text-gray-500 font-medium">{language === 'en' ? 'Proximal' : '상부'}</th>
                    <th className="py-2 px-1 text-gray-500 font-medium">{language === 'en' ? 'Main' : '주흉추'}</th>
                    <th className="py-2 px-1 text-gray-500 font-medium">{language === 'en' ? 'Lumbar' : '요추'}</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className={currentScoliosisType === 0 ? 'bg-mint-25' : ''}>
                    <td className="py-1.5 px-2">{language === 'en' ? 'Normal' : '정상'}</td>
                    <td className="py-1.5 px-1">&lt;10</td>
                    <td className="py-1.5 px-1">&lt;10</td>
                    <td className="py-1.5 px-1">&lt;10</td>
                  </tr>
                  <tr className={currentScoliosisType === 1 ? 'bg-mint-25' : ''}>
                    <td className="py-1.5 px-2">{language === 'en' ? 'Type 1' : '1형'}</td>
                    <td className="py-1.5 px-1">&lt;10</td>
                    <td className="py-1.5 px-1">≥10</td>
                    <td className="py-1.5 px-1">&lt;10</td>
                  </tr>
                  <tr className={currentScoliosisType === 2 ? 'bg-mint-25' : ''}>
                    <td className="py-1.5 px-2">{language === 'en' ? 'Type 2' : '2형'}</td>
                    <td className="py-1.5 px-1">≥10</td>
                    <td className="py-1.5 px-1">≥10</td>
                    <td className="py-1.5 px-1">&lt;10</td>
                  </tr>
                  <tr className={currentScoliosisType === 3 ? 'bg-mint-25' : ''}>
                    <td className="py-1.5 px-2">{language === 'en' ? 'Type 3' : '3형'}</td>
                    <td className="py-1.5 px-1">&lt;10</td>
                    <td className="py-1.5 px-1">≥10</td>
                    <td className="py-1.5 px-1">≥10</td>
                  </tr>
                  <tr className={currentScoliosisType === 4 ? 'bg-mint-25' : ''}>
                    <td className="py-1.5 px-2">{language === 'en' ? 'Type 4' : '4형'}</td>
                    <td className="py-1.5 px-1">≥10</td>
                    <td className="py-1.5 px-1">≥10</td>
                    <td className="py-1.5 px-1">≥10</td>
                  </tr>
                  <tr className={currentScoliosisType === 5 ? 'bg-mint-25' : ''}>
                    <td className="py-1.5 px-2">{language === 'en' ? 'Type 5' : '5형'}</td>
                    <td className="py-1.5 px-1">&lt;10</td>
                    <td className="py-1.5 px-1">&lt;10</td>
                    <td className="py-1.5 px-1">≥10</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 일자별 측만도 변화 섹션 */}
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-16sb text-gray-900 leading-[22px]">
              {language === 'en' ? 'Daily Scoliosis Changes' : '일자별 측만도 변화'}
            </h2>
            <select
              value={selectedChartAngle}
              onChange={(e) => setSelectedChartAngle(e.target.value)}
              className="text-13r text-gray-600 bg-white px-3 py-1.5 rounded-full shadow-[0px_0px_8px_0px_rgba(0,0,0,0.06)] outline-none cursor-pointer"
            >
              <option value="proximal">{t('analysis.upperBack')}</option>
              <option value="main">{t('analysis.middleBack')}</option>
              <option value="lumbar">{t('analysis.lumbar')}</option>
            </select>
          </div>

          <div className="bg-white flex flex-col gap-11 px-5 py-4 rounded-xl shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)] w-full focus:outline-none" tabIndex={-1}>
            <div className="flex flex-col gap-[6px]">
              <p className="text-13r text-gray-600 leading-[18px]">
                {t('analysis.progressionRate')}
              </p>
              <div className="flex gap-[7px] items-center">
                <p className="text-28b text-gray-900 leading-[38px]">
                  {progression}°
                </p>
                <div className="bg-mint-25 px-2 py-1 rounded-[5px]">
                  <p className="text-11m text-mint-600 leading-4">
                    {t('analysis.recentChange')} {recentChange >= 0 ? '+' : ''}{recentChange}°
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-[10px] w-full">
              {/* 범례 */}
              <div className="flex items-center justify-end gap-3 text-10r">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-[1px] bg-green-400"></div>
                  <span className="text-gray-400">{language === 'en' ? 'Mild' : '경도'} 10°</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-[1px] bg-yellow-400"></div>
                  <span className="text-gray-400">{language === 'en' ? 'Moderate' : '중등도'} 25°</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-[1px] bg-red-400"></div>
                  <span className="text-gray-400">{language === 'en' ? 'Severe' : '중증'} 40°</span>
                </div>
              </div>
              {chartData.length > 0 ? (
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-[120px] flex items-center pr-1">
                    <span
                      className="text-10r text-gray-400"
                      style={{ writingMode: 'vertical-rl' }}
                    >
                      {language === 'en' ? 'Angle (°)' : '측만각도(°)'}
                    </span>
                  </div>
                  <div className="h-[120px] flex-1" style={{ outline: 'none' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} style={{ outline: 'none' }}>
                        <defs>
                          <linearGradient id="colorGradientModal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22BCB7" stopOpacity={0.3}/>
                            <stop offset="100%" stopColor="#22BCB7" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                          dataKey="uniqueKey"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                          tickFormatter={(value) => value.split('_')[1]}
                        />
                        <YAxis
                          hide
                          domain={chartDomain}
                        />
                        <Tooltip
                          trigger="click"
                          wrapperStyle={{ outline: 'none' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                                  <p className="font-medium">{payload[0].payload.fullDate}</p>
                                  <p className="text-mint-300">{payload[0].value}°</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine y={severityLevels.mild} stroke="#4ade80" strokeDasharray="4 4" strokeWidth={1} />
                        <ReferenceLine y={severityLevels.moderate} stroke="#facc15" strokeDasharray="4 4" strokeWidth={1} />
                        <ReferenceLine y={severityLevels.severe} stroke="#f87171" strokeDasharray="4 4" strokeWidth={1} />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#22BCB7"
                          strokeWidth={2}
                          fill="url(#colorGradientModal)"
                          dot={{ fill: '#22BCB7', strokeWidth: 0, r: 3 }}
                          activeDot={{ fill: '#22BCB7', strokeWidth: 2, stroke: '#fff', r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-13r text-gray-500">{t('analysis.noRecentHistory')}</div>
              )}
            </div>
          </div>
        </div>

        {/* 이미지 섹션 - 촬영한 사진이 있을 때만 표시 */}
        {(imageBlobUrl || imageLoading) && (
          <div className="flex flex-col gap-4 pb-10">
            <div className="flex gap-4">
              <h3 className="text-16sb text-gray-900 leading-[22px]">{t('analysis.image')}</h3>
            </div>
            <div className="relative rounded-xl overflow-hidden w-full">
              {imageLoading ? (
                <div className="w-full aspect-[335/255] flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint-500"></div>
                </div>
              ) : (
                <img
                  src={imageBlobUrl}
                  alt={t('analysis.image')}
                  className="w-full h-auto rounded-xl"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MeasurementDetailModal;
