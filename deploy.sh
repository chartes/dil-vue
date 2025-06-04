#!/bin/bash

echo "Starting deployment VueJS app..."

USER="lterriel"
APP_NAME="dil-vue"
BASE_REMOTE_FOLDER="/srv/webapp/"
REMOTE_APP_FOLDER="${BASE_REMOTE_FOLDER}${APP_NAME}"

install=false
dev=true

if [ "$1" == "install" ]; then
  install=true
fi

if [ "$2" == "prod" ]; then
  dev=false
fi

if [ "$install" = true ]; then
  echo "Installing npm packages..."
  npm install --legacy-peer-deps
fi

echo "Building VueJS app..."
yarn build:prod

if [ "$dev" = true ]; then
  echo "Deploying VueJS app to dev server..."
  SERVER="dev.chartes.psl.eu"
else
  echo "Deploying VueJS app to prod server..."
  SERVER="chartes.psl.eu"
fi

echo "Deploying VueJS app to server..."

sudo scp -r dist/ ${USER}@${SERVER}:${REMOTE_APP_FOLDER}

echo "Deployment VueJS app finished!"
