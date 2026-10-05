# Sync linked Supabase migration history after baseline squash.
# Marks archived versions reverted and baseline applied WITHOUT running baseline SQL.
# Requires: supabase CLI logged in and project linked.
# Usage: .\scripts\migration-repair-after-baseline.ps1
#        .\scripts\migration-repair-after-baseline.ps1 -WhatIf

param(
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$archiveDir = Join-Path $root 'supabase\migrations_archive\pre_baseline_20261011'
$baselineVersion = '20261011120000'

if (-not (Test-Path $archiveDir)) {
  Write-Error "Archive not found: $archiveDir"
}

$files = Get-ChildItem -Path $archiveDir -Filter '*.sql' | Sort-Object Name
if ($files.Count -eq 0) {
  Write-Error "No archived migrations in $archiveDir"
}

Write-Host "Will repair $($files.Count) archived versions -> reverted"
Write-Host "Then mark baseline $baselineVersion -> applied"
Write-Host ""

foreach ($f in $files) {
  $version = $f.BaseName -replace '_.*$', ''
  if ($version -notmatch '^\d{14}$') {
    Write-Warning "Skipping unexpected filename: $($f.Name)"
    continue
  }
  $cmd = "supabase migration repair --status reverted $version"
  if ($WhatIf) {
    Write-Host $cmd
  } else {
    Write-Host ">> $cmd"
    Invoke-Expression $cmd
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }
}

$applyCmd = "supabase migration repair --status applied $baselineVersion"
if ($WhatIf) {
  Write-Host $applyCmd
} else {
  Write-Host ">> $applyCmd"
  Invoke-Expression $applyCmd
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Write-Host ""
  Write-Host "Done. Run: npm run db:status"
}
