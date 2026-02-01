@echo off
setlocal ENABLEDELAYEDEXPANSION

rem Auto-run seeder for NearShare backend
rem Optional: set NEARSHARE_BASE_URL environment variable before running

set "BASE_URL=%NEARSHARE_BASE_URL%"
if "%BASE_URL%"=="" set "BASE_URL=http://localhost:8080"

set "SCRIPT_DIR=%~dp0scripts"
set "PS_SCRIPT=%SCRIPT_DIR%\seed.ps1"

if not exist "%SCRIPT_DIR%" mkdir "%SCRIPT_DIR%"

rem Generate PowerShell seeding script
> "%PS_SCRIPT%" echo # NearShare seeding script (PowerShell)
>>"%PS_SCRIPT%" echo $ErrorActionPreference = 'Stop'
>>"%PS_SCRIPT%" echo $base = '%BASE_URL%'
>>"%PS_SCRIPT%" echo Write-Host "Using base URL: $base"
>>"%PS_SCRIPT%" echo ""
>>"%PS_SCRIPT%" echo # 1) Register seeder user (admin only if backend allows)
>>"%PS_SCRIPT%" echo $registerBody = @^{
>>"%PS_SCRIPT%" echo ^  name = 'Seeder Admin'
>>"%PS_SCRIPT%" echo ^  email = 'seeder.admin@example.com'
>>"%PS_SCRIPT%" echo ^  password = 'password123'
>>"%PS_SCRIPT%" echo ^  phone = '+1 (555) 000-0000'
>>"%PS_SCRIPT%" echo ^  address = '123 Seeder St'
>>"%PS_SCRIPT%" echo ^  avatarUrl = ''
>>"%PS_SCRIPT%" echo ^  lat = 40.7128
>>"%PS_SCRIPT%" echo ^  lng = -74.0060
>>"%PS_SCRIPT%" echo ^  isAdmin = $true
>>"%PS_SCRIPT%" echo ^} ^| ConvertTo-Json -Depth 4
>>"%PS_SCRIPT%" echo try ^{ Invoke-RestMethod -Method Post -Uri "$base/api/auth/register" -ContentType 'application/json' -Body $registerBody ^| Out-Null ^} catch ^{ }
>>"%PS_SCRIPT%" echo ""
>>"%PS_SCRIPT%" echo # 2) Login and get token
>>"%PS_SCRIPT%" echo $loginBody = @^{ email = 'seeder.admin@example.com'; password = 'password123' ^} ^| ConvertTo-Json
>>"%PS_SCRIPT%" echo $loginResp = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body $loginBody
>>"%PS_SCRIPT%" echo $token = $loginResp.token
>>"%PS_SCRIPT%" echo $headers = @^{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' ^}
>>"%PS_SCRIPT%" echo ""
>>"%PS_SCRIPT%" echo # 3) Create 30 listings
>>"%PS_SCRIPT%" echo $rand = New-Object System.Random
>>"%PS_SCRIPT%" echo $categories = @('Tools','Gardening','Electronics','Skills')
>>"%PS_SCRIPT%" echo $types = @('GOODS','SKILL')
>>"%PS_SCRIPT%" echo for ($i = 1; $i -le 30; $i++) ^{
>>"%PS_SCRIPT%" echo ^  $dx = ($rand.NextDouble() - 0.5) * 0.1
>>"%PS_SCRIPT%" echo ^  $dy = ($rand.NextDouble() - 0.5) * 0.1
>>"%PS_SCRIPT%" echo ^  $hourly = [Math]::Round(5 + $rand.NextDouble() * 45, 2)
>>"%PS_SCRIPT%" echo ^  $bodyObj = @^{
>>"%PS_SCRIPT%" echo ^    title = "Seed Item $i"
>>"%PS_SCRIPT%" echo ^    description = "Auto-seeded listing number $i"
>>"%PS_SCRIPT%" echo ^    category = $categories[$rand.Next(0, $categories.Count)]
>>"%PS_SCRIPT%" echo ^    type = $types[$rand.Next(0, $types.Count)]
>>"%PS_SCRIPT%" echo ^    hourlyRate = $hourly
>>"%PS_SCRIPT%" echo ^    imageUrl = "https://picsum.photos/seed/$i/800/600"
>>"%PS_SCRIPT%" echo ^    gallery = @()
>>"%PS_SCRIPT%" echo ^    autoApprove = $true
>>"%PS_SCRIPT%" echo ^    x = [Math]::Round(40.7128 + $dx, 6)
>>"%PS_SCRIPT%" echo ^    y = [Math]::Round(-74.0060 + $dy, 6)
>>"%PS_SCRIPT%" echo ^  ^}
>>"%PS_SCRIPT%" echo ^  $body = $bodyObj ^| ConvertTo-Json -Depth 5
>>"%PS_SCRIPT%" echo ^  try ^{ Invoke-RestMethod -Method Post -Uri "$base/api/listings/" -Headers $headers -Body $body ^| Out-Null ^} catch ^{ Write-Warning "Failed to create listing ${i}: $($_.Exception.Message)" }
>>"%PS_SCRIPT%" echo ^}
>>"%PS_SCRIPT%" echo ""
>>"%PS_SCRIPT%" echo # 4) Verify seeded listings
>>"%PS_SCRIPT%" echo $page = Invoke-RestMethod -Method Get -Uri "$base/api/listings/?page=0&size=50" -Headers $headers
>>"%PS_SCRIPT%" echo Write-Host "Seed complete. Listings returned: $($page.totalElements)"

if not exist "%PS_SCRIPT%" (
  echo Failed to create PowerShell script. & exit /b 1
)

echo Running seeder with PowerShell...
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"
exit /b %ERRORLEVEL%