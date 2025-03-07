$AppPath = "$Env:ProgramFiles\SynthetixNode\synthetix-node.exe"
if (Test-Path $AppPath) {
  Write-Host "SynthetixNode is already installed in $Env:ProgramFiles\SynthetixNode"
  Start-Process $AppPath
  exit 0
}

$Arch = (Get-CimInstance Win32_OperatingSystem).OSArchitecture
if ($Arch -eq "64-bit") {
  $DownloadUrl = "https://github.com/Synthetixio/synthetix-node/releases/latest/download/synthetix-node-win32-x64-1.7.0.zip"
} else {
  Write-Host "This is a 32-bit system, which is not supported"
  exit 1
}

Write-Host "Downloading from $DownloadUrl..."
$OutputZip = "$Env:TEMP\SynthetixNode.zip"
Invoke-WebRequest -Uri $DownloadUrl -OutFile $OutputZip

$DestinationPath = "$Env:ProgramFiles\SynthetixNode"
Expand-Archive -Path $OutputZip -DestinationPath $DestinationPath -Force

Remove-Item -Path $OutputZip -Force

Write-Host "Starting SynthetixNode from $DestinationPath"
Start-Process "$DestinationPath\synthetix-node.exe"
