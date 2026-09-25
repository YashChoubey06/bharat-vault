$ErrorActionPreference = 'Stop'
$manifest = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../work/backend/data/runtime/frontend-new/processes.json'))
if (!(Test-Path -LiteralPath $manifest)) { Write-Output 'No managed frontend-new servers recorded.'; exit }
$records = @(Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json | ForEach-Object { $_ })
foreach ($record in $records) {
    $process = Get-Process -Id $record.pid -ErrorAction SilentlyContinue
    if ($process -and $process.Path -eq $record.executable -and $process.StartTime.ToUniversalTime().Ticks -eq [long]$record.startTicks) {
        Stop-Process -Id $process.Id -Force
        Write-Output "Stopped frontend-new server PID $($process.Id)."
    }
}
Remove-Item -LiteralPath $manifest
