#!/usr/bin/env bash
# ============================================================================
# run_all_UPDATED.sh — FSTIVO MASTER FIX ORCHESTRATOR (UPDATED)
# Runs Phase 8 → 10 in sequence.  Each phase is idempotent.
# Usage:  cd /path/to/fstivo && bash run_all_UPDATED.sh
# ============================================================================
set -euo pipefail

R='\033[0;31m' G='\033[0;32m' Y='\033[1;33m' B='\033[0;34m' C='\033[0;36m' M='\033[0;35m' N='\033[0m'

banner() {
  echo ""
  echo -e "${M}╔══════════════════════════════════════════════════════════╗${N}"
  echo -e "${M}║         FSTIVO — MASTER FIX ORCHESTRATOR (v2)           ║${N}"
  echo -e "${M}║         10 Phases · Audit-driven · Test-ready           ║${N}"
  echo -e "${M}╚══════════════════════════════════════════════════════════╝${N}"
  echo ""
}

[[ ! -f package.json ]] && echo -e "${R}✘ Run from the FSTIVO project root.${N}" && exit 1

banner
mkdir -p logs

declare -A STATUS DURATION

run_phase() {
  local NUM="$1" SCRIPT="$2" LABEL="$3"

  echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
  echo -e "${B}  PHASE $NUM — $LABEL${N}"
  echo -e "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"

  [[ ! -f "$SCRIPT" ]] && { echo -e "  ${Y}⚠ $SCRIPT not found — skipped${N}"; STATUS[$NUM]="skipped"; DURATION[$NUM]=0; return; }

  local START=$(date +%s)
  if bash "$SCRIPT" 2>&1 | tee "logs/phase${NUM}.log"; then STATUS[$NUM]="ok"; else STATUS[$NUM]="error"; fi
  DURATION[$NUM]=$(($(date +%s) - START))
}

# ============================================================================
# EXECUTE PHASES 8-10
# ============================================================================
run_phase 8  "PHASE_8_TEST_INFRASTRUCTURE.sh" "TEST INFRASTRUCTURE HARDENING"
run_phase 9  "PHASE_9_COVERAGE_TESTS.sh"      "COVERAGE TEST TEMPLATES"
run_phase 10 "PHASE_10_PAYMENT_HARDENING.sh"  "PAYMENT HARDENING"

# ============================================================================
# FINAL DASHBOARD
# ============================================================================
echo ""
echo -e "${M}╔══════════════════════════════════════════════════════════╗${N}"
echo -e "${M}║               EXECUTION SUMMARY                         ║${N}"
echo -e "${M}╚══════════════════════════════════════════════════════════╝${N}"
echo ""

TOTAL_OK=0 TOTAL_ERR=0 TOTAL_SKIP=0

for NUM in 8 9 10; do
  S="${STATUS[$NUM]:-unknown}" D="${DURATION[$NUM]:-?}"
  case "$S" in
    ok)      echo -e "  ${G}✔ Phase $NUM${N}  (${D}s)"; TOTAL_OK=$((TOTAL_OK+1)) ;;
    error)   echo -e "  ${R}✘ Phase $NUM${N}  — check logs/phase${NUM}.log"; TOTAL_ERR=$((TOTAL_ERR+1)) ;;
    skipped) echo -e "  ${Y}⊘ Phase $NUM${N}  — script not found"; TOTAL_SKIP=$((TOTAL_SKIP+1)) ;;
  esac
done

echo ""
echo -e "  Passed: ${G}$TOTAL_OK${N}   Failed: ${R}$TOTAL_ERR${N}   Skipped: ${Y}$TOTAL_SKIP${N}"
echo ""
echo -e "${Y}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "${Y}  NEXT STEPS                                               ${N}"
echo -e "${Y}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo ""
echo -e "  ${Y}1${N}  Read MASTER_TEST_PLAN.md — 3-week plan for 3.5% → 50%+ coverage"
echo -e "  ${Y}2${N}  Fill .env.local with real credentials"
echo -e "  ${Y}3${N}  Run  npm test  — verify test infra is working"
echo -e "  ${Y}4${N}  Follow MASTER_TEST_PLAN.md week-by-week"
echo ""
echo -e "${G}══════════════════════════════════════════════════════════════${N}"
echo -e "${G}  PHASES 8-10 COMPLETE.  Start writing tests with:            ${N}"
echo -e "${G}    cp tests/server-actions/TEMPLATE.test.ts \\               ${N}"
echo -e "${G}       tests/server-actions/revenue-actions.test.ts          ${N}"
echo -e "${G}══════════════════════════════════════════════════════════════${N}"
echo ""
