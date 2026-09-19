# Contributing

## Branching model

Three levels of branches:

| Branch   | Purpose                        | Deploys to          |
| :------- | :----------------------------- | :------------------ |
| `main`   | Production                     | Production site     |
| `staging`| Preview / testing              | Staging preview URL |
| `feat/*` | Feature work (short-lived)     | Its own preview URL |

Any branch you push gets a Cloudflare Workers Builds preview deployment, so every PR is testable in isolation.

## Workflow

1. Branch feature work off `main` so it always starts from the latest production code:
   ```sh
   git checkout main && git pull
   git checkout -b feat/my-change
   ```
2. Open a PR from `feat/my-change` into **`staging`**. Cloudflare deploys a preview URL for you to verify on.
3. Once it looks good on staging, open the PR (or retarget it) into **`main`**. Merging to `main` deploys to production.

## Branch hygiene

- **Keep staging close to main.** When `main` advances, merge it into staging (`git checkout staging && git merge main`) so the preview reflects current production reality. Don't let staging drift.
- **Rebase before PRing.** Rebase feature branches onto `staging`/`main` before opening the PR to avoid conflicts:
  ```sh
  git fetch origin && git rebase origin/staging
  ```
- **Squash-merge feature PRs.** Squash-merge keeps history clean and matches the one-line commit style (see below).
- Delete feature branches after they merge.

## Commit messages

Conventional Commits style, short and scoped:

```
feat: add per-week audit for result validation
fix: correct median calc for byes
chore: add wrangler config for static assets
```

## Deploy notes

- `wrangler.jsonc` (repo root) declares `dist/` as the static assets directory; it feeds both the production (`wrangler deploy`) and preview (`wrangler versions upload`) commands.
- If a worker name mismatch is flagged by CI, update the `"name"` field in `wrangler.jsonc` to the project name Cloudflare expects.