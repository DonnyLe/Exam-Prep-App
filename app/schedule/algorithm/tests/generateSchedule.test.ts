import {
  createFunction,
  daysBetween,
  generateFullSchedule,
  refreshPriorities,
  calculateConfidenceIncrease,
  updateExamData,
} from "../generateSchedule";
import type {
  ExamData,
  ConfidenceUpdates,
  StudyMaterial,
} from "@/lib/algorithm-types";
import { interleave, scheduleItems } from "@/lib/study";
function fixture(): ExamData {
  return {
    id: "exam",
    user_id: "user",
    subject_id: "subject",
    subjects: { id: "subject", subject_name: "Math", user_id: "user" },
    name: "Midterm",
    created_at: "2026-10-01",
    exam_date: "2026-10-23",
    last_studied: "2026-10-06",
    confidence: 4,
    confidence_goal: 9,
    priority: 0,
    topics: [
      {
        id: "topic",
        exam_id: "exam",
        name: "Graphs",
        order: 0,
        last_studied: "2026-10-06",
        confidence: 4,
        priority: 0,
        subtopics: [
          {
            id: "a",
            topic_id: "topic",
            name: "Traversal",
            order: 0,
            last_studied: "2026-10-06",
            confidence: 4,
            priority: 0,
          },
          {
            id: "b",
            topic_id: "topic",
            name: "Trees",
            order: 1,
            last_studied: "2026-10-06",
            confidence: 4,
            priority: 0,
          },
        ],
      },
      {
        id: "other",
        exam_id: "exam",
        name: "Counting",
        order: 1,
        last_studied: "2026-10-06",
        confidence: 4,
        priority: 0,
        subtopics: [],
      },
    ],
  };
}
test("power curve passes through current confidence and deadline goal", () => {
  const curve = createFunction(1.7, 8, 4, 22, 9, "exam");
  expect(curve.fnc(8)).toBeCloseTo(4);
  expect(curve.fnc(22)).toBeCloseTo(9);
  expect(calculateConfidenceIncrease(4)).toBe(3);
});
test("zero-length trajectory stays finite", () => {
  expect(createFunction(1.7, 0, 4, 0, 9, "exam").fnc(0)).toBe(4);
});
test("calendar differences ignore timestamp offsets and remain signed", () => {
  expect(daysBetween("2026-10-09T23:30:00Z", "2026-10-10")).toBe(1);
  expect(daysBetween("2026-10-10", "2026-10-09")).toBe(-1);
});
test("all topics gain priority as time passes, including confidence zero", () => {
  const exam = fixture();
  exam.topics[1].confidence = 0;
  refreshPriorities(exam, "2026-10-09");
  const first = exam.topics.map((topic) => topic.priority!);
  refreshPriorities(exam, "2026-10-10");
  exam.topics.forEach((topic, index) =>
    expect(topic.priority!).toBeGreaterThan(first[index]),
  );
  expect(Number.isFinite(exam.topics[1].priority)).toBe(true);
});
test("allocation preserves child averages, doesn't exceed curve budget, and bounds scores", async () => {
  const exam = fixture();
  const schedule = await generateFullSchedule([exam], "2026-10-09");
  const day = schedule.get("2026-10-09")![0];
  const target = createFunction(1.7, 8, 4, 22, 9, "exam");
  expect(day.confidenceIncrease).toBeCloseTo(target.fnc(9) - target.fnc(8));
  const children = Array.from(day.childrenConfidenceUpdates!.values());
  expect(
    children.reduce((sum, c) => sum + c.confidenceIncrease, 0) / 2,
  ).toBeCloseTo(day.confidenceIncrease);
  for (const goals of Array.from(schedule.values()))
    for (const goal of goals) {
      expect(goal.studyMaterial.confidence).toBeLessThanOrEqual(10);
      expect(goal.confidenceIncrease).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(goal.confidenceIncrease)).toBe(true);
    }
});
test("projections don't mutate inputs or earlier snapshots", async () => {
  const exam = fixture();
  const original = structuredClone(exam);
  const schedule = await generateFullSchedule([exam], "2026-10-09");
  expect(exam).toEqual(original);
  const first = schedule.get("2026-10-09")![0];
  const last = schedule.get("2026-10-22")![0];
  expect(first.studyMaterial.confidence).toBe(4);
  expect(last.studyMaterial.confidence).toBeGreaterThan(
    first.studyMaterial.confidence!,
  );
  expect(first.studyMaterial).not.toBe(last.studyMaterial);
});
test("empty, expired and same-day exams have no future study work", async () => {
  expect((await generateFullSchedule([], "2026-10-09")).size).toBe(0);
  const exam = fixture();
  exam.exam_date = "2026-10-09";
  expect((await generateFullSchedule([exam], "2026-10-09")).size).toBe(0);
  exam.exam_date = "2026-10-08";
  expect((await generateFullSchedule([exam], "2026-10-09")).size).toBe(0);
});
test("achieved goals produce no recommendations", async () => {
  const exam = fixture();
  exam.confidence_goal = 4;
  const schedule = await generateFullSchedule([exam], "2026-10-09");
  expect(
    Array.from(schedule.values()).every((goals) => goals.length === 0),
  ).toBe(true);
});
test("parallel calculations don't leak dates or data", async () => {
  const exam = fixture();
  const [a, b] = await Promise.all([
    generateFullSchedule([exam], "2026-10-09"),
    generateFullSchedule([exam], "2026-10-12"),
  ]);
  expect(a.has("2026-10-09")).toBe(true);
  expect(b.has("2026-10-09")).toBe(false);
});
test("nested persistence awaits leaves and saves parent aggregates", async () => {
  const exam = fixture();
  exam.topics[0].last_studied = "2026-10-01";
  exam.topics[0].subtopics.forEach(
    (child) => (child.last_studied = "2026-10-01"),
  );
  const schedule = await generateFullSchedule([exam], "2026-10-09");
  const saved: StudyMaterial[] = [];
  await updateExamData(exam, "2026-10-09", schedule.get("2026-10-09")![0], {
    updateMainTables: async (material) => {
      await Promise.resolve();
      saved.push(structuredClone(material));
    },
    insertEntryTables: async () => "entry",
  });
  expect(saved.at(-1)?.id).toBe("exam");
  expect(saved.find((material) => material.id === "topic")).toBeDefined();
});
test("interleaving alternates topics without changing selected items or gains", async () => {
  const exam = fixture();
  const items = scheduleItems(
    await generateFullSchedule([exam], "2026-10-09"),
    [exam],
  )["2026-10-09"];
  const base = items[0];
  const input = [
    { ...base, id: "1", topicId: "a" },
    { ...base, id: "2", topicId: "a" },
    { ...base, id: "3", topicId: "b" },
  ];
  const mixed = interleave(input);
  expect(mixed.map((item) => item.id)).toEqual(["1", "3", "2"]);
  expect(mixed.map((item) => item.id).sort()).toEqual(
    input.map((item) => item.id).sort(),
  );
  expect(mixed.reduce((sum, item) => sum + item.projectedGain, 0)).toBe(
    input.reduce((sum, item) => sum + item.projectedGain, 0),
  );
});

test("completed material is excluded from today's projected work, but stays eligible on future days", async () => {
  const exam = fixture();
  const day = await generateFullSchedule([exam], "2026-10-09");
  const items = scheduleItems(day, [exam])["2026-10-09"];
  const completed = items.map((item) => item.id);
  const updated = scheduleItems(
    await generateFullSchedule([exam], "2026-10-09", completed),
    [exam],
  );
  expect(
    updated["2026-10-09"].every((item) => !completed.includes(item.id)),
  ).toBe(true);
  expect(
    Object.entries(updated).some(
      ([date, items]) =>
        date > "2026-10-09" &&
        items.some((item) => completed.includes(item.id)),
    ),
  ).toBe(true);
});
