export type AgreementKey =
  | 'terms'
  | 'privacy'
  | 'sensitive'
  | 'marketing'
  | 'external';

export type AgreementItem = {
  key: AgreementKey;
  required: boolean;
  label: string;
  body: string;
};

export const AGREEMENTS: AgreementItem[] = [
  {
    key: 'terms',
    required: true,
    label: '(필수) 이용 약관 동의',
    body: '본 약관은 ScolioScan(이하 "회사")가 제공하는 서비스의 이용 조건과 절차, 회사와 이용자 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.\n\n제1조 (목적)\n본 약관은 회원이 회사의 서비스를 이용함에 있어 회사와 회원 사이의 권리, 의무 및 책임사항, 서비스 이용 조건 및 절차 등 기본적인 사항을 정함을 목적으로 합니다.\n\n제2조 (정의)\n1. "서비스"란 회사가 제공하는 척추 측만증 분석 및 관련 모바일/웹 기반 서비스를 의미합니다.\n2. "회원"이란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 자를 말합니다.\n\n* 본 문구는 임시 자리이며 실제 약관 본문으로 교체되어야 합니다.',
  },
  {
    key: 'privacy',
    required: true,
    label: '(필수) 개인정보 수집 및 이용 동의',
    body: '회사는 다음과 같이 개인정보를 수집·이용합니다.\n\n1. 수집 항목: 이름, 이메일, 휴대전화번호, 생년월일, 성별\n2. 수집·이용 목적: 회원 식별, 서비스 제공, 본인 인증, 고객 문의 응대\n3. 보유·이용 기간: 회원 탈퇴 시까지 (관련 법령에 따른 보관 의무 기간 포함)\n\n동의를 거부할 권리가 있으며, 거부 시 서비스 이용이 제한될 수 있습니다.\n\n* 본 문구는 임시 자리이며 실제 약관 본문으로 교체되어야 합니다.',
  },
  {
    key: 'sensitive',
    required: true,
    label: '(필수) 민감정보 수집 및 이용 동의',
    body: '회사는 척추 측만증 분석 서비스 제공을 위하여 아래와 같은 민감정보를 수집·이용합니다.\n\n1. 수집 항목: 척추 측정 결과(흉추/요추 각도), 측정 이미지, 자세 분석 데이터\n2. 수집·이용 목적: AI 기반 척추 분석, 추세 추적, 개인 맞춤 리포트 제공\n3. 보유·이용 기간: 회원 탈퇴 시까지\n\n민감정보 처리에 대한 동의를 거부할 권리가 있으며, 거부 시 핵심 분석 기능 이용이 제한됩니다.\n\n* 본 문구는 임시 자리이며 실제 약관 본문으로 교체되어야 합니다.',
  },
  {
    key: 'marketing',
    required: false,
    label: '(선택) 이벤트 및 마케팅 이용 약관 동의',
    body: '회사는 회원에게 새로운 서비스, 이벤트, 프로모션 정보를 제공하기 위해 마케팅 정보를 발송할 수 있습니다.\n\n1. 발송 채널: 이메일, SMS, 앱 푸시 알림\n2. 발송 내용: 신규 기능 안내, 할인/프로모션, 사용자 설문\n3. 동의 철회: 마이페이지에서 언제든지 철회 가능\n\n선택 항목이므로 동의하지 않아도 서비스 이용에 제한이 없습니다.\n\n* 본 문구는 임시 자리이며 실제 약관 본문으로 교체되어야 합니다.',
  },
  {
    key: 'external',
    required: false,
    label: '(선택) 외부 서비스 연동 동의',
    body: '회사는 회원의 편의를 위하여 외부 서비스(예: 의료기관 예약, 헬스 앱 연동 등)와의 연동 기능을 제공할 수 있습니다.\n\n1. 연동 대상: 제휴 의료기관, 건강관리 플랫폼\n2. 공유 정보: 회원이 명시적으로 선택한 측정 결과 및 기본 회원 정보\n3. 동의 철회: 마이페이지 > 외부 연동 관리에서 언제든지 해제 가능\n\n선택 항목이므로 동의하지 않아도 서비스 이용에 제한이 없습니다.\n\n* 본 문구는 임시 자리이며 실제 약관 본문으로 교체되어야 합니다.',
  },
];

export type AgreementState = Record<AgreementKey, boolean>;

export const initialAgreementState: AgreementState = {
  terms: false,
  privacy: false,
  sensitive: false,
  marketing: false,
  external: false,
};

export const getRequiredKeys = () =>
  AGREEMENTS.filter((item) => item.required).map((item) => item.key);

export const isAllRequiredAgreed = (state: AgreementState) =>
  getRequiredKeys().every((key) => state[key]);

export const isAllAgreed = (state: AgreementState) =>
  AGREEMENTS.every((item) => state[item.key]);
