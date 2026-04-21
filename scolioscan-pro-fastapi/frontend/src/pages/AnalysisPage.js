import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, ReferenceLine, Tooltip } from 'recharts';
import BottomMenu from '../components/BottomMenu';
import SideMenu from '../components/SideMenu';
import AlarmPanel from '../components/AlarmPanel';
import MeasurementDetailModal from '../components/MeasurementDetailModal';
import { alarmAPI, analysisAPI } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import ArrowRightIcon from '../assets/icons/Analysis/ArrowRight.svg';
import SpineImage from '../assets/images/spine.png';
import Type0Image from '../assets/images/type0.png';
import Type1Image from '../assets/images/type1.png';
import Type2Image from '../assets/images/type2.png';
import Type3Image from '../assets/images/type3.png';
import Type4Image from '../assets/images/type4.png';
import Type5Image from '../assets/images/type5.png';
import HowToUseScolioscanImage from '../assets/images/howtouse_scolioscan.png';
import './AnalysisPage.css';

// 빈 상태 컴포넌트
const EmptyState = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center px-5 min-h-[60vh]">
      {/* 척추 뼈 아이콘 */}
      <div className="w-[80px] h-[80px] mb-4 flex items-center justify-center">
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 척추뼈 1 (상단) */}
          <ellipse cx="32" cy="8" rx="14" ry="5" fill="#D1D5DB" />
          <rect x="28" y="8" width="8" height="6" fill="#D1D5DB" />

          {/* 척추뼈 2 */}
          <ellipse cx="32" cy="18" rx="16" ry="5" fill="#9CA3AF" />
          <rect x="27" y="18" width="10" height="6" fill="#9CA3AF" />

          {/* 척추뼈 3 (중앙) */}
          <ellipse cx="32" cy="28" rx="18" ry="5" fill="#D1D5DB" />
          <rect x="26" y="28" width="12" height="6" fill="#D1D5DB" />

          {/* 척추뼈 4 */}
          <ellipse cx="32" cy="38" rx="16" ry="5" fill="#9CA3AF" />
          <rect x="27" y="38" width="10" height="6" fill="#9CA3AF" />

          {/* 척추뼈 5 */}
          <ellipse cx="32" cy="48" rx="14" ry="5" fill="#D1D5DB" />
          <rect x="28" y="48" width="8" height="6" fill="#D1D5DB" />

          {/* 척추뼈 6 (하단) */}
          <ellipse cx="32" cy="58" rx="12" ry="4" fill="#9CA3AF" />
        </svg>
      </div>
      {/* 메시지 */}
      <p className="text-16m text-gray-500 text-center leading-6 whitespace-pre-line">
        {message}
      </p>
    </div>
  );
};

// 척추 시각화 컴포넌트 - spine.png 이미지를 사용한 척추 시각화
// analysisType: 1 = 2D 카메라, 3 = 척추측만계
const SpineVisualization = ({ upperBack, middleBack, lumbar, upperBackLabel, middleBackLabel, lumbarLabel, analysisType = 3 }) => {
  // 실제 데이터 기반으로 척추 위치 계산 (각도 -> x 오프셋)
  // 양수 각도는 오른쪽으로, 음수 각도는 왼쪽으로 휘어짐
  const angleToOffset = (angle) => angle * 0.8; // 각도당 0.8px 오프셋

  // 상부 흉추만곡(upperBack): 1번째 뼈와 4~5번째 뼈 기울기의 교각 → spine5X 위치 결정
  // 주 흉추만곡(middleBack): 5번째 뼈와 10번째 뼈 기울기의 교각 → spine5X, spine10X 모두 영향
  // 요추만곡(lumbar): 10번째 뼈와 마지막 뼈 기울기의 교각 → spine10X 위치 결정
  const spine5X = angleToOffset(upperBack); // 상부 흉추만곡으로 5번째 뼈 위치 결정
  const spine10X = -angleToOffset(lumbar); // 요추만곡으로 10번째 뼈 위치 결정 (S커브)

  const totalVertebrae = 14;
  const baseWidth = 50; // 기본 척추 이미지 너비
  const vertebraHeight = baseWidth * 0.4; // 60% 겹침 (40%만큼 간격)

  // 부드러운 보간 함수 (cosine interpolation)
  const smoothLerp = (a, b, t) => {
    const ct = (1 - Math.cos(t * Math.PI)) / 2;
    return a + (b - a) * ct;
  };

  // 척추뼈 위치 계산 - S자 커브
  const generateSpineData = () => {
    const lastIndex = totalVertebrae - 1;

    // 먼저 x 위치 계산
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

    // 위치와 회전 계산
    const vertebrae = [];
    for (let i = 0; i < totalVertebrae; i++) {
      let rotation = 0;

      if (i > 0 && i < lastIndex) {
        // 앞뒤 뼈의 x 차이로 기울기 계산
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
    const cy = position.y + 10; // 뼈 중심으로 보정
    const rotDeg = position.rotation;
    const radiusY = radiusX * 0.5; // 타원형 (높이 50%)

    // 원호: 반원보다 약간 긴 정도 (약 210도), 아래쪽(앞면)만 표시
    const startAngle = -15;
    const endAngle = 195;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const rotRad = toRad(rotDeg);

    // 회전 변환 적용된 좌표 계산 (타원형)
    const rotatePoint = (angle) => {
      const rad = toRad(angle);
      const px = radiusX * Math.cos(rad);
      const py = radiusY * Math.sin(rad);
      // 뼈의 기울기에 맞춰 회전
      const rx = px * Math.cos(rotRad) - py * Math.sin(rotRad);
      const ry = px * Math.sin(rotRad) + py * Math.cos(rotRad);
      return { x: cx + rx, y: cy + ry };
    };

    // 화살촉 위치: 시계방향은 끝점, 반시계방향은 시작점
    const arrowPoint = clockwise ? rotatePoint(endAngle) : rotatePoint(startAngle);

    const arrowLen = 9;
    const arrowWidth = 6;

    // 접선 방향 벡터 (뼈 회전 적용)
    // 시계방향: 끝점에서 진행 방향, 반시계방향: 시작점에서 역방향
    const tangentAngle = clockwise ? (endAngle + 90) : (startAngle - 90);
    const tangentRad = toRad(tangentAngle);
    const tx = Math.cos(tangentRad) * Math.cos(rotRad) - Math.sin(tangentRad) * Math.sin(rotRad);
    const ty = Math.cos(tangentRad) * Math.sin(rotRad) + Math.sin(tangentRad) * Math.cos(rotRad);

    // 법선 방향 (접선에 수직)
    const nx = -ty;
    const ny = tx;

    const arrowTip = { x: arrowPoint.x + tx * arrowLen, y: arrowPoint.y + ty * arrowLen };
    const arrowLeft = { x: arrowPoint.x + nx * arrowWidth, y: arrowPoint.y + ny * arrowWidth };
    const arrowRight = { x: arrowPoint.x - nx * arrowWidth, y: arrowPoint.y - ny * arrowWidth };

    // 변환된 좌표로 다중 세그먼트 경로 생성
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
      {/* 척추 시각화 영역 */}
      <div className="relative bg-gradient-to-b from-[#1a9a95] to-[#0d7370] rounded-2xl overflow-hidden" style={{ minHeight: '340px' }}>

        {/* 척추 이미지 컨테이너 */}
        <div className="relative flex justify-center items-start pt-6 pb-4" style={{ height: '300px' }}>
          <div className="relative" style={{ width: '150px', height: '260px' }}>
            {/* SVG 오버레이 - 각도 선 표시 (잠시 숨김)
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 100,
                overflow: 'visible'
              }}
            >
              {(() => {
                const boneX1 = centerX + vertebrae[0].x;
                const boneY1 = vertebrae[0].y + 10;
                const boneX5 = centerX + vertebrae[4].x;
                const boneY5 = vertebrae[4].y + 10;

                const dx1 = boneX5 - boneX1;
                const dy1 = boneY5 - boneY1;
                const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
                const ux1 = dx1 / len1;
                const uy1 = dy1 / len1;

                const offset = 50;
                const px1 = -uy1;
                const py1 = ux1;

                const line1X1 = boneX1 + px1 * offset;
                const line1Y1 = boneY1 + py1 * offset;
                const line1X2 = boneX5 + px1 * offset;
                const line1Y2 = boneY5 + py1 * offset;

                return (
                  <line
                    x1={line1X1}
                    y1={line1Y1}
                    x2={line1X2}
                    y2={line1Y2}
                    stroke="white"
                    strokeWidth="1"
                  />
                );
              })()}
            </svg>
            */}

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
            const spineOffsetY = 24; // pt-6 padding
            // 각 화살표 팁의 Y 좌표 (각도 텍스트 중앙 정렬용)
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
            // spine container는 150px wide, 300px SVG 중앙에 정렬됨
            // SVG x = spine x + 75 (SVG 중앙 150 - spine 중앙 75 = 75 offset)
            const spineToSvgOffsetX = 75;
            const spineOffsetY = 24; // pt-6 padding

            // 각 화살표의 팁 위치 (SVG 좌표)
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
                {/* 상부 흉추 연결선 (20% 화살표 → 좌상단 각도 우측) - 수평선 */}
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
                {/* 흉요추 연결선 (50% 화살표 → 우측 각도 좌측) - 수평선 */}
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
                {/* 요추 연결선 (80% 화살표 → 좌하단 각도 우측) - 수평선 */}
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

      {/* 디버깅용 슬라이더 (잠시 숨김)
      <div className="bg-white rounded-xl p-4 shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)]">
        <p className="text-13r text-gray-500 mb-2">디버깅용 슬라이더</p>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-12r text-gray-600 w-20">5번 뼈: {spine5X}</span>
            <input
              type="range"
              min="-30"
              max="30"
              value={spine5X}
              onChange={(e) => setSpine5X(Number(e.target.value))}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-12r text-gray-600 w-20">10번 뼈: {spine10X}</span>
            <input
              type="range"
              min="-30"
              max="30"
              value={spine10X}
              onChange={(e) => setSpine10X(Number(e.target.value))}
              className="flex-1"
            />
          </div>
        </div>
      </div>
      */}

      {/* 하단 3개 카드 */}
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

// 측정 카드 컴포넌트
const MeasurementCard = ({ date, type, thoracic, lumbar, onClick, upperBackLabel, lumbarLabel }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white flex items-center justify-between px-5 py-4 rounded-xl shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)] w-full text-left hover:shadow-lg transition-shadow"
    >
      <div className="flex flex-col gap-1">
        <p className="text-15m text-gray-900 leading-5">{date}</p>
        <div className="bg-mint-25 px-2 py-1 rounded-[5px] inline-block w-fit">
          <p className="text-13r text-mint-600 leading-[18px]">{type}</p>
        </div>
      </div>
      <div className="flex flex-col gap-1 items-end">
        <div className="flex gap-2 items-center">
          <p className="text-13r text-gray-600">{upperBackLabel}</p>
          <p className="text-15sb text-gray-900 w-[40px] leading-[20px]">{Number(thoracic).toFixed(1)}°</p>
        </div>
        <div className="flex gap-2 items-center">
          <p className="text-13r text-gray-600">{lumbarLabel}</p>
          <p className="text-15sb text-gray-900 w-[40px] leading-[20px]">{Number(lumbar).toFixed(1)}°</p>
        </div>
      </div>
    </button>
  );
};

const AnalysisPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [alarmPanelOpen, setAlarmPanelOpen] = useState(false);
  const [alarmCount, setAlarmCount] = useState(0);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingShowLatest, setPendingShowLatest] = useState(false);
  const [selectedChartAngle, setSelectedChartAngle] = useState('proximal'); // proximal, main, lumbar

  // Refs for back button handler
  const stateRef = useRef({
    measurementModalOpen: false,
    alarmPanelOpen: false,
    sideMenuOpen: false
  });

  // Keep refs in sync with state
  useEffect(() => {
    stateRef.current = {
      measurementModalOpen,
      alarmPanelOpen,
      sideMenuOpen
    };
  }, [measurementModalOpen, alarmPanelOpen, sideMenuOpen]);

  // 페이지별 오버레이 핸들러 등록 (App.js의 글로벌 handleBackButton에서 호출됨)
  useEffect(() => {
    window._pageOverlayHandler = () => {
      const state = stateRef.current;

      if (state.measurementModalOpen) {
        setMeasurementModalOpen(false);
        setSelectedMeasurement(null);
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
    loadAnalyses();

    // URL 파라미터로 측정 완료 체크 (네이티브 앱이 URL로 이동하는 경우)
    const urlParams = new URLSearchParams(window.location.search);
    const showLatest = urlParams.get('showLatest');
    if (showLatest === 'true') {
      console.log('URL 파라미터로 측정 완료 감지, 최신 결과 표시');
      setPendingShowLatest(true);
      // URL 파라미터 제거
      window.history.replaceState({}, '', window.location.pathname);
    }

    // localStorage 기반 감지
    const pending = localStorage.getItem('pendingMeasurementComplete');
    if (pending) {
      console.log('localStorage에서 측정 완료 감지');
      localStorage.removeItem('pendingMeasurementComplete');
      setPendingShowLatest(true);
    }
  }, []);

  // 네이티브 앱에서 측정 완료 후 이 페이지로 이동한 경우 최신 결과 표시
  useEffect(() => {
    if (location.state?.showLatest) {
      console.log('측정 완료 후 분석 페이지 진입, 최신 결과 표시');
      // 데이터 새로고침 후 모달 표시
      setPendingShowLatest(true);
      loadAnalyses(); // 새로 측정된 데이터 로드
      // state 초기화 (뒤로가기 시 다시 모달이 뜨지 않도록)
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.showLatest, location.state?.timestamp, navigate, location.pathname]);

  // analyses 로딩 완료 후 최신 결과 모달 표시
  useEffect(() => {
    if (pendingShowLatest && !loading && analyses.length > 0) {
      setSelectedMeasurement(analyses[0]); // 최신 분석 결과 (이미 정렬됨)
      setMeasurementModalOpen(true);
      setPendingShowLatest(false);
    }
  }, [pendingShowLatest, loading, analyses]);

  const loadAlarmCount = async () => {
    try {
      const response = await alarmAPI.getUnreadCount();
      setAlarmCount(response.data.count);
    } catch (error) {
      console.error('Failed to load alarm count:', error);
    }
  };

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const response = await analysisAPI.getAnalyses();
      // 최근 검사 순으로 정렬 (created_at 기준 내림차순)
      const sortedAnalyses = (response.data || []).sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      );
      setAnalyses(sortedAnalyses);
    } catch (error) {
      console.error('Failed to load analyses:', error);
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  // 최신 분석 결과에서 값 추출
  const latestAnalysis = analyses.length > 0 ? analyses[0] : null;
  const mainThoracic = latestAnalysis?.main_thoracic || 0;
  const secondThoracic = latestAnalysis?.second_thoracic || 0;
  const lumbar = latestAnalysis?.lumbar || 0;

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (language === 'en') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 측정 타입 매핑
  const getTypeLabel = (analysisTypeId) => {
    const typeMap = {
      1: t('analysis.camera2D'),
      2: t('analysis.video3D'),
      3: t('analysis.scoliometerMeasurement')
    };
    return typeMap[analysisTypeId] || t('analysis.camera2D');
  };

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

  // 척추측만증 타입 판정 함수 - 조건이 완전히 일치하지 않을 경우 가장 유사한 타입 선택
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
    // 각 타입별 예상 조건 (p, m, l 각각 true/false)
    const typeConditions = [
      { type: 0, conditions: [false, false, false] }, // 정상
      { type: 1, conditions: [false, true, false] },  // 1형
      { type: 2, conditions: [true, true, false] },   // 2형
      { type: 3, conditions: [false, true, true] },   // 3형
      { type: 4, conditions: [true, true, true] },    // 4형
      { type: 5, conditions: [false, false, true] },  // 5형
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
          // 조건이 일치하면 높은 점수
          score += 10;
        } else if (expected) {
          // 예상은 ≥10인데 실제는 <10인 경우, 값이 10에 가까울수록 높은 점수
          score += value; // 0~9 범위
        } else {
          // 예상은 <10인데 실제는 ≥10인 경우, 값이 10에 가까울수록 높은 점수
          score += Math.max(0, 20 - value); // 값이 작을수록 높은 점수
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestType = type;
      }
    }

    return bestType;
  };

  // 현재 측만증 타입 (mainThoracic=상부, secondThoracic=주흉추, lumbar=요추)
  const currentScoliosisType = getScoliosisType(mainThoracic, secondThoracic, lumbar);
  const currentTypeInfo = scoliosisTypes[currentScoliosisType];

  // 차트 데이터 (선택된 각도 타입에 따라)
  // DB 필드 매핑: main_thoracic=상부 흉추만곡, second_thoracic=주 흉추만곡, lumbar=요추만곡
  const chartData = useMemo(() => {
    if (!analyses.length) return [];
    const latestSix = [...analyses]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .slice(-6);

    return latestSix.map((analysis, index) => {
      const date = new Date(analysis.created_at);
      const displayLabel = `${date.getMonth() + 1}/${date.getDate()}`;
      const fullDate = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      // 고유 키: 인덱스를 포함하여 중복 방지
      const uniqueKey = `${index}_${displayLabel}`;

      let value = 0;
      switch (selectedChartAngle) {
        case 'proximal':
          // 상부 흉추만곡 = main_thoracic
          value = Number(analysis.main_thoracic) || 0;
          break;
        case 'main':
          // 주 흉추만곡 = second_thoracic
          value = Number(analysis.second_thoracic) || 0;
          break;
        case 'lumbar':
          // 요추만곡 = lumbar
          value = Number(analysis.lumbar) || 0;
          break;
        default:
          value = Number(analysis.main_thoracic) || 0;
      }
      return { uniqueKey, displayLabel, fullDate, value, id: analysis.id || index };
    });
  }, [analyses, selectedChartAngle]);

  // 평균 변화량 계산 (연속 측정간 절대 각도 변화의 평균)
  const progression = useMemo(() => {
    if (chartData.length < 2) return 0;

    let totalChange = 0;
    let validCount = 0;

    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i - 1].value;
      const curr = chartData[i].value;
      // 절대 각도 변화량
      totalChange += Math.abs(curr - prev);
      validCount++;
    }

    if (validCount === 0) return 0;
    return Number((totalChange / validCount).toFixed(1));
  }, [chartData]);

  // 최근 변화 계산 (이전 측정 대비 최근 측정의 각도 변화)
  const recentChange = useMemo(() => {
    if (chartData.length < 2) return 0;
    const prev = chartData[chartData.length - 2].value;
    const last = chartData[chartData.length - 1].value;
    return Number((last - prev).toFixed(1));
  }, [chartData]);

  // 차트 Y축 도메인 (경도/중등도/중증 기준선 포함)
  const chartDomain = useMemo(() => {
    if (!chartData.length) return [0, 50];
    const values = chartData.map(d => d.value);
    const max = Math.max(...values, 45); // 최소 45까지 표시 (중증 기준선 40 + 여유)
    return [0, Math.ceil(max * 1.1)];
  }, [chartData]);

  // 심각도 기준 (Cobb angle 기준)
  const severityLevels = {
    mild: 10,      // 경도: 10° 이상
    moderate: 25,  // 중등도: 25° 이상
    severe: 40     // 중증: 40° 이상
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col pb-20 pt-[70px]">
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
        {loading ? (
          null
        ) : analyses.length === 0 ? (
          /* 데이터가 없을 때 빈 상태 표시 */
          <EmptyState message={t('analysis.emptyMessage')} />
        ) : (
          <>
            {/* 척추 시각화 UI */}
            <SpineVisualization
              upperBack={mainThoracic}
              middleBack={secondThoracic}
              lumbar={lumbar}
              upperBackLabel={t('analysis.upperBack')}
              middleBackLabel={latestAnalysis?.analysis_type === 3 ? t('analysis.thoracolumbar') : t('analysis.middleBack')}
              lumbarLabel={t('analysis.lumbar')}
              analysisType={latestAnalysis?.analysis_type || 1}
            />

            {/* 분석 결과 섹션 */}
            <div className="flex flex-col gap-4 w-full">
              <h2 className="text-16sb text-gray-900 leading-[22px]">
                {language === 'en' ? 'Analysis Results' : '분석 결과'}
              </h2>

              {/* 타입 이미지와 설명 카드 */}
              <div className="bg-white rounded-xl shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="flex flex-row">
                  {/* 설명 - 좌측 */}
                  <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                    <p className="text-14sb text-gray-900 mb-1">
                      {language === 'en' ? currentTypeInfo.nameEn : currentTypeInfo.nameKo}
                    </p>
                    <p className="text-12r text-gray-500 leading-[17px]">
                      {language === 'en' ? currentTypeInfo.descEn : currentTypeInfo.descKo}
                    </p>
                  </div>
                  {/* 타입 이미지 - 우측 */}
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

            {/* 그래프 섹션 */}
            <div className="flex flex-col gap-4 w-full">
              {/* 타이틀 영역 (회색 배경) */}
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
              {/* 그래프 카드 */}
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
                <div className="flex items-center">
                  {/* Y축 라벨 */}
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
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
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
                      {/* 경도 기준선 (10°) */}
                      <ReferenceLine
                        y={severityLevels.mild}
                        stroke="#4ade80"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                      />
                      {/* 중등도 기준선 (25°) */}
                      <ReferenceLine
                        y={severityLevels.moderate}
                        stroke="#facc15"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                      />
                      {/* 중증 기준선 (40°) */}
                      <ReferenceLine
                        y={severityLevels.severe}
                        stroke="#f87171"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#22BCB7"
                        strokeWidth={2}
                        fill="url(#colorGradient)"
                        dot={{ fill: '#22BCB7', strokeWidth: 0, r: 3 }}
                        activeDot={{ fill: '#22BCB7', strokeWidth: 2, stroke: '#fff', r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* 척추측만계 측정 및 분석 섹션 */}
            <div className="flex flex-col gap-4 w-full">
              <h2 className="text-16sb text-gray-900 leading-[22px]">
                {language === 'en' ? 'Scoliometer Measurement & Analysis' : '척추측만계 측정 및 분석'}
              </h2>
              <div className="bg-white rounded-xl shadow-[0px_0px_16px_0px_rgba(0,0,0,0.04)] overflow-hidden">
                <img
                  src={HowToUseScolioscanImage}
                  alt={language === 'en' ? 'Scoliometer Measurement Guide' : '척추측만계 측정 가이드'}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* 측정 목록 섹션 */}
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-16sb text-gray-900 leading-[22px]">{t('analysis.measurementList')}</h2>
                <button
                  onClick={() => navigate('/analysis/list')}
                  className="flex items-center gap-0"
                >
                  <p className="text-15m text-[#22BCB7] leading-[20px]">{t('analysis.viewAll')}</p>
                  <div className="relative shrink-0 size-[20px]">
                    <div className="absolute flex inset-[17.71%_32.29%] items-center justify-center">
                      <div className="flex-none h-[7.083px] rotate-[270deg] w-[12.917px]">
                        <img alt="" className="block max-w-none size-full" src={ArrowRightIcon} />
                      </div>
                    </div>
                  </div>
                </button>
              </div>
              <div className="flex flex-col gap-[10px] w-full">
                {analyses.slice(0, 5).map((analysis) => (
                  <MeasurementCard
                    key={analysis.id}
                    date={formatDate(analysis.created_at)}
                    type={getTypeLabel(analysis.analysis_type)}
                    thoracic={analysis.main_thoracic || 0}
                    lumbar={analysis.lumbar || 0}
                    upperBackLabel={language === 'en' ? 'Upper' : '등 상부'}
                    lumbarLabel={language === 'en' ? 'Lumbar' : '허리'}
                    onClick={() => {
                      setSelectedMeasurement(analysis);
                      setMeasurementModalOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

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

      {/* 측정 상세 모달 */}
      <MeasurementDetailModal
        isOpen={measurementModalOpen}
        onClose={() => {
          setMeasurementModalOpen(false);
          setSelectedMeasurement(null);
        }}
        measurement={selectedMeasurement}
        history={analyses}
      />

      {/* 하단 네비게이션 */}
      <BottomMenu />
    </div>
  );
};

export default AnalysisPage;
