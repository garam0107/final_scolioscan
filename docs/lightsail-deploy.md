# Lightsail Deployment Guide

이 문서는 현재 프로젝트를 AWS Lightsail 4GB Ubuntu 인스턴스 1대에 배포하는 절차를 정리한다.

기준 아키텍처:
- `Caddy`
- `backend` FastAPI API 서버
- `AIS-API` TensorFlow/TFLite 추론 서버
- `MySQL`

운영 원칙:
- 외부 공개 포트는 `80`, `443`만 사용한다.
- `backend`, `AIS-API`, `MySQL`은 Docker 내부 네트워크로만 통신한다.
- 운영용 환경변수는 서버 루트 `/opt/scolioscan/.env`에서 관리한다.
- `scolioscan-expo`는 서버 배포 대상이 아니다.

## 0. 시작 상태

이 문서는 아래 상태를 기준으로 이어진다.

- Lightsail Ubuntu 인스턴스 생성 완료
- Static IP 연결 완료
- 도메인 DNS 연결 완료
- `apt update`, `apt upgrade`, 기본 패키지 설치 완료
- Docker 설치 완료
- `/opt/scolioscan` 생성 완료
- GitHub 저장소 `git clone` 완료

저장소를 `/opt/scolioscan/repo`에 클론했다고 가정한다.

## 1. 서버 구조 맞추기

먼저 배포 루트 구조를 만든다.

```bash
cd /opt/scolioscan
mkdir -p mysql/conf.d
mkdir -p caddy
mkdir -p backups logs uploads
```

저장소에서 실제 배포 대상 폴더만 복사한다.

```bash
cp -r /opt/scolioscan/repo/scolioscan-pro-fastapi/backend /opt/scolioscan/
cp -r /opt/scolioscan/repo/scolioscan-pro-fastapi/AIS-API /opt/scolioscan/
```

복사 결과 확인:

```bash
ls -la /opt/scolioscan
ls -la /opt/scolioscan/backend
ls -la /opt/scolioscan/AIS-API
```

기대 구조:

```text
/opt/scolioscan
├─ backend/
├─ AIS-API/
├─ mysql/
│  └─ conf.d/
├─ caddy/
├─ backups/
├─ logs/
├─ uploads/
└─ repo/
```

주의:
- `scolioscan-expo`는 서버에 복사할 필요가 없다.
- `AIS-API/keypointsmodel`, `AIS-API/tflite`가 반드시 포함되어야 한다.

## 2. requirements.txt 확인

새로 만들지 말고 기존 파일을 그대로 쓴다.

확인 명령:

```bash
ls -l /opt/scolioscan/backend/requirements.txt
ls -l /opt/scolioscan/AIS-API/requirements.txt
```

필요하면 내용 확인:

```bash
cat /opt/scolioscan/backend/requirements.txt
cat /opt/scolioscan/AIS-API/requirements.txt
```

역할:
- `backend/requirements.txt`: FastAPI API 서버 의존성
- `AIS-API/requirements.txt`: TensorFlow 추론 서버 의존성



## 4. backend/.env는 운영용으로 쓰지 않기

저장소에 들어 있는 `backend/.env`는 운영용으로 그대로 사용하면 안 된다.

이유:
- 비밀키가 들어 있을 수 있다.
- 로컬 개발 기준 값일 수 있다.
- 운영에서는 `/opt/scolioscan/.env` 한 곳에서 관리하는 편이 안전하다.

확인만 하고, compose에서 직접 읽지 않도록 구성한다.

```bash
ls -l /opt/scolioscan/backend/.env
```

권장:
- 운영 시 `backend/.env`는 참고만 하고 사용하지 않는다.
- 이미 GitHub에 비밀키가 들어 있었다면 추후 키 교체가 필요하다.

## 5. MySQL 설정 파일 작성

파일 생성:

```bash
nano /opt/scolioscan/mysql/conf.d/my.cnf
```

내용:

```cnf
[mysqld]
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

max_connections=30
innodb_buffer_pool_size=256M
performance_schema=OFF

default_authentication_plugin=mysql_native_password
```

의도:
- 4GB 인스턴스에서 메모리를 과하게 쓰지 않도록 초기값을 보수적으로 유지한다.

## 6. Caddyfile 작성

파일 생성:

```bash
nano /opt/scolioscan/caddy/Caddyfile
```

예시:

```caddy
scolioscan-api.nextvinetech.com {
    reverse_proxy backend:8000
}
```

도메인은 실제 사용할 서브도메인으로 맞춘다.

전제 조건:
- 도메인이 Lightsail Static IP를 가리켜야 한다.
- Lightsail 방화벽에서 `80`, `443`이 열려 있어야 한다.

## 7. 운영용 .env 작성

파일 생성:

```bash
nano /opt/scolioscan/.env
```

예시:

```dotenv
# Timezone
TZ=Asia/Seoul

# MySQL
MYSQL_DATABASE=nextvine
MYSQL_USER=nextvine
MYSQL_PASSWORD=CHANGE_ME_DB_PASSWORD
MYSQL_ROOT_PASSWORD=CHANGE_ME_ROOT_PASSWORD

# Backend
DATABASE_URL=mysql+pymysql://nextvine:CHANGE_ME_DB_PASSWORD@mysql:3306/nextvine?charset=utf8mb4
SECRET_KEY=CHANGE_ME_SECRET_KEY
REFRESH_TOKEN_SECRET=CHANGE_ME_REFRESH_TOKEN_SECRET
SMTP_HOST=smtp.daum.net
SMTP_PORT=465
SMTP_USER=CHANGE_ME_SMTP_USER
SMTP_PASSWORD=CHANGE_ME_SMTP_PASSWORD
SMTP_FROM_EMAIL=CHANGE_ME_SMTP_FROM_EMAIL
SMTP_FROM_NAME=NextVine
SMTP_SSL=true
ADMIN_EMAIL=CHANGE_ME_ADMIN_EMAIL
OCTOMO_API_BASE_URL=https://api.octoverse.kr/octomo/v1/public
OCTOMO_API_KEY=CHANGE_ME_OCTOMO_API_KEY
OCTOMO_API_KEY_HEADER=Authorization
OCTOMO_API_KEY_PREFIX=Octomo
OCTOMO_HTTP_TIMEOUT_SECONDS=10
OCTOMO_VERIFICATION_TTL_SECONDS=300
OCTOMO_RECIPIENT_NUMBER=CHANGE_ME_OCTOMO_RECIPIENT_NUMBER
AIS_API_URL=http://ais-api:8000
AWS_ACCESS_KEY_ID=CHANGE_ME_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=CHANGE_ME_AWS_SECRET_ACCESS_KEY
AWS_REGION=ap-northeast-2
S3_BUCKET=CHANGE_ME_S3_BUCKET
UPLOAD_DIR=/app/uploads

# AIS-API model paths
KP_ARCH=/app/keypointsmodel/keypoints_architecture.json
KP_WEIGHTS=/app/keypointsmodel/keypoints_weigts.hdf5
TF_MODEL=/app/tflite/model_fp32.tflite
```

파일 권한 제한:

```bash
chmod 600 /opt/scolioscan/.env
```

랜덤 문자열 생성 예시:

```bash
openssl rand -base64 32
```

refresh token 정리 예시:

```bash
cd /opt/scolioscan/backend
python -m app.scripts.cleanup_refresh_tokens
```

cron 예시:

```bash
0 3 * * * cd /opt/scolioscan/backend && /usr/bin/python3 -m app.scripts.cleanup_refresh_tokens >> /opt/scolioscan/logs/refresh-token-cleanup.log 2>&1
```

주의:
- `DATABASE_URL`은 `mysql` 컨테이너 이름 기준으로 맞춘다.
- `AIS_API_URL`은 `http://ais-api:8000`으로 맞춘다.
- 실제 비밀값은 반드시 직접 교체한다.

## 8. backend Dockerfile 확인

현재 저장소의 `backend/Dockerfile`을 우선 사용한다.

확인:

```bash
cat /opt/scolioscan/backend/Dockerfile
```

기대 동작:
- `app.main:app`으로 실행
- 포트 `8000` 사용

현재 구조상 서버용으로 큰 틀은 유지 가능하다.

## 9. AIS-API Dockerfile 정리

파일 확인:

```bash
cat /opt/scolioscan/AIS-API/Dockerfile
```

MediaPipe 제거 후 최소 형태 예시:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

이유:
- `requirements.txt`에는 현재 MediaPipe가 없다.
- Dockerfile에만 남은 MediaPipe 설치 로직을 제거해야 깔끔하다.

## 10. docker-compose.yml 작성

파일 생성:

```bash
nano /opt/scolioscan/docker-compose.yml
```

예시:

```yaml
services:
  caddy:
    image: caddy:2
    container_name: scolioscan-caddy
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: scolioscan-backend
    restart: unless-stopped
    env_file:
      - ./.env
    depends_on:
      mysql:
        condition: service_healthy
    expose:
      - "8000"
    volumes:
      - ./uploads:/app/uploads
    command: >
      sh -c "alembic upgrade head &&
      uvicorn app.main:app --host 0.0.0.0 --port 8000"

  ais-api:
    build:
      context: ./AIS-API
      dockerfile: Dockerfile
    container_name: ais-api
    restart: unless-stopped
    env_file:
      - ./.env
    expose:
      - "8000"

  mysql:
    image: mysql:8.0
    container_name: scolioscan-mysql
    restart: unless-stopped
    env_file:
      - ./.env
    command:
      - --default-authentication-plugin=mysql_native_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/conf.d:/etc/mysql/conf.d:ro
    expose:
      - "3306"
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h localhost -u$${MYSQL_USER} -p$${MYSQL_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 10

volumes:
  mysql_data:
  caddy_data:
  caddy_config:
```

핵심 원칙:
- `caddy`만 `ports` 사용
- `backend`, `ais-api`, `mysql`은 `expose`만 사용
- `backend`의 `--reload`는 서버에서 사용하지 않는다

## 11. Compose 파일 문법 확인

```bash
cd /opt/scolioscan
docker compose config
```

이 단계에서 YAML 문법 오류를 먼저 잡는다.

## 12. 이미지 빌드

```bash
cd /opt/scolioscan
docker compose build
```

문제 발생 시 주로 확인할 것:
- `AIS-API/server.py`에 MediaPipe 코드가 남아 있는지
- `.env` 값이 비어 있지 않은지
- 모델 파일이 실제로 존재하는지

모델 파일 확인:

```bash
ls -la /opt/scolioscan/AIS-API/keypointsmodel
ls -la /opt/scolioscan/AIS-API/tflite
```

## 13. 컨테이너 실행

```bash
cd /opt/scolioscan
docker compose up -d
```

상태 확인:

```bash
docker compose ps
```

로그 확인:

```bash
docker compose logs -f caddy
docker compose logs -f backend
docker compose logs -f ais-api
docker compose logs -f mysql
```

초기 실행 시 확인 포인트:
- `mysql` healthcheck 통과
- `backend`가 `alembic upgrade head` 후 정상 기동
- `ais-api`가 모델 로딩 후 정상 기동
- `caddy`가 인증서 발급을 시도하는지

## 14. 내부 헬스체크

서버에서 직접 확인:

```bash
curl http://localhost
curl http://127.0.0.1
docker compose exec backend curl -f http://localhost:8000/docs
docker compose exec ais-api curl -f http://localhost:8000/health
```

주의:
- `backend`에 `/health`가 없다면 `/docs` 또는 원하는 API 엔드포인트로 확인한다.

## 15. 외부 HTTPS 확인

로컬 PC 또는 서버에서 확인:

```bash
curl -I https://scolioscan-api.nextvinetech.com
```

브라우저에서 확인:
- `https://scolioscan-api.nextvinetech.com/docs`

문제가 있으면 순서대로 확인:
- DNS가 Static IP를 가리키는지
- Lightsail 방화벽 `80`, `443`이 열려 있는지
- `caddy` 로그에 인증서 발급 오류가 있는지

## 16. MySQL 백업 기본 스크립트

수동 백업 예시:

```bash
docker compose exec mysql sh -c 'mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' > /opt/scolioscan/backups/db-$(date +%F-%H%M%S).sql
```

백업 파일 확인:

```bash
ls -la /opt/scolioscan/backups
```

권장:
- Lightsail 스냅샷과 별도로 `mysqldump` 보관

## 17. 운영 점검 명령

메모리:

```bash
free -h
```

디스크:

```bash
df -h
```

컨테이너 상태:

```bash
docker compose ps
```

실시간 로그:

```bash
docker compose logs -f backend
docker compose logs -f ais-api
```

프로세스 확인:

```bash
htop
```

## 18. 배포 후 수정 반영

저장소 최신화 후 다시 복사:

```bash
cd /opt/scolioscan/repo
git pull
cp -r /opt/scolioscan/repo/scolioscan-pro-fastapi/backend /opt/scolioscan/
cp -r /opt/scolioscan/repo/scolioscan-pro-fastapi/AIS-API /opt/scolioscan/
```

이미지 재빌드 및 재기동:

```bash
cd /opt/scolioscan
docker compose build
docker compose up -d
```

주의:
- `cp -r`는 기존 폴더 위에 덮어쓴다.
- 운영 중에는 수정 파일 범위를 확인하고 덮어쓰는 습관을 들인다.

## 19. 지금 구조에서 꼭 기억할 점

- `backend`와 `AIS-API`는 별도 서비스다.
- `TensorFlow`는 `AIS-API`에 있고 `backend`에 넣지 않는다.
- `Caddy`만 외부 공개한다.
- `backend/.env`는 운영 기준 파일이 아니다.
- MediaPipe 미사용이면 관련 코드와 의존성은 제거해야 한다.

## 20. 빠른 체크리스트

- [ ] `/opt/scolioscan/backend` 복사 완료
- [ ] `/opt/scolioscan/AIS-API` 복사 완료
- [ ] `AIS-API/keypointsmodel`, `AIS-API/tflite` 존재
- [ ] MediaPipe 코드 제거
- [ ] `/opt/scolioscan/mysql/conf.d/my.cnf` 작성
- [ ] `/opt/scolioscan/caddy/Caddyfile` 작성
- [ ] `/opt/scolioscan/.env` 작성
- [ ] `/opt/scolioscan/docker-compose.yml` 작성
- [ ] `docker compose config` 통과
- [ ] `docker compose build` 통과
- [ ] `docker compose up -d` 통과
- [ ] 도메인 HTTPS 접속 확인
