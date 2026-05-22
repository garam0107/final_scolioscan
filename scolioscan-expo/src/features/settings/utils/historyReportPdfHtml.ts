import type { MeasurementSetResponse } from '@/src/types/measurementSet';

type HistoryReportPdfParams = {
  userName: string;
  measurementSets: MeasurementSetResponse[];
};

type ReportRegion = {
  key: 'upper' | 'main' | 'lumbar';
  label: string;
  curvatureValue?: number | null;
  rotationValue?: number | null;
};

function escapeHtml(value: string) {
  // 사용자 이름처럼 외부에서 들어오는 문자열이 PDF HTML 구조를 깨지 않게 치환한다.
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getMeasurementDate(measurementSet: MeasurementSetResponse) {
  const curvatureDate = measurementSet.curvature?.measured_at || measurementSet.curvature?.created_at;
  const rotationDate = measurementSet.rotation?.measured_at || measurementSet.rotation?.created_at;

  return curvatureDate || rotationDate || '';
}

function formatDate(value: string) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
}

function formatDegree(value?: number | null, precision: 'integer' | 'decimal' = 'integer') {
  if (value === null || value === undefined || !Number.isFinite(value)) return '-';

  const absoluteValue = Math.abs(value);
  const formatted =
    precision === 'decimal'
      ? `${Math.round(absoluteValue * 10) / 10}`.replace(/\.0$/, '')
      : `${Math.round(absoluteValue)}`;

  return `${formatted}°`;
}

function getRegions(measurementSet: MeasurementSetResponse): ReportRegion[] {
  const { curvature, rotation } = measurementSet;

  return [
    {
      key: 'upper',
      label: '상부 흉추',
      curvatureValue: curvature?.secondary_thoracic_cobb,
      rotationValue: rotation?.upper_thoracic_atr,
    },
    {
      key: 'main',
      label: '주 흉추',
      curvatureValue: curvature?.main_thoracic_cobb,
      rotationValue: rotation?.thoracic_atr,
    },
    {
      key: 'lumbar',
      label: '요추',
      curvatureValue: curvature?.lumbar_cobb,
      rotationValue: rotation?.lumbar_atr,
    },
  ];
}

function buildRegionCell(region: ReportRegion) {
  return `
    <td>
      <div class="metricLabel">${region.label}</div>
      <div class="metricValue">만곡 ${formatDegree(region.curvatureValue)}</div>
      <div class="metricValue muted">비틀림 ${formatDegree(region.rotationValue, 'decimal')}</div>
    </td>
  `;
}

function buildRows(measurementSets: MeasurementSetResponse[]) {
  return measurementSets
    .slice(0, 5)
    .map((measurementSet) => {
      const regions = getRegions(measurementSet);

      return `
        <tr>
          <td class="dateCell">${formatDate(getMeasurementDate(measurementSet))}</td>
          ${regions.map(buildRegionCell).join('')}
        </tr>
      `;
    })
    .join('');
}

export function createHistoryReportPdfHtml({
  userName,
  measurementSets,
}: HistoryReportPdfParams) {
  const safeUserName = escapeHtml(userName.trim() || '회원');

  return `
    <!doctype html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          @page {
            size: A4;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #ffffff;
            color: #25272d;
            font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          .page {
            position: relative;
            width: 210mm;
            height: 297mm;
            padding: 30mm 24mm 28mm;
            overflow: hidden;
          }

          .header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            padding-bottom: 16px;
            border-bottom: 2px solid #2f9c9c;
          }

          .brand {
            color: #1f2a3d;
            font-family: "MuseoModerno_700Bold", "MuseoModerno", Pretendard, sans-serif;
            font-size: 24px;
            font-weight: 700;
            line-height: 1.2;
          }

          .subtitle {
            margin-top: 6px;
            color: #657085;
            font-size: 12px;
            line-height: 1.5;
          }

          .userBox {
            min-width: 120px;
            text-align: right;
          }

          .userLabel {
            color: #657085;
            font-size: 11px;
            line-height: 1.4;
          }

          .userName {
            margin-top: 4px;
            color: #25272d;
            font-size: 14px;
            font-weight: 700;
            line-height: 1.4;
          }

          .sectionTitle {
            margin: 22px 0 12px;
            font-size: 18px;
            font-weight: 700;
            line-height: 1.4;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 1px solid #d4d9e2;
            border-radius: 8px;
            overflow: hidden;
          }

          th,
          td {
            border-bottom: 1px solid #e7eaf0;
            border-right: 1px solid #e7eaf0;
            padding: 12px 10px;
            vertical-align: top;
          }

          tr:last-child td {
            border-bottom: none;
          }

          th:last-child,
          td:last-child {
            border-right: none;
          }

          th {
            background: #f3f4f7;
            color: #657085;
            font-size: 12px;
            font-weight: 600;
            line-height: 1.4;
            text-align: left;
          }

          td {
            min-height: 70px;
            color: #25272d;
            font-size: 12px;
            line-height: 1.5;
          }

          .dateHeader,
          .dateCell {
            width: 22%;
          }

          .dateCell {
            color: #3b4049;
            font-weight: 600;
            white-space: nowrap;
          }

          .metricLabel {
            color: #657085;
            font-size: 11px;
            line-height: 1.4;
          }

          .metricValue {
            margin-top: 4px;
            color: #25272d;
            font-size: 13px;
            font-weight: 700;
            line-height: 1.35;
            white-space: nowrap;
          }

          .metricValue.muted {
            color: #657085;
            font-weight: 600;
          }

          .notice {
            position: absolute;
            left: 24mm;
            right: 24mm;
            bottom: 24mm;
            padding: 12px 16px;
            border-radius: 8px;
            background: #eef3f7;
            color: #3b4049;
            font-size: 11px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <main class="page">
          <header class="header">
            <div>
              <div class="brand">ScolioScan</div>
              <div class="subtitle">측정 리포트</div>
            </div>
            <div class="userBox">
              <div class="userLabel">사용자 이름</div>
              <div class="userName">${safeUserName}</div>
            </div>
          </header>

          <section>
            <h1 class="sectionTitle">측정 결과</h1>
            <table>
              <thead>
                <tr>
                  <th class="dateHeader">측정 날짜</th>
                  <th>상부 흉추</th>
                  <th>주 흉추</th>
                  <th>요추</th>
                </tr>
              </thead>
              <tbody>
                ${buildRows(measurementSets)}
              </tbody>
            </table>
          </section>

          <section class="notice">
            본 자료는 의료 진단 또는 치료 목적이 아닌 참고용 정보입니다.<br />
            정확한 진단과 치료는 의료 전문가와 상담해주세요.
          </section>
        </main>
      </body>
    </html>
  `;
}
