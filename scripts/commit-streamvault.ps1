# StreamVault.cash - create the atomic commits for the BCH BLAZE 2026 work.
# Run this in YOUR OWN terminal (outside the agent sandbox), e.g.:
#   powershell -ExecutionPolicy Bypass -File .\scripts\commit-streamvault.ps1
# or a one-liner from the repo root:
#   git add -A; git commit -m "feat: StreamVault.cash - PUSD streaming vault (contract, live layer, cockpit, tests, docs)"
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Join-Path $PSScriptRoot '..')

function Assert-Ok([string]$what) {
    if ($LASTEXITCODE -ne 0) { throw "git failed (exit $LASTEXITCODE) during: $what" }
}

function Commit([string]$message, [string[]]$paths) {
    git add -A -- $paths
    Assert-Ok "add: $message"
    git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) { Write-Host "nothing to commit: $message"; return }
    git commit -q -m $message
    Assert-Ok "commit: $message"
    Write-Host "committed: $message"
}

Commit "feat(contract): StreamVault PUSD covenant + real BCH VM test suite (12 cases)" @('contracts')
Commit "build: scripts, CI workflow and gitignore" @('.gitignore', 'package.json', 'package-lock.json', '.github')
Commit "feat(app): PUSD streaming cockpit, live chain layer and StreamVault rebrand" @('src', 'index.html', 'vite.config.ts')
Commit "test: sandbox engine, address derivation and live-layer suites" @('tests')
Commit "docs: rebrand, streaming docs, 7-page deck, compliance checklist and LICENSE" @('README.md', 'LICENSE', 'docs')

Write-Host ""
git log --oneline -8
git status --short