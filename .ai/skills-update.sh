#!/usr/bin/env bash
set -euo pipefail

command -v npx >/dev/null 2>&1 || {
  echo >&2 "This script requires the npx to be installed"
  exit 1
}

SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_ROOT"/..

npx skills add https://github.com/vercel-labs/agent-skills -a cursor -a codex --skill vercel-react-best-practices -p -y &
npx skills add https://github.com/anthropics/skills -a cursor -a codex --skill frontend-design -p -y
