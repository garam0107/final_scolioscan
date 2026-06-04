# 새 Gmail 기준 GCP Cloud Run, Cloud SQL 준비 및 비용 문서

## 목적

새로 만든 Gmail 계정으로 Google Cloud Platform을 시작할 때 필요한 준비 항목, 무료 체험 기간, 무료로 사용할 수 있는 범위, 이후 예상 비용을 정리한다.

현재 전제는 다음과 같다.

```text
웹사이트/랜딩 페이지: Vercel에서 배포
Redis: 사용하지 않음
AI 서버: GPU 사용 안 함, CPU 기반 AIS API
백엔드: FastAPI
DB: MySQL
배포 방식: Cloud Run 컨테이너 + Cloud SQL
```

중요한 정리:

```text
Cloud Run에 필요한 컨테이너 이미지는 2개다.
1. Backend 컨테이너 이미지
2. AI 컨테이너 이미지

DB는 Cloud Run 컨테이너로 올리지 않고 Cloud SQL을 사용한다.
```

Cloud Run은 stateless 컨테이너 실행에 적합하고, MySQL 같은 DB는 영구 저장소와 백업이 필요한 stateful 서비스이므로 Cloud SQL을 사용하는 것이 맞다.

참고 공식 문서:

- [Google Cloud Free Program](https://cloud.google.com/free/docs/free-cloud-features)
- [Cloud Run pricing](https://cloud.google.com/run/pricing)
- [Cloud SQL pricing](https://cloud.google.com/sql/pricing)
- [Artifact Registry pricing](https://cloud.google.com/artifact-registry/pricing)
- [Cloud Run resource model](https://docs.cloud.google.com/run/docs/resource-model)
- [Cloud Run container runtime contract](https://docs.cloud.google.com/run/docs/container-contract)
- [Cloud SQL에서 Cloud Run 연결](https://cloud.google.com/sql/docs/mysql/connect-run)

## 추천 전체 구조

```text
사용자 모바일 앱
↓
Cloud Run Backend
↓
Cloud SQL MySQL

Cloud Run Backend
↓
Cloud Run AI

웹사이트/랜딩 페이지
↓
Vercel
```

서비스별 역할:

| 구성 | 서비스 | 역할 |
|---|---|---|
| 웹사이트 | Vercel | 랜딩 페이지, 웹사이트 배포 |
| API 서버 | Cloud Run | FastAPI 백엔드 실행 |
| AI 서버 | Cloud Run | AIS API CPU 추론 실행 |
| DB | Cloud SQL for MySQL | MySQL 데이터 저장 |
| 컨테이너 저장소 | Artifact Registry | Backend/AI Docker 이미지 저장 |
| 비밀값 | Secret Manager | DB 비밀번호, JWT secret, SMTP 비밀번호 관리 |
| 로그 | Cloud Logging | API 로그 확인 |
| 모니터링 | Cloud Monitoring | 에러, 응답 시간, 리소스 사용량 확인 |

## 새 Gmail로 시작할 때 필요한 것

### 계정과 결제

필요 항목:

- 새 Gmail 계정
- 본인 인증 가능한 전화번호
- 결제 수단 등록용 카드
- Google Cloud 프로젝트
- Billing 계정

Google Cloud 무료 체험을 시작하려면 결제 수단 등록이 필요하다. 무료 체험 중에는 제공된 크레딧 범위 안에서 서비스를 사용하고, 일반적으로 유료 계정으로 전환하지 않으면 자동 과금되지 않는 구조다. 그래도 실수 방지를 위해 예산 알림은 반드시 설정한다.

### 처음 해야 할 설정

1. Google Cloud Console 접속
2. 새 프로젝트 생성
3. Billing 계정 연결
4. Budget alert 설정
5. 필요한 API 활성화
6. Artifact Registry 생성
7. Cloud SQL 인스턴스 생성
8. Cloud Run Backend 서비스 생성
9. Cloud Run AI 서비스 생성
10. Vercel 도메인을 백엔드 CORS에 추가

활성화할 API:

```text
Cloud Run API
Cloud SQL Admin API
Artifact Registry API
Cloud Build API
Secret Manager API
Cloud Logging API
Cloud Monitoring API
```

## 무료 체험 기간과 무료 범위

### 신규 무료 체험 크레딧

Google Cloud 신규 고객은 공식 문서 기준으로 무료 체험 크레딧을 받을 수 있다.

```text
무료 크레딧: $300
사용 기간: 약 90일
```

Google 문서에서는 90일 또는 91일로 표현되는 경우가 있으므로, 실제 운영 계획은 안전하게 90일 기준으로 잡는다.

무료 체험 크레딧은 Cloud Run, Cloud SQL, Artifact Registry 등 Google Cloud 제품 사용 비용에 적용된다.

### Cloud Run 무료 티어

Cloud Run은 무료 체험 크레딧과 별개로 월 무료 사용량이 있다. 요청 기반 과금 기준 공식 가격표의 무료 범위는 다음과 같다.

```text
월 2,000,000 requests
월 180,000 vCPU-seconds
월 360,000 GiB-seconds memory
```

이 무료 티어는 신규 무료 체험 90일이 끝났다고 바로 사라지는 것이 아니다. 월 무료 할당량은 계속 적용되며, 초과 사용량만 과금된다.

주의:

- `min instances = 0`이면 요청이 없을 때 비용을 거의 줄일 수 있다.
- `min instances = 1`로 두면 항상 켜진 인스턴스 비용이 생긴다.
- Backend와 AI를 둘 다 Cloud Run에 올리면 두 서비스의 사용량이 같은 Billing 계정 기준으로 합산된다.

### Cloud SQL 무료 여부

Cloud SQL은 Cloud Run처럼 장기 무료 티어로 운영하는 서비스가 아니다.

Cloud SQL은 DB 인스턴스가 켜져 있는 시간, 저장공간, 백업 저장공간에 따라 비용이 발생한다. 무료 체험 기간에는 $300 크레딧에서 차감되지만, 무료 체험 기간이 끝나거나 크레딧을 다 쓰면 실제 과금 대상이 된다.

## 필요한 GCP 리소스

### Cloud Run Backend

현재 백엔드 Dockerfile:

```text
scolioscan-pro-fastapi/backend/Dockerfile
```

권장 설정:

```text
Region: asia-northeast3 또는 asia-northeast1
CPU: 1 vCPU
Memory: 512MiB ~ 1GiB
Min instances: 0
Max instances: 개발 단계에서는 1~3
Concurrency: 10~80 사이에서 테스트 후 결정
Authentication: 모바일 앱에서 공개 호출해야 하면 unauthenticated 허용
```

환경변수:

```env
DEBUG=false
DATABASE_URL=mysql+pymysql://USER:PASSWORD@/DB_NAME?unix_socket=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
AIS_API_URL=https://AI_CLOUD_RUN_URL
SECRET_KEY=운영용_랜덤값
UPLOAD_DIR=/tmp/uploads
```

### Cloud Run AI

현재 AI Dockerfile:

```text
scolioscan-pro-fastapi/AIS-API/Dockerfile
```

권장 설정:

```text
Region: Backend와 같은 리전
CPU: 2 vCPU부터 시작
Memory: 2GiB ~ 4GiB부터 시작
Min instances: 0
Max instances: 개발 단계에서는 1~2
Timeout: AI 분석 시간이 길면 기본값보다 길게 설정
Authentication: 가능하면 Backend만 호출하도록 제한
```

AI 서버는 CPU 기반 추론이므로 요청량이 많거나 이미지 분석 시간이 길어지면 Cloud Run 비용이 증가할 수 있다. 개발 단계에서는 먼저 CPU 기준 분석 시간과 동시 요청 성능을 측정한다.

### Cloud SQL MySQL

현재 Compose 기준 DB는 MySQL 8.0이다.

권장 설정:

```text
Database engine: MySQL
Version: MySQL 8.0
Region: Cloud Run과 같은 리전
Instance tier: db-f1-micro 또는 db-g1-small
Storage: SSD 10GB ~ 20GB
Backup: 활성화
Public IP: 가능하면 제한
Cloud Run 연결: Cloud SQL connection 사용
```

개발 초기에는 `db-f1-micro`로 시작할 수 있다. DB 응답이 느리거나 연결 수가 부족하면 `db-g1-small`로 올린다.

### Artifact Registry

필요 이미지:

```text
backend image
ai image
```

권장:

```text
Repository location: Cloud Run과 같은 리전
이미지 태그: latest만 쓰지 말고 날짜 또는 git commit hash 사용
오래된 이미지 정리 정책 설정
```

Artifact Registry 공식 가격표 기준으로 저장공간은 0.5GB까지 무료이고, 초과분은 GB당 월 과금된다. AI 이미지가 TensorFlow, MediaPipe 모델 파일을 포함하면 이미지 크기가 커질 수 있으므로 오래된 이미지를 정리해야 한다.

## 예상 비용

아래 금액은 개발 서버 기준의 대략적인 예상이다. 실제 금액은 리전, 환율, 부가세, 사용량, 로그량, 네트워크 전송량에 따라 달라진다.

### 무료 체험 기간 중

신규 무료 체험 크레딧이 남아 있는 동안:

```text
Cloud Run 비용: 무료 티어 초과분이 있어도 $300 크레딧에서 차감
Cloud SQL 비용: $300 크레딧에서 차감
Artifact Registry 비용: 무료 범위 초과 시 $300 크레딧에서 차감
```

즉, 초기 90일 동안은 설정을 과하게 잡지 않는다면 실제 카드 청구 없이 테스트할 가능성이 높다.

주의할 비용:

- Cloud SQL을 계속 켜두면 크레딧이 계속 줄어든다.
- AI Cloud Run이 오래 실행되거나 요청이 많으면 크레딧이 빨리 줄어든다.
- 로그가 과도하게 쌓이면 Cloud Logging 비용이 생길 수 있다.
- 이미지를 여러 번 빌드하고 오래 보관하면 Artifact Registry 저장 비용이 생길 수 있다.

### 무료 체험 종료 후 최소 개발 구성

```text
Cloud Run Backend: $0 ~ $5 / month
Cloud Run AI: $0 ~ $10 / month
Cloud SQL db-f1-micro: 약 $13 / month
Cloud SQL SSD 10GB: 약 $1.7 / month
Cloud SQL backup 10GB: 약 $0.8 / month
Artifact Registry: $0 ~ $2 / month
Logging/기타: $0 ~ $5 / month
```

예상 합계:

```text
약 $15 ~ $35 / month
한화 대략 2만 ~ 5만원대
```

### 무료 체험 종료 후 여유 개발 구성

```text
Cloud Run Backend: $0 ~ $10 / month
Cloud Run AI: $5 ~ $30 / month
Cloud SQL db-g1-small: 약 $25.6 / month
Cloud SQL SSD 20GB: 약 $3.4 / month
Cloud SQL backup 20GB: 약 $1.6 / month
Artifact Registry: $1 ~ $5 / month
Logging/기타: $0 ~ $10 / month
```

예상 합계:

```text
약 $35 ~ $85 / month
한화 대략 5만 ~ 12만원대
```

### 비용이 커질 수 있는 경우

```text
AI 분석 요청이 많음
AI 분석 1회 처리 시간이 김
Cloud Run min instances를 1 이상으로 설정
Cloud SQL 사양을 높임
Cloud SQL 저장공간이 증가
이미지 업로드 파일을 Cloud Run 내부에 저장하려고 함
Cloud Logging에 대량 로그를 남김
외부 네트워크 전송량이 많음
```

## 현재 코드 기준 주의할 점

### DB 컨테이너는 Cloud Run에 올리지 않음

현재 로컬 Docker Compose에는 MySQL 컨테이너가 있지만, GCP에서는 MySQL 컨테이너 이미지를 Cloud Run에 올리지 않는다.

GCP 기준:

```text
로컬 개발: Docker Compose MySQL container
GCP 배포: Cloud SQL MySQL
```

### 업로드 파일 저장

현재 백엔드는 `UPLOAD_DIR`에 파일을 저장한다. Cloud Run 컨테이너 파일시스템은 영구 저장소로 사용하면 안 된다.

가능한 처리:

```text
분석 중 임시 파일만 필요함
→ /tmp/uploads 사용 가능

사용자 이미지나 결과 파일을 나중에 조회해야 함
→ Cloud Storage 추가 필요
```

Cloud Storage를 추가하면 저장공간과 다운로드 트래픽 비용이 별도로 발생한다.

### CORS 설정

Vercel 웹사이트에서 API를 호출한다면 백엔드 CORS에 Vercel 도메인을 추가해야 한다.

예시:

```text
https://your-project.vercel.app
https://your-domain.com
```

Expo 앱은 `EXPO_PUBLIC_API_BASE_URL`을 Cloud Run Backend URL로 설정한다.

```env
EXPO_PUBLIC_API_BASE_URL=https://backend-service-url
```

## 권장 배포 순서

1. 새 Gmail로 Google Cloud Console 접속
2. 무료 체험 시작 및 결제 수단 등록
3. 프로젝트 생성
4. 예산 알림 설정
5. 필요한 API 활성화
6. Artifact Registry repository 생성
7. Cloud SQL MySQL 생성
8. Cloud SQL DB/user/password 생성
9. 로컬 MySQL dump 생성
10. Cloud SQL에 DB 복원
11. AI Docker 이미지 빌드 및 Artifact Registry push
12. AI Cloud Run 서비스 배포
13. AI `/health` 확인
14. Backend Docker 이미지 빌드 및 Artifact Registry push
15. Backend Cloud Run 서비스 배포
16. Backend에 Cloud SQL 연결 추가
17. Backend 환경변수와 Secret Manager 연결
18. Backend `/health`, `/docs` 확인
19. Vercel 도메인을 CORS에 추가
20. Expo 앱 API URL을 Cloud Run Backend URL로 변경
21. 로그인, 회원가입, 이미지 업로드, AI 분석 테스트

## 비용 방지 체크리스트

- [ ] Budget alert를 $10, $30, $50 구간으로 설정
- [ ] Cloud Run `min instances = 0` 확인
- [ ] Cloud Run AI `max instances`를 개발 단계에서 1~2로 제한
- [ ] Cloud SQL 인스턴스 사양을 `db-f1-micro` 또는 `db-g1-small`부터 시작
- [ ] Cloud SQL 자동 스토리지 증가 설정 확인
- [ ] Artifact Registry 오래된 이미지 정리
- [ ] Cloud Logging에 과도한 debug 로그 남기지 않기
- [ ] 사용하지 않는 Cloud Run revision 정리
- [ ] 사용하지 않는 Cloud SQL 인스턴스 삭제 또는 중지 정책 확인
- [ ] 무료 체험 종료 날짜 캘린더 등록
- [ ] 결제 계정의 Cost table을 주기적으로 확인

## 추천 결론

현재 조건에서는 GCP를 다음처럼 시작하는 것이 가장 현실적이다.

```text
Vercel: 웹사이트
Cloud Run 1: Backend
Cloud Run 2: AI CPU 서버
Cloud SQL: MySQL
Artifact Registry: Docker 이미지 저장
Secret Manager: 비밀값 관리
```

무료 체험 약 90일 동안은 $300 크레딧으로 충분히 테스트 가능할 가능성이 높다. 다만 Cloud SQL은 켜져 있는 동안 계속 비용이 발생하므로, 무료 체험 종료 후에는 최소 구성 기준 월 $15~$35, 여유 구성 기준 월 $35~$85 정도를 예상하는 것이 안전하다.
