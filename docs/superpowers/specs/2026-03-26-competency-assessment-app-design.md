# Competency Assessment App — Design Spec

## Overview

A generic, company-agnostic competency assessment application focused on IT Operations roles. Implements a full assessment cycle (self-assessment → manager review → calibration → AI-generated growth plans) based on a proven career framework model.

The app provides tailored experiences per role through weighted competencies, and its primary differentiator is a detailed, AI-generated 6-month personal growth plan that shows employees exactly what to improve and how to reach the next level.

## Goals

1. **Tailored experience per role** — each of 8 IT Ops roles sees competencies weighted differently, so the assessment reflects what actually matters for their career track.
2. **Clear gap analysis** — after assessment, employees see exactly which skills are blocking their advancement, prioritized by impact.
3. **Actionable growth plans** — AI-generated 6-month development plans with phased actions, deliverables, resources, and quick wins.
4. **Full review cycle** — self-assessment, manager review with side-by-side comparison, and team calibration before final results.

## Non-Goals

- Company branding or theming (generic/white-label)
- Compensation/salary mapping (the Mews framework includes this but we're excluding it)
- Admin UI for editing roles/competencies/weights (config files only)
- Multi-tenancy or SaaS model

---

## Competency Model

### 6 Competencies

Based on the Mews career framework's proven 5-competency model, extended with a 6th competency for AI:

1. **Delivery** — planning, prioritization, predictability, continuous delivery, testing, monitoring
2. **Domain Expertise** — knowledge of domain, tools, business, product
3. **Problem Solving** — analysis, creativity, breaking down problems, architecting solutions
4. **Communication** — collaboration, documentation, relationships
5. **Leadership** — responsibility, decision-making, mentoring, setting an example
6. **AI Supremacy** — AI tool adoption, AI-augmented workflows, AI strategy, AIOps

### 6 Levels Per Competency

Each competency has levels 0-5 with 4-6 skill statements per level:

- **0 — Starter**: Beginning of the learning path
- **1 — Beginner**: Basics possessed, lots of guidance needed
- **2 — Intermediate**: Mid-level, guidance sometimes required
- **3 — Advanced**: Senior in role, able to guide others
- **4 — Expert**: Impact beyond immediate team/department
- **5 — Leading Expert**: Company-wide impact, advancing the industry

### AI Supremacy Competency Definition

**Level 0 — Starter:** Aware that AI tools exist. Has tried ChatGPT or similar once or twice.

**Level 1 — Beginner:** Uses AI assistants for basic tasks (writing emails, searching docs). Can prompt an LLM for simple troubleshooting help. Understands limitations (hallucinations, context windows).

**Level 2 — Intermediate:** Integrates AI into daily workflow (Copilot for scripts, AI-assisted monitoring analysis). Can evaluate AI tool outputs critically. Automates repetitive tasks using AI. Understands when AI is appropriate vs. not.

**Level 3 — Advanced:** Designs AI-augmented workflows for the team (e.g., AI-assisted incident triage, automated runbook generation). Evaluates and recommends AI tools with evidence-based analysis. Trains/fine-tunes models or builds custom GPTs for team use cases. Mentors others on effective AI adoption.

**Level 4 — Expert:** Drives AI strategy across multiple teams. Builds AI-powered automation that measurably reduces toil (e.g., predictive alerting, auto-remediation). Establishes AI governance practices (data privacy, model evaluation, cost management). Creates organizational AI adoption frameworks.

**Level 5 — Leading Expert:** Shapes the organization's AI vision. Pioneers novel AI applications in IT operations (AIOps). Contributes to the field via talks, publications, or open-source tools. Establishes industry-recognized AI practices for IT operations.

### Skill Statements Data

The 5 original competencies (Delivery, Domain Expertise, Problem Solving, Communication, Leadership) use skill statements sourced from the Mews career framework repository. AI Supremacy skill statements are defined above. During implementation, the full corpus (~180 skill statements) will be populated in `src/config/competencies.ts` from the Mews source data. A seed script (`prisma/seed.ts`) will be included to verify all competencies and skills are correctly loaded.

### Scoring System

**Individual skill scoring (0-2):**
- 0 (No): Does not possess the skill
- 1 (Somewhat): Has the skill partially or not consistently
- 2 (Yes): Fully possesses it, demonstrates consistently

**Level advancement requirements (all three must be met):**
1. Must have reached the previous level (no skipping)
2. No skill at the target level can have a score of 0 (no gaps)
3. Average score of skills at the level must exceed 1.7

**Career Progress:** Weighted average of competency levels (each 0-5), producing a single number 0-5. Weights differ by role.

**Scores validation:** All score JSON blobs are validated at the API boundary using Zod schemas before persistence. The schema enforces the structure: `Record<CompetencyKey, Record<LevelIndex, Record<SkillIndex, 0 | 1 | 2>>>`. Auto-save sends the full scores object (not deltas) to keep logic simple; the payload is small enough (~2KB) that this is fine.

**Level 5 edge case:** When a competency has reached level 5 (maximum), the gap analysis returns no gaps for that competency. The AI growth plan shifts to lateral growth recommendations: cross-competency development, mentoring/teaching suggestions, and thought leadership activities rather than skill advancement.

---

## Roles & Weights

8 IT Ops roles with competency weights (must sum to 100):

| Role | Delivery | Domain Expertise | Problem Solving | Communication | Leadership | AI Supremacy |
|------|----------|-----------------|-----------------|---------------|------------|-------------|
| IT Infrastructure Engineer | 20 | 25 | 25 | 10 | 5 | 15 |
| IT Security Engineer | 15 | 25 | 20 | 15 | 10 | 15 |
| IT Specialist | 30 | 15 | 20 | 15 | 5 | 15 |
| IT & Security Team Lead | 15 | 15 | 15 | 20 | 20 | 15 |
| IT & Security Family Lead | 10 | 20 | 10 | 20 | 25 | 15 |
| Cloud Engineer / Architect | 15 | 25 | 25 | 10 | 5 | 20 |
| Help Desk / IT Support | 25 | 15 | 15 | 20 | 5 | 20 |
| Network Engineer | 20 | 25 | 25 | 10 | 5 | 15 |

**Design rationale:**
- Cloud Engineer & Help Desk get 20% AI weight — Cloud because AI is transforming IaC/automation, Help Desk because AI chatbots and ticket automation are reshaping L1-L2 support.
- IC roles weight Delivery + Domain + Problem Solving heavily with minimal Leadership.
- Leadership roles shift toward Communication + Leadership with less Delivery.

---

## User Roles & Permissions

Three application roles:

- **Employee** — can complete self-assessments, view their own results and growth plans
- **Manager** — employee permissions + can review direct reports, participate in calibration for their team
- **Admin** — manager permissions + can manage assessment cycles (create, advance, close), manage employees (create accounts, assign roles, assign managers), trigger calibration, and lock final results

**Calibration permissions:** Both Managers and Admins can create/edit CalibrationResult records for employees in their reporting chain. Admins can calibrate any employee. Only Admins can lock calibration (which triggers growth plan generation).

**Registration:** No self-registration. Admins create employee accounts via the admin panel. The `(auth)/register` page is removed from the project structure. First admin account is created via a CLI seed command (`npx prisma db seed`).

---

## User Flows

### Employee Self-Assessment

1. Employee logs in → sees active assessment cycle (or "no active cycle" message)
2. Confirms their role (pre-assigned by admin; if incorrect, contacts admin to change it)
3. Assessment wizard walks through one competency at a time:
   - Shows competency name, role weight (e.g., "Domain Expertise — 25% of your score")
   - Skills grouped by level (0-5), each rated 0/1/2
   - Progress bar across competencies
   - Auto-save on each answer (sends full scores object via PUT)
4. Review summary page: computed competency levels, career progress score, radar chart preview
5. Submit — locked until manager review

### Manager Review

1. Manager sees list of direct reports who have submitted self-assessments
2. For each employee, side-by-side view:
   - Left column: employee's self-scores
   - Right column: manager's scores (pre-filled with self-scores, editable)
   - Delta column highlights disagreements (any non-zero absolute delta)
   - Per-competency comment field, required when any skill in that competency has |delta| != 0
3. Manager submits review for each employee
4. Can see aggregate team view (all reports on one screen)

### Calibration

1. Available to Managers (for their reports) and Admins (for all employees) after manager reviews are submitted
2. Team grid view: all employees × 6 competencies with current levels
3. KPI cards: team average progress, pending reviews, large deltas (|delta| > 1)
4. Manager/Admin can adjust final scores through discussion
5. Admin locks calibration → triggers async AI growth plan generation for all employees in the cycle

### Growth Plan (Post-Calibration)

1. Employee sees their personalized growth plan page
2. Content:
   - **Header**: current progress score, target score (current + 1 level), 6-month timeline
   - **Radar chart**: current vs. target across all 6 competencies
   - **Prioritized focus areas** (sorted by role weight × gap size):
     - Each area includes: specific failing/weak skills with scores
     - 3 phases: Month 1-2 (Foundation — learning, shadowing), Month 3-4 (Practice — leading activities, producing artifacts), Month 5-6 (Demonstrate — owning projects, presenting results)
     - Concrete deliverables per phase
     - Curated resources (books, certifications, courses, internal practices)
   - **Quick wins**: skills scored 1 that just need consistency, with immediate actions
   - **Monthly check-in schedule**: ties into bi-monthly catchup cadence
3. Manager can also view each report's growth plan
4. Plan can be regenerated if calibration scores change (new version created, previous version preserved)

---

## Assessment Cycle State Machine

```
OPEN → REVIEWING → CALIBRATING → CLOSED
```

| Transition | Trigger | Who | Guard |
|-----------|---------|-----|-------|
| → OPEN | Admin creates cycle | Admin | No other cycle in OPEN or REVIEWING state |
| OPEN → REVIEWING | Admin manually advances | Admin | At least 1 self-assessment submitted |
| REVIEWING → CALIBRATING | Admin manually advances | Admin | All submitted assessments have a manager review |
| CALIBRATING → CLOSED | Admin locks calibration | Admin | All employees have a CalibrationResult |

**No backward transitions.** If an employee missed the window, they wait for the next cycle. This keeps the process clean and avoids reopening complexity.

**On CLOSED transition:** Growth plan generation is queued for all employees in the cycle (see AI error handling section).

---

## API Routes

### Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | Public | Email + password → session cookie |
| POST | `/api/auth/logout` | Any | Clear session |
| GET | `/api/auth/me` | Any | Current user info + role |

### Assessments

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/assessments/active` | Employee+ | Get current user's assessment for the active cycle (or 404) |
| POST | `/api/assessments` | Employee+ | Create self-assessment for active cycle |
| PUT | `/api/assessments/:id` | Owner | Update scores (auto-save). Body: `{ scores: ScoresJson }`. Validates via Zod. |
| POST | `/api/assessments/:id/submit` | Owner | Mark as SUBMITTED. Computes levels + progress. |

### Reviews

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/reviews/pending` | Manager+ | List direct reports with submitted assessments needing review |
| GET | `/api/reviews/:assessmentId` | Manager+ | Get review for a specific assessment (creates DRAFT if none exists) |
| PUT | `/api/reviews/:id` | Reviewer | Update manager scores + comments |
| POST | `/api/reviews/:id/submit` | Reviewer | Mark as SUBMITTED. Validates comments exist for deltas. |

### Calibration

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/calibration/team` | Manager+ | Get team grid (all employees × competency levels) for active cycle |
| PUT | `/api/calibration/:assessmentId` | Manager+/Admin | Set or update final calibration scores |
| POST | `/api/calibration/lock` | Admin only | Lock cycle → CLOSED, trigger growth plan generation |

### Growth Plans

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/growth-plan/mine` | Employee+ | Get current user's latest growth plan |
| GET | `/api/growth-plan/:employeeId` | Manager+ (must be manager of employee) or Admin | Get specific employee's growth plan |
| POST | `/api/growth-plan/:calibrationId/regenerate` | Admin | Re-generate a growth plan (creates new version) |

### Admin

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/admin/cycles` | Admin | List all cycles |
| POST | `/api/admin/cycles` | Admin | Create new cycle |
| POST | `/api/admin/cycles/:id/advance` | Admin | Advance cycle state (applies guards) |
| GET | `/api/admin/employees` | Admin | List all employees |
| POST | `/api/admin/employees` | Admin | Create employee account |
| PUT | `/api/admin/employees/:id` | Admin | Update employee (role, manager, career track) |

**Error responses:** All endpoints return `{ error: string, code: string }` on failure. Standard codes: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CYCLE_STATE_ERROR`, `ALREADY_EXISTS`.

---

## Technical Architecture

### Stack

- **Framework**: Next.js 14 (App Router, Server Components)
- **Language**: TypeScript
- **Database**: SQLite via Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts (radar charts, bar charts)
- **Auth**: NextAuth.js with credentials provider (email + bcrypt password)
- **AI**: OpenAI API (GPT-4) for growth plan generation
- **Hosting**: Railway with persistent volume for SQLite (NOT Vercel — serverless ephemeral filesystem is incompatible with SQLite)

### Database Schema (Prisma)

```prisma
model Employee {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String
  passwordHash  String
  role          AppRole  @default(EMPLOYEE)  // EMPLOYEE, MANAGER, ADMIN
  careerTrack   String   // key from roles config
  managerId     String?
  manager       Employee?  @relation("ManagerReports", fields: [managerId], references: [id])
  directReports Employee[] @relation("ManagerReports")
  assessments   SelfAssessment[]
  reviewsGiven  ManagerReview[]
  createdAt     DateTime @default(now())
}

model AssessmentCycle {
  id          String      @id @default(cuid())
  name        String      // e.g., "Q2 2026"
  status      CycleStatus @default(OPEN)  // OPEN, REVIEWING, CALIBRATING, CLOSED
  startDate   DateTime
  endDate     DateTime
  assessments SelfAssessment[]
  createdAt   DateTime    @default(now())
}

model SelfAssessment {
  id              String   @id @default(cuid())
  employeeId      String
  cycleId         String
  scores          String   // JSON: validated by Zod at API boundary
  computedLevels  String?  // JSON: computed on submit
  careerProgress  Float?   // computed on submit
  status          AssessmentStatus @default(DRAFT)  // DRAFT, SUBMITTED
  submittedAt     DateTime?
  employee        Employee        @relation(fields: [employeeId], references: [id])
  cycle           AssessmentCycle @relation(fields: [cycleId], references: [id])
  managerReview   ManagerReview?
  calibration     CalibrationResult?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([employeeId, cycleId])  // one assessment per employee per cycle
}

model ManagerReview {
  id              String   @id @default(cuid())
  assessmentId    String   @unique  // one review per assessment
  reviewerId      String
  scores          String   // JSON: same structure as self-assessment
  comments        String   // JSON: Map<competencyKey, string>
  computedLevels  String?  // JSON
  careerProgress  Float?
  status          AssessmentStatus @default(DRAFT)
  submittedAt     DateTime?
  assessment      SelfAssessment @relation(fields: [assessmentId], references: [id])
  reviewer        Employee       @relation(fields: [reviewerId], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model CalibrationResult {
  id              String   @id @default(cuid())
  assessmentId    String   @unique  // one calibration per assessment
  finalScores     String   // JSON
  finalLevels     String   // JSON
  finalProgress   Float
  calibratedById  String
  calibratedBy    Employee @relation(fields: [calibratedById], references: [id])
  assessment      SelfAssessment @relation(fields: [assessmentId], references: [id])
  growthPlans     GrowthPlan[]
  calibratedAt    DateTime @default(now())
}

model GrowthPlan {
  id              String   @id @default(cuid())
  calibrationId   String
  employeeId      String   // convenience FK for direct queries
  cycleId         String   // convenience FK for direct queries
  version         Int      @default(1)  // increments on regeneration
  content         String   // JSON: structured plan
  rawLlmResponse  String   // raw LLM output for debugging
  status          PlanStatus @default(GENERATING)  // GENERATING, READY, FAILED
  errorMessage    String?  // populated on failure
  calibration     CalibrationResult @relation(fields: [calibrationId], references: [id])
  generatedAt     DateTime @default(now())
}
```

### Project Structure

```
competency-assessment/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── (auth)/              # Login page
│   │   │   └── login/
│   │   ├── (employee)/          # Self-assessment flow
│   │   │   ├── assessment/
│   │   │   └── my-growth-plan/
│   │   ├── (manager)/           # Review & calibration views
│   │   │   ├── reviews/
│   │   │   └── calibration/
│   │   ├── (admin)/             # Admin pages
│   │   │   ├── cycles/
│   │   │   └── employees/
│   │   └── api/                 # API routes (see API Routes section)
│   │       ├── auth/
│   │       ├── assessments/
│   │       ├── reviews/
│   │       ├── calibration/
│   │       ├── growth-plan/
│   │       └── admin/
│   ├── config/
│   │   ├── competencies.ts      # 6 competencies, 6 levels, ~180 skill statements
│   │   ├── roles.ts             # 8 roles with weights
│   │   └── scoring.ts           # Level advancement rules, progress calc constants
│   ├── lib/
│   │   ├── db.ts                # Prisma client singleton
│   │   ├── scoring-engine.ts    # Deterministic gap analysis
│   │   ├── growth-plan-ai.ts    # LLM prompt construction + response parsing
│   │   ├── auth.ts              # NextAuth config
│   │   └── validations.ts       # Zod schemas for all JSON blobs
│   └── components/
│       ├── assessment/          # Skill rating widgets, competency cards
│       ├── review/              # Side-by-side comparison, delta highlights
│       ├── calibration/         # Team grid, KPI cards, bulk editing
│       ├── growth-plan/         # Radar chart, priority cards, timeline, quick wins
│       └── ui/                  # shadcn/ui shared components
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                  # Creates first admin account + verifies config data
├── .env.example                 # OPENAI_API_KEY, DATABASE_URL, NEXTAUTH_SECRET
├── package.json
└── tailwind.config.ts
```

### Scoring Engine (deterministic, no AI)

Located in `config/scoring.ts` and `lib/scoring-engine.ts`:

1. **computeCompetencyLevel(scores)**: For each competency, iterate levels 0-5. A level is reached if: (a) previous level reached, (b) no skill scored 0, (c) average > 1.7. Return highest reached level.
2. **computeCareerProgress(levels, roleWeights)**: Weighted average of 6 competency levels using the role's weight config. Returns 0-5 float.
3. **computeGapAnalysis(currentLevels, roleWeights)**: For each competency where currentLevel < 5, identify skills at (currentLevel + 1) that scored 0 or 1. Sort by (roleWeight × gapSize) descending. Return prioritized gap list. For competencies at level 5, return lateral growth suggestions instead.

### AI Growth Plan Generation

Located in `lib/growth-plan-ai.ts`:

**Input to LLM:**
- Employee's role and its competency weights
- Current competency levels (0-5 each)
- Target levels (current + 1 for each competency not at 5)
- Specific skill gaps: skill text, current score (0 or 1), level it belongs to
- Role context (what the role does day-to-day)

**Prompt structure:**
System prompt defines the output format (JSON with priorities, phases, actions, resources, quickWins). User prompt provides the employee's data. The LLM generates a structured 6-month plan.

**Output (parsed JSON):**
```typescript
interface GrowthPlan {
  summary: string;
  currentProgress: number;
  targetProgress: number;
  timelineMonths: number;
  priorities: Priority[]; // sorted by impact
  quickWins: QuickWin[];
  monthlyCheckpoints: Checkpoint[];
}

interface Priority {
  rank: number;
  competency: string;
  currentLevel: number;
  targetLevel: number;
  roleWeight: number;
  skills: SkillGap[];
  phases: Phase[]; // 3 phases: Foundation, Practice, Demonstrate
  resources: Resource[];
}

interface Phase {
  name: string;
  months: string; // e.g., "1-2"
  actions: string[];
  deliverables: string[];
}

interface QuickWin {
  competency: string;
  skill: string;
  currentScore: number;
  action: string;
  timeframe: string; // e.g., "Immediate" or "2 weeks"
}

interface Checkpoint {
  month: number;
  focusAreas: string[];
  expectedOutcomes: string[];
}

interface Resource {
  type: "book" | "course" | "certification" | "practice" | "internal";
  title: string;
  description: string;
  relevance: string; // which skill gap it addresses
}
```

**Error handling and reliability:**
- Growth plans are generated asynchronously after calibration lock. Each plan starts in `GENERATING` status.
- On OpenAI API failure: status set to `FAILED` with error message. Admin sees failed plans in the UI and can retry individually.
- Retry policy: 3 automatic retries with exponential backoff (2s, 8s, 32s) before marking as FAILED.
- Response validation: LLM output is parsed as JSON and validated against a Zod schema. If parsing fails, it counts as a failure and retries.
- Cost guardrails: max 4000 output tokens per plan (~$0.12/plan at GPT-4 pricing). A cycle with 50 employees costs ~$6 total.
- Timeout: 60-second timeout per LLM call.
- Plans are generated sequentially (not in parallel) to avoid rate limits. Estimated time: ~2 minutes for 50 employees.

**Stored in DB** as JSON with version tracking. Regeneration creates a new version (incremented `version` field), preserving previous versions for history.

---

## Config File Format

### competencies.ts

```typescript
export const competencies = {
  delivery: {
    name: "Delivery",
    description: "Planning, prioritization, predictability...",
    levels: [
      {
        index: 0,
        name: "Starter",
        skills: [
          "Follows established processes to complete assigned tasks",
          "Asks for help when blocked",
          // ... 4-6 skills per level
        ]
      },
      // ... levels 1-5
    ]
  },
  // ... domainExpertise, problemSolving, communication, leadership, aiSupremacy
};
```

### roles.ts

```typescript
export const roles = {
  itInfrastructureEngineer: {
    name: "IT Infrastructure Engineer",
    description: "Manages and maintains IT infrastructure...",
    weights: {
      delivery: 20,
      domainExpertise: 25,
      problemSolving: 25,
      communication: 10,
      leadership: 5,
      aiSupremacy: 15,
    }
  },
  // ... 7 more roles
};
```

---

## GitHub Repository

New repo: `Github to app` under the user's GitHub account. All application code will be committed here.

---

## Key Design Decisions

1. **Config files over admin UI** — roles, competencies, and weights are version-controlled TypeScript files. Changes require a code push, but this is appropriate for IT Ops scale and provides full audit trail via git.
2. **SQLite over PostgreSQL** — adequate for team-scale usage (dozens of users, not thousands). Simplifies deployment to a single process. Deployed on Railway with persistent volume (NOT Vercel, which has ephemeral filesystem incompatible with SQLite).
3. **AI growth plans stored, not generated on-the-fly** — generation is triggered once after calibration lock. Plans are stored in DB with versioning and served from cache. Regeneration is explicit and creates a new version.
4. **6 competencies with 6 levels** — extends the proven Mews 5-competency model with AI Supremacy. Keeps the same scoring mechanics (0-2 per skill, 1.7 average threshold, sequential level advancement).
5. **Radar chart as primary visualization** — provides immediate visual comparison of current vs. target across all 6 competencies, making gaps visually obvious.
6. **No self-registration** — admin-only account creation for internal tool security. First admin created via seed script.
7. **No backward cycle transitions** — keeps the assessment process clean and predictable. Missed deadlines wait for next cycle.
8. **Zod validation at API boundaries** — all JSON blobs validated before persistence to ensure data integrity despite schemaless storage.
