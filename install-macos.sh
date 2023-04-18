#!/bin/sh
set -e

ARCH=$(uname -m)

# Check if the system is running on ARM or x86_64 architecture
if [ "$ARCH" = "arm64" ]; then
  DOWNLOAD_URL="https://github.com/Synthetixio/snx-node/releases/latest/download/SynthetixNode-1.1.0-arm64-mac.zip"
elif [ "$ARCH" = "x86_64" ]; then
  DOWNLOAD_URL="https://github.com/Synthetixio/snx-node/releases/latest/download/SynthetixNode-1.1.0-mac.zip"
else
  echo "Unsupported architecture $ARCH"
  exit 1
fi

echo Downloading from $DOWNLOAD_URL...
curl --location --output SynthetixNode.zip --url $DOWNLOAD_URL
unzip -q SynthetixNode.zip
rm SynthetixNode.zip
# When using curl to download a file, macOS will NOT add a quarantine attribute to the file.
# xattr -d com.apple.quarantine SynthetixNode.app
mv -f ./SynthetixNode.app /Applications/SynthetixNode.app
echo SynthetixNode.app installed in /Applications
