# Quick rollback runbook (last stable build)

## Goal
Restore the latest known stable production build quickly.

## Preconditions
- Deployment platform keeps previous release history.
- `production` environment requires manual approval.

## Steps
1. Open deployment platform history.
2. Identify the last successful stable release (green health checks, no active incidents).
3. Trigger rollback/redeploy of that exact release artifact.
4. Verify health checks and smoke tests.
5. Post incident update with:
   - rollback timestamp,
   - restored version/build id,
   - root-cause follow-up owner.

## GitHub Actions fallback
If using GitHub Actions artifacts/container tags:
1. Locate last successful `Deploy` workflow run.
2. Re-run deploy with the previously published artifact/tag.
3. Approve `production` environment gate.

## Validation checklist
- API health endpoint returns OK.
- Critical checkout path works.
- Error rate returns to baseline.
- Monitoring and logs stable for at least 15 minutes.
