# build-and-run.ps1

# 1. Build Angular production
Write-Host "Building Angular production..."
npm run build -- --configuration production --output-path=prod-build

# Check if build was successful
if ($LASTEXITCODE -ne 0) {
    Write-Error "Angular build failed!"
    exit 1
}

Write-Host "Build successful!"

$nginxRoot = "C:\nginx"
$nginxConf = "$nginxRoot\conf\nginx.conf"
$nginxLogs = "$nginxRoot\logs"

# Check if nginx exists
if (-Not (Test-Path "$nginxRoot\nginx.exe")) {
    Write-Error "nginx.exe not found at $nginxRoot\nginx.exe"
    exit 1
}

if (-Not (Test-Path $nginxConf)) {
    Write-Error "nginx.conf not found at $nginxConf"
    exit 1
}

if (-Not (Test-Path $nginxLogs)) {
    Write-Host "Creating logs directory..."
    New-Item -ItemType Directory -Path $nginxLogs | Out-Null
}

# 2. Stop any running nginx processes
Write-Host "Stopping any running nginx processes..."
Get-Process nginx -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Alternative method using nginx command
try {
    & "$nginxRoot\nginx.exe" -s quit 2>$null
    Start-Sleep -Seconds 2
} catch {
    # Ignore errors if nginx is not running
}

# 3. Start nginx
Write-Host "Starting nginx..."
try {
    Push-Location $nginxRoot
    & "$nginxRoot\nginx.exe" -p $nginxRoot -c conf/nginx.conf
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Nginx started successfully!" -ForegroundColor Green
        Write-Host "Server running on: http://localhost:8080" -ForegroundColor Cyan
        Write-Host "You can now run: ngrok http 8080" -ForegroundColor Yellow
    } else {
        Write-Error "Failed to start nginx!"
        exit 1
    }
} catch {
    Write-Error "Error starting nginx: $_"
    exit 1
} finally {
    Pop-Location
}
