#!/bin/sh
set -e

if [[ -d /Applications/SynthetixNode.app ]]; then
  echo "SynthetixNode.app installed in /Applications"
  open /Applications/SynthetixNode.app
  exit 0
fi

ARCH=$(uname -m)

# Check if the system is running on ARM or x86_64 architecture
if [ "$ARCH" = "arm64" ]; then
  DOWNLOAD_URL="https://github.com/Synthetixio/snx-node/releases/latest/download/SynthetixNode-mac-arm64.zip"
elif [ "$ARCH" = "x86_64" ]; then
  DOWNLOAD_URL="https://github.com/Synthetixio/snx-node/releases/latest/download/SynthetixNode-mac-x64.zip"
else
  echo "Unsupported architecture $ARCH"
  exit 1
fi

echo "Downloading from $DOWNLOAD_URL..."
curl --location --output SynthetixNode.zip --url $DOWNLOAD_URL
unzip -q SynthetixNode.zip
rm SynthetixNode.zip
# When using curl to download a file, macOS will NOT add a quarantine attribute to the file.
# xattr -d com.apple.quarantine SynthetixNode.app
mv -v ./SynthetixNode.app /Applications

echo "SynthetixNode.app installed in /Applications"
open /Applications/SynthetixNode.app
