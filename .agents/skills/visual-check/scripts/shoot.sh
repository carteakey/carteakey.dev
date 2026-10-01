#!/bin/sh
# Screenshot a page in light, dark, and mobile with headless Firefox.
#   shoot.sh <outdir> <name> <path-or-url> [more paths...]
# Example: shoot.sh "$SCRATCHPAD/vc" newsletter /newsletter/ /now/
# Env: VC_BASE (default http://localhost:8081), VC_WIDTH (1280), VC_HEIGHT (900; raise for long pages)
# Output: <outdir>/<name>-<slug>-{light,dark}-desktop.png and -light-mobile.png
set -e
OUT="$1"; NAME="$2"; shift 2
[ -n "$OUT" ] && [ -n "$NAME" ] && [ "$#" -ge 1 ] || { echo "usage: shoot.sh <outdir> <name> <path-or-url>..."; exit 1; }
BASE="${VC_BASE:-http://localhost:8081}"; W="${VC_WIDTH:-1280}"; H="${VC_HEIGHT:-900}"
mkdir -p "$OUT/.prof-light" "$OUT/.prof-dark"
# Dark mode: the site follows prefers-color-scheme (theme.js). In headless Firefox the
# pref that flips it is ui.systemUsesDarkTheme; layout.css.prefers-color-scheme.content-override does NOT work here.
echo 'user_pref("ui.systemUsesDarkTheme", 0);' > "$OUT/.prof-light/user.js"
echo 'user_pref("ui.systemUsesDarkTheme", 1);' > "$OUT/.prof-dark/user.js"
curl -s -o /dev/null -m 8 "$BASE/" || { echo "dev server not reachable at $BASE (start it: see the dev-server skill)"; exit 2; }
for target in "$@"; do
  case "$target" in http*) url="$target";; *) url="$BASE$target";; esac
  slug=$(printf '%s' "$target" | sed -E 's#^https?://[^/]+##; s#[^A-Za-z0-9]+#-#g; s#^-|-$##g'); [ -n "$slug" ] || slug=home
  shot(){ # file profile width
    timeout 90 firefox --headless --no-remote --profile "$OUT/.prof-$2" --window-size="$3,$H" --screenshot "$OUT/$1" "$url" >/dev/null 2>&1 || true
    [ -s "$OUT/$1" ] && echo "$OUT/$1" || echo "FAILED $1" >&2; }
  shot "$NAME-$slug-light-desktop.png" light "$W"
  shot "$NAME-$slug-dark-desktop.png"  dark  "$W"
  shot "$NAME-$slug-light-mobile.png"  light 390
done
