# NextVine - 척추 측만증 모니터링 솔루션

NextVine은 사용자의 척추를 촬영 및 측정하여 건강 정보를 제공하는 웹 애플리케이션입니다.

## 기술 스택

### Backend
- **FastAPI** - Python 웹 프레임워크
- **MySQL 8.0** - 데이터베이스
- **SQLAlchemy** - ORM
- **JWT** - 인증
- **SMTP** - 이메일 발송

### Frontend
- **React 18** - UI 라이브러리
- **React Router** - 라우팅
- **Axios** - HTTP 클라이언트
- **Chart.js** - 데이터 시각화
- **React Swipeable** - 터치 제스처

## 주요 기능

### 1. 사용자 인증
- 회원가입 (이메일, 비밀번호, 개인정보, 다음 주소 API)
- 로그인
- 비밀번호 찾기 (이메일 발송)

### 2. 온보딩
- 3페이지 슬라이드 소개
  - 척추 측만증이란?
  - 스콜리오스캔 소개
  - 사용법 안내

### 3. 메인 화면
- 광고 슬라이드 배너
- 측정 방법 선택 (2D 이미지, 3D 동영상, 척추측만계)
- 병원 추천 슬라이드
- 알림 기능
- 사이드 메뉴

### 4. Report (분석 결과)
- 척추 각도 변화 차트
- 최근 측정 지표 (Thoracic, Lumbar, Score)
- 측정 결과 목록
- 상세 결과 모달

### 5. Analysis (통합 분석)
- 통합 분석 결과 (준비 중)

### 6. More (더보기)
- 프로필 관리
- 구독 설정
- 환경 설정
- 고객센터
- 로그아웃

## 시작하기

### 사전 요구사항
- Docker & Docker Compose
- **Node.js 14.0.0 이상** (로컬 개발용, 권장: 18+)
- Python 3.11+ (로컬 개발용)

**⚠️ 중요**: 프론트엔드 실행 시 Node.js 14 미만 버전은 지원하지 않습니다. Node.js 버전을 확인하세요:
```bash
node --version
```

### 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 설정하세요:

```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env
```

다음 항목들을 수정하세요:
- `SECRET_KEY`: JWT 비밀키
- `SMTP_*`: SMTP 서버 정보
- `ADMIN_EMAIL`: 관리자 이메일
- `DAUM_ADDRESS_API_KEY`: 다음 주소 API 키

### Docker Compose로 실행

```bash
# 전체 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

서비스가 시작되면:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 로컬 개발 환경

#### Backend 개발

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 개발 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend 개발

```bash
cd frontend

# Node.js 버전 확인 (14.0.0 이상 필요)
node --version

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

**문제 해결**: SyntaxError가 발생하면 Node.js 버전을 확인하고 업그레이드하세요.
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

자세한 내용은 `frontend/SETUP.md` 참조

## 데이터베이스 스키마

### Users (사용자)
- 사용자 정보, 연락처, 주소, 설정

### Alarms (알림)
- 알림 내용, 읽음 상태

### Analysis (분석 결과)
- Thoracic, Lumbar, Score, 이미지 URL

### Subscribe (구독)
- 구독 정보, 결제 정보

자세한 스키마는 `backend/app/models/` 참조

## 배포

### Google Cloud Run 배포

```bash
# Backend 배포
cd backend
gcloud builds submit --tag gcr.io/[PROJECT-ID]/nextvine-backend
gcloud run deploy nextvine-backend --image gcr.io/[PROJECT-ID]/nextvine-backend --platform managed

# Frontend 배포
cd frontend
gcloud builds submit --tag gcr.io/[PROJECT-ID]/nextvine-frontend
gcloud run deploy nextvine-frontend --image gcr.io/[PROJECT-ID]/nextvine-frontend --platform managed
```

## 화면 구성

```
/                    - 온보딩 슬라이드
/login               - 로그인
/register            - 회원가입
/password-reset      - 비밀번호 찾기
/home                - 메인 홈
/report              - 분석 결과
/analysis            - 통합 분석
/more                - 더보기/설정
```

## 디자인 시스템

- Primary Color: `#22BCB7`
- Background: `#F9FAFB`
- Card Background: `#FFFFFF`

## API 엔드포인트

### Auth
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/password-reset` - 비밀번호 재설정

### Users
- `GET /api/users/me` - 현재 사용자 정보
- `PUT /api/users/me` - 프로필 수정
- `PUT /api/users/me/settings` - 설정 수정

### Alarms
- `GET /api/alarms/` - 알림 목록
- `GET /api/alarms/unread-count` - 읽지 않은 알림 수
- `POST /api/alarms/{id}/read` - 알림 읽음 처리
- `POST /api/alarms/read-all` - 모든 알림 읽음 처리

### Analysis
- `GET /api/analysis/` - 분석 결과 목록
- `GET /api/analysis/{id}` - 분석 결과 상세
- `POST /api/analysis/` - 분석 결과 생성
- `GET /api/analysis/types/` - 분석 타입 목록

### Subscribe
- `GET /api/subscribe/types` - 구독 플랜 목록
- `GET /api/subscribe/current` - 현재 구독 정보
- `POST /api/subscribe/` - 구독 생성
- `POST /api/subscribe/cancel` - 구독 해지

### Contact
- `POST /api/contact/` - 고객센터 문의


