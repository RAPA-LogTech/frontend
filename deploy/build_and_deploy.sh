#!/bin/bash
# dashboard 빌드 & Docker Hub 푸시 + 서버 배포 자동화 스크립트

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

IMAGE="gurururu/logtech-dashboard:latest"
SERVER_IP="3.37.198.240"
SERVER="ubuntu@3.37.198.240"
SSH_KEY="~/keys/log-platform-key-v5.pem"

# .env.prod 존재 확인
if [[ ! -f "$DEPLOY_DIR/.env.prod" ]]; then
  echo "[ERROR] dashboard/.env.prod 파일이 없습니다."
  echo "        cp $DEPLOY_DIR/deploy/.env.prod.example $DEPLOY_DIR/.env.prod 후 값을 설정하세요."
  exit 1
fi

# 1. 빌드 + 푸시
echo "[1/4] Docker 이미지 빌드 및 푸시 (linux/amd64)..."
cd "$DEPLOY_DIR"
docker buildx build \
  --no-cache \
  --platform linux/amd64 \
  --push \
  -t $IMAGE .

# 2. 서버에서 기존 이미지 제거 후 pull
echo "[2/4] 서버에서 기존 이미지 제거 및 최신 이미지 pull..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "
  sudo docker rmi $IMAGE 2>/dev/null || true && \
  sudo docker pull $IMAGE
"

# 3. 서버로 파일 복사
echo "[3/4] 서버로 docker-compose.yml, .env.prod 복사..."
scp -i $SSH_KEY -o StrictHostKeyChecking=no \
    "$DEPLOY_DIR/docker-compose.yml" \
    $SERVER:/home/ubuntu/dashboard-compose.yml

scp -i $SSH_KEY -o StrictHostKeyChecking=no \
    "$DEPLOY_DIR/.env.prod" \
    $SERVER:/home/ubuntu/dashboard.env.prod

# 4. 서버에서 재시작
echo "[4/4] 서버에서 컨테이너 재시작..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "
  cd /home/ubuntu && \
  sudo docker stop dashboard 2>/dev/null || true && \
  sudo docker rm -f dashboard 2>/dev/null || true && \
  sudo docker compose -f dashboard-compose.yml --env-file dashboard.env.prod up -d dashboard
"

echo "✅ 배포 완료! http://$SERVER_IP:80"
