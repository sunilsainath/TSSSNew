# Starts the dev server in the background and records its PID in dev.pid.
$job = Start-Process -FilePath "cmd" `
  -ArgumentList "/c", "npm run dev > dev.log 2>&1" `
  -WorkingDirectory "C:\Users\Administrator\Pictures\TSSS" `
  -WindowStyle Hidden `
  -PassThru

$job.Id | Out-File -FilePath "dev.pid" -Encoding ascii
Write-Output "dev server started (pid $($job.Id)); logs in dev.log"