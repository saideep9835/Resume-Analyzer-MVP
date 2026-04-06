# Prompt Strategy

This project now uses a two-prompt workflow:

1. **Master prompt** (for refinement/debugging)
   - File: `prompts/master_prompt.md`
   - Purpose: source-of-truth prompt with full guardrails and richer policy logic.

2. **Trimmed runtime prompt** (for production/testing)
   - File locations:
     - `backend/main.py` → `SYSTEM_PROMPT`
     - `my-resume-tool/api/analyze.js` → `SYSTEM_PROMPT`
   - Purpose: shorter, high-adherence prompt used in live inference.

## How to use this workflow

1. Keep runtime prompt stable for day-to-day use.
2. If you find output issues, diagnose using `prompts/master_prompt.md`.
3. Port only the necessary guardrail improvements from master into runtime prompt.
4. Keep both runtime copies in sync:
   - `backend/main.py`
   - `my-resume-tool/api/analyze.js`
