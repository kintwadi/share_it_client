# NearShare seeding script (PowerShell)
$ErrorActionPreference = 'Stop'
$base = 'http://localhost:8081'
Write-Host "Using base URL: $base"
""
# 1) Register seeder user (admin only if backend allows)
$registerBody = @{
  name = 'Seeder Admin'
  email = 'seeder.admin@example.com'
  password = 'password123'
  phone = '+1 (555) 000-0000'
  address = '123 Seeder St'
  avatarUrl = ''
  lat = 40.7128
  lng = -74.0060
  isAdmin = $true
} | ConvertTo-Json -Depth 4
try { Invoke-RestMethod -Method Post -Uri "$base/api/auth/register" -ContentType 'application/json' -Body $registerBody | Out-Null } catch { }
""
# 2) Login and get token
$loginBody = @{ email = 'seeder.admin@example.com'; password = 'password123' } | ConvertTo-Json
$loginResp = Invoke-RestMethod -Method Post -Uri "$base/api/auth/login" -ContentType 'application/json' -Body $loginBody
$token = $loginResp.token
$headers = @{ Authorization = "Bearer $token"; 'Content-Type' = 'application/json' }
""
# 3) Create 30 listings
$rand = New-Object System.Random
$categories = @('Tools','Gardening','Electronics','Skills')
$types = @('GOODS','SKILL')
for ($i = 1; $i -le 30; $i++) {
  $dx = ($rand.NextDouble() - 0.5) * 0.1
  $dy = ($rand.NextDouble() - 0.5) * 0.1
  $hourly = [Math]::Round(5 + $rand.NextDouble() * 45, 2)
  $bodyObj = @{
    title = "Seed Item $i"
    description = "Auto-seeded listing number $i"
    category = $categories[$rand.Next(0, $categories.Count)]
    type = $types[$rand.Next(0, $types.Count)]
    hourlyRate = $hourly
    imageUrl = "https://picsum.photos/seed/$i/800/600"
    gallery = @()
    autoApprove = $true
    x = [Math]::Round(40.7128 + $dx, 6)
    y = [Math]::Round(-74.0060 + $dy, 6)
  }
  $body = $bodyObj | ConvertTo-Json -Depth 5
  try { Invoke-RestMethod -Method Post -Uri "$base/api/listings/" -Headers $headers -Body $body | Out-Null } catch { Write-Warning "Failed to create listing ${i}: $($_.Exception.Message)" }
}
""
# 4) Verify seeded listings
$page = Invoke-RestMethod -Method Get -Uri "$base/api/listings/?page=0&size=50" -Headers $headers
Write-Host "Seed complete. Listings returned: $($page.totalElements)"
