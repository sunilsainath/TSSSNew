$processes = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object { $_.CommandLine -match "next" -and $_.CommandLine -match "TSSS" }

foreach ($process in $processes) {
  Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
}

if (Test-Path "dev.pid") { Remove-Item "dev.pid" -Force -ErrorAction SilentlyContinue }
Write-Output "stopped dev servers"