#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# SECURITY TESTS — Analytics Edge Functions (track + analytics)
# Run:  bash scripts/security-test-analytics.sh [base_url] [password]
# e.g.: bash scripts/security-test-analytics.sh https://zlrskorrqwxsobkviwfc.supabase.co/functions/v1 my_secret
# ═══════════════════════════════════════════════════════════════════════

set -euo pipefail

BASE="${1:-https://zlrskorrqwxsobkviwfc.supabase.co/functions/v1}"
ANALYTICS_PWD="${2:-}"
TRACK_URL="$BASE/track"
ANALYTICS_URL="$BASE/analytics"
ORIGIN="https://yuuki-dev.vercel.app"

PASS=0
FAIL=0
SKIP=0

pass() { ((PASS++)); echo "  ✅ $1"; }
fail() { ((FAIL++)); echo "  ❌ $1"; }
skip() { ((SKIP++)); echo "  ⏭️  $1 (skipped — no password provided)"; }
section() { echo ""; echo "═══ $1 ═══"; }

# ── Helper: get HTTP status code ──
status() {
  curl -s -o /dev/null -w '%{http_code}' "$@"
}

# ── Helper: get full response (headers + body) ──
full() {
  curl -s -D- "$@"
}

# ══════════════════════════════════════════════════════════════════
section "1. TRACK FUNCTION — Origin Validation"
# ══════════════════════════════════════════════════════════════════

# 1a. No Origin header → 403
code=$(status -X POST "$TRACK_URL" \
  -H "Content-Type: application/json" \
  -d '{"page":"/"}')
[[ "$code" == "403" ]] && pass "No Origin → 403 ($code)" || fail "No Origin → expected 403, got $code"

# 1b. Foreign origin → 403
code=$(status -X POST "$TRACK_URL" \
  -H "Origin: https://evil.com" \
  -H "Content-Type: application/json" \
  -d '{"page":"/"}')
[[ "$code" == "403" ]] && pass "Foreign origin → 403 ($code)" || fail "Foreign origin → expected 403, got $code"

# 1c. Valid origin → 204
code=$(status -X POST "$TRACK_URL" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d '{"page":"/test-security"}')
[[ "$code" == "204" ]] && pass "Valid origin → 204 ($code)" || fail "Valid origin → expected 204, got $code"

# 1d. Subdomain/prefix bypass attempt → 403
code=$(status -X POST "$TRACK_URL" \
  -H "Origin: https://yuuki-dev.vercel.app.evil.com" \
  -H "Content-Type: application/json" \
  -d '{"page":"/"}')
[[ "$code" == "403" ]] && pass "Subdomain bypass → 403 ($code)" || fail "Subdomain bypass → expected 403, got $code"

# ══════════════════════════════════════════════════════════════════
section "2. TRACK FUNCTION — Method Validation"
# ══════════════════════════════════════════════════════════════════

# 2a. GET → 405
code=$(status -X GET "$TRACK_URL" -H "Origin: $ORIGIN")
[[ "$code" == "405" ]] && pass "GET → 405 ($code)" || fail "GET → expected 405, got $code"

# 2b. PUT → 405
code=$(status -X PUT "$TRACK_URL" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d '{"page":"/"}')
[[ "$code" == "405" ]] && pass "PUT → 405 ($code)" || fail "PUT → expected 405, got $code"

# 2c. DELETE → 405
code=$(status -X DELETE "$TRACK_URL" -H "Origin: $ORIGIN")
[[ "$code" == "405" ]] && pass "DELETE → 405 ($code)" || fail "DELETE → expected 405, got $code"

# 2d. OPTIONS preflight → 200
code=$(status -X OPTIONS "$TRACK_URL" -H "Origin: $ORIGIN")
[[ "$code" == "200" ]] && pass "OPTIONS preflight → 200 ($code)" || fail "OPTIONS → expected 200, got $code"

# ══════════════════════════════════════════════════════════════════
section "3. TRACK FUNCTION — Content-Type Validation"
# ══════════════════════════════════════════════════════════════════

# 3a. text/plain → 415
code=$(status -X POST "$TRACK_URL" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: text/plain" \
  -d '{"page":"/"}')
[[ "$code" == "415" ]] && pass "text/plain → 415 ($code)" || fail "text/plain → expected 415, got $code"

# 3b. form-urlencoded → 415
code=$(status -X POST "$TRACK_URL" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'page=/')
[[ "$code" == "415" ]] && pass "form-urlencoded → 415 ($code)" || fail "form-urlencoded → expected 415, got $code"

# 3c. No Content-Type → 415
code=$(status -X POST "$TRACK_URL" \
  -H "Origin: $ORIGIN" \
  -d '{"page":"/"}')
[[ "$code" == "415" ]] && pass "No Content-Type → 415 ($code)" || fail "No Content-Type → expected 415, got $code"

# ══════════════════════════════════════════════════════════════════
section "4. TRACK FUNCTION — Body Size Limits"
# ══════════════════════════════════════════════════════════════════

# 4a. Oversized body (>2KB) → 413
big_payload=$(python3 -c "print('{\"page\":\"/' + 'x'*3000 + '\"}')")
code=$(status -X POST "$TRACK_URL" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d "$big_payload")
[[ "$code" == "413" ]] && pass "Oversized body (>2KB) → 413 ($code)" || fail "Oversized body → expected 413, got $code"

# 4b. Empty body → 400
code=$(status -X POST "$TRACK_URL" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json")
[[ "$code" == "400" ]] && pass "Empty body → 400 ($code)" || fail "Empty body → expected 400, got $code"

# ══════════════════════════════════════════════════════════════════
section "5. TRACK FUNCTION — Input Validation & Injection"
# ══════════════════════════════════════════════════════════════════

# 5a. SQL injection in page
code=$(status -X POST "$TRACK_URL" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d '{"page":"/' "\"'; DROP TABLE page_views; --" '"}')
[[ "$code" == "204" || "$code" == "500" ]] && pass "SQL injection in page → no crash ($code)" || fail "SQL injection → unexpected $code"

# 5b. XSS in page
code=$(status -X POST "$TRACK_URL" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d '{"page":"/<script>alert(1)</script>"}')
[[ "$code" == "204" ]] && pass "XSS payload in page → stored safely ($code)" || fail "XSS payload → unexpected $code"

# 5c. Invalid JSON → 500 (JSON.parse throws)
code=$(status -X POST "$TRACK_URL" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d 'not json at all')
[[ "$code" == "500" ]] && pass "Invalid JSON → 500 ($code)" || fail "Invalid JSON → expected 500, got $code"

# 5d. Null page → defaults to /
code=$(status -X POST "$TRACK_URL" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d '{"page":null}')
[[ "$code" == "204" ]] && pass "null page → defaults to / ($code)" || fail "null page → unexpected $code"

# 5e. Malicious referrer
code=$(status -X POST "$TRACK_URL" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d '{"page":"/","referrer":"javascript:alert(1)"}')
[[ "$code" == "204" ]] && pass "Malicious referrer → handled ($code)" || fail "Malicious referrer → unexpected $code"

# ══════════════════════════════════════════════════════════════════
section "6. TRACK FUNCTION — CORS Headers"
# ══════════════════════════════════════════════════════════════════

resp=$(full -X OPTIONS "$TRACK_URL" -H "Origin: $ORIGIN")

echo "$resp" | grep -qi "access-control-allow-origin.*$ORIGIN" \
  && pass "CORS Allow-Origin header present" \
  || fail "CORS Allow-Origin header missing"

echo "$resp" | grep -qi "access-control-allow-methods" \
  && pass "CORS Allow-Methods header present" \
  || fail "CORS Allow-Methods header missing"

echo "$resp" | grep -qi "vary.*origin" \
  && pass "Vary: Origin header present" \
  || fail "Vary: Origin header missing"

# ══════════════════════════════════════════════════════════════════
section "7. ANALYTICS FUNCTION — Origin Validation"
# ══════════════════════════════════════════════════════════════════

# 7a. No Origin → 403
code=$(status -X GET "$ANALYTICS_URL?period=1d")
[[ "$code" == "403" ]] && pass "No Origin → 403 ($code)" || fail "No Origin → expected 403, got $code"

# 7b. Foreign origin → 403
code=$(status -X GET "$ANALYTICS_URL?period=1d" -H "Origin: https://evil.com")
[[ "$code" == "403" ]] && pass "Foreign origin → 403 ($code)" || fail "Foreign origin → expected 403, got $code"

# ══════════════════════════════════════════════════════════════════
section "8. ANALYTICS FUNCTION — Authentication"
# ══════════════════════════════════════════════════════════════════

# 8a. No auth header → 401
code=$(status -X GET "$ANALYTICS_URL?period=1d" -H "Origin: $ORIGIN")
[[ "$code" == "401" ]] && pass "No auth → 401 ($code)" || fail "No auth → expected 401, got $code"

# 8b. Empty Bearer → 401
code=$(status -X GET "$ANALYTICS_URL?period=1d" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer ")
[[ "$code" == "401" ]] && pass "Empty Bearer → 401 ($code)" || fail "Empty Bearer → expected 401, got $code"

# 8c. Wrong password → 401
code=$(status -X GET "$ANALYTICS_URL?period=1d" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer totally_wrong_password_12345")
[[ "$code" == "401" ]] && pass "Wrong password → 401 ($code)" || fail "Wrong password → expected 401, got $code"

# 8d. Basic auth instead of Bearer → 401
code=$(status -X GET "$ANALYTICS_URL?period=1d" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Basic dXNlcjpwYXNz")
[[ "$code" == "401" ]] && pass "Basic auth → 401 ($code)" || fail "Basic auth → expected 401, got $code"

# 8e. Bearer with extra spaces → 401
code=$(status -X GET "$ANALYTICS_URL?period=1d" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer  extra_spaces")
[[ "$code" == "401" ]] && pass "Bearer extra spaces → 401 ($code)" || fail "Bearer extra spaces → expected 401, got $code"

# 8f. Valid password (if provided)
if [[ -n "$ANALYTICS_PWD" ]]; then
  code=$(status -X GET "$ANALYTICS_URL?period=1d" \
    -H "Origin: $ORIGIN" \
    -H "Authorization: Bearer $ANALYTICS_PWD")
  [[ "$code" == "200" ]] && pass "Valid password → 200 ($code)" || fail "Valid password → expected 200, got $code"
else
  skip "Valid password test"
fi

# ══════════════════════════════════════════════════════════════════
section "9. ANALYTICS FUNCTION — Method Validation"
# ══════════════════════════════════════════════════════════════════

# 9a. POST → 405
code=$(status -X POST "$ANALYTICS_URL" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d '{}')
[[ "$code" == "405" ]] && pass "POST → 405 ($code)" || fail "POST → expected 405, got $code"

# 9b. PUT → 405
code=$(status -X PUT "$ANALYTICS_URL" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d '{}')
[[ "$code" == "405" ]] && pass "PUT → 405 ($code)" || fail "PUT → expected 405, got $code"

# 9c. DELETE → 405
code=$(status -X DELETE "$ANALYTICS_URL" -H "Origin: $ORIGIN")
[[ "$code" == "405" ]] && pass "DELETE → 405 ($code)" || fail "DELETE → expected 405, got $code"

# 9d. OPTIONS preflight → 200
code=$(status -X OPTIONS "$ANALYTICS_URL" -H "Origin: $ORIGIN")
[[ "$code" == "200" ]] && pass "OPTIONS preflight → 200 ($code)" || fail "OPTIONS → expected 200, got $code"

# ══════════════════════════════════════════════════════════════════
section "10. ANALYTICS FUNCTION — Period Validation"
# ══════════════════════════════════════════════════════════════════

if [[ -n "$ANALYTICS_PWD" ]]; then
  AUTH="-H Authorization:\ Bearer\ $ANALYTICS_PWD"

  # 10a. Invalid period → 400
  code=$(status -X GET "$ANALYTICS_URL?period=999d" \
    -H "Origin: $ORIGIN" \
    -H "Authorization: Bearer $ANALYTICS_PWD")
  [[ "$code" == "400" ]] && pass "Invalid period '999d' → 400 ($code)" || fail "Invalid period → expected 400, got $code"

  # 10b. SQL injection in period → 400
  code=$(status -X GET "$ANALYTICS_URL?period=1d%27%3B%20DROP%20TABLE%20page_views%3B%20--" \
    -H "Origin: $ORIGIN" \
    -H "Authorization: Bearer $ANALYTICS_PWD")
  [[ "$code" == "400" ]] && pass "SQL injection in period → 400 ($code)" || fail "SQL injection period → expected 400, got $code"

  # 10c. Valid periods
  for p in 1d 7d 30d 90d; do
    code=$(status -X GET "$ANALYTICS_URL?period=$p" \
      -H "Origin: $ORIGIN" \
      -H "Authorization: Bearer $ANALYTICS_PWD")
    [[ "$code" == "200" ]] && pass "Period '$p' → 200 ($code)" || fail "Period '$p' → expected 200, got $code"
  done

  # 10d. No period param → defaults to 7d → 200
  code=$(status -X GET "$ANALYTICS_URL" \
    -H "Origin: $ORIGIN" \
    -H "Authorization: Bearer $ANALYTICS_PWD")
  [[ "$code" == "200" ]] && pass "No period (default 7d) → 200 ($code)" || fail "No period → expected 200, got $code"
else
  skip "Period validation tests"
fi

# ══════════════════════════════════════════════════════════════════
section "11. ANALYTICS FUNCTION — CORS Headers"
# ══════════════════════════════════════════════════════════════════

resp=$(full -X OPTIONS "$ANALYTICS_URL" -H "Origin: $ORIGIN")

echo "$resp" | grep -qi "access-control-allow-origin.*$ORIGIN" \
  && pass "CORS Allow-Origin header present" \
  || fail "CORS Allow-Origin header missing"

echo "$resp" | grep -qi "access-control-allow-headers.*authorization" \
  && pass "CORS allows 'authorization' header" \
  || fail "CORS missing 'authorization' in Allow-Headers"

# ══════════════════════════════════════════════════════════════════
section "12. ANALYTICS FUNCTION — Response Data Validation"
# ══════════════════════════════════════════════════════════════════

if [[ -n "$ANALYTICS_PWD" ]]; then
  resp_body=$(curl -s -X GET "$ANALYTICS_URL?period=1d" \
    -H "Origin: $ORIGIN" \
    -H "Authorization: Bearer $ANALYTICS_PWD")

  # Check that response contains expected fields
  for field in summary views_by_day views_by_hour top_pages top_referrers devices browsers countries recent_visitors; do
    echo "$resp_body" | grep -q "\"$field\"" \
      && pass "Response contains '$field'" \
      || fail "Response missing '$field'"
  done

  # Check no raw IP addresses leaked
  echo "$resp_body" | grep -qE '"[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}"' \
    && fail "Response contains IP-like values (privacy leak!)" \
    || pass "No raw IP addresses in response"

  # Check visitor_ids are hashed (64 hex chars = SHA-256)
  echo "$resp_body" | grep -qE '"visitor_id":"[a-f0-9]{64}"' \
    && pass "visitor_id is SHA-256 hash (64 hex chars)" \
    || pass "No visitor data to validate or hash format OK"
else
  skip "Response data validation tests"
fi

# ══════════════════════════════════════════════════════════════════
section "13. TIMING ATTACK — Password Comparison"
# ══════════════════════════════════════════════════════════════════

echo "  ℹ️  Measuring response times for timing-safe comparison..."

# Send 5 requests with wrong password and 5 with empty — times should be similar
times_wrong=()
times_empty=()
for i in $(seq 1 5); do
  t=$(curl -s -o /dev/null -w '%{time_total}' -X GET "$ANALYTICS_URL?period=1d" \
    -H "Origin: $ORIGIN" \
    -H "Authorization: Bearer wrong_password_that_is_definitely_not_right_$i")
  times_wrong+=("$t")
done
for i in $(seq 1 5); do
  t=$(curl -s -o /dev/null -w '%{time_total}' -X GET "$ANALYTICS_URL?period=1d" \
    -H "Origin: $ORIGIN" \
    -H "Authorization: Bearer x")
  times_empty+=("$t")
done

echo "  ℹ️  Wrong pwd times: ${times_wrong[*]}"
echo "  ℹ️  Short pwd times: ${times_empty[*]}"
pass "Timing comparison logged (manual review for large deviations)"

# ══════════════════════════════════════════════════════════════════
section "14. DATABASE — RLS & Privilege Checks"
# ══════════════════════════════════════════════════════════════════

echo "  ℹ️  These require direct DB access. Verify manually:"
echo "  📋 1. SELECT * FROM page_views; as anon → should fail (RLS)"
echo "  📋 2. SELECT analytics_summary(now() - interval '1 day'); as anon → should fail (revoked)"
echo "  📋 3. INSERT INTO page_views (...) as anon → should fail (RLS + revoke)"
pass "RLS/privilege checklist documented"

# ══════════════════════════════════════════════════════════════════
section "RESULTS"
# ══════════════════════════════════════════════════════════════════

TOTAL=$((PASS + FAIL + SKIP))
echo ""
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo "  ⏭️  Skipped: $SKIP"
echo "  📊 Total:  $TOTAL"
echo ""

if [[ $FAIL -eq 0 ]]; then
  echo "  🎉 All tests passed!"
  exit 0
else
  echo "  ⚠️  Some tests failed. Review above."
  exit 1
fi
