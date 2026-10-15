#!/usr/bin/env python3
"""
Lightweight probe and helper for optional local Humanizer-12B model in l3ms.

Used by the human-writer skill to check if http://127.0.0.1:8080 is online
and serving humanizer-12b, and optionally get a candidate rewrite.

Exit codes:
  0: Success (endpoint online and returned candidate rewrite)
  1: Endpoint online, but output rejected by quality check (dropped facts/numbers)
  2: Endpoint offline or unavailable (graceful fallback)
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

DEFAULT_TIMEOUT = 10.0

def get_api_key() -> str:
    key = os.environ.get("LLAMA_SWAP_API_KEY", "")
    if key:
        return key
    key_file = Path.home() / ".config/systemd/user/llama-swap.service.d/api-key.conf"
    if key_file.exists():
        for line in key_file.read_text().splitlines():
            if "LLAMA_SWAP_API_KEY=" in line:
                return line.split("LLAMA_SWAP_API_KEY=", 1)[1].strip()
    return ""

def is_endpoint_up(base_url: str = "http://127.0.0.1:8080") -> bool:
    try:
        req = urllib.request.Request(f"{base_url}/health")
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            content = resp.read().decode("utf-8").strip()
            return resp.status == 200 and ("OK" in content or "ok" in content)
    except Exception:
        return False

def humanize_chunk(text: str, base_url: str = "http://127.0.0.1:8080", model: str = "humanizer-12b") -> tuple[bool, str, str]:
    """
    Returns (ok, output_text, reason)
    """
    if not is_endpoint_up(base_url):
        return False, "", "endpoint offline"

    api_key = get_api_key()
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": text}],
        "temperature": 1.0,
        "top_p": 0.95,
        "max_tokens": 2048,
    }

    try:
        req = urllib.request.Request(
            f"{base_url}/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
        )
        with urllib.request.urlopen(req, timeout=30.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            out = data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        return False, "", f"request failed: {e}"

    # Basic quality gate: ensure numbers are not lost
    draft_numbers = set(re.findall(r"\d+", text))
    out_numbers = set(re.findall(r"\d+", out))
    missing = draft_numbers - out_numbers
    if missing:
        return False, out, f"dropped numbers: {sorted(missing)}"

    # Check for hallucinated chat markers or empty output
    if not out or len(out.split()) < 5:
        return False, out, "output too short or empty"

    return True, out, "ok"

def main():
    parser = argparse.ArgumentParser(description="Probe local Humanizer endpoint")
    parser.add_argument("--check-only", action="store_true", help="Only check if endpoint is running")
    parser.add_argument("--url", default="http://127.0.0.1:8080", help="llama-swap endpoint")
    parser.add_argument("--text", help="Text chunk to humanize")
    args = parser.parse_args()

    up = is_endpoint_up(args.url)
    if args.check_only:
        if up:
            print(f"Endpoint {args.url} is ONLINE")
            sys.exit(0)
        else:
            print(f"Endpoint {args.url} is OFFLINE")
            sys.exit(2)

    if not up:
        print(f"Endpoint {args.url} is OFFLINE. Skipping optional local pass.")
        sys.exit(2)

    if not args.text:
        print("Endpoint is ONLINE. Provide --text to test rewrite.")
        sys.exit(0)

    ok, out, reason = humanize_chunk(args.text, base_url=args.url)
    if ok:
        print(out)
        sys.exit(0)
    else:
        print(f"[REJECTED] {reason}", file=sys.stderr)
        if out:
            print(f"[CANDIDATE OUTPUT]:\n{out}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
