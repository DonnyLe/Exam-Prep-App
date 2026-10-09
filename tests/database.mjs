// Run with: PGLITE_MODULE=/absolute/path/to/pglite/dist/index.js node tests/database.mjs
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const { PGlite } = await import(
  process.env.PGLITE_MODULE || "@electric-sql/pglite"
);
const db = new PGlite();
await db.exec(`
 create role anon; create role authenticated; create schema auth;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table public.profiles(id uuid primary key references auth.users(id));
 create table public.subjects(id uuid primary key default gen_random_uuid(),subject_name text not null,user_id uuid references profiles(id));
 create table public.exams(id uuid primary key default gen_random_uuid(),name text not null,subject_id uuid references subjects(id),user_id uuid references profiles(id),exam_date date not null,created_at timestamptz default now(),last_studied date not null,confidence numeric,confidence_goal numeric,priority numeric);
 create table public.topics(id uuid primary key default gen_random_uuid(),name text not null,exam_id uuid references exams(id),last_studied date not null,confidence numeric,priority numeric,"order" integer);
 create table public.subtopics(id uuid primary key default gen_random_uuid(),name text not null,topic_id uuid references topics(id),last_studied date not null,confidence numeric,priority numeric,"order" integer);
 create table public.studied_exam_entry(id uuid primary key default gen_random_uuid(),exam_id uuid references exams(id),user_id uuid,confidence_increase numeric,date_studied date);
 create table public.studied_topic_entry(id uuid primary key default gen_random_uuid(),topic_id uuid references topics(id),confidence_increase numeric,date_studied date);
 create table public.studied_subtopic_entry(id uuid primary key default gen_random_uuid(),subtopic_id uuid references subtopics(id),confidence_increase numeric,date_studied date);
`);
await db.exec(
  await readFile(
    new URL(
      "../supabase/migrations/202610090001_study_flow.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
await db.query("insert into auth.users(id) values ($1),($2)", [owner, other]);
const asUser = async (id) =>
  db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
const rpc = async (name, input) =>
  (
    await db.query(`select public.${name}($1::jsonb) as result`, [
      JSON.stringify(input),
    ])
  ).rows[0].result;
await asUser(owner);
const date = (await db.query("select current_date::text as date")).rows[0].date;
const future = new Date(Date.parse(date) + 14 * 86400000)
  .toISOString()
  .slice(0, 10);
const examId = await rpc("save_study_exam", {
  subject_name: "Math",
  name: "Midterm",
  exam_date: future,
  confidence_goal: 9,
  topics: [
    {
      name: "Graphs",
      confidence: 4,
      subtopics: [
        { name: "Traversal", confidence: 4 },
        { name: "Trees", confidence: 6 },
      ],
    },
    { name: "Counting", confidence: 3, subtopics: [] },
  ],
});
const materials = (
  await db.query("select id,confidence from subtopics order by name")
).rows;
const traversal = materials.find((row) => Number(row.confidence) === 4);
const session = {
  id: "33333333-3333-4333-8333-333333333333",
  exam_id: examId,
  material_id: traversal.id,
  material_type: "subtopics",
  confidence: 4,
  studied_on: date,
  elapsed_seconds: 150,
};
await rpc("complete_study_session", session);
await rpc("complete_study_session", session);
assert.equal(
  (await db.query("select count(*)::int as count from study_sessions")).rows[0]
    .count,
  1,
  "retry must be idempotent",
);
assert.equal(
  (await db.query("select confidence_increase from studied_subtopic_entry"))
    .rows[0].confidence_increase,
  "0",
  "unchanged confidence still records a review",
);
await rpc("complete_study_session", {
  ...session,
  id: "44444444-4444-4444-8444-444444444444",
  confidence: 2,
});
assert.equal(
  Number(
    (await db.query("select confidence from topics where name='Graphs'"))
      .rows[0].confidence,
  ),
  4,
);
assert.equal(
  Number(
    (await db.query("select confidence from exams where id=$1", [examId]))
      .rows[0].confidence,
  ),
  3.5,
);
const before = (
  await db.query("select confidence from exams where id=$1", [examId])
).rows[0].confidence;
await assert.rejects(
  rpc("complete_study_session", {
    ...session,
    id: "55555555-5555-4555-8555-555555555555",
    elapsed_seconds: -1,
    confidence: 8,
  }),
);
assert.equal(
  (await db.query("select confidence from exams where id=$1", [examId])).rows[0]
    .confidence,
  before,
  "failed session must roll back all updates",
);
const subject = (
  await db.query("select subject_id from exams where id=$1", [examId])
).rows[0].subject_id;
const existingTopics = (
  await db.query(
    "select id,name,confidence from topics where exam_id=$1 order by name",
    [examId],
  )
).rows;
await rpc("save_study_exam", {
  id: examId,
  subject_id: subject,
  subject_name: "Math",
  name: "Final review",
  exam_date: future,
  confidence_goal: 9,
  topics: existingTopics.map((topic) => ({
    id: topic.id,
    name: topic.name,
    confidence: Number(topic.confidence),
    subtopics: [],
  })),
});
assert.equal(
  (await db.query("select name from exams where id=$1", [examId])).rows[0].name,
  "Final review",
);
assert.equal(
  (await db.query("select count(*)::int as count from subtopics")).rows[0]
    .count,
  2,
  "editing retains existing subtopics and histories",
);
const counting = existingTopics.find((topic) => topic.name === "Counting");
await rpc("complete_study_session", {
  ...session,
  id: "77777777-7777-4777-8777-777777777777",
  material_id: counting.id,
  material_type: "topics",
  confidence: 5,
});
assert.equal(
  Number(
    (await db.query("select confidence from exams where id=$1", [examId]))
      .rows[0].confidence,
  ),
  4.5,
  "leaf topics also update exam aggregates",
);
await asUser(other);
await assert.rejects(
  rpc("complete_study_session", {
    ...session,
    id: "66666666-6666-4666-8666-666666666666",
  }),
);
await assert.rejects(
  rpc("save_study_exam", {
    id: examId,
    subject_name: "Math",
    name: "Hijack",
    exam_date: future,
    confidence_goal: 9,
    topics: [{ name: "A", confidence: 3, subtopics: [] }],
  }),
);
await db.exec("set role authenticated");
assert.equal(
  (await db.query("select count(*)::int as count from study_sessions")).rows[0]
    .count,
  0,
  "another user cannot read sessions",
);
await db.exec("reset role");
await asUser("");
await assert.rejects(rpc("complete_study_session", session));
console.log(
  "Database checks passed: migration, creation, aggregates, unchanged/lower confidence, retry, rollback, ownership, RLS and authentication.",
);
await db.close();
