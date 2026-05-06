# RSS Reader — Workflow Conventions

## Direct-push-to-main workflow

This repo uses a direct-push-to-main workflow. Most changes are content config edits to `feeds.public.json` that should be deployed immediately by Vercel. PR ceremony adds friction without value for this kind of work.

**Default behavior for any change:**

1. Work in the main worktree (`/Users/seniorstoryteller/Claude Code Projects/RSS Reader`), on `main`.
2. Edit, commit, `git push origin main`.
3. Vercel rebuilds and deploys automatically.

**Do NOT, by default:**

- Create feature branches for content config edits (`feeds.public.json`, `docs/**`, README, etc.).
- Create or use Claude session worktrees for content config edits — they introduce a branch the user has to remember to merge, which causes drift.
- Open pull requests for content config edits.

## When to use a feature branch + PR instead

Use a feature branch and PR only when one of these is true:

- The change is to application code (`src/**`, build config, dependencies) and would benefit from a Vercel preview URL for verification.
- The change is large or risky enough that you want CI to run before it hits main.
- The user explicitly asks for a PR.

Otherwise: edit on main, commit, push.

## Branch hygiene

- After a PR merges, GitHub auto-deletes the remote branch (`deleteBranchOnMerge: true` is set).
- Local branches don't auto-prune. If they accumulate, run `git fetch --prune` to clear stale remote-tracking refs, then delete merged local branches manually.
- Don't reuse old feature branches as scratch space. If a branch's PR has merged, delete it and start a fresh one for new work.

## Long-lived branches

- `main` — production. Vercel deploys from here.
- `preview` — purpose unclear as of this writing. Investigate before deleting.

## Validation

- `feeds.public.json` is validated by `scripts/validate-feeds.mjs`. It runs as a pre-commit hook (Husky) and as part of CI. Treat its `feeds.schema.json` as the source of truth for the feed config shape.
