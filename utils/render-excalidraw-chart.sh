#!/usr/bin/env bash
# Render a chart spec to a hand-drawn Excalidraw PNG plus a committable source.
# Follows the sketches skill, Part C (pinned mcp-excalidraw-server, throwaway
# headless Firefox profile, never `share`).
#
#   utils/render-excalidraw-chart.sh diagrams/now-shipping.spec.json src/static/img/diagrams/now-shipping-trend.png
#
# Writes the transparent PNG (via prepare-diagram.mjs) and diagrams/<name>.excalidraw.
set -euo pipefail

spec=$(realpath "$1")
out=$(realpath -m "$2")
repo=$(cd "$(dirname "$0")/.." && pwd)
name=$(basename "$out" .png)
work=$(mktemp -d)
port=3000

xc() { npx -y mcp-excalidraw-server@2.0.0 "$@"; }

if ss -ltn | grep -q ":$port "; then
  echo "render-excalidraw-chart: port $port is busy" >&2
  exit 1
fi

cleanup() {
  (cd "$work" && xc stop >/dev/null 2>&1) || true
  for p in $(pgrep -x firefox || true); do
    tr '\0' '\n' <"/proc/$p/environ" 2>/dev/null | grep -q "^MOZ_HEADLESS=1" &&
      tr '\0' ' ' <"/proc/$p/cmdline" 2>/dev/null | grep -q "$work" && kill -9 "$p" 2>/dev/null || true
  done
  sleep 0.5
  rm -rf "$work" 2>/dev/null || true
}
trap cleanup EXIT

node "$repo/utils/chart-to-excalidraw.mjs" "$spec" >"$work/elements.json"

cd "$work"
xc start >xc.log 2>&1
mkdir -p ffprof
(nohup firefox --headless --no-remote --profile "$work/ffprof" "http://127.0.0.1:$port" >ff.log 2>&1 &)
sleep 20
xc clear --yes >/dev/null
xc add elements.json >/dev/null
rm -f "$work/out.png"
xc screenshot --format png --out "$work/out.png" | grep -q success ||
  { echo "render-excalidraw-chart: screenshot failed (tab not connected?)" >&2; exit 1; }
xc export --out "$repo/diagrams/$name.excalidraw" >/dev/null

node "$repo/utils/prepare-diagram.mjs" "$work/out.png" "$out"
echo "render-excalidraw-chart: $out + diagrams/$name.excalidraw"
