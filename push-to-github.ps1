# GitHub API Push Script
# Pushes the font-finder project to GitHub via the REST API (bypassing git protocol)

param(
    [string]$Token,
    [string]$Owner = "sourmilka",
    [string]$Repo = "Website-font-finder",
    [string]$Branch = "main",
    [string]$ProjectDir
)

$ErrorActionPreference = "Stop"
$headers = @{
    Authorization = "Bearer $Token"
    Accept = "application/vnd.github+json"
    "Content-Type" = "application/json"
}
$baseUrl = "https://api.github.com/repos/$Owner/$Repo"

Write-Host "=== GitHub API Push ===" -ForegroundColor Cyan
Write-Host "Repo: $Owner/$Repo"
Write-Host "Branch: $Branch"
Write-Host "Project: $ProjectDir"
Write-Host ""

# Step 1: Get the list of files to push (respecting .gitignore via git ls-files)
Set-Location $ProjectDir
$files = git ls-files --cached 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: git ls-files failed" -ForegroundColor Red
    exit 1
}
$fileList = $files -split "`n" | Where-Object { $_.Trim() -ne "" }
Write-Host "Files to push: $($fileList.Count)" -ForegroundColor Green

# Step 2: Get current commit SHA
$refResp = Invoke-RestMethod -Uri "$baseUrl/git/ref/heads/$Branch" -Headers $headers
$parentSha = $refResp.object.sha
Write-Host "Parent commit: $parentSha"

# Step 3: Create blobs for all files
$treeEntries = @()
$total = $fileList.Count
$i = 0

foreach ($file in $fileList) {
    $i++
    $filePath = Join-Path $ProjectDir $file
    
    if (-not (Test-Path $filePath)) {
        Write-Host "  SKIP (not found): $file" -ForegroundColor Yellow
        continue
    }

    # Determine if binary
    $ext = [System.IO.Path]::GetExtension($file).ToLower()
    $binaryExts = @(".woff", ".woff2", ".ttf", ".otf", ".eot", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp")
    $isBinary = $binaryExts -contains $ext

    try {
        if ($isBinary) {
            # Base64 encode binary files
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $base64 = [Convert]::ToBase64String($bytes)
            $blobBody = @{
                content = $base64
                encoding = "base64"
            } | ConvertTo-Json
        } else {
            # Text files as UTF-8
            $content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)
            $blobBody = @{
                content = $content
                encoding = "utf-8"
            } | ConvertTo-Json -Depth 1
        }

        $blob = Invoke-RestMethod -Uri "$baseUrl/git/blobs" -Method Post -Headers $headers -Body $blobBody
        
        $treeEntries += @{
            path = $file.Replace("\", "/")
            mode = "100644"
            type = "blob"
            sha = $blob.sha
        }

        if ($i % 10 -eq 0 -or $i -eq $total) {
            Write-Host "  [$i/$total] Uploaded: $file" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ERROR uploading $file : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Blobs created: $($treeEntries.Count)" -ForegroundColor Green

# Step 4: Create tree
Write-Host "Creating tree..."
$treeBody = @{
    tree = $treeEntries
} | ConvertTo-Json -Depth 5
$tree = Invoke-RestMethod -Uri "$baseUrl/git/trees" -Method Post -Headers $headers -Body $treeBody
Write-Host "Tree SHA: $($tree.sha)"

# Step 5: Create commit
Write-Host "Creating commit..."
$commitBody = @{
    message = "feat: FontFinder - professional font discovery and download app`n`n- URL scanner for any website (Google Fonts, Adobe, Custom)`n- Live font preview in grid cards`n- Font preview modal with character map`n- Font comparison (side-by-side)`n- Bulk ZIP download`n- Individual font download`n- Favorites and scan history`n- Search, filter, sort fonts`n- Export JSON/CSS`n- Dark/Light/System theme`n- Keyboard shortcuts`n- Comprehensive server logging`n- Health check and logs API`n- SEO with OpenGraph metadata"
    tree = $tree.sha
    parents = @($parentSha)
} | ConvertTo-Json
$commit = Invoke-RestMethod -Uri "$baseUrl/git/commits" -Method Post -Headers $headers -Body $commitBody
Write-Host "Commit SHA: $($commit.sha)"

# Step 6: Update branch ref
Write-Host "Updating branch ref..."
$refBody = @{
    sha = $commit.sha
    force = $true
} | ConvertTo-Json
$ref = Invoke-RestMethod -Uri "$baseUrl/git/refs/heads/$Branch" -Method Patch -Headers $headers -Body $refBody
Write-Host ""
Write-Host "=== SUCCESS ===" -ForegroundColor Green
Write-Host "Pushed to https://github.com/$Owner/$Repo"
Write-Host "Commit: $($commit.sha)"
Write-Host "Branch: $Branch"
