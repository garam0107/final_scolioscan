# 로컬 서버 Docker Compose 및 HTTPS 적용 준비 문서

## 목적

백엔드, DB, AI 서버를 로컬 Linux 서버에서 먼저 운영하고, 도메인에는 Nginx와 SSL 인증서를 적용해 `http`가 아닌 `https`로 API를 호출할 수 있게 만들기 위한 준비 항목을 정리한다.

현재 코드 기준으로는 `scolioscan-pro-fastapi/docker-compose.yml`에 MySQL, FastAPI 백엔드, AIS API가 이미 정의되어 있다. Redis는 아직 코드에서 사용되지 않으므로, 실제 기능에서 세션, 캐시, 작업 큐가 필요해지는 시점에 추가하면 된다.

## 현재 코드 기준 필요한 구성

### 서버 구성

```text
Linux 로컬 서버
├─ Docker Engine
├─ Docker Compose plugin
├─ MySQL 8.0 container
├─ FastAPI backend container
├─ AIS API container
├─ uploads volume
├─ Nginx 또는 Caddy
└─ SSL 인증서
```

### 현재 Docker Compose 서비스

현재 `scolioscan-pro-fastapi/docker-compose.yml` 기준 서비스는 다음과 같다.

| 서비스 | 역할 | 내부 포트 | 외부 포트 |
|---|---|---:|---:|
| `db` | MySQL 8.0 DB | `3306` | `3306` |
| `backend` | FastAPI API 서버 | `8000` | `8001` |
| `ais-api` | AI 분석 API 서버 | `8000` | `8002` |

운영에서는 DB 포트 `3306`을 외부 전체에 열지 않는 것이 좋다. DB 접속은 SSH 터널 또는 서버 내부 Docker 네트워크를 기준으로 제한한다.

### 백엔드 환경변수

`scolioscan-pro-fastapi/backend/app/config.py` 기준으로 최소 확인이 필요한 값은 다음과 같다.

```env
APP_NAME=NextVine API
APP_VERSION=1.0.0
DEBUG=false

DATABASE_URL=mysql+pymysql://nextvine:nextvine@db:3306/nextvine?charset=utf8mb4
SECRET_KEY=운영용_긴_랜덤_문자열

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=이메일_계정
SMTP_PASSWORD=앱_비밀번호
SMTP_FROM_EMAIL=발신_이메일
SMTP_FROM_NAME=NextVine
SMTP_SSL=false

ADMIN_EMAIL=관리자_이메일

OCTOMO_API_BASE_URL=https://api.octoverse.kr/octomo/v1/public
OCTOMO_API_KEY=문자_인증_API_KEY
OCTOMO_API_KEY_HEADER=Authorization
OCTOMO_API_KEY_PREFIX=Octomo
OCTOMO_HTTP_TIMEOUT_SECONDS=10
OCTOMO_VERIFICATION_TTL_SECONDS=300
OCTOMO_RECIPIENT_NUMBER=

AIS_API_URL=http://ais-api:8000
UPLOAD_DIR=/app/uploads
```

중요한 값:

- `SECRET_KEY`: 반드시 운영용 랜덤 값으로 교체한다.
- `DATABASE_URL`: Docker Compose 내부에서는 `db` 호스트명을 사용한다.
- `AIS_API_URL`: Docker Compose 내부에서는 `http://ais-api:8000`을 사용한다.
- `UPLOAD_DIR`: 컨테이너 재시작 후에도 파일이 유지되도록 볼륨과 연결한다.
- `DEBUG`: 운영 또는 외부 접근 환경에서는 `false`로 둔다.

### Expo 앱 API 주소

앱은 `scolioscan-expo/src/api/client.ts`에서 다음 환경변수를 사용한다.

```env
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
```

도메인에 SSL을 적용한 뒤에는 앱 빌드/실행 환경의 API 주소를 반드시 `https://...`로 맞춰야 한다.

예시:

```env
EXPO_PUBLIC_API_BASE_URL=https://api.scolioscan.example.com
```

### CORS 설정

백엔드는 `CORS_ORIGINS`를 사용한다. 앱만 사용하는 API라면 CORS 영향이 작지만, 웹 랜딩 페이지 또는 관리자 페이지에서 API를 호출한다면 HTTPS 도메인을 허용 목록에 넣어야 한다.

필요 예시:

```text
https://api.scolioscan.example.com
https://scolioscan.example.com
```

현재 `DEBUG=true`이면 모든 origin이 허용된다. 외부 접근 환경에서는 `DEBUG=false`를 기준으로 명시 허용 도메인만 사용한다.

## 로컬 서버에 Docker Compose를 사용할 때 필요한 것

### 서버 OS 및 기본 패키지

권장 OS:

- Ubuntu Server LTS

필요 패키지:

- Docker Engine
- Docker Compose plugin
- Git
- Nginx
- Certbot
- Python/Node는 컨테이너 밖에서 직접 빌드하거나 관리할 때만 필요

확인 명령:

```bash
docker --version
docker compose version
nginx -v
certbot --version
```

### 서버 사양 기준

AI API까지 같은 서버에서 돌리므로 일반 백엔드 서버보다 RAM과 CPU 여유가 필요하다.

개발 서버 최소 권장:

- CPU: 8코어 이상
- RAM: 32GB 이상
- SSD: 1TB NVMe 권장
- GPU: 현재 AIS API Dockerfile은 CPU 기반으로 실행되지만, 추론 속도가 부족하면 NVIDIA GPU 서버 구성을 별도로 검토한다.

운영에 가까운 권장:

- CPU: 12코어 이상
- RAM: 64GB 이상
- SSD: 1TB 이상
- 정기 백업용 외장 디스크 또는 NAS

### 디렉터리 구조 예시

```text
/srv/scolioscan
├─ app
│  └─ final_scolioscan
├─ data
│  ├─ mysql
│  └─ uploads
├─ backup
│  ├─ mysql
│  └─ uploads
└─ nginx
```

현재 Compose는 named volume `mysql_data`와 `./uploads`를 사용한다. 서버 운영에서는 백업 경로를 명확히 하기 위해 bind mount로 바꾸는 것도 검토할 수 있다.

예시:

```yaml
volumes:
  - /srv/scolioscan/data/mysql:/var/lib/mysql
  - /srv/scolioscan/data/uploads:/app/uploads
```

## Redis 추가가 필요한 경우

현재 코드에는 Redis 연결 코드가 없다. Redis가 필요한 경우는 다음과 같다.

- SMS 인증번호 임시 저장
- 로그인 세션 또는 refresh token 관리
- AI 분석 작업 큐
- API rate limit
- 반복 조회 캐시

Docker Compose에 추가할 예시:

```yaml
redis:
  image: redis:7-alpine
  container_name: scolioscan-redis
  command: redis-server --appendonly yes
  volumes:
    - redis_data:/data
  ports:
    - "127.0.0.1:6379:6379"
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
```

백엔드에는 Redis 클라이언트 의존성, `REDIS_URL`, 연결 실패 처리, TTL 정책을 함께 추가해야 한다.

## SSH 접속 준비

### API 서버 SSH

필요 항목:

- 서버 공인 IP 또는 내부 고정 IP
- SSH 포트
- SSH 사용자
- SSH key pair
- 방화벽에서 SSH 허용

접속 예시:

```bash
ssh -i ~/.ssh/scolioscan_api_key ubuntu@SERVER_IP
```

권장 설정:

- 비밀번호 로그인 비활성화
- root 직접 로그인 비활성화
- SSH 키 기반 로그인 사용
- SSH 포트 접근 IP 제한
- `ufw` 또는 클라우드 방화벽에서 필요한 포트만 허용

필요 포트:

| 포트 | 용도 | 외부 공개 여부 |
|---:|---|---|
| `22` | SSH | 관리자 IP만 허용 |
| `80` | HTTP 인증서 발급/리다이렉트 | 공개 |
| `443` | HTTPS API/웹 | 공개 |
| `8001` | FastAPI 직접 접근 | 가능하면 비공개 |
| `8002` | AIS API 직접 접근 | 가능하면 비공개 |
| `3306` | MySQL | 외부 공개 금지 |

### DB 서버 SSH

DB가 API 서버와 같은 서버라면 별도 DB SSH는 필요하지 않다. DB가 분리된 서버라면 SSH 터널로 접속하는 방식을 권장한다.

SSH 터널 예시:

```bash
ssh -i ~/.ssh/scolioscan_db_key -L 3307:127.0.0.1:3306 ubuntu@DB_SERVER_IP
```

로컬 DB 클라이언트 접속 정보:

```text
host: 127.0.0.1
port: 3307
user: nextvine
database: nextvine
```

DB 서버 보안 기준:

- MySQL `3306`은 외부 전체 공개 금지
- API 서버 IP 또는 Docker 내부 네트워크에서만 접근 허용
- 관리자 접속은 SSH 터널 사용
- DB 계정은 root 대신 서비스 전용 계정 사용
- 정기 백업과 복원 테스트 필요

## Nginx와 SSL 적용 준비

### 도메인 준비

필요한 DNS 레코드:

```text
api.scolioscan.example.com  A  SERVER_PUBLIC_IP
scolioscan.example.com      A  SERVER_PUBLIC_IP
```

API와 랜딩 페이지를 같은 서버에서 운영할 경우 다음처럼 나눌 수 있다.

```text
https://api.scolioscan.example.com  -> FastAPI backend
https://scolioscan.example.com      -> landing page
```

### Nginx API reverse proxy 예시

`/etc/nginx/sites-available/scolioscan-api` 예시:

```nginx
server {
    listen 80;
    server_name api.scolioscan.example.com;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 30m;
    }
}
```

활성화:

```bash
sudo ln -s /etc/nginx/sites-available/scolioscan-api /etc/nginx/sites-enabled/scolioscan-api
sudo nginx -t
sudo systemctl reload nginx
```

### Certbot으로 SSL 발급

Ubuntu 기준:

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.scolioscan.example.com
```

랜딩 페이지 도메인도 같은 서버라면 함께 발급할 수 있다.

```bash
sudo certbot --nginx -d api.scolioscan.example.com -d scolioscan.example.com
```

자동 갱신 확인:

```bash
sudo certbot renew --dry-run
```

### HTTPS 적용 후 확인

```bash
curl -I https://api.scolioscan.example.com/health
curl https://api.scolioscan.example.com/health
curl https://api.scolioscan.example.com/docs
```

정상 응답 예시:

```json
{"status":"healthy"}
```

## HTTP에서 HTTPS로 바꿀 때 필요한 작업

### 서버

- DNS A 레코드가 서버 IP를 바라보는지 확인
- 서버 방화벽에서 `80`, `443` 허용
- Nginx reverse proxy 설정
- Certbot 인증서 발급
- HTTP 요청을 HTTPS로 리다이렉트
- FastAPI health check 확인

### 백엔드

- `DEBUG=false`
- `CORS_ORIGINS`에 HTTPS 도메인 반영
- `DATABASE_URL`이 Docker 내부 DB 또는 실제 DB 주소를 바라보는지 확인
- `AIS_API_URL`이 Docker 내부 AIS API 주소를 바라보는지 확인
- `UPLOAD_DIR` 볼륨 유지 확인

### Expo 앱

- `EXPO_PUBLIC_API_BASE_URL`을 HTTPS 주소로 변경
- Android/iOS 빌드 환경변수 반영
- 로그인, 회원가입, 이미지 업로드, AI 분석 API 호출 확인

예시:

```env
EXPO_PUBLIC_API_BASE_URL=https://api.scolioscan.example.com
```

### Android cleartext 설정

현재 Expo 프로젝트에는 `withCleartextTraffic` 플러그인이 있다. 개발 중 HTTP 호출을 허용하기 위한 설정일 가능성이 높다. 운영에서는 HTTPS를 사용하므로 HTTP 주소 의존성을 제거하고, 실제 배포 앱에서는 `EXPO_PUBLIC_API_BASE_URL`이 반드시 `https://`로 시작하는지 확인한다.

## 배포 순서 제안

1. Linux 서버 준비
2. Docker, Docker Compose 설치
3. 저장소 clone 또는 배포 파일 업로드
4. `backend/.env` 작성
5. Docker Compose 실행
6. DB 마이그레이션 확인
7. `/health`, `/docs`, AIS API `/health` 확인
8. Nginx reverse proxy 설정
9. DNS A 레코드 연결
10. Certbot SSL 발급
11. Expo 앱의 `EXPO_PUBLIC_API_BASE_URL`을 HTTPS 도메인으로 변경
12. 실기기에서 로그인, 이미지 업로드, AI 분석 테스트

## 운영 전 체크리스트

- [ ] `SECRET_KEY` 운영용 값 적용
- [ ] MySQL root password 변경
- [ ] MySQL 서비스 계정 비밀번호 변경
- [ ] `.env` 파일 Git 추적 제외 확인
- [ ] DB 포트 외부 공개 차단
- [ ] API/AIS 직접 포트 외부 공개 차단
- [ ] Nginx `client_max_body_size`가 이미지 업로드 용량보다 큰지 확인
- [ ] `uploads` 볼륨 백업 경로 확인
- [ ] MySQL 백업 자동화
- [ ] SSL 자동 갱신 확인
- [ ] `/health` 모니터링 준비
- [ ] 서버 디스크 사용량 모니터링 준비
- [ ] 로그 보관 정책 설정

## 백업과 이전 준비

나중에 클라우드로 이전하려면 아래 절차가 정리되어 있어야 한다.

### MySQL 백업

```bash
docker exec nextvine-db mysqldump -u root -p nextvine > nextvine_backup.sql
```

### MySQL 복원

```bash
docker exec -i nextvine-db mysql -u root -p nextvine < nextvine_backup.sql
```

### 업로드 파일 백업

```bash
tar -czf uploads_backup.tar.gz uploads
```

### 클라우드 이전 시 바뀌는 값

```text
DATABASE_URL
AIS_API_URL
EXPO_PUBLIC_API_BASE_URL
CORS_ORIGINS
UPLOAD_DIR 또는 외부 스토리지 설정
```

## 남은 결정 사항

- 실제 운영 도메인
- API 도메인과 랜딩 페이지 도메인 분리 여부
- DB를 같은 로컬 서버에 둘지 별도 서버에 둘지
- Redis 도입 시점과 사용 목적
- 업로드 파일을 로컬 디스크에 계속 둘지 S3/GCS 같은 오브젝트 스토리지로 옮길지
- AI API를 CPU로 충분히 처리할 수 있는지, GPU 서버가 필요한지
