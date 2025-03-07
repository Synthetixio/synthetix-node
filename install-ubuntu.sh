#!/bin/bash
set -e

APP_PATH="/usr/lib/synthetix-node/synthetix-node"
if [[ -f "$APP_PATH" ]]; then
  echo "Synthetix Node is already installed at $APP_PATH"
  "$APP_PATH"
  exit 0
fi

ARCH=$(uname -m)

if [[ "$ARCH" == "x86_64" ]]; then
  DOWNLOAD_URL="https://github.com/Synthetixio/synthetix-node/releases/latest/download/synthetix-node_1.7.0_amd64.deb"
elif [[ "$ARCH" == "aarch64" ]]; then
  DOWNLOAD_URL="https://github.com/Synthetixio/synthetix-node/releases/latest/download/synthetix-node_1.7.0_arm64.deb"
else
  echo "Unsupported architecture: $ARCH"
  exit 1
fi

echo "Downloading from $DOWNLOAD_URL..."
curl -L -o SynthetixNode.deb "$DOWNLOAD_URL"

echo "Installing Synthetix Node..."
sudo dpkg -i SynthetixNode.deb
rm SynthetixNode.deb

echo "Synthetix Node installed. Starting the application..."
synthetix-node
