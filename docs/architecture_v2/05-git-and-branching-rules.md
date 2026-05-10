# 05 — Git & Branching Rules

## Branch Strategy Overview

- All feature work branches off `develop`.
- `main` receives merges only from `develop` via the deploy pipeline.
- No direct pushes to `develop` or `main` — all changes arrive via Pull Request.

---

## Branch Naming Convention

```
{type}/{slice}-{description}
```

| Part | Allowed Values |
|---|---|
| `type` | `feature`, `fix`, `test`, `refactor`, `chore`, `docs` |
| `slice` | `checkout`, `cart`, `auth`, `catalog`, `orders`, `shared`, `infra` |
| `description` | kebab-case, max 40 characters |

### Valid Examples (Member A)

```
feature/checkout-react-form
feature/checkout-stepper-component
feature/cart-zustand-store
feature/cart-add-item-api-integration
fix/checkout-promo-code-validation
test/cart-service-quantity-guard
refactor/checkout-form-field-extraction
docs/checkout-api-contract
```

### Prohibited Patterns

| Pattern | Reason |
|---|---|
| `feature/my-work` | No slice identifier |
| `feature/checkout` | No description |
| `Member-A-branch` | Personal identifiers not allowed |
| `main-backup` | Never branch from a backup name |
| Any branch with spaces or uppercase | Convention violation |

> CI pipeline includes a branch-name linter. PRs from non-compliant branch names are automatically rejected.

---

## Commit Message Convention

Follows the **Conventional Commits** specification (conventionalcommits.org).

```
{type}({scope}): {imperative description}

[optional body]

[optional footer: references, breaking changes]
```

### Allowed Types

| Type | Use For |
|---|---|
| `feat` | New feature implementation |
| `fix` | Bug fixes |
| `test` | Adding or updating tests |
| `refactor` | Code restructuring without behavior change |
| `docs` | Documentation changes |
| `chore` | Maintenance tasks (deps, config) |
| `style` | Formatting changes only |
| `perf` | Performance improvements |
| `ci` | CI/CD configuration changes |

### Allowed Scopes

`checkout`, `cart`, `auth`, `catalog`, `orders`, `shared`, `infra`

### Rules

- Description must be **imperative mood** ("add" not "added", "fix" not "fixes")
- Append `[TDP]` to any commit that contains AI-generated code
- Maximum **72 characters** on the first line

### Examples

```
feat(checkout): add CheckoutStepper component with 3-step flow [TDP]

fix(cart): prevent duplicate product entries in cart store

test(checkout): add failing test for CartService.addItem quantity guard

refactor(cart): extract price calculation into pure utility function

docs(checkout): update API contract for /checkout/order endpoint

chore(infra): add Playwright config for checkout E2E suite

chore(deps): add react-hook-form
```

---

## Pull Request Protocol

### PR Title Format

```
[SLICE][TYPE] Description matching commit message
```

### Required PR Body Sections

```markdown
## What this PR does
[Plain English description of the change]

## TDP Evidence
- [ ] Failing test committed before implementation (commit hash: ______)
- [ ] All new code is covered by at least one test
- [ ] AI-generated commits are tagged [TDP]
- [ ] .ai/CONTEXT.md updated

## Test Results
[Paste or screenshot of passing test output]

## Checklist
- [ ] Branch name follows convention
- [ ] Commits follow Conventional Commits spec
- [ ] No files outside my slice's directory tree are modified
- [ ] No merge conflicts with develop
```

### PR Rules

- All PRs target **`develop`**, never `main`
- Minimum **1 reviewer** (another team member) before merge
- **CI must be green** (tests pass, branch name lints pass)
- PRs that touch files outside the author's slice require **explicit written approval** from the affected slice owner

---

## Daily Git Workflow

```bash
# Start of every work session
git fetch
git log HEAD..origin/develop --oneline   # Check if develop has moved ahead

# Create a feature branch
git checkout develop
git pull origin develop
git checkout -b feature/checkout-{description}

# During development — commit frequently
git add .
git commit -m "feat(checkout): {description} [TDP]"

# Before opening a PR — rebase onto develop
git fetch origin
git rebase origin/develop
git push origin feature/checkout-{description}

# After merge — clean up
git branch -d feature/checkout-{description}
git remote prune origin
```

---

## Conflict Resolution Protocol

If a conflict occurs in a shared file (e.g., `App.tsx`, `schema.prisma`, `package.json`):

1. PR author notifies both other members immediately.
2. Conflict resolution is done via screen share with all parties present.
3. Resolution is documented in the PR comment thread.
4. `.ai/CONTEXT.md` is updated to reflect any interface changes resulting from the resolution.

---

## Stale Context Check (Before Every TDP Session)

```bash
git log --oneline -10 -- src/frontend/src/features/checkout/ src/backend/src/features/checkout/
git log --oneline -1 -- .ai/CONTEXT.md
# CONTEXT.md commit should be the most recent
```

If the most recent commit in the checkout directories post-dates the `CONTEXT.md` commit, update `CONTEXT.md` before prompting any AI.
