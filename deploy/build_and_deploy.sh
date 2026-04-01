#!/bin/bash
# dashboard 빌드 & Docker Hub 푸시 + 서버 배포 자동화 스크립트

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(dirname "$SCRIPT_DIR")"

IMAGE="gurururu/logtech-dashboard:latest"
SERVER_IP="43.203.54.34"
SERVER="ubuntu@43.203.54.34"
SSH_KEY="$HOME/keys/log-platform-key-v5.pem"

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
echo "[3/4] 서버로 docker-compose.yml 복사..."
scp -i $SSH_KEY -o StrictHostKeyChecking=no \
    "$DEPLOY_DIR/docker-compose.yml" \
  $SERVER:/tmp/dashboard-compose.yml

ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "
  sudo install -o ubuntu -g ubuntu -m 644 /tmp/dashboard-compose.yml /home/ubuntu/dashboard-compose.yml
"

# 4. 서버에서 재시작
echo "[4/4] 서버에서 컨테이너 재시작..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "
  cd /home/ubuntu && \
  sudo docker stop dashboard 2>/dev/null || true && \
  sudo docker rm -f dashboard 2>/dev/null || true && \
  sudo docker compose -f dashboard-compose.yml up -d dashboard
"

echo "✅ 배포 완료! http://$SERVER_IP:80"
