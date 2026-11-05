#!/usr/bin/env bash
# Runs Pest with the full human-readable output (the agent mode of Pest swallows fatal errors).
cd "$(dirname "$0")/../backend"
exec env -u AI_AGENT -u CLAUDECODE -u CLAUDE_CODE_ENTRYPOINT php vendor/bin/pest "$@"
