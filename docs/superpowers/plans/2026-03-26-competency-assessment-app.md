# Competency Assessment App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack competency assessment app for IT Ops roles with weighted scoring, full review cycle, and AI-generated growth plans.

**Architecture:** Next.js 14 App Router with TypeScript, SQLite via Prisma, NextAuth.js credentials auth, Tailwind + shadcn/ui, Recharts for visualizations, OpenAI GPT-4 for growth plan generation. All config (competencies, roles, weights) in TypeScript files.

**Tech Stack:** Next.js 14, TypeScript, Prisma + SQLite, NextAuth.js, Tailwind CSS, shadcn/ui, Recharts, Zod, OpenAI SDK, bcrypt

**Spec:** `docs/superpowers/specs/2026-03-26-competency-assessment-app-design.md`

---

## File Map

```
competency-assessment/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── .env.example
├── .env.local                          # local dev secrets (gitignored)
├── vitest.config.ts
├── prisma/
│   ├── schema.prisma                   # all models + enums
│   └── seed.ts                         # creates admin + sample employees
├── src/
│   ├── config/
│   │   ├── competencies.ts             # 6 competencies × 6 levels × 4-6 skills
│   │   ├── roles.ts                    # 8 IT Ops roles with weights
│   │   └── scoring.ts                  # scoring constants (1.7 threshold, etc.)
│   ├── lib/
│   │   ├── db.ts                       # Prisma client singleton
│   │   ├── validations.ts             # Zod schemas for all JSON blobs
│   │   ├── scoring-engine.ts          # computeCompetencyLevel, computeCareerProgress, computeGapAnalysis
│   │   ├── errors.ts                  # shared error codes + ApiError class
│   │   ├── auth.ts                     # NextAuth config
│   │   ├── auth-helpers.ts            # getSession, requireRole, requireManager helpers
│   │   ├── growth-plan-ai.ts          # LLM prompt, call, parse
│   │   └── test-helpers.ts            # shared test fixtures: buildScores(), createTestDb(), mockSession()
│   ├── middleware.ts                    # route protection by role
│   ├── app/
│   │   ├── layout.tsx                  # root layout with SessionProvider
│   │   ├── page.tsx                    # redirect by role
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (employee)/
│   │   │   ├── layout.tsx
│   │   │   ├── assessment/page.tsx
│   │   │   └── my-growth-plan/page.tsx
│   │   ├── (manager)/
│   │   │   ├── layout.tsx
│   │   │   ├── reviews/page.tsx           # list + aggregate team view
│   │   │   ├── reviews/[id]/page.tsx      # single review comparison
│   │   │   └── calibration/page.tsx
│   │   ├── (admin)/
│   │   │   ├── layout.tsx
│   │   │   ├── cycles/page.tsx
│   │   │   └── employees/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── auth/me/route.ts                    # GET current user
│   │       ├── assessments/active/route.ts         # GET active assessment
│   │       ├── assessments/route.ts                # POST create
│   │       ├── assessments/[id]/route.ts           # PUT update scores
│   │       ├── assessments/[id]/submit/route.ts    # POST submit
│   │       ├── reviews/pending/route.ts
│   │       ├── reviews/[assessmentId]/route.ts     # GET/PUT review
│   │       ├── reviews/[id]/submit/route.ts
│   │       ├── calibration/team/route.ts
│   │       ├── calibration/[assessmentId]/route.ts
│   │       ├── calibration/lock/route.ts
│   │       ├── growth-plan/mine/route.ts
│   │       ├── growth-plan/employee/[employeeId]/route.ts    # namespaced to avoid conflict
│   │       ├── growth-plan/regenerate/[calibrationId]/route.ts  # namespaced
│   │       ├── admin/cycles/route.ts
│   │       ├── admin/cycles/[id]/advance/route.ts
│   │       ├── admin/employees/route.ts
│   │       └── admin/employees/[id]/route.ts
│   └── components/
│       ├── ui/                         # shadcn/ui primitives
│       ├── sidebar.tsx                 # role-based navigation
│       ├── assessment/
│       │   ├── skill-rater.tsx
│       │   ├── competency-section.tsx
│       │   ├── assessment-wizard.tsx
│       │   └── assessment-summary.tsx
│       ├── review/
│       │   ├── review-comparison.tsx
│       │   ├── delta-indicator.tsx
│       │   └── team-review-summary.tsx  # aggregate view
│       ├── calibration/
│       │   ├── team-grid.tsx
│       │   └── calibration-kpis.tsx
│       └── growth-plan/
│           ├── radar-chart.tsx
│           ├── priority-card.tsx
│           ├── quick-wins.tsx
│           └── growth-plan-view.tsx
├── __tests__/
│   ├── lib/
│   │   ├── scoring-engine.test.ts
│   │   ├── validations.test.ts
│   │   ├── auth-helpers.test.ts        # auth tests
│   │   └── growth-plan-ai.test.ts
│   ├── config/
│   │   └── config-integrity.test.ts
│   ├── api/
│   │   ├── assessments.test.ts
│   │   ├── reviews.test.ts
│   │   ├── calibration.test.ts
│   │   └── admin.test.ts
│   └── components/
│       ├── skill-rater.test.tsx
│       ├── assessment-wizard.test.tsx
│       ├── review-comparison.test.tsx
│       └── growth-plan-view.test.tsx
└── vitest.config.ts
```

### API Test Strategy

All API route tests use **integration testing against a real SQLite test database** (not mocked Prisma). Each test file:
1. Uses a test-specific SQLite file (`file:./test-{suitename}.db`)
2. Pushes schema before tests, drops after
3. Seeds required data in `beforeEach`
4. Calls route handlers directly using Next.js `NextRequest` + the exported handler functions
5. Shared helpers in `src/lib/test-helpers.ts`: `buildScores(overrides)` constructs valid score objects, `createTestEmployee(opts)` creates seeded employees, `mockSession(employee)` returns a mock session for auth bypass in tests.

### Error Response Standard

All API routes use a shared `ApiError` class from `src/lib/errors.ts`:

```typescript
export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) { super(message); }
}
export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CYCLE_STATE_ERROR: "CYCLE_STATE_ERROR",
  ALREADY_EXISTS: "ALREADY_EXISTS",
} as const;
// Handler wrapper catches ApiError and returns { error, code } JSON response
export function handleApiError(err: unknown): NextResponse { ... }
```

---

## Task 1: Project Scaffold & Prisma Schema

**Files:**
- Create: `competency-assessment/package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `.env.example`, `vitest.config.ts`
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd "/Users/jtaus/connection to github/Skills-from-Claude"
npx create-next-app@14 competency-assessment --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

- [ ] **Step 2: Install dependencies**

```bash
cd competency-assessment
npm install prisma @prisma/client next-auth@4 bcryptjs zod openai recharts
npm install -D @types/bcryptjs vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Initialize Prisma with SQLite**

```bash
npx prisma init --datasource-provider sqlite
```

- [ ] **Step 4: Write the full Prisma schema**

Write `prisma/schema.prisma` with all 6 models exactly matching the spec. Include enums: `AppRole` (EMPLOYEE, MANAGER, ADMIN), `CycleStatus` (OPEN, REVIEWING, CALIBRATING, CLOSED), `AssessmentStatus` (DRAFT, SUBMITTED), `PlanStatus` (GENERATING, READY, FAILED). Include all unique constraints. **Important:** Add explicit reverse relation names on Employee for all relations that reference it (calibratedBy, reviewsGiven, growthPlans, etc.) to avoid Prisma validation errors.

- [ ] **Step 5: Create Prisma client singleton**

Write `src/lib/db.ts` — standard global singleton pattern.

- [ ] **Step 6: Create .env.example and .env.local**

- [ ] **Step 7: Set up Vitest config** with jsdom environment, `@/` alias, globals: true.

- [ ] **Step 8: Generate Prisma client and push schema**

```bash
npx prisma generate && npx prisma db push
```

- [ ] **Step 9: Verify build**

```bash
npm run build
```
Expected: succeeds.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat: project scaffold with Prisma schema, Vitest, Tailwind"
```

---

## Task 2: Config Files — Competencies, Roles, Scoring Constants

**Files:**
- Create: `src/config/competencies.ts`, `src/config/roles.ts`, `src/config/scoring.ts`
- Create: `__tests__/config/config-integrity.test.ts`

- [ ] **Step 1: Write the failing config integrity test**

Tests: exactly 6 competencies, each with 6 levels, each level with 4-6 skills, no empty strings, exactly 8 roles, each role weights sum to 100, all roles have weights for all 6 competency keys.

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Write `competencies.ts`** with full skill statements sourced from Mews repo (5 original competencies) + AI Supremacy from spec.

- [ ] **Step 4: Write `roles.ts`** with exact weights from spec table.

- [ ] **Step 5: Write `scoring.ts`** — exports `LEVEL_ADVANCEMENT_THRESHOLD = 1.7`, `MAX_LEVEL = 5`, `SCORE_VALUES = [0, 1, 2] as const`.

- [ ] **Step 6: Run tests — expect PASS**

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: competencies, roles, and scoring config with full skill statements"
```

---

## Task 3: Shared Utilities — Zod Validations, Error Handling, Test Helpers

**Files:**
- Create: `src/lib/validations.ts`, `src/lib/errors.ts`, `src/lib/test-helpers.ts`
- Create: `__tests__/lib/validations.test.ts`

- [ ] **Step 1: Write failing validation tests** — ScoresSchema accepts/rejects, GrowthPlanContentSchema accepts/rejects, CommentsSchema, LevelsSchema.

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement `validations.ts`** — Zod schemas for ScoresSchema, GrowthPlanContentSchema, CommentsSchema, LevelsSchema.

- [ ] **Step 4: Implement `errors.ts`** — ApiError class, ErrorCodes enum, handleApiError wrapper function that catches ApiError and returns `NextResponse.json({ error, code }, { status })`.

- [ ] **Step 5: Implement `test-helpers.ts`** — `buildScores(competencyKey, overrides)`: builds a valid scores object for a competency with all skills defaulting to 2, allowing overrides per level/skill. `createTestEmployee(prisma, opts)`: inserts an employee with defaults. `buildFullScores(overrides)`: builds scores for all 6 competencies.

- [ ] **Step 6: Run tests — expect PASS**

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: Zod validations, error handling, and test helpers"
```

---

## Task 4: Scoring Engine

**Files:**
- Create: `src/lib/scoring-engine.ts`
- Create: `__tests__/lib/scoring-engine.test.ts`

- [ ] **Step 1: Write failing scoring engine tests**

Use `buildScores()` from test-helpers to construct fixtures:

```typescript
import { buildScores, buildFullScores } from "@/lib/test-helpers";

describe("computeCompetencyLevel", () => {
  it("returns 0 for all-zero scores", () => {
    const scores = buildScores("delivery", { allDefault: 0 });
    expect(computeCompetencyLevel(scores, "delivery")).toBe(0);
  });
  it("returns level 2 when levels 0-2 all pass", () => {
    const scores = buildScores("delivery", { passLevels: [0, 1, 2] });
    expect(computeCompetencyLevel(scores, "delivery")).toBe(2);
  });
  it("blocks on any score of 0 at target level", () => { ... });
  it("blocks when average below 1.7 at target level", () => { ... });
  it("requires sequential advancement (no skipping)", () => { ... });
});

describe("computeCareerProgress", () => {
  it("computes weighted average correctly", () => {
    // (3*20 + 2*25 + 2*25 + 3*10 + 1*5 + 2*15) / 100 = 2.25
    ...
  });
});

describe("computeGapAnalysis", () => {
  it("returns gaps sorted by weight * gap size descending", () => {
    const fullScores = buildFullScores({ ... });
    const gaps = computeGapAnalysis(levels, weights, fullScores);
    expect(gaps[0].competency).toBe("problemSolving");
  });
  it("returns lateral growth for level 5 competencies", () => { ... });
  it("returns empty for employee at max level everywhere", () => { ... });
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Implement `scoring-engine.ts`** — imports constants from `config/scoring.ts`. Three exported functions matching the spec algorithms.

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: scoring engine with level advancement, career progress, gap analysis"
```

---

## Task 5: Auth Setup (NextAuth.js + Tests)

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/auth-helpers.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/auth/me/route.ts`
- Create: `prisma/seed.ts`
- Create: `__tests__/lib/auth-helpers.test.ts`

- [ ] **Step 1: Write failing auth-helpers tests**

```typescript
describe("requireRole", () => {
  it("allows ADMIN for ADMIN-required route", () => { ... });
  it("rejects EMPLOYEE for MANAGER-required route", () => { ... });
  it("allows MANAGER for EMPLOYEE-required route (hierarchy)", () => { ... });
});
describe("requireManagerOf", () => {
  it("allows manager of employee", () => { ... });
  it("rejects non-manager", () => { ... });
  it("allows admin for any employee", () => { ... });
});
```

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Write NextAuth config** (`src/lib/auth.ts`) — credentials provider with bcrypt, session callback including `id, role, careerTrack`.

- [ ] **Step 4: Write auth helpers** (`src/lib/auth-helpers.ts`) — `requireAuth`, `requireRole` (hierarchy: EMPLOYEE < MANAGER < ADMIN), `requireManagerOf`.

- [ ] **Step 5: Write NextAuth API route** and **`/api/auth/me` route** (GET returns session user info).

- [ ] **Step 6: Write seed script** — admin + 3 sample employees with manager relationships. Add prisma seed config to `package.json`.

- [ ] **Step 7: Run auth tests — expect PASS**

- [ ] **Step 8: Run seed**

```bash
npx prisma db seed
```

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: NextAuth credentials auth with role helpers, /me endpoint, seed"
```

---

## Task 6: Login Page & Root Layout

**Files:**
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/(auth)/login/page.tsx`
- Create: `src/components/ui/` (shadcn components)
- Create: `__tests__/components/login.test.tsx`

- [ ] **Step 1: Install shadcn/ui**

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label toast
```

- [ ] **Step 2: Write failing login component test**

Test: renders email + password inputs, shows error on invalid credentials, calls signIn on submit.

- [ ] **Step 3: Run test — expect FAIL**

- [ ] **Step 4: Write root layout** with SessionProvider.

- [ ] **Step 5: Write login page** — email + password form, error toast, redirect to `/assessment`.

- [ ] **Step 6: Write root page** — redirect based on role: Admin → `/admin/cycles`, Manager → `/reviews`, Employee → `/assessment`. Unauthenticated → `/login`.

- [ ] **Step 7: Run login test — expect PASS**

- [ ] **Step 8: Manual smoke test** — login with `admin@company.com` / `admin123`.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: login page, root layout, role-based redirect"
```

---

## Task 7: Assessment API Routes

**Files:**
- Create: `src/app/api/assessments/active/route.ts` (GET active assessment)
- Create: `src/app/api/assessments/route.ts` (POST create)
- Create: `src/app/api/assessments/[id]/route.ts` (PUT update)
- Create: `src/app/api/assessments/[id]/submit/route.ts` (POST submit)
- Create: `__tests__/api/assessments.test.ts`

- [ ] **Step 1: Write failing API tests**

Integration tests against real SQLite test DB. Tests:
- GET `/api/assessments/active` returns 404 when no active cycle
- GET `/api/assessments/active` returns assessment when cycle is OPEN
- POST `/api/assessments` creates DRAFT assessment
- POST `/api/assessments` rejects duplicate (unique constraint)
- PUT updates scores (Zod validated)
- PUT rejects invalid scores (value 3 → VALIDATION_ERROR)
- POST submit computes levels and sets SUBMITTED
- All routes use `{ error, code }` error format

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement `assessments/active/route.ts`** — GET: find OPEN cycle, find user's assessment, return or 404.

- [ ] **Step 4: Implement `assessments/route.ts`** — POST: create DRAFT assessment for active cycle. Uses handleApiError.

- [ ] **Step 5: Implement `assessments/[id]/route.ts`** — PUT: validate with ScoresSchema, update.

- [ ] **Step 6: Implement `assessments/[id]/submit/route.ts`** — POST: compute levels + progress via scoring engine, set SUBMITTED.

- [ ] **Step 7: Run tests — expect PASS**

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: assessment API routes with Zod validation and scoring"
```

---

## Task 8: Self-Assessment UI

**Files:**
- Create: `src/components/assessment/skill-rater.tsx`, `competency-section.tsx`, `assessment-wizard.tsx`, `assessment-summary.tsx`
- Create: `src/app/(employee)/layout.tsx`, `src/app/(employee)/assessment/page.tsx`
- Create: `__tests__/components/skill-rater.test.tsx`, `assessment-wizard.test.tsx`

- [ ] **Step 1: Write failing component tests**

SkillRater test: renders 3 radio options, calls onChange with correct value.
AssessmentWizard test: renders first competency, navigates forward/back, shows progress.

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Build SkillRater** — 0/1/2 radio group.

- [ ] **Step 4: Build CompetencySection** — shows competency name, weight badge, skills by level.

- [ ] **Step 5: Build AssessmentWizard** — stepper through 6 competencies, debounced auto-save (1s), progress bar. Handles "no active cycle" state with a clear message.

- [ ] **Step 6: Build AssessmentSummary** — Recharts RadarChart, career progress, submit button.

- [ ] **Step 7: Build employee layout and assessment page** — sidebar with "Assessment" and "My Growth Plan" links.

- [ ] **Step 8: Run component tests — expect PASS**

- [ ] **Step 9: Manual test** — full assessment flow.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat: self-assessment wizard UI with auto-save and radar chart"
```

---

## Task 9: Review API Routes

**Files:**
- Create: `src/app/api/reviews/pending/route.ts`, `reviews/[assessmentId]/route.ts`, `reviews/[id]/submit/route.ts`
- Create: `__tests__/api/reviews.test.ts`

- [ ] **Step 1: Write failing review API tests** — pending returns correct list, GET creates draft pre-filled, PUT updates, submit validates comments for |delta| != 0, rejects missing comments.

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement pending, GET/PUT review, submit** — submit checks per-competency: if any skill has |selfScore - managerScore| != 0, require non-empty comment for that competency key in CommentsSchema.

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: manager review API with delta-based comment validation"
```

---

## Task 10: Manager Review UI

**Files:**
- Create: `src/components/review/review-comparison.tsx`, `delta-indicator.tsx`, `team-review-summary.tsx`
- Create: `src/app/(manager)/layout.tsx`, `reviews/page.tsx`, `reviews/[id]/page.tsx`
- Create: `__tests__/components/review-comparison.test.tsx`

- [ ] **Step 1: Write failing component test** — ReviewComparison renders self vs manager scores, shows delta badges, requires comment when delta != 0.

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Build DeltaIndicator** — colored badge (green 0, yellow |1|, red |2+|).

- [ ] **Step 4: Build ReviewComparison** — side-by-side table, per-competency comment textarea (red border when required + empty).

- [ ] **Step 5: Build TeamReviewSummary** — aggregate view: table of all direct reports showing name, role, self-progress, manager-progress, status. Renders on the reviews list page.

- [ ] **Step 6: Build reviews list page** — table with "Review" button per employee + TeamReviewSummary aggregate section.

- [ ] **Step 7: Build single review page** — loads assessment + review, renders ReviewComparison.

- [ ] **Step 8: Build manager layout** — sidebar: Reviews, Calibration.

- [ ] **Step 9: Run component test — expect PASS**

- [ ] **Step 10: Manual test**

- [ ] **Step 11: Commit**

```bash
git add -A && git commit -m "feat: manager review UI with comparison, deltas, and team summary"
```

---

## Task 11: Calibration API Routes

**Files:**
- Create: `src/app/api/calibration/team/route.ts`, `calibration/[assessmentId]/route.ts`, `calibration/lock/route.ts`
- Create: `__tests__/api/calibration.test.ts`

- [ ] **Step 1: Write failing calibration API tests** — team grid returns data, PUT creates/updates CalibrationResult, lock advances to CLOSED and calls generateGrowthPlan for each employee, lock rejects if not all calibrated, only admin can lock.

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement team grid route** — returns array of employee + levels data.

- [ ] **Step 4: Implement calibration PUT** — creates/updates CalibrationResult, checks permissions.

- [ ] **Step 5: Implement lock route** — admin only. Guards: all assessments calibrated, cycle in CALIBRATING state. Advances to CLOSED. **Calls `generateGrowthPlan(calibrationId)` in a sequential loop** for each CalibrationResult in the cycle. Each call creates GrowthPlan record, attempts generation, sets READY or FAILED. Returns `{ locked: true, plansQueued: N, plansFailed: N }`.

- [ ] **Step 6: Run tests — expect PASS**

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: calibration API with team grid, scoring, lock + growth plan trigger"
```

---

## Task 12: Calibration UI

**Files:**
- Create: `src/components/calibration/team-grid.tsx`, `calibration-kpis.tsx`
- Create: `src/app/(manager)/calibration/page.tsx`

- [ ] **Step 1: Build CalibrationKPIs** — 3 stat cards.

- [ ] **Step 2: Build TeamGrid** — editable table, inline save, color coding.

- [ ] **Step 3: Build calibration page** — KPIs + grid + Lock button (admin only, confirmation dialog).

- [ ] **Step 4: Manual test**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: calibration UI with team grid, KPIs, lock button"
```

---

## Task 13: AI Growth Plan Generation

**Files:**
- Create: `src/lib/growth-plan-ai.ts`
- Create: `src/app/api/growth-plan/mine/route.ts`
- Create: `src/app/api/growth-plan/employee/[employeeId]/route.ts`
- Create: `src/app/api/growth-plan/regenerate/[calibrationId]/route.ts`
- Create: `__tests__/lib/growth-plan-ai.test.ts`

- [ ] **Step 1: Write failing growth plan tests** — `buildGrowthPlanPrompt` includes role/weights/gaps, `parseGrowthPlanResponse` validates JSON, rejects invalid, prompt includes lateral growth for level 5 competencies.

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement `growth-plan-ai.ts`** — `buildGrowthPlanPrompt`, `parseGrowthPlanResponse`, `generateGrowthPlan(calibrationId)` with 3 retries (2s, 8s, 32s exponential backoff), 60s timeout, 4000 max_tokens, Zod validation of response.

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Implement growth plan API routes** — `/mine` (GET own latest), `/employee/[employeeId]` (GET, manager or admin), `/regenerate/[calibrationId]` (POST, admin, increments version).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: AI growth plan generation with retries, validation, API routes"
```

---

## Task 14: Growth Plan UI

**Files:**
- Create: `src/components/growth-plan/radar-chart.tsx`, `priority-card.tsx`, `quick-wins.tsx`, `growth-plan-view.tsx`
- Create: `src/app/(employee)/my-growth-plan/page.tsx`
- Create: `__tests__/components/growth-plan-view.test.tsx`

- [ ] **Step 1: Write failing component test** — GrowthPlanView renders radar chart, priority cards, quick wins. Shows "generating" state. Shows "failed" state.

- [ ] **Step 2: Run test — expect FAIL**

- [ ] **Step 3: Build RadarChart** — Recharts RadarChart, current (blue) vs target (green), labels with competency + weight.

- [ ] **Step 4: Build PriorityCard** — color-coded (red P1, orange P2, blue P3), phases, actions, deliverables, resources.

- [ ] **Step 5: Build QuickWins** — green card, list of immediate actions.

- [ ] **Step 6: Build GrowthPlanView** — assembles all sub-components. Handles GENERATING (spinner), FAILED (error message + retry for admin), READY (full plan).

- [ ] **Step 7: Build growth plan page** — fetches via `/api/growth-plan/mine`.

- [ ] **Step 8: Run component test — expect PASS**

- [ ] **Step 9: Manual test**

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "feat: growth plan UI with radar chart, priority cards, quick wins"
```

---

## Task 15: Admin API Routes & UI

**Files:**
- Create: `src/app/api/admin/cycles/route.ts`, `cycles/[id]/advance/route.ts`, `admin/employees/route.ts`, `admin/employees/[id]/route.ts`
- Create: `src/app/(admin)/layout.tsx`, `cycles/page.tsx`, `employees/page.tsx`
- Create: `__tests__/api/admin.test.ts`

- [ ] **Step 1: Write failing admin API tests** — create cycle (rejects if OPEN or REVIEWING or CALIBRATING cycle exists), advance (applies state machine guards), create employee (bcrypt), update employee, non-admin → 403.

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement admin API routes** — cycle creation guard: reject if any cycle has status != CLOSED. Advance route implements state machine from spec with all guards.

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Build cycles page** — list with status badges, create form, advance button.

- [ ] **Step 6: Build employees page** — table, add form, inline edit.

- [ ] **Step 7: Build admin layout** — sidebar with Cycles, Employees.

- [ ] **Step 8: Manual test**

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: admin UI for cycles and employee management"
```

---

## Task 16: Navigation & Role-Based Routing

**Files:**
- Create: `src/components/sidebar.tsx`
- Create: `src/middleware.ts`
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: Build global sidebar** — links based on role, user name, logout (calls NextAuth signOut).

- [ ] **Step 2: Add middleware** — protect routes: `/assessment`, `/my-growth-plan` require EMPLOYEE+. `/reviews`, `/calibration` require MANAGER+. `/admin/*` requires ADMIN. Redirect unauthenticated → `/login`.

- [ ] **Step 3: Update root layout** — include sidebar for authenticated routes.

- [ ] **Step 4: Manual test** — login as each role, verify correct links and access.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: role-based sidebar navigation and route protection middleware"
```

---

## Task 17: End-to-End Integration Test

- [ ] **Step 1: Reset database and seed**

```bash
npx prisma db push --force-reset && npx prisma db seed
```

- [ ] **Step 2: Full manual cycle test**

1. Admin: create cycle → advance to OPEN
2. Employee: complete self-assessment, submit
3. Admin: advance to REVIEWING
4. Manager: review employee, adjust scores, submit with comments
5. Admin: advance to CALIBRATING
6. Admin: finalize calibration scores
7. Admin: lock → growth plans generate
8. Employee: view growth plan — verify radar chart, priorities, quick wins

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```
Expected: All PASS.

- [ ] **Step 4: Build check**

```bash
npm run build && npm run lint
```
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "test: verify full assessment cycle end-to-end"
```

---

## Task 18: Push to GitHub

- [ ] **Step 1: Push all commits**

```bash
cd "/Users/jtaus/connection to github/Skills-from-Claude"
git add -A && git push origin main
```

- [ ] **Step 2: Verify** — check https://github.com/R44bt4/Skills-from-Claude
