# NextVine Frontend Setup Guide

## Node.js 버전 요구사항

이 프로젝트는 **Node.js 14.0.0 이상**이 필요합니다.

### Node.js 버전 확인

```bash
node --version
```

만약 Node.js 버전이 14 미만이라면 업그레이드가 필요합니다.

### Node.js 업그레이드 방법

#### 방법 1: nvm 사용 (권장)

```bash
# nvm 설치 확인
nvm --version

# 최신 LTS 버전 설치
nvm install --lts

# 설치한 버전 사용
nvm use --lts

# 기본 버전으로 설정
nvm alias default node
```

#### 방법 2: 직접 설치

- [Node.js 공식 웹사이트](https://nodejs.org/)에서 LTS 버전 다운로드
- 권장 버전: Node.js 18.x 이상

## 설치 및 실행

### 1. 의존성 설치

```bash
cd frontend

# node_modules 폴더가 있다면 삭제
rm -rf node_modules package-lock.json

# 의존성 재설치
npm install
```

### 2. 개발 서버 실행

```bash
npm start
```

서버가 시작되면 http://localhost:3000 에서 접속 가능합니다.

### 3. 프로덕션 빌드

```bash
npm run build
```

## 문제 해결

### SyntaxError 발생 시

```bash
# 1. Node.js 버전 확인
node --version

# 2. 14.0.0 미만이면 업그레이드 필요
# 3. node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 캐시 문제 시

```bash
# npm 캐시 정리
npm cache clean --force

# 재설치
rm -rf node_modules package-lock.json
npm install
```

## Docker 사용 시

Docker를 사용하면 Node.js 버전 문제가 자동으로 해결됩니다:

```bash
# 프로젝트 루트에서
docker-compose up frontend
```
