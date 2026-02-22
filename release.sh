#!/usr/bin/env bash
set -euo pipefail

# release.sh — create git tag and build/push docker images
# Usage: ./release.sh <dockerhub_user>

if [ "${1-}" = "" ]; then
  echo "Usage: $0 <dockerhub_user>"
  exit 2
fi

DOCKER_USER=$1
TAG=v0.1.0

echo "Creating git tag $TAG..."
git tag -a $TAG -m "Release $TAG: task descriptions, search, filters+sorting"
git push origin $TAG

echo "Building docker image ${DOCKER_USER}/todo-saas:$TAG..."
docker build -t ${DOCKER_USER}/todo-saas:${TAG#v} .

echo "Pushing docker image..."
docker push ${DOCKER_USER}/todo-saas:${TAG#v}

echo "Tagging latest and pushing..."
docker tag ${DOCKER_USER}/todo-saas:${TAG#v} ${DOCKER_USER}/todo-saas:latest
docker push ${DOCKER_USER}/todo-saas:latest

echo "Release script finished."
