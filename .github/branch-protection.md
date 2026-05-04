# Branch and deployment protection setup

This repository includes CI jobs (`typecheck`, `test`, `build`) in `.github/workflows/ci.yml`.

To enforce the requested protections in GitHub:

1. **Staging branch with mandatory preview**
   - Create/protect `staging` branch.
   - In Vercel/Netlify, enable Preview Deployments for PRs and connect them to `staging`.
   - In GitHub branch/ruleset, require successful deployment check for preview before merge.

2. **Require status checks before merge to `main`**
   - In Branch protection (or Rulesets) for `main`, require checks:
     - `typecheck`
     - `test`
     - `build`

3. **Block automatic deploy from `main` without approval**
   - Use protected GitHub Environment `production` with required reviewers.
   - `deploy-production` job in `.github/workflows/deploy.yml` targets `production`, so deployment pauses until manual approval.

4. **Rollback quick procedure**
   - Use workflow re-run or deploy previous successful artifact/image.
   - See `docs/rollback.md` for a copy/paste runbook.

5. **Validate env vars per environment**
   - `validate-env` job runs for `preview` and `production` environments and fails if mandatory secrets are missing.
