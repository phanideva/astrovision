$ErrorActionPreference = "SilentlyContinue"

function Stop-ByPort {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Port
    )

    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if (-not $conns) {
        Write-Output "No listening process found on port $Port"
        return
    }

    $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $pids) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Write-Output "Stopped PID $pid on port $Port"
        } catch {
            Write-Output "Could not stop PID $pid on port $Port"
        }
    }
}

Stop-ByPort -Port 8000
Stop-ByPort -Port 3000

Write-Output "AstroVision localhost stop routine complete."
