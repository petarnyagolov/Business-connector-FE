# PowerShell скрипт за проверка на deployment

Write-Host "🔍 Checking if security fixes are deployed on xdealhub.com..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check Security Headers
Write-Host "1️⃣ Testing Security Headers..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://xdealhub.com" -Method HEAD -UseBasicParsing
    
    $headers = @{
        "Content-Security-Policy" = $false
        "X-Frame-Options" = $false
        "X-XSS-Protection" = $false
        "Strict-Transport-Security" = $false
    }
    
    foreach ($header in $response.Headers.Keys) {
        if ($headers.ContainsKey($header)) {
            $headers[$header] = $true
            Write-Host "   ✅ $header found" -ForegroundColor Green
        }
    }
    
    foreach ($key in $headers.Keys) {
        if (-not $headers[$key]) {
            Write-Host "   ❌ $key MISSING" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "   ❌ Failed to connect to xdealhub.com" -ForegroundColor Red
}

Write-Host ""
Write-Host "2️⃣ Testing SSL Certificate..." -ForegroundColor Yellow
try {
    $cert = Invoke-WebRequest -Uri "https://xdealhub.com" -UseBasicParsing
    Write-Host "   ✅ HTTPS is working" -ForegroundColor Green
} catch {
    Write-Host "   ❌ HTTPS not working" -ForegroundColor Red
}

Write-Host ""
Write-Host "3️⃣ Next Steps:" -ForegroundColor Cyan
Write-Host "   1. If headers are MISSING → Deploy the changes!" -ForegroundColor Yellow
Write-Host "   2. If headers are OK → Submit Google Safe Browsing report" -ForegroundColor Yellow
Write-Host "   3. Report URL: https://safebrowsing.google.com/safebrowsing/report_error/" -ForegroundColor Yellow
Write-Host ""
