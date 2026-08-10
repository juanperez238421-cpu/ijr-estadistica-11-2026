# Statistics 11 Assessment QA Bot

This Playwright bot exercises the public student path against the deployed GitHub Pages assessment.

It validates:

- public assessment page loads;
- student registration accepts group, name, email and integrity consent;
- Supabase creates a real marked QA attempt;
- all 18 questions render with answer choices;
- every answer can be submitted and acknowledged;
- the attempt reaches the final confirmation screen;
- final summary includes 18/18 responses, score, grade and report status;
- no core student RPC returns HTTP 4xx/5xx;
- no uncaught page JavaScript error occurs.

## QA identity

Each run uses a unique identity such as `QA BOT <run-id>` and a unique `qa.bot+...@example.com` email. This intentionally leaves a clearly identifiable QA attempt in the backend so the end-to-end persistence path is actually tested.

## Run locally

```bash
cd qa/assessment-bot
npm install
npx playwright install chromium
xvfb-run -a npm test
```

Optional environment variables:

```bash
ASSESSMENT_URL=https://juanperez238421-cpu.github.io/ijr-estadistica-11-2026/evaluacion-conteo-permutaciones/
QA_GROUP=11C
```

## GitHub Actions

The workflow `.github/workflows/e2e-assessment-bot.yml` runs once on the QA branch and can later be launched manually with `workflow_dispatch` after merge. It uploads the Playwright HTML report, trace, screenshots and `assessment-bot-summary.json` as artifacts.

Fullscreen is still verified as enabled in production configuration. If the GitHub Actions Xvfb browser cannot satisfy the operating-system fullscreen API, the test records that condition and hides only the local CI overlay so the registration/question/submission/backend flow can continue. Production files are not modified by the bot.
