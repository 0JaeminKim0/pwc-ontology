# Railway 배포용 Dockerfile - Node.js 20으로 업데이트
FROM node:20-alpine

WORKDIR /app

# Alpine에서 Python과 build tools 설치 (optional dependencies용)
RUN apk add --no-cache python3 make g++ cairo-dev pango-dev giflib-dev

# package files 복사
COPY package*.json ./

# 의존성 설치 (optional dependencies 실패해도 계속 진행)
RUN npm ci --only=production --ignore-optional || npm ci --only=production --no-optional

# 소스 코드 복사
COPY . .

# dist 디렉토리 생성
RUN mkdir -p dist

# 포트 노출
EXPOSE 3000

# Railway 시작 명령어
CMD ["node", "railway-server.js"]