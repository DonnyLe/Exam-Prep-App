# Exam Prep

A confidence-based study planner with daily recommendations, optional interleaving, a focus timer, and Supabase-backed exams and study history.

## Run locally

Use Node 20 or newer. Install dependencies with `npm ci`, then add these values to `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

Run `npm run dev`. Open `/demo` to explore a sample workspace without an account. Sample changes last only until the page reloads. Real exam creation and study completion require sign-in and the migration below.

## Database setup

This project originally used `profiles`, `subjects`, `exams`, `topics`, `subtopics`, and the three `studied_*_entry` tables described in `lib/supabase-types.ts`. The additive migration `supabase/migrations/202610090001_study_flow.sql` assumes those tables already exist. It preserves existing study material and history, adds `study_sessions`, and adds two authenticated RPCs:

- `save_study_exam(p jsonb)`: atomically creates/edits an exam and its material, checking ownership of existing IDs. Existing material is retained when editing; only unsaved rows can be removed in the editor.
- `complete_study_session(p jsonb)`: atomically records confidence and elapsed study time, recalculates parent confidence, and writes existing confidence histories. A client-generated session ID makes retries idempotent.

Apply the migration through the Supabase SQL editor or a linked Supabase CLI project. The live project must also have ownership policies for its original tables; review existing policies before deployment. The new session table permits authenticated users to read only their own sessions. Direct session writes are not granted; writes go through the ownership-checked RPC.

The configured project hostname was unreachable during implementation, so the migration has not been applied or verified against the live database. Update the credentials to an active project before using cloud saves. Supabase Auth must permit your local/deployed callback URL.

## Scheduling

The original power trajectory (`exponent = 1.7`), confidence gain (`-0.5 * confidence + 5`), and priority formula (`70 / (confidence + 5) + 1.2 ^ daysSincePractice`) remain. Priorities are refreshed for all material each simulated day. Confidence stays in 0–10; allocation follows parent/child averages without upward rounding. Parent confidence is the equal-weight mean of its immediate children.

Each projection starts from saved confidence and simulates completing recommendations. Projections are independent snapshots and never save predicted gains. Real confidence only changes after an explicit check-in or exam edit. Exam-day and expired exams are excluded from future study work. Topics that have reached the confidence goal may have no recommendations until the learner reports a lower score; this model does not simulate confidence decay.

“Mix topics” reorders selected work within each subject to alternate parent topics where possible. It does not add, remove, or change goals. The existing curve-combination optimizer remains available but disabled by default.

The timer is optional, uses an absolute deadline, and does not change topic selection or automatically complete sessions. Refreshing or leaving the workspace resets timer state. Confidence gains are planning estimates, not measured recall probabilities or guaranteed learning outcomes. Calendar dates use the browser timezone, shared with the server via a timezone cookie.

## Checks

- `npm test -- --runInBand`: scheduler and interleaving assertions.
- `npm run test:database`: local PostgreSQL migration/transaction checks using PGlite and the original table shape from the checked-in types. This does not verify the unavailable live project.
- `npx tsc --noEmit --incremental false`: type check.
- `npm run build`: production build.

## Future improvements

Collect real sessions before tuning the gain equation or trajectory exponent. Compare recommended work with actual confidence changes and elapsed time. Explicit recall feedback and review intervals can be layered on later, as can time budgets based on measured/user-supplied durations. Neither is required by the current spacing mechanism.
