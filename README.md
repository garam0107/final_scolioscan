# Scolioscan

Scolioscan은 척추 측만 상태를 측정하고 분석 결과를 확인할 수 있는 모바일 애플리케이션 프로젝트입니다. 프론트엔드는 React Native와 Expo Router 기반이며, 백엔드는 Python FastAPI와 MySQL, 별도 AIS API 컨테이너로 구성되어 있습니다.

## 프로젝트 구성

```text
final_scolioscan/
├─ scolioscan-expo/          # React Native + Expo 모바일 앱
├─ scolioscan-pro-fastapi/   # FastAPI 백엔드, MySQL, AIS API Docker 구성
├─ tokens/                   # 디자인 QA 및 디자인 토큰
├─ docs/                     # 배포/운영 관련 문서
└─ agents.md                 # Codex 작업 규칙
```

## 주요 기능

- 회원가입, 로그인, 비밀번호 찾기
- 2D 카메라 측정 및 스콜리오미터 측정
- 측정 결과 리포트와 추세 확인
- 척추 분석 결과와 3D 미리보기
- 알림, 문의, 계정 관리, 구독 설정
- FastAPI 기반 사용자, 측정, 분석, 알림, 문의 API
- AIS API 기반 이미지/랜드마크 분석 연동

## 기술 스택

### Frontend

- Expo SDK 54
- React 19
- React Native 0.81
- Expo Router
- TypeScript
- Axios
- Zustand
- Three.js
- Pretendard 폰트

### Backend

- Python 3.11+
- FastAPI
- SQLAlchemy
- Alembic
- MySQL 8.0
- JWT 인증
- Docker Compose

## 사전 준비

- Node.js 18 이상 권장
- npm
- Python 3.11 이상
- Docker Desktop 또는 Docker Engine
- Docker Compose

## 프론트엔드 실행

```bash
cd scolioscan-expo
npm install
npm run start
```

플랫폼별 실행 명령은 다음과 같습니다.

```bash
npm run android
npm run ios
npm run web
```

API 서버 주소는 Expo 공개 환경변수로 설정합니다.

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8001
```

모바일 기기에서 로컬 서버에 접근해야 하는 경우 `localhost` 대신 개발 PC의 내부 IP를 사용합니다.

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.190:8001
```

## 백엔드 실행

백엔드는 `scolioscan-pro-fastapi/docker-compose.yml` 기준으로 MySQL, FastAPI, AIS API를 함께 실행합니다.

```bash
cd scolioscan-pro-fastapi
docker compose up -d
```

실행 후 기본 포트는 다음과 같습니다.

| 서비스 | 설명 | 로컬 포트 |
| --- | --- | ---: |
| `db` | MySQL 8.0 | `3306` |
| `backend` | FastAPI API 서버 | `8001` |
| `ais-api` | AIS 분석 API | `8002` |

FastAPI 문서는 아래 주소에서 확인합니다.

```text
http://localhost:8001/docs
```

서비스를 종료하려면 다음 명령을 사용합니다.

```bash
docker compose down
```

## 백엔드 환경변수

`scolioscan-pro-fastapi/backend/.env` 파일을 생성하고 필요한 값을 설정합니다.

```env
SECRET_KEY=change-this-secret
DATABASE_URL=mysql+pymysql://nextvine:nextvine@db:3306/nextvine?charset=utf8mb4
DEBUG=false

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-email-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=NextVine
SMTP_SSL=false

ADMIN_EMAIL=nextvinedev@gmail.com
DAUM_ADDRESS_API_KEY=your-daum-api-key

OCTOMO_API_BASE_URL=https://api.octoverse.kr/octomo/v1/public
OCTOMO_API_KEY=
OCTOMO_API_KEY_HEADER=Authorization
OCTOMO_API_KEY_PREFIX=Octomo
OCTOMO_HTTP_TIMEOUT_SECONDS=10
OCTOMO_VERIFICATION_TTL_SECONDS=300
OCTOMO_RECIPIENT_NUMBER=

AIS_API_URL=http://ais-api:8000
UPLOAD_DIR=/app/uploads
```

## 로컬 개발 순서

1. `scolioscan-pro-fastapi/backend/.env` 파일을 준비합니다.
2. `scolioscan-pro-fastapi`에서 `docker compose up -d`를 실행합니다.
3. `http://localhost:8001/docs`에서 백엔드가 정상 실행되는지 확인합니다.
4. `scolioscan-expo`에서 `npm install`을 실행합니다.
5. `EXPO_PUBLIC_API_BASE_URL`을 개발 환경에 맞게 설정합니다.
6. `npm run start`로 Expo 개발 서버를 실행합니다.

## 품질 확인 명령

프론트엔드 린트:

```bash
cd scolioscan-expo
npm run lint
```

백엔드 마이그레이션은 Docker Compose 실행 시 `alembic upgrade head`가 자동으로 수행됩니다.

## 주요 경로

| 경로 | 설명 |
| --- | --- |
| `scolioscan-expo/app` | Expo Router 화면 라우트 |
| `scolioscan-expo/src/api` | 프론트엔드 API 클라이언트 |
| `scolioscan-expo/src/features` | 기능 단위 화면과 컴포넌트 |
| `scolioscan-expo/src/components` | 공통 컴포넌트 |
| `scolioscan-expo/src/constants` | 테마와 폰트 상수 |
| `scolioscan-pro-fastapi/backend/app/api` | FastAPI 라우터 |
| `scolioscan-pro-fastapi/backend/app/models` | SQLAlchemy 모델 |
| `scolioscan-pro-fastapi/backend/app/schemas` | Pydantic 스키마 |
| `scolioscan-pro-fastapi/backend/alembic` | DB 마이그레이션 |
| `scolioscan-pro-fastapi/AIS-API` | AIS 분석 API |

## 배포 참고

- 운영 환경에서는 `SECRET_KEY`, DB 계정, SMTP 정보, OCTOMO API 키를 실제 운영 값으로 교체해야 합니다.
- 모바일 앱의 `EXPO_PUBLIC_API_BASE_URL`은 운영 API의 HTTPS 주소를 사용해야 합니다.
- Android/iOS 빌드 전에 카메라, 위치, 이미지 선택 권한 문구를 최종 확인해야 합니다.
- 운영 서버에서는 MySQL, FastAPI, AIS API 직접 포트를 외부에 공개하지 않고 Nginx 또는 Caddy 같은 리버스 프록시와 HTTPS 구성을 권장합니다.

## 관련 문서

- `scolioscan-expo/README.md`: Expo 기본 README
- `scolioscan-pro-fastapi/README.md`: 기존 백엔드 README
- `docs/local-server-docker-ssl-guide.md`: 로컬 서버 Docker Compose 및 HTTPS 구성 참고 문서
